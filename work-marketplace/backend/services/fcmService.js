let admin;

const initFirebase = () => {
  if (admin) return admin;

  try {
    admin = require('firebase-admin');
    
    // Support path or inline JSON string in env or default config file
    let serviceAccount;
    if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
      serviceAccount = typeof process.env.FIREBASE_SERVICE_ACCOUNT_JSON === 'string'
        ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON)
        : process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    } else if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
      const path = require('path');
      const resolvedPath = path.isAbsolute(process.env.FIREBASE_SERVICE_ACCOUNT_PATH)
        ? process.env.FIREBASE_SERVICE_ACCOUNT_PATH
        : path.join(__dirname, '..', process.env.FIREBASE_SERVICE_ACCOUNT_PATH);
      serviceAccount = require(resolvedPath);
    } else {
      const path = require('path');
      const fs = require('fs');
      const defaultPath = path.join(__dirname, '../config/firebase-service-account.json');
      if (fs.existsSync(defaultPath)) {
        serviceAccount = require(defaultPath);
      }
    }

    if (serviceAccount && !admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      console.log('✅ Firebase Admin SDK initialized successfully');
    }
    return admin;
  } catch (error) {
    console.warn('⚠️  Firebase Admin not initialized (falling back to Expo Push / Mock):', error.message);
    return null;
  }
};

/**
 * Send a push notification (Supports Expo Push API and Firebase Cloud Messaging)
 * Email alert automatically sent to kartikchauhan336@gmail.com if delivery fails.
 */
const sendPushNotification = async (firstArg, secondArg) => {
  let token, title, body, data;
  if (typeof firstArg === 'string') {
    token = firstArg;
    title = secondArg?.title;
    body = secondArg?.body;
    data = secondArg?.data || {};
  } else if (firstArg && typeof firstArg === 'object') {
    token = firstArg.token;
    title = firstArg.title;
    body = firstArg.body;
    data = firstArg.data || {};
  }

  const { sendNotificationFailureEmail } = require('./emailService');

  if (!token) {
    sendNotificationFailureEmail({
      token: 'NULL / UNDEFINED',
      title: title || 'N/A',
      body: body || 'N/A',
      errorReason: 'Push Notification aborted: No recipient device token provided.',
    }).catch(() => {});
    return;
  }

  // 1. Check if token is an Expo Push Token
  if (token.startsWith('ExponentPushToken[') || token.startsWith('ExpoPushToken[')) {
    try {
      const response = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Accept-encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: token,
          sound: 'default',
          title,
          body,
          data,
          priority: 'high',
          channelId: 'default',
        }),
      });
      const result = await response.json();
      console.log('📱 [Expo Push Sent]:', result);

      if (result?.data?.status === 'error') {
        const errDetail = result.data.message || JSON.stringify(result.data);
        console.error('❌ Expo Push Server Error:', errDetail);
        sendNotificationFailureEmail({
          token,
          title,
          body,
          errorReason: `Expo Push Server Rejected: ${errDetail}`,
        }).catch(() => {});
      }

      return result;
    } catch (err) {
      console.error('Expo Push error:', err.message);
      sendNotificationFailureEmail({
        token,
        title,
        body,
        errorReason: `Expo Push Network Error: ${err.message}`,
      }).catch(() => {});
      return;
    }
  }

  // 2. Try Firebase Cloud Messaging if configured
  const firebaseAdmin = initFirebase();
  if (firebaseAdmin && admin.apps.length) {
    try {
      await firebaseAdmin.messaging().send({
        token,
        notification: { title, body },
        data: Object.fromEntries(
          Object.entries(data).map(([k, v]) => [k, String(v)])
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
      console.log(`📱 [FCM Sent] To ${token.slice(0, 10)}... | Title: ${title}`);
      return;
    } catch (error) {
      console.error('FCM send error:', error.message);
      sendNotificationFailureEmail({
        token,
        title,
        body,
        errorReason: `Firebase FCM Error (${error.code || 'N/A'}): ${error.message}`,
      }).catch(() => {});

      if (error.code === 'messaging/registration-token-not-registered') {
        return { invalidToken: true };
      }
    }
  } else {
    sendNotificationFailureEmail({
      token,
      title,
      body,
      errorReason: `Firebase Admin SDK not initialized on backend server. Add FIREBASE_SERVICE_ACCOUNT_JSON to Vercel/Render env vars.`,
    }).catch(() => {});
  }

  // 3. Fallback / Dev Log
  console.log(`\n======================================================`);
  console.log(`🔔 [PUSH NOTIFICATION] To: ${token?.slice(0, 15)}...`);
  console.log(`   Title: ${title}`);
  console.log(`   Body:  ${body}`);
  console.log(`======================================================\n`);
};

/**
 * Send multicast notification
 */
const sendMulticast = async ({ tokens, title, body, data = {} }) => {
  if (!tokens || !tokens.length) return;
  await Promise.all(tokens.map((token) => sendPushNotification({ token, title, body, data })));
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
    title: `💬 New message from ${senderName}`,
    body: 'Tap to open chat conversation.',
    data: { type: 'new_message' },
  });

const notifyJobCompleted = (token, jobTitle) =>
  sendPushNotification({
    token,
    title: '✅ Job Completed',
    body: `"${jobTitle}" has been marked complete. Escrow payout is being processed.`,
    data: { type: 'job_completed' },
  });

const notifyNewApplicant = (token, jobTitle) =>
  sendPushNotification({
    token,
    title: '👤 New Applicant',
    body: `A verified worker applied to your job "${jobTitle}". Review proposal.`,
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
