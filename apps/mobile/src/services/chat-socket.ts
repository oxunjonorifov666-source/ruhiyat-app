import { io, Socket } from 'socket.io-client';
import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL, TOKEN_KEYS } from '../config';

let socket: Socket | null = null;
let connecting: Promise<Socket> | null = null;

function getSocketBaseUrl() {
  // API_BASE_URL is like http://host:port/api -> socket lives at http://host:port with namespace /chat
  return API_BASE_URL.replace(/\/api\/?$/, '');
}

export async function getChatSocket(): Promise<Socket> {
  if (socket?.connected) return socket;
  if (connecting) return connecting;

  connecting = (async () => {
    const token = await SecureStore.getItemAsync(TOKEN_KEYS.ACCESS_TOKEN);
    if (!token) {
      throw new Error('Sessiya tugadi');
    }

    const s = io(`${getSocketBaseUrl()}/chat`, {
      transports: ['websocket'],
      auth: { token },
      reconnection: true,
      reconnectionAttempts: 8,
      reconnectionDelay: 500,
      timeout: 10000,
    });

    await new Promise<void>((resolve, reject) => {
      const onConnect = () => { cleanup(); resolve(); };
      const onError = (err: any) => { cleanup(); reject(err instanceof Error ? err : new Error('Socket error')); };
      const cleanup = () => {
        s.off('connect', onConnect);
        s.off('connect_error', onError);
      };
      s.on('connect', onConnect);
      s.on('connect_error', onError);
    });

    socket = s;
    connecting = null;
    return s;
  })();

  return connecting;
}

export function disconnectChatSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
  connecting = null;
}

