const mongoose = require('mongoose');

// Stores admin-editable platform-wide settings.
// Stored in DB (not hardcoded) so admin can adjust without a redeploy.
// There is only ever ONE document in this collection — use PlatformConfig.getConfig().
const platformConfigSchema = new mongoose.Schema(
  {
    // Commission taken from each job payment (percentage, e.g., 10 = 10%)
    commissionPercent: {
      type: Number,
      required: true,
      default: 10,
      min: 0,
      max: 100,
    },
    // Auto-release payment X hours after worker marks complete (if poster doesn't respond)
    autoReleaseHours: {
      type: Number,
      default: 48,
      min: 1,
    },
    // Minimum job budget (₹)
    minJobBudget: {
      type: Number,
      default: 100,
    },
    // Max photos per job posting
    maxJobPhotos: {
      type: Number,
      default: 5,
    },
    // Whether new registrations are allowed (can flip to false to pause growth)
    registrationsOpen: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Static helper — always returns the single config document, creating it if it doesn't exist
platformConfigSchema.statics.getConfig = async function () {
  let config = await this.findOne();
  if (!config) {
    config = await this.create({});
  }
  return config;
};

module.exports = mongoose.model('PlatformConfig', platformConfigSchema);
