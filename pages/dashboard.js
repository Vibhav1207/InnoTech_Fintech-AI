import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';

export default function Dashboard() {
  const [portfolio, setPortfolio] = useState(null);
  const [positions, setPositions] = useState([]);
  const [decisions, setDecisions] = useState([]);
  const [logs, setLogs] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const fetchData = async () => {
    try {
      const portRes = await fetch('/api/portfolio');
      const portData = await portRes.json();
      if (portData.success) {
        setPortfolio(portData.portfolio);
        setPositions(portData.positions);
      }

      const decRes = await fetch('/api/decisions');
      const decData = await decRes.json();
      if (decData.success) {
        setDecisions(decData.decisions);
      }

      const logRes = await fetch('/api/logs');
      const logData = await logRes.json();
      if (logData.success) {
        setLogs(logData.logs);
      }

      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, []);

  const chartData = React.useMemo(() => {
    if (!logs.length) return [];
    
    const sortedLogs = [...logs].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    
    let cumulativePnL = 0;
    return sortedLogs
      .filter(l => l.action === 'SELL')
      .map(log => {
        cumulativePnL += (log.pnl || 0);
        return {
          time: new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          pnl: cumulativePnL,
          symbol: log.symbol
        };
      });
  }, [logs]);

  // Loading State
  if (!portfolio) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 font-medium">Loading Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Head>
        <title>Dashboard | InnoTech</title>
      </Head>

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-semibold text-white tracking-tight">Market Overview</h1>
          <p className="text-slate-400 text-sm mt-1">
            System Status: <span className="text-green-500 font-medium">Operational</span> • Sync: <span className="font-mono text-slate-300">{lastUpdated.toLocaleTimeString()}</span>
          </p>
        </div>
        <div className="flex gap-2">
            <button onClick={fetchData} className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-sm transition-colors border border-slate-700 font-medium">
                Refresh
            </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Value Card */}
        <div className="bg-slate-800 border border-slate-700 p-5 rounded-lg">
          <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Total Equity</p>
          <div className="flex items-baseline gap-2 mt-1">
             <p className="text-2xl font-bold text-white font-mono-numbers">
                ${portfolio.totalValue?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
             </p>
          </div>
          <div className="mt-3 text-xs flex items-center gap-2">
             <span className="text-green-500 flex items-center font-medium">
                <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
                +0.00%
             </span>
             <span className="text-slate-500">Today</span>
          </div>
        </div>

        {/* Cash Card */}
        <div className="bg-slate-800 border border-slate-700 p-5 rounded-lg">
          <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Buying Power</p>
          <div className="flex items-baseline gap-2 mt-1">
            <p className="text-2xl font-bold text-white font-mono-numbers">
                ${portfolio.cashAvailable?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
          <div className="w-full bg-slate-900 h-1 mt-3 rounded-full overflow-hidden">
            <div className="bg-blue-600 h-full" style={{ width: `${(portfolio.cashAvailable / portfolio.totalValue) * 100}%` }}></div>
          </div>
          <p className="text-xs text-slate-500 mt-2">{(portfolio.cashAvailable / portfolio.totalValue * 100).toFixed(1)}% Cash</p>
        </div>

        {/* Realized PnL Card */}
        <div className="bg-slate-800 border border-slate-700 p-5 rounded-lg">
          <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Realized PnL</p>
          <p className={`text-2xl font-bold mt-1 font-mono-numbers ${
            (chartData[chartData.length - 1]?.pnl || 0) >= 0 ? 'text-green-500' : 'text-red-500'
          }`}>
            {(chartData[chartData.length - 1]?.pnl || 0) >= 0 ? '+' : ''}
            ${(chartData[chartData.length - 1]?.pnl || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-slate-500 mt-2">Total Return</p>
        </div>

        {/* Active Positions Count */}
        <div className="bg-slate-800 border border-slate-700 p-5 rounded-lg">
          <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Open Positions</p>
          <p className="text-2xl font-bold text-white mt-1 font-mono-numbers">{positions.length}</p>
          <div className="mt-3 flex -space-x-2 overflow-hidden">
            {positions.slice(0, 4).map((pos, i) => (
               <div key={i} className="inline-block h-6 w-6 rounded-full ring-2 ring-slate-800 bg-slate-600 flex items-center justify-center text-[9px] font-bold text-white">
                 {pos.symbol[0]}
               </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Charts & Tables */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Chart Section */}
          <div className="bg-slate-800 border border-slate-700 p-5 rounded-lg">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-sm font-semibold text-white uppercase tracking-wider">Performance Analytics</h2>
                <div className="flex gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500"></span>
                    <span className="text-xs text-slate-400">Equity Curve</span>
                </div>
            </div>
            <div className="h-72 w-full">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorPnL" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                    <XAxis 
                        dataKey="time" 
                        stroke="#64748b" 
                        tick={{fill: '#64748b', fontSize: 11}}
                        tickLine={false}
                        axisLine={false}
                    />
                    <YAxis 
                        stroke="#64748b" 
                        tick={{fill: '#64748b', fontSize: 11}}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => `$${value}`}
                    />
                    <Tooltip 
                        contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc', fontSize: '12px' }}
                        itemStyle={{ color: '#10b981' }}
                    />
                    <Area 
                        type="monotone" 
                        dataKey="pnl" 
                        stroke="#10b981" 
                        strokeWidth={2}
                        fillOpacity={1} 
                        fill="url(#colorPnL)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-500 border border-dashed border-slate-700 rounded-lg bg-slate-900/50">
                  <p className="text-sm">No performance data available</p>
                </div>
              )}
            </div>
          </div>

          {/* Positions Table */}
          <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
            <div className="p-4 border-b border-slate-700">
                <h2 className="text-sm font-semibold text-white uppercase tracking-wider">Active Portfolio</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-400">
                <thead className="bg-slate-900/50 uppercase text-xs font-semibold tracking-wider text-slate-500">
                  <tr>
                    <th className="px-6 py-3">Symbol</th>
                    <th className="px-6 py-3 text-right">Qty</th>
                    <th className="px-6 py-3 text-right">Avg Price</th>
                    <th className="px-6 py-3 text-right">Last</th>
                    <th className="px-6 py-3 text-right">Mkt Value</th>
                    <th className="px-6 py-3 text-right">Unrealized P&L</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {positions.map((pos) => (
                    <tr key={pos.symbol} className="hover:bg-slate-700/30 transition-colors">
                      <td className="px-6 py-3 font-medium text-white">{pos.symbol}</td>
                      <td className="px-6 py-3 text-right font-mono-numbers">{pos.qty}</td>
                      <td className="px-6 py-3 text-right font-mono-numbers">${pos.avgPrice?.toFixed(2)}</td>
                      <td className="px-6 py-3 text-right font-mono-numbers text-slate-200">${pos.currentPrice?.toFixed(2)}</td>
                      <td className="px-6 py-3 text-right font-mono-numbers text-white font-medium">${pos.currentValue?.toFixed(2)}</td>
                      <td className={`px-6 py-3 text-right font-mono-numbers font-medium ${pos.unrealizedPnL >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {pos.unrealizedPnL >= 0 ? '+' : ''}{pos.unrealizedPnL?.toFixed(2)} ({pos.returnPct?.toFixed(2)}%)
                      </td>
                    </tr>
                  ))}
                  {positions.length === 0 && (
                    <tr>
                      <td colSpan="6" className="px-6 py-8 text-center text-slate-500 italic">
                        No positions currently active
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* Right Column: Activity Stream */}
        <div className="lg:col-span-1">
          <div className="bg-slate-800 border border-slate-700 rounded-lg h-full max-h-[800px] flex flex-col">
            <div className="p-4 border-b border-slate-700">
                <h2 className="text-sm font-semibold text-white uppercase tracking-wider">Decision Log</h2>
            </div>
            
            <div className="flex-grow overflow-y-auto p-4 space-y-3 custom-scrollbar">
              {decisions.map((decision, idx) => (
                <div key={idx} className="bg-slate-900/50 border border-slate-700/50 p-3 rounded-md hover:border-slate-600 transition-colors">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-semibold text-white">{decision.symbol}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                      decision.decision === 'BUY' ? 'bg-green-900/30 text-green-400 border-green-900' :
                      decision.decision === 'SELL' ? 'bg-red-900/30 text-red-400 border-red-900' :
                      'bg-slate-700 text-slate-400 border-slate-600'
                    }`}>
                      {decision.decision}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] bg-blue-900/30 text-blue-300 px-1.5 py-0.5 rounded border border-blue-900/50">
                      {decision.agentName}
                    </span>
                    <span className="text-[10px] text-slate-500">
                        Score: <span className="text-slate-300">{(decision.confidence * 100).toFixed(0)}</span>
                    </span>
                  </div>

                  <p className="text-xs text-slate-400 leading-relaxed mb-2 line-clamp-2">
                    {decision.reasoning}
                  </p>
                  
                  <div className="flex justify-between items-center pt-2 border-t border-slate-800 text-[10px] text-slate-600">
                     <span className="font-mono">ID: {decision._id.substring(0,6)}</span>
                     <span>{new Date(decision.createdAt).toLocaleTimeString()}</span>
                  </div>
                </div>
              ))}
              
              {decisions.length === 0 && (
                <div className="text-center py-8 text-slate-500 text-sm">
                    No decisions recorded yet.
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
