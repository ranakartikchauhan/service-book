import { io } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';

const WS_URL = process.env.EXPO_PUBLIC_WS_URL || 'https://work-marketplace-ws.onrender.com';

let socket = null;

/**
 * Initialize and get the Socket.io client instance
 */
export const getSocket = async () => {
  if (socket && socket.connected) {
    return socket;
  }

  const token = await AsyncStorage.getItem('userToken');

  socket = io(WS_URL, {
    transports: ['websocket', 'polling'],
    auth: { token },
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 2000,
  });

  socket.on('connect', () => {
    console.log('⚡ [Socket Connected] ID:', socket.id);
  });

  socket.on('connect_error', (err) => {
    console.warn('⚠️ [Socket Connect Error]:', err.message);
  });

  socket.on('disconnect', (reason) => {
    console.log('🔌 [Socket Disconnected]:', reason);
  });

  return socket;
};

/**
 * Join a specific job room (for live chat & GPS tracking)
 */
export const joinJobRoom = async (jobId) => {
  const s = await getSocket();
  if (s) {
    s.emit('join:job', { jobId });
    console.log(`📌 Joined socket room: job:${jobId}`);
  }
};

/**
 * Leave a job room
 */
export const leaveJobRoom = async (jobId) => {
  const s = await getSocket();
  if (s) {
    s.emit('leave:job', { jobId });
  }
};

/**
 * Broadcast live worker GPS location during active job
 */
export const emitLocationUpdate = async ({ jobId, latitude, longitude }) => {
  const s = await getSocket();
  if (s && s.connected) {
    s.emit('worker:location_update', {
      jobId,
      location: { latitude, longitude },
      timestamp: new Date(),
    });
  }
};

/**
 * Disconnect socket on logout
 */
export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
