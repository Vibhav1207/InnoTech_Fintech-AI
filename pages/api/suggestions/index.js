import dbConnect from '../../../lib/db';

export default async function handler(req, res) {
  
  const baseSuggestions = [
    { symbol: 'NVDA', basePrice: 124.50, trend: 'up', reason: 'High AI demand signal' },
    { symbol: 'AMD', basePrice: 168.20, trend: 'up', reason: 'Technical breakout imminent' },
    { symbol: 'TSLA', basePrice: 178.90, trend: 'down', reason: 'Oversold bounce potential' },
    { symbol: 'MSFT', basePrice: 415.30, trend: 'up', reason: 'Strong cloud momentum' },
    { symbol: 'COIN', basePrice: 255.10, trend: 'up', reason: 'Crypto sector rotation' },
    { symbol: 'PLTR', basePrice: 24.50, trend: 'up', reason: 'Government contract expansion' },
    { symbol: 'GOOGL', basePrice: 175.40, trend: 'neutral', reason: 'Search ad revenue stability' },
    { symbol: 'AMZN', basePrice: 180.20, trend: 'up', reason: 'AWS growth acceleration' }
  ];

  const count = Math.floor(Math.random() * 3) + 3; 
  const shuffled = baseSuggestions.sort(() => 0.5 - Math.random());
  const selected = shuffled.slice(0, count).map(s => {
      const variation = (Math.random() * 2 - 1) * (s.basePrice * 0.02);
      return {
          ...s,
          price: parseFloat((s.basePrice + variation).toFixed(2))
      };
  });

  res.status(200).json({ success: true, suggestions: selected });
}
