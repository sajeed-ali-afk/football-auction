import React from 'react';
import { getTimerColor } from '../../utils/helpers';

export default function AuctionTimer({ timeLeft, total }) {
  const pct = Math.max(0, timeLeft / total);
  const radius = 44;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - pct);
  const color = getTimerColor(timeLeft, total);
  const isUrgent = timeLeft <= 5;

  return (
    <div className={`relative w-28 h-28 flex items-center justify-center ${isUrgent ? 'animate-pulse' : ''}`}>
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100">
        {/* Track */}
        <circle cx="50" cy="50" r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
        {/* Progress */}
        <circle
          cx="50" cy="50" r={radius} fill="none"
          stroke={color}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          style={{
            transform: 'rotate(-90deg)',
            transformOrigin: 'center',
            transition: 'stroke-dashoffset 1s linear, stroke 0.5s ease',
            filter: `drop-shadow(0 0 6px ${color})`,
          }}
        />
      </svg>
      {/* Number */}
      <span
        className="font-display text-4xl tabular-nums z-10"
        style={{
          color,
          textShadow: `0 0 ${isUrgent ? '16px' : '8px'} ${color}`,
          transition: 'color 0.5s ease',
        }}>
        {timeLeft}
      </span>
    </div>
  );
}
