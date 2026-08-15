const SubscriptionPlan = require('../models/SubscriptionPlan');
const UserSubscription = require('../models/UserSubscription');

// Ensure user has a valid active subscription record (defaults to Free tier if none)
const getOrCreateUserSubscription = async (userId, role) => {
  let userSub = await UserSubscription.findOne({
    userId,
    role,
    status: 'active',
  }).populate('planId');

  // If no active sub found, find the default Free plan for that role
  if (!userSub || !userSub.planId) {
    let freePlan = await SubscriptionPlan.findOne({ targetRole: role, isFree: true });
    if (!freePlan) {
      // Seed default free plan if missing
      freePlan = await SubscriptionPlan.create({
        name: role === 'worker' ? 'Worker Basic (Free)' : 'Poster Basic (Free)',
        targetRole: role,
        price: 0,
        billingCycle: 'free',
        isFree: true,
        active: true,
        limits: {
          maxApplicationsPerMonth: role === 'worker' ? 10 : 0,
          maxJobPostingsPerMonth: role === 'poster' ? 3 : 0,
          profileBoost: false,
          commissionDiscountPercent: 0,
        },
        displayFeatures:
          role === 'worker'
            ? ['10 Job Applications / month', 'Standard search ranking', 'Community support']
            : ['3 Job Postings / month', 'Standard worker matching', 'Community support'],
      });
    }

    userSub = await UserSubscription.create({
      userId,
      role,
      planId: freePlan._id,
      status: 'active',
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      usageThisCycle: { applicationsUsed: 0, jobsPostedUsed: 0, cycleResetAt: new Date() },
    });
    userSub.planId = freePlan;
  }

  // Lazy 30-day billing cycle rollover check
  const now = new Date();
  const resetAt = new Date(userSub.usageThisCycle?.cycleResetAt || userSub.startDate);
  const daysDiff = (now - resetAt) / (1000 * 60 * 60 * 24);

  if (daysDiff >= 30) {
    userSub.usageThisCycle.applicationsUsed = 0;
    userSub.usageThisCycle.jobsPostedUsed = 0;
    userSub.usageThisCycle.cycleResetAt = now;
    await userSub.save();
  }

  return userSub;
};

// Check limits before applying to a job
const checkWorkerApplicationLimit = async (req, res, next) => {
  try {
    const userSub = await getOrCreateUserSubscription(req.user._id, 'worker');
    const plan = userSub.planId;
    const maxApps = plan.limits?.maxApplicationsPerMonth ?? 10;

    // -1 represents unlimited
    if (maxApps !== -1 && userSub.usageThisCycle.applicationsUsed >= maxApps) {
      return res.status(403).json({
        success: false,
        code: 'SUBSCRIPTION_LIMIT_REACHED',
        message: `You've used your monthly limit of ${maxApps} applications. Upgrade to Worker Pro for unlimited applications and lower fees!`,
        data: {
          currentPlan: plan.name,
          used: userSub.usageThisCycle.applicationsUsed,
          limit: maxApps,
        },
      });
    }

    req.userSubscription = userSub;
    next();
  } catch (error) {
    next(error);
  }
};

// Check limits before posting a job
const checkPosterJobPostLimit = async (req, res, next) => {
  try {
    const userSub = await getOrCreateUserSubscription(req.user._id, 'poster');
    const plan = userSub.planId;
    const maxPosts = plan.limits?.maxJobPostingsPerMonth ?? 3;

    if (maxPosts !== -1 && userSub.usageThisCycle.jobsPostedUsed >= maxPosts) {
      return res.status(403).json({
        success: false,
        code: 'SUBSCRIPTION_LIMIT_REACHED',
        message: `You've reached your monthly limit of ${maxPosts} job posts. Upgrade to Poster Business for unlimited postings and priority matching!`,
        data: {
          currentPlan: plan.name,
          used: userSub.usageThisCycle.jobsPostedUsed,
          limit: maxPosts,
        },
      });
    }

    req.userSubscription = userSub;
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getOrCreateUserSubscription,
  checkWorkerApplicationLimit,
  checkPosterJobPostLimit,
};
