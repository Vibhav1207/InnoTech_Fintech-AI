import mongoose from 'mongoose';

const PositionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  symbol: {
    type: String,
    required: true,
  },
  qty: {
    type: Number,
    required: true,
  },
  avgPrice: {
    type: Number,
    required: true,
  },
  currentPrice: {
    type: Number, // Will need to be updated periodically or on fetch
    default: 0,
  },
  sector: {
    type: String,
    default: 'Technology', // Default or fetch from API
  },
  openedAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.models.Position || mongoose.model('Position', PositionSchema);
