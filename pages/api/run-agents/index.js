import dbConnect from '../../../lib/db';
import * as masterAgent from '../../../agents/master';
import AgentDecision from '../../../models/AgentDecision';

export default async function handler(req, res) {
  await dbConnect();

  if (req.method === 'POST') {
    const { symbol, portfolioId } = req.body;

    if (!symbol) {
        return res.status(400).json({ success: false, message: 'Symbol is required' });
    }

    try {
      const decisionResult = await masterAgent.makeDecision(symbol, { _id: portfolioId });

      await AgentDecision.create({
          agentName: 'master',
          symbol,
          decision: decisionResult.action,
          confidence: decisionResult.confidence,
          reasoning: decisionResult.reason,
          marketSnapshot: {
            subDecisions: decisionResult.subDecisions
          }
      });

      res.status(200).json({ success: true, decision: decisionResult });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, error: error.message });
    }
  } else {
    res.status(405).json({ success: false, message: 'Method not allowed' });
  }
}
