import React from 'react';
import { formatBudget, generateAvatar } from '../../utils/helpers';

const POS_COLORS = { GK: '#ffd700', DEF: '#00d4ff', MID: '#00ff87', FWD: '#ff3d3d' };

export default function TeamsSidebar({ teams, auctionPlayers, myUsername }) {
  return (
    <div className="rounded-2xl overflow-hidden"
      style={{ background: '#0d0d2b', border: '1px solid rgba(255,255,255,0.07)' }}>
      <div className="px-4 py-3 border-b border-white/5">
        <h3 className="font-display text-sm tracking-widest text-gray-400">TEAMS & BUDGETS</h3>
      </div>
      <div className="overflow-y-auto" style={{ maxHeight: '500px' }}>
        {teams.map(team => {
          const isMe = team.username === myUsername;
          const budgetPct = (team.remainingBudget / team.budget) * 100;
          const squadByPos = { GK: 0, DEF: 0, MID: 0, FWD: 0 };

          team.squad?.forEach(sq => {
            const ap = auctionPlayers?.find(p =>
              p.player?._id === sq.player || p.player?._id?.toString() === sq.player?.toString()
            );
            if (ap?.player?.position) squadByPos[ap.player.position]++;
          });

          return (
            <div key={team.username}
              className="p-3 border-b border-white/5 last:border-0 transition-all"
              style={{ background: isMe ? 'rgba(0,255,135,0.04)' : 'transparent' }}>
              {/* Header */}
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-dark-500 flex-shrink-0"
                  style={{ background: generateAvatar(team.username) }}>
                  {team.username?.[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <span className="text-sm font-semibold text-white truncate">{team.username}</span>
                    {isMe && <span className="text-xs text-neon-green">(you)</span>}
                  </div>
                </div>
                <span className="font-mono text-sm font-bold"
                  style={{ color: budgetPct < 20 ? '#ff3d3d' : budgetPct < 50 ? '#ffd700' : '#00ff87' }}>
                  £{formatBudget(team.remainingBudget)}
                </span>
              </div>

              {/* Budget bar */}
              <div className="rating-bar mb-2">
                <div className="rating-fill" style={{ width: `${budgetPct}%`,
                  background: budgetPct < 20 ? '#ff3d3d' : budgetPct < 50 ? '#ffd700' : undefined }} />
              </div>

              {/* Position breakdown */}
              <div className="flex gap-2">
                {Object.entries(squadByPos).map(([pos, count]) => (
                  <div key={pos} className="flex items-center gap-1">
                    <span className="text-xs font-mono" style={{ color: POS_COLORS[pos] }}>{pos}</span>
                    <span className="text-xs text-gray-500">{count}</span>
                  </div>
                ))}
                <span className="ml-auto text-xs text-gray-600">{team.squad?.length || 0} players</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
