const express = require('express');
const User = require('../models/User');
const WorkerProfile = require('../models/WorkerProfile');
const Job = require('../models/Job');
const Transaction = require('../models/Transaction');
const SafetyEvent = require('../models/SafetyEvent');
const Category = require('../models/Category');
const SubscriptionPlan = require('../models/SubscriptionPlan');
const UserSubscription = require('../models/UserSubscription');
const PlatformConfig = require('../models/PlatformConfig');
const { DEFAULT_CATEGORIES, VERIFICATION_STATUS, SAFETY_STATUS } = require('../config/constants');
const verifyAdminToken = require('../middleware/verifyAdminToken');
const { getSignedUrl } = require('../services/cloudinaryService');

const router = express.Router();
router.use(verifyAdminToken);

// ─── DASHBOARD STATS ──────────────────────────────────────────────────────────
// GET /api/admin/dashboard
router.get('/dashboard', async (req, res, next) => {
  try {
    const [
      totalUsers, totalJobs, activeJobs, completedJobs,
      pendingVerifications, activeSafetyEvents, totalRevenue,
    ] = await Promise.all([
      User.countDocuments(),
      Job.countDocuments(),
      Job.countDocuments({ status: { $in: ['open', 'assigned', 'in_progress'] } }),
      Job.countDocuments({ status: 'completed' }),
      WorkerProfile.countDocuments({ 'verification.status': VERIFICATION_STATUS.PENDING }),
      SafetyEvent.countDocuments({ status: SAFETY_STATUS.ACTIVE }),
      Transaction.aggregate([
        { $match: { status: 'released' } },
        { $group: { _id: null, total: { $sum: '$platformCommission' } } },
      ]),
    ]);

    res.json({
      success: true,
      data: {
        totalUsers,
        totalJobs,
        activeJobs,
        completedJobs,
        pendingVerifications,
        activeSafetyEvents,
        totalRevenue: totalRevenue[0]?.total || 0,
      },
    });
  } catch (error) {
    next(error);
  }
});

// ─── WORKER VERIFICATION QUEUE ────────────────────────────────────────────────
// GET /api/admin/verifications/pending
router.get('/verifications/pending', async (req, res, next) => {
  try {
    const profiles = await WorkerProfile.find({ 'verification.status': VERIFICATION_STATUS.PENDING })
      .populate('userId', 'name phone profilePhotoUrl createdAt')
      .sort({ 'verification.submittedAt': 1 }); // oldest first

    // Generate signed URLs for ID doc review (admin-only, 10 min expiry)
    const enriched = profiles.map((p) => ({
      ...p.toObject(),
      verification: {
        ...p.verification.toObject(),
        signedIdDocUrl: p.verification.idDocUrl ? getSignedUrl(p.verification.idDocUrl, 600) : null,
      },
    }));

    res.json({ success: true, data: { profiles: enriched } });
  } catch (error) {
    next(error);
  }
});

// ─── APPROVE VERIFICATION ─────────────────────────────────────────────────────
// POST /api/admin/verifications/:workerId/approve
router.post('/verifications/:workerId/approve', async (req, res, next) => {
  try {
    await WorkerProfile.findOneAndUpdate(
      { userId: req.params.workerId },
      {
        'verification.status': VERIFICATION_STATUS.VERIFIED,
        'verification.verifiedAt': new Date(),
      }
    );
    res.json({ success: true, message: 'Worker verified successfully' });
  } catch (error) {
    next(error);
  }
});

// ─── REJECT VERIFICATION ──────────────────────────────────────────────────────
// POST /api/admin/verifications/:workerId/reject
router.post('/verifications/:workerId/reject', async (req, res, next) => {
  try {
    const { reason } = req.body;
    await WorkerProfile.findOneAndUpdate(
      { userId: req.params.workerId },
      {
        'verification.status': VERIFICATION_STATUS.REJECTED,
        'verification.rejectionReason': reason || 'Documents did not meet requirements',
      }
    );
    res.json({ success: true, message: 'Verification rejected' });
  } catch (error) {
    next(error);
  }
});

// ─── ALL JOBS ────────────────────────────────────────────────────────────────
// GET /api/admin/jobs?status=&page=&limit=
router.get('/jobs', async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const query = status ? { status } : {};
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [jobs, total] = await Promise.all([
      Job.find(query)
        .populate('posterId', 'name phone')
        .populate('assignedWorkerId', 'name phone')
        .populate('category', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Job.countDocuments(query),
    ]);

    res.json({ success: true, data: { jobs, total, page: parseInt(page) } });
  } catch (error) {
    next(error);
  }
});

// ─── ACTIVE SAFETY EVENTS (HIGHEST PRIORITY VIEW) ────────────────────────────
// GET /api/admin/safety-events
router.get('/safety-events', async (req, res, next) => {
  try {
    const { status = 'active' } = req.query;

    const events = await SafetyEvent.find({ status })
      .populate('userId', 'name phone profilePhotoUrl')
      .populate('jobId', 'title location')
      .sort({ triggeredAt: -1 });

    res.json({ success: true, data: { events } });
  } catch (error) {
    next(error);
  }
});

// ─── UPDATE SAFETY EVENT STATUS ───────────────────────────────────────────────
// PATCH /api/admin/safety-events/:id
router.patch('/safety-events/:id', async (req, res, next) => {
  try {
    const { status, adminNotes } = req.body;

    const event = await SafetyEvent.findByIdAndUpdate(
      req.params.id,
      {
        status,
        adminNotes,
        ...(status !== SAFETY_STATUS.ACTIVE ? { resolvedAt: new Date() } : {}),
      },
      { new: true }
    );

    res.json({ success: true, data: { event } });
  } catch (error) {
    next(error);
  }
});

// ─── ALL USERS ────────────────────────────────────────────────────────────────
// GET /api/admin/users?page=&limit=&search=
router.get('/users', async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const query = search
      ? { $or: [{ name: new RegExp(search, 'i') }, { phone: new RegExp(search, 'i') }] }
      : {};

    const [users, total] = await Promise.all([
      User.find(query).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
      User.countDocuments(query),
    ]);

    res.json({ success: true, data: { users, total, page: parseInt(page) } });
  } catch (error) {
    next(error);
  }
});

// ─── SUSPEND / UNSUSPEND USER ─────────────────────────────────────────────────
// PATCH /api/admin/users/:id/suspend
router.patch('/users/:id/suspend', async (req, res, next) => {
  try {
    const { suspend, reason } = req.body;
    await User.findByIdAndUpdate(req.params.id, {
      isSuspended: suspend,
      suspendedReason: suspend ? reason : null,
    });
    res.json({ success: true, message: suspend ? 'User suspended' : 'User reinstated' });
  } catch (error) {
    next(error);
  }
});

// ─── PLATFORM CONFIG ──────────────────────────────────────────────────────────
// GET /api/admin/config
router.get('/config', async (req, res, next) => {
  try {
    const config = await PlatformConfig.getConfig();
    res.json({ success: true, data: { config } });
  } catch (error) {
    next(error);
  }
});

// PUT /api/admin/config
router.put('/config', async (req, res, next) => {
  try {
    const { commissionPercent, autoReleaseHours, minJobBudget, maxJobPhotos, registrationsOpen } = req.body;
    let config = await PlatformConfig.getConfig();

    if (commissionPercent !== undefined) config.commissionPercent = commissionPercent;
    if (autoReleaseHours !== undefined) config.autoReleaseHours = autoReleaseHours;
    if (minJobBudget !== undefined) config.minJobBudget = minJobBudget;
    if (maxJobPhotos !== undefined) config.maxJobPhotos = maxJobPhotos;
    if (registrationsOpen !== undefined) config.registrationsOpen = registrationsOpen;

    await config.save();
    res.json({ success: true, data: { config } });
  } catch (error) {
    next(error);
  }
});

// ─── CATEGORIES ───────────────────────────────────────────────────────────────
// GET /api/admin/categories
router.get('/categories', async (req, res, next) => {
  try {
    const categories = await Category.find().sort({ sortOrder: 1, name: 1 });
    res.json({ success: true, data: { categories } });
  } catch (error) {
    next(error);
  }
});

// POST /api/admin/categories
router.post('/categories', async (req, res, next) => {
  try {
    const { name, icon, sortOrder } = req.body;
    const category = await Category.create({ name, icon, sortOrder });
    res.status(201).json({ success: true, data: { category } });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/admin/categories/:id
router.patch('/categories/:id', async (req, res, next) => {
  try {
    const category = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, data: { category } });
  } catch (error) {
    next(error);
  }
});

// ─── TRANSACTIONS / REVENUE ───────────────────────────────────────────────────
// GET /api/admin/transactions?page=&limit=
router.get('/transactions', async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [transactions, total] = await Promise.all([
      Transaction.find()
        .populate('jobId', 'title')
        .populate('posterId', 'name phone')
        .populate('workerId', 'name phone')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Transaction.countDocuments(),
    ]);

    res.json({ success: true, data: { transactions, total, page: parseInt(page) } });
  } catch (error) {
    next(error);
  }
});

// ─── CATEGORY MANAGEMENT (CRUD) ──────────────────────────────────────────────
// GET /api/admin/categories - list all categories
router.get('/categories', async (req, res, next) => {
  try {
    let categories = await Category.find().sort({ sortOrder: 1, name: 1 });
    if (categories.length === 0) {
      await Category.insertMany(
        DEFAULT_CATEGORIES.map((c, i) => ({ ...c, sortOrder: i, active: true }))
      );
      categories = await Category.find().sort({ sortOrder: 1, name: 1 });
    }
    res.json({ success: true, data: { categories } });
  } catch (error) {
    next(error);
  }
});

// POST /api/admin/categories - create a new category
router.post('/categories', async (req, res, next) => {
  try {
    const { name, icon = 'briefcase', sortOrder = 0, active = true } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, message: 'Category name is required' });
    }
    const existing = await Category.findOne({ name: { $regex: new RegExp(`^${name.trim()}$`, 'i') } });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Category with this name already exists' });
    }
    const category = await Category.create({ name: name.trim(), icon, sortOrder, active });
    res.status(201).json({ success: true, message: 'Category created successfully', data: { category } });
  } catch (error) {
    next(error);
  }
});

// PUT /api/admin/categories/:id - update category
router.put('/categories/:id', async (req, res, next) => {
  try {
    const { name, icon, sortOrder, active } = req.body;
    const updateData = {};
    if (name !== undefined) updateData.name = name.trim();
    if (icon !== undefined) updateData.icon = icon;
    if (sortOrder !== undefined) updateData.sortOrder = sortOrder;
    if (active !== undefined) updateData.active = active;

    const category = await Category.findByIdAndUpdate(req.params.id, updateData, { new: true });
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }
    res.json({ success: true, message: 'Category updated', data: { category } });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/admin/categories/:id - delete category
router.delete('/categories/:id', async (req, res, next) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }
    res.json({ success: true, message: 'Category deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// ─── SUBSCRIPTION PLANS MANAGEMENT (Admin) ──────────────────────────────────
// GET /api/admin/subscription-plans
router.get('/subscription-plans', async (req, res, next) => {
  try {
    const plans = await SubscriptionPlan.find().sort({ targetRole: 1, sortOrder: 1, price: 1 });
    res.json({ success: true, data: { plans } });
  } catch (error) {
    next(error);
  }
});

// POST /api/admin/subscription-plans
router.post('/subscription-plans', async (req, res, next) => {
  try {
    const { name, targetRole, price, billingCycle, isFree, limits, displayFeatures, sortOrder } = req.body;
    if (!name || !targetRole) {
      return res.status(400).json({ success: false, message: 'Name and targetRole are required' });
    }

    const plan = await SubscriptionPlan.create({
      name,
      targetRole,
      price: price || 0,
      billingCycle: billingCycle || (isFree ? 'free' : 'monthly'),
      isFree: !!isFree,
      limits: limits || {},
      displayFeatures: displayFeatures || [],
      sortOrder: sortOrder || 0,
    });

    res.status(201).json({ success: true, message: 'Plan created', data: { plan } });
  } catch (error) {
    next(error);
  }
});

// PUT /api/admin/subscription-plans/:id
router.put('/subscription-plans/:id', async (req, res, next) => {
  try {
    const plan = await SubscriptionPlan.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!plan) return res.status(404).json({ success: false, message: 'Plan not found' });
    res.json({ success: true, message: 'Plan updated', data: { plan } });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/admin/subscription-plans/:id/toggle-active
router.patch('/subscription-plans/:id/toggle-active', async (req, res, next) => {
  try {
    const plan = await SubscriptionPlan.findById(req.params.id);
    if (!plan) return res.status(404).json({ success: false, message: 'Plan not found' });
    if (plan.isFree) return res.status(400).json({ success: false, message: 'Free tier cannot be disabled' });

    plan.active = !plan.active;
    await plan.save();
    res.json({ success: true, message: `Plan ${plan.active ? 'activated' : 'deactivated'}`, data: { plan } });
  } catch (error) {
    next(error);
  }
});

// ─── SUBSCRIBERS LIST & MANUAL GRANT ──────────────────────────────────────────
// GET /api/admin/subscribers?role=&status=&page=&limit=
router.get('/subscribers', async (req, res, next) => {
  try {
    const { role, status, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (role) filter.role = role;
    if (status) filter.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [subscribers, total] = await Promise.all([
      UserSubscription.find(filter)
        .populate('userId', 'name phone email profilePhotoUrl')
        .populate('planId', 'name price isFree targetRole')
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      UserSubscription.countDocuments(filter),
    ]);

    res.json({ success: true, data: { subscribers, total, page: parseInt(page) } });
  } catch (error) {
    next(error);
  }
});

// POST /api/admin/subscribers/:userId/grant (Manual override / promotional grant)
router.post('/subscribers/:userId/grant', async (req, res, next) => {
  try {
    const { planId, days = 30 } = req.body;
    const plan = await SubscriptionPlan.findById(planId);
    if (!plan) return res.status(404).json({ success: false, message: 'Plan not found' });

    let sub = await UserSubscription.findOne({ userId: req.params.userId, role: plan.targetRole });
    if (!sub) {
      sub = new UserSubscription({ userId: req.params.userId, role: plan.targetRole });
    }

    sub.planId = plan._id;
    sub.status = 'active';
    sub.startDate = new Date();
    sub.endDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    sub.paymentHistory.push({
      amount: 0,
      paidAt: new Date(),
      razorpayPaymentId: 'admin_manual_grant',
      status: 'granted_by_admin',
    });

    await sub.save();
    const populated = await UserSubscription.findById(sub._id)
      .populate('userId', 'name phone')
      .populate('planId', 'name price');

    res.json({ success: true, message: `Successfully granted ${plan.name} to user`, data: { subscription: populated } });
  } catch (error) {
    next(error);
  }
});

// GET /api/admin/revenue/breakdown
router.get('/revenue/breakdown', async (req, res, next) => {
  try {
    const [commissionStats, subscriptionStats] = await Promise.all([
      Transaction.aggregate([
        { $match: { status: 'released' } },
        { $group: { _id: null, totalCommission: { $sum: '$platformCommission' }, totalGross: { $sum: '$grossAmount' } } },
      ]),
      UserSubscription.aggregate([
        { $unwind: '$paymentHistory' },
        { $match: { 'paymentHistory.status': 'success' } },
        { $group: { _id: null, totalSubscriptionRevenue: { $sum: '$paymentHistory.amount' } } },
      ]),
    ]);

    res.json({
      success: true,
      data: {
        commissionRevenue: commissionStats[0]?.totalCommission || 0,
        grossJobVolume: commissionStats[0]?.totalGross || 0,
        subscriptionRevenue: subscriptionStats[0]?.totalSubscriptionRevenue || 0,
// POST /api/admin/broadcast-notification
router.post('/broadcast-notification', async (req, res, next) => {
  try {
    const { title, body, targetRole } = req.body;

    if (!title || !body) {
      return res.status(400).json({ success: false, message: 'Title and body are required' });
    }

    const filter = { fcmToken: { $ne: null, $exists: true } };
    if (targetRole && ['worker', 'poster'].includes(targetRole)) {
      filter.currentMode = targetRole;
    }

    const users = await User.find(filter).select('fcmToken name');
    const tokens = users.map((u) => u.fcmToken).filter(Boolean);

    if (tokens.length === 0) {
      return res.json({
        success: true,
        message: 'No registered device tokens found to send notifications to.',
        sentCount: 0,
      });
    }

    const { sendMulticast } = require('../services/fcmService');
    await sendMulticast({
      tokens,
      title,
      body,
      data: { type: 'admin_broadcast', timestamp: Date.now().toString() },
    });

    res.json({
      success: true,
      message: `Notification broadcasted to ${tokens.length} active device(s)`,
      sentCount: tokens.length,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
