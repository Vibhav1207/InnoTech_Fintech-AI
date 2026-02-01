import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useAgent } from '../context/AgentContext';
import axios from 'axios';
import StopModal from '../components/StopModal';

export default function TradePage() {
  const { session, startAgent, stopAgent, isLooping, cooldown, modalState, closeModal, portfolio } = useAgent();
  
  const [wishlist, setWishlist] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [maxCapital, setMaxCapital] = useState(1000);
  const [maxTrades, setMaxTrades] = useState(5);
  const [suggestions, setSuggestions] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const prevSessionRef = React.useRef(null);

  useEffect(() => {
    if (session) {
      if (session.wishlist && session.wishlist.length > 0 && JSON.stringify(session.wishlist) !== JSON.stringify(prevSessionRef.current?.wishlist)) {
          setWishlist(session.wishlist);
      }
      if (session.maxCapital && session.maxCapital !== prevSessionRef.current?.maxCapital) {
          setMaxCapital(session.maxCapital);
      }
      if (session.maxTradesPerDay && session.maxTradesPerDay !== prevSessionRef.current?.maxTradesPerDay) {
          setMaxTrades(session.maxTradesPerDay);
      }
      prevSessionRef.current = session;
    }
  }, [session]);

  useEffect(() => {
    async function fetchSuggestions() {
      try {
        const res = await axios.get('/api/suggestions').catch(() => ({ data: { suggestions: ['NVDA', 'AMD', 'PLTR', 'COIN'] } }));
        setSuggestions(res.data.suggestions || []);
      } catch (e) { console.error(e); }
    }
    fetchSuggestions();
  }, []);

  const handleAddStock = (e) => {
    if ((e.key === 'Enter' || e.type === 'click') && inputValue.trim()) {
      e.preventDefault();
      const symbol = inputValue.toUpperCase().trim();
      
      if (!/^[A-Z]{1,5}$/.test(symbol)) {
          setError('Invalid stock symbol format.');
          return;
      }

      if (!wishlist.includes(symbol)) {
        setWishlist([...wishlist, symbol]);
        setError('');
      } else {
        setError('Symbol already in wishlist.');
      }
      setInputValue('');
    }
  };

  const removeStock = (s) => setWishlist(wishlist.filter(item => item !== s));

  const handleStart = async () => {
    if (wishlist.length === 0) {
      setError('Please add at least one stock to the wishlist.');
      return;
    }
    if (!portfolio) {
      setError('Loading portfolio data... please wait.');
      return;
    }
    if (Number(maxCapital) > portfolio.cashAvailable) {
        setError(`Insufficient funds. Available cash: $${portfolio.cashAvailable.toFixed(2)}`);
        return;
    }
    setError('');
    setLoading(true);
    try {
      await startAgent({
        wishlist,
        maxCapital: Number(maxCapital),
        maxTradesPerDay: Number(maxTrades)
      });
    } catch (e) {
      console.error(e);
      setError('Failed to start agent');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    if (confirm('Are you sure you want to RESET the account? This will wipe all data.')) {
        try {
            await axios.post('/api/account/reset');
            window.location.reload();
        } catch (e) {
            alert('Failed to reset account');
        }
    }
  };

  const isLimitReached = session && session.tradesUsedToday >= session.maxTradesPerDay;
  const isCapitalInvalid = portfolio && Number(maxCapital) > portfolio.cashAvailable;

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-6">
      <Head>
        <title>Trade Configuration | InnoTech AI</title>
      </Head>

      <StopModal 
        isOpen={modalState.isOpen} 
        reason={modalState.reason} 
        stats={modalState.stats} 
        onClose={closeModal} 
      />

      <div className="max-w-4xl mx-auto space-y-8">
        <header className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-blue-400">Agent Configuration</h1>
            <p className="text-slate-400">Configure your AI agent's trading parameters and wishlist.</p>
          </div>
          <button onClick={handleReset} className="text-xs text-slate-500 hover:text-red-500 underline">
            Reset Account
          </button>
        </header>

        {/* Status Panel */}
        <div className={`p-6 rounded-xl border ${isLooping ? 'border-green-500/30 bg-green-500/10' : 'border-slate-700 bg-slate-800'}`}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold flex items-center gap-2">
                Status: 
                <span className={isLooping ? 'text-green-400' : 'text-slate-400'}>
                  {isLooping ? 'RUNNING' : 'STOPPED'}
                </span>
              </h2>
              {isLooping && (
                <div className="mt-1">
                  <p className="text-sm text-slate-300">
                    Cooldown: <span className="font-mono text-blue-300">{cooldown}s</span>
                  </p>
                  {session && (
                     <div className="mt-2 text-xs font-mono bg-slate-900/50 p-2 rounded inline-block">
                        <span className="text-green-400 mr-3">Consecutive Wins: {session.consecutiveWins || 0}</span>
                        <span className={`${(session.consecutiveLosses || 0) >= 2 ? 'text-red-500 font-bold animate-pulse' : 'text-red-400'}`}>
                            Consecutive Losses: {session.consecutiveLosses || 0}/3
                        </span>
                     </div>
                  )}
                </div>
              )}
            </div>
            <div className="flex gap-4">
              {!isLooping ? (
                <button 
                  onClick={handleStart}
                  disabled={loading || isLimitReached || isCapitalInvalid}
                  className={`px-6 py-3 text-white font-bold rounded-lg transition-all shadow-lg shadow-blue-900/20 ${
                    loading || isLimitReached || isCapitalInvalid ? 'bg-slate-700 cursor-not-allowed opacity-50' : 'bg-blue-600 hover:bg-blue-500'
                  }`}
                >
                  {loading ? 'STARTING...' : isLimitReached ? 'LIMIT REACHED' : isCapitalInvalid ? 'INSUFFICIENT FUNDS' : '▶ START AGENT'}
                </button>
              ) : (
                <button 
                  onClick={stopAgent}
                  className="px-6 py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg transition-all shadow-lg shadow-red-900/20"
                >
                  ⏹ STOP AGENT
                </button>
              )}
            </div>
          </div>
          {error && <p className="mt-4 text-red-400 bg-red-900/20 p-2 rounded">{error}</p>}
        </div>

        {/* Configuration Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Wishlist Section */}
          <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
            <h3 className="text-lg font-semibold text-blue-300 mb-4">Stock Wishlist</h3>
            
            <div className="flex gap-2 mb-4">
              <input 
                type="text" 
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleAddStock}
                placeholder="e.g. AAPL"
                className="flex-1 bg-slate-900 border border-slate-600 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500"
                disabled={isLooping}
              />
              <button 
                onClick={handleAddStock}
                className="px-4 py-2 border border-blue-500 text-blue-400 hover:bg-blue-500 hover:text-white rounded-lg transition-all"
                disabled={isLooping}
              >
                ADD
              </button>
            </div>

            <div className="flex flex-wrap gap-2 min-h-[100px] content-start">
              {wishlist.map(s => (
                <span key={s} className="px-3 py-1 bg-slate-700 rounded-full text-sm flex items-center gap-2">
                  {s}
                  {!isLooping && (
                    <button onClick={() => removeStock(s)} className="text-slate-400 hover:text-red-400">×</button>
                  )}
                </span>
              ))}
              {wishlist.length === 0 && <span className="text-slate-500 italic">No stocks added yet.</span>}
            </div>

            {/* Suggestions */}
            <div className="mt-6 pt-4 border-t border-slate-700">
              <p className="text-xs text-slate-400 mb-2 uppercase tracking-wider">AI Suggestions</p>
              <div className="flex flex-wrap gap-2">
                {suggestions.map((s, i) => {
                  const symbol = typeof s === 'string' ? s : s.symbol;
                  return (
                    <button 
                      key={symbol} 
                      onClick={() => !isLooping && !wishlist.includes(symbol) && setWishlist([...wishlist, symbol])}
                      className="px-2 py-1 bg-slate-700/50 hover:bg-blue-900/30 text-xs rounded border border-slate-600 hover:border-blue-500 transition-colors"
                      disabled={isLooping}
                    >
                      + {symbol}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Capital Settings */}
          <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
            <h3 className="text-lg font-semibold text-green-300 mb-4">Risk & Capital</h3>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Max Capital Allocation ($)</label>
                <div className="flex flex-col gap-1">
                  <input 
                    type="number" 
                    value={maxCapital}
                    onChange={(e) => setMaxCapital(e.target.value)}
                    className={`w-full bg-slate-900 border rounded-lg px-4 py-2 focus:outline-none font-mono ${
                      isCapitalInvalid 
                        ? 'border-red-500 focus:border-red-500 text-red-100' 
                        : 'border-slate-600 focus:border-green-500'
                    }`}
                    disabled={isLooping}
                  />
                  {portfolio && (
                      <span className={`text-xs ${isCapitalInvalid ? 'text-red-400 font-bold' : 'text-green-400'}`}>
                          Available: ${portfolio.cashAvailable.toFixed(2)}
                      </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-1">Maximum cash the agent can use per loop.</p>
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-1">Max Trades Per Day</label>
                <input 
                  type="number" 
                  value={maxTrades}
                  onChange={(e) => setMaxTrades(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2 focus:outline-none focus:border-green-500 font-mono"
                  disabled={isLooping}
                />
                <p className="text-xs text-slate-500 mt-1">Hard limit to prevent overtrading.</p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
