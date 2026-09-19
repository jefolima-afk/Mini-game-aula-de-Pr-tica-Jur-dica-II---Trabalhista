import { io, Socket } from 'socket.io-client';

import { OnlinePlayer, OnlineRoom, ChatMessage } from '../types';

let socket: Socket | null = null;

// URL do servidor multiplayer (ex.: https://seu-app.up.railway.app).
// Vazio = mesma origem (útil quando front e servidor rodam juntos).
export const API_URL: string = ((import.meta.env.VITE_API_URL as string | undefined) || '').replace(/\/+$/, '');

export function getSocket(): Socket {
  if (!socket) {
    socket = io(API_URL || undefined, {
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 15,
      reconnectionDelay: 800,
      transports: ['polling', 'websocket'],
    });
  }

  return socket;
}

// Identificador anônimo do jogador neste navegador/aba.
// É enviado ao servidor ao criar/entrar em uma sala e serve para o jogador
// recuperar a PRÓPRIA vaga se a conexão cair ou a página for recarregada,
// sem que outro aluno consiga assumir a vez dele apenas digitando o mesmo nome.
// (sessionStorage = uma identidade por aba; abas diferentes não se confundem.)
let memoryToken: string | null = null;

export function getPlayerToken(): string {
  const generate = () =>
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;

  try {
    let token = sessionStorage.getItem('mj_player_token');
    if (!token) {
      token = generate();
      sessionStorage.setItem('mj_player_token', token);
    }
    return token;
  } catch {
    if (!memoryToken) memoryToken = generate();
    return memoryToken;
  }
}

export type { OnlinePlayer, OnlineRoom, ChatMessage };
