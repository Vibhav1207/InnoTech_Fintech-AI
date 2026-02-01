import dbConnect from '../../../lib/db';
import User from '../../../models/User';
import Portfolio from '../../../models/Portfolio';
import { executeDecision } from '../../../services/executionService';

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).end();
    await dbConnect();

    try {
        const { symbol, action, qty } = req.body;
        const user = await User.findOne({});
        const userId = user._id;

        const portfolio = await Portfolio.findOne({ userId });
        if (!portfolio) {
            return res.status(404).json({ error: 'Portfolio not found' });
        }

        const result = await executeDecision(
            portfolio._id,
            symbol,
            action,
            1.0, // confidence
            'manual', // agentId
            { quantity: parseInt(qty) } // manualOverride
        );

        res.status(200).json({ success: result.success, result });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}
