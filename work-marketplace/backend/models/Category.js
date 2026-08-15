const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Category name is required'],
      trim: true,
      unique: true,
    },
    icon: {
      type: String,
      default: 'briefcase',
    },
    // Admin can deactivate a category without deleting it
    // (deactivated categories won't show in the app but existing jobs are preserved)
    active: {
      type: Boolean,
      default: true,
    },
    // Display order in the UI
    sortOrder: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Category', categorySchema);
