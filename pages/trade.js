import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Head from 'next/head';
import Link from 'next/link';

export default function TradePage() {
  const [portfolio, setPortfolio] = useState(null);
  const [stocks, setStocks] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [maxCapital, setMaxCapital] = useState('');
  const [tradeFrequency, setTradeFrequency] = useState(5);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState({});
  const [error, setError] = useState('');
  

  useEffect(() => {
    fetchPortfolio();
    fetchSuggestions();
  }, []);

  const fetchPortfolio = async () => {
    try {
      const res = await axios.get('/api/portfolio');
      setPortfolio(res.data.portfolio);
      if (!maxCapital && res.data.portfolio) {
        setMaxCapital(Math.floor(res.data.portfolio.cashAvailable * 0.1));
      }
    } catch (err) {
      console.error('Error fetching portfolio:', err);
    }
  };

  const fetchSuggestions = async () => {
    try {
      const res = await axios.get('/api/suggestions');
      setSuggestions(res.data.suggestions);
    } catch (err) {
      console.error('Error fetching suggestions:', err);
    }
  };

  const handleAddStock = (e) => {
    if (e.key === 'Enter' || e.type === 'click') {
      e.preventDefault();
      if (!inputValue.trim()) return;
      
      const newStocks = inputValue
        .toUpperCase()
        .split(/[\s,]+/)
        .filter(s => s && !stocks.includes(s));
        
      if (stocks.length + newStocks.length > 10) {
        setError('Maximum 10 stocks allowed.');
        return;
      }
      
      setStocks([...stocks, ...newStocks]);
      setInputValue('');
      setError('');
    }
  };

  const removeStock = (symbol) => {
    setStocks(stocks.filter(s => s !== symbol));
  };

  const addSuggestion = (symbol) => {
    if (!stocks.includes(symbol)) {
      if (stocks.length >= 10) {
        setError('Maximum 10 stocks allowed.');
        return;
      }
      setStocks([...stocks, symbol]);
    }
  };

  const runAgents = async () => {
    setError('');
    if (stocks.length === 0) {
      setError('Please select at least one stock.');
      return;
    }
    if (!maxCapital || Number(maxCapital) <= 0) {
      setError('Please enter a valid capital amount.');
      return;
    }
    if (portfolio && Number(maxCapital) > portfolio.cashAvailable) {
      setError('Capital exceeds available cash.');
      return;
    }

    setLoading(true);
    setResults({});
    
    // Smooth scroll to results area
    setTimeout(() => {
        window.scrollTo({ top: 500, behavior: 'smooth' });
    }, 100);

    try {
      const promises = stocks.map(symbol => {
        return axios.post('/api/run-agents', {
          symbol,
          portfolioId: portfolio?._id
        })
        .then(res => ({ symbol, data: res.data.decision }))
        .catch(err => ({ symbol, error: err.message }));
      });

      const responses = await Promise.all(promises);
      
      const newResults = {};
      responses.forEach(r => {
        if (r.data) {
            newResults[r.symbol] = { status: 'success', data: r.data };
        } else {
            newResults[r.symbol] = { status: 'error', error: r.error };
        }
      });
      
      setResults(newResults);
      
    } catch (err) {
      console.error(err);
      setError('Failed to run agents. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // --- UI Helpers ---
  const getActionStyles = (action) => {
    switch (action) {
      case 'BUY': return 'bg-green-900/30 text-green-400 border-green-900';
      case 'SELL': return 'bg-red-900/30 text-red-400 border-red-900';
      case 'HOLD': return 'bg-blue-900/30 text-blue-400 border-blue-900';
      default: return 'bg-slate-700 text-slate-400 border-slate-600';
    }
  };

  return (
    <div className="space-y-6">
      <Head>
        <title>Trade Station | InnoTech</title>
      </Head>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-semibold text-white tracking-tight flex items-center gap-3">
             <span className="p-1.5 bg-blue-600 rounded">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
             </span>
             Trade Station
          </h1>
          <p className="text-slate-400 text-sm mt-1 ml-1">Configure parameters and launch trading algorithms.</p>
        </div>
        
        {portfolio && (
          <div className="flex gap-6 bg-slate-800/50 p-3 rounded-lg border border-slate-700">
            <div>
              <span className="text-slate-500 block text-[10px] uppercase tracking-wider mb-1">Cash Available</span>
              <span className="font-mono text-lg font-bold text-white">${portfolio.cashAvailable.toLocaleString()}</span>
            </div>
            <div className="w-px bg-slate-700"></div>
            <div>
              <span className="text-slate-500 block text-[10px] uppercase tracking-wider mb-1">Total Value</span>
              <span className="font-mono text-lg font-bold text-blue-400">${portfolio.totalValue.toLocaleString()}</span>
            </div>
          </div>
        )}
      </div>

      
      {/* Main Control Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Inputs (Span 2) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Section 1: Stock Input */}
          <div className="bg-slate-800 border border-slate-700 p-6 rounded-lg">
            <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-3 uppercase tracking-wider">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-700 text-white text-xs font-bold">1</span>
              Asset Selection
            </h2>
            
            <div className="relative mb-4 group">
              <input 
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleAddStock}
                placeholder="ENTER SYMBOL (e.g. AAPL, BTC, TSLA)..."
                className="w-full pl-4 pr-12 py-3 bg-slate-900 border border-slate-700 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all uppercase placeholder:normal-case text-white text-sm"
              />
              <button 
                onClick={handleAddStock}
                className="absolute right-2 top-2 p-1 text-slate-400 hover:text-white bg-slate-800 hover:bg-blue-600 rounded transition-all"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              </button>
            </div>

            {/* Chips */}
            <div className="flex flex-wrap gap-2 min-h-[40px] p-3 bg-slate-900 rounded-lg border border-dashed border-slate-700">
              {stocks.length === 0 && <span className="text-slate-500 text-xs italic self-center">No assets selected yet...</span>}
              {stocks.map(stock => (
                <span key={stock} className="inline-flex items-center gap-2 px-2 py-1 bg-blue-900/30 text-blue-300 rounded text-xs font-bold border border-blue-900/50 cursor-default">
                  {stock}
                  <button onClick={() => removeStock(stock)} className="hover:text-white transition-colors">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </span>
              ))}
            </div>
            <p className="text-[10px] text-slate-500 mt-2 text-right">{stocks.length}/10 assets selected</p>
          </div>

          {/* Section 2: Capital Settings */}
          <div className="bg-slate-800 border border-slate-700 p-6 rounded-lg">
            <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-3 uppercase tracking-wider">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-700 text-white text-xs font-bold">2</span>
              Risk & Allocation
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">Max Capital per Trade</label>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-slate-500 text-sm">$</span>
                  <input 
                    type="number"
                    value={maxCapital}
                    onChange={(e) => setMaxCapital(e.target.value)}
                    className="w-full pl-6 pr-3 py-2.5 bg-slate-900 border border-slate-700 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-white font-mono text-sm"
                    placeholder="0.00"
                  />
                </div>
                <div className="mt-1 flex justify-between text-[10px] text-slate-500">
                   <span>Available: ${portfolio?.cashAvailable?.toLocaleString() || '0'}</span>
                   <button onClick={() => setMaxCapital(portfolio?.cashAvailable || 0)} className="text-blue-400 hover:text-blue-300">Max</button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">
                  Aggression Level (1-20)
                </label>
                <input 
                  type="number"
                  min="1"
                  max="20"
                  value={tradeFrequency}
                  onChange={(e) => setTradeFrequency(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-white font-mono text-sm"
                />
                <div className="w-full bg-slate-900 h-1 mt-3 rounded-full overflow-hidden">
                    <div className="bg-blue-600 h-full transition-all duration-300" style={{ width: `${(tradeFrequency / 20) * 100}%` }}></div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: Run Button & Errors */}
          {error && (
            <div className="bg-red-900/20 text-red-400 p-3 rounded-lg border border-red-900/30 flex items-center gap-3 animate-fadeIn text-sm">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              {error}
            </div>
          )}

          <button
            onClick={runAgents}
            disabled={loading}
            className={`w-full py-4 rounded-lg font-bold text-sm shadow-sm transition-all transform active:scale-[0.99] relative overflow-hidden group
              ${loading 
                ? 'bg-slate-700 cursor-wait opacity-70' 
                : 'bg-blue-600 hover:bg-blue-500 text-white'
              }`}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing Market Data...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                 <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                 RUN ANALYSIS
              </span>
            )}
          </button>

        </div>

        {/* Right Column: AI Suggestions (Span 1) */}
        <div className="lg:col-span-1">
          <div className="bg-slate-800 border border-slate-700 rounded-lg h-full flex flex-col">
            <div className="p-4 border-b border-slate-700 flex justify-between items-center">
              <h2 className="text-sm font-semibold text-white flex items-center gap-2 uppercase tracking-wider">
                 <svg className="w-4 h-4 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                 Market Opportunities
              </h2>
              <button onClick={fetchSuggestions} className="text-slate-400 hover:text-white transition-colors p-1.5 hover:bg-slate-700 rounded">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
              </button>
            </div>

            <div className="p-4 space-y-3">
              {suggestions.map((item) => (
                <div key={item.symbol} className="group p-3 rounded-lg border border-slate-700 bg-slate-900/50 hover:bg-slate-800 hover:border-slate-600 transition-all cursor-pointer" onClick={() => addSuggestion(item.symbol)}>
                  <div className="flex justify-between items-start mb-1">
                    <div>
                      <span className="font-bold text-white text-sm">{item.symbol}</span>
                      <span className="text-[10px] text-slate-500 block font-mono">${item.price}</span>
                    </div>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border
                      ${item.trend === 'up' ? 'bg-green-900/20 text-green-400 border-green-900/30' : 'bg-red-900/20 text-red-400 border-red-900/30'}`}>
                      {item.trend}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 mb-2 leading-relaxed">{item.reason}</p>
                  <div className="flex justify-end">
                      <span className="text-[10px] text-blue-400 font-bold border border-blue-400 rounded px-2 py-1 group-hover:bg-blue-400 group-hover:text-white transition-all flex items-center gap-1">
                          ADD &rarr;
                      </span>
                  </div>
                </div>
              ))}
              {suggestions.length === 0 && <p className="text-slate-500 text-center py-8 italic text-xs">Scanning market data...</p>}
            </div>
          </div>
        </div>

      </div>

      {/* Section 5: Results Display */}
      {Object.keys(results).length > 0 && (
        <div className="animate-fadeIn pt-8 border-t border-slate-800 mt-8">
          <h2 className="text-xl font-bold text-white mb-6 pl-3 border-l-4 border-blue-500 flex items-center justify-between">
             <span>Analysis Results</span>
             <span className="text-xs font-normal text-slate-400 bg-slate-800 px-2 py-1 rounded-full">{Object.keys(results).length} processed</span>
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Object.keys(results).map(symbol => {
              const result = results[symbol];
              
              if (result.status === 'error') {
                  return (
                      <div key={symbol} className="bg-slate-900 rounded-lg border border-red-900/50 overflow-hidden">
                          <div className="p-4 border-b border-red-900/30 flex justify-between items-center bg-red-900/10">
                              <h3 className="text-lg font-bold text-red-400">{symbol}</h3>
                              <div className="px-2 py-0.5 rounded text-[10px] font-bold border bg-red-900/20 text-red-400 border-red-900/30">
                                  FAILED
                              </div>
                          </div>
                          <div className="p-4 text-red-400 text-xs">
                              <p className="font-semibold mb-1">Error Details:</p>
                              <p className="opacity-80">{result.error}</p>
                          </div>
                      </div>
                  );
              }

              const data = result.data;
              return (
                <div key={symbol} className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden hover:border-slate-500 transition-colors group">
                  <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-900/30">
                    <h3 className="text-lg font-bold text-white tracking-tight">{symbol}</h3>
                    <div className={`px-3 py-1 rounded text-[10px] font-bold border tracking-wider ${getActionStyles(data.action)}`}>
                      {data.action}
                    </div>
                  </div>
                  
                  <div className="p-4 space-y-4">
                    {/* Confidence Meter */}
                    <div>
                      <div className="flex justify-between text-xs mb-1.5">
                        <span className="text-slate-400 uppercase font-semibold tracking-wider">Confidence</span>
                        <span className="font-mono text-white">{(data.confidence * 100).toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-1000 ease-out rounded-full ${data.confidence > 0.7 ? 'bg-green-500' : data.confidence > 0.4 ? 'bg-yellow-500' : 'bg-red-500'}`} 
                          style={{ width: `${data.confidence * 100}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Reasoning Box */}
                    <div className="bg-slate-900/50 p-3 rounded border border-slate-700/50">
                      <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 flex items-center gap-2">
                        <span className="w-1 h-1 rounded-full bg-blue-500"></span>
                        Strategy
                      </h4>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        {data.reason}
                      </p>
                    </div>

                    {/* Sub-Decisions (Agent Votes) */}
                    {data.subDecisions && (
                       <div className="space-y-1.5">
                         <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Consensus</h4>
                         <div className="grid grid-cols-2 gap-2">
                           {data.subDecisions.map((sub, i) => (
                             <div key={i} className="flex justify-between items-center px-2 py-1.5 bg-slate-900/30 rounded border border-slate-700/30 text-[10px]">
                               <span className="text-slate-400 capitalize">{sub.agent}</span>
                               <span className={`font-bold ${
                                 sub.action === 'BUY' ? 'text-green-400' : 
                                 sub.action === 'SELL' ? 'text-red-400' : 'text-blue-400'
                               }`}>{sub.action}</span>
                             </div>
                           ))}
                         </div>
                       </div>
                    )}

                    {/* Action Button */}
                    {(data.action === 'BUY' || data.action === 'SELL') && (
                      <div className="pt-2 mt-2">
                          <button
                              onClick={() => console.log('Execute not implemented in UI yet')} 
                              className={`w-full py-2.5 rounded font-bold text-xs text-white transition-all transform hover:scale-[1.01] active:scale-[0.99] shadow-sm
                                  ${data.action === 'BUY' 
                                      ? 'bg-green-600 hover:bg-green-500' 
                                      : 'bg-red-600 hover:bg-red-500'}`}
                          >
                              EXECUTE {data.action}
                          </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
}
