import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../api/client';
import { registerForPushNotificationsAsync } from '../utils/notifications';
import { disconnectSocket } from '../api/socket';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // true while checking stored token

  useEffect(() => {
    // On app start, check if there's a stored token and fetch the current user
    const initAuth = async () => {
      try {
        const token = await AsyncStorage.getItem('userToken');
        if (token) {
          const { data } = await api.get('/auth/me');
          setUser(data.data.user);
          // Register push notifications
          registerForPushNotificationsAsync();
        }
      } catch {
        await AsyncStorage.removeItem('userToken');
      } finally {
        setLoading(false);
      }
    };
    initAuth();
  }, []);

  const login = async ({ phone, email, password }) => {
    const { data } = await api.post('/auth/login', { phone, email, password });
    await AsyncStorage.setItem('userToken', data.data.token);
    setUser(data.data.user);
    registerForPushNotificationsAsync();
    return data.data.user;
  };

  const loginWithOtp = async ({ email, otp }) => {
    const { data } = await api.post('/auth/login-with-otp', { email, otp });
    await AsyncStorage.setItem('userToken', data.data.token);
    setUser(data.data.user);
    registerForPushNotificationsAsync();
    return data.data.user;
  };

  const register = async ({ name, phone, email, password, otp }) => {
    const { data } = await api.post('/auth/register', { name, phone, email, password, otp });
    await AsyncStorage.setItem('userToken', data.data.token);
    setUser(data.data.user);
    registerForPushNotificationsAsync();
    return data.data.user;
  };

  const logout = async () => {
    disconnectSocket();
    await AsyncStorage.removeItem('userToken');
    setUser(null);
  };

  const switchMode = async (mode) => {
    await api.patch('/auth/switch-mode', { mode });
    setUser((u) => ({ ...u, currentMode: mode }));
  };

  const refreshUser = async () => {
    const { data } = await api.get('/auth/me');
    setUser(data.data.user);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        loginWithOtp,
        register,
        logout,
        switchMode,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
