const mongoose = require('mongoose');
const { SAFETY_STATUS } = require('../config/constants');

const safetyEventSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Job',
      required: true,
    },
    triggeredAt: {
      type: Date,
      default: Date.now,
    },
    // Location at the moment SOS was triggered
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
    },
    status: {
      type: String,
      enum: Object.values(SAFETY_STATUS),
      default: SAFETY_STATUS.ACTIVE,
    },
    adminNotes: {
      type: String,
      default: '',
    },
    resolvedAt: Date,
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', // admin user ID
    },
  },
  { timestamps: true }
);

safetyEventSchema.index({ location: '2dsphere' });

// Index for quickly finding all ACTIVE safety events (highest-priority admin view)
safetyEventSchema.index({ status: 1, triggeredAt: -1 });

module.exports = mongoose.model('SafetyEvent', safetyEventSchema);
