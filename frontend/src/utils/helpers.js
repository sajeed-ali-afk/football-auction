export const formatBudget = (amount) => {
  if (amount === null || amount === undefined) return '0M';
  return `${parseFloat(amount).toFixed(1)}M`;
};

export const getPositionColor = (position) => {
  const map = { GK: 'pos-gk', DEF: 'pos-def', MID: 'pos-mid', FWD: 'pos-fwd' };
  return map[position] || 'pos-mid';
};

export const getPositionAccent = (position) => {
  const map = {
    GK: '#ffd700',
    DEF: '#00d4ff',
    MID: '#00ff87',
    FWD: '#ff3d3d',
  };
  return map[position] || '#00ff87';
};

export const getRatingColor = (rating) => {
  if (rating >= 90) return '#ffd700';
  if (rating >= 85) return '#00ff87';
  if (rating >= 80) return '#00d4ff';
  return '#ffffff';
};

export const getTimerColor = (timeLeft, total) => {
  const pct = timeLeft / total;
  if (pct > 0.5) return '#00ff87';
  if (pct > 0.25) return '#ffd700';
  return '#ff3d3d';
};

export const generateAvatar = (username) => {
  const colors = ['#00ff87', '#00d4ff', '#ffd700', '#ff3d3d', '#bf5af2'];
  const idx = username?.charCodeAt(0) % colors.length;
  return colors[idx] || colors[0];
};

export const squadPositionCount = (squad, players, position) => {
  return squad.filter(sq => {
    const p = players?.find(rp =>
      rp.player?._id === sq.player || rp.player?._id?.toString() === sq.player?.toString()
    );
    return p?.player?.position === position;
  }).length;
};

export const isSquadValid = (squad) => {
  const positions = squad.map(s => s.playerData?.position);
  return (
    positions.filter(p => p === 'GK').length >= 1 &&
    positions.filter(p => p === 'DEF').length >= 3 &&
    positions.filter(p => p === 'MID').length >= 3 &&
    positions.filter(p => p === 'FWD').length >= 1
  );
};

export const timeAgo = (date) => {
  const diff = Date.now() - new Date(date).getTime();
  if (diff < 60000) return 'just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  return `${Math.floor(diff / 3600000)}h ago`;
};
