import mongoose from 'mongoose';

const DailyPnLSnapshotSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  date: {
    type: String,
    required: true,
  },
  realizedPnL: {
    type: Number,
    default: 0,
  },
  unrealizedPnL: {
    type: Number,
    default: 0,
  },
  totalValue: {
    type: Number,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  }
});

export default mongoose.models.DailyPnLSnapshot || mongoose.model('DailyPnLSnapshot', DailyPnLSnapshotSchema);
