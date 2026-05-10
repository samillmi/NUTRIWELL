import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import useAuthStore from '../store/authStore';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { token, isAuthenticated } = useAuthStore();
  const socketRef = useRef(null);
  const [onlineUsers, setOnlineUsers] = useState([]);

  useEffect(() => {
    if (!isAuthenticated || !token) return;

    const socket = io(import.meta.env.VITE_WS_URL || 'http://localhost:5000', {
      auth:              { token },
      transports:        ['websocket'],
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    socketRef.current = socket;

    socket.on('online:users',  (users) => setOnlineUsers(users));
    socket.on('user:online',   ({ userId }) => setOnlineUsers((p) => [...new Set([...p, userId])]));
    socket.on('user:offline',  ({ userId }) => setOnlineUsers((p) => p.filter((id) => id !== userId)));
    socket.on('connect_error', (err) => console.error('[Socket] connect error:', err.message));

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [isAuthenticated, token]);

  return (
    <SocketContext.Provider value={{ socket: socketRef.current, onlineUsers }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
