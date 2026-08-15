const mongoose = require('mongoose');

const savedSearchSchema = new mongoose.Schema(
  {
    workerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      trim: true,
      default: 'Saved Search',
    },
    category: {
      type: String,
      trim: true,
      default: null,
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true,
      },
      addressText: String,
    },
    radiusKm: {
      type: Number,
      default: 10,
      min: 1,
      max: 50,
    },
    minBudget: {
      type: Number,
      default: 0,
    },
    pushAlerts: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

savedSearchSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('SavedSearch', savedSearchSchema);
