import { io, Socket } from 'socket.io-client';
import { OnlinePlayer, OnlineRoom, ChatMessage } from '../types';

let socket: Socket | null = null;

export function getSocket(): Socket {
socket = io(import.meta.env.VITE_API_URL, {
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 1000,
  transports: ['websocket', 'polling'],
});
  }
  return socket;
}

export type { OnlinePlayer, OnlineRoom, ChatMessage };
