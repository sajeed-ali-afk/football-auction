const jwt = require('jsonwebtoken');
const Room = require('../models/Room');
const User = require('../models/User');

const auctionTimers = new Map();
const auctionState = new Map();
const skipVotes = new Map(); // roomId -> Set of userIds who voted to skip

const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET || 'secret');
  } catch {
    return null;
  }
};

const clearAuctionTimer = (roomId) => {
  if (auctionTimers.has(roomId)) {
    clearInterval(auctionTimers.get(roomId));
    auctionTimers.delete(roomId);
  }
};

const getCurrentState = (roomId) => {
  return auctionState.get(roomId) || { timeLeft: 0, currentBid: 0, currentBidder: null, currentBidderUsername: null };
};

const startBidTimer = async (io, roomId, timerDuration) => {
  clearAuctionTimer(roomId);
  const state = auctionState.get(roomId) || {};
  state.timeLeft = timerDuration;
  auctionState.set(roomId, state);

  const interval = setInterval(async () => {
    const s = auctionState.get(roomId);
    if (!s) { clearInterval(interval); return; }
    s.timeLeft -= 1;
    auctionState.set(roomId, s);
    io.to(roomId).emit('timer_tick', { timeLeft: s.timeLeft });
    if (s.timeLeft <= 0) {
      clearInterval(interval);
      auctionTimers.delete(roomId);
      await finalizeCurrentPlayer(io, roomId);
    }
  }, 1000);

  auctionTimers.set(roomId, interval);
};

const finalizeCurrentPlayer = async (io, roomId) => {
  try {
    const room = await Room.findById(roomId).populate('players.player');
    if (!room || room.status !== 'active') return;

    const currentIdx = room.currentPlayerIndex;
    const currentAuctionPlayer = room.players[currentIdx];
    if (!currentAuctionPlayer || currentAuctionPlayer.status !== 'active') return;

    const state = auctionState.get(roomId);
    const hasBid = state?.currentBidder && state?.currentBid > 0;

    skipVotes.set(roomId, new Set());

    if (hasBid) {
      currentAuctionPlayer.status = 'sold';
      currentAuctionPlayer.soldTo = state.currentBidder;
      currentAuctionPlayer.soldToUsername = state.currentBidderUsername;
      currentAuctionPlayer.finalPrice = state.currentBid;

      const team = room.teams.find(t => t.user.toString() === state.currentBidder.toString());
      if (team) {
        team.remainingBudget = Math.round((team.remainingBudget - state.currentBid) * 10) / 10;
        team.squad.push({ player: currentAuctionPlayer.player._id, pricePaid: state.currentBid });
      }

      io.to(roomId).emit('player_sold', {
        player: currentAuctionPlayer.player,
        soldTo: state.currentBidderUsername,
        price: state.currentBid,
        teams: room.teams,
      });
    } else {
      currentAuctionPlayer.status = 'unsold';
      io.to(roomId).emit('player_unsold', { player: currentAuctionPlayer.player });
    }

    await room.save();
    setTimeout(() => advanceToNextPlayer(io, roomId), 2500);
  } catch (err) {
    console.error('finalizeCurrentPlayer error:', err);
  }
};

const advanceToNextPlayer = async (io, roomId) => {
  try {
    const room = await Room.findById(roomId).populate('players.player');
    if (!room) return;

    let nextIdx = room.currentPlayerIndex + 1;
    while (nextIdx < room.players.length && room.players[nextIdx].status !== 'pending') {
      nextIdx++;
    }

    if (nextIdx >= room.players.length) {
      room.status = 'completed';
      room.completedAt = new Date();
      await room.save();
      auctionState.delete(roomId);
      skipVotes.delete(roomId);
      io.to(roomId).emit('auction_completed', { teams: room.teams });
      return;
    }

    room.currentPlayerIndex = nextIdx;
    room.players[nextIdx].status = 'active';
    await room.save();

    skipVotes.set(roomId, new Set());

    const currentPlayer = room.players[nextIdx].player;
    const newState = {
      timeLeft: room.settings.bidTimer,
      currentBid: currentPlayer.basePrice,
      currentBidder: null,
      currentBidderUsername: null,
    };
    auctionState.set(roomId, newState);

    io.to(roomId).emit('next_player', {
      player: currentPlayer,
      playerIndex: nextIdx,
      totalPlayers: room.players.length,
      basePrice: currentPlayer.basePrice,
      timeLeft: room.settings.bidTimer,
      skipVotes: 0,
      totalTeams: room.teams.length,
    });

    startBidTimer(io, roomId, room.settings.bidTimer);
  } catch (err) {
    console.error('advanceToNextPlayer error:', err);
  }
};

const initializeSocket = (io) => {
  io.use(async (socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error('Authentication required'));
    const decoded = verifyToken(token);
    if (!decoded) return next(new Error('Invalid token'));
    const user = await User.findById(decoded.userId);
    if (!user) return next(new Error('User not found'));
    socket.user = user;
    next();
  });

  io.on('connection', (socket) => {
    console.log(`🔌 Socket connected: ${socket.user.username} (${socket.id})`);

    socket.on('join_room', async ({ roomId }) => {
      try {
        const room = await Room.findById(roomId).populate('players.player');
        if (!room) return socket.emit('error', { message: 'Room not found' });
        socket.join(roomId);
        socket.currentRoomId = roomId;
        const state = getCurrentState(roomId);
        const votes = skipVotes.get(roomId) || new Set();
        socket.emit('room_joined', {
          room,
          auctionState: state,
          skipVotes: votes.size,
          totalTeams: room.teams.length,
        });
        io.to(roomId).emit('user_joined', { username: socket.user.username, teams: room.teams });
      } catch (err) {
        socket.emit('error', { message: err.message });
      }
    });

    socket.on('player_ready', async ({ roomId }) => {
      try {
        const room = await Room.findById(roomId);
        if (!room) return;
        const team = room.teams.find(t => t.user.toString() === socket.user._id.toString());
        if (team) {
          team.isReady = !team.isReady;
          await room.save();
          io.to(roomId).emit('ready_update', { teams: room.teams });
        }
      } catch (err) {
        socket.emit('error', { message: err.message });
      }
    });

    socket.on('start_auction', async ({ roomId }) => {
      try {
        const room = await Room.findById(roomId).populate('players.player');
        if (!room) return;
        if (room.host.toString() !== socket.user._id.toString())
          return socket.emit('error', { message: 'Only the host can start the auction' });
        if (room.teams.length < 2)
          return socket.emit('error', { message: 'Need at least 2 teams to start' });

        room.status = 'active';
        room.players[0].status = 'active';
        await room.save();

        skipVotes.set(roomId, new Set());

        const firstPlayer = room.players[0].player;
        const initialState = {
          timeLeft: room.settings.bidTimer,
          currentBid: firstPlayer.basePrice,
          currentBidder: null,
          currentBidderUsername: null,
        };
        auctionState.set(roomId, initialState);

        io.to(roomId).emit('auction_started', {
          player: firstPlayer,
          playerIndex: 0,
          totalPlayers: room.players.length,
          basePrice: firstPlayer.basePrice,
          timeLeft: room.settings.bidTimer,
          skipVotes: 0,
          totalTeams: room.teams.length,
        });

        startBidTimer(io, roomId, room.settings.bidTimer);
      } catch (err) {
        socket.emit('error', { message: err.message });
      }
    });

    socket.on('place_bid', async ({ roomId, amount }) => {
      try {
        const room = await Room.findById(roomId).populate('players.player');
        if (!room || room.status !== 'active') return;

        const state = auctionState.get(roomId);
        if (!state) return;

        const team = room.teams.find(t => t.user.toString() === socket.user._id.toString());
        if (!team) return socket.emit('error', { message: 'You are not in this room' });

        const minBid = state.currentBid + (state.currentBidder ? room.settings.minBidIncrement : 0);
        if (amount < minBid)
          return socket.emit('bid_rejected', { message: `Minimum bid is £${minBid}M` });
        if (amount > team.remainingBudget)
          return socket.emit('bid_rejected', { message: 'Insufficient budget' });
        if (state.currentBidder?.toString() === socket.user._id.toString())
          return socket.emit('bid_rejected', { message: 'You are already the highest bidder' });

        const currentPlayer = room.players[room.currentPlayerIndex].player;
        const positionCount = team.squad.filter(sq => {
          const p = room.players.find(rp => rp.player._id.toString() === sq.player.toString());
          return p?.player?.position === currentPlayer.position;
        }).length;

        const maxByPosition = { GK: 1, DEF: 5, MID: 5, FWD: 3 };
        if (positionCount >= maxByPosition[currentPlayer.position])
          return socket.emit('bid_rejected', { message: `Squad limit reached for ${currentPlayer.position}` });
        if (team.squad.length >= room.settings.squadSize)
          return socket.emit('bid_rejected', { message: 'Squad is full' });

        // Reset skip votes when bid placed
        skipVotes.set(roomId, new Set());

        state.currentBid = amount;
        state.currentBidder = socket.user._id;
        state.currentBidderUsername = socket.user.username;
        auctionState.set(roomId, state);

        startBidTimer(io, roomId, room.settings.bidTimer);

        const currentAP = room.players[room.currentPlayerIndex];
        currentAP.bids.push({ user: socket.user._id, username: socket.user.username, amount });
        await room.save();

        io.to(roomId).emit('bid_placed', {
          amount,
          bidder: socket.user.username,
          bidderId: socket.user._id,
          timeLeft: room.settings.bidTimer,
          skipVotes: 0,
          totalTeams: room.teams.length,
        });
      } catch (err) {
        socket.emit('error', { message: err.message });
      }
    });

    // ✅ Vote to skip - any player, skip triggers when ALL vote
    socket.on('vote_skip', async ({ roomId }) => {
      try {
        const room = await Room.findById(roomId);
        if (!room || room.status !== 'active') return;

        const isInRoom = room.teams.some(t => t.user.toString() === socket.user._id.toString());
        if (!isInRoom) return;

        if (!skipVotes.has(roomId)) skipVotes.set(roomId, new Set());
        const votes = skipVotes.get(roomId);

        if (votes.has(socket.user._id.toString())) {
          votes.delete(socket.user._id.toString());
        } else {
          votes.add(socket.user._id.toString());
        }

        const totalTeams = room.teams.length;
        const voteCount = votes.size;

        io.to(roomId).emit('skip_vote_update', {
          skipVotes: voteCount,
          totalTeams,
          voters: Array.from(votes),
        });

        if (voteCount >= totalTeams) {
          skipVotes.set(roomId, new Set());
          clearAuctionTimer(roomId);
          const currentAP = room.players[room.currentPlayerIndex];
          if (currentAP) currentAP.status = 'unsold';
          await room.save();
          io.to(roomId).emit('player_skipped', {});
          setTimeout(() => advanceToNextPlayer(io, roomId), 1500);
        }
      } catch (err) {
        socket.emit('error', { message: err.message });
      }
    });

    // Host instant skip
    socket.on('skip_player', async ({ roomId }) => {
      try {
        const room = await Room.findById(roomId);
        if (!room || room.host.toString() !== socket.user._id.toString()) return;
        clearAuctionTimer(roomId);
        skipVotes.set(roomId, new Set());
        const currentAP = room.players[room.currentPlayerIndex];
        if (currentAP) currentAP.status = 'unsold';
        await room.save();
        io.to(roomId).emit('player_skipped', {});
        setTimeout(() => advanceToNextPlayer(io, roomId), 1500);
      } catch (err) {
        socket.emit('error', { message: err.message });
      }
    });

    socket.on('pause_auction', async ({ roomId }) => {
      try {
        const room = await Room.findById(roomId);
        if (!room || room.host.toString() !== socket.user._id.toString()) return;
        if (room.status === 'active') {
          clearAuctionTimer(roomId);
          room.status = 'paused';
          await room.save();
          io.to(roomId).emit('auction_paused', {});
        } else if (room.status === 'paused') {
          room.status = 'active';
          await room.save();
          const state = getCurrentState(roomId);
          io.to(roomId).emit('auction_resumed', { timeLeft: state.timeLeft });
          startBidTimer(io, roomId, state.timeLeft);
        }
      } catch (err) {
        socket.emit('error', { message: err.message });
      }
    });

    socket.on('chat_message', async ({ roomId, message }) => {
      try {
        if (!message?.trim() || message.length > 200) return;
        const room = await Room.findById(roomId);
        if (!room) return;
        const chatMsg = {
          user: socket.user._id,
          username: socket.user.username,
          message: message.trim(),
          timestamp: new Date(),
        };
        room.chat.push(chatMsg);
        if (room.chat.length > 100) room.chat = room.chat.slice(-100);
        await room.save();
        io.to(roomId).emit('chat_message', chatMsg);
      } catch (err) {
        socket.emit('error', { message: err.message });
      }
    });

    socket.on('delete_room', async ({ roomId }) => {
      try {
        clearAuctionTimer(roomId);
        auctionState.delete(roomId);
        skipVotes.delete(roomId);
        io.to(roomId).emit('room_deleted', {});
      } catch (err) {
        console.error('delete_room error:', err);
      }
    });

    socket.on('leave_room', ({ roomId }) => {
      socket.leave(roomId);
      io.to(roomId).emit('user_left', { username: socket.user.username });
    });

    socket.on('disconnect', () => {
      console.log(`🔌 Socket disconnected: ${socket.user.username}`);
      if (socket.currentRoomId)
        io.to(socket.currentRoomId).emit('user_left', { username: socket.user.username });
    });
  });
};

module.exports = { initializeSocket };