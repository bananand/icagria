import mongoose from 'mongoose';

const inquirySchema = new mongoose.Schema(
  {
    listing: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Listing',
      required: [true, 'Listing is required'],
      index: true,
    },
    buyer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Buyer is required'],
      index: true,
    },
    quantity: {
      type: Number,
      min: [0, 'Quantity must be non-negative'],
    },
    message: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending',
      index: true,
    },
  },
  {
    timestamps: true,
    collection: 'inquiries',
  }
);

inquirySchema.index({ listing: 1, buyer: 1 });

const Inquiry = mongoose.model('Inquiry', inquirySchema);

export default Inquiry;
