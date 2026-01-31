import dbConnect from '../../../lib/db';

export default async function handler(req, res) {
  // Mock data for AI suggestions
  // In a real app, this would run a scanner or query a recommendation database
  
  const suggestions = [
    { symbol: 'NVDA', price: 124.50, trend: 'up', reason: 'High AI demand signal' },
    { symbol: 'AMD', price: 168.20, trend: 'up', reason: 'Technical breakout imminent' },
    { symbol: 'TSLA', price: 178.90, trend: 'down', reason: 'Oversold bounce potential' },
    { symbol: 'MSFT', price: 415.30, trend: 'up', reason: 'Strong cloud momentum' },
    { symbol: 'COIN', price: 255.10, trend: 'up', reason: 'Crypto sector rotation' }
  ];

  res.status(200).json({ success: true, suggestions });
}
