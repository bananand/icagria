import mongoose from 'mongoose';

const phReadingSchema = new mongoose.Schema(
  {
    device: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Device',
      required: [true, 'Device is required'],
      index: true,
    },
    farm: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Farm',
      required: [true, 'Farm is required'],
      index: true,
    },
    value: {
      type: Number,
      required: [true, 'pH value is required'],
      min: [0, 'pH value cannot be less than 0'],
      max: [14, 'pH value cannot exceed 14'],
    },
    recordedAt: {
      type: Date,
      default: Date.now,
    },
    source: {
      type: String,
      enum: ['seed', 'simulated', 'device'],
      required: [true, 'Reading source is required'],
    },
  },
  {
    timestamps: true,
    collection: 'phreadings',
  }
);

// Compound index for time-series querying per farm
phReadingSchema.index({ farm: 1, recordedAt: -1 });

const PhReading = mongoose.model('PhReading', phReadingSchema);

export default PhReading;
