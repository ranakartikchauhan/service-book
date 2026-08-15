import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE = 'http://localhost:5000/api'; // Change to your server IP for device testing
// const API_BASE = 'http://192.168.x.x:5000/api'; // Use your machine's LAN IP for physical device

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
