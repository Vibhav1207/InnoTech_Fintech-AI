import dbConnect from '../../../lib/db';
import DailyPnLSnapshot from '../../../models/DailyPnLSnapshot';
import User from '../../../models/User';
import Portfolio from '../../../models/Portfolio';

export default async function handler(req, res) {
    await dbConnect();

    try {
        const user = await User.findOne({});
        if (!user) return res.status(404).json({ error: 'User not found' });

        const history = await DailyPnLSnapshot.find({ userId: user._id })
            .sort({ date: 1 })
            .limit(30);

        let chartData = history.map(h => ({
            date: h.date,
            value: h.totalValue
        }));

        const portfolio = await Portfolio.findOne({ userId: user._id });
        if (portfolio) {
            const today = new Date().toISOString().split('T')[0];
            const lastEntry = chartData[chartData.length - 1];

            if (!lastEntry || lastEntry.date !== today) {
                chartData.push({
                    date: today,
                    value: portfolio.totalValue
                });
            }

            if (chartData.length === 1) {
                chartData.unshift({
                    date: 'Start',
                    value: 10000
                });
            }
        }

        res.status(200).json({ history: chartData });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch history' });
    }
}
