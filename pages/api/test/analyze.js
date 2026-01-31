
import * as masterAgent from '../../../agents/master';

// Mock Portfolio for Risk Agent
const mockPortfolio = {
    _id: 'mock-portfolio-id',
    positions: [],
    cash: 100000
};

export default async function handler(req, res) {
    const symbol = (req.query.symbol || 'IBM').toUpperCase();
    console.log(`\nStarting Master Agent Analysis for ${symbol}...`);

    try {
        // Run Master Agent (which delegates to sub-agents)
        const decision = await masterAgent.makeDecision(symbol, mockPortfolio);

        const output = {
            symbol: decision.symbol,
            finalAction: decision.finalAction,
            intentScore: decision.finalIntentScore,
            topCandidates: decision.top4Candidates.map(c => ({
                agent: c.agentName,
                action: c.action,
                score: c.score
            })),
            reasoning: decision.reasoning,
            vetoApplied: decision.vetoApplied,
            fullLogs: decision.logs
        };

        res.status(200).json(output);

    } catch (error) {
        console.error('Analysis Failed:', error);
        res.status(500).json({ error: error.message });
    }
}
