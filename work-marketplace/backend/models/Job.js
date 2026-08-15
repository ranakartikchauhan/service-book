const mongoose = require('mongoose');
const { JOB_STATUS } = require('../config/constants');

const jobSchema = new mongoose.Schema(
  {
    posterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Category is required'],
    },
    title: {
      type: String,
      required: [true, 'Job title is required'],
      trim: true,
      maxlength: 100,
    },
    description: {
      type: String,
      required: [true, 'Job description is required'],
      maxlength: 2000,
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        required: true,
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true,
      },
      addressText: {
        type: String, // Human-readable address for display
      },
    },
    scheduledDate: {
      type: Date,
      required: [true, 'Scheduled date is required'],
    },
    estimatedDurationHours: {
      type: Number,
      min: 0.5,
    },
    budgetType: {
      type: String,
      enum: ['fixed', 'hourly'],
      default: 'fixed',
    },
    budgetAmount: {
      type: Number,
      required: [true, 'Budget amount is required'],
      min: 0,
    },
    // Cloudinary URLs for job-site photos (e.g., photo of kitchen to be cleaned)
    photos: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      enum: Object.values(JOB_STATUS),
      default: JOB_STATUS.OPEN,
    },
    // Every status change is logged here — this is the audit trail for disputes
    // and the data source for the Job Status Timeline UI in V3
    statusHistory: [
      {
        status: {
          type: String,
          enum: Object.values(JOB_STATUS),
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
        note: String, // optional: reason for transition (e.g., cancellation reason)
      },
    ],
    assignedWorkerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    // Whether the poster has marked this as urgent/ASAP (used in V2 near-me)
    isUrgent: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Geospatial index — required for $near and $geoWithin queries
jobSchema.index({ location: '2dsphere' });

// Index for common filter queries
jobSchema.index({ status: 1, posterId: 1 });
jobSchema.index({ status: 1, category: 1 });

// Automatically log status changes to statusHistory
jobSchema.pre('save', function (next) {
  if (this.isModified('status')) {
    this.statusHistory.push({
      status: this.status,
      timestamp: new Date(),
    });
  }
  next();
});

module.exports = mongoose.model('Job', jobSchema);
