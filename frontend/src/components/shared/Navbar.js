import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { generateAvatar } from '../../utils/helpers';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isAuction = location.pathname.includes('/auction');

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 md:px-8 py-4"
      style={{ background: 'linear-gradient(to bottom, rgba(6,6,18,0.95), transparent)', backdropFilter: 'blur(8px)' }}>
      {/* Logo */}
      <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/dashboard')}>
        <div className="w-9 h-9 rounded-lg flex items-center justify-center text-xl"
          style={{ background: 'linear-gradient(135deg, #00ff87, #00d4ff)', boxShadow: '0 0 16px rgba(0,255,135,0.4)' }}>
          ⚽
        </div>
        <div>
          <span className="font-display text-xl tracking-widest text-white">FOOTBALL</span>
          <span className="font-display text-xl tracking-widest" style={{ color: '#00ff87' }}> AUCTION</span>
        </div>
      </div>

      {/* Right side */}
      {user && (
        <div className="flex items-center gap-4">
          {!isAuction && (
            <button onClick={() => navigate('/dashboard')}
              className="hidden md:flex items-center gap-2 text-gray-400 hover:text-neon-green transition-colors text-sm font-medium">
              Dashboard
            </button>
          )}
          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex items-center gap-3 px-3 py-2 rounded-xl transition-all"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-dark-500"
                style={{ background: generateAvatar(user.username) }}>
                {user.username?.[0]?.toUpperCase()}
              </div>
              <span className="hidden md:block text-sm font-medium text-gray-200">{user.username}</span>
              <span className="text-gray-400 text-xs">{menuOpen ? '▲' : '▼'}</span>
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-full mt-2 w-48 rounded-xl overflow-hidden animate-slide-down"
                style={{ background: '#0d0d2b', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}>
                <div className="px-4 py-3 border-b border-white/5">
                  <p className="text-xs text-gray-500">Signed in as</p>
                  <p className="text-sm font-semibold text-white truncate">{user.email}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full px-4 py-3 text-left text-sm text-red-400 hover:bg-red-500/10 transition-colors flex items-center gap-2">
                  <span>🚪</span> Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
