import mongoose from 'mongoose';

const AgentDecisionSchema = new mongoose.Schema({
  symbol: {
    type: String,
    required: true,
  },
  agentName: {
    type: String, // 'technical', 'sentiment', 'quant', 'liquidity', 'risk', 'master'
    required: true,
  },
  decision: {
    type: String,
    enum: ['BUY', 'SELL', 'HOLD'],
    required: true,
  },
  confidence: {
    type: Number, // 0 to 1 or 0 to 100
    required: true,
  },
  reasoning: {
    type: String,
    required: true,
  },
  marketSnapshot: {
    type: Object, // Flexible field for capturing relevant market data at time of decision
    default: {},
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.models.AgentDecision || mongoose.model('AgentDecision', AgentDecisionSchema);
