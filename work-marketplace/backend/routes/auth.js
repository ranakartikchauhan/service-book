const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const WorkerProfile = require('../models/WorkerProfile');
const PosterProfile = require('../models/PosterProfile');
const OtpVerification = require('../models/OtpVerification');
const { sendOtpEmail } = require('../services/emailService');
const verifyUserToken = require('../middleware/verifyUserToken');
const { uploadPublic } = require('../services/cloudinaryService');

const router = express.Router();

const generateToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '30d' });

// ─── 1. SEND EMAIL OTP ────────────────────────────────────────────────────────
// POST /api/auth/send-otp
router.post('/send-otp', async (req, res, next) => {
  try {
    const { email, purpose = 'registration' } = req.body;

    if (!email || !email.includes('@')) {
      return res.status(400).json({ success: false, message: 'Valid email address is required' });
    }

    const cleanEmail = email.toLowerCase().trim();

    // Check if email already registered for registration purpose
    if (purpose === 'registration') {
      const existingUser = await User.findOne({ email: cleanEmail });
      if (existingUser) {
        return res.status(409).json({ success: false, message: 'This email is already registered. Please sign in.' });
      }
    }

    // Check if user exists for login purpose
    if (purpose === 'login') {
      const existingUser = await User.findOne({ email: cleanEmail });
      if (!existingUser) {
        return res.status(404).json({ success: false, message: 'No account found with this email. Please register first.' });
      }
    }

    // Generate 6-digit cryptographic OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Remove any previous active OTPs for this email & purpose
    await OtpVerification.deleteMany({ email: cleanEmail, purpose });

    // Save new OTP with 10-minute expiration
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await OtpVerification.create({
      email: cleanEmail,
      otp,
      purpose,
      expiresAt,
    });

    // Dispatch real email via Google App Password
    await sendOtpEmail({ email: cleanEmail, otp, purpose });

    res.json({
      success: true,
      message: `A 6-digit verification code has been sent to ${cleanEmail}`,
    });
  } catch (error) {
    console.error('send-otp error:', error);
    next(error);
  }
});

// ─── 2. VERIFY EMAIL OTP ──────────────────────────────────────────────────────
// POST /api/auth/verify-otp
router.post('/verify-otp', async (req, res, next) => {
  try {
    const { email, otp, purpose = 'registration' } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ success: false, message: 'Email and OTP code are required' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanOtp = otp.toString().trim();

    const record = await OtpVerification.findOne({
      email: cleanEmail,
      otp: cleanOtp,
      purpose,
      expiresAt: { $gt: new Date() },
    });

    if (!record) {
      return res.status(400).json({ success: false, message: 'Invalid or expired verification code' });
    }

    record.verified = true;
    await record.save();

    // If user already exists, mark email as verified
    await User.findOneAndUpdate({ email: cleanEmail }, { isEmailVerified: true });

    res.json({
      success: true,
      message: 'Email verified successfully',
    });
  } catch (error) {
    console.error('verify-otp error:', error);
    next(error);
  }
});

// ─── 3. REGISTER (With Optional Email OTP) ────────────────────────────────────
// POST /api/auth/register
router.post('/register', async (req, res, next) => {
  try {
    const { name, phone, email, password, otp } = req.body;

    if (!name || !phone || !password) {
      return res.status(400).json({ success: false, message: 'Name, phone and password are required' });
    }

    const cleanPhone = phone.trim();
    const cleanEmail = email ? email.toLowerCase().trim() : null;

    const existingPhone = await User.findOne({ phone: cleanPhone });
    if (existingPhone) {
      return res.status(409).json({ success: false, message: 'Phone number already registered' });
    }

    if (cleanEmail) {
      const existingEmail = await User.findOne({ email: cleanEmail });
      if (existingEmail) {
        return res.status(409).json({ success: false, message: 'Email address already registered' });
      }
    }

    let isEmailVerified = false;

    // If OTP was provided, verify it
    if (cleanEmail && otp) {
      const otpRecord = await OtpVerification.findOne({
        email: cleanEmail,
        otp: otp.toString().trim(),
        purpose: 'registration',
      });
      if (otpRecord) {
        isEmailVerified = true;
        await OtpVerification.deleteMany({ email: cleanEmail });
      }
    }

    const user = await User.create({
      name: name.trim(),
      phone: cleanPhone,
      email: cleanEmail,
      isEmailVerified,
      passwordHash: password,
    });

    // Create empty profiles for both modes
    await WorkerProfile.create({ userId: user._id });
    await PosterProfile.create({ userId: user._id });

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      data: { token, user },
    });
  } catch (error) {
    next(error);
  }
});

// ─── 4. LOGIN (Password or Phone/Email) ───────────────────────────────────────
// POST /api/auth/login
router.post('/login', async (req, res, next) => {
  try {
    const { phone, email, password } = req.body;

    if ((!phone && !email) || !password) {
      return res.status(400).json({ success: false, message: 'Phone/Email and password are required' });
    }

    const query = phone ? { phone: phone.trim() } : { email: email.toLowerCase().trim() };
    const user = await User.findOne(query);

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    if (user.isSuspended) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been suspended. Please contact support.',
      });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const token = generateToken(user._id);

    res.json({
      success: true,
      data: { token, user },
    });
  } catch (error) {
    next(error);
  }
});

// ─── 5. LOGIN WITH EMAIL OTP (Passwordless Login) ─────────────────────────────
// POST /api/auth/login-with-otp
router.post('/login-with-otp', async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ success: false, message: 'Email and OTP code are required' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanOtp = otp.toString().trim();

    const record = await OtpVerification.findOne({
      email: cleanEmail,
      otp: cleanOtp,
      purpose: 'login',
      expiresAt: { $gt: new Date() },
    });

    if (!record) {
      return res.status(400).json({ success: false, message: 'Invalid or expired verification code' });
    }

    const user = await User.findOne({ email: cleanEmail });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Clean up OTP record
    await OtpVerification.deleteMany({ email: cleanEmail, purpose: 'login' });

    user.isEmailVerified = true;
    await user.save();

    const token = generateToken(user._id);

    res.json({
      success: true,
      message: 'Signed in successfully',
      data: { token, user },
    });
  } catch (error) {
    next(error);
  }
});

// ─── 6. ADMIN LOGIN ───────────────────────────────────────────────────────────
// POST /api/auth/admin-login
router.post('/admin-login', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (
      email !== process.env.ADMIN_EMAIL ||
      password !== process.env.ADMIN_PASSWORD
    ) {
      return res.status(401).json({ success: false, message: 'Invalid admin credentials' });
    }

    const token = jwt.sign(
      { email, role: 'admin' },
      process.env.ADMIN_JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({ success: true, data: { token } });
  } catch (error) {
    next(error);
  }
});

// ─── 7. GET CURRENT USER ──────────────────────────────────────────────────────
// GET /api/auth/me
router.get('/me', verifyUserToken, async (req, res) => {
  res.json({ success: true, data: { user: req.user } });
});

// ─── 8. SWITCH MODE ───────────────────────────────────────────────────────────
// PATCH /api/auth/switch-mode
router.patch('/switch-mode', verifyUserToken, async (req, res, next) => {
  try {
    const { mode } = req.body;
    if (!['worker', 'poster'].includes(mode)) {
      return res.status(400).json({ success: false, message: 'Mode must be "worker" or "poster"' });
    }

    await User.findByIdAndUpdate(req.user._id, { currentMode: mode });
    res.json({ success: true, message: `Switched to ${mode} mode` });
  } catch (error) {
    next(error);
  }
});

// ─── 9. REGISTER FCM TOKEN ────────────────────────────────────────────────────
// PATCH /api/auth/fcm-token
router.patch('/fcm-token', verifyUserToken, async (req, res, next) => {
  try {
    const { token } = req.body;
    await User.findByIdAndUpdate(req.user._id, { fcmToken: token });
    res.json({ success: true, message: 'FCM token saved' });
  } catch (error) {
    next(error);
  }
});

// ─── 10. UPLOAD PROFILE PHOTO ─────────────────────────────────────────────────
// POST /api/auth/profile-photo
router.post('/profile-photo', verifyUserToken, uploadPublic.single('photo'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No photo provided for upload' });
    }

    const photoUrl = req.file.path || req.file.secure_url || req.file.url;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { profilePhotoUrl: photoUrl },
      { new: true }
    ).select('-passwordHash');

    res.json({
      success: true,
      message: 'Profile photo updated successfully',
      data: { photoUrl, user },
    });
  } catch (error) {
    console.error('Profile photo upload error:', error);
    next(error);
  }
});

module.exports = router;
