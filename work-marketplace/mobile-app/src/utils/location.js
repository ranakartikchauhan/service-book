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
          'Please turn ON Location / GPS in your phone notification drawer or Settings to share your home location.'
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
          'WorkMarket needs location permission to detect your home address for jobs.'
        );
      }
      return null;
    }

    // 3. Try fastest instant cached position first (prevents Oppo/Android GPS timeout)
    try {
      const lastKnown = await Location.getLastKnownPositionAsync({ maxAge: 120000 });
      if (lastKnown && lastKnown.coords) {
        return lastKnown.coords;
      }
    } catch {}

    // 4. Request current position with balanced accuracy & fallback
    try {
      const currentLoc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
        timeInterval: 3000,
      });

      if (currentLoc && currentLoc.coords) {
        return currentLoc.coords;
      }
    } catch (e) {
      console.warn('Balanced accuracy failed, trying lowest:', e.message);
    }

    // 5. Fallback for strict battery-saver Android profiles (Oppo ColorOS)
    const fallbackLoc = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Lowest,
    });
    return fallbackLoc?.coords || null;
  } catch (error) {
    console.error('All location attempts failed:', error.message);
    return null;
  }
}

/**
 * Safe Reverse Geocoding with Google Geocoder + OpenStreetMap Fallback
 */
export async function getAddressFromCoords(latitude, longitude) {
  // Try Native Expo Reverse Geocoder first
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

      if (parts.length > 0) {
        return parts.join(', ');
      }
    }
  } catch (err) {
    console.warn('Native reverse geocode failed, falling back to OSM:', err.message);
  }

  // Fallback to OpenStreetMap Reverse Geocoding (100% reliable worldwide)
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
      {
        headers: {
          'User-Agent': 'WorkMarket-MobileApp/1.0',
          'Accept-Language': 'en',
        },
      }
    );
    const data = await response.json();
    if (data && data.display_name) {
      // Return concise address
      const addr = data.address || {};
      const components = [
        addr.road || addr.suburb || addr.neighbourhood,
        addr.city || addr.town || addr.county,
        addr.state,
        addr.postcode,
      ].filter(Boolean);

      return components.length > 0 ? components.join(', ') : data.display_name;
    }
  } catch (osmErr) {
    console.warn('OSM reverse geocode error:', osmErr.message);
  }

  return `Location (${latitude.toFixed(4)}°, ${longitude.toFixed(4)}°)`;
}

/**
 * Safe Forward Geocoding (Address text to Coordinates)
 */
export async function getCoordsFromAddress(addressText) {
  if (!addressText || !addressText.trim()) return null;

  // 1. Try Native Geocoder
  try {
    const geocoded = await Location.geocodeAsync(addressText.trim());
    if (geocoded && geocoded[0]) {
      return {
        longitude: geocoded[0].longitude,
        latitude: geocoded[0].latitude,
      };
    }
  } catch (err) {
    console.warn('Native geocode failed, trying OSM fallback:', err.message);
  }

  // 2. Fallback to OpenStreetMap Geocoder
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        addressText.trim()
      )}&limit=1`,
      {
        headers: {
          'User-Agent': 'WorkMarket-MobileApp/1.0',
          'Accept-Language': 'en',
        },
      }
    );
    const data = await response.json();
    if (data && data[0]) {
      return {
        longitude: parseFloat(data[0].lon),
        latitude: parseFloat(data[0].lat),
      };
    }
  } catch (osmErr) {
    console.warn('OSM forward geocode error:', osmErr.message);
  }

  return null;
}

/**
 * Search locations and addresses worldwide with auto-suggestions
 */
export async function searchLocations(query) {
  if (!query || query.trim().length < 2) return [];
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        query.trim()
      )}&limit=5&addressdetails=1`,
      {
        headers: {
          'User-Agent': 'WorkMarket-MobileApp/1.0',
          'Accept-Language': 'en',
        },
      }
    );
    const data = await response.json();
    return (data || []).map((item) => ({
      placeId: item.place_id,
      title: item.display_name.split(',')[0],
      subtitle: item.display_name.split(',').slice(1).join(',').trim(),
      latitude: parseFloat(item.lat),
      longitude: parseFloat(item.lon),
    }));
  } catch (err) {
    console.warn('Location search error:', err.message);
    return [];
  }
}
