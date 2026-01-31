
require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');

const TradeLogSchema = new mongoose.Schema({
    userId: mongoose.Schema.Types.ObjectId,
    symbol: String,
    action: String,
    qty: Number,
    price: Number,
    pnl: Number,
    agentSource: String,
    timestamp: Date
});

const TradeLog = mongoose.models.TradeLog || mongoose.model('TradeLog', TradeLogSchema);

async function cleanLogs() {
    if (!process.env.MONGODB_URI) {
        console.error('MONGODB_URI missing');
        process.exit(1);
    }
    
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to DB');

    const res = await TradeLog.deleteMany({ agentSource: 'test-script' });
    console.log(`Deleted ${res.deletedCount} logs from 'test-script'.`);

    mongoose.disconnect();
}

cleanLogs();
