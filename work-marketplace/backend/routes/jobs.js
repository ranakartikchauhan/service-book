const express = require('express');
const Job = require('../models/Job');
const Application = require('../models/Application');
const WorkerProfile = require('../models/WorkerProfile');
const Transaction = require('../models/Transaction');
const PlatformConfig = require('../models/PlatformConfig');
const User = require('../models/User');
const verifyUserToken = require('../middleware/verifyUserToken');
const { uploadPublic, uploadAudio } = require('../services/cloudinaryService');
const Category = require('../models/Category');
const { JOB_STATUS, APPLICATION_STATUS, TRANSACTION_STATUS, VERIFICATION_STATUS, DEFAULT_CATEGORIES } = require('../config/constants');
const {
  notifyApplicationAccepted,
  notifyApplicationRejected,
  notifyNewApplicant,
} = require('../services/fcmService');
const {
  checkWorkerApplicationLimit,
  checkPosterJobPostLimit,
} = require('../middleware/checkSubscriptionLimits');

const router = express.Router();

// ─── GET CATEGORIES (Public) ──────────────────────────────────────────────────
// GET /api/jobs/categories
router.get('/categories', async (req, res, next) => {
  try {
    let categories = await Category.find({ active: true }).sort({ sortOrder: 1, name: 1 });
    if (categories.length === 0) {
      // Auto-seed default categories if database is fresh
      await Category.insertMany(
        DEFAULT_CATEGORIES.map((cat, idx) => ({ ...cat, sortOrder: idx, active: true }))
      );
      categories = await Category.find({ active: true }).sort({ sortOrder: 1, name: 1 });
    }
    res.json({ success: true, data: { categories } });
  } catch (error) {
    next(error);
  }
});

router.use(verifyUserToken);

// ─── UPLOAD VOICE NOTE AUDIO (poster) ─────────────────────────────────────────
// POST /api/jobs/upload-voice
router.post('/upload-voice', uploadAudio.single('voice'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No voice audio file uploaded' });
    }
    const durationSec = req.body.durationSec ? parseInt(req.body.durationSec) : 0;
    res.json({
      success: true,
      data: {
        voiceNoteUrl: req.file.path,
        durationSec,
      },
    });
  } catch (error) {
    next(error);
  }
});

// ─── UPLOAD JOB WORK PHOTO (poster) ───────────────────────────────────────────
// POST /api/jobs/upload-photo
router.post('/upload-photo', uploadPublic.single('photo'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No photo uploaded' });
    }
    res.json({
      success: true,
      data: {
        photoUrl: req.file.path,
      },
    });
  } catch (error) {
    next(error);
  }
});

// ─── CREATE JOB (poster) ──────────────────────────────────────────────────────
// POST /api/jobs
router.post('/', uploadPublic.array('photos', 5), checkPosterJobPostLimit, async (req, res, next) => {
  try {
    const {
      category, title, description, longitude, latitude, addressText,
      scheduledDate, budgetType, budgetAmount, estimatedDurationHours, isUrgent,
      voiceNote, photos: bodyPhotos,
    } = req.body;

    if (!category || !title || !description || !longitude || !latitude || !scheduledDate || !budgetAmount) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    let photos = req.files?.map((f) => f.path) || [];
    if (photos.length === 0 && bodyPhotos) {
      if (Array.isArray(bodyPhotos)) {
        photos = bodyPhotos;
      } else if (typeof bodyPhotos === 'string') {
        try {
          photos = JSON.parse(bodyPhotos);
        } catch {
          photos = [bodyPhotos];
        }
      }
    }

    let parsedVoiceNote = undefined;
    if (voiceNote) {
      if (typeof voiceNote === 'string') {
        try {
          parsedVoiceNote = JSON.parse(voiceNote);
        } catch {
          parsedVoiceNote = { url: voiceNote, durationSec: 0 };
        }
      } else if (typeof voiceNote === 'object') {
        parsedVoiceNote = voiceNote;
      }
    }

    const job = await Job.create({
      posterId: req.user._id,
      category,
      title,
      description,
      location: {
        type: 'Point',
        coordinates: [parseFloat(longitude), parseFloat(latitude)],
        addressText,
      },
      scheduledDate,
      budgetType: budgetType || 'fixed',
      budgetAmount: parseFloat(budgetAmount),
      estimatedDurationHours: estimatedDurationHours ? parseFloat(estimatedDurationHours) : undefined,
      photos,
      voiceNote: parsedVoiceNote,
      isUrgent: isUrgent === 'true' || isUrgent === true,
    });

    // Increment poster's job count
    await require('../models/PosterProfile').findOneAndUpdate(
      { userId: req.user._id },
      { $inc: { jobsPosted: 1 } }
    );

    // Track usage in subscription
    if (req.userSubscription) {
      req.userSubscription.usageThisCycle.jobsPostedUsed += 1;
      await req.userSubscription.save();
    }

    res.status(201).json({ success: true, data: { job } });
  } catch (error) {
    next(error);
  }
});

// ─── GET NEARBY JOBS (worker) ─────────────────────────────────────────────────
// GET /api/jobs/nearby?lng=&lat=&radius=&category=&isUrgent=&sortBy=&page=&limit=
router.get('/nearby', async (req, res, next) => {
  try {
    const { lng, lat, radius = 10, category, isUrgent, search, sortBy, page = 1, limit = 20 } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    let query = { status: JOB_STATUS.OPEN };

    if (category) query.category = category;
    if (isUrgent === 'true') query.isUrgent = true;

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      query.$or = [
        { title: searchRegex },
        { description: searchRegex },
        { 'location.addressText': searchRegex },
      ];
    }

    let hasGeospatial = false;
    if (lng && lat && !isNaN(parseFloat(lng)) && !isNaN(parseFloat(lat)) && radius !== 'all' && !search) {
      query.location = {
        $near: {
          $geometry: { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] },
          $maxDistance: parseFloat(radius) * 1000, // convert km to meters
        },
      };
      hasGeospatial = true;
    }

    let jobs = [];
    try {
      let jobQuery = Job.find(query)
        .populate('category', 'name icon')
        .populate('posterId', 'name profilePhotoUrl')
        .skip(skip)
        .limit(parseInt(limit));

      if (sortBy === 'budget_high') jobQuery = jobQuery.sort({ budgetAmount: -1 });
      else if (sortBy === 'newest' || !hasGeospatial) jobQuery = jobQuery.sort({ createdAt: -1 });

      jobs = await jobQuery;
    } catch (geoError) {
      console.warn('Geospatial query fallback triggered:', geoError.message);
      // Fallback query without $near if index or coordinates failed
      const fallbackQuery = { status: JOB_STATUS.OPEN };
      if (category) fallbackQuery.category = category;
      if (isUrgent === 'true') fallbackQuery.isUrgent = true;
      if (search && search.trim()) {
        const searchRegex = new RegExp(search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
        fallbackQuery.$or = [
          { title: searchRegex },
          { description: searchRegex },
          { 'location.addressText': searchRegex },
        ];
      }

      jobs = await Job.find(fallbackQuery)
        .populate('category', 'name icon')
        .populate('posterId', 'name profilePhotoUrl')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));
    }

    // Attach poster rating to each job
    const jobsWithRating = await Promise.all(
      jobs.map(async (job) => {
        const posterProfile = await require('../models/PosterProfile').findOne({ userId: job.posterId?._id }, 'rating');
        return { ...job.toObject(), posterRating: posterProfile?.rating || { average: 0, count: 0 } };
      })
    );

    res.json({ success: true, data: { jobs: jobsWithRating, page: parseInt(page) } });
  } catch (error) {
    next(error);
  }
});

// ─── GET POSTER'S OWN JOBS ────────────────────────────────────────────────────
// GET /api/jobs/my-jobs
router.get('/my-jobs', async (req, res, next) => {
  try {
    const { status } = req.query;
    const query = { posterId: req.user._id };
    if (status) query.status = status;

    const jobs = await Job.find(query)
      .populate('category', 'name icon')
      .populate('assignedWorkerId', 'name profilePhotoUrl')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: { jobs } });
  } catch (error) {
    next(error);
  }
});

// ─── GET JOB DETAIL ───────────────────────────────────────────────────────────
// GET /api/jobs/:id
router.get('/:id', async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id)
      .populate('category', 'name icon')
      .populate('posterId', 'name profilePhotoUrl')
      .populate('assignedWorkerId', 'name profilePhotoUrl');

    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });

    res.json({ success: true, data: { job } });
  } catch (error) {
    next(error);
  }
});

// ─── CANCEL JOB (poster) ──────────────────────────────────────────────────────
// PATCH /api/jobs/:id/cancel
router.patch('/:id/cancel', async (req, res, next) => {
  try {
    const job = await Job.findOne({ _id: req.params.id, posterId: req.user._id });
    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });

    if (![JOB_STATUS.OPEN, JOB_STATUS.ASSIGNED].includes(job.status)) {
      return res.status(400).json({ success: false, message: 'Cannot cancel a job in progress or completed' });
    }

    job.status = JOB_STATUS.CANCELLED;
    await job.save();

    // TODO: If status was ASSIGNED, trigger refund via Razorpay

    res.json({ success: true, message: 'Job cancelled' });
  } catch (error) {
    next(error);
  }
});

// ─── MARK JOB AS STARTED (worker) ────────────────────────────────────────────
// PATCH /api/jobs/:id/start
router.patch('/:id/start', async (req, res, next) => {
  try {
    const job = await Job.findOne({ _id: req.params.id, assignedWorkerId: req.user._id });
    if (!job) return res.status(404).json({ success: false, message: 'Job not found or not assigned to you' });

    if (job.status !== JOB_STATUS.ASSIGNED) {
      return res.status(400).json({ success: false, message: 'Job must be in assigned status to start' });
    }

    job.status = JOB_STATUS.IN_PROGRESS;
    await job.save();

    // Notify poster that worker has started
    const poster = await User.findById(job.posterId);
    if (poster?.fcmToken) {
      const { sendPushNotification } = require('../services/fcmService');
      sendPushNotification({
        token: poster.fcmToken,
        title: '🚀 Service Started!',
        body: `${req.user.name} has started work on "${job.title}".`,
        data: { type: 'job_started', jobId: job._id.toString() },
      });
    }

    res.json({ success: true, message: 'Job marked as started' });
  } catch (error) {
    next(error);
  }
});

// ─── MARK JOB AS COMPLETED (poster or assigned worker) ────────────────────────
// PATCH /api/jobs/:id/complete
router.patch('/:id/complete', async (req, res, next) => {
  try {
    const job = await Job.findOne({
      _id: req.params.id,
      $or: [{ posterId: req.user._id }, { assignedWorkerId: req.user._id }],
    });
    if (!job) return res.status(404).json({ success: false, message: 'Job not found or not assigned to you' });

    if (job.status !== JOB_STATUS.IN_PROGRESS && job.status !== JOB_STATUS.ASSIGNED) {
      return res.status(400).json({ success: false, message: 'Job must be active or in progress to mark complete' });
    }

    job.status = JOB_STATUS.COMPLETED;
    await job.save();

    // Release payment to worker if in escrow, or record earnings transaction
    let transaction = await Transaction.findOne({ jobId: job._id });
    const app = await Application.findOne({ jobId: job._id, status: 'accepted' });
    const payoutAmount = (app && app.proposedRate) ? app.proposedRate : (job.budget || 500);

    if (transaction && transaction.status === TRANSACTION_STATUS.HELD_IN_ESCROW) {
      const { createPayout } = require('../services/razorpayService');
      const workerProfile = await WorkerProfile.findOne({ userId: job.assignedWorkerId });

      await createPayout({
        workerId: job.assignedWorkerId,
        amount: transaction.workerPayout,
        upiId: workerProfile?.payoutDetails?.upiId,
        bankAccount: workerProfile?.payoutDetails?.bankAccountNumber,
        ifscCode: workerProfile?.payoutDetails?.ifscCode,
      });

      transaction.status = TRANSACTION_STATUS.RELEASED;
      transaction.releasedAt = new Date();
      await transaction.save();

      // Update worker's total earnings
      await WorkerProfile.findOneAndUpdate(
        { userId: job.assignedWorkerId },
        { $inc: { earningsTotal: transaction.workerPayout, completedJobs: 1 } },
        { upsert: true }
      );
    } else {
      if (!transaction && job.assignedWorkerId) {
        transaction = await Transaction.create({
          jobId: job._id,
          posterId: job.posterId,
          workerId: job.assignedWorkerId,
          amount: payoutAmount,
          platformCommission: 0,
          workerPayout: payoutAmount,
          status: TRANSACTION_STATUS.RELEASED,
          releasedAt: new Date(),
        });
      } else if (transaction) {
        transaction.status = TRANSACTION_STATUS.RELEASED;
        transaction.releasedAt = new Date();
        await transaction.save();
      }

      if (job.assignedWorkerId) {
        await WorkerProfile.findOneAndUpdate(
          { userId: job.assignedWorkerId },
          { $inc: { earningsTotal: payoutAmount, completedJobs: 1 } },
          { upsert: true }
        );
      }
    }

    // Send notifications to the other party
    const isPoster = job.posterId?.toString() === req.user._id?.toString();
    const otherUserId = isPoster ? job.assignedWorkerId : job.posterId;
    if (otherUserId) {
      const otherUser = await User.findById(otherUserId);
      if (otherUser?.fcmToken) {
        notifyJobCompleted(otherUser.fcmToken, job.title);
      }
    }

    res.json({ success: true, message: 'Job marked as completed successfully!' });
  } catch (error) {
    next(error);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
//  APPLICATIONS
// ─────────────────────────────────────────────────────────────────────────────

// ─── APPLY TO JOB (worker) ────────────────────────────────────────────────────
// POST /api/jobs/:id/apply
router.post('/:id/apply', checkWorkerApplicationLimit, async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });
    if (job.status !== JOB_STATUS.OPEN) {
      return res.status(400).json({ success: false, message: 'This job is no longer accepting applications' });
    }

    // Worker must be verified to apply
    const workerProfile = await WorkerProfile.findOne({ userId: req.user._id });
    if (!workerProfile || workerProfile.verification.status !== VERIFICATION_STATUS.VERIFIED) {
      return res.status(403).json({
        success: false,
        message: 'You must complete ID verification before applying to jobs.',
      });
    }

    const { proposedRate, message } = req.body;
    if (!proposedRate) {
      return res.status(400).json({ success: false, message: 'Proposed rate is required' });
    }

    const application = await Application.create({
      jobId: job._id,
      workerId: req.user._id,
      proposedRate: parseFloat(proposedRate),
      message: message || '',
    });

    // Track usage in subscription
    if (req.userSubscription) {
      req.userSubscription.usageThisCycle.applicationsUsed += 1;
      await req.userSubscription.save();
    }

    // Notify the poster
    const poster = await User.findById(job.posterId);
    if (poster?.fcmToken) notifyNewApplicant(poster.fcmToken, job.title);

    res.status(201).json({ success: true, data: { application } });
  } catch (error) {
    // Duplicate application (unique index violation)
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: 'You have already applied to this job' });
    }
    next(error);
  }
});

// ─── GET APPLICATIONS FOR A JOB (poster) ─────────────────────────────────────
// GET /api/jobs/:id/applications
router.get('/:id/applications', async (req, res, next) => {
  try {
    const job = await Job.findOne({ _id: req.params.id, posterId: req.user._id });
    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });

    const applications = await Application.find({ jobId: job._id })
      .populate('workerId', 'name profilePhotoUrl')
      .sort({ createdAt: 1 });

    // Attach worker profile data (rating, verification, skills) to each application
    const enriched = await Promise.all(
      applications.map(async (app) => {
        const profile = await WorkerProfile.findOne({ userId: app.workerId._id }, 'skills rating verification.status completedJobs');
        return { ...app.toObject(), workerProfile: profile };
      })
    );

    res.json({ success: true, data: { applications: enriched } });
  } catch (error) {
    next(error);
  }
});

// ─── HIRE A WORKER (poster accepts an application) ───────────────────────────
// PATCH or POST /api/jobs/:id/hire/:applicationId
// POST or PATCH /api/jobs/:id/applications/:applicationId/accept
const handleHireWorker = async (req, res, next) => {
  try {
    const job = await Job.findOne({ _id: req.params.id, posterId: req.user._id });
    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });
    if (job.status !== JOB_STATUS.OPEN && job.status !== 'open') {
      return res.status(400).json({ success: false, message: 'Job is no longer open for hiring' });
    }

    const application = await Application.findById(req.params.applicationId);
    if (!application || !application.jobId.equals(job._id)) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    // Accept this application
    application.status = APPLICATION_STATUS.ACCEPTED;
    await application.save();

    // Reject all other pending applications
    await Application.updateMany(
      { jobId: job._id, _id: { $ne: application._id }, status: APPLICATION_STATUS.PENDING },
      { status: APPLICATION_STATUS.REJECTED }
    );

    // Assign worker to job
    job.status = JOB_STATUS.ASSIGNED;
    job.assignedWorkerId = application.workerId;
    await job.save();

    // Notify accepted worker
    const worker = await User.findById(application.workerId);
    if (worker?.fcmToken) notifyApplicationAccepted(worker.fcmToken, job.title);

    // Notify rejected workers
    const rejectedApps = await Application.find({
      jobId: job._id,
      status: APPLICATION_STATUS.REJECTED,
      workerId: { $ne: application.workerId },
    });
    rejectedApps.forEach(async (app) => {
      const rejectedWorker = await User.findById(app.workerId);
      if (rejectedWorker?.fcmToken) notifyApplicationRejected(rejectedWorker.fcmToken, job.title);
    });

    res.json({
      success: true,
      message: `Worker hired successfully!`,
      data: { assignedWorkerId: application.workerId, job },
    });
  } catch (error) {
    next(error);
  }
};

router.patch('/:id/hire/:applicationId', handleHireWorker);
router.post('/:id/hire/:applicationId', handleHireWorker);
router.post('/:id/applications/:applicationId/accept', handleHireWorker);
router.patch('/:id/applications/:applicationId/accept', handleHireWorker);

// ─── WITHDRAW APPLICATION (worker) ───────────────────────────────────────────
// PATCH /api/jobs/:id/withdraw-application
router.patch('/:id/withdraw-application', async (req, res, next) => {
  try {
    const application = await Application.findOneAndUpdate(
      { jobId: req.params.id, workerId: req.user._id, status: APPLICATION_STATUS.PENDING },
      { status: APPLICATION_STATUS.WITHDRAWN },
      { new: true }
    );

    if (!application) {
      return res.status(404).json({ success: false, message: 'Pending application not found' });
    }

    res.json({ success: true, message: 'Application withdrawn' });
  } catch (error) {
    next(error);
  }
});

// ─── GET WORKER'S OWN APPLICATIONS ───────────────────────────────────────────
// GET /api/jobs/applications/mine
router.get('/applications/mine', async (req, res, next) => {
  try {
    const { status } = req.query;
    const query = { workerId: req.user._id };
    if (status) query.status = status;

    const applications = await Application.find(query)
      .populate({
        path: 'jobId',
        populate: { path: 'category', select: 'name icon' },
      })
      .sort({ createdAt: -1 });

    res.json({ success: true, data: { applications } });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
