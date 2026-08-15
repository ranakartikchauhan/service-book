const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { USER_MODE } = require('../config/constants');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      unique: true,
      trim: true,
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
      sparse: true, // allows multiple null values
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    // Password auth for development. Swap to OTP-only before launch.
    passwordHash: {
      type: String,
    },
    profilePhotoUrl: {
      type: String,
      default: null,
    },
    currentMode: {
      type: String,
      enum: Object.values(USER_MODE),
      default: USER_MODE.POSTER,
    },
    // FCM device token for push notifications
    fcmToken: {
      type: String,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isSuspended: {
      type: Boolean,
      default: false,
    },
    suspendedReason: String,
  },
  { timestamps: true }
);

// Hash password before save
userSchema.pre('save', async function (next) {
  if (!this.isModified('passwordHash')) return next();
  this.passwordHash = await bcrypt.hash(this.passwordHash, 12);
  next();
});

// Compare plaintext password against stored hash
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

// Don't return passwordHash in any JSON responses
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.passwordHash;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
