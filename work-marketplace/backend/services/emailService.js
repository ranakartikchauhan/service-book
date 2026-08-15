const nodemailer = require('nodemailer');

let transporterInstance = null;

const getTransporter = () => {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS; // 16-character Google App Password

  if (!user || !pass) {
    console.warn('⚠️  EMAIL_USER or EMAIL_PASS environment variables are not set. Logging OTPs to console.');
    return null;
  }

  if (!transporterInstance) {
    transporterInstance = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: user.trim(),
        pass: pass.trim().replace(/\s+/g, ''), // Strip spaces from Google App Password
      },
    });
  }

  return transporterInstance;
};

/**
 * Send 6-digit Email Verification OTP
 */
const sendOtpEmail = async ({ email, otp, purpose = 'registration' }) => {
  const purposeTitle =
    purpose === 'login'
      ? 'Sign In Verification Code'
      : purpose === 'reset_password'
      ? 'Password Reset Code'
      : 'Account Verification Code';

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0b0f19; color: #f1f5f9; padding: 20px; margin: 0; }
          .container { max-width: 520px; margin: 0 auto; background: #131b2e; border: 1px solid #27354e; border-radius: 18px; padding: 32px; text-align: center; }
          .logo { font-size: 26px; font-weight: 900; color: #6366f1; letter-spacing: -0.5px; margin-bottom: 8px; }
          .tagline { color: #94a3b8; font-size: 13px; margin-bottom: 24px; }
          .title { font-size: 19px; font-weight: 800; color: #ffffff; margin-bottom: 12px; }
          .desc { font-size: 14px; color: #94a3b8; line-height: 22px; margin-bottom: 24px; }
          .otp-box { background: rgba(99, 102, 241, 0.12); border: 2px dashed #6366f1; border-radius: 14px; padding: 18px 24px; font-size: 36px; font-weight: 900; color: #818cf8; letter-spacing: 10px; margin: 0 auto 24px auto; display: inline-block; font-family: monospace; }
          .expiry { font-size: 12px; color: #f59e0b; font-weight: 700; margin-bottom: 20px; }
          .security-note { font-size: 12px; color: #64748b; border-top: 1px solid #27354e; padding-top: 20px; line-height: 18px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="logo">WorkMarket</div>
          <div class="tagline">Local Services & Verified Work Marketplace</div>
          
          <div class="title">${purposeTitle}</div>
          <div class="desc">
            Use the 6-digit one-time verification code below to verify your email address:
          </div>

          <div class="otp-box">${otp}</div>

          <div class="expiry">⏳ This code expires in 10 minutes.</div>

          <div class="security-note">
            If you did not request this code, you can safely ignore this email. Never share this code with anyone.
          </div>
        </div>
      </body>
    </html>
  `;

  const transporter = getTransporter();

  if (!transporter) {
    console.log(`\n======================================================`);
    console.log(`📧 [MOCK EMAIL OTP] To: ${email} | Code: ${otp} | Purpose: ${purpose}`);
    console.log(`======================================================\n`);
    return { success: true, mocked: true };
  }

  try {
    const info = await transporter.sendMail({
      from: `"WorkMarket Security" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `[${otp}] Your WorkMarket Verification Code`,
      text: `Your WorkMarket verification code is ${otp}. It will expire in 10 minutes.`,
      html: htmlContent,
    });

    console.log(`✅ [Email Sent] MessageId: ${info.messageId} to ${email}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ [Email Send Error]:', error.message);
    throw error;
  }
};

module.exports = {
  sendOtpEmail,
};
