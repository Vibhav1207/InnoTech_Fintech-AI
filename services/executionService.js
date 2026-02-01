import Portfolio from '../models/Portfolio';
import Position from '../models/Position';
import TradeLog from '../models/TradeLog';
import ExecutionLog from '../models/ExecutionLog';
import { getQuote } from './alphaVantageService';

const ALLOCATION_PER_TRADE = 0.10; 
const REALLOCATION_PCT = 0.05; 
const REDUCE_PCT = 0.50; 

export async function executeDecision(portfolioId, symbol, decision, confidence, agentId = 'master', manualOverride = {}) {
    console.log(`\n--- Execution Engine: Processing ${decision} for ${symbol} ---`);

    const logExecution = async (status, message, quantity = 0, price = 0, metadata = {}) => {
        try {
            await ExecutionLog.create({
                symbol,
                action: decision,
                quantity,
                price,
                status,
                message,
                source: agentId,
                portfolioId,
                metadata: { ...manualOverride, confidence, ...metadata }
            });
        } catch (err) {
            console.error('Failed to log execution:', err);
        }
    };

    if (decision === 'HOLD') {
        console.log('Decision is HOLD. No execution required.');
        await logExecution('SKIPPED', 'Decision is HOLD');
        return { success: true, action: 'HOLD', message: 'No action taken' };
    }

    const portfolio = await Portfolio.findById(portfolioId);
    if (!portfolio) {
        await logExecution('FAILED', 'Portfolio not found');
        throw new Error('Portfolio not found');
    }

    const quote = await getQuote(symbol);
    if (!quote || quote.error) {
        const err = quote?.error || 'Unknown error';
        await logExecution('FAILED', 'Market data failed: ' + err);
        throw new Error('Failed to fetch market data: ' + err);
    }
    const price = quote.price;

    const position = await Position.findOne({ userId: portfolio.userId, symbol });
    const currentQty = position ? position.qty : 0;

    let actionToLog = '';
    let quantityToTrade = 0;
    let pnl = 0;

    if (decision === 'BUY' || decision === 'BUY_MORE') {
        actionToLog = 'BUY';
        
        const cash = portfolio.cashAvailable;
        let totalCost = 0;

        if (manualOverride.quantity) {
            quantityToTrade = manualOverride.quantity;
            totalCost = quantityToTrade * price;
        } else if (manualOverride.amount) {
            if (manualOverride.amount > cash) {
                 await logExecution('FAILED', 'Insufficient funds for requested amount', 0, price);
                 return { success: false, message: 'Insufficient funds for requested amount' };
            }
            quantityToTrade = Math.floor(manualOverride.amount / price);
            totalCost = quantityToTrade * price;
        } else {
            let amountToInvest = 0;
            if (decision === 'BUY') {
                amountToInvest = cash * ALLOCATION_PER_TRADE;
            } else {
                amountToInvest = cash * REALLOCATION_PCT;
            }
            quantityToTrade = Math.floor(amountToInvest / price);
            totalCost = quantityToTrade * price;
        }

        if (quantityToTrade <= 0) {
            await logExecution('FAILED', 'Quantity to buy is 0', 0, price);
            return { success: false, message: 'Quantity to buy is 0 (insufficient funds or low amount)' };
        }

        if (totalCost > cash) {
            console.log('Insufficient cash.');
            await logExecution('FAILED', 'Insufficient funds', quantityToTrade, price);
            return { success: false, message: 'Insufficient funds' };
        }

        portfolio.cashAvailable -= totalCost;
        
        if (position) {
            const newQty = position.qty + quantityToTrade;
            const newAvgPrice = ((position.avgPrice * position.qty) + totalCost) / newQty;
            position.qty = newQty;
            position.avgPrice = newAvgPrice;
            await position.save();
        } else {
            await Position.create({
                userId: portfolio.userId,
                symbol,
                qty: quantityToTrade,
                avgPrice: price,
                currentPrice: price
            });
        }
        await portfolio.save();
    }

    else if (['SELL', 'EXIT', 'REDUCE', 'REALLOCATE'].includes(decision)) {
        actionToLog = 'SELL';
        
        if (!position || currentQty === 0) {
            console.log('No position to sell.');
            await logExecution('FAILED', 'No position to sell', 0, price);
            return { success: false, message: 'No position to sell' };
        }

        if (manualOverride.quantity) {
            quantityToTrade = manualOverride.quantity;
            if (quantityToTrade > currentQty) {
                quantityToTrade = currentQty; 
            }
        } else {
            if (decision === 'EXIT' || decision === 'SELL' || decision === 'REALLOCATE') {
                quantityToTrade = currentQty; 
            } else if (decision === 'REDUCE') {
                quantityToTrade = Math.floor(currentQty * REDUCE_PCT);
                if (quantityToTrade === 0) quantityToTrade = 1; 
            }
        }

        const totalProceeds = quantityToTrade * price;
        
        portfolio.cashAvailable += totalProceeds;
        
        pnl = (price - position.avgPrice) * quantityToTrade;

        position.qty -= quantityToTrade;
        if (position.qty <= 0) {
            await Position.deleteOne({ _id: position._id });
        } else {
            await position.save();
        }
        await portfolio.save();
    }

    if (quantityToTrade > 0) {
        await TradeLog.create({
            userId: portfolio.userId,
            symbol,
            action: actionToLog,
            qty: quantityToTrade,
            price,
            pnl: actionToLog === 'SELL' ? pnl : 0,
            agentSource: agentId,
            timestamp: new Date()
        });
        
        console.log(`Executed ${actionToLog} ${quantityToTrade} shares of ${symbol} at $${price}`);
    }

    await logExecution('SUCCESS', 'Executed', quantityToTrade, price, { pnl });

    return {
        success: true,
        action: actionToLog,
        quantity: quantityToTrade,
        price,
        newBalance: portfolio.cashAvailable,
        pnl
    };
}
