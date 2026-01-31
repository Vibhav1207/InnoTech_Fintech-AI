import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  riskProfile: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium',
  },
  startingCapital: {
    type: Number,
    default: 100000,
  },
  currentCapital: {
    type: Number,
    default: 100000,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.models.User || mongoose.model('User', UserSchema);
