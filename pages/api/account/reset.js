import dbConnect from '../../../lib/db';
import User from '../../../models/User';
import Portfolio from '../../../models/Portfolio';
import Position from '../../../models/Position';
import TradeLog from '../../../models/TradeLog';
import ActivityLog from '../../../models/ActivityLog';
import AgentSession from '../../../models/AgentSession';
import DailyPnLSnapshot from '../../../models/DailyPnLSnapshot';

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).end();
    await dbConnect();

    try {
        const user = await User.findOne({});
        if (!user) return res.status(404).json({ error: 'User not found' });
        const userId = user._id;

        await Portfolio.findOneAndUpdate({ userId }, {
            cashAvailable: 10000,
            totalValue: 10000,
            unrealizedPnL: 0,
            realizedPnL: 0,
            dailyPnL: 0,
            cumulativePnL: 0
        });

        await Position.deleteMany({ userId });
        await TradeLog.deleteMany({ userId });
        await ActivityLog.deleteMany({ sessionId: { $in: await AgentSession.find({ userId }).distinct('_id') } });
        await DailyPnLSnapshot.deleteMany({ userId });
        
        await AgentSession.findOneAndUpdate({ userId }, {
            status: 'STOPPED',
            tradesUsedToday: 0,
            consecutiveWins: 0,
            consecutiveLosses: 0,
            lastTradePnL: 0,
            wishlist: []
        });

        res.status(200).json({ success: true, message: 'Account Reset Successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}
