const cron = require('node-cron');
const Job = require('../models/Job');
const { deleteMediaByUrl } = require('./cloudinaryService');

/**
 * Clean up job voice notes and photos older than 7 days
 * to keep Cloudinary storage optimal and avoid unnecessary data retention.
 */
async function runMediaCleanupNow() {
  console.log('[Media Cleanup Cron] 🧹 Starting automated 7-day job media cleanup...');

  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    // Find jobs created or updated > 7 days ago with media attachments
    const expiredJobs = await Job.find({
      createdAt: { $lte: sevenDaysAgo },
      $or: [
        { 'voiceNote.url': { $ne: null } },
        { photos: { $exists: true, $not: { $size: 0 } } },
      ],
    });

    console.log(`[Media Cleanup Cron] Found ${expiredJobs.length} jobs older than 7 days with media.`);

    let deletedPhotosCount = 0;
    let deletedVoiceCount = 0;

    for (const job of expiredJobs) {
      // 1. Delete work photos from Cloudinary
      if (job.photos && job.photos.length > 0) {
        for (const photoUrl of job.photos) {
          await deleteMediaByUrl(photoUrl);
          deletedPhotosCount++;
        }
        job.photos = [];
      }

      // 2. Delete voice note audio from Cloudinary
      if (job.voiceNote?.url) {
        await deleteMediaByUrl(job.voiceNote.url);
        job.voiceNote = { url: null, durationSec: 0 };
        deletedVoiceCount++;
      }

      await job.save();
    }

    console.log(`[Media Cleanup Cron] ✅ Cleanup complete! Deleted ${deletedPhotosCount} photos and ${deletedVoiceCount} voice notes from Cloudinary.`);
    return {
      success: true,
      jobsProcessed: expiredJobs.length,
      deletedPhotos: deletedPhotosCount,
      deletedVoiceNotes: deletedVoiceCount,
    };
  } catch (error) {
    console.error('[Media Cleanup Cron] ❌ Error running media cleanup:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Initialize daily cron job scheduled at 02:00 AM every night
 */
function initMediaCleanupCron() {
  // Run every night at 2:00 AM
  cron.schedule('0 2 * * *', async () => {
    console.log('[Media Cleanup Cron] ⏰ Scheduled 2:00 AM trigger running...');
    await runMediaCleanupNow();
  });

  console.log('⏰ [Media Cleanup Cron] Initialized: Scheduled to run daily at 02:00 AM (7-day retention).');
}

module.exports = { initMediaCleanupCron, runMediaCleanupNow };
