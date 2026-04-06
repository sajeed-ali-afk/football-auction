import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import api from '../utils/api';
import { formatBudget, getPositionAccent, getPositionColor, generateAvatar } from '../utils/helpers';
import { sounds } from '../utils/sounds';
import AuctionTimer from '../components/auction/AuctionTimer';
import BidPanel from '../components/auction/BidPanel';
import BidHistory from '../components/auction/BidHistory';
import ChatPanel from '../components/auction/ChatPanel';
import AuctionStatusOverlay from '../components/auction/AuctionStatusOverlay';

const POSITION_EMOJI = { GK: '🧤', DEF: '🛡️', MID: '⚡', FWD: '🔥' };
const POSITION_ORDER = ['GK', 'DEF', 'MID', 'FWD'];

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
  const [skipVotes, setSkipVotes] = useState(0);
  const [totalTeams, setTotalTeams] = useState(0);
  const [myVoted, setMyVoted] = useState(false);
  const [squadViewTeam, setSquadViewTeam] = useState(null);
  const [showSquadModal, setShowSquadModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [mobileTab, setMobileTab] = useState('bid');

  const fetchRoom = useCallback(async () => {
    try {
      const res = await api.get(`/rooms/${roomId}`);
      const r = res.data.room;
      setRoom(r);
      setTotalTeams(r.teams?.length || 0);
      if (r.status === 'completed') navigate(`/room/${roomId}/results`);
      if (r.status === 'lobby') navigate(`/room/${roomId}/lobby`);
      setChat(r.chat || []);
      const ap = r.players?.[r.currentPlayerIndex];
      if (ap?.player) {
        setCurrentPlayer(ap.player);
        setPlayerIndex(r.currentPlayerIndex);
        setTotalPlayers(r.players.length);
        setBids(ap.bids || []);
        const lastBid = ap.bids?.[ap.bids.length - 1];
        if (lastBid) { setCurrentBid(lastBid.amount); setCurrentBidder(lastBid.username); }
        else { setCurrentBid(ap.player.basePrice); setCurrentBidder(null); }
      }
      setIsPaused(r.status === 'paused');
    } catch { navigate('/dashboard'); }
    finally { setLoading(false); }
  }, [roomId, navigate]);

  useEffect(() => { fetchRoom(); }, [fetchRoom]);

  useEffect(() => {
    if (!socket) return;
    socket.emit('join_room', { roomId });

    socket.on('room_joined', ({ room: r, auctionState, skipVotes: sv, totalTeams: tt }) => {
      setRoom(r); setTotalTeams(tt || r.teams?.length || 0); setSkipVotes(sv || 0);
      if (auctionState?.timeLeft) setTimeLeft(auctionState.timeLeft);
      if (auctionState?.currentBid) setCurrentBid(auctionState.currentBid);
      if (auctionState?.currentBidderUsername) setCurrentBidder(auctionState.currentBidderUsername);
    });

    socket.on('auction_started', ({ player, playerIndex: idx, totalPlayers: total, basePrice, timeLeft: tl, skipVotes: sv, totalTeams: tt }) => {
      setCurrentPlayer(player); setCurrentBid(basePrice); setCurrentBidder(null);
      setTimeLeft(tl); setPlayerIndex(idx); setTotalPlayers(total); setBids([]);
      setIsPaused(false); setSkipVotes(sv || 0); setMyVoted(false); setTotalTeams(tt || 0);
    });

    socket.on('next_player', ({ player, playerIndex: idx, totalPlayers: total, basePrice, timeLeft: tl, skipVotes: sv, totalTeams: tt }) => {
      setCurrentPlayer(player); setCurrentBid(basePrice); setCurrentBidder(null);
      setTimeLeft(tl); setPlayerIndex(idx); setTotalPlayers(total); setBids([]);
      setSkipVotes(sv || 0); setMyVoted(false); setTotalTeams(tt || 0);
    });

    socket.on('timer_tick', ({ timeLeft: tl }) => setTimeLeft(tl));

    socket.on('bid_placed', ({ amount, bidder, timeLeft: tl, skipVotes: sv, totalTeams: tt }) => {
      setCurrentBid(amount); setCurrentBidder(bidder); if (tl) setTimeLeft(tl);
      setBids(prev => [...prev, { username: bidder, amount }]);
      setSkipVotes(sv || 0); setMyVoted(false); if (tt) setTotalTeams(tt);
      sounds.bid();
    });

    socket.on('bid_rejected', ({ message }) => {
      setBidError(message); sounds.bidRejected();
      setTimeout(() => setBidError(''), 3000);
    });

    socket.on('skip_vote_update', ({ skipVotes: sv, totalTeams: tt, voters }) => {
      setSkipVotes(sv); setTotalTeams(tt);
      const myId = user?._id || user?.id;
      setMyVoted(voters?.includes(myId?.toString()));
    });

    socket.on('player_sold', ({ player, soldTo, price, teams }) => {
      setOverlayStatus('sold'); setOverlayData({ playerName: player.name, soldTo, price });
      setRoom(r => r ? { ...r, teams } : r); setSkipVotes(0); setMyVoted(false); sounds.sold();
    });

    socket.on('player_unsold', ({ player }) => {
      setOverlayStatus('unsold'); setOverlayData({ playerName: player.name });
      setSkipVotes(0); setMyVoted(false); sounds.unsold();
    });

    socket.on('player_skipped', () => {
      setOverlayStatus('unsold'); setOverlayData({ playerName: currentPlayer?.name });
      setSkipVotes(0); setMyVoted(false);
    });

    socket.on('auction_paused', () => setIsPaused(true));
    socket.on('auction_resumed', ({ timeLeft: tl }) => { setIsPaused(false); if (tl) setTimeLeft(tl); });
    socket.on('auction_completed', ({ teams }) => {
      setRoom(r => r ? { ...r, teams, status: 'completed' } : r);
      setTimeout(() => navigate(`/room/${roomId}/results`), 2000);
    });
    socket.on('chat_message', (msg) => setChat(prev => [...prev, msg]));
    socket.on('user_joined', ({ teams }) => setRoom(r => r ? { ...r, teams } : r));
    socket.on('room_deleted', () => navigate('/dashboard'));

    return () => {
      ['room_joined','auction_started','next_player','timer_tick','bid_placed','bid_rejected',
       'skip_vote_update','player_sold','player_unsold','player_skipped',
       'auction_paused','auction_resumed','auction_completed','chat_message','user_joined','room_deleted'
      ].forEach(e => socket.off(e));
    };
  }, [socket, roomId, navigate, currentPlayer, user]);

  const handleBid = (amount) => socket?.emit('place_bid', { roomId, amount });
  const handleSkip = () => socket?.emit('skip_player', { roomId });
  const handlePause = () => socket?.emit('pause_auction', { roomId });
  const handleChat = (msg) => socket?.emit('chat_message', { roomId, message: msg });
  const handleVoteSkip = () => { socket?.emit('vote_skip', { roomId }); setMyVoted(v => !v); };

  const handleDeleteRoom = async () => {
    setDeleting(true);
    try {
      await api.delete(`/rooms/${roomId}`);
      socket?.emit('delete_room', { roomId });
      navigate('/dashboard');
    } catch (err) { alert(err.response?.data?.error || 'Failed to delete room'); }
    finally { setDeleting(false); setShowDeleteConfirm(false); }
  };

  const openSquad = (team) => { setSquadViewTeam(team); setShowSquadModal(true); };

  const getPlayerDetails = (sq) => room?.players?.find(p =>
    p.player?._id === sq.player || p.player?._id?.toString() === sq.player?.toString()
  )?.player;

  const isHost = room?.hostUsername === user?.username;
  const myTeam = room?.teams?.find(t => t.username === user?.username);
  const accent = currentPlayer ? getPositionAccent(currentPlayer.position) : '#00ff87';
  const isActive = room?.status === 'active';

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#060612' }}>
      <div className="text-center">
        <div className="text-4xl mb-4 animate-bounce">⚽</div>
        <div className="font-display text-2xl text-neon-green animate-pulse">LOADING AUCTION...</div>
      </div>
    </div>
  );

  if (!room) return null;

  const TeamCard = ({ team, showViewBtn = true }) => {
    const isMe = team.username === user?.username;
    const budgetPct = Math.max(0, (team.remainingBudget / team.budget) * 100);
    const posCount = { GK: 0, DEF: 0, MID: 0, FWD: 0 };
    team.squad?.forEach(sq => {
      const p = getPlayerDetails(sq);
      if (p?.position) posCount[p.position]++;
    });
    return (
      <div className="rounded-xl overflow-hidden"
        style={{ background: isMe ? 'rgba(0,255,135,0.05)' : '#0d0d2b', border: `1px solid ${isMe ? 'rgba(0,255,135,0.15)' : 'rgba(255,255,255,0.06)'}` }}>
        <div className="p-3">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
              style={{ background: generateAvatar(team.username), color: '#060612' }}>
              {team.username?.[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-sm font-semibold text-white truncate block">
                {team.username}{isMe && <span className="text-neon-green ml-1 text-xs">(you)</span>}
              </span>
            </div>
            <span className="font-mono text-sm font-bold"
              style={{ color: budgetPct < 20 ? '#ff3d3d' : budgetPct < 50 ? '#ffd700' : '#00ff87' }}>
              £{formatBudget(team.remainingBudget)}
            </span>
          </div>
          <div className="h-1 rounded-full bg-white/5 mb-2 overflow-hidden">
            <div className="h-full rounded-full transition-all duration-500"
              style={{ width: `${budgetPct}%`, background: budgetPct < 20 ? '#ff3d3d' : 'linear-gradient(90deg,#00ff87,#00d4ff)' }} />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              {Object.entries(posCount).map(([pos, cnt]) => (
                <span key={pos} className="text-xs text-gray-500">{pos[0]}{cnt}</span>
              ))}
            </div>
            {showViewBtn && (
              <button onClick={() => openSquad(team)}
                className="text-xs px-2 py-1 rounded-lg"
                style={{ background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.2)', color: '#00d4ff' }}>
                👥 {team.squad?.length || 0}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  const SquadModal = () => {
    if (!squadViewTeam || !showSquadModal) return null;
    const grouped = { GK: [], DEF: [], MID: [], FWD: [] };
    squadViewTeam.squad?.forEach(sq => {
      const p = getPlayerDetails(sq);
      if (p) grouped[p.position]?.push({ ...sq, playerData: p });
    });
    return (
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
        style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(4px)' }}
        onClick={() => setShowSquadModal(false)}>
        <div className="w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl overflow-hidden"
          style={{ background: '#0d0d2b', border: '1px solid rgba(0,255,135,0.2)', maxHeight: '88vh' }}
          onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10"
            style={{ background: 'rgba(0,255,135,0.05)' }}>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm"
                style={{ background: generateAvatar(squadViewTeam.username), color: '#060612' }}>
                {squadViewTeam.username?.[0]?.toUpperCase()}
              </div>
              <div>
                <div className="font-display text-sm tracking-wider text-white">{squadViewTeam.username}'S SQUAD</div>
                <div className="text-xs text-gray-500">{squadViewTeam.squad?.length || 0} players · £{formatBudget(squadViewTeam.remainingBudget)} left</div>
              </div>
            </div>
            <button onClick={() => setShowSquadModal(false)} className="text-gray-400 text-2xl leading-none w-8 h-8 flex items-center justify-center">×</button>
          </div>
          <div className="overflow-y-auto p-3 space-y-4" style={{ maxHeight: 'calc(88vh - 64px)' }}>
            {squadViewTeam.squad?.length === 0 ? (
              <div className="text-center py-10 text-gray-600">No players signed yet</div>
            ) : (
              POSITION_ORDER.map(pos => {
                const posPlayers = grouped[pos];
                if (!posPlayers?.length) return null;
                const posAccent = getPositionAccent(pos);
                return (
                  <div key={pos}>
                    <div className="flex items-center gap-2 mb-2">
                      <span>{POSITION_EMOJI[pos]}</span>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${getPositionColor(pos)}`}>{pos}</span>
                      <span className="text-xs text-gray-600">{posPlayers.length} players</span>
                    </div>
                    <div className="space-y-1.5">
                      {posPlayers.map((sq, i) => (
                        <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl"
                          style={{ background: `${posAccent}08`, border: `1px solid ${posAccent}20` }}>
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-lg flex-shrink-0"
                            style={{ background: `${posAccent}15` }}>
                            {POSITION_EMOJI[sq.playerData.position]}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-white truncate">{sq.playerData.name}</p>
                            <p className="text-xs text-gray-500">{sq.playerData.club} · {sq.playerData.rating} OVR</p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="text-xs font-mono font-bold" style={{ color: posAccent }}>£{formatBudget(sq.pricePaid)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    );
  };

  const PlayerHero = ({ compact = false }) => (
    <div className="rounded-2xl overflow-hidden"
      style={{ background: '#0d0d2b', border: `1px solid ${accent}30` }}>
      <div className="h-1" style={{ background: `linear-gradient(90deg, ${accent}, transparent)` }} />
      <div className={`p-${compact ? '3' : '4'} flex ${compact ? 'items-center gap-3' : 'gap-4 items-center'}`}>
        <div className="relative flex-shrink-0">
          <div className={`${compact ? 'w-14 h-14 text-3xl' : 'w-20 h-20 text-4xl'} rounded-xl flex items-center justify-center`}
            style={{ background: `${accent}15`, border: `2px solid ${accent}40` }}>
            {POSITION_EMOJI[currentPlayer.position]}
          </div>
          <span className={`absolute -top-1.5 -right-1.5 font-bold px-1.5 py-0.5 rounded-full ${getPositionColor(currentPlayer.position)}`}
            style={{ fontSize: '9px' }}>
            {currentPlayer.position}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <h2 className={`font-display ${compact ? 'text-lg' : 'text-2xl'} tracking-wider text-white leading-tight truncate`}>{currentPlayer.name}</h2>
          <p className="text-gray-400 text-xs mt-0.5">{currentPlayer.club} · {currentPlayer.nationality}</p>
          <div className="flex items-center gap-3 mt-1">
            <span className={`font-display ${compact ? 'text-base' : 'text-xl'}`} style={{ color: accent }}>{currentPlayer.rating}</span>
            <span className="text-gray-600 text-xs">OVR</span>
            <span className="text-gray-500 text-xs">Age {currentPlayer.age}</span>
          </div>
          {!compact && (
            <div className="flex gap-4 mt-1">
              {currentPlayer.position === 'GK' ? (
                <><StatChip label="CS" value={currentPlayer.stats?.cleanSheets} /><StatChip label="SVS" value={currentPlayer.stats?.saves} /></>
              ) : (
                <><StatChip label="GOL" value={currentPlayer.stats?.goals} /><StatChip label="AST" value={currentPlayer.stats?.assists} /></>
              )}
              <StatChip label="APP" value={currentPlayer.stats?.appearances} />
            </div>
          )}
        </div>
        <div className="flex flex-col items-center gap-1 flex-shrink-0">
          <AuctionTimer timeLeft={timeLeft} total={room.settings?.bidTimer || 15} />
          {isPaused && <span className="text-xs text-yellow-400 font-semibold animate-pulse">PAUSED</span>}
        </div>
      </div>
    </div>
  );

  const VoteSkipBtn = () => (
    <button onClick={handleVoteSkip} disabled={!isActive || isPaused}
      className="w-full py-2.5 rounded-xl text-sm font-semibold transition-all"
      style={{
        background: myVoted ? 'rgba(255,215,0,0.12)' : 'rgba(255,255,255,0.04)',
        border: `1px solid ${myVoted ? 'rgba(255,215,0,0.4)' : 'rgba(255,255,255,0.08)'}`,
        color: myVoted ? '#ffd700' : '#6b7280',
        opacity: (!isActive || isPaused) ? 0.4 : 1,
      }}>
      ⏭ {myVoted ? 'Voted to Skip' : 'Vote to Skip'} · {skipVotes}/{totalTeams}
      {skipVotes > 0 && <span className="ml-2 text-xs opacity-70">({skipVotes} voted)</span>}
    </button>
  );

  return (
    <div className="min-h-screen relative" style={{ background: '#060612' }}>
      <AuctionStatusOverlay status={overlayStatus} playerName={overlayData.playerName} soldTo={overlayData.soldTo} price={overlayData.price} />
      <SquadModal />

      {/* Delete Confirm */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)' }}>
          <div className="rounded-2xl p-6 max-w-sm w-full"
            style={{ background: '#0d0d2b', border: '1px solid rgba(255,61,61,0.4)' }}>
            <div className="text-3xl mb-3 text-center">🗑️</div>
            <h3 className="font-display text-xl tracking-wider text-white text-center mb-2">END AUCTION?</h3>
            <p className="text-gray-400 text-sm text-center mb-6">This will permanently delete the room for all players.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 h-11 rounded-xl text-sm font-semibold"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#9ca3af' }}>
                Cancel
              </button>
              <button onClick={handleDeleteRoom} disabled={deleting} className="flex-1 h-11 rounded-xl text-sm font-semibold"
                style={{ background: 'rgba(255,61,61,0.2)', border: '1px solid rgba(255,61,61,0.5)', color: '#ff3d3d' }}>
                {deleting ? 'Deleting...' : '🗑️ Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top bar */}
      <div className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-3 md:px-5 py-2.5"
        style={{ background: 'rgba(6,6,18,0.97)', borderBottom: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(8px)' }}>
        <div className="flex items-center gap-2 md:gap-3">
          <div className="font-display text-base tracking-widest" style={{ color: '#00ff87' }}>⚽ FA</div>
          <div className="hidden sm:block">
            <p className="text-white font-semibold text-xs truncate max-w-[120px]">{room.name}</p>
            <p className="text-xs text-gray-500">{playerIndex + 1}/{totalPlayers}</p>
          </div>
          <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${
            isPaused ? 'text-yellow-400' : isActive ? 'text-green-400' : 'text-gray-500'
          }`} style={{ background: isPaused ? 'rgba(255,215,0,0.1)' : isActive ? 'rgba(0,255,135,0.1)' : 'rgba(255,255,255,0.05)' }}>
            <span className={`w-1.5 h-1.5 rounded-full ${isPaused ? 'bg-yellow-400 animate-pulse' : isActive ? 'bg-green-400 animate-pulse' : 'bg-gray-600'}`} />
            {isPaused ? 'PAUSED' : isActive ? 'LIVE' : 'ENDED'}
          </div>
        </div>
        <div className="flex items-center gap-1.5 md:gap-2">
          <div className="flex flex-col items-end mr-1">
            <span className="text-xs text-gray-500 hidden sm:block">Budget</span>
            <span className="font-mono font-bold text-xs md:text-sm" style={{ color: (myTeam?.remainingBudget || 0) < 10 ? '#ff3d3d' : '#00ff87' }}>
              £{formatBudget(myTeam?.remainingBudget)}
            </span>
          </div>
          {isHost && (
            <>
              <button onClick={handlePause} className="px-2 py-1.5 rounded-lg text-xs font-semibold"
                style={{ background: 'rgba(255,215,0,0.1)', border: '1px solid rgba(255,215,0,0.3)', color: '#ffd700' }}>
                {isPaused ? '▶' : '⏸'}
              </button>
              <button onClick={handleSkip} className="px-2 py-1.5 rounded-lg text-xs font-semibold"
                style={{ background: 'rgba(255,61,61,0.1)', border: '1px solid rgba(255,61,61,0.3)', color: '#ff3d3d' }}>
                ⏭
              </button>
              <button onClick={() => setShowDeleteConfirm(true)} className="px-2 py-1.5 rounded-lg text-xs font-semibold"
                style={{ background: 'rgba(255,61,61,0.1)', border: '1px solid rgba(255,61,61,0.3)', color: '#ff3d3d' }}>
                🗑️
              </button>
            </>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="fixed top-[45px] left-0 right-0 z-40 h-0.5" style={{ background: 'rgba(255,255,255,0.04)' }}>
        <div className="h-full transition-all duration-500"
          style={{ width: totalPlayers ? `${(playerIndex / totalPlayers) * 100}%` : '0%', background: 'linear-gradient(90deg,#00ff87,#00d4ff)' }} />
      </div>

      {/* DESKTOP */}
      <div className="hidden lg:grid" style={{ paddingTop: '48px', gridTemplateColumns: '1fr 320px', minHeight: '100vh' }}>
        <div className="p-4 space-y-3 overflow-y-auto">
          {currentPlayer ? (
            <>
              <PlayerHero />
              <VoteSkipBtn />
              {bidError && (
                <div className="px-4 py-2.5 rounded-xl text-sm"
                  style={{ background: 'rgba(255,61,61,0.1)', border: '1px solid rgba(255,61,61,0.3)', color: '#ff3d3d' }}>
                  ⚠️ {bidError}
                </div>
              )}
              <BidPanel currentBid={currentBid} myBudget={myTeam?.remainingBudget || 0} onBid={handleBid}
                disabled={!isActive || isPaused} currentBidder={currentBidder} myUsername={user?.username}
                minIncrement={room.settings?.minBidIncrement} />
              <BidHistory bids={bids} />
              <ChatPanel messages={chat} onSend={handleChat} myUsername={user?.username} />
            </>
          ) : (
            <div className="flex items-center justify-center h-64">
              <div className="text-center text-gray-600"><div className="text-4xl mb-3">⏳</div><p>Waiting for auction to start...</p></div>
            </div>
          )}
        </div>
        <div className="border-l border-white/5 overflow-y-auto" style={{ paddingTop: '8px' }}>
          <div className="px-3 pb-4">
            <p className="text-xs text-gray-500 tracking-widest uppercase mb-3 px-1">Teams & Squads</p>
            <div className="space-y-2">
              {room.teams?.map(team => <TeamCard key={team.username} team={team} />)}
            </div>
          </div>
        </div>
      </div>

      {/* MOBILE */}
      <div className="lg:hidden flex flex-col" style={{ paddingTop: '48px', paddingBottom: '56px', minHeight: '100vh' }}>
        {currentPlayer ? (
          <>
            <div className="px-3 pt-3 space-y-2">
              <PlayerHero compact />
              <VoteSkipBtn />
            </div>
            <div className="flex-1 overflow-y-auto px-3 mt-2 space-y-3 pb-2">
              {mobileTab === 'bid' && (
                <>
                  {bidError && (
                    <div className="px-3 py-2 rounded-xl text-xs"
                      style={{ background: 'rgba(255,61,61,0.1)', border: '1px solid rgba(255,61,61,0.3)', color: '#ff3d3d' }}>
                      ⚠️ {bidError}
                    </div>
                  )}
                  <BidPanel currentBid={currentBid} myBudget={myTeam?.remainingBudget || 0} onBid={handleBid}
                    disabled={!isActive || isPaused} currentBidder={currentBidder} myUsername={user?.username}
                    minIncrement={room.settings?.minBidIncrement} />
                  <BidHistory bids={bids} />
                </>
              )}
              {mobileTab === 'teams' && (
                <div className="space-y-2 pb-4">
                  {room.teams?.map(team => <TeamCard key={team.username} team={team} />)}
                </div>
              )}
              {mobileTab === 'chat' && (
                <ChatPanel messages={chat} onSend={handleChat} myUsername={user?.username} />
              )}
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center flex-1">
            <div className="text-center text-gray-600"><div className="text-4xl mb-3">⏳</div><p>Waiting for auction to start...</p></div>
          </div>
        )}
      </div>

      {/* Mobile bottom tabs */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 flex"
        style={{ background: 'rgba(6,6,18,0.97)', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
        {[{ id: 'bid', label: '💰 Bid' }, { id: 'teams', label: '👥 Teams' }, { id: 'chat', label: '💬 Chat' }].map(tab => (
          <button key={tab.id} onClick={() => setMobileTab(tab.id)}
            className="flex-1 py-3 text-xs font-semibold transition-all"
            style={{
              color: mobileTab === tab.id ? '#00ff87' : '#6b7280',
              borderTop: `2px solid ${mobileTab === tab.id ? '#00ff87' : 'transparent'}`,
            }}>
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
}

const StatChip = ({ label, value }) => (
  <div className="flex flex-col items-center">
    <span className="font-mono font-bold text-white text-xs">{value}</span>
    <span className="text-gray-600 text-xs">{label}</span>
  </div>
);