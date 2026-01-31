import dbConnect from '../../../lib/db';
import AgentDecision from '../../../models/AgentDecision';

export default async function handler(req, res) {
  await dbConnect();

  if (req.method === 'GET') {
    try {
      const decisions = await AgentDecision.find({})
        .sort({ createdAt: -1 })
        .limit(20);
      
      res.status(200).json({ success: true, decisions });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  } else {
    res.status(405).json({ success: false, message: 'Method not allowed' });
  }
}
