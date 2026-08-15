const express = require('express');
const Review = require('../models/Review');
const Job = require('../models/Job');
const WorkerProfile = require('../models/WorkerProfile');
const PosterProfile = require('../models/PosterProfile');
const verifyUserToken = require('../middleware/verifyUserToken');
const { JOB_STATUS } = require('../config/constants');

const router = express.Router();
router.use(verifyUserToken);

// ─── CREATE REVIEW ────────────────────────────────────────────────────────────
// POST /api/reviews
router.post('/', async (req, res, next) => {
  try {
    const { jobId, toUserId, rating, comment } = req.body;

    if (!jobId || !toUserId || !rating) {
      return res.status(400).json({ success: false, message: 'jobId, toUserId, and rating are required' });
    }

    const job = await Job.findById(jobId);
    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });

    // Only allow reviews on completed jobs
    if (job.status !== JOB_STATUS.COMPLETED) {
      return res.status(400).json({ success: false, message: 'Can only review a completed job' });
    }

    // Reviewer must be either the poster or the assigned worker
    const isPoster = job.posterId.equals(req.user._id);
    const isWorker = job.assignedWorkerId?.equals(req.user._id);

    if (!isPoster && !isWorker) {
      return res.status(403).json({ success: false, message: 'Not authorized to review this job' });
    }

    // The target must be the other party
    const expectedTarget = isPoster ? job.assignedWorkerId : job.posterId;
    if (!expectedTarget?.equals(toUserId)) {
      return res.status(400).json({ success: false, message: 'Invalid review target' });
    }

    const review = await Review.create({
      jobId,
      fromUserId: req.user._id,
      toUserId,
      rating: parseInt(rating),
      comment: comment || '',
    });

    // Recalculate aggregate rating for the target user
    await updateAggregateRating(toUserId, isPoster ? 'worker' : 'poster');

    res.status(201).json({ success: true, data: { review } });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: 'You have already reviewed this job' });
    }
    next(error);
  }
});

// ─── GET REVIEWS FOR A USER ───────────────────────────────────────────────────
// GET /api/reviews/:userId?role=worker
router.get('/:userId', async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const reviews = await Review.find({ toUserId: req.params.userId })
      .populate('fromUserId', 'name profilePhotoUrl')
      .populate('jobId', 'title')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.json({ success: true, data: { reviews, page: parseInt(page) } });
  } catch (error) {
    next(error);
  }
});

// ─── HELPER: Recalculate aggregate rating ────────────────────────────────────
const updateAggregateRating = async (userId, role) => {
  const reviews = await Review.find({ toUserId: userId });
  if (!reviews.length) return;

  const avg = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
  const rounded = Math.round(avg * 10) / 10; // round to 1 decimal

  const update = { 'rating.average': rounded, 'rating.count': reviews.length };

  if (role === 'worker') {
    await WorkerProfile.findOneAndUpdate({ userId }, update);
  } else {
    await PosterProfile.findOneAndUpdate({ userId }, update);
  }
};

module.exports = router;
