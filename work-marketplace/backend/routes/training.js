const express = require('express');
const TrainingVideo = require('../models/TrainingVideo');

const router = express.Router();

const DEFAULT_TRAINING_VIDEOS = [
  {
    title: 'WorkMarket App Kaise Use Karein (ऐप का इस्तेमाल कैसे करें)',
    description: 'Naye jobs dekhna, apply karna aur proposal rate set karne ka poora process.',
    videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    thumbnailUrl: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800&q=80',
    durationMinutes: 4,
    language: 'Hindi',
    category: 'onboarding',
    sortOrder: 1,
    active: true,
  },
  {
    title: 'Customer Se Baat Karne Ka Tareeqa (ग्राहकों से बातचीत के नियम)',
    description: 'Time par pahunchna, namrata se baat karna aur 5-Star rating pane ke tips.',
    videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    thumbnailUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800&q=80',
    durationMinutes: 3,
    language: 'Hindi',
    category: 'customer_service',
    sortOrder: 2,
    active: true,
  },
  {
    title: 'Payment Aur Escrow Payouts (पैसे और बैंक ट्रांसफर कैसे मिलते हैं)',
    description: 'Job complete hone par paise sidhe aapke UPI ya Bank account me kaise transfer hote hain.',
    videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    thumbnailUrl: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=800&q=80',
    durationMinutes: 3,
    language: 'Hindi',
    category: 'payments',
    sortOrder: 3,
    active: true,
  },
  {
    title: 'Workplace Safety & SOS Button (सुरक्षा नियम और आपातकालीन SOS)',
    description: 'Apni suraksha kaise rakhein aur emergency me SOS button ka use kaise karein.',
    videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    thumbnailUrl: 'https://images.unsplash.com/photo-1582139329536-e7284fece509?w=800&q=80',
    durationMinutes: 5,
    language: 'Hindi',
    category: 'safety',
    sortOrder: 4,
    active: true,
  },
  {
    title: 'Voice Note Aur Photos Dekhkar Kaam Samjhein (वॉइस और फोटो गाइड)',
    description: 'Poster ke voice instructions sunkar aur photos dekhkar kaam ka sahi andaza lagayein.',
    videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    thumbnailUrl: 'https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?w=800&q=80',
    durationMinutes: 3,
    language: 'Hindi',
    category: 'skills',
    sortOrder: 5,
    active: true,
  },
];

// ─── GET ACTIVE TRAINING VIDEOS (Public / Worker) ─────────────────────────────
// GET /api/training/videos?category=
router.get('/videos', async (req, res, next) => {
  try {
    const { category } = req.query;
    let query = { active: true };
    if (category && category !== 'all') {
      query.category = category;
    }

    let videos = await TrainingVideo.find(query).sort({ sortOrder: 1, createdAt: -1 });

    // Auto-seed default training videos if collection is empty
    if (videos.length === 0 && (!category || category === 'all')) {
      await TrainingVideo.insertMany(DEFAULT_TRAINING_VIDEOS);
      videos = await TrainingVideo.find(query).sort({ sortOrder: 1, createdAt: -1 });
    }

    res.json({ success: true, data: { videos } });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
