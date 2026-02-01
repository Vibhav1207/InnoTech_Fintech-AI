import { getDailyAdjustedData } from '../../services/alphaVantageService';

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

export async function analyze(symbol, portfolio) {
    const logs = [];
    const log = (msg) => {
        console.log(msg);
        logs.push(`[RISK] ${msg}`);
    };

    log(`--- Liquidity & Exit Risk Analysis for ${symbol} ---`);

    let dailyData = await getDailyAdjustedData(symbol);

    if (!dailyData || dailyData.length < 30) {
        console.warn(`Insufficient data for ${symbol}. Recommending CAUTION.`);
        log('ERROR: Insufficient data for risk analysis.');
        return {
            agent: 'risk',
            symbol,
            action: 'HOLD',
            confidence: 0.6,
            reason: 'Insufficient historical data for risk analysis',
            data: {},
            logs
        };
    }

    const prices = dailyData.map(d => d.close);
    const volumes = dailyData.map(d => d.volume);

    const lookback = 20;
    
    const vol20 = calculateSMA(volumes.slice(0, 20));
    const vol20Std = calculateStdDev(volumes.slice(0, 20));
    const volumeStability = vol20 > 0 ? vol20Std / vol20 : 0;
    
    log(`Volume Stability (CV): ${volumeStability.toFixed(2)}`);

    const logReturns = [];
    for (let i = 0; i < lookback; i++) {
        if (prices[i+1]) {
            const logRet = Math.log(prices[i] / prices[i+1]);
            logReturns.push(logRet);
        }
    }
    const volatility20 = calculateStdDev(logReturns);
    
    log(`Volatility (20d): ${(volatility20*100).toFixed(2)}%`);

    const amihudValues = [];
    for (let i = 0; i < lookback; i++) {
        if (prices[i+1]) {
            const ret = Math.abs((prices[i] - prices[i+1]) / prices[i+1]);
            const dollarVol = prices[i] * volumes[i];
            const amihud = dollarVol > 0 ? ret / dollarVol : 0;
            amihudValues.push(amihud);
        }
    }
    const amihudAvg = calculateSMA(amihudValues) * 1000000;
    
    log(`Liquidity Proxy (Amihud): ${amihudAvg.toFixed(4)}`);

    let riskScore = 0;
    const warnings = [];

    if (volatility20 > 0.03) {
        riskScore += 30;
        warnings.push('High volatility detected');
        log('Risk +30: High Volatility');
    }

    if (volumeStability > 0.5) {
        riskScore += 20;
        warnings.push('Erratic volume detected');
        log('Risk +20: Erratic Volume');
    }

    if (amihudAvg > 0.1) {
        riskScore += 20;
        warnings.push('Potential liquidity issues (high price impact)');
        log('Risk +20: Low Liquidity');
    }

    if (portfolio && portfolio.positions) {
        const position = portfolio.positions.find(p => p.symbol === symbol);
        if (position) {
            const positionValue = position.quantity * prices[0];
            const portfolioValue = portfolio.totalValue;
            if (positionValue / portfolioValue > 0.2) {
                riskScore += 30;
                warnings.push('High portfolio concentration (>20%)');
                log('Risk +30: High Portfolio Concentration');
            }
        }
    }

    log(`Total Risk Score: ${riskScore}`);

    let action = 'HOLD';
    let decisions = ['HOLD', 'HOLD'];
    let exitRiskState = 'LOW';

    if (riskScore > 60) {
        action = 'SELL';
        decisions = ['SELL', 'EXIT'];
        warnings.push('CRITICAL RISK: High Volatility/Liquidity Risk.');
        exitRiskState = 'HIGH';
    } else if (riskScore > 30) {
        action = 'REDUCE';
        decisions = ['REDUCE', 'HOLD'];
        warnings.push('ELEVATED RISK: Monitor closely.');
        exitRiskState = 'MEDIUM';
    } else {
        decisions = ['HOLD', 'BUY_MORE'];
    }
    
    const confidence = Math.min(riskScore / 100, 1.0);

    log(`Action: ${action} (Confidence: ${(confidence*100).toFixed(0)}%)`);

    return {
        agent: 'risk',
        symbol,
        action,
        decisions,
        confidence,
        reason: warnings.length > 0 ? warnings.join('; ') : 'Risk profile acceptable.',
        data: {
            volatility: volatility20,
            riskScore,
            exitRiskState
        },
        logs
    };
}
