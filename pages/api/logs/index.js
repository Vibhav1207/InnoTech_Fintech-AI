import dbConnect from '../../../lib/db';
import ActivityLog from '../../../models/ActivityLog';
import AgentSession from '../../../models/AgentSession';
import User from '../../../models/User';

export default async function handler(req, res) {
    await dbConnect();

    try {
        const user = await User.findOne({});
        if (!user) return res.status(404).json({ error: 'User not found' });
        
        const session = await AgentSession.findOne({ userId: user._id });
        if (!session) return res.status(404).json({ error: 'Session not found' });

        const logs = await ActivityLog.find({ sessionId: session._id })
            .sort({ timestamp: -1 })
            .limit(100);

        res.status(200).json({ logs });
    } catch (error) {
        console.error('Fetch Logs Error:', error);
        res.status(500).json({ error: 'Failed to fetch logs' });
    }
}
