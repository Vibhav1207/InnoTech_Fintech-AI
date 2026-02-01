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

      const confidence = Math.min(Math.abs(decisionResult.finalIntentScore) / 3, 0.99);

      // Use the exact action from the decision result instead of mapping to generic BUY/SELL
      const dbAction = decisionResult.finalAction;

      await AgentDecision.create({
          agentName: 'master',
          symbol,
          decision: dbAction,
          confidence: confidence,
          reasoning: decisionResult.reasoning,
          marketSnapshot: {
            detailedAction: decisionResult.finalAction,
            intentScore: decisionResult.finalIntentScore,
            topCandidates: decisionResult.top4Candidates,
            scoringBreakdown: decisionResult.scoringBreakdown,
            vetoApplied: decisionResult.vetoApplied,
            logs: decisionResult.logs
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
