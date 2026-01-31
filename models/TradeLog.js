import mongoose from 'mongoose';

const TradeLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  symbol: {
    type: String,
    required: true,
  },
  action: {
    type: String,
    enum: ['BUY', 'SELL'],
    required: true,
  },
  qty: {
    type: Number,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  pnl: {
    type: Number, // Profit/Loss for SELL trades, 0 or null for BUY
    default: 0,
  },
  agentSource: {
    type: String, // e.g., 'technical', 'sentiment', or 'master'
    required: true,
  },
  confidence: {
    type: Number,
    default: 0
  },
  reason: {
    type: String,
    default: ''
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.models.TradeLog || mongoose.model('TradeLog', TradeLogSchema);
