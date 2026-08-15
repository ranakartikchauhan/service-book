let admin;

const initFirebase = () => {
  if (admin) return admin; // already initialized

  try {
    admin = require('firebase-admin');
    const serviceAccount = require(process.env.FIREBASE_SERVICE_ACCOUNT_PATH);

    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    }

    console.log('✅ Firebase Admin initialized');
    return admin;
  } catch (error) {
    console.warn('⚠️  Firebase Admin not initialized (push notifications disabled):', error.message);
    console.warn('    To enable push notifications, add your firebase-service-account.json');
    return null;
  }
};

/**
 * Send a push notification to a single FCM device token.
 * Fails silently if Firebase is not configured (won't crash the server).
 */
const sendPushNotification = async ({ token, title, body, data = {} }) => {
  const firebaseAdmin = initFirebase();
  if (!firebaseAdmin || !token) return;

  try {
    await firebaseAdmin.messaging().send({
      token,
      notification: { title, body },
      data: Object.fromEntries(
        Object.entries(data).map(([k, v]) => [k, String(v)]) // FCM data must be string values
      ),
      android: {
        priority: 'high',
      },
      apns: {
        payload: {
          aps: { sound: 'default' },
        },
      },
    });
  } catch (error) {
    // Log but don't crash — push failures shouldn't block the main action
    console.error('FCM send error:', error.message);

    // Token is invalid/expired — caller should remove it from the User document
    if (error.code === 'messaging/registration-token-not-registered') {
      return { invalidToken: true };
    }
  }
};

/**
 * Send the same notification to multiple tokens at once.
 */
const sendMulticast = async ({ tokens, title, body, data = {} }) => {
  const firebaseAdmin = initFirebase();
  if (!firebaseAdmin || !tokens?.length) return;

  try {
    const message = {
      notification: { title, body },
      data: Object.fromEntries(Object.entries(data).map(([k, v]) => [k, String(v)])),
      tokens,
    };
    const response = await firebaseAdmin.messaging().sendEachForMulticast(message);
    return response;
  } catch (error) {
    console.error('FCM multicast error:', error.message);
  }
};

// ─── Notification helpers for specific events ────────────────────────────────

const notifyApplicationAccepted = (token, jobTitle) =>
  sendPushNotification({
    token,
    title: '🎉 Application Accepted!',
    body: `You've been hired for "${jobTitle}". Check your active jobs.`,
    data: { type: 'application_accepted' },
  });

const notifyApplicationRejected = (token, jobTitle) =>
  sendPushNotification({
    token,
    title: 'Application Update',
    body: `Your application for "${jobTitle}" wasn't selected this time.`,
    data: { type: 'application_rejected' },
  });

const notifyNewMessage = (token, senderName) =>
  sendPushNotification({
    token,
    title: `New message from ${senderName}`,
    body: 'Tap to view your conversation.',
    data: { type: 'new_message' },
  });

const notifyJobCompleted = (token, jobTitle) =>
  sendPushNotification({
    token,
    title: '✅ Job Completed',
    body: `"${jobTitle}" has been marked complete. Payment is being processed.`,
    data: { type: 'job_completed' },
  });

const notifyNewApplicant = (token, jobTitle) =>
  sendPushNotification({
    token,
    title: 'New Applicant',
    body: `Someone applied to your job "${jobTitle}". View their profile.`,
    data: { type: 'new_applicant' },
  });

module.exports = {
  sendPushNotification,
  sendMulticast,
  notifyApplicationAccepted,
  notifyApplicationRejected,
  notifyNewMessage,
  notifyJobCompleted,
  notifyNewApplicant,
};
