import * as Location from 'expo-location';
import { Alert } from 'react-native';

/**
 * Universal robust location fetcher tailored for all Android devices (including Oppo, Vivo, Xiaomi, Samsung)
 */
export async function getDeviceLocation({ showAlert = true } = {}) {
  try {
    // 1. Check if device Location Services (GPS toggle) is switched ON
    const servicesEnabled = await Location.hasServicesEnabledAsync();
    if (!servicesEnabled) {
      if (showAlert) {
        Alert.alert(
          'Location (GPS) is Turned Off',
          'Please turn ON Location / GPS in your phone notification drawer or Settings to find jobs near you.'
        );
      }
      return null;
    }

    // 2. Check & request foreground permission
    let { status } = await Location.getForegroundPermissionsAsync();
    if (status !== 'granted') {
      const requestRes = await Location.requestForegroundPermissionsAsync();
      status = requestRes.status;
    }

    if (status !== 'granted') {
      if (showAlert) {
        Alert.alert(
          'Permission Required',
          'WorkMarket needs location permission to show nearby service jobs in your area.'
        );
      }
      return null;
    }

    // 3. Try fastest instant cached position first (prevents Oppo/Android GPS timeout)
    try {
      const lastKnown = await Location.getLastKnownPositionAsync({ maxAge: 60000 });
      if (lastKnown && lastKnown.coords) {
        return lastKnown.coords;
      }
    } catch {}

    // 4. Request current position with balanced accuracy & timeout
    const currentLoc = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
      timeInterval: 5000,
      distanceInterval: 10,
    });

    if (currentLoc && currentLoc.coords) {
      return currentLoc.coords;
    }

    return null;
  } catch (error) {
    console.warn('Location detection attempt 1 failed, trying fallback accuracy:', error.message);
    // 5. Fallback for strict battery-saver Android profiles (Oppo ColorOS)
    try {
      const fallbackLoc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Lowest,
      });
      return fallbackLoc?.coords || null;
    } catch (fallbackError) {
      console.error('All location attempts failed:', fallbackError.message);
      return null;
    }
  }
}

/**
 * Safe Reverse Geocoding with readable address formatting
 */
export async function getAddressFromCoords(latitude, longitude) {
  try {
    const reverse = await Location.reverseGeocodeAsync({ latitude, longitude });
    if (reverse && reverse[0]) {
      const item = reverse[0];
      const parts = [
        item.name !== item.street ? item.name : null,
        item.street,
        item.district || item.subregion,
        item.city,
        item.region,
        item.postalCode,
      ].filter(Boolean);

      return parts.join(', ');
    }
  } catch (err) {
    console.warn('Reverse geocoding failed:', err.message);
  }
  return '';
}
