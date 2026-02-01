
import * as riskAgent from '../../../agents/risk';

const mockPortfolio = {
    _id: 'mock-portfolio-id',
    positions: [],
    cash: 100000,
    totalValue: 100000
};

export default async function handler(req, res) {
    const symbol = (req.query.symbol || 'IBM').toUpperCase();
    console.log(`\nStarting Risk Agent Analysis for ${symbol}...`);

    try {
        const result = await riskAgent.analyze(symbol, mockPortfolio);
        res.status(200).json(result);
    } catch (error) {
        console.error('Risk Analysis Failed:', error);
        res.status(500).json({ error: error.message });
    }
}
