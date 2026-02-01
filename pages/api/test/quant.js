
import * as quantAgent from '../../../agents/quant';

export default async function handler(req, res) {
    const symbol = (req.query.symbol || 'IBM').toUpperCase();
    console.log(`\nStarting Quant Agent Analysis for ${symbol}...`);

    try {
        const result = await quantAgent.analyze(symbol);
        res.status(200).json(result);
    } catch (error) {
        console.error('Quant Analysis Failed:', error);
        res.status(500).json({ error: error.message });
    }
}
