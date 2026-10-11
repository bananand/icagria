import mongoose from 'mongoose';

const deviceSchema = new mongoose.Schema(
  {
    farm: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Farm',
      required: [true, 'Farm is required'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Device name is required'],
      trim: true,
    },
    type: {
      type: String,
      enum: ['soil-ph'],
      default: 'soil-ph',
    },
    source: {
      type: String,
      enum: ['simulated', 'hardware'],
      default: 'simulated',
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },
    apiKey: {
      type: String,
      select: false,
      unique: true,
      sparse: true,
    },
    lastSeenAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    collection: 'devices',
  }
);

const Device = mongoose.model('Device', deviceSchema);

export default Device;
