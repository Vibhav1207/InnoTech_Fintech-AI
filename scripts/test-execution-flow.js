require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');
const { Schema } = mongoose;

const UserSchema = new Schema({ name: String, email: String });
const PortfolioSchema = new Schema({ 
    userId: Schema.Types.ObjectId, 
    cashAvailable: { type: Number, default: 100000 },
    totalValue: { type: Number, default: 0 }
});

const User = mongoose.models.User || mongoose.model('User', UserSchema);
const Portfolio = mongoose.models.Portfolio || mongoose.model('Portfolio', PortfolioSchema);

async function setup() {
    if (!process.env.MONGODB_URI) {
        console.error('MONGODB_URI missing in .env.local');
        process.exit(1);
    }

    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to DB');

    let user = await User.findOne({ email: 'execution_test@example.com' });
    if (!user) {
        user = await User.create({ name: 'Execution Test User', email: 'execution_test@example.com' });
        console.log('Created User:', user._id);
    } else {
        console.log('Found User:', user._id);
    }

    let portfolio = await Portfolio.findOne({ userId: user._id });

    if (!portfolio) {
        portfolio = await Portfolio.create({ userId: user._id, cashAvailable: 100000 });
        console.log('Created Portfolio:', portfolio._id);
    } else {
        portfolio.cashAvailable = 100000;

        await portfolio.save();
        console.log('Found Portfolio:', portfolio._id, '(Cash reset to 100k)');
    }

    console.log('PORTFOLIO_ID=' + portfolio._id);
    
    const http = require('http');
    const data = JSON.stringify({
        portfolioId: portfolio._id.toString(),
        symbol: 'IBM',
        decision: 'REDUCE',
        confidence: 0.85,
        agentId: 'test-script'
    });

    const options = {
        hostname: 'localhost',
        port: 3000,
        path: '/api/execute',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': data.length
        }
    };

    console.log('\n--- Triggering Execution (REDUCE IBM) ---');
    const req = http.request(options, (res) => {
        let responseBody = '';
        res.on('data', (chunk) => responseBody += chunk);
        res.on('end', () => {
            console.log('Response Status:', res.statusCode);
            console.log('Response Body:', responseBody);
            mongoose.disconnect();
        });
    });

    req.on('error', (e) => {
        console.error('Request Error:', e);
        mongoose.disconnect();
    });

    req.write(data);
    req.end();
}

setup();
