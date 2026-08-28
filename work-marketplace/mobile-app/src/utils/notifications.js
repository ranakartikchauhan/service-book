import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import api from '../api/client';

// Configure foreground notification presentation safely at module level
try {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
} catch (handlerErr) {
  console.warn('Notification handler init warning:', handlerErr?.message || handlerErr);
}

/**
 * Register device for push notifications and sync token with backend
 */
export async function registerForPushNotificationsAsync() {
  if (Platform.OS === 'web') {
    return { success: true, token: null, isWeb: true };
  }

  if (!Device.isDevice) {
    console.log('Push notifications require a physical device');
    return { success: true, token: null, isSimulator: true };
  }

  let token = null;

  try {
    // Set up Android notification channel
    if (Platform.OS === 'android') {
      try {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'WorkMarket Alerts',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#6366F1',
          // Omit sound key so Android uses system default notification sound without resource errors
        });
      } catch (chanErr) {
        console.warn('Notification channel setup warning:', chanErr?.message || chanErr);
      }
    }

    // Check device permissions
    let finalStatus = 'undetermined';
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
    } catch (permErr) {
      console.warn('Notification permission query warning:', permErr?.message || permErr);
      return null;
    }

    if (finalStatus !== 'granted') {
      console.warn('⚠️ Push notification permission not granted.');
      return null;
    }

    let tokenError = null;

    // 1. On Android, try Native Device FCM Push Token first for direct Firebase messaging
    if (Platform.OS === 'android') {
      try {
        const deviceTokenData = await Notifications.getDevicePushTokenAsync();
        if (deviceTokenData?.data) {
          token = deviceTokenData.data;
          console.log('📲 [Native FCM Token Acquired]:', token);
        }
      } catch (fcmErr) {
        console.warn('Native device FCM token notice:', fcmErr?.message || fcmErr);
      }
    }

    // 2. Fall back to Expo Push Token if native FCM token was unavailable
    if (!token) {
      try {
        const projectId =
          Constants?.expoConfig?.extra?.eas?.projectId ||
          Constants?.easConfig?.projectId ||
          '13e7ebd2-672b-43dc-bb6a-654a22aedc6d';

        const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
        token = tokenData?.data;
      } catch (e1) {
        tokenError = e1?.message || String(e1);
        try {
          const tokenData = await Notifications.getExpoPushTokenAsync();
          token = tokenData?.data;
        } catch (e2) {
          tokenError = e2?.message || String(e2);
        }
      }
    }

    console.log('📲 [Device Push Token Acquired]:', token);

    // Sync token with backend user document via both routes
    if (token) {
      try {
        await api.patch('/auth/fcm-token', { token });
      } catch (e) {
        console.warn('Auth fcm-token sync error:', e?.message);
      }
      try {
        await api.post('/notifications/register-device', { fcmToken: token });
      } catch (e) {
        console.warn('Notifications register-device sync error:', e?.message);
      }
      console.log('✅ Push token synced with backend!');
      return { success: true, token };
    }

    return { success: false, error: tokenError || 'Unable to generate device token.' };
  } catch (error) {
    console.warn('Push notification registration warning:', error?.message || error);
    return { success: false, error: error?.message || String(error) };
  }
}
