import mongoose from 'mongoose';

const alertSchema = new mongoose.Schema(
  {
    farm: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Farm',
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required'],
      index: true,
    },
    type: {
      type: String,
      enum: ['ph', 'weather'],
    },
    level: {
      type: String,
      enum: ['info', 'warning'],
      default: 'warning',
    },
    message: {
      type: String,
      required: [true, 'Alert message is required'],
      trim: true,
    },
    reading: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PhReading',
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
    collection: 'alerts',
  }
);

const Alert = mongoose.model('Alert', alertSchema);

export default Alert;
