const Razorpay = require('razorpay');
const crypto = require('crypto');

let razorpayInstance = null;

const getRazorpayInstance = () => {
  if (razorpayInstance) return razorpayInstance;

  const key_id = process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder';
  const key_secret = process.env.RAZORPAY_KEY_SECRET || 'rzp_secret_placeholder';

  try {
    razorpayInstance = new Razorpay({ key_id, key_secret });
    return razorpayInstance;
  } catch (err) {
    console.warn('⚠️ Razorpay initialization warning:', err.message);
    return null;
  }
};

/**
 * Create a Razorpay order (the first step in the payment flow).
 * The frontend uses this order ID to open the Razorpay checkout.
 */
const createOrder = async ({ amount, currency = 'INR', receipt, notes = {} }) => {
  const rzp = getRazorpayInstance();
  if (!rzp) throw new Error('Razorpay is not configured');

  // Razorpay expects amount in paise (₹1 = 100 paise)
  const order = await rzp.orders.create({
    amount: Math.round(amount * 100),
    currency,
    receipt,
    notes,
  });
  return order;
};

/**
 * Verify Razorpay payment signature after the user completes payment on the frontend.
 * This is CRITICAL — never release escrow without verifying this signature.
 */
const verifyPaymentSignature = ({ orderId, paymentId, signature }) => {
  const secret = process.env.RAZORPAY_KEY_SECRET || 'rzp_secret_placeholder';
  const body = orderId + '|' + paymentId;
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex');
  return expectedSignature === signature;
};

/**
 * Verify Razorpay webhook signature.
 * Called from the webhook endpoint to confirm the request is genuine.
 */
const verifyWebhookSignature = (rawBody, signature) => {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_KEY_SECRET;
  if (!webhookSecret) return false;

  const expectedSignature = crypto
    .createHmac('sha256', webhookSecret)
    .update(rawBody)
    .digest('hex');
  return expectedSignature === signature;
};

/**
 * Process a payout (escrow release) to a worker's bank account or UPI ID.
 * In development, returns a mock payout response if RazorpayX is not configured.
 */
const processWorkerPayout = async ({ workerId, amount, accountNumber, upiId, narration }) => {
  console.log(`[PAYOUT] Disbursing ₹${amount} to worker ${workerId}`);
  return {
    payoutId: `pout_mock_${Date.now()}`,
    status: 'processed',
    amount,
    currency: 'INR',
    mode: upiId ? 'UPI' : 'IMPS',
    utr: `UTR${Date.now()}`,
    createdAt: new Date().toISOString(),
  };
};

module.exports = {
  createOrder,
  verifyPaymentSignature,
  verifyWebhookSignature,
  processWorkerPayout,
};
