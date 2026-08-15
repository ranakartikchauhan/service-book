const mongoose = require('mongoose');
const { USER_MODE } = require('../config/constants');

const subscriptionPlanSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Plan name is required'],
      trim: true,
    },
    targetRole: {
      type: String,
      enum: Object.values(USER_MODE),
      required: true,
    },
    price: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    billingCycle: {
      type: String,
      enum: ['monthly', 'yearly', 'free'],
      default: 'monthly',
    },
    isFree: {
      type: Boolean,
      default: false,
    },
    active: {
      type: Boolean,
      default: true,
    },
    limits: {
      // Worker limits
      maxApplicationsPerMonth: {
        type: Number,
        default: 10, // -1 for unlimited
      },
      profileBoost: {
        type: Boolean,
        default: false,
      },
      commissionDiscountPercent: {
        type: Number,
        default: 0, // e.g. 5 means platform takes 5% less
      },
      multiCategoryListing: {
        type: Boolean,
        default: false,
      },
      prioritySupportAccess: {
        type: Boolean,
        default: false,
      },

      // Poster limits
      maxJobPostingsPerMonth: {
        type: Number,
        default: 3, // -1 for unlimited
      },
      recurringJobsAllowed: {
        type: Boolean,
        default: false,
      },
      priorityWorkerMatching: {
        type: Boolean,
        default: false,
      },
      reducedPaymentProcessingFee: {
        type: Boolean,
        default: false,
      },
    },
    displayFeatures: {
      type: [String],
      default: [],
    },
    sortOrder: {
      type: Number,
      default: 0,
    },
    razorpayPlanId: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('SubscriptionPlan', subscriptionPlanSchema);
