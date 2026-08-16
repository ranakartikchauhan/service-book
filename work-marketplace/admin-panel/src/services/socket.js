import { io } from 'socket.io-client';

const WS_URL = import.meta.env.VITE_WS_URL || 'https://work-marketplace-ws.onrender.com';

let socket = null;

export const getAdminSocket = () => {
  if (socket && socket.connected) {
    return socket;
  }

  const token = localStorage.getItem('adminToken');

  socket = io(WS_URL, {
    transports: ['websocket', 'polling'],
    auth: { token, role: 'admin' },
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 2000,
  });

  socket.on('connect', () => {
    console.log('⚡ [Admin Panel Connected to WebSocket Gateway] ID:', socket.id);
    socket.emit('join:admin');
  });

  socket.on('connect_error', (err) => {
    console.warn('⚠️ [Admin WebSocket Error]:', err.message);
  });

  return socket;
};
