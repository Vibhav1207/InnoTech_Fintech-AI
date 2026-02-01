import Portfolio from '../models/Portfolio';
import Position from '../models/Position';
import TradeLog from '../models/TradeLog';
import DailyPnLSnapshot from '../models/DailyPnLSnapshot';

export async function getPortfolio(userId) {
    let portfolio = await Portfolio.findOne({ userId });
    if (!portfolio) {
        portfolio = await Portfolio.create({ userId, cashAvailable: 1000, totalValue: 1000 });
    }
    const positions = await Position.find({ userId });
    
    let positionsValue = 0;
    let totalUnrealizedPnL = 0;

    const enrichedPositions = positions.map(pos => {
        const currentPrice = pos.currentPrice || pos.avgPrice;
        const currentValue = pos.qty * currentPrice;
        const costBasis = pos.qty * pos.avgPrice;
        const unrealizedPnL = currentValue - costBasis;
        const returnPct = costBasis > 0 ? (unrealizedPnL / costBasis) * 100 : 0;
        
        positionsValue += currentValue;
        totalUnrealizedPnL += unrealizedPnL;

        return {
            ...pos.toObject(),
            currentValue,
            unrealizedPnL,
            returnPct
        };
    });

    portfolio.totalValue = portfolio.cashAvailable + positionsValue;
    portfolio.unrealizedPnL = totalUnrealizedPnL;

    return { portfolio, positions: enrichedPositions };
}

export async function updatePrices(userId, priceMap) {
    const positions = await Position.find({ userId });
    for (const pos of positions) {
        if (priceMap[pos.symbol]) {
            pos.currentPrice = priceMap[pos.symbol];
            await pos.save();
        }
    }
}

export async function updatePosition(userId, symbol, action, qty, price, intent, agentName, reason, confidence) {
    const portfolio = await Portfolio.findOne({ userId });
    if (!portfolio) throw new Error('Portfolio not found');

    let position = await Position.findOne({ userId, symbol });
    let realizedPnL = 0;

    if (action === 'BUY') {
        const cost = qty * price;
        if (portfolio.cashAvailable < cost) {
            throw new Error(`Insufficient funds: ${portfolio.cashAvailable} < ${cost}`);
        }

        portfolio.cashAvailable -= cost;

        if (position) {
            const totalQty = position.qty + qty;
            const totalCost = (position.qty * position.avgPrice) + cost;
            position.avgPrice = totalCost / totalQty;
            position.qty = totalQty;
            position.currentPrice = price;
        } else {
            position = new Position({
                userId,
                symbol,
                qty,
                avgPrice: price,
                currentPrice: price,
                sector: 'Unknown'
            });
        }
        await position.save();
    } 
    
    else if (action === 'SELL') {
        if (!position || position.qty < qty) {
            throw new Error(`Insufficient position: ${position ? position.qty : 0} < ${qty}`);
        }

        const proceeds = qty * price;
        const costBasis = qty * position.avgPrice;
        realizedPnL = proceeds - costBasis;

        portfolio.cashAvailable += proceeds;
        portfolio.realizedPnL += realizedPnL;
        portfolio.dailyPnL += realizedPnL;
        portfolio.cumulativePnL += realizedPnL;

        position.qty -= qty;
        if (position.qty <= 0) {
            await Position.findByIdAndDelete(position._id);
            position = null;
        } else {
            position.currentPrice = price;
            await position.save();
        }
    }

    const allPositions = await Position.find({ userId });
    let positionsValue = 0;
    let totalUnrealizedPnL = 0;

    for (const p of allPositions) {
        const val = p.qty * (p.symbol === symbol ? price : p.currentPrice || p.avgPrice);
        positionsValue += val;
        totalUnrealizedPnL += (val - (p.qty * p.avgPrice));
    }

    portfolio.totalValue = portfolio.cashAvailable + positionsValue;
    portfolio.unrealizedPnL = totalUnrealizedPnL;
    
    await portfolio.save();

    await TradeLog.create({
        userId,
        symbol,
        action,
        intent,
        qty,
        price,
        pnl: action === 'SELL' ? realizedPnL : 0,
        agentSource: agentName || 'master',
        confidence: confidence || 0,
        reason: reason || ''
    });

    return { portfolio, position, realizedPnL };
}

export async function snapshotDailyPnL(userId) {
    const portfolio = await Portfolio.findOne({ userId });
    if (!portfolio) return;

    const date = new Date().toISOString().split('T')[0];
    
    await DailyPnLSnapshot.findOneAndUpdate(
        { userId, date },
        {
            realizedPnL: portfolio.dailyPnL,
            unrealizedPnL: portfolio.unrealizedPnL,
            totalValue: portfolio.totalValue
        },
        { upsert: true, new: true }
    );
}
