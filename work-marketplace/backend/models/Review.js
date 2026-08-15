const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Job',
      required: true,
    },
    fromUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    toUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    rating: {
      type: Number,
      required: [true, 'Rating is required'],
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      maxlength: 500,
      default: '',
    },
  },
  { timestamps: true }
);

// Each user can only leave one review per job (one direction)
reviewSchema.index({ jobId: 1, fromUserId: 1 }, { unique: true });

module.exports = mongoose.model('Review', reviewSchema);
