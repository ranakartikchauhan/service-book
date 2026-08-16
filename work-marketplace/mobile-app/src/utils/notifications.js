import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import api from '../api/client';

// Configure foreground notification presentation
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Register device for push notifications and sync token with backend
 */
export async function registerForPushNotificationsAsync() {
  let token = null;

  try {
    // Set up Android notification channel
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'WorkMarket Alerts',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#6366F1',
        sound: 'default',
      });
    }

    // Check device permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.warn('⚠️ Push notification permission not granted.');
      return null;
    }

    // Retrieve Expo Push Token with multiple fallbacks
    try {
      const projectId =
        Constants?.expoConfig?.extra?.eas?.projectId ||
        Constants?.easConfig?.projectId ||
        '43008fda-616a-4bad-a04e-8d586b53cc4f';

      const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
      token = tokenData?.data;
    } catch (e1) {
      try {
        const tokenData = await Notifications.getExpoPushTokenAsync();
        token = tokenData?.data;
      } catch (e2) {
        console.warn('Expo push token fallback notice:', e2?.message || e2);
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
    }

    return token;
  } catch (error) {
    console.warn('Push notification registration warning:', error?.message || error);
    return null;
  }
}
