const mongoose = require('mongoose');
const { APPLICATION_STATUS } = require('../config/constants');

const applicationSchema = new mongoose.Schema(
  {
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Job',
      required: true,
    },
    workerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    proposedRate: {
      type: Number,
      required: [true, 'Proposed rate is required'],
      min: 0,
    },
    message: {
      type: String,
      maxlength: 500,
      default: '',
    },
    status: {
      type: String,
      enum: Object.values(APPLICATION_STATUS),
      default: APPLICATION_STATUS.PENDING,
    },
  },
  { timestamps: true }
);

// A worker can only apply once per job
applicationSchema.index({ jobId: 1, workerId: 1 }, { unique: true });

module.exports = mongoose.model('Application', applicationSchema);
