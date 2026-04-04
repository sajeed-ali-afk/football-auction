import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import Navbar from '../components/shared/Navbar';
import api from '../utils/api';
import { generateAvatar } from '../utils/helpers';
import { sounds } from '../utils/sounds';

export default function LobbyPage() {
  const { roomId } = useParams();
  const { user } = useAuth();
  const { socket } = useSocket();
  const navigate = useNavigate();

  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(null); // 'leave' | 'delete'

  const [readyLoading, setReadyLoading] = useState(false);

  const fetchRoom = useCallback(async () => {
    try {
      const res = await api.get(`/rooms/${roomId}`);
      setRoom(res.data.room);
      if (res.data.room.status === 'active') navigate(`/room/${roomId}/auction`);
      if (res.data.room.status === 'completed') navigate(`/room/${roomId}/results`);
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
    if (!socket || !room) return;

    socket.emit('join_room', { roomId });

    socket.on('user_joined', ({ teams }) => {
      setRoom(r => r ? { ...r, teams } : r);
      sounds.join();
    });
    socket.on('user_left', ({ username }) => {
      setRoom(r => r ? { ...r, teams: r.teams.filter(t => t.username !== username) } : r);
    });
    socket.on('ready_update', ({ teams }) => {
      setRoom(r => r ? { ...r, teams } : r);
      setReadyLoading(false);
    });
    socket.on('error', ({ message }) => {
      setReadyLoading(false);
      alert('Error: ' + message);
    });
    socket.on('auction_started', () => {
      navigate(`/room/${roomId}/auction`);
    });
    socket.on('room_deleted', () => {
      navigate('/dashboard');
    });

    return () => {
      socket.off('user_joined');
      socket.off('user_left');
      socket.off('ready_update');
      socket.off('auction_started');
      socket.off('room_deleted');
      socket.off('error');
    };
  }, [socket, room, roomId, navigate]);

  const handleReady = () => {
    if (readyLoading) return;
    setReadyLoading(true);
    socket?.emit('player_ready', { roomId });
  };

  const handleStart = () => {
    socket?.emit('start_auction', { roomId });
  };

  const copyCode = () => {
    navigator.clipboard.writeText(room.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLeaveRoom = async () => {
    setLeaving(true);
    try {
      await api.post(`/rooms/${roomId}/leave`);
      socket?.emit('leave_room', { roomId });
      navigate('/dashboard');
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to leave room');
    } finally {
      setLeaving(false);
      setShowConfirm(null);
    }
  };

  const handleDeleteRoom = async () => {
    setDeleting(true);
    try {
      await api.delete(`/rooms/${roomId}`);
      socket?.emit('delete_room', { roomId });
      navigate('/dashboard');
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete room');
    } finally {
      setDeleting(false);
      setShowConfirm(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-neon-green font-display text-2xl animate-pulse">LOADING LOBBY...</div>
      </div>
    );
  }

  if (!room) return null;

  const isHost = room.host?._id === user?._id || room.host === user?._id || room.hostUsername === user?.username;
  const myTeam = room.teams?.find(t => t.user === user?._id || t.username === user?.username);

  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Confirm Modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}>
          <div className="rounded-2xl p-6 max-w-sm w-full"
            style={{ background: '#0d0d2b', border: `1px solid ${showConfirm === 'delete' ? 'rgba(255,61,61,0.4)' : 'rgba(255,215,0,0.4)'}` }}>
            <div className="text-3xl mb-3 text-center">{showConfirm === 'delete' ? '🗑️' : '🚪'}</div>
            <h3 className="font-display text-xl tracking-wider text-white text-center mb-2">
              {showConfirm === 'delete' ? 'DELETE ROOM?' : 'LEAVE ROOM?'}
            </h3>
            <p className="text-gray-400 text-sm text-center mb-6">
              {showConfirm === 'delete'
                ? 'This will permanently delete the room and kick all players.'
                : 'You will leave this room and lose your spot.'}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(null)}
                className="flex-1 h-11 rounded-xl text-sm font-semibold transition-all"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#9ca3af' }}>
                Cancel
              </button>
              <button
                onClick={showConfirm === 'delete' ? handleDeleteRoom : handleLeaveRoom}
                disabled={deleting || leaving}
                className="flex-1 h-11 rounded-xl text-sm font-semibold transition-all"
                style={{
                  background: showConfirm === 'delete' ? 'rgba(255,61,61,0.2)' : 'rgba(255,215,0,0.15)',
                  border: `1px solid ${showConfirm === 'delete' ? 'rgba(255,61,61,0.5)' : 'rgba(255,215,0,0.4)'}`,
                  color: showConfirm === 'delete' ? '#ff3d3d' : '#ffd700',
                }}>
                {deleting || leaving ? 'Please wait...' : showConfirm === 'delete' ? '🗑️ Delete' : '🚪 Leave'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="pt-24 pb-16 px-4 max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-4 text-xs tracking-widest"
            style={{ background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.3)', color: '#00d4ff' }}>
            <span className="w-2 h-2 rounded-full bg-neon-blue animate-pulse" />
            WAITING LOBBY
          </div>
          <h1 className="font-display text-4xl md:text-5xl tracking-wider text-white">{room.name}</h1>
        </div>

        {/* Room Code */}
        <div className="rounded-2xl p-6 mb-6 text-center"
          style={{ background: '#0d0d2b', border: '1px solid rgba(0,212,255,0.2)' }}>
          <p className="text-xs text-gray-500 tracking-widest uppercase mb-2">Share this code with friends</p>
          <div className="flex items-center justify-center gap-4">
            <span className="font-display text-5xl tracking-[0.3em]"
              style={{ color: '#00d4ff', textShadow: '0 0 20px rgba(0,212,255,0.5)' }}>
              {room.code}
            </span>
            <button onClick={copyCode}
              className="px-4 py-2 rounded-xl text-sm font-semibold transition-all"
              style={{
                background: copied ? 'rgba(0,255,135,0.2)' : 'rgba(0,212,255,0.1)',
                border: `1px solid ${copied ? 'rgba(0,255,135,0.4)' : 'rgba(0,212,255,0.3)'}`,
                color: copied ? '#00ff87' : '#00d4ff',
              }}>
              {copied ? '✓ Copied!' : '📋 Copy'}
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Teams */}
          <div className="rounded-2xl p-6"
            style={{ background: '#0d0d2b', border: '1px solid rgba(255,255,255,0.07)' }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-xl tracking-wider text-white">TEAMS</h2>
              <span className="text-sm text-gray-500">{room.teams?.length}/{room.settings?.maxTeams}</span>
            </div>
            <div className="space-y-3">
              {room.teams?.map(team => (
                <div key={team.username} className="flex items-center gap-3 p-3 rounded-xl transition-all"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-dark-500 flex-shrink-0"
                    style={{ background: generateAvatar(team.username) }}>
                    {team.username?.[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white text-sm">{team.username}</span>
                      {team.username === room.hostUsername && (
                        <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(255,215,0,0.15)', color: '#ffd700' }}>👑 Host</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">Budget: £{room.settings?.budgetPerTeam}M</p>
                  </div>
                  <div className={`text-xs font-semibold px-2 py-1 rounded-lg ${
                    team.username === room.hostUsername ? 'text-neon-yellow' :
                    team.isReady ? 'text-neon-green' : 'text-gray-500'
                  }`}>
                    {team.username === room.hostUsername ? 'HOST' : team.isReady ? '✓ READY' : '...'}
                  </div>
                </div>
              ))}
              {/* Empty slots */}
              {Array.from({ length: Math.max(0, room.settings?.maxTeams - room.teams?.length) }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl"
                  style={{ background: 'rgba(255,255,255,0.01)', border: '1px dashed rgba(255,255,255,0.06)' }}>
                  <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-600 text-xl">+</div>
                  <span className="text-gray-600 text-sm">Waiting for player...</span>
                </div>
              ))}
            </div>
          </div>

          {/* Settings & Controls */}
          <div className="space-y-4">
            {/* Auction Settings */}
            <div className="rounded-2xl p-6"
              style={{ background: '#0d0d2b', border: '1px solid rgba(255,255,255,0.07)' }}>
              <h2 className="font-display text-xl tracking-wider text-white mb-4">SETTINGS</h2>
              <div className="space-y-3">
                {[
                  { label: 'Budget per Team', value: `£${room.settings?.budgetPerTeam}M` },
                  { label: 'Bid Timer', value: `${room.settings?.bidTimer}s` },
                  { label: 'Squad Size', value: `${room.settings?.squadSize} players` },
                  { label: 'Min. Bid Increment', value: `£${room.settings?.minBidIncrement}M` },
                  { label: 'Max Teams', value: room.settings?.maxTeams },
                  { label: 'Total Players', value: room.players?.length || 0 },
                ].map(s => (
                  <div key={s.label} className="flex justify-between items-center py-2 border-b border-white/5 last:border-0">
                    <span className="text-gray-500 text-sm">{s.label}</span>
                    <span className="text-white font-mono font-semibold text-sm">{s.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Controls */}
            <div className="space-y-3">
              {/* Ready button for non-host */}
              {!isHost && (
                <button onClick={handleReady}
                  disabled={readyLoading}
                  className={`w-full h-12 rounded-xl font-semibold text-sm tracking-widest transition-all ${
                    myTeam?.isReady
                      ? 'bg-neon-green/10 border border-neon-green/30 text-neon-green'
                      : 'btn-solid'
                  } ${readyLoading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                  {readyLoading ? '⏳ UPDATING...' : myTeam?.isReady ? '✓ READY — Click to Unready' : '✅ MARK AS READY'}
                </button>
              )}

              {/* Start button for host */}
              {isHost && (
                <button
                  onClick={handleStart}
                  disabled={room.teams?.length < 2}
                  className="btn-solid w-full h-12 rounded-xl text-sm tracking-widest disabled:opacity-40 disabled:cursor-not-allowed">
                  {room.teams?.length < 2
                    ? '⏳ Need at least 2 teams'
                    : '🚀 START AUCTION'}
                </button>
              )}

              {/* Leave Room button for non-host */}
              {!isHost && (
                <button
                  onClick={() => setShowConfirm('leave')}
                  className="w-full h-12 rounded-xl font-semibold text-sm tracking-widest transition-all"
                  style={{
                    background: 'rgba(255,215,0,0.08)',
                    border: '1px solid rgba(255,215,0,0.3)',
                    color: '#ffd700',
                  }}>
                  🚪 LEAVE ROOM
                </button>
              )}

              {/* Delete Room button for host */}
              {isHost && (
                <button
                  onClick={() => setShowConfirm('delete')}
                  className="w-full h-12 rounded-xl font-semibold text-sm tracking-widest transition-all"
                  style={{
                    background: 'rgba(255,61,61,0.08)',
                    border: '1px solid rgba(255,61,61,0.3)',
                    color: '#ff3d3d',
                  }}>
                  🗑️ DELETE ROOM
                </button>
              )}

              <div className="text-center text-xs text-gray-600">
                {isHost ? 'Start when all players are ready' : 'Wait for the host to start'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}