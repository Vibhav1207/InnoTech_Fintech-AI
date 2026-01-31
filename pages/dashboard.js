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
  ResponsiveContainer
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
          time: new Date(log.timestamp).toLocaleTimeString(),
          pnl: cumulativePnL,
          symbol: log.symbol
        };
      });
  }, [logs]);

  if (!portfolio) return <div className="p-10 text-center">Loading Dashboard...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <Head>
        <title>Trading Dashboard</title>
      </Head>

      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex justify-between items-center bg-white p-6 rounded-lg shadow-sm">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">InnoTech Trading Desk</h1>
            <p className="text-sm text-gray-500">Last updated: {lastUpdated.toLocaleTimeString()}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Total Portfolio Value</p>
            <p className="text-3xl font-bold text-blue-600">
              ${portfolio.totalValue?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-gray-500 mt-1">Cash: ${portfolio.cashAvailable?.toLocaleString()}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h2 className="text-lg font-semibold mb-4">Realized PnL Performance</h2>
              <div className="h-64">
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="time" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="pnl" stroke="#10b981" strokeWidth={2} name="Cumulative PnL ($)" />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-400">
                    No realized PnL data yet
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm overflow-hidden">
              <h2 className="text-lg font-semibold mb-4">Open Positions</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Symbol</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Qty</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Price</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Current</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Unrealized PnL</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {positions.map((pos) => (
                      <tr key={pos.symbol}>
                        <td className="px-4 py-3 whitespace-nowrap font-medium text-gray-900">{pos.symbol}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-right">{pos.qty}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-right text-gray-500">${pos.avgPrice?.toFixed(2)}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-right font-medium">${pos.currentPrice?.toFixed(2)}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-right text-gray-900">${pos.currentValue?.toFixed(2)}</td>
                        <td className={`px-4 py-3 whitespace-nowrap text-right font-bold ${pos.unrealizedPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {pos.unrealizedPnL >= 0 ? '+' : ''}{pos.unrealizedPnL?.toFixed(2)} ({pos.returnPct?.toFixed(2)}%)
                        </td>
                      </tr>
                    ))}
                    {positions.length === 0 && (
                      <tr>
                        <td colSpan="6" className="px-4 py-8 text-center text-gray-500">No open positions</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>

          <div className="lg:col-span-1">
            <div className="bg-white p-6 rounded-lg shadow-sm h-full max-h-[800px] overflow-y-auto">
              <h2 className="text-lg font-semibold mb-4">Agent Decision Feed</h2>
              <div className="space-y-4">
                {decisions.map((decision, idx) => (
                  <div key={idx} className="border-l-4 border-blue-500 pl-4 py-2 bg-gray-50 rounded-r-md">
                    <div className="flex justify-between items-start">
                      <span className="font-bold text-gray-800">{decision.symbol}</span>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        decision.decision === 'BUY' ? 'bg-green-100 text-green-800' :
                        decision.decision === 'SELL' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {decision.decision}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1 uppercase tracking-wide">{decision.agentName} Agent • Conf: {(decision.confidence * 100).toFixed(0)}%</p>
                    <p className="text-sm text-gray-600 mt-2 line-clamp-3" title={decision.reasoning}>
                      {decision.reasoning}
                    </p>
                    <p className="text-xs text-gray-400 mt-2 text-right">
                      {new Date(decision.createdAt).toLocaleTimeString()}
                    </p>
                  </div>
                ))}
                {decisions.length === 0 && (
                  <div className="text-center text-gray-400 py-10">
                    No active decisions in feed
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
