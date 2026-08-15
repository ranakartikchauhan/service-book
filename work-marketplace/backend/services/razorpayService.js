const Razorpay = require('razorpay');
const crypto = require('crypto');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

/**
 * Create a Razorpay order (the first step in the payment flow).
 * The frontend uses this order ID to open the Razorpay checkout.
 */
const createOrder = async ({ amount, currency = 'INR', receipt, notes = {} }) => {
  // Razorpay expects amount in paise (₹1 = 100 paise)
  const order = await razorpay.orders.create({
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
  const body = orderId + '|' + paymentId;
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest('hex');
  return expectedSignature === signature;
};

/**
 * Verify Razorpay webhook signature.
 * Called from the webhook endpoint to confirm the request is genuine.
 */
const verifyWebhookSignature = ({ payload, signature }) => {
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
    .update(JSON.stringify(payload))
    .digest('hex');
  return expectedSignature === signature;
};

/**
 * Trigger a payout to a worker's bank/UPI via Razorpay Payouts.
 *
 * NOTE: Razorpay Payouts requires:
 * 1. A Razorpay X current account (not just a payments account)
 * 2. Platform KYC approval from Razorpay
 * 3. The payoutDetails (bank account / UPI) must be added as a Razorpay Contact + Fund Account first.
 *
 * TODO: Implement full Contact → Fund Account → Payout flow once Razorpay account is set up.
 * For now this is a stub that logs the payout intent.
 */
const createPayout = async ({ workerId, amount, upiId, bankAccount, ifscCode, purpose = 'payout' }) => {
  // STUB — replace with actual Razorpay Payouts API call
  console.log(`[PAYOUT STUB] Would pay ₹${amount} to worker ${workerId}`);

  // Real implementation outline:
  // 1. Create Contact: POST /v1/contacts
  // 2. Create Fund Account: POST /v1/fund_accounts
  // 3. Create Payout: POST /v1/payouts
  //    { account_number: RAZORPAY_ACCOUNT_NUMBER, fund_account_id, amount: amount*100, currency: 'INR', mode: 'UPI', purpose }

  return { id: `payout_stub_${Date.now()}`, status: 'processing' };
};

/**
 * Fetch payment details from Razorpay (for reconciliation / admin view).
 */
const fetchPayment = async (paymentId) => {
  return razorpay.payments.fetch(paymentId);
};

module.exports = {
  createOrder,
  verifyPaymentSignature,
  verifyWebhookSignature,
  createPayout,
  fetchPayment,
};
