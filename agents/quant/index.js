import { getDailyAdjustedData } from '../../services/alphaVantageService';

function calculateMomentum(currentPrice, oldPrice) {
    if (!oldPrice) return 0;
    return ((currentPrice - oldPrice) / oldPrice);
}

function calculateSMA(data) {
    if (data.length === 0) return 0;
    const sum = data.reduce((a, b) => a + b, 0);
    return sum / data.length;
}

function calculateStdDev(data) {
    if (data.length === 0) return 0;
    const mean = calculateSMA(data);
    const squareDiffs = data.map(value => Math.pow(value - mean, 2));
    const avgSquareDiff = calculateSMA(squareDiffs);
    return Math.sqrt(avgSquareDiff);
}

export async function analyze(symbol) {
    const logs = [];
    const log = (msg) => {
        console.log(msg);
        logs.push(`[QUANT] ${msg}`);
    };

    log(`--- Quantitative Momentum Analysis for ${symbol} ---`);

    let dailyData = await getDailyAdjustedData(symbol);

    if (!dailyData || dailyData.length < 30) {
        console.warn(`Insufficient data for ${symbol}. Returning HOLD.`);
        log('ERROR: Insufficient data for quant analysis.');
        return {
            agent: 'quant',
            symbol,
            action: 'HOLD',
            confidence: 0.5,
            reason: 'Insufficient historical data for quantitative analysis.',
            data: {},
            logs
        };
    }

    const currentDay = dailyData[0];
    const prices = dailyData.map(d => d.close);
    
    // Momentum
    const price5dAgo = prices[5];
    const mom5 = calculateMomentum(currentDay.close, price5dAgo);
    
    const price20dAgo = prices[20];
    const mom20 = calculateMomentum(currentDay.close, price20dAgo);

    log(`Momentum Metrics: 5d=${(mom5*100).toFixed(2)}%, 20d=${(mom20*100).toFixed(2)}%`);

    // Breakout
    const last10DaysPrices = prices.slice(1, 11);
    const recentHigh = Math.max(...last10DaysPrices);
    const isBreakout = currentDay.close > recentHigh;
    
    if (isBreakout) log('Breakout Detected: Price > 10d High');

    // Volatility / Z-Score
    const last20Prices = prices.slice(0, 20);
    const sma20 = calculateSMA(last20Prices);
    const stdDev20 = calculateStdDev(last20Prices);
    const zScore = stdDev20 !== 0 ? (currentDay.close - sma20) / stdDev20 : 0;
    
    log(`Statistical Stats: SMA20=${sma20.toFixed(2)}, Z-Score=${zScore.toFixed(2)}`);

    let score = 0;
    const reasons = [];

    // Scoring Logic
    if (mom5 > 0.02) {
        score += 20;
        reasons.push('Strong short-term momentum (>2%)');
        log('Score +20: Strong short-term momentum');
    } else if (mom5 < -0.02) {
        score -= 20;
        reasons.push('Weak short-term momentum (<-2%)');
        log('Score -20: Weak short-term momentum');
    }

    if (mom20 > 0.05) {
        score += 20;
        reasons.push('Strong monthly trend (>5%)');
        log('Score +20: Strong monthly trend');
    } else if (mom20 < -0.05) {
        score -= 20;
        reasons.push('Weak monthly trend (<-5%)');
        log('Score -20: Weak monthly trend');
    }

    if (isBreakout) {
        score += 15;
        reasons.push('Price breaking out above 10-day high');
        log('Score +15: Breakout');
    }

    if (zScore > 2) {
        score -= 10;
        reasons.push('Price is statistically overextended (Z-Score > 2)');
        log('Score -10: Overextended (Z > 2)');
    } else if (zScore < -2) {
        score += 10;
        reasons.push('Price is statistically oversold (Z-Score < -2)');
        log('Score +10: Oversold (Z < -2)');
    }

    log(`Final Score: ${score}`);

    // Decision
    let action = 'HOLD';
    if (score >= 25) action = 'BUY';
    else if (score <= -25) action = 'SELL';

    const confidence = Math.min(Math.abs(score) / 50, 1.0); // Normalize to 0-1

    log(`Action: ${action} (Confidence: ${(confidence*100).toFixed(0)}%)`);

    return {
        agent: 'quant',
        symbol,
        action,
        confidence,
        reason: reasons.length > 0 ? reasons.join('; ') : 'Neutral quantitative signals.',
        data: {
            momentum5d: mom5,
            momentum20d: mom20,
            zScore
        },
        logs
    };
}
