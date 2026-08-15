const express = require('express');
const Transaction = require('../models/Transaction');
const Job = require('../models/Job');
const PlatformConfig = require('../models/PlatformConfig');
const verifyUserToken = require('../middleware/verifyUserToken');
const { createOrder, verifyPaymentSignature, verifyWebhookSignature } = require('../services/razorpayService');
const { TRANSACTION_STATUS, JOB_STATUS } = require('../config/constants');

const router = express.Router();

// ─── CREATE RAZORPAY ORDER (poster triggers this after hiring a worker) ───────
// POST /api/payments/create-order
router.post('/create-order', verifyUserToken, async (req, res, next) => {
  try {
    const { jobId } = req.body;

    const job = await Job.findOne({ _id: jobId, posterId: req.user._id, status: JOB_STATUS.ASSIGNED });
    if (!job) {
      return res.status(404).json({ success: false, message: 'Assigned job not found' });
    }

    // Check if a transaction already exists (idempotency)
    const existing = await Transaction.findOne({ jobId });
    if (existing) {
      return res.json({ success: true, data: { orderId: existing.razorpayOrderId, amount: existing.amount } });
    }

    const config = await PlatformConfig.getConfig();
    const commissionAmount = (job.budgetAmount * config.commissionPercent) / 100;
    const workerPayout = job.budgetAmount - commissionAmount;

    const order = await createOrder({
      amount: job.budgetAmount,
      receipt: `job_${jobId}`,
      notes: { jobId: jobId.toString(), posterId: req.user._id.toString() },
    });

    // Save transaction in pending state
    await Transaction.create({
      jobId,
      posterId: req.user._id,
      workerId: job.assignedWorkerId,
      amount: job.budgetAmount,
      platformCommission: commissionAmount,
      workerPayout,
      status: TRANSACTION_STATUS.HELD_IN_ESCROW, // will be confirmed via webhook
      razorpayOrderId: order.id,
    });

    res.json({
      success: true,
      data: {
        orderId: order.id,
        amount: job.budgetAmount,
        currency: 'INR',
        keyId: process.env.RAZORPAY_KEY_ID, // needed by frontend Razorpay SDK
      },
    });
  } catch (error) {
    next(error);
  }
});

// ─── CONFIRM PAYMENT (called by frontend after user completes Razorpay checkout) ─
// POST /api/payments/confirm
router.post('/confirm', verifyUserToken, async (req, res, next) => {
  try {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

    const isValid = verifyPaymentSignature({
      orderId: razorpayOrderId,
      paymentId: razorpayPaymentId,
      signature: razorpaySignature,
    });

    if (!isValid) {
      return res.status(400).json({ success: false, message: 'Payment verification failed' });
    }

    await Transaction.findOneAndUpdate(
      { razorpayOrderId },
      { razorpayPaymentId, paidAt: new Date() }
    );

    res.json({ success: true, message: 'Payment confirmed. Funds held in escrow.' });
  } catch (error) {
    next(error);
  }
});

// ─── RAZORPAY WEBHOOK ─────────────────────────────────────────────────────────
// POST /api/payments/webhook
// Razorpay sends events here for payment lifecycle (payment.captured, payment.failed, etc.)
// This route must NOT require user auth — it's called by Razorpay servers directly.
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res, next) => {
  try {
    const signature = req.headers['x-razorpay-signature'];
    const payload = req.body;

    const isValid = verifyWebhookSignature({ payload, signature });
    if (!isValid) {
      return res.status(400).json({ success: false, message: 'Invalid webhook signature' });
    }

    const event = JSON.parse(payload);

    switch (event.event) {
      case 'payment.captured': {
        const payment = event.payload.payment.entity;
        await Transaction.findOneAndUpdate(
          { razorpayOrderId: payment.order_id },
          { razorpayPaymentId: payment.id, paidAt: new Date() }
        );
        break;
      }
      case 'payment.failed': {
        // TODO: Notify poster that payment failed; revert job to OPEN or handle gracefully
        console.log('Payment failed:', event.payload.payment.entity);
        break;
      }
      default:
        console.log('Unhandled Razorpay webhook event:', event.event);
    }

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

// ─── GET TRANSACTION FOR A JOB ────────────────────────────────────────────────
// GET /api/payments/transaction/:jobId
router.get('/transaction/:jobId', verifyUserToken, async (req, res, next) => {
  try {
    const transaction = await Transaction.findOne({ jobId: req.params.jobId });
    if (!transaction) return res.status(404).json({ success: false, message: 'Transaction not found' });

    // Only poster or assigned worker can view
    const isParty = transaction.posterId.equals(req.user._id) || transaction.workerId.equals(req.user._id);
    if (!isParty) return res.status(403).json({ success: false, message: 'Not authorized' });

    res.json({ success: true, data: { transaction } });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
