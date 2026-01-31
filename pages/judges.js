import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import Link from 'next/link';

export default function JudgesMode() {
  const [logs, setLogs] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [decision, setDecision] = useState(null);
  const [symbol, setSymbol] = useState('AAPL');
  const logsEndRef = useRef(null);
  const [displayedLogs, setDisplayedLogs] = useState([]);
  const [currentStep, setCurrentStep] = useState('IDLE'); // IDLE, ANALYZING, DECIDING, EXECUTING, COMPLETED

  const scrollToBottom = () => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [displayedLogs]);

  // Typewriter effect for logs
  useEffect(() => {
    if (logs.length > displayedLogs.length) {
      const timeout = setTimeout(() => {
        setDisplayedLogs(prev => [...prev, logs[prev.length]]);
      }, 50); // Speed of log typing
      return () => clearTimeout(timeout);
    } else if (logs.length > 0 && logs.length === displayedLogs.length && isRunning) {
        setIsRunning(false);
        setCurrentStep('COMPLETED');
    }
  }, [logs, displayedLogs, isRunning]);

  const runSimulation = async () => {
    setIsRunning(true);
    setLogs([]);
    setDisplayedLogs([]);
    setDecision(null);
    setCurrentStep('ANALYZING');

    try {
      const response = await fetch('/api/run-agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol, portfolioId: 'simulation-portfolio' }), // Mock portfolio ID
      });

      const data = await response.json();

      if (data.success) {
        setDecision(data.decision);
        if (data.decision.logs) {
            setLogs(data.decision.logs);
        } else {
            setLogs(['[SYSTEM] No logs returned from agents.']);
        }
      } else {
        setLogs(prev => [...prev, `[SYSTEM ERROR] ${data.message || data.error}`]);
        setIsRunning(false);
      }
    } catch (error) {
      setLogs(prev => [...prev, `[NETWORK ERROR] ${error.message}`]);
      setIsRunning(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 font-mono">
      <Head>
        <title>Judges Mode | AI Agent Council</title>
      </Head>

      {/* Navigation */}
      <nav className="bg-slate-800 border-b border-slate-700 p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
            <h1 className="text-xl font-bold tracking-wider text-white">JUDGES MODE <span className="text-xs text-slate-400 font-normal">v2.0.1</span></h1>
          </div>
          <div className="flex space-x-6 text-sm">
            <Link href="/" className="hover:text-cyan-400 transition-colors">Dashboard</Link>
            <Link href="/trade" className="hover:text-cyan-400 transition-colors">Manual Trade</Link>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-6 grid grid-cols-12 gap-6">
        
        {/* Left Column: Controls & Decision Tree */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
          
          {/* Control Panel */}
          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700 shadow-lg">
            <h2 className="text-cyan-400 text-sm font-bold uppercase tracking-widest mb-4">Simulation Controls</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-slate-500 mb-1">Target Asset</label>
                <input 
                  type="text" 
                  value={symbol}
                  onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                  className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white focus:border-cyan-500 outline-none"
                  placeholder="e.g., AAPL"
                />
              </div>
              <button 
                onClick={runSimulation}
                disabled={isRunning}
                className={`w-full py-3 rounded font-bold tracking-wide transition-all ${
                  isRunning 
                    ? 'bg-slate-700 text-slate-500 cursor-not-allowed' 
                    : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-[0_0_15px_rgba(8,145,178,0.5)]'
                }`}
              >
                {isRunning ? 'PROCESSING DATA...' : 'INITIATE COUNCIL SESSION'}
              </button>
            </div>
          </div>

          {/* Decision Tree / Agents Status */}
          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700 shadow-lg min-h-[400px]">
            <h2 className="text-purple-400 text-sm font-bold uppercase tracking-widest mb-4">Council Logic</h2>
            
            {!decision && !isRunning && (
              <div className="text-slate-600 text-center py-10 italic">
                Awaiting initiation...
              </div>
            )}

            {(decision || isRunning) && (
              <div className="space-y-4">
                 {/* Master Agent */}
                 <div className={`p-3 border-l-2 ${decision ? 'border-purple-500 bg-slate-700/50' : 'border-slate-600'} transition-all`}>
                    <div className="flex justify-between items-center">
                        <span className="font-bold text-purple-300">MASTER AGENT</span>
                        {decision && <span className="text-xs bg-purple-900/50 text-purple-200 px-2 py-1 rounded">{decision.action}</span>}
                    </div>
                    {decision && <p className="text-xs text-slate-400 mt-1">{decision.reason}</p>}
                 </div>

                 {/* Sub Agents */}
                 <div className="pl-4 space-y-3 border-l border-slate-700 ml-2">
                    {['TECHNICAL', 'SENTIMENT', 'QUANT', 'RISK'].map((agentName) => {
                        const subDecision = decision?.subDecisions?.find(d => d.agent === agentName.toLowerCase());
                        const isActive = displayedLogs.some(l => l.includes(`[${agentName}]`));
                        
                        return (
                            <div key={agentName} className={`p-2 rounded border ${
                                subDecision 
                                    ? (subDecision.action === 'BUY' ? 'border-green-500/30 bg-green-900/10' : subDecision.action === 'SELL' ? 'border-red-500/30 bg-red-900/10' : 'border-slate-600 bg-slate-800')
                                    : (isActive ? 'border-cyan-500/50 animate-pulse' : 'border-slate-700 opacity-50')
                            }`}>
                                <div className="flex justify-between">
                                    <span className="text-xs font-bold text-slate-300">{agentName}</span>
                                    {subDecision && (
                                        <span className={`text-[10px] px-1 rounded ${
                                            subDecision.action === 'BUY' ? 'text-green-400' : 
                                            subDecision.action === 'SELL' ? 'text-red-400' : 'text-slate-400'
                                        }`}>
                                            {subDecision.action} ({subDecision.confidence?.toFixed(2)})
                                        </span>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                 </div>
              </div>
            )}
          </div>

        </div>

        {/* Right Column: Terminal & Output */}
        <div className="col-span-12 lg:col-span-8 space-y-6">
          
          {/* Live Terminal */}
          <div className="bg-black rounded-lg border border-slate-700 shadow-2xl overflow-hidden flex flex-col h-[600px]">
            <div className="bg-slate-800 p-2 flex items-center space-x-2 border-b border-slate-700">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-xs text-slate-400 ml-4">agent_council_v2.exe --live-feed</span>
            </div>
            <div className="flex-1 p-4 overflow-y-auto font-mono text-sm space-y-1 custom-scrollbar">
              {displayedLogs.map((log, index) => {
                  let colorClass = "text-slate-300";
                  if (log.includes("[MASTER]")) colorClass = "text-blue-400 font-bold";
                  else if (log.includes("[TECHNICAL]")) colorClass = "text-emerald-400";
                  else if (log.includes("[SENTIMENT]")) colorClass = "text-sky-400";
                  else if (log.includes("[QUANT]")) colorClass = "text-yellow-400";
                  else if (log.includes("[RISK]")) colorClass = "text-orange-400";
                  else if (log.includes("ERROR")) colorClass = "text-red-500 font-bold";

                  return (
                    <div key={index} className={`${colorClass} hover:bg-slate-900/50 px-1 rounded`}>
                        <span className="opacity-50 text-[10px] mr-2">{new Date().toLocaleTimeString()}</span>
                        {log}
                    </div>
                  );
              })}
              <div ref={logsEndRef} />
              {isRunning && (
                  <div className="animate-pulse text-cyan-500">_</div>
              )}
            </div>
          </div>

          {/* Final Verdict */}
          {decision && (
            <div className={`rounded-lg p-6 border-2 ${
                decision.action === 'BUY' ? 'border-green-500 bg-green-900/20' : 
                decision.action === 'SELL' ? 'border-red-500 bg-red-900/20' : 
                'border-slate-500 bg-slate-800'
            }`}>
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-2xl font-bold text-white mb-1">FINAL VERDICT: <span className={
                            decision.action === 'BUY' ? 'text-green-400' : 
                            decision.action === 'SELL' ? 'text-red-400' : 'text-slate-400'
                        }>{decision.action}</span></h3>
                        <p className="text-slate-400">{decision.reason}</p>
                    </div>
                    <div className="text-right">
                        <div className="text-sm text-slate-500 uppercase">Confidence</div>
                        <div className="text-3xl font-bold text-white">{(decision.confidence * 100).toFixed(0)}%</div>
                    </div>
                </div>
            </div>
          )}

          {/* Trade Simulation */}
          {decision && decision.action !== 'HOLD' && (() => {
             const techData = decision.subDecisions?.find(d => d.agent === 'technical')?.data;
             const price = techData?.price || 0;
             const vol = techData?.volatility || 0.02;
             
             // Simple simulation logic
             const slPercent = vol * 0.5; // Tighter stop for high vol? No, wider. Let's say 1x daily vol.
             // Actually vol is annualized. Daily vol ~ vol / 16.
             const dailyVol = vol / 16;
             
             const slPrice = decision.action === 'BUY' ? price * (1 - dailyVol * 2) : price * (1 + dailyVol * 2);
             const tpPrice = decision.action === 'BUY' ? price * (1 + dailyVol * 4) : price * (1 - dailyVol * 4);
             const riskReward = 2.0;

             return (
                 <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
                    <h3 className="text-cyan-400 text-sm font-bold uppercase tracking-widest mb-4">Trade Simulation</h3>
                    <div className="grid grid-cols-3 gap-4 text-center">
                        <div className="p-4 bg-slate-900 rounded border border-slate-700">
                            <div className="text-xs text-slate-500 uppercase mb-1">Entry Price</div>
                            <div className="text-xl font-mono text-white">${price.toFixed(2)}</div>
                        </div>
                        <div className="p-4 bg-slate-900 rounded border border-slate-700">
                            <div className="text-xs text-slate-500 uppercase mb-1">Stop Loss</div>
                            <div className="text-xl font-mono text-red-400">${slPrice.toFixed(2)}</div>
                            <div className="text-[10px] text-slate-600 mt-1">(-{(dailyVol * 200).toFixed(2)}%)</div>
                        </div>
                        <div className="p-4 bg-slate-900 rounded border border-slate-700">
                            <div className="text-xs text-slate-500 uppercase mb-1">Take Profit</div>
                            <div className="text-xl font-mono text-green-400">${tpPrice.toFixed(2)}</div>
                            <div className="text-[10px] text-slate-600 mt-1">(+{(dailyVol * 400).toFixed(2)}%)</div>
                        </div>
                    </div>
                    <div className="mt-4 text-xs text-slate-500 text-center">
                        Simulated Risk/Reward Ratio: <span className="text-white font-bold">1:{riskReward}</span> • Based on {((vol || 0) * 100).toFixed(1)}% Annualized Volatility
                    </div>
                 </div>
             );
          })()}

        </div>
      </main>
    </div>
  );
}
