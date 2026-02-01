import axios from 'axios';

const API_KEY = process.env.ALPHA_VANTAGE_API_KEY;
const BASE_URL = 'https://www.alphavantage.co/query';

function generateMockDailyData(symbol, days = 100) {
  const data = [];
  let price = 150.0;

  const now = new Date();
  
  for (let i = 0; i < days; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    
    const change = (Math.random() - 0.5) * 5; 
    price += change;
    if (price < 10) price = 10;

    data.push({
      date: dateStr,
      open: parseFloat((price - Math.random()).toFixed(2)),
      high: parseFloat((price + Math.random() * 2).toFixed(2)),
      low: parseFloat((price - Math.random() * 2).toFixed(2)),
      close: parseFloat(price.toFixed(2)),
      adjustedClose: parseFloat(price.toFixed(2)),
      volume: Math.floor(Math.random() * 1000000) + 500000,
      dividendAmount: 0,
      splitCoefficient: 1.0
    });
  }
  return data;
}

export async function searchSymbols(keywords) {
  try {
    if (!API_KEY) throw new Error('Alpha Vantage API key is missing');

    const response = await axios.get(BASE_URL, {
      params: {
        function: 'SYMBOL_SEARCH',
        keywords,
        apikey: API_KEY
      }
    });

    // console.log('Alpha Vantage Search Response:', JSON.stringify(response.data, null, 2));
    console.log('Alpha Vantage Search Response:', JSON.stringify(response.data, null, 2));

    if (response.data['Note']) {
      throw new Error('Alpha Vantage API limit reached');
    }

    const matches = response.data['bestMatches'];
    if (!matches) {
      return [];
    }

    return matches.map(match => ({
      symbol: match['1. symbol'],
      name: match['2. name'],
      type: match['3. type'],
      region: match['4. region'],
      marketOpen: match['5. marketOpen'],
      marketClose: match['6. marketClose'],
      timezone: match['7. timezone'],
      currency: match['8. currency'],
      matchScore: match['9. matchScore']
    }));
  } catch (error) {
    console.error(`Error searching symbols for ${keywords}:`, error.message);
    throw error;
  }
}

export async function getIntradayData(symbol, interval = '5min') {
  try {
    if (!API_KEY) throw new Error('Alpha Vantage API key is missing');

    const response = await axios.get(BASE_URL, {
      params: {
        function: 'TIME_SERIES_INTRADAY',
        symbol,
        interval,
        apikey: API_KEY,
        // outputsize: 'full' // 'full' might be restricted for demo keys
      }
    });

    console.log('Alpha Vantage Intraday Response:', JSON.stringify(response.data, null, 2));

    if (response.data['Note']) {
      throw new Error('Alpha Vantage API limit reached');
    }

    const timeSeriesKey = `Time Series (${interval})`;
    const timeSeries = response.data[timeSeriesKey];

    if (!timeSeries) {
      throw new Error(`No intraday data (${interval}) found for symbol: ` + symbol);
    }

    const formattedData = Object.keys(timeSeries).map(time => ({
      time,
      open: parseFloat(timeSeries[time]['1. open']),
      high: parseFloat(timeSeries[time]['2. high']),
      low: parseFloat(timeSeries[time]['3. low']),
      close: parseFloat(timeSeries[time]['4. close']),
      volume: parseInt(timeSeries[time]['5. volume'])
    }));

    // Sort ascending by time
    return formattedData.sort((a, b) => new Date(a.time) - new Date(b.time));
  } catch (error) {
    console.error(`Error fetching intraday data for ${symbol}:`, error.message);
    throw error; 
  }
}

export async function getQuote(symbol) {
  try {
    if (!API_KEY) throw new Error('Alpha Vantage API key is missing');
    
    const response = await axios.get(BASE_URL, {
      params: {
        function: 'GLOBAL_QUOTE',
        symbol,
        apikey: API_KEY
      }
    });

    const data = response.data['Global Quote'];
    if (!data || Object.keys(data).length === 0) {
      throw new Error('No quote data found for symbol: ' + symbol);
    }

    return {
      symbol: data['01. symbol'],
      open: parseFloat(data['02. open']),
      high: parseFloat(data['03. high']),
      low: parseFloat(data['04. low']),
      price: parseFloat(data['05. price']),
      volume: parseInt(data['06. volume']),
      latestTradingDay: data['07. latest trading day'],
      previousClose: parseFloat(data['08. previous close']),
      change: parseFloat(data['09. change']),
      changePercent: data['10. change percent']
    };
  } catch (error) {
    console.warn(`[Mock] Generating quote for ${symbol} due to error: ${error.message}`);
    const mockPrice = 150 + (Math.random() * 20 - 10);
    return {
      symbol: symbol.toUpperCase(),
      open: mockPrice - 2,
      high: mockPrice + 3,
      low: mockPrice - 3,
      price: mockPrice,
      volume: 1200000,
      latestTradingDay: new Date().toISOString().split('T')[0],
      previousClose: mockPrice - 1.5,
      change: 1.5,
      changePercent: '1.0%'
    };
  }
}

export async function getDailyData(symbol) {
  try {
    if (!API_KEY) throw new Error('Alpha Vantage API key is missing');

    const response = await axios.get(BASE_URL, {
      params: {
        function: 'TIME_SERIES_DAILY',
        symbol,
        apikey: API_KEY
      }
    });

    const timeSeries = response.data['Time Series (Daily)'];
    if (!timeSeries) {
      throw new Error('No daily data found for symbol: ' + symbol);
    }

    const formattedData = Object.keys(timeSeries).map(date => ({
      date,
      open: parseFloat(timeSeries[date]['1. open']),
      high: parseFloat(timeSeries[date]['2. high']),
      low: parseFloat(timeSeries[date]['3. low']),
      close: parseFloat(timeSeries[date]['4. close']),
      volume: parseInt(timeSeries[date]['5. volume'])
    }));

    return formattedData.sort((a, b) => new Date(b.date) - new Date(a.date));
  } catch (error) {
    console.warn(`[Mock] Generating daily data for ${symbol} due to error: ${error.message}`);
    return generateMockDailyData(symbol);
  }
}

export async function getDailyAdjustedData(symbol, allowMock = true) {
  try {
    if (!API_KEY) throw new Error('Alpha Vantage API key is missing');

    const response = await axios.get(BASE_URL, {
      params: {
        function: 'TIME_SERIES_DAILY_ADJUSTED',
        symbol,
        apikey: API_KEY
      }
    });

    if (response.data['Note']) {
       throw new Error('Alpha Vantage API limit reached');
    }

    const timeSeries = response.data['Time Series (Daily)'];
    if (!timeSeries) {
       throw new Error('No daily adjusted data found for symbol: ' + symbol);
    }
    
    const formattedData = Object.keys(timeSeries).map(date => ({
      time: date, // Normalized to 'time' for consistency with intraday
      open: parseFloat(timeSeries[date]['1. open']),
      high: parseFloat(timeSeries[date]['2. high']),
      low: parseFloat(timeSeries[date]['3. low']),
      close: parseFloat(timeSeries[date]['4. close']),
      adjustedClose: parseFloat(timeSeries[date]['5. adjusted close']),
      volume: parseInt(timeSeries[date]['6. volume']),
      dividendAmount: parseFloat(timeSeries[date]['7. dividend amount']),
      splitCoefficient: parseFloat(timeSeries[date]['8. split coefficient'])
    }));

    return formattedData.sort((a, b) => new Date(a.time) - new Date(b.time));
  } catch (error) {
    if (!allowMock) throw error;
    console.warn(`[Mock] Generating daily adjusted data for ${symbol} due to error: ${error.message}`);
    return generateMockDailyData(symbol).map(d => ({ ...d, time: d.date }));
  }
}

export async function getRSI(symbol, interval = 'daily', timePeriod = 14, seriesType = 'close') {
  try {
    if (!API_KEY) throw new Error('Alpha Vantage API key is missing');

    const response = await axios.get(BASE_URL, {
      params: {
        function: 'RSI',
        symbol,
        interval,
        time_period: timePeriod,
        series_type: seriesType,
        apikey: API_KEY
      }
    });

    const rsiData = response.data['Technical Analysis: RSI'];

    if (!rsiData) {
      throw new Error('No RSI data found for symbol: ' + symbol);
    }

    const latestDate = Object.keys(rsiData)[0];
    const latestRSI = parseFloat(rsiData[latestDate]['RSI']);

    return {
      symbol,
      indicator: 'RSI',
      value: latestRSI,
      lastUpdated: latestDate
    };
  } catch (error) {
    console.warn(`[Mock] Generating RSI for ${symbol} due to error: ${error.message}`);
    return { 
      symbol, 
      indicator: 'RSI', 
      value: 30 + Math.random() * 40,
      lastUpdated: new Date().toISOString().split('T')[0] 
    }; 
  }
}

export async function getVolume(symbol) {
  try {
    const quote = await getQuote(symbol);
    return {
      symbol,
      volume: quote.volume
    };
  } catch (error) {
    return { symbol, volume: 1000000, error: error.message };
  }
}
