import * as Notifications from 'expo-notifications';
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

    // Retrieve Expo Push Token (using projectId from app.json)
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: '43008fda-616a-4bad-a04e-8d586b53cc4f',
    });

    token = tokenData?.data;
    console.log('📲 [Device Push Token Acquired]:', token);

    // Sync token with backend user document
    if (token) {
      await api.patch('/auth/fcm-token', { token });
      console.log('✅ Push token synced with backend!');
    }

    return token;
  } catch (error) {
    console.warn('Push notification registration warning:', error.message);
    return null;
  }
}
