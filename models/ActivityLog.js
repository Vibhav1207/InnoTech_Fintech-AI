import mongoose from 'mongoose';

const ActivityLogSchema = new mongoose.Schema({
  sessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AgentSession',
    required: true,
  },
  loopIteration: {
    type: Number,
  },
  symbol: {
    type: String,
    required: true,
  },
  agentName: {
    type: String,
    required: true,
  },
  decision: {
    type: String,
    required: true,
  },
  confidence: {
    type: Number,
    default: 0,
  },
  executionResult: {
    type: String,
    default: 'PENDING'
  },
  pnlImpact: {
    type: Number,
    default: 0
  },
  details: {
    type: [String],
    default: []
  },
  timestamp: {
    type: Date,
    default: Date.now,
  }
});

export default mongoose.models.ActivityLog || mongoose.model('ActivityLog', ActivityLogSchema);
