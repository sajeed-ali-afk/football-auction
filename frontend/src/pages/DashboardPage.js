import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/shared/Navbar';
import api from '../utils/api';

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('create'); // 'create' | 'join'
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Create room form
  const [createForm, setCreateForm] = useState({
    name: '', maxTeams: 4, budgetPerTeam: 100, bidTimer: 15, squadSize: 15, minBidIncrement: 0.5,
  });
  // Join form
  const [joinCode, setJoinCode] = useState('');

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      const res = await api.get('/rooms');
      setRooms(res.data.rooms);
    } catch {}
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (!createForm.name.trim()) { setError('Room name is required'); return; }
    setLoading(true);
    try {
      const res = await api.post('/rooms', {
        name: createForm.name,
        settings: {
          maxTeams: Number(createForm.maxTeams),
          budgetPerTeam: Number(createForm.budgetPerTeam),
          bidTimer: Number(createForm.bidTimer),
          squadSize: Number(createForm.squadSize),
          minBidIncrement: Number(createForm.minBidIncrement),
        },
      });
      navigate(`/room/${res.data.room._id}/lobby`);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create room');
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (!joinCode.trim()) { setError('Enter a room code'); return; }
    setLoading(true);
    try {
      const res = await api.post('/rooms/join', { code: joinCode.trim().toUpperCase() });
      navigate(`/room/${res.data.room._id}/lobby`);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to join room');
    } finally {
      setLoading(false);
    }
  };

  const handleRejoin = (room) => {
    if (room.status === 'lobby') navigate(`/room/${room._id}/lobby`);
    else if (room.status === 'active' || room.status === 'paused') navigate(`/room/${room._id}/auction`);
    else navigate(`/room/${room._id}/results`);
  };

 

  const statusColor = (s) => {
    if (s === 'lobby') return 'text-neon-blue';
    if (s === 'active') return 'text-neon-green';
    if (s === 'completed') return 'text-gray-500';
    return 'text-neon-yellow';
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="pt-24 pb-16 px-4 max-w-6xl mx-auto">
        {/* Hero */}
        <div className="text-center mb-12 animate-fade-in">
          <h1 className="font-display text-5xl md:text-7xl tracking-widest text-white mb-3">
            AUCTION <span style={{ color: '#00ff87' }}>ARENA</span>
          </h1>
          <p className="text-gray-400 text-lg">Welcome back, <span className="text-neon-green font-semibold">{user?.username}</span></p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left: Create / Join */}
          <div>
            {/* Tabs */}
            <div className="flex mb-6 rounded-xl overflow-hidden"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
              {['create', 'join'].map(t => (
                <button key={t} onClick={() => { setTab(t); setError(''); }}
                  className="flex-1 py-3 text-sm font-semibold tracking-widest uppercase transition-all"
                  style={tab === t
                    ? { background: '#00ff87', color: '#060612' }
                    : { color: '#6b7280' }}>
                  {t === 'create' ? '🏗️ Create Room' : '🔗 Join Room'}
                </button>
              ))}
            </div>

            {error && (
              <div className="mb-4 px-4 py-3 rounded-xl text-sm animate-shake"
                style={{ background: 'rgba(255,61,61,0.1)', border: '1px solid rgba(255,61,61,0.3)', color: '#ff3d3d' }}>
                ⚠️ {error}
              </div>
            )}

            {success && (
              <div className="mb-4 px-4 py-3 rounded-xl text-sm"
                style={{ background: 'rgba(0,255,135,0.1)', border: '1px solid rgba(0,255,135,0.3)', color: '#00ff87' }}>
                ✅ {success}
              </div>
            )}

            {tab === 'create' ? (
              <form onSubmit={handleCreate} className="rounded-2xl p-6 space-y-5"
                style={{ background: '#0d0d2b', border: '1px solid rgba(255,255,255,0.07)' }}>
                <div>
                  <label className="block text-xs text-gray-500 mb-2 tracking-wider uppercase">Room Name</label>
                  <input
                    type="text" className="input-dark"
                    placeholder="e.g. Friday Night Auction"
                    value={createForm.name}
                    onChange={e => setCreateForm(f => ({ ...f, name: e.target.value }))}
                    required maxLength={40} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-500 mb-2 tracking-wider uppercase">Max Teams</label>
                    <select className="input-dark"
                      value={createForm.maxTeams}
                      onChange={e => setCreateForm(f => ({ ...f, maxTeams: e.target.value }))}>
                      {[2,3,4,6,8].map(n => <option key={n} value={n}>{n} Teams</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-2 tracking-wider uppercase">Budget (M)</label>
                    <select className="input-dark"
                      value={createForm.budgetPerTeam}
                      onChange={e => setCreateForm(f => ({ ...f, budgetPerTeam: e.target.value }))}>
                      {[50, 75, 100, 150, 200].map(n => <option key={n} value={n}>£{n}M</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-2 tracking-wider uppercase">Bid Timer (s)</label>
                    <select className="input-dark"
                      value={createForm.bidTimer}
                      onChange={e => setCreateForm(f => ({ ...f, bidTimer: e.target.value }))}>
                      {[10, 15, 20, 30].map(n => <option key={n} value={n}>{n}s</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-2 tracking-wider uppercase">Squad Size</label>
                    <select className="input-dark"
                      value={createForm.squadSize}
                      onChange={e => setCreateForm(f => ({ ...f, squadSize: e.target.value }))}>
                      {[11, 13, 15, 18].map(n => <option key={n} value={n}>{n} Players</option>)}
                    </select>
                  </div>
                </div>

                <button type="submit" disabled={loading} className="btn-solid w-full rounded-xl h-12 text-sm tracking-widest">
                  {loading ? 'CREATING...' : '🏟️ CREATE AUCTION ROOM'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleJoin} className="rounded-2xl p-6"
                style={{ background: '#0d0d2b', border: '1px solid rgba(255,255,255,0.07)' }}>
                <div className="mb-6">
                  <label className="block text-xs text-gray-500 mb-2 tracking-wider uppercase">Room Code</label>
                  <input
                    type="text" className="input-dark text-2xl font-display tracking-[0.3em] text-center uppercase"
                    placeholder="ABC123"
                    value={joinCode}
                    onChange={e => setJoinCode(e.target.value.toUpperCase())}
                    maxLength={6} required />
                  <p className="text-xs text-gray-600 text-center mt-2">Get the code from your auction host</p>
                </div>
                <button type="submit" disabled={loading} className="btn-solid w-full rounded-xl h-12 text-sm tracking-widest">
                  {loading ? 'JOINING...' : '🚀 JOIN ROOM'}
                </button>
              </form>
            )}
          </div>

          {/* Right: Recent rooms */}
          <div>
            <h2 className="font-display text-2xl tracking-wider text-white mb-4">YOUR ROOMS</h2>
            {rooms.length === 0 ? (
              <div className="rounded-2xl p-10 text-center"
                style={{ background: '#0d0d2b', border: '1px solid rgba(255,255,255,0.07)' }}>
                <div className="text-4xl mb-3">🏟️</div>
                <p className="text-gray-500">No rooms yet. Create or join one!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {rooms.map(room => (
                  <div key={room._id} className="rounded-xl p-4 flex items-center justify-between cursor-pointer group transition-all relative"
                    style={{ background: '#0d0d2b', border: '1px solid rgba(255,255,255,0.07)' }}
                    onClick={() => handleRejoin(room)}>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-white">{room.name}</h3>
                        <span className={`text-xs font-mono uppercase ${statusColor(room.status)}`}>• {room.status}</span>
                      </div>
                      <p className="text-xs text-gray-500">
                        Code: <span className="font-mono text-neon-blue">{room.code}</span> •{' '}
                        {room.teams?.length}/{room.settings?.maxTeams} teams •{' '}
                        {room.hostUsername === user?.username ? '👑 Host' : '👤 Player'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {room.hostUsername === user?.username && (
                        <button
                          onClick={(e) => handleDeleteRoom(room._id, e)}
                          className="text-red-400 hover:text-red-300 transition-colors text-lg"
                          title="Delete Room"
                        >
                          🗑️
                        </button>
                      )}
                      <div className="text-gray-600 group-hover:text-neon-green transition-colors text-xl">→</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Stats */}
            <div className="mt-6 grid grid-cols-3 gap-3">
              {[
                { label: 'Auctions', value: user?.stats?.auctionsPlayed || 0, icon: '🏆' },
                { label: 'Budget Spent', value: `£${user?.stats?.totalSpent || 0}M`, icon: '💰' },
                { label: 'Wins', value: user?.stats?.auctionsWon || 0, icon: '🥇' },
              ].map(stat => (
                <div key={stat.label} className="rounded-xl p-4 text-center"
                  style={{ background: 'rgba(0,255,135,0.04)', border: '1px solid rgba(0,255,135,0.1)' }}>
                  <div className="text-2xl mb-1">{stat.icon}</div>
                  <div className="font-display text-xl text-neon-green">{stat.value}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
