const mongoose = require('mongoose');
const { TRANSACTION_STATUS } = require('../config/constants');

const transactionSchema = new mongoose.Schema(
  {
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Job',
      required: true,
      unique: true, // one transaction per job
    },
    posterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    workerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // Total amount poster paid
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    // Platform commission deducted (percentage of amount, from PlatformConfig)
    platformCommission: {
      type: Number,
      required: true,
      min: 0,
    },
    // What the worker actually receives (amount - platformCommission)
    workerPayout: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: Object.values(TRANSACTION_STATUS),
      default: TRANSACTION_STATUS.HELD_IN_ESCROW,
    },
    // Razorpay identifiers
    razorpayOrderId: String,
    razorpayPaymentId: String,
    razorpayPayoutId: String, // set when payout to worker is triggered
    // Timestamps for escrow lifecycle events
    paidAt: Date,     // when poster's payment was confirmed
    releasedAt: Date, // when worker payout was triggered
  },
  { timestamps: true }
);

module.exports = mongoose.model('Transaction', transactionSchema);
