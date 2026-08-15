const express = require('express');
const SubscriptionPlan = require('../models/SubscriptionPlan');
const UserSubscription = require('../models/UserSubscription');
const verifyUserToken = require('../middleware/verifyUserToken');
const { getOrCreateUserSubscription } = require('../middleware/checkSubscriptionLimits');

const router = express.Router();

// Seed initial default plans if collection is empty
const seedDefaultPlansIfEmpty = async () => {
  const count = await SubscriptionPlan.countDocuments();
  if (count === 0) {
    await SubscriptionPlan.insertMany([
      {
        name: 'Worker Basic (Free)',
        targetRole: 'worker',
        price: 0,
        billingCycle: 'free',
        isFree: true,
        active: true,
        limits: {
          maxApplicationsPerMonth: 10,
          profileBoost: false,
          commissionDiscountPercent: 0,
          multiCategoryListing: false,
          prioritySupportAccess: false,
        },
        displayFeatures: [
          '10 Job Applications / month',
          'Standard search ranking',
          'Standard platform commission',
          'Community support',
        ],
        sortOrder: 1,
      },
      {
        name: 'Worker Pro ⭐',
        targetRole: 'worker',
        price: 299,
        billingCycle: 'monthly',
        isFree: false,
        active: true,
        limits: {
          maxApplicationsPerMonth: -1, // Unlimited
          profileBoost: true,
          commissionDiscountPercent: 5, // 5% discount on commission
          multiCategoryListing: true,
          prioritySupportAccess: true,
        },
        displayFeatures: [
          'Unlimited Job Applications',
          '⚡ Top Search Placement (Profile Boost)',
          '💰 5% Lower Platform Commission',
          'Multi-Category Skill Listings',
          'Priority 24/7 Support',
        ],
        sortOrder: 2,
      },
      {
        name: 'Poster Basic (Free)',
        targetRole: 'poster',
        price: 0,
        billingCycle: 'free',
        isFree: true,
        active: true,
        limits: {
          maxJobPostingsPerMonth: 3,
          recurringJobsAllowed: false,
          priorityWorkerMatching: false,
          reducedPaymentProcessingFee: false,
        },
        displayFeatures: [
          '3 Job Postings / month',
          'Standard worker matching',
          'Secure escrow payments',
        ],
        sortOrder: 1,
      },
      {
        name: 'Poster Business ⭐',
        targetRole: 'poster',
        price: 499,
        billingCycle: 'monthly',
        isFree: false,
        active: true,
        limits: {
          maxJobPostingsPerMonth: -1, // Unlimited
          recurringJobsAllowed: true,
          priorityWorkerMatching: true,
          reducedPaymentProcessingFee: true,
        },
        displayFeatures: [
          'Unlimited Job Postings',
          '⚡ Priority Matching with Top-Rated Workers',
          'Recurring Weekly/Monthly Job Automation',
          'Dedicated Account Manager',
        ],
        sortOrder: 2,
      },
    ]);
  }
};

// ─── PUBLIC PLANS LIST ────────────────────────────────────────────────────────
// GET /api/subscriptions/plans?role=worker|poster
router.get('/plans', async (req, res, next) => {
  try {
    await seedDefaultPlansIfEmpty();
    const filter = { active: true };
    if (req.query.role) filter.targetRole = req.query.role;

    const plans = await SubscriptionPlan.find(filter).sort({ sortOrder: 1, price: 1 });
    res.json({ success: true, data: { plans } });
  } catch (error) {
    next(error);
  }
});

// All routes below require user auth
router.use(verifyUserToken);

// ─── GET CURRENT USER SUBSCRIPTION & USAGE ─────────────────────────────────────
// GET /api/subscriptions/my-subscription?role=worker|poster
router.get('/my-subscription', async (req, res, next) => {
  try {
    const role = req.query.role || req.user.currentMode || 'worker';
    const sub = await getOrCreateUserSubscription(req.user._id, role);
    res.json({ success: true, data: { subscription: sub } });
  } catch (error) {
    next(error);
  }
});

// ─── SUBSCRIBE TO A PLAN ──────────────────────────────────────────────────────
// POST /api/subscriptions/subscribe
router.post('/subscribe', async (req, res, next) => {
  try {
    const { planId, paymentId } = req.body;
    if (!planId) {
      return res.status(400).json({ success: false, message: 'planId is required' });
    }

    const plan = await SubscriptionPlan.findById(planId);
    if (!plan || !plan.active) {
      return res.status(404).json({ success: false, message: 'Plan not found or inactive' });
    }

    const role = plan.targetRole;
    let userSub = await UserSubscription.findOne({ userId: req.user._id, role });

    if (!userSub) {
      userSub = new UserSubscription({ userId: req.user._id, role });
    }

    userSub.planId = plan._id;
    userSub.status = 'active';
    userSub.startDate = new Date();
    userSub.endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
    userSub.autoRenew = true;

    if (plan.price > 0) {
      userSub.paymentHistory.push({
        amount: plan.price,
        paidAt: new Date(),
        razorpayPaymentId: paymentId || `pay_sub_${Date.now()}`,
        status: 'success',
      });
    }

    await userSub.save();
    const populated = await UserSubscription.findById(userSub._id).populate('planId');

    res.json({
      success: true,
      message: `Subscribed to ${plan.name} successfully!`,
      data: { subscription: populated },
    });
  } catch (error) {
    next(error);
  }
});

// ─── CANCEL SUBSCRIPTION ──────────────────────────────────────────────────────
// POST /api/subscriptions/cancel
router.post('/cancel', async (req, res, next) => {
  try {
    const role = req.body.role || req.user.currentMode || 'worker';
    const sub = await UserSubscription.findOne({ userId: req.user._id, role, status: 'active' });

    if (!sub) {
      return res.status(404).json({ success: false, message: 'No active subscription found to cancel' });
    }

    // Downgrade to Free plan at end of cycle or immediately
    const freePlan = await SubscriptionPlan.findOne({ targetRole: role, isFree: true });
    sub.planId = freePlan ? freePlan._id : sub.planId;
    sub.autoRenew = false;
    await sub.save();

    res.json({ success: true, message: 'Subscription cancelled. You will retain access until cycle ends.' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
