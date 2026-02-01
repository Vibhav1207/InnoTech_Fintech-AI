
import * as technicalAgent from '../../../agents/technical';

export default async function handler(req, res) {
    const symbol = (req.query.symbol || 'IBM').toUpperCase();
    console.log(`\nStarting Technical Agent Analysis for ${symbol}...`);

    try {
        const result = await technicalAgent.analyze(symbol);
        res.status(200).json(result);
    } catch (error) {
        console.error('Technical Analysis Failed:', error);
        res.status(500).json({ error: error.message });
    }
}
