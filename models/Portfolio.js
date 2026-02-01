import mongoose from 'mongoose';

const PortfolioSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  totalValue: {
    type: Number,
    default: 0,
  },
  cashAvailable: {
    type: Number,
    default: 10000,
  },
  sectorExposure: {
    type: Map,
    of: Number, 
    default: {},
  },
  realizedPnL: {
    type: Number,
    default: 0,
  },
  unrealizedPnL: {
    type: Number,
    default: 0,
  },
  dailyPnL: {
    type: Number,
    default: 0,
  },
  cumulativePnL: {
    type: Number,
    default: 0,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.models.Portfolio || mongoose.model('Portfolio', PortfolioSchema);
