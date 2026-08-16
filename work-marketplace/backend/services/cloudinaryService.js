const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ─── PUBLIC UPLOADS (profile photos, job photos) ───────────────────────────
const publicStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'work-marketplace/public',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 1200, height: 1200, crop: 'limit', quality: 'auto' }],
  },
});

// ─── PRIVATE UPLOADS (government ID documents) ──────────────────────────────
// IMPORTANT: These are stored in a Cloudinary folder with access_mode: private
// They must NEVER be served via public URLs. Use signed URLs for admin review only.
const privateStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'work-marketplace/private/id-docs',
    allowed_formats: ['jpg', 'jpeg', 'png', 'pdf'],
    access_mode: 'authenticated', // restricts public access
    resource_type: 'auto',
  },
});

// ─── AUDIO UPLOADS (voice notes) ───────────────────────────────────────────
const audioStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'work-marketplace/voice-notes',
    resource_type: 'auto',
    allowed_formats: ['mp3', 'm4a', 'aac', 'wav', 'ogg', '3gp', 'mp4'],
  },
});

// Multer upload instances
const uploadPublic = multer({
  storage: publicStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
});

const uploadPrivate = multer({
  storage: privateStorage,
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB max (PDF IDs can be larger)
});

const uploadAudio = multer({
  storage: audioStorage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB max
});

// Generate a time-limited signed URL for viewing a private doc (admin use only)
const getSignedUrl = (publicId, expiresInSeconds = 300) => {
  return cloudinary.url(publicId, {
    sign_url: true,
    expires_at: Math.floor(Date.now() / 1000) + expiresInSeconds,
    resource_type: 'auto',
  });
};

// Delete a file from Cloudinary by publicId
const deleteFile = async (publicId, resourceType = 'image') => {
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
  } catch (error) {
    console.error('Cloudinary delete error:', error);
  }
};

// Delete a file from Cloudinary by full media URL (automatic publicId extraction & type detection)
const deleteMediaByUrl = async (url) => {
  if (!url || typeof url !== 'string' || !url.includes('cloudinary.com')) return;

  try {
    const isAudioOrVideo = url.includes('/video/') || url.match(/\.(mp3|m4a|aac|wav|ogg|3gp|mp4)$/i);
    const resourceType = isAudioOrVideo ? 'video' : 'image';

    const uploadIdx = url.indexOf('/upload/');
    if (uploadIdx === -1) return;

    let pathAfterUpload = url.substring(uploadIdx + 8);
    pathAfterUpload = pathAfterUpload.replace(/^v\d+\//, '');

    const lastDotIdx = pathAfterUpload.lastIndexOf('.');
    const publicId = lastDotIdx !== -1 ? pathAfterUpload.substring(0, lastDotIdx) : pathAfterUpload;

    const res = await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
    console.log(`[Cloudinary Cleanup] Deleted ${resourceType} (${publicId}):`, res?.result || 'ok');
    return res;
  } catch (err) {
    console.error(`[Cloudinary Cleanup Error] Failed to delete ${url}:`, err.message);
  }
};

module.exports = { uploadPublic, uploadPrivate, uploadAudio, getSignedUrl, deleteFile, deleteMediaByUrl };
