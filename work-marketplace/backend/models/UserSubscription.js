const mongoose = require('mongoose');
const { USER_MODE } = require('../config/constants');

const userSubscriptionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    role: {
      type: String,
      enum: Object.values(USER_MODE),
      required: true,
    },
    planId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SubscriptionPlan',
      required: true,
    },
    status: {
      type: String,
      enum: ['active', 'expired', 'cancelled', 'past_due'],
      default: 'active',
      index: true,
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    endDate: {
      type: Date,
      default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    },
    autoRenew: {
      type: Boolean,
      default: true,
    },
    razorpaySubscriptionId: {
      type: String,
      default: null,
    },
    usageThisCycle: {
      applicationsUsed: {
        type: Number,
        default: 0,
      },
      jobsPostedUsed: {
        type: Number,
        default: 0,
      },
      cycleResetAt: {
        type: Date,
        default: Date.now,
      },
    },
    paymentHistory: [
      {
        amount: Number,
        paidAt: { type: Date, default: Date.now },
        razorpayPaymentId: String,
        status: String,
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model('UserSubscription', userSubscriptionSchema);
