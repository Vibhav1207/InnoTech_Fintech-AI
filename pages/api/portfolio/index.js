import dbConnect from '../../../lib/db';
import Portfolio from '../../../models/Portfolio';
import Position from '../../../models/Position';

export default async function handler(req, res) {
  await dbConnect();

  if (req.method === 'GET') {
    try {
      let portfolio = await Portfolio.findOne();
      
      if (!portfolio) {
          const User = (await import('../../../models/User')).default;
          let user = await User.findOne();
          if (!user) {
              user = await User.create({
                  email: 'demo@example.com',
                  name: 'Demo User',
                  password: 'hashedpassword'
              });
          }
          
          portfolio = await Portfolio.create({
              userId: user._id,
              totalValue: 100000,
              cashAvailable: 100000
          });
      }

      const positions = await Position.find({ userId: portfolio.userId });

      let positionsValue = 0;
      const positionsWithPnL = positions.map(pos => {
          const currentValue = pos.qty * pos.currentPrice;
          const costBasis = pos.qty * pos.avgPrice;
          const unrealizedPnL = currentValue - costBasis;
          const returnPct = costBasis > 0 ? (unrealizedPnL / costBasis) * 100 : 0;
          
          positionsValue += currentValue;
          
          return {
              ...pos.toObject(),
              currentValue,
              unrealizedPnL,
              returnPct
          };
      });

      const totalPortfolioValue = portfolio.cashAvailable + positionsValue;

      res.status(200).json({ 
          success: true, 
          portfolio: {
              ...portfolio.toObject(),
              totalValue: totalPortfolioValue,
              positionsValue
          }, 
          positions: positionsWithPnL 
      });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  } else {
    res.status(405).json({ success: false, message: 'Method not allowed' });
  }
}
