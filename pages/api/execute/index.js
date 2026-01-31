import dbConnect from '../../../lib/db';
import { executeDecision } from '../../../services/executionService';

export default async function handler(req, res) {
  await dbConnect();

  if (req.method === 'POST') {
    const { portfolioId, symbol, decision, action, confidence, agentId } = req.body;

    const effectiveDecision = decision || action;

    if (!portfolioId || !symbol || !effectiveDecision) {
        return res.status(400).json({ success: false, message: 'Missing required fields: portfolioId, symbol, decision' });
    }

    try {
      const manualOverride = {};
      if (req.body.quantity) manualOverride.quantity = parseInt(req.body.quantity);
      if (req.body.amount) manualOverride.amount = parseFloat(req.body.amount);

      const result = await executeDecision(portfolioId, symbol, effectiveDecision, confidence || 0.5, agentId || 'manual', manualOverride);
      
      if (result.success) {
          res.status(200).json(result);
      } else {
          res.status(400).json(result);
      }

    } catch (error) {
      console.error('Execution Error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  } else {
    res.status(405).json({ success: false, message: 'Method not allowed' });
  }
}
