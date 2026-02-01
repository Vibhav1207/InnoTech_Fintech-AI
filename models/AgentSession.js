import mongoose from 'mongoose';

const AgentSessionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  status: {
    type: String,
    enum: ['RUNNING', 'PAUSED', 'STOPPED'],
    default: 'STOPPED',
  },
  tradesUsedToday: {
    type: Number,
    default: 0,
  },
  maxTradesPerDay: {
    type: Number,
    default: 5,
  },
  consecutiveWins: {
    type: Number,
    default: 0,
  },
  consecutiveLosses: {
    type: Number,
    default: 0,
  },
  lastTradePnL: {
    type: Number,
    default: 0,
  },
  sessionPnL: {
    type: Number,
    default: 0,
  },
  startedAt: {
    type: Date,
  },
  stoppedAt: {
    type: Date,
  },
  maxCapital: {
    type: Number,
    default: 1000,
  },
  wishlist: [{
    type: String,
  }],
  lastLoopTime: {
    type: Date,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  }
});

export default mongoose.models.AgentSession || mongoose.model('AgentSession', AgentSessionSchema);
