import axios from 'axios';

const BASE_URL = 'https://www.alphavantage.co/query';
const API_KEY = process.env.ALPHA_VANTAGE_API_KEY;

export async function getMarketNews(symbol) {
  try {
    if (!API_KEY) {
      console.warn('Alpha Vantage API key is missing. Using mock news data.');
      return getMockNews(symbol);
    }

    const response = await axios.get(BASE_URL, {
      params: {
        function: 'NEWS_SENTIMENT',
        tickers: symbol,
        limit: 3,
        apikey: API_KEY
      }
    });

    if (!response.data.feed) {
        console.warn('No news feed found in Alpha Vantage response. Using mock data.');
        return getMockNews(symbol);
    }

    return response.data.feed.map(item => ({
      title: item.title,
      summary: item.summary,
      source: item.source,
      time_published: item.time_published,
      url: item.url,
      overall_sentiment_score: parseFloat(item.overall_sentiment_score),
      overall_sentiment_label: item.overall_sentiment_label,
      relevance_score: parseFloat(item.ticker_sentiment.find(t => t.ticker === symbol)?.relevance_score || 0)
    })).sort((a, b) => b.time_published.localeCompare(a.time_published));

  } catch (error) {
    console.error('Error fetching news:', error.message);
    return getMockNews(symbol);
  }
}

function getMockNews(symbol) {
    return [
        {
            title: `${symbol} beats earnings expectations`,
            summary: `Analysts are impressed with ${symbol}'s quarterly performance.`,
            source: 'Mock News',
            time_published: '20231025T120000',
            overall_sentiment_score: 0.65,
            overall_sentiment_label: 'Bullish',
            relevance_score: 0.8
        },
        {
            title: `Sector volatility impacts ${symbol}`,
            summary: `Global tech sell-off drags down ${symbol} shares.`,
            source: 'Mock News',
            time_published: '20231024T100000',
            overall_sentiment_score: -0.4,
            overall_sentiment_label: 'Bearish',
            relevance_score: 0.7
        },
         {
            title: `${symbol} announces new partnership`,
            summary: `Strategic alliance formed to expand market share.`,
            source: 'Mock News',
            time_published: '20231023T090000',
            overall_sentiment_score: 0.2,
            overall_sentiment_label: 'Somewhat-Bullish',
            relevance_score: 0.9
        }
    ];
}
