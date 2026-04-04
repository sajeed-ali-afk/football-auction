import React, { useEffect, useRef } from 'react';
import { formatBudget, generateAvatar } from '../../utils/helpers';

export default function BidHistory({ bids = [] }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [bids]);

  return (
    <div className="rounded-2xl overflow-hidden flex flex-col"
      style={{ background: '#0d0d2b', border: '1px solid rgba(255,255,255,0.07)', maxHeight: '280px' }}>
      <div className="px-4 py-3 border-b border-white/5 flex-shrink-0">
        <h3 className="font-display text-sm tracking-widest text-gray-400">BID HISTORY</h3>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {bids.length === 0 ? (
          <div className="text-center text-gray-600 text-xs py-6">No bids yet</div>
        ) : (
          [...bids].reverse().map((bid, i) => (
            <div key={i}
              className={`flex items-center gap-3 p-2 rounded-lg ${i === 0 ? 'bid-item' : ''}`}
              style={{
                background: i === 0 ? 'rgba(0,255,135,0.07)' : 'rgba(255,255,255,0.02)',
                border: `1px solid ${i === 0 ? 'rgba(0,255,135,0.15)' : 'rgba(255,255,255,0.04)'}`,
                animation: i === 0 ? 'bidFlash 0.5s ease-out' : 'none',
              }}>
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-dark-500 flex-shrink-0"
                style={{ background: generateAvatar(bid.username) }}>
                {bid.username?.[0]?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-sm font-semibold text-white truncate block">{bid.username}</span>
              </div>
              <div className="font-mono font-bold text-sm" style={{ color: '#00ff87' }}>
                £{formatBudget(bid.amount)}
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
