import React from 'react';
import { getPositionColor, getPositionAccent, getRatingColor, formatBudget } from '../../utils/helpers';

const POSITION_EMOJI = { GK: '🧤', DEF: '🛡️', MID: '⚡', FWD: '🔥' };
const FLAG_MAP = {
  'England': '🏴󠁧󠁢󠁥󠁮󠁧󠁿', 'France': '🇫🇷', 'Germany': '🇩🇪', 'Spain': '🇪🇸',
  'Brazil': '🇧🇷', 'Argentina': '🇦🇷', 'Portugal': '🇵🇹', 'Netherlands': '🇳🇱',
  'Belgium': '🇧🇪', 'Croatia': '🇭🇷', 'Norway': '🇳🇴', 'Morocco': '🇲🇦',
  'Italy': '🇮🇹', 'Poland': '🇵🇱', 'Uruguay': '🇺🇾', 'Egypt': '🇪🇬',
  'Scotland': '🏴󠁧󠁢󠁳󠁣󠁴󠁿',
};

export default function PlayerCard({ player, compact = false, price = null, highlight = false }) {
  if (!player) return null;
  const accent = getPositionAccent(player.position);
  const ratingColor = getRatingColor(player.rating);
  const flag = FLAG_MAP[player.nationality] || '🌍';

  if (compact) {
    return (
      <div className={`player-card rounded-xl p-3 ${highlight ? 'ring-1 ring-neon-green/40' : ''}`}
        style={{ borderColor: highlight ? 'rgba(0,255,135,0.3)' : undefined }}>
        <div className="flex items-center gap-3">
          {/* Position avatar */}
          <div className="w-10 h-10 rounded-lg flex items-center justify-center text-xl flex-shrink-0"
            style={{ background: `${accent}20`, border: `1px solid ${accent}40` }}>
            {POSITION_EMOJI[player.position]}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm text-white truncate">{player.name}</p>
            <p className="text-xs text-gray-500 truncate">{player.club}</p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${getPositionColor(player.position)}`}>
              {player.position}
            </span>
            {price && (
              <span className="text-xs font-mono font-bold" style={{ color: '#00ff87' }}>
                {formatBudget(price)}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="player-card rounded-2xl overflow-hidden relative group cursor-default"
      style={{ boxShadow: highlight ? `0 0 30px ${accent}30` : undefined }}>
      {/* Top accent bar */}
      <div className="h-1 w-full" style={{ background: `linear-gradient(90deg, ${accent}, transparent)` }} />

      {/* Header */}
      <div className="p-4 pb-3">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className={`text-xs font-bold px-2 py-1 rounded-lg ${getPositionColor(player.position)}`}>
              {player.position}
            </span>
            <span className="text-lg">{flag}</span>
          </div>
          <div className="text-right">
            <div className="text-2xl font-display tracking-wider" style={{ color: ratingColor, textShadow: `0 0 10px ${ratingColor}60` }}>
              {player.rating}
            </div>
            <div className="text-xs text-gray-500">OVR</div>
          </div>
        </div>

        {/* Player avatar */}
        <div className="w-16 h-16 rounded-2xl mx-auto mb-3 flex items-center justify-center text-3xl"
          style={{ background: `linear-gradient(135deg, ${accent}20, ${accent}05)`, border: `1px solid ${accent}30` }}>
          {POSITION_EMOJI[player.position]}
        </div>

        <h3 className="font-display text-lg tracking-wide text-white text-center leading-tight">{player.name}</h3>
        <p className="text-xs text-gray-500 text-center mt-0.5">{player.club} • Age {player.age}</p>
      </div>

      {/* Stats */}
      <div className="px-4 pb-3 grid grid-cols-3 gap-2">
        {player.position === 'GK' ? (
          <>
            <StatBox label="SAVES" value={player.stats?.saves || 0} />
            <StatBox label="CS" value={player.stats?.cleanSheets || 0} />
            <StatBox label="APP" value={player.stats?.appearances || 0} />
          </>
        ) : (
          <>
            <StatBox label="GOL" value={player.stats?.goals || 0} />
            <StatBox label="AST" value={player.stats?.assists || 0} />
            <StatBox label="APP" value={player.stats?.appearances || 0} />
          </>
        )}
      </div>

      {/* Base price */}
      <div className="px-4 pb-4">
        <div className="rounded-xl p-2 text-center"
          style={{ background: 'rgba(0,255,135,0.06)', border: '1px solid rgba(0,255,135,0.12)' }}>
          <span className="text-xs text-gray-500">Base Price </span>
          <span className="font-mono font-bold text-neon-green">{formatBudget(player.basePrice)}</span>
        </div>
      </div>

      {/* Hover glow */}
      <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
        style={{ boxShadow: `inset 0 0 30px ${accent}10` }} />
    </div>
  );
}

const StatBox = ({ label, value }) => (
  <div className="text-center rounded-lg py-2"
    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
    <div className="text-white font-bold text-base font-mono">{value}</div>
    <div className="text-gray-500 text-xs mt-0.5">{label}</div>
  </div>
);
