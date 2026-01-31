
require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');
const { Schema } = mongoose;
const http = require('http');


const PortfolioSchema = new Schema({ 
    userId: Schema.Types.ObjectId, 
    cashAvailable: { type: Number, default: 10000 },
    totalValue: { type: Number, default: 10000 }
});
const PositionSchema = new Schema({
    userId: Schema.Types.ObjectId,
    symbol: String,
    qty: Number,
    avgPrice: Number,
    currentPrice: Number
});
const TradeLogSchema = new Schema({
    userId: Schema.Types.ObjectId,
    symbol: String,
    action: String,
    qty: Number,
    price: Number,
    pnl: Number
});

const Portfolio = mongoose.models.Portfolio || mongoose.model('Portfolio', PortfolioSchema);
const Position = mongoose.models.Position || mongoose.model('Position', PositionSchema);
const TradeLog = mongoose.models.TradeLog || mongoose.model('TradeLog', TradeLogSchema);

async function callApi(path, method = 'GET', body = null) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 3000,
            path: path,
            method: method,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        if (body) {
            options.headers['Content-Length'] = JSON.stringify(body).length;
        }

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(JSON.parse(data)));
        });

        req.on('error', reject);
        if (body) req.write(JSON.stringify(body));
        req.end();
    });
}

async function runDemo() {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to DB');

    // 1. Reset Portfolio for fresh start
    const portfolio = await Portfolio.findOne();
    if (portfolio) {
        portfolio.cashAvailable = 10000;
        await portfolio.save();
        // Clear positions and logs
        await Position.deleteMany({ userId: portfolio.userId });
        await TradeLog.deleteMany({ userId: portfolio.userId });
        console.log('Portfolio reset to $10,000. Positions and logs cleared.');
    } else {
        console.log('No portfolio found to reset. Please ensure server creates one first.');
        process.exit(1);
    }

    const portfolioId = portfolio._id.toString();

    // 2. Buy 10 shares of IBM manually
    console.log('\n--- Buying 10 shares of IBM ---');
    const buyRes = await callApi('/api/execute', 'POST', {
        portfolioId,
        symbol: 'IBM',
        action: 'BUY',
        quantity: 10
    });
    console.log('Buy Result:', buyRes);

    // 3. View Portfolio (PnL)
    console.log('\n--- Viewing Portfolio PnL ---');
    const portRes = await callApi('/api/portfolio');
    if (portRes.success) {
        console.log(`Cash: $${portRes.portfolio.cashAvailable}`);
        console.log(`Total Value: $${portRes.portfolio.totalValue}`);
        console.log('Positions:', portRes.positions.map(p => 
            `${p.symbol}: ${p.qty} shares @ $${p.avgPrice.toFixed(2)} (Val: $${p.currentValue.toFixed(2)}, PnL: $${p.unrealizedPnL.toFixed(2)})`
        ));
    }

    // 4. Sell 5 shares of IBM manually
    console.log('\n--- Selling 5 shares of IBM ---');
    const sellRes = await callApi('/api/execute', 'POST', {
        portfolioId,
        symbol: 'IBM',
        action: 'SELL',
        quantity: 5
    });
    console.log('Sell Result:', sellRes);

    // 5. View History
    console.log('\n--- Viewing Trade History ---');
    const logRes = await callApi('/api/logs');
    if (logRes.success) {
        console.log('Logs:', logRes.logs.map(l => 
            `${l.timestamp}: ${l.action} ${l.qty} ${l.symbol} @ $${l.price} (PnL: ${l.pnl})`
        ));
    }

    mongoose.disconnect();
}

runDemo();
