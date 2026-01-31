import { getDailyAdjustedData, getRSI } from '../../services/alphaVantageService';

function calculateSMA(data, period) {
  if (data.length < period) return null;
  const slice = data.slice(0, period);
  const sum = slice.reduce((acc, val) => acc + val, 0);
  return sum / period;
}

function calculateVolatility(data, period = 20) {
  if (data.length < period + 1) return 0;
  
  const logReturns = [];
  for (let i = 0; i < period; i++) {
    const current = data[i];
    const prev = data[i + 1];
    if (prev > 0) {
      logReturns.push(Math.log(current / prev));
    }
  }

  if (logReturns.length === 0) return 0;

  const mean = logReturns.reduce((a, b) => a + b, 0) / logReturns.length;
  const variance = logReturns.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / logReturns.length;
  
  return Math.sqrt(variance) * Math.sqrt(252);
}

function calculateSlope(data, period = 20) {
  if (data.length < period) return 0;
  
  const y = data.slice(0, period).reverse(); 
  const n = y.length;
  const x = Array.from({ length: n }, (_, i) => i); 

  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((a, i) => a + i * y[i], 0);
  const sumXX = x.reduce((a, b) => a + b * b, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  return slope;
}

export async function analyze(symbol) {
  const logs = [];
  const log = (msg) => {
      console.log(msg);
      logs.push(`[TECHNICAL] ${msg}`);
  };

  log(`--- Technical Agent Analysis for ${symbol} ---`);

  const [dailyData, rsiResult] = await Promise.all([
    getDailyAdjustedData(symbol),
    getRSI(symbol)
  ]);

  if (!dailyData || dailyData.length < 60) {
    console.error('Insufficient daily data for analysis');
    log('ERROR: Insufficient daily data for analysis');
    return {
      agent: 'technical',
      symbol,
      action: 'HOLD',
      decisions: ['HOLD', 'HOLD'],
      confidence: 0,
      reason: 'Insufficient data',
      reasoning: ['Not enough historical data to perform technical analysis.'],
      data: {},
      logs
    };
  }

  const prices = dailyData.map(d => d.adjustedClose || d.close);
  const latestClose = prices[0];

  log(`Latest Price: $${latestClose.toFixed(2)}`);

  const ma20 = calculateSMA(prices, 20);
  const ma50 = calculateSMA(prices, 50);
  const ma100 = calculateSMA(prices, 100);
  const volatility = calculateVolatility(prices, 20);
  const slope = calculateSlope(prices, 20); 
  const rsi = rsiResult.value || 50; 

  let regime = 'RANGE';
  if (latestClose > ma50 && slope > 0) {
    regime = 'UPTREND';
  } else if (latestClose < ma50 && slope < 0) {
    regime = 'DOWNTREND';
  }

  log(`Market Regime identified as: ${regime}`);
  log(`Indicators: RSI=${rsi.toFixed(2)}, Volatility=${(volatility*100).toFixed(1)}%, Slope=${slope.toFixed(4)}`);

  let rsiState = 'NEUTRAL';
  if (rsi > 70) rsiState = 'OVERBOUGHT';
  if (rsi < 30) rsiState = 'OVERSOLD';

  let volState = 'MEDIUM';
  if (volatility > 0.4) volState = 'HIGH'; 
  if (volatility < 0.15) volState = 'LOW'; 

  let decisions = [];
  let primaryAction = 'HOLD'; 
  let confidence = 0.5;
  let reasoning = [];

  reasoning.push(`Market Regime: ${regime} (Price vs MA50, Slope: ${slope.toFixed(4)})`);
  reasoning.push(`RSI (${rsi.toFixed(2)}) is ${rsiState}`);
  reasoning.push(`Volatility is ${volState} (${(volatility * 100).toFixed(2)}%)`);

  if (regime === 'UPTREND') {
    if (rsiState === 'OVERSOLD' || (rsi >= 40 && rsi <= 68)) {
      decisions = ['BUY_MORE', 'HOLD'];
      primaryAction = 'BUY';
      confidence += 0.2;
      reasoning.push('Bullish: Uptrend with healthy RSI support.');
      log('Signal: Uptrend + Healthy RSI -> BUY Opportunity');
    } else if (rsiState === 'OVERBOUGHT') {
      decisions = ['HOLD', 'REDUCE']; 
      primaryAction = 'HOLD'; 
      confidence += 0.1;
      reasoning.push('Caution: Uptrend but RSI is overbought. Consider taking partial profits.');
      log('Signal: Uptrend but Overbought -> CAUTION/HOLD');
    } else {
      decisions = ['HOLD', 'BUY_MORE'];
      primaryAction = 'HOLD';
      reasoning.push('Uptrend continues, maintaining position.');
      log('Signal: Uptrend Continuation -> HOLD');
    }
  } else if (regime === 'DOWNTREND') {
    if (rsiState === 'OVERBOUGHT') {
      decisions = ['EXIT', 'REDUCE'];
      primaryAction = 'SELL';
      confidence += 0.2;
      reasoning.push('Bearish: Downtrend with overbought bounce. Sell signal.');
      log('Signal: Downtrend + Overbought Bounce -> SELL');
    } else if (rsiState === 'OVERSOLD') {
      decisions = ['HOLD', 'REALLOCATE']; 
      primaryAction = 'HOLD';
      reasoning.push('Downtrend extended, RSI oversold. Waiting for bounce.');
      log('Signal: Downtrend + Oversold -> HOLD (Wait for bounce)');
    } else {
      decisions = ['REDUCE', 'EXIT'];
      primaryAction = 'SELL';
      confidence += 0.1;
      reasoning.push('Downtrend active, reducing exposure.');
      log('Signal: Downtrend Active -> SELL/REDUCE');
    }
  } else { 
    if (rsiState === 'OVERSOLD') {
      decisions = ['BUY_MORE', 'HOLD']; 
      primaryAction = 'BUY';
      confidence += 0.1;
      reasoning.push('Range bound: Buying at support (Oversold).');
      log('Signal: Range Bound Support -> BUY');
    } else if (rsiState === 'OVERBOUGHT') {
      decisions = ['REDUCE', 'HOLD']; 
      primaryAction = 'SELL';
      confidence += 0.1;
      reasoning.push('Range bound: Selling at resistance (Overbought).');
      log('Signal: Range Bound Resistance -> SELL');
    } else {
      decisions = ['HOLD', 'REALLOCATE'];
      primaryAction = 'HOLD';
      reasoning.push('Range bound with neutral signals. Holding.');
      log('Signal: Range Bound Neutral -> HOLD');
    }
  }

  if (volState === 'HIGH') {
    confidence -= 0.1;
    reasoning.push('High volatility detected, reducing confidence.');
    if (decisions[0] === 'BUY_MORE') decisions[1] = 'HOLD'; 
    log('Adjustment: High Volatility -> Reducing Confidence');
  } else if (volState === 'LOW') {
    confidence += 0.1;
    reasoning.push('Low volatility environment favors trend following.');
    log('Adjustment: Low Volatility -> Increasing Confidence');
  }

  if (latestClose < ma20 && regime === 'UPTREND') {
     confidence -= 0.1;
     reasoning.push('Warning: Price below short-term MA20 despite uptrend.');
     log('Warning: Price below MA20 in Uptrend');
  }

  confidence = Math.max(0.3, Math.min(0.85, confidence));

  log(`Final Decision: ${primaryAction} (Confidence: ${(confidence*100).toFixed(1)}%)`);
  log('-------------------------------------------');

  return {
    agent: 'technical',
    symbol,
    action: primaryAction, 
    decisions,             
    confidence,
    reason: reasoning.join(' '), 
    reasoning,             
    data: {
      latestClose,
      ma20,
      ma50,
      ma100,
      rsi,
      volatility,
      slope,
      regime,
      rsiState,
      volState,
      price: latestClose
    },
    logs
  };
}
