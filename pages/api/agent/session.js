import dbConnect from '../../../lib/db';
import AgentSession from '../../../models/AgentSession';
import User from '../../../models/User';

export default async function handler(req, res) {
    await dbConnect();

    let user = await User.findOne({});
    if (!user) {
        user = await User.create({ 
            name: 'Demo User', 
            email: 'demo@innotech.com', 
            password: 'password123' 
        });
    }
    const userId = user._id;

    if (req.method === 'GET') {
        try {
            let session = await AgentSession.findOne({ userId });
            if (!session) {
                session = await AgentSession.create({
                    userId,
                    status: 'STOPPED',
                    wishlist: ['IBM', 'AAPL', 'MSFT'],
                    maxCapital: 1000,
                    maxTradesPerDay: 5
                });
            }
            res.status(200).json(session);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    } else if (req.method === 'POST') {
        try {
            const { wishlist, maxCapital, maxTradesPerDay, status } = req.body;
            const updateData = {};
            if (wishlist) updateData.wishlist = wishlist;
            if (maxCapital) updateData.maxCapital = maxCapital;
            if (maxTradesPerDay) updateData.maxTradesPerDay = maxTradesPerDay;
            if (status) {
                updateData.status = status;
                if (status === 'RUNNING') {
                    updateData.startedAt = new Date();
                    updateData.stoppedAt = null;
                    updateData.consecutiveWins = 0;
                    updateData.consecutiveLosses = 0;
                    updateData.sessionPnL = 0;
                } else if (status === 'STOPPED' || status === 'PAUSED') {
                    updateData.stoppedAt = new Date();
                }
            }
            
            const session = await AgentSession.findOneAndUpdate(
                { userId },
                { $set: updateData },
                { new: true, upsert: true }
            );
            res.status(200).json(session);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    } else {
        res.status(405).end();
    }
}
