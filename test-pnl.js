
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

// Mock Models
const UserSchema = new mongoose.Schema({ name: String });
const User = mongoose.model('User', UserSchema);

const PortfolioSchema = new mongoose.Schema({ 
    userId: mongoose.Schema.Types.ObjectId, 
    cashAvailable: Number, 
    totalValue: Number,
    realizedPnL: { type: Number, default: 0 },
    dailyPnL: { type: Number, default: 0 },
    cumulativePnL: { type: Number, default: 0 }
});
const Portfolio = mongoose.model('Portfolio', PortfolioSchema);

const PositionSchema = new mongoose.Schema({ 
    userId: mongoose.Schema.Types.ObjectId, 
    symbol: String, 
    qty: Number, 
    avgPrice: Number, 
    currentPrice: Number 
});
const Position = mongoose.model('Position', PositionSchema);

const TradeLogSchema = new mongoose.Schema({ 
    userId: mongoose.Schema.Types.ObjectId, 
    symbol: String, 
    action: String, 
    qty: Number, 
    price: Number, 
    pnl: Number 
});
const TradeLog = mongoose.model('TradeLog', TradeLogSchema);

async function updatePosition(userId, symbol, action, qty, price) {
    const portfolio = await Portfolio.findOne({ userId });
    let position = await Position.findOne({ userId, symbol });
    let realizedPnL = 0;

    if (action === 'SELL') {
        const proceeds = qty * price;
        const costBasis = qty * position.avgPrice;
        realizedPnL = proceeds - costBasis;

        portfolio.cashAvailable += proceeds;
        portfolio.realizedPnL += realizedPnL;
        
        position.qty -= qty;
        if (position.qty <= 0) {
            await Position.findByIdAndDelete(position._id);
        } else {
            await position.save();
        }
        await portfolio.save();
    }
    return { realizedPnL };
}

async function run() {
    const mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());

    const user = await User.create({ name: 'Test' });
    const userId = user._id;

    await Portfolio.create({ userId, cashAvailable: 1000, totalValue: 1000 });
    
    // Create Position: Buy 10 @ 100
    await Position.create({ userId, symbol: 'AAPL', qty: 10, avgPrice: 100, currentPrice: 100 });

    // Sell 5 @ 90 (Loss of 10 per share * 5 = -50)
    const res = await updatePosition(userId, 'AAPL', 'SELL', 5, 90);
    
    console.log('Realized PnL:', res.realizedPnL);
    console.log('Is Negative:', res.realizedPnL < 0);
    console.log('Value:', res.realizedPnL);

    await mongoose.disconnect();
    await mongoServer.stop();
}

run();
