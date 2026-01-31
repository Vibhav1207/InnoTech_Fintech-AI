import dbConnect from '../../../lib/db';
import TradeLog from '../../../models/TradeLog';

export default async function handler(req, res) {
  await dbConnect();

  if (req.method === 'GET') {
    try {
      const { userId } = req.query;
      const query = userId ? { userId } : {};
      const logs = await TradeLog.find(query).sort({ timestamp: -1 });
      res.status(200).json({ success: true, logs });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  } else {
    res.status(405).json({ success: false, message: 'Method not allowed' });
  }
}
