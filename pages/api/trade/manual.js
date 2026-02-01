import dbConnect from '../../../lib/db';
import User from '../../../models/User';
import * as ExecutionEngine from '../../../lib/execution-engine';

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).end();
    await dbConnect();

    try {
        const { symbol, action, qty } = req.body;
        const user = await User.findOne({});
        const userId = user._id;

        const mockPrice = 150.00;

        const result = await ExecutionEngine.executeTrade(
            userId,
            symbol,
            action,
            qty,
            mockPrice,
            'MANUAL_OVERRIDE',
            'User',
            'Manual User Override',
            1.0
        );

        res.status(200).json({ success: true, result });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}
