const mongoose = require('mongoose');
const { VERIFICATION_STATUS, ID_TYPES } = require('../config/constants');

const workerProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    skills: {
      type: [String],
      default: [],
    },
    bio: {
      type: String,
      maxlength: 500,
      default: '',
    },
    experienceYears: {
      type: Number,
      default: 0,
      min: 0,
    },
    hourlyRateRange: {
      min: { type: Number, default: 0 },
      max: { type: Number, default: 0 },
    },
    availability: [
      {
        day: String, // "monday", "tuesday", etc.
        startTime: String, // "09:00"
        endTime: String, // "18:00"
      },
    ],
    // How far (in km) the worker is willing to travel
    serviceRadius: {
      type: Number,
      default: 10,
      min: 1,
    },
    // Worker's home / base location for nearby job discovery
    homeLocation: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        default: [0, 0],
      },
    },
    verification: {
      status: {
        type: String,
        enum: Object.values(VERIFICATION_STATUS),
        default: VERIFICATION_STATUS.UNVERIFIED,
      },
      idDocUrl: String, // Cloudinary URL — MUST be private/restricted access
      idType: {
        type: String,
        enum: ID_TYPES,
      },
      verifiedAt: Date,
      rejectionReason: String,
      submittedAt: Date,
    },
    rating: {
      average: { type: Number, default: 0, min: 0, max: 5 },
      count: { type: Number, default: 0 },
    },
    completedJobs: {
      type: Number,
      default: 0,
    },
    earningsTotal: {
      type: Number,
      default: 0,
    },
    // V2: Available Now live switch for instant urgent matching
    isAvailableNow: {
      type: Boolean,
      default: false,
      index: true,
    },
    liveLocation: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        default: [0, 0],
      },
      updatedAt: Date,
    },
    // Payout details — sensitive, stored encrypted at rest in production
    payoutDetails: {
      bankAccountNumber: String,
      ifscCode: String,
      upiId: String,
    },
  },
  { timestamps: true }
);

// Geospatial index for nearby worker queries
workerProfileSchema.index({ homeLocation: '2dsphere' });

module.exports = mongoose.model('WorkerProfile', workerProfileSchema);
