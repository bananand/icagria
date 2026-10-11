import mongoose from 'mongoose';

const listingSchema = new mongoose.Schema(
  {
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Seller is required'],
    },
    cropName: {
      type: String,
      required: [true, 'Crop name is required'],
      trim: true,
    },
    crop: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Crop',
      index: true,
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [0, 'Quantity must be non-negative'],
    },
    unit: {
      type: String,
      enum: ['kg', 'ton'],
      default: 'kg',
    },
    pricePerUnit: {
      type: Number,
      required: [true, 'Price per unit is required'],
      min: [0, 'Price per unit must be non-negative'],
    },
    currency: {
      type: String,
      default: 'IDR',
      trim: true,
    },
    location: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['available', 'reserved', 'sold'],
      default: 'available',
      index: true,
    },
  },
  {
    timestamps: true,
    collection: 'listings',
  }
);

listingSchema.index({ status: 1, createdAt: -1 });
listingSchema.index({ seller: 1 });

const Listing = mongoose.model('Listing', listingSchema);

export default Listing;
