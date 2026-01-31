import { getQuote, getDailyData } from '../../../services/alphaVantageService';
import { getMarketNews } from '../../../services/newsService';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const { symbol } = req.query;

    if (!symbol) {
        return res.status(400).json({ success: false, message: 'Symbol is required' });
    }

    try {
      const [quote, dailyData, news] = await Promise.all([
          getQuote(symbol),
          getDailyData(symbol),
          getMarketNews(symbol)
      ]);

      res.status(200).json({ success: true, context: { quote, dailyData, news } });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  } else {
    res.status(405).json({ success: false, message: 'Method not allowed' });
  }
}
