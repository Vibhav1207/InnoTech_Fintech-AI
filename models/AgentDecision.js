import mongoose from 'mongoose';

const AgentDecisionSchema = new mongoose.Schema({
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
    enum: ['BUY', 'SELL', 'HOLD', 'BUY_MORE', 'REDUCE', 'EXIT', 'REALLOCATE'],
    required: true,
  },
  confidence: {
    type: Number,
    required: true,
  },
  reasoning: {
    type: String,
    required: true,
  },
  marketSnapshot: {
    type: Object,
    default: {},
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.models.AgentDecision || mongoose.model('AgentDecision', AgentDecisionSchema);
