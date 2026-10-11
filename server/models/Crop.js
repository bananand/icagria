import mongoose from 'mongoose';

const cropSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Crop name is required'],
      unique: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ['tuber', 'legume'],
      required: [true, 'Crop type (tuber or legume) is required'],
    },
    scientificName: {
      type: String,
      trim: true,
    },
    phMin: {
      type: Number,
      required: [true, 'phMin is required'],
      min: [0, 'phMin must be at least 0'],
      max: [14, 'phMin cannot exceed 14'],
    },
    phMax: {
      type: Number,
      required: [true, 'phMax is required'],
      min: [0, 'phMax must be at least 0'],
      max: [14, 'phMax cannot exceed 14'],
      validate: {
        validator: function (val) {
          if (this.phMin !== undefined && this.phMin !== null) {
            return val >= this.phMin;
          }
          return true;
        },
        message: 'phMax must be greater than or equal to phMin',
      },
    },
    season: {
      type: String,
      trim: true,
    },
    growthDays: {
      type: Number,
      min: [1, 'Growth days must be at least 1'],
    },
    growthPeriod: {
      type: String,
      trim: true,
    },
    sowingTime: {
      type: String,
      trim: true,
    },
    harvestTime: {
      type: String,
      trim: true,
    },
    climate: {
      type: String,
      trim: true,
    },
    soilType: {
      type: String,
      trim: true,
    },
    pests: [
      {
        type: String,
        trim: true,
      },
    ],
    fertilizers: [
      {
        type: String,
        trim: true,
      },
    ],
    pesticides: [
      {
        type: String,
        trim: true,
      },
    ],
    imageUrl: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
    collection: 'crops',
  }
);

const Crop = mongoose.model('Crop', cropSchema);

export default Crop;
