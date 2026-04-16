import { io, type Socket } from 'socket.io-client';
import { getStoredTokens } from './auth';

let socket: Socket | null = null;

export function getChatSocket(): Socket | null {
  if (typeof window === 'undefined') return null;
  const tokens = getStoredTokens();
  if (!tokens?.accessToken) return null;

  if (socket && socket.connected) return socket;

  socket = io('/chat', {
    path: '/api/socket.io',
    transports: ['websocket'],
    auth: { token: tokens.accessToken },
  });

  return socket;
}

export function disconnectChatSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

