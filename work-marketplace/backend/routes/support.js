const express = require('express');
const SupportTicket = require('../models/SupportTicket');
const verifyUserToken = require('../middleware/verifyUserToken');

const router = express.Router();

// ─── GET PUBLIC / CONTACT SUPPORT INFO ────────────────────────────────────────
// GET /api/support/contact-info
router.get('/contact-info', (req, res) => {
  res.json({
    success: true,
    data: {
      helplinePhone: '+916396934224',
      helplineDisplay: '+91 63969 34224',
      whatsappPhone: '916396934224',
      whatsappDefaultText: 'Hello WorkMarket Support Team, I need help with...',
      supportEmail: 'support@workmarket.in',
      workingHours: 'Monday - Sunday, 8:00 AM - 10:00 PM IST',
      faqs: [
        {
          question: 'How do workers receive payments?',
          answer: 'When a poster hires you, the payment is locked securely in Escrow. Once the job is marked completed, the money is instantly disbursed directly to your verified UPI ID or Bank account.',
        },
        {
          question: 'What if a client cancels the job?',
          answer: 'If a client cancels after the agreed cancellation window or when you have already arrived, platform cancellation protection compensates your travel/minimum wage.',
        },
        {
          question: 'How do I use the Emergency SOS button?',
          answer: 'Tap the red Shield icon in the top header during any active job to instantly alert our 24/7 safety dispatch team with your live GPS location.',
        },
        {
          question: 'How do I listen to poster voice notes?',
          answer: 'Look for the "🎙️ Voice Note" badge on any job card. Tap on the job to open the player and listen to the client explanation in Hindi or English.',
        },
      ],
    },
  });
});

// Authenticated support ticket routes
router.use(verifyUserToken);

// ─── SUBMIT SUPPORT TICKET ───────────────────────────────────────────────────
// POST /api/support/ticket
router.post('/ticket', async (req, res, next) => {
  try {
    const { subject, category, message, priority } = req.body;

    if (!subject || !message) {
      return res.status(400).json({ success: false, message: 'Subject and message are required' });
    }

    const ticket = await SupportTicket.create({
      userId: req.user._id,
      subject,
      category: category || 'other',
      message,
      priority: priority || 'medium',
      status: 'open',
    });

    res.status(201).json({
      success: true,
      message: 'Support ticket submitted successfully. Our team will contact you shortly.',
      data: { ticket },
    });
  } catch (error) {
    next(error);
  }
});

// ─── GET USER'S SUPPORT TICKETS ───────────────────────────────────────────────
// GET /api/support/my-tickets
router.get('/my-tickets', async (req, res, next) => {
  try {
    const tickets = await SupportTicket.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, data: { tickets } });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
