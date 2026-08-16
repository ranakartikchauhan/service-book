const mongoose = require('mongoose');

const trainingVideoSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Video title is required'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    videoUrl: {
      type: String,
      required: [true, 'Video URL is required'],
      trim: true,
    },
    thumbnailUrl: {
      type: String,
      default: '',
    },
    durationMinutes: {
      type: Number,
      default: 3,
    },
    language: {
      type: String,
      default: 'Hindi',
    },
    category: {
      type: String,
      enum: ['onboarding', 'safety', 'payments', 'skills', 'customer_service', 'general'],
      default: 'onboarding',
    },
    sortOrder: {
      type: Number,
      default: 0,
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('TrainingVideo', trainingVideoSchema);
