import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useAgent } from '../context/AgentContext';
import axios from 'axios';


export default function Dashboard() {
  const { portfolio, positions, logs, session, isLooping, cooldown } = useAgent();

  const fmtMoney = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n || 0);
  const fmtPct = (n) => `${(n || 0).toFixed(2)}%`;

  if (!portfolio && !session) {
      return <div className="p-10 text-center text-slate-500">Loading Agent Data...</div>;
  }

  return (
    <div className="space-y-6 p-6 min-h-screen bg-slate-900 text-slate-100">
      <Head>
        <title>Dashboard | InnoTech AI</title>
      </Head>

      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Cash */}
        <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
          <p className="text-slate-400 text-xs uppercase tracking-wider">Cash Available</p>
          <h3 className="text-2xl font-bold text-white mt-1">{fmtMoney(portfolio?.cashAvailable)}</h3>
        </div>
        
        {/* Equity */}
        <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
          <p className="text-slate-400 text-xs uppercase tracking-wider">Total Portfolio Value</p>
          <h3 className="text-2xl font-bold text-blue-400 mt-1">{fmtMoney(portfolio?.totalValue)}</h3>
        </div>

        {/* PnL */}
        <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
          <p className="text-slate-400 text-xs uppercase tracking-wider">Unrealized PnL</p>
          <h3 className={`text-2xl font-bold mt-1 ${portfolio?.unrealizedPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {portfolio?.unrealizedPnL >= 0 ? '+' : ''}{fmtMoney(portfolio?.unrealizedPnL)}
          </h3>
        </div>

        {/* Agent Status */}
        <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
          <p className="text-slate-400 text-xs uppercase tracking-wider">Agent Status</p>
          <div className="flex justify-between items-end mt-1">
            <div>
                <h3 className={`text-xl font-bold ${isLooping ? 'text-green-400' : 'text-slate-500'}`}>
                    {isLooping ? 'ACTIVE' : 'IDLE'}
                </h3>
                {isLooping && cooldown > 0 && (
                    <p className="text-xs text-blue-300 font-mono mt-1">Next scan: {cooldown}s</p>
                )}
            </div>
            <div className="text-right">
                <span className="text-2xl font-bold text-white">
                    {session ? session.maxTradesPerDay - session.tradesUsedToday : '-'}
                </span>
                <span className="text-sm text-slate-500"> / {session?.maxTradesPerDay || '-'} trades</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Content Area (2/3) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Chart removed */}

          {/* Open Positions */}
          <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
            <div className="p-4 border-b border-slate-700">
              <h3 className="text-lg font-semibold">Open Positions</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-900/50 text-slate-400 uppercase text-xs">
                  <tr>
                    <th className="px-6 py-3">Symbol</th>
                    <th className="px-6 py-3">Qty</th>
                    <th className="px-6 py-3">Avg Price</th>
                    <th className="px-6 py-3">Current</th>
                    <th className="px-6 py-3">Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {positions && positions.length > 0 ? positions.map((pos) => (
                    <tr key={pos.symbol} className="hover:bg-slate-700/50 transition-colors">
                      <td className="px-6 py-4 font-bold text-white">{pos.symbol}</td>
                      <td className="px-6 py-4 text-slate-300">{pos.qty}</td>
                      <td className="px-6 py-4 text-slate-300">{fmtMoney(pos.avgPrice)}</td>
                      <td className="px-6 py-4 text-slate-300">{fmtMoney(pos.currentPrice)}</td>
                      <td className="px-6 py-4 font-mono text-blue-300">{fmtMoney(pos.qty * pos.currentPrice)}</td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan="5" className="px-6 py-8 text-center text-slate-500 italic">
                        No open positions. Start the agent to begin trading.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Sidebar / Activity Log (1/3) */}
        <div className="lg:col-span-1">
          <div className="bg-black rounded-xl border border-slate-700 h-[600px] flex flex-col">
            <div className="p-3 border-b border-slate-800 bg-slate-900 rounded-t-xl flex justify-between items-center">
              <h3 className="text-sm font-mono text-green-400">AI Activity Log</h3>
              <div className={`w-2 h-2 rounded-full ${isLooping ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4 font-mono text-xs">
              {logs.length === 0 && <p className="text-slate-600">Waiting for agent activity...</p>}
              
              {logs.map((log, i) => (
                <div key={i} className="border-l-2 border-slate-700 pl-3 pb-1">
                  <div className="flex justify-between text-slate-500 mb-1">
                    <span>{log.time}</span>
                    <span className="text-blue-400 font-bold">{log.symbol}</span>
                  </div>
                  <div className="text-slate-300 mb-1">
                    Action: <span className={
                      log.action === 'BUY' || log.action === 'BUY_MORE' ? 'text-green-400' :
                      log.action === 'SELL' || log.action === 'EXIT' ? 'text-red-400' :
                      'text-yellow-400'
                    }>{log.action}</span>
                  </div>
                  {log.details && (
                     <div className="text-slate-600 mt-1 pl-2 border-l border-slate-800">
                        {log.details.map((d, idx) => (
                            <div key={idx} className="truncate">{d}</div>
                        ))}
                     </div>
                  )}
                  {log.result && log.result !== 'ANALYZED' && (
                      <div className="mt-1 text-slate-400">
                          Result: <span className={log.result === 'EXECUTED' ? 'text-green-500' : 'text-orange-500'}>{log.result}</span>
                      </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
