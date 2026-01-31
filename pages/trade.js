import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Head from 'next/head';
import Link from 'next/link';

export default function TradePage() {
  // --- State Management ---
  const [portfolio, setPortfolio] = useState(null);
  
  // Section 1: Stock Input
  const [stocks, setStocks] = useState([]);
  const [inputValue, setInputValue] = useState('');
  
  // Section 2: Capital Settings
  const [maxCapital, setMaxCapital] = useState('');
  const [tradeFrequency, setTradeFrequency] = useState(5);
  
  // Section 3: AI Suggestions
  const [suggestions, setSuggestions] = useState([]);
  
  // Section 4 & 5: Execution & Results
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState({}); // { [symbol]: analysisResult }
  const [error, setError] = useState('');
  
  // --- Effects ---
  useEffect(() => {
    fetchPortfolio();
    fetchSuggestions();
  }, []);

  // --- Data Fetching ---
  const fetchPortfolio = async () => {
    try {
      const res = await axios.get('/api/portfolio');
      setPortfolio(res.data.portfolio);
      // Default max capital to 10% of cash available if not set
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

  // --- Handlers ---
  
  // Stock Input Logic
  const handleAddStock = (e) => {
    if (e.key === 'Enter' || e.type === 'click') {
      e.preventDefault();
      if (!inputValue.trim()) return;
      
      const newStocks = inputValue
        .toUpperCase()
        .split(/[\s,]+/) // Split by space or comma
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

  // Run Agents Logic
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
    console.log('[Trade] Starting analysis for stocks:', stocks);

    try {
      // Parallel execution for all selected stocks
      const promises = stocks.map(symbol => {
        console.log(`[Trade] Sending request for ${symbol}...`);
        return axios.post('/api/run-agents', { 
          symbol, 
          portfolioId: portfolio?._id 
        })
        .then(res => {
          console.log(`[Trade] Received response for ${symbol}:`, res.data);
          return { symbol, data: res.data.decision };
        })
        .catch(err => {
          console.error(`[Trade] Error for ${symbol}:`, err.message);
          return { symbol, error: err.message };
        });
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
      
      console.log('[Trade] Final results to render:', newResults);
      setResults(newResults);
      
    } catch (err) {
      console.error(err);
      setError('Failed to run agents. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // --- UI Helpers ---
  const getActionColor = (action) => {
    switch (action) {
      case 'BUY': return 'bg-green-100 text-green-800 border-green-200';
      case 'SELL': return 'bg-red-100 text-red-800 border-red-200';
      case 'HOLD': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      <Head>
        <title>Trade Station | AI Portfolio Manager</title>
      </Head>

      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">AI Trade Station</h1>
            <Link href="/dashboard" className="text-sm text-slate-500 hover:text-blue-600 transition-colors">
              &larr; Dashboard
            </Link>
          </div>
          {portfolio && (
            <div className="flex items-center gap-6 text-sm">
              <div>
                <span className="text-slate-500 block text-xs uppercase tracking-wider">Cash Available</span>
                <span className="font-mono font-medium text-slate-900">${portfolio.cashAvailable.toLocaleString()}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-xs uppercase tracking-wider">Total Value</span>
                <span className="font-mono font-medium text-slate-900">${portfolio.totalValue.toLocaleString()}</span>
              </div>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Main Control Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          
          {/* Left Column: Inputs (Span 2) */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Section 1: Stock Input */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <span className="w-1 h-6 bg-blue-600 rounded-full"></span>
                Select Assets
              </h2>
              
              <div className="relative mb-4">
                <input 
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleAddStock}
                  placeholder="Type symbol and press Enter (e.g. AAPL, TSLA)"
                  className="w-full pl-4 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all uppercase placeholder:normal-case"
                />
                <button 
                  onClick={handleAddStock}
                  className="absolute right-2 top-2 p-1.5 text-slate-400 hover:text-blue-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                </button>
              </div>

              {/* Chips */}
              <div className="flex flex-wrap gap-2 min-h-[40px]">
                {stocks.length === 0 && <span className="text-slate-400 text-sm italic py-2">No stocks selected...</span>}
                {stocks.map(stock => (
                  <span key={stock} className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium border border-blue-100 animate-fadeIn">
                    {stock}
                    <button onClick={() => removeStock(stock)} className="hover:text-blue-900 ml-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </span>
                ))}
              </div>
              <p className="text-xs text-slate-400 mt-2 text-right">{stocks.length}/10 assets selected</p>
            </div>

            {/* Section 2: Capital Settings */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <span className="w-1 h-6 bg-purple-600 rounded-full"></span>
                Capital & Limits
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-2">Max Capital Allocation</label>
                  <div className="relative">
                    <span className="absolute left-4 top-3 text-slate-400">$</span>
                    <input 
                      type="number"
                      value={maxCapital}
                      onChange={(e) => setMaxCapital(e.target.value)}
                      className="w-full pl-8 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all"
                      placeholder="0.00"
                    />
                  </div>
                  <p className="text-xs text-slate-400 mt-1">Cannot exceed ${portfolio?.cashAvailable?.toLocaleString() || '0'}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-2">
                    Daily Trade Limit
                    <span className="ml-2 inline-block w-4 h-4 text-slate-400 cursor-help" title="Max number of trades AI can execute today">ⓘ</span>
                  </label>
                  <input 
                    type="number"
                    min="1"
                    max="20"
                    value={tradeFrequency}
                    onChange={(e) => setTradeFrequency(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all"
                  />
                  <div className="flex justify-between text-xs text-slate-400 mt-1">
                    <span>1 (Conservative)</span>
                    <span>20 (Aggressive)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 4: Run Button & Errors */}
            {error && (
              <div className="bg-red-50 text-red-700 p-4 rounded-lg border border-red-100 flex items-center gap-3">
                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                {error}
              </div>
            )}

            <button
              onClick={runAgents}
              disabled={loading}
              className={`w-full py-4 rounded-xl text-white font-semibold text-lg shadow-lg shadow-blue-500/20 transition-all transform hover:scale-[1.01] active:scale-[0.99]
                ${loading 
                  ? 'bg-slate-800 cursor-wait opacity-80' 
                  : 'bg-gradient-to-r from-slate-900 to-slate-800 hover:from-slate-800 hover:to-slate-700'
                }`}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  AI Analyzing Market...
                </span>
              ) : (
                'Run AI Agents'
              )}
            </button>

          </div>

          {/* Right Column: AI Suggestions (Span 1) */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 h-full">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-semibold text-slate-800">AI Opportunities</h2>
                <button onClick={fetchSuggestions} className="text-slate-400 hover:text-blue-600 transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                </button>
              </div>

              <div className="space-y-4">
                {suggestions.map((item) => (
                  <div key={item.symbol} className="group p-4 rounded-lg border border-slate-100 hover:border-blue-200 hover:bg-blue-50/50 transition-all">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <span className="font-bold text-slate-800">{item.symbol}</span>
                        <span className="text-xs text-slate-500 block">${item.price}</span>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide
                        ${item.trend === 'up' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {item.trend}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mb-3 leading-relaxed">{item.reason}</p>
                    <button 
                      onClick={() => addSuggestion(item.symbol)}
                      className="w-full py-2 text-xs font-medium text-blue-600 bg-blue-50 rounded hover:bg-blue-100 transition-colors"
                    >
                      Add to List
                    </button>
                  </div>
                ))}
                {suggestions.length === 0 && <p className="text-slate-400 text-center py-4">No suggestions available.</p>}
              </div>
            </div>
          </div>

        </div>

        {/* Section 5: Results Display */}
        {Object.keys(results).length > 0 && (
          <div className="animate-fadeIn">
            <h2 className="text-2xl font-bold text-slate-800 mb-6 border-l-4 border-slate-800 pl-4">Analysis Results</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Object.keys(results).map(symbol => {
                const result = results[symbol];
                
                if (result.status === 'error') {
                    return (
                        <div key={symbol} className="bg-white rounded-xl shadow-sm border border-red-200 overflow-hidden">
                            <div className="p-6 border-b border-red-100 flex justify-between items-center bg-red-50">
                                <h3 className="text-xl font-bold text-red-900">{symbol}</h3>
                                <div className="px-3 py-1 rounded-full text-xs font-bold border bg-red-100 text-red-800 border-red-200">
                                    ERROR
                                </div>
                            </div>
                            <div className="p-6 text-red-600 text-sm">
                                <p className="font-semibold mb-2">Analysis Failed:</p>
                                <p>{result.error}</p>
                            </div>
                        </div>
                    );
                }

                const data = result.data;
                return (
                  <div key={symbol} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow">
                    <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                      <h3 className="text-xl font-bold text-slate-900">{symbol}</h3>
                      <div className={`px-3 py-1 rounded-full text-xs font-bold border ${getActionColor(data.action)}`}>
                        {data.action}
                      </div>
                    </div>
                    
                    <div className="p-6 space-y-4">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-slate-500">Confidence</span>
                          <span className="font-medium text-slate-900">{(data.confidence * 100).toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${data.confidence > 0.7 ? 'bg-green-500' : data.confidence > 0.4 ? 'bg-yellow-500' : 'bg-red-500'}`} 
                            style={{ width: `${data.confidence * 100}%` }}
                          ></div>
                        </div>
                      </div>

                      <div>
                        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Reasoning</h4>
                        <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100">
                          {data.reason}
                        </p>
                      </div>

                      {data.subDecisions && (
                         <div className="pt-2 border-t border-slate-100 mt-4">
                           <div className="flex flex-wrap gap-2">
                             {data.subDecisions.map((sub, i) => (
                               <span key={i} className="text-[10px] px-2 py-1 bg-slate-100 text-slate-600 rounded">
                                 {sub.agent}: {sub.action}
                               </span>
                             ))}
                           </div>
                         </div>
                      )}

                      {/* Execute Button */}
                      {(data.action === 'BUY' || data.action === 'SELL') && (
                        <div className="mt-4 pt-4 border-t border-slate-100">
                            <button
                                onClick={() => executeTrade(symbol, data)}
                                className={`w-full py-2 rounded-lg font-bold text-white transition-colors
                                    ${data.action === 'BUY' 
                                        ? 'bg-green-600 hover:bg-green-700 shadow-green-200' 
                                        : 'bg-red-600 hover:bg-red-700 shadow-red-200'} shadow-md`}
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

      </main>
    </div>
  );
}
