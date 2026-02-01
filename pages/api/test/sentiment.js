
import * as sentimentAgent from '../../../agents/sentiment';

export default async function handler(req, res) {
    const symbol = (req.query.symbol || 'IBM').toUpperCase();
    console.log(`\nStarting Sentiment Agent Analysis for ${symbol}...`);

    try {
        const result = await sentimentAgent.analyze(symbol);
        res.status(200).json(result);
    } catch (error) {
        console.error('Sentiment Analysis Failed:', error);
        res.status(500).json({ error: error.message });
    }
}
