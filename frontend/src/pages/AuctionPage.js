import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import api from '../utils/api';
import { formatBudget, getPositionAccent, getPositionColor } from '../utils/helpers';
import { sounds } from '../utils/sounds';
import AuctionTimer from '../components/auction/AuctionTimer';
import BidPanel from '../components/auction/BidPanel';
import BidHistory from '../components/auction/BidHistory';
import TeamsSidebar from '../components/auction/TeamsSidebar';
import ChatPanel from '../components/auction/ChatPanel';
import AuctionStatusOverlay from '../components/auction/AuctionStatusOverlay';

const POSITION_EMOJI = { GK: '🧤', DEF: '🛡️', MID: '⚡', FWD: '🔥' };

export default function AuctionPage() {
  const { roomId } = useParams();
  const { user } = useAuth();
  const { socket } = useSocket();
  const navigate = useNavigate();

  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentPlayer, setCurrentPlayer] = useState(null);
  const [currentBid, setCurrentBid] = useState(0);
  const [currentBidder, setCurrentBidder] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [bids, setBids] = useState([]);
  const [overlayStatus, setOverlayStatus] = useState(null);
  const [overlayData, setOverlayData] = useState({});
  const [isPaused, setIsPaused] = useState(false);
  const [playerIndex, setPlayerIndex] = useState(0);
  const [totalPlayers, setTotalPlayers] = useState(0);
  const [bidError, setBidError] = useState('');
  const [chat, setChat] = useState([]);
  const [showSquad, setShowSquad] = useState(false);
  const timerRef = useRef(null);

  const fetchRoom = useCallback(async () => {
    try {
      const res = await api.get(`/rooms/${roomId}`);
      const r = res.data.room;
      setRoom(r);
      if (r.status === 'completed') navigate(`/room/${roomId}/results`);
      if (r.status === 'lobby') navigate(`/room/${roomId}/lobby`);
      setChat(r.chat || []);

      // Restore current player
      const ap = r.players?.[r.currentPlayerIndex];
      if (ap?.player) {
        setCurrentPlayer(ap.player);
        setPlayerIndex(r.currentPlayerIndex);
        setTotalPlayers(r.players.length);
        setBids(ap.bids || []);
        const lastBid = ap.bids?.[ap.bids.length - 1];
        if (lastBid) {
          setCurrentBid(lastBid.amount);
          setCurrentBidder(lastBid.username);
        } else {
          setCurrentBid(ap.player.basePrice);
          setCurrentBidder(null);
        }
      }
      setIsPaused(r.status === 'paused');
    } catch {
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  }, [roomId, navigate]);

  useEffect(() => {
    fetchRoom();
  }, [fetchRoom]);

  useEffect(() => {
    if (!socket) return;

    socket.emit('join_room', { roomId });

    socket.on('room_joined', ({ room: r, auctionState }) => {
      setRoom(r);
      if (auctionState?.timeLeft) setTimeLeft(auctionState.timeLeft);
      if (auctionState?.currentBid) setCurrentBid(auctionState.currentBid);
      if (auctionState?.currentBidderUsername) setCurrentBidder(auctionState.currentBidderUsername);
    });

    socket.on('auction_started', ({ player, playerIndex: idx, totalPlayers: total, basePrice, timeLeft: tl }) => {
      setCurrentPlayer(player);
      setCurrentBid(basePrice);
      setCurrentBidder(null);
      setTimeLeft(tl);
      setPlayerIndex(idx);
      setTotalPlayers(total);
      setBids([]);
      setIsPaused(false);
    });

    socket.on('next_player', ({ player, playerIndex: idx, totalPlayers: total, basePrice, timeLeft: tl }) => {
      setCurrentPlayer(player);
      setCurrentBid(basePrice);
      setCurrentBidder(null);
      setTimeLeft(tl);
      setPlayerIndex(idx);
      setTotalPlayers(total);
      setBids([]);
    });

    socket.on('timer_tick', ({ timeLeft: tl }) => {
      setTimeLeft(tl);
      if (tl <= 5 && tl > 0) sounds.timerTick();
    });

    socket.on('bid_placed', ({ amount, bidder, timeLeft: tl }) => {
      setCurrentBid(amount);
      setCurrentBidder(bidder);
      if (tl) setTimeLeft(tl);
      setBids(prev => [...prev, { username: bidder, amount }]);
      sounds.bid();
    });

    socket.on('bid_rejected', ({ message }) => {
      setBidError(message);
      sounds.bidRejected();
      setTimeout(() => setBidError(''), 3000);
    });

    socket.on('going_once', () => {
      setOverlayStatus('going_once');
      setOverlayData({});
      sounds.goingOnce();
    });

    socket.on('going_twice', () => {
      setOverlayStatus('going_twice');
      setOverlayData({});
      sounds.goingTwice();
    });

    socket.on('player_sold', ({ player, soldTo, price, teams }) => {
      setOverlayStatus('sold');
      setOverlayData({ playerName: player.name, soldTo, price });
      setRoom(r => r ? { ...r, teams } : r);
      sounds.sold();
    });

    socket.on('player_unsold', ({ player }) => {
      setOverlayStatus('unsold');
      setOverlayData({ playerName: player.name });
      sounds.unsold();
    });

    socket.on('player_skipped', () => {
      setOverlayStatus('unsold');
      setOverlayData({ playerName: currentPlayer?.name });
    });

    socket.on('auction_paused', () => {
      setIsPaused(true);
    });

    socket.on('auction_resumed', ({ timeLeft: tl }) => {
      setIsPaused(false);
      if (tl) setTimeLeft(tl);
    });

    socket.on('auction_completed', ({ teams }) => {
      setRoom(r => r ? { ...r, teams, status: 'completed' } : r);
      setTimeout(() => navigate(`/room/${roomId}/results`), 2000);
    });

    socket.on('chat_message', (msg) => {
      setChat(prev => [...prev, msg]);
    });

    socket.on('user_joined', ({ teams }) => {
      setRoom(r => r ? { ...r, teams } : r);
    });

    return () => {
      ['room_joined','auction_started','next_player','timer_tick','bid_placed','bid_rejected',
       'going_once','going_twice','player_sold','player_unsold','player_skipped',
       'auction_paused','auction_resumed','auction_completed','chat_message','user_joined'].forEach(e => socket.off(e));
    };
  }, [socket, roomId, navigate, currentPlayer]);

  const handleBid = (amount) => {
    socket?.emit('place_bid', { roomId, amount });
  };

  const handleSkip = () => socket?.emit('skip_player', { roomId });
  const handlePause = () => socket?.emit('pause_auction', { roomId });
  const handleChat = (msg) => socket?.emit('chat_message', { roomId, message: msg });

  const isHost = room?.hostUsername === user?.username;
  const myTeam = room?.teams?.find(t => t.username === user?.username);
  const accent = currentPlayer ? getPositionAccent(currentPlayer.position) : '#00ff87';
  const isActive = room?.status === 'active';

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4 animate-bounce">⚽</div>
          <div className="font-display text-2xl text-neon-green animate-pulse">LOADING AUCTION...</div>
        </div>
      </div>
    );
  }

  if (!room) return null;

  return (
    <div className="min-h-screen relative" style={{ background: '#060612' }}>
      <AuctionStatusOverlay
        status={overlayStatus}
        playerName={overlayData.playerName}
        soldTo={overlayData.soldTo}
        price={overlayData.price}
      />

      {/* Top bar */}
      <div className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 md:px-6 py-3"
        style={{ background: 'rgba(6,6,18,0.95)', borderBottom: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(8px)' }}>
        <div className="flex items-center gap-4">
          <div className="font-display text-lg tracking-widest" style={{ color: '#00ff87' }}>⚽ FA</div>
          <div className="hidden md:block">
            <p className="text-white font-semibold text-sm">{room.name}</p>
            <p className="text-xs text-gray-500">Player {playerIndex + 1} of {totalPlayers}</p>
          </div>
          <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
            isPaused ? 'text-neon-yellow' : isActive ? 'text-neon-green' : 'text-gray-500'
          }`} style={{ background: isPaused ? 'rgba(255,215,0,0.1)' : isActive ? 'rgba(0,255,135,0.1)' : 'rgba(255,255,255,0.05)' }}>
            <span className={`w-1.5 h-1.5 rounded-full ${isPaused ? 'bg-neon-yellow animate-pulse' : isActive ? 'bg-neon-green animate-pulse' : 'bg-gray-600'}`} />
            {isPaused ? 'PAUSED' : isActive ? 'LIVE' : 'ENDED'}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* My budget */}
          <div className="hidden md:flex flex-col items-end">
            <span className="text-xs text-gray-500">Your Budget</span>
            <span className="font-mono font-bold text-sm"
              style={{ color: (myTeam?.remainingBudget || 0) < 10 ? '#ff3d3d' : '#00ff87' }}>
              £{formatBudget(myTeam?.remainingBudget)}
            </span>
          </div>

          {/* Squad toggle */}
          <button onClick={() => setShowSquad(s => !s)}
            className="px-3 py-2 rounded-xl text-xs font-semibold transition-all"
            style={{ background: showSquad ? 'rgba(0,255,135,0.15)' : 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: showSquad ? '#00ff87' : '#9ca3af' }}>
            👥 Squad ({myTeam?.squad?.length || 0})
          </button>

          {/* Host controls */}
          {isHost && (
            <div className="flex items-center gap-2">
              <button onClick={handlePause}
                className="px-3 py-2 rounded-xl text-xs font-semibold transition-all"
                style={{ background: 'rgba(255,215,0,0.1)', border: '1px solid rgba(255,215,0,0.3)', color: '#ffd700' }}>
                {isPaused ? '▶ Resume' : '⏸ Pause'}
              </button>
              <button onClick={handleSkip}
                className="px-3 py-2 rounded-xl text-xs font-semibold transition-all"
                style={{ background: 'rgba(255,61,61,0.1)', border: '1px solid rgba(255,61,61,0.3)', color: '#ff3d3d' }}>
                ⏭ Skip
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="fixed top-[57px] left-0 right-0 z-40 h-0.5"
        style={{ background: 'rgba(255,255,255,0.04)' }}>
        <div className="h-full transition-all duration-500"
          style={{
            width: totalPlayers ? `${(playerIndex / totalPlayers) * 100}%` : '0%',
            background: 'linear-gradient(90deg, #00ff87, #00d4ff)',
          }} />
      </div>

      {/* Main content */}
      <div className="pt-16 grid grid-cols-1 lg:grid-cols-[1fr_320px] xl:grid-cols-[1fr_360px] min-h-screen">
        {/* Left: Auction floor */}
        <div className="p-4 md:p-6 space-y-4">
          {currentPlayer ? (
            <>
              {/* Current Player Hero */}
              <div className="rounded-2xl overflow-hidden relative"
                style={{
                  background: `linear-gradient(135deg, #0d0d2b, #111133)`,
                  border: `1px solid ${accent}30`,
                  boxShadow: `0 0 40px ${accent}10`,
                }}>
                {/* Accent stripe */}
                <div className="h-1" style={{ background: `linear-gradient(90deg, ${accent}, transparent)` }} />

                <div className="p-6">
                  <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
                    {/* Player avatar + info */}
                    <div className="flex items-center gap-5 flex-1">
                      <div className="relative">
                        <div className="w-24 h-24 rounded-2xl flex items-center justify-center text-5xl"
                          style={{
                            background: `linear-gradient(135deg, ${accent}20, ${accent}08)`,
                            border: `2px solid ${accent}40`,
                            boxShadow: `0 0 30px ${accent}30`,
                          }}>
                          {POSITION_EMOJI[currentPlayer.position]}
                        </div>
                        <span className={`absolute -top-2 -right-2 text-xs font-bold px-2 py-0.5 rounded-full ${getPositionColor(currentPlayer.position)}`}>
                          {currentPlayer.position}
                        </span>
                      </div>

                      <div>
                        <h2 className="font-display text-3xl md:text-4xl tracking-wider text-white leading-tight">
                          {currentPlayer.name}
                        </h2>
                        <p className="text-gray-400 mt-1">{currentPlayer.club} • {currentPlayer.nationality}</p>
                        <div className="flex items-center gap-4 mt-2">
                          <span className="font-display text-2xl" style={{ color: accent }}>{currentPlayer.rating}</span>
                          <span className="text-gray-600 text-sm">OVR</span>
                          <span className="text-gray-500 text-sm">Age {currentPlayer.age}</span>
                        </div>
                        {/* Stats row */}
                        <div className="flex gap-4 mt-2">
                          {currentPlayer.position === 'GK' ? (
                            <>
                              <StatChip label="CS" value={currentPlayer.stats?.cleanSheets} />
                              <StatChip label="SVS" value={currentPlayer.stats?.saves} />
                            </>
                          ) : (
                            <>
                              <StatChip label="GOL" value={currentPlayer.stats?.goals} />
                              <StatChip label="AST" value={currentPlayer.stats?.assists} />
                            </>
                          )}
                          <StatChip label="APP" value={currentPlayer.stats?.appearances} />
                        </div>
                      </div>
                    </div>

                    {/* Timer */}
                    <div className="flex flex-col items-center gap-2">
                      <AuctionTimer timeLeft={timeLeft} total={room.settings?.bidTimer || 15} />
                      {isPaused && (
                        <span className="text-xs text-neon-yellow font-semibold animate-pulse">PAUSED</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Bid error */}
              {bidError && (
                <div className="px-4 py-3 rounded-xl text-sm animate-shake"
                  style={{ background: 'rgba(255,61,61,0.1)', border: '1px solid rgba(255,61,61,0.3)', color: '#ff3d3d' }}>
                  ⚠️ {bidError}
                </div>
              )}

              {/* Bid panel */}
              <BidPanel
                currentBid={currentBid}
                myBudget={myTeam?.remainingBudget || 0}
                onBid={handleBid}
                disabled={!isActive || isPaused}
                currentBidder={currentBidder}
                myUsername={user?.username}
                minIncrement={room.settings?.minBidIncrement}
              />

              {/* Bid History */}
              <BidHistory bids={bids} />

              {/* Chat */}
              <ChatPanel messages={chat} onSend={handleChat} myUsername={user?.username} />
            </>
          ) : (
            <div className="flex items-center justify-center h-64">
              <div className="text-center text-gray-600">
                <div className="text-4xl mb-3">⏳</div>
                <p>Waiting for auction to start...</p>
              </div>
            </div>
          )}
        </div>

        {/* Right: Teams sidebar */}
        <div className="hidden lg:block p-4 pt-6 space-y-4 border-l border-white/5">
          <TeamsSidebar
            teams={room.teams || []}
            auctionPlayers={room.players || []}
            myUsername={user?.username}
          />

          {/* My squad drawer */}
          {showSquad && myTeam && (
            <div className="rounded-2xl overflow-hidden"
              style={{ background: '#0d0d2b', border: '1px solid rgba(0,255,135,0.15)' }}>
              <div className="px-4 py-3 border-b border-white/5">
                <h3 className="font-display text-sm tracking-widest text-neon-green">MY SQUAD</h3>
              </div>
              <div className="p-3 space-y-2 max-h-64 overflow-y-auto">
                {myTeam.squad?.length === 0 ? (
                  <p className="text-gray-600 text-xs text-center py-4">No players yet</p>
                ) : (
                  myTeam.squad.map((sq, i) => {
                    const ap = room.players?.find(p =>
                      p.player?._id === sq.player || p.player?._id?.toString() === sq.player?.toString()
                    );
                    const p = ap?.player;
                    if (!p) return null;
                    return (
                      <div key={i} className="flex items-center gap-2 p-2 rounded-lg"
                        style={{ background: 'rgba(255,255,255,0.03)' }}>
                        <span className="text-lg">{POSITION_EMOJI[p.position]}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-white truncate">{p.name}</p>
                          <p className="text-xs text-gray-500">{p.position} • {p.club}</p>
                        </div>
                        <span className="text-xs font-mono text-neon-green font-bold">£{formatBudget(sq.pricePaid)}</span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile squad drawer */}
      {showSquad && (
        <div className="fixed bottom-0 left-0 right-0 z-30 lg:hidden animate-slide-up"
          style={{ background: '#0d0d2b', border: '1px solid rgba(0,255,135,0.2)', maxHeight: '60vh', overflowY: 'auto' }}>
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
            <h3 className="font-display tracking-widest text-neon-green text-sm">MY SQUAD ({myTeam?.squad?.length || 0})</h3>
            <button onClick={() => setShowSquad(false)} className="text-gray-500 hover:text-white text-xl">×</button>
          </div>
          <div className="p-3 space-y-2">
            {myTeam?.squad?.map((sq, i) => {
              const ap = room.players?.find(p =>
                p.player?._id === sq.player || p.player?._id?.toString() === sq.player?.toString()
              );
              const p = ap?.player;
              if (!p) return null;
              return (
                <div key={i} className="flex items-center gap-3 p-2 rounded-lg"
                  style={{ background: 'rgba(255,255,255,0.03)' }}>
                  <span className="text-2xl">{POSITION_EMOJI[p.position]}</span>
                  <div className="flex-1">
                    <p className="text-white font-semibold">{p.name}</p>
                    <p className="text-xs text-gray-500">{p.position} • {p.club}</p>
                  </div>
                  <span className="font-mono text-neon-green font-bold">£{formatBudget(sq.pricePaid)}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

const StatChip = ({ label, value }) => (
  <div className="flex flex-col items-center">
    <span className="font-mono font-bold text-white text-sm">{value}</span>
    <span className="text-gray-600 text-xs">{label}</span>
  </div>
);
