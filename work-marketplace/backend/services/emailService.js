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

/**
 * Send Notification Failure Alert Email to Admin/Developer
 */
const sendNotificationFailureEmail = async ({
  token,
  title,
  body,
  errorReason,
  targetEmail = 'kartikchauhan336@gmail.com',
}) => {
  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0f172a; color: #f8fafc; padding: 20px; }
          .container { max-width: 580px; margin: 0 auto; background: #1e293b; border: 1px solid #334155; border-radius: 16px; padding: 28px; }
          .badge { background: #ef4444; color: #ffffff; padding: 4px 10px; border-radius: 6px; font-size: 12px; font-weight: 800; display: inline-block; margin-bottom: 12px; }
          .title { font-size: 18px; font-weight: 800; color: #ffffff; margin-bottom: 16px; }
          .box { background: #0f172a; border-left: 4px solid #ef4444; border-radius: 8px; padding: 14px; margin-bottom: 16px; font-family: monospace; font-size: 13px; color: #f87171; word-break: break-all; }
          .info-table { width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 13px; }
          .info-table td { padding: 8px 0; border-bottom: 1px solid #334155; color: #94a3b8; }
          .info-table td.val { color: #f8fafc; font-weight: 600; text-align: right; word-break: break-all; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="badge">🚨 PUSH NOTIFICATION FAILURE REPORT</div>
          <div class="title">Notification Delivery Failed</div>
          
          <div class="box">
            <strong>Failure Reason:</strong><br/>
            ${errorReason}
          </div>

          <table class="info-table">
            <tr>
              <td>Target Token</td>
              <td class="val">${token || 'N/A'}</td>
            </tr>
            <tr>
              <td>Notification Title</td>
              <td class="val">${title || 'N/A'}</td>
            </tr>
            <tr>
              <td>Notification Body</td>
              <td class="val">${body || 'N/A'}</td>
            </tr>
            <tr>
              <td>Timestamp</td>
              <td class="val">${new Date().toISOString()}</td>
            </tr>
          </table>
        </div>
      </body>
    </html>
  `;

  const transporter = getTransporter();
  if (!transporter) {
    console.log(`\n======================================================`);
    console.log(`🚨 [NOTIFICATION FAILURE ALERT EMAIL MOCK] To: ${targetEmail}`);
    console.log(`   Reason: ${errorReason}`);
    console.log(`   Token:  ${token}`);
    console.log(`   Title:  ${title}`);
    console.log(`======================================================\n`);
    return { success: false, mocked: true };
  }

  try {
    await transporter.sendMail({
      from: `"WorkMarket Alert System" <${process.env.EMAIL_USER}>`,
      to: targetEmail,
      subject: `🚨 Push Notification Failure: ${title || 'Delivery Error'}`,
      text: `Push Notification Failure Alert\nReason: ${errorReason}\nToken: ${token}\nTitle: ${title}\nBody: ${body}`,
      html: htmlContent,
    });
    console.log(`✅ [Failure Alert Email Sent] to ${targetEmail}`);
  } catch (err) {
    console.error('❌ Error sending failure alert email:', err.message);
  }
};

module.exports = {
  sendOtpEmail,
  sendNotificationFailureEmail,
};
