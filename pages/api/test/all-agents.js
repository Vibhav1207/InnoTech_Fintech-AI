import * as technicalAgent from '../../../agents/technical';
import * as sentimentAgent from '../../../agents/sentiment';
import * as quantAgent from '../../../agents/quant';
import * as riskAgent from '../../../agents/risk';

export default async function handler(req, res) {
  // Database connection removed for standalone testing
  // await dbConnect();

  const symbol = req.query.symbol || 'AAPL';
  const mockPortfolio = {
    positions: [
        { symbol: 'AAPL', qty: 10, avgPrice: 150, currentPrice: 155 }
    ],
    cash: 10000,
    totalValue: 11550
  };

  try {
    console.log(`Testing all agents for ${symbol}...`);

    // Run in parallel
    const [tech, sent, quant, risk] = await Promise.all([
      technicalAgent.analyze(symbol),
      sentimentAgent.analyze(symbol),
      quantAgent.analyze(symbol),
      riskAgent.analyze(symbol, mockPortfolio)
    ]);

    res.status(200).json({
      success: true,
      symbol,
      results: {
        technical: tech,
        sentiment: sent,
        quant: quant,
        risk: risk
      }
    });
  } catch (error) {
    console.error('Test failed:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}
