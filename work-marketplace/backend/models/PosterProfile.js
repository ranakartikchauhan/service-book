const mongoose = require('mongoose');

const posterProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    rating: {
      average: { type: Number, default: 0, min: 0, max: 5 },
      count: { type: Number, default: 0 },
    },
    jobsPosted: {
      type: Number,
      default: 0,
    },
    // Saved addresses for quick job posting (poster can pick from these)
    savedAddresses: [
      {
        label: String, // "Home", "Office", "Parents' house"
        address: String,
        coordinates: {
          type: [Number], // [longitude, latitude]
        },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model('PosterProfile', posterProfileSchema);
