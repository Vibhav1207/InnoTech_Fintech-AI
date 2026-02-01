import React from 'react';

export default function StopModal({ isOpen, reason, stats, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-slate-800 rounded-2xl border border-red-500/50 shadow-2xl max-w-md w-full p-6 relative animate-in fade-in zoom-in duration-200">
        
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Agent Stopped</h2>
            <p className="text-red-400 text-sm font-medium">{reason}</p>
          </div>
        </div>

        {/* Stats */}
        <div className="bg-slate-900/50 rounded-xl p-4 mb-6 space-y-3 border border-slate-700">
          <div className="flex justify-between items-center">
            <span className="text-slate-400 text-sm">Session PnL</span>
            <span className={`font-mono font-bold ${stats.lastPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {stats.lastPnL >= 0 ? '+' : ''}{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(stats.lastPnL)}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-400 text-sm">Trades Today</span>
            <span className="text-white font-mono">{stats.tradesUsedToday} / {stats.maxTradesPerDay}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-400 text-sm">Streak</span>
            <div className="flex gap-2 text-xs">
              <span className="bg-green-900/30 text-green-400 px-2 py-0.5 rounded border border-green-900/50">W: {stats.wins}</span>
              <span className="bg-red-900/30 text-red-400 px-2 py-0.5 rounded border border-red-900/50">L: {stats.losses}</span>
            </div>
          </div>
        </div>

        {/* Action */}
        <button 
          onClick={onClose}
          className="w-full py-3 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-xl transition-colors"
        >
          Acknowledge & View Dashboard
        </button>

        <p className="text-center text-xs text-slate-500 mt-4">
          You can restart the agent tomorrow or after resetting the limits.
        </p>
      </div>
    </div>
  );
}
