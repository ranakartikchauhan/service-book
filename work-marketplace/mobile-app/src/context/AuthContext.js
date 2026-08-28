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
        }
      } catch {
        await AsyncStorage.removeItem('userToken');
      } finally {
        setLoading(false);
      }
    };
    initAuth();
  }, []);

  // Automatically register & sync push notification device token whenever a user is logged in
  useEffect(() => {
    if (user?._id) {
      registerForPushNotificationsAsync().catch((e) =>
        console.warn('Auto push registration warning:', e?.message || e)
      );
    }
  }, [user?._id]);

  const login = async ({ phone, email, password }) => {
    const { data } = await api.post('/auth/login', { phone, email, password });
    await AsyncStorage.setItem('userToken', data.data.token);
    setUser(data.data.user);
    return data.data.user;
  };

  const loginWithOtp = async ({ email, otp }) => {
    const { data } = await api.post('/auth/login-with-otp', { email, otp });
    await AsyncStorage.setItem('userToken', data.data.token);
    setUser(data.data.user);
    return data.data.user;
  };

  const register = async ({ name, phone, email, password, otp }) => {
    const { data } = await api.post('/auth/register', { name, phone, email, password, otp });
    await AsyncStorage.setItem('userToken', data.data.token);
    setUser(data.data.user);
    return data.data.user;
  };

  const logout = async () => {
    disconnectSocket();
    await AsyncStorage.removeItem('userToken');
    setUser(null);
  };

  const switchMode = async (mode) => {
    const { data } = await api.patch('/auth/switch-mode', { mode });
    setUser((prev) => ({ ...prev, currentMode: mode }));
    return data;
  };

  const updateUser = (updatedUserData) => {
    setUser((prev) => ({ ...prev, ...updatedUserData }));
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
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
