import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Expo automatically loads EXPO_PUBLIC_* variables from .env
const API_BASE =
  process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000/api';

const api = axios.create({ baseURL: API_BASE, timeout: 15000 });

// Attach JWT token to every request
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('userToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auto-handle 401 (token expired/invalid)
api.interceptors.response.use(
  (res) => res,
  async (err) => {
    if (err.response?.status === 401) {
      await AsyncStorage.removeItem('userToken');
      // Navigation to login is handled by the AuthContext
    }
    return Promise.reject(err);
  }
);

export default api;
