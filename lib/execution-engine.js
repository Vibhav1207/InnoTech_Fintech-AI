import * as PortfolioManager from './portfolio-manager';

const SLIPPAGE = 0.002;
const MAX_TRADES_PER_LOOP = 2;

export async function executeBatch(userId, masterDecisions, currentPrices, sessionConfig) {
    let tradesExecutedCost = 0;
    const results = [];
    const { maxTradesPerDay, tradesUsedToday, maxCapital } = sessionConfig;
    let currentTradesUsed = tradesUsedToday;

    if (currentTradesUsed >= maxTradesPerDay) {
        return { tradesExecuted: 0, results: [], message: 'Daily trade limit reached.' };
    }

    const actionable = masterDecisions.filter(d => d.finalAction !== 'HOLD');

    actionable.sort((a, b) => Math.abs(b.finalIntentScore) - Math.abs(a.finalIntentScore));

    for (const decision of actionable) {
        const executionsInLoop = results.filter(r => r.status === 'EXECUTED').length;
        if (executionsInLoop >= MAX_TRADES_PER_LOOP) break;
        
        if (currentTradesUsed >= maxTradesPerDay) {
             break;
        }

        const { symbol, finalAction, finalIntentScore, reasoning } = decision;
        const price = currentPrices[symbol];
        
        if (!price) {
            results.push({ symbol, status: 'SKIPPED', reason: 'No price data' });
            continue;
        }

        const tradeCost = finalAction === 'REALLOCATE' ? 2 : 1;

        if (currentTradesUsed + tradeCost > maxTradesPerDay) {
             results.push({ symbol, status: 'SKIPPED', reason: `Insufficient daily trades (Cost: ${tradeCost}, Left: ${maxTradesPerDay - currentTradesUsed})` });
             continue;
        }

        const executionPrice = finalAction === 'BUY_MORE' || finalAction === 'BUY' 
            ? price * (1 + SLIPPAGE) 
            : price * (1 - SLIPPAGE);

        try {
            const { portfolio, positions } = await PortfolioManager.getPortfolio(userId);
            const position = positions.find(p => p.symbol === symbol);
            
            let qtyToTrade = 0;
            let tradeAction = 'HOLD';
            let intent = finalAction;

            if (finalAction === 'BUY_MORE' || finalAction === 'BUY') {
                tradeAction = 'BUY';
                
                const baseAllocation = maxCapital * 0.2;
                const confidenceMultiplier = Math.min(Math.abs(finalIntentScore), 1);
                let amountToInvest = baseAllocation * confidenceMultiplier;

                if (amountToInvest > portfolio.cashAvailable) {
                    amountToInvest = portfolio.cashAvailable;
                }

                if (amountToInvest < 10) {
                     results.push({ symbol, status: 'SKIPPED', reason: 'Insufficient funds for min trade' });
                     continue;
                }

                qtyToTrade = Math.floor(amountToInvest / executionPrice);
            } 
            
            else if (finalAction === 'REDUCE' || finalAction === 'EXIT' || finalAction === 'REALLOCATE') {
                tradeAction = 'SELL';
                if (!position || position.qty <= 0) {
                    results.push({ symbol, status: 'SKIPPED', reason: 'No position to sell' });
                    continue;
                }

                if (finalAction === 'EXIT' || finalAction === 'REALLOCATE') {
                    qtyToTrade = position.qty;
                } else if (finalAction === 'REDUCE') {
                    const reducePct = 0.5 * Math.min(Math.abs(finalIntentScore), 1);
                    qtyToTrade = Math.ceil(position.qty * reducePct);
                }
            }

            if (qtyToTrade > 0) {
                const executionRes = await PortfolioManager.updatePosition(
                    userId, 
                    symbol, 
                    tradeAction, 
                    qtyToTrade, 
                    executionPrice, 
                    intent, 
                    'master', 
                    reasoning, 
                    finalIntentScore
                );
                
                tradesExecutedCost += tradeCost;
                currentTradesUsed += tradeCost;
                results.push({ 
                    symbol, 
                    status: 'EXECUTED', 
                    action: tradeAction, 
                    qty: qtyToTrade, 
                    price: executionPrice, 
                    cost: tradeCost,
                    realizedPnL: executionRes.realizedPnL || 0 
                });
            } else {
                results.push({ symbol, status: 'SKIPPED', reason: 'Calculated qty 0' });
            }

        } catch (error) {
            console.error(`Execution failed for ${symbol}:`, error);
            results.push({ symbol, status: 'FAILED', reason: error.message });
        }
    }

    return { tradesExecuted: tradesExecutedCost, results };
}
