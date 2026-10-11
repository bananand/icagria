import mongoose from 'mongoose';

const plantingSchema = new mongoose.Schema(
  {
    farm: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Farm',
      required: [true, 'Farm is required'],
      index: true,
    },
    crop: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Crop',
      required: [true, 'Crop is required'],
      index: true,
    },
    variety: {
      type: String,
      trim: true,
    },
    quantity: {
      type: Number,
      min: [0, 'Quantity must be non-negative'],
    },
    plantedDate: {
      type: Date,
    },
    expectedHarvestDate: {
      type: Date,
    },
    status: {
      type: String,
      enum: ['growing', 'harvested'],
      default: 'growing',
      index: true,
    },
  },
  {
    timestamps: true,
    collection: 'plantings',
  }
);

const Planting = mongoose.model('Planting', plantingSchema);

export default Planting;
