import React, { useEffect, useState } from 'react';

export default function AuctionStatusOverlay({ status, playerName, soldTo, price }) {
  // status: 'going_once' | 'going_twice' | 'sold' | 'unsold' | null
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (status) {
      setVisible(true);
      const t = setTimeout(() => setVisible(false), status === 'sold' || status === 'unsold' ? 2000 : 1200);
      return () => clearTimeout(t);
    }
  }, [status]);

  if (!visible || !status) return null;

  const configs = {
    going_once: { text: 'GOING ONCE...', color: '#ffd700', sub: null },
    going_twice: { text: 'GOING TWICE...', color: '#ff9500', sub: null },
    sold: { text: '⚡ SOLD!', color: '#00ff87', sub: `${playerName} → ${soldTo} for £${price}M` },
    unsold: { text: 'UNSOLD', color: '#ff3d3d', sub: `${playerName} goes back to the pool` },
  };

  const cfg = configs[status];
  if (!cfg) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
      {/* Backdrop */}
      <div className="absolute inset-0 animate-fade-in"
        style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} />
      {/* Content */}
      <div className="relative text-center animate-zoom-in">
        <div className="font-display tracking-widest leading-none"
          style={{
            fontSize: 'clamp(3rem, 10vw, 7rem)',
            color: cfg.color,
            textShadow: `0 0 30px ${cfg.color}, 0 0 60px ${cfg.color}60`,
          }}>
          {cfg.text}
        </div>
        {cfg.sub && (
          <p className="text-white font-body text-lg mt-3 animate-fade-in" style={{ animationDelay: '0.2s' }}>
            {cfg.sub}
          </p>
        )}
        {/* Glow ring */}
        <div className="absolute inset-0 -z-10 rounded-3xl blur-3xl opacity-30"
          style={{ background: cfg.color, transform: 'scale(1.5)' }} />
      </div>
    </div>
  );
}
