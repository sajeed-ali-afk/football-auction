import React from 'react';

export default function LoadingSpinner({ size = 'md', text = '' }) {
  const sizes = { sm: 'w-6 h-6', md: 'w-12 h-12', lg: 'w-20 h-20' };
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
      <div className={`${sizes[size]} relative`}>
        <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-neon-green animate-spin" />
        <div className="absolute inset-1 rounded-full border-2 border-transparent border-t-neon-blue animate-spin" style={{ animationDirection: 'reverse', animationDuration: '0.7s' }} />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-neon-green text-xs">⚽</span>
        </div>
      </div>
      {text && <p className="text-gray-400 font-body text-sm tracking-wider">{text}</p>}
    </div>
  );
}
