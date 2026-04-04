import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/shared/Navbar';
import api from '../utils/api';
import { formatBudget, getPositionAccent, getPositionColor, generateAvatar } from '../utils/helpers';

const POSITION_EMOJI = { GK: '🧤', DEF: '🛡️', MID: '⚡', FWD: '🔥' };
const POSITION_ORDER = ['GK', 'DEF', 'MID', 'FWD'];

export default function ResultsPage() {
  const { roomId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [results, setResults] = useState([]);
  const [soldPlayers, setSoldPlayers] = useState([]);
  const [roomName, setRoomName] = useState('');
  const [roomData, setRoomData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTeam, setActiveTeam] = useState(null);
  const [tab, setTab] = useState('leaderboard'); // 'leaderboard' | 'squads' | 'players'

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const [resultsRes, roomRes] = await Promise.all([
          api.get(`/auction/${roomId}/results`),
          api.get(`/rooms/${roomId}`),
        ]);
        setResults(resultsRes.data.results);
        setSoldPlayers(resultsRes.data.soldPlayers);
        setRoomName(resultsRes.data.roomName);
        setRoomData(roomRes.data.room);
        if (resultsRes.data.results.length > 0) {
          setActiveTeam(resultsRes.data.results[0].username);
        }
      } catch {
        navigate('/dashboard');
      } finally {
        setLoading(false);
      }
    };
    fetchResults();
  }, [roomId, navigate]);

  const getRank = (idx) => {
    if (idx === 0) return { icon: '🥇', color: '#ffd700' };
    if (idx === 1) return { icon: '🥈', color: '#c0c0c0' };
    if (idx === 2) return { icon: '🥉', color: '#cd7f32' };
    return { icon: `#${idx + 1}`, color: '#6b7280' };
  };

  // Sort results by squad size desc, then remaining budget asc
  const sortedResults = [...results].sort((a, b) => {
    if (b.squadSize !== a.squadSize) return b.squadSize - a.squadSize;
    return b.budgetSpent - a.budgetSpent;
  });

  const activeTeamData = roomData?.teams?.find(t => t.username === activeTeam);
  const getPlayerDetails = (sq) => {
    return roomData?.players?.find(p =>
      p.player?._id === sq.player || p.player?._id?.toString() === sq.player?.toString()
    )?.player;
  };

  const squadByPosition = (squad) => {
    const grouped = { GK: [], DEF: [], MID: [], FWD: [] };
    squad?.forEach(sq => {
      const p = getPlayerDetails(sq);
      if (p) grouped[p.position]?.push({ ...sq, playerData: p });
    });
    return grouped;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4 animate-bounce">🏆</div>
          <div className="font-display text-2xl text-neon-yellow animate-pulse">LOADING RESULTS...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="pt-24 pb-16 px-4 max-w-6xl mx-auto">

        {/* Header */}
        <div className="text-center mb-10 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-4 text-xs tracking-widest"
            style={{ background: 'rgba(255,215,0,0.1)', border: '1px solid rgba(255,215,0,0.3)', color: '#ffd700' }}>
            🏆 AUCTION COMPLETE
          </div>
          <h1 className="font-display text-5xl md:text-6xl tracking-widest text-white">{roomName}</h1>
          <p className="text-gray-500 mt-2">{soldPlayers.length} players sold across {results.length} teams</p>
        </div>

        {/* Tabs */}
        <div className="flex mb-8 rounded-xl overflow-hidden max-w-md mx-auto"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
          {[
            { id: 'leaderboard', label: '🏆 Leaderboard' },
            { id: 'squads', label: '👥 Squads' },
            { id: 'players', label: '⚡ All Players' },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className="flex-1 py-3 text-xs font-semibold tracking-wider uppercase transition-all"
              style={tab === t.id
                ? { background: '#00ff87', color: '#060612' }
                : { color: '#6b7280' }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* LEADERBOARD */}
        {tab === 'leaderboard' && (
          <div className="space-y-4 animate-fade-in">
            {/* Winner podium */}
            {sortedResults.length >= 1 && (
              <div className="rounded-2xl p-6 text-center mb-8"
                style={{
                  background: 'linear-gradient(135deg, rgba(255,215,0,0.08), rgba(255,215,0,0.02))',
                  border: '1px solid rgba(255,215,0,0.3)',
                  boxShadow: '0 0 40px rgba(255,215,0,0.1)',
                }}>
                <div className="text-6xl mb-3 animate-float">🏆</div>
                <h2 className="font-display text-4xl tracking-widest text-white mb-1">
                  {sortedResults[0].username}
                </h2>
                <p className="text-neon-yellow text-sm font-semibold mb-4">AUCTION WINNER</p>
                <div className="flex justify-center gap-8">
                  <div className="text-center">
                    <p className="font-display text-2xl text-white">{sortedResults[0].squadSize}</p>
                    <p className="text-xs text-gray-500">Players</p>
                  </div>
                  <div className="text-center">
                    <p className="font-display text-2xl text-neon-green">£{formatBudget(sortedResults[0].budgetSpent)}</p>
                    <p className="text-xs text-gray-500">Spent</p>
                  </div>
                  <div className="text-center">
                    <p className="font-display text-2xl text-neon-blue">£{formatBudget(sortedResults[0].remainingBudget)}</p>
                    <p className="text-xs text-gray-500">Remaining</p>
                  </div>
                </div>
              </div>
            )}

            {/* All teams */}
            {sortedResults.map((team, idx) => {
              const rank = getRank(idx);
              const spentPct = (team.budgetSpent / (team.budgetSpent + team.remainingBudget)) * 100;
              const isMe = team.username === user?.username;
              return (
                <div key={team.username}
                  className="rounded-2xl p-5 transition-all"
                  style={{
                    background: isMe ? 'rgba(0,255,135,0.05)' : '#0d0d2b',
                    border: `1px solid ${isMe ? 'rgba(0,255,135,0.2)' : 'rgba(255,255,255,0.07)'}`,
                  }}>
                  <div className="flex items-center gap-4">
                    <div className="text-2xl w-10 text-center" style={{ color: rank.color }}>
                      {rank.icon}
                    </div>
                    <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-dark-500 flex-shrink-0"
                      style={{ background: generateAvatar(team.username) }}>
                      {team.username[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-white">{team.username}</h3>
                        {isMe && <span className="text-xs text-neon-green">(you)</span>}
                      </div>
                      <div className="rating-bar">
                        <div className="rating-fill" style={{ width: `${spentPct}%` }} />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4 flex-shrink-0">
                      <div className="text-center">
                        <p className="font-mono font-bold text-white">{team.squadSize}</p>
                        <p className="text-xs text-gray-500">Players</p>
                      </div>
                      <div className="text-center">
                        <p className="font-mono font-bold text-neon-green">£{formatBudget(team.budgetSpent)}</p>
                        <p className="text-xs text-gray-500">Spent</p>
                      </div>
                      <div className="text-center">
                        <p className="font-mono font-bold text-neon-blue">£{formatBudget(team.remainingBudget)}</p>
                        <p className="text-xs text-gray-500">Left</p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* SQUADS */}
        {tab === 'squads' && (
          <div className="animate-fade-in">
            {/* Team selector */}
            <div className="flex flex-wrap gap-2 mb-6">
              {results.map(team => (
                <button key={team.username}
                  onClick={() => setActiveTeam(team.username)}
                  className="px-4 py-2 rounded-xl text-sm font-semibold transition-all"
                  style={{
                    background: activeTeam === team.username ? '#00ff87' : 'rgba(255,255,255,0.05)',
                    color: activeTeam === team.username ? '#060612' : '#9ca3af',
                    border: `1px solid ${activeTeam === team.username ? '#00ff87' : 'rgba(255,255,255,0.1)'}`,
                  }}>
                  {team.username} ({team.squadSize})
                </button>
              ))}
            </div>

            {activeTeamData && (
              <div className="rounded-2xl overflow-hidden"
                style={{ background: '#0d0d2b', border: '1px solid rgba(255,255,255,0.07)' }}>
                {/* Team header */}
                <div className="p-5 border-b border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-dark-500"
                      style={{ background: generateAvatar(activeTeamData.username) }}>
                      {activeTeamData.username[0].toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-display text-xl tracking-wider text-white">{activeTeamData.username}</h3>
                      <p className="text-gray-500 text-sm">{activeTeamData.squad?.length} players • £{formatBudget(activeTeamData.budget - activeTeamData.remainingBudget)} spent</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Remaining</p>
                    <p className="font-mono font-bold text-neon-green">£{formatBudget(activeTeamData.remainingBudget)}</p>
                  </div>
                </div>

                {/* Players by position */}
                <div className="p-5">
                  {POSITION_ORDER.map(pos => {
                    const grouped = squadByPosition(activeTeamData.squad);
                    const posPlayers = grouped[pos];
                    if (!posPlayers?.length) return null;
                    const accent = getPositionAccent(pos);
                    return (
                      <div key={pos} className="mb-6">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-xl">{POSITION_EMOJI[pos]}</span>
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${getPositionColor(pos)}`}>{pos}</span>
                          <span className="text-gray-600 text-xs">{posPlayers.length} players</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                          {posPlayers.map((sq, i) => (
                            <div key={i} className="rounded-xl p-3 flex items-center gap-3"
                              style={{ background: `${accent}08`, border: `1px solid ${accent}20` }}>
                              <div className="w-10 h-10 rounded-lg flex items-center justify-center text-2xl flex-shrink-0"
                                style={{ background: `${accent}15` }}>
                                {POSITION_EMOJI[sq.playerData.position]}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-white text-sm truncate">{sq.playerData.name}</p>
                                <p className="text-xs text-gray-500 truncate">{sq.playerData.club}</p>
                              </div>
                              <div className="text-right flex-shrink-0">
                                <p className="font-mono font-bold text-xs" style={{ color: accent }}>
                                  £{formatBudget(sq.pricePaid)}
                                </p>
                                <p className="text-xs text-gray-600">OVR {sq.playerData.rating}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ALL PLAYERS */}
        {tab === 'players' && (
          <div className="animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {soldPlayers
                .filter(sp => sp.status === 'sold')
                .sort((a, b) => b.finalPrice - a.finalPrice)
                .map((sp, i) => {
                  const p = sp.player;
                  if (!p) return null;
                  const accent = getPositionAccent(p.position);
                  return (
                    <div key={i} className="rounded-xl p-4 flex items-center gap-4"
                      style={{ background: '#0d0d2b', border: `1px solid ${accent}20` }}>
                      <span className="text-3xl">{POSITION_EMOJI[p.position]}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-white truncate">{p.name}</h4>
                          <span className={`text-xs px-1.5 py-0.5 rounded ${getPositionColor(p.position)}`}>{p.position}</span>
                        </div>
                        <p className="text-xs text-gray-500">{p.club} • OVR {p.rating}</p>
                        <p className="text-xs mt-1" style={{ color: accent }}>
                          → <span className="font-semibold">{sp.soldToUsername}</span>
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="font-mono font-bold" style={{ color: '#00ff87' }}>£{formatBudget(sp.finalPrice)}</p>
                        <p className="text-xs text-gray-600">Base £{formatBudget(p.basePrice)}</p>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* Back button */}
        <div className="mt-10 text-center">
          <button onClick={() => navigate('/dashboard')}
            className="btn-neon rounded-xl px-8 py-3 text-sm tracking-widest">
            ← BACK TO DASHBOARD
          </button>
        </div>
      </div>
    </div>
  );
}
