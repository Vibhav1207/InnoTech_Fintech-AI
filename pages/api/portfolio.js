import dbConnect from '../../lib/db';
import * as PortfolioManager from '../../lib/portfolio-manager';
import User from '../../models/User';

export default async function handler(req, res) {
    await dbConnect();
    let user = await User.findOne({});
    if (!user) {
         user = await User.create({ name: 'Demo', email: 'demo@test.com', password: 'pw' });
    }
    const { portfolio, positions } = await PortfolioManager.getPortfolio(user._id);
    res.status(200).json({ portfolio, positions });
}
