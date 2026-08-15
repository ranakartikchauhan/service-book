const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema(
  {
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Job',
      required: true,
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    text: {
      type: String,
      required: [true, 'Message text is required'],
      maxlength: 1000,
    },
    readAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true } // createdAt serves as sentAt
);

// Index for efficiently fetching messages for a job (sorted by time)
chatMessageSchema.index({ jobId: 1, createdAt: 1 });

module.exports = mongoose.model('ChatMessage', chatMessageSchema);
