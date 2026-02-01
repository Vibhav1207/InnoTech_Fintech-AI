
import * as liquidityAgent from '../../../agents/liquidity';

export default async function handler(req, res) {
    const symbol = (req.query.symbol || 'IBM').toUpperCase();
    console.log(`\nStarting Liquidity Agent Analysis for ${symbol}...`);

    try {
        const result = await liquidityAgent.analyze(symbol);
        res.status(200).json(result);
    } catch (error) {
        console.error('Liquidity Analysis Failed:', error);
        res.status(500).json({ error: error.message });
    }
}
