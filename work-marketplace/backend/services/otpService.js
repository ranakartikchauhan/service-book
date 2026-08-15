// OTP Service — abstracted so swapping providers only changes this file.
// Currently a stub for development (logs the OTP to console instead of sending SMS).
// TODO: Replace the stub with your chosen provider before launch.

// ─── PROVIDER IMPLEMENTATIONS ────────────────────────────────────────────────
// Uncomment the provider you want to use and install its package.

// Option A: MSG91 (India-focused, recommended)
// npm install msg91
// const msg91 = require('msg91');
// msg91.initialize({ authkey: process.env.MSG91_AUTH_KEY });

// Option B: Twilio
// npm install twilio
// const twilio = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

// Option C: Firebase Auth (delegates OTP entirely to Firebase client SDK)
// In this case this service isn't needed — Firebase handles OTP on the client.

// ─── IN-MEMORY OTP STORE (dev only — replace with Redis in production) ────────
const otpStore = new Map(); // Map<phone, { otp, expiresAt }>

const OTP_EXPIRY_SECONDS = 300; // 5 minutes

/**
 * Generate a 6-digit OTP and "send" it (currently just logs to console).
 * In production, replace console.log with your SMS provider call.
 */
const sendOtp = async (phone) => {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + OTP_EXPIRY_SECONDS * 1000;

  // Store OTP (dev: in-memory map; prod: use Redis with TTL)
  otpStore.set(phone, { otp, expiresAt });

  // DEV: Log to console instead of sending SMS
  console.log(`\n📱 OTP for ${phone}: ${otp} (expires in ${OTP_EXPIRY_SECONDS}s)\n`);

  // PROD: Uncomment your provider below
  // await twilio.messages.create({ body: `Your OTP is ${otp}`, from: process.env.TWILIO_FROM, to: phone });

  return { success: true };
};

/**
 * Verify an OTP for a given phone number.
 * Returns true if valid, false if invalid/expired.
 */
const verifyOtp = (phone, candidateOtp) => {
  const record = otpStore.get(phone);

  if (!record) return false;
  if (Date.now() > record.expiresAt) {
    otpStore.delete(phone);
    return false;
  }
  if (record.otp !== candidateOtp) return false;

  // Consumed — delete after successful verification (one-time use)
  otpStore.delete(phone);
  return true;
};

module.exports = { sendOtp, verifyOtp };
