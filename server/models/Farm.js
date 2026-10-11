import mongoose from 'mongoose';

const farmSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Owner is required'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Farm name is required'],
      trim: true,
    },
    location: {
      text: {
        type: String,
        required: [true, 'Location text is required'],
        trim: true,
      },
      lat: {
        type: Number,
      },
      lng: {
        type: Number,
      },
    },
    areaSize: {
      type: Number,
      required: [true, 'Area size in acres is required'],
      min: [0, 'Area size must be non-negative'],
    },
    mainCrop: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Crop',
    },
    establishedDate: {
      type: Date,
    },
  },
  {
    timestamps: true,
    collection: 'farms',
  }
);

const Farm = mongoose.model('Farm', farmSchema);

export default Farm;
