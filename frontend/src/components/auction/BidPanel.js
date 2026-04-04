import React, { useState } from 'react';
import { formatBudget } from '../../utils/helpers';

const QUICK_INCREMENTS = [0.5, 1, 2, 5];

export default function BidPanel({ currentBid, myBudget, onBid, disabled, currentBidder, myUsername, minIncrement = 0.5 }) {
  const [customBid, setCustomBid] = useState('');
  const isTopBidder = currentBidder === myUsername;
  const minBid = currentBidder ? currentBid + minIncrement : currentBid;

  const handleQuickBid = (amount) => {
    const bid = Math.round((currentBid + amount) * 10) / 10;
    if (bid > myBudget) return;
    onBid(bid);
    setCustomBid('');
  };

  const handleCustomBid = (e) => {
    e.preventDefault();
    const amt = parseFloat(customBid);
    if (isNaN(amt) || amt < minBid) return;
    onBid(Math.round(amt * 10) / 10);
    setCustomBid('');
  };

  return (
    <div className="rounded-2xl overflow-hidden"
      style={{ background: '#0d0d2b', border: '1px solid rgba(255,255,255,0.07)' }}>
      {/* Current bid display */}
      <div className="p-4 border-b border-white/5">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs text-gray-500 tracking-widest mb-1">CURRENT BID</p>
            <p className="font-display text-4xl tracking-wider"
              style={{ color: '#00ff87', textShadow: '0 0 20px rgba(0,255,135,0.4)' }}>
              £{formatBudget(currentBid)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500 mb-1">YOUR BUDGET</p>
            <p className="font-mono font-bold text-lg"
              style={{ color: myBudget < 10 ? '#ff3d3d' : '#e2e8f0' }}>
              £{formatBudget(myBudget)}
            </p>
          </div>
        </div>

        {isTopBidder && (
          <div className="mt-3 px-3 py-2 rounded-lg text-center text-xs font-semibold animate-pulse"
            style={{ background: 'rgba(0,255,135,0.1)', border: '1px solid rgba(0,255,135,0.3)', color: '#00ff87' }}>
            🏆 You are the highest bidder!
          </div>
        )}
        {currentBidder && !isTopBidder && (
          <div className="mt-3 px-3 py-2 rounded-lg text-center text-xs text-gray-500"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
            Highest: <span className="text-neon-blue font-semibold">{currentBidder}</span>
          </div>
        )}
      </div>

      {/* Quick bid buttons */}
      <div className="p-4 space-y-3">
        <p className="text-xs text-gray-500 tracking-widest">QUICK BID (+M)</p>
        <div className="grid grid-cols-4 gap-2">
          {QUICK_INCREMENTS.map(inc => {
            const bidAmount = Math.round((currentBid + inc) * 10) / 10;
            const canAfford = bidAmount <= myBudget;
            return (
              <button
                key={inc}
                onClick={() => handleQuickBid(inc)}
                disabled={disabled || !canAfford || isTopBidder}
                className="py-2 rounded-xl text-sm font-bold transition-all active:scale-95"
                style={{
                  background: canAfford && !disabled && !isTopBidder
                    ? 'rgba(0,255,135,0.1)' : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${canAfford && !disabled && !isTopBidder
                    ? 'rgba(0,255,135,0.3)' : 'rgba(255,255,255,0.06)'}`,
                  color: canAfford && !disabled && !isTopBidder ? '#00ff87' : '#374151',
                  cursor: (!canAfford || disabled || isTopBidder) ? 'not-allowed' : 'pointer',
                }}>
                +{inc}
              </button>
            );
          })}
        </div>

        {/* Custom bid */}
        <form onSubmit={handleCustomBid} className="flex gap-2">
          <input
            type="number"
            className="input-dark flex-1 text-sm"
            placeholder={`Min £${formatBudget(minBid)}`}
            value={customBid}
            onChange={e => setCustomBid(e.target.value)}
            step="0.5"
            min={minBid}
            max={myBudget}
            disabled={disabled || isTopBidder}
          />
          <button
            type="submit"
            disabled={disabled || isTopBidder || !customBid}
            className="btn-solid px-4 rounded-xl text-sm font-bold disabled:opacity-30 disabled:cursor-not-allowed">
            BID
          </button>
        </form>

        {disabled && (
          <p className="text-center text-xs text-gray-600">No active auction</p>
        )}
      </div>
    </div>
  );
}
