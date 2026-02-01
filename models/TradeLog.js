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
  intent: {
    type: String,
    enum: ['BUY_MORE', 'REDUCE', 'EXIT', 'REALLOCATE', 'ENTRY'],
    default: 'ENTRY'
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
    type: Number,
    default: 0,
  },
  agentSource: {
    type: String,
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
