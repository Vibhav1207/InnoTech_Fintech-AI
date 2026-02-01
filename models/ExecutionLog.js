import mongoose from 'mongoose';

const ExecutionLogSchema = new mongoose.Schema({
  timestamp: {
    type: Date,
    default: Date.now,
  },
  symbol: {
    type: String,
    required: true,
  },
  action: {
    type: String,
    required: true,
  },
  quantity: {
    type: Number,
    default: 0,
  },
  price: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ['SUCCESS', 'FAILED', 'SKIPPED'],
    required: true,
  },
  message: {
    type: String,
    default: '',
  },
  source: {
    type: String,
    default: 'manual',
  },
  portfolioId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Portfolio',
  },
  metadata: {
    type: Object,
    default: {},
  }
});

export default mongoose.models.ExecutionLog || mongoose.model('ExecutionLog', ExecutionLogSchema);
