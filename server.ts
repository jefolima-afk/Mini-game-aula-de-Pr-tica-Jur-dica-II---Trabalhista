import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import fileUpload from 'express-fileupload';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());
app.use(fileUpload({
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
}));

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

interface Player {
  id: string;
  name: string;
  avatar: string;
  position: number;
  score: number;
  skipTurns: number;
  isBankrupt: boolean;
  history: string[];
  socketId: string;
}

interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: string;
}

interface Room {
  id: string;
  code: string;
  hostId: string;
  players: Player[];
  currentPlayerIndex: number;
  status: 'waiting' | 'playing' | 'finished';
  logs: Array<{ id: string; text: string; timestamp: string; type: string }>;
  messages: ChatMessage[];
  lastRoll?: number;
  currentEvent?: any;
}

const rooms: Record<string, Room> = {};

// Gerar código único de sala (4 letras/números)
function generateRoomCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

io.on('connection', (socket) => {
  console.log('Cliente conectado:', socket.id);

  socket.on('create-room', ({ playerName, avatar }, callback) => {
    const roomCode = generateRoomCode();
    const player: Player = {
      id: socket.id,
      name: playerName || 'Jogador 1',
      avatar: avatar || '⚖️',
      position: 0,
      score: 0,
      skipTurns: 0,
      isBankrupt: false,
      history: [],
      socketId: socket.id
    };

    rooms[roomCode] = {
      id: roomCode,
      code: roomCode,
      hostId: socket.id,
      players: [player],
      currentPlayerIndex: 0,
      status: 'waiting',
      logs: [{
        id: Date.now().toString(),
        text: `Sala criada por ${player.name}. Código: ${roomCode}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        type: 'system'
      }],
      messages: []
    };

    socket.join(roomCode);
    callback({ success: true, roomCode, player });
    io.to(roomCode).emit('room-updated', rooms[roomCode]);
  });

  socket.on('join-room', ({ roomCode, playerName, avatar }, callback) => {
    const code = roomCode?.toUpperCase();
    const room = rooms[code];

    if (!room) {
      return callback({ success: false, message: 'Sala não encontrada.' });
    }

    if (room.status !== 'waiting') {
      return callback({ success: false, message: 'A partida já iniciou nessa sala.' });
    }

    if (room.players.length >= 6) {
      return callback({ success: false, message: 'A sala está cheia (máx 6 jogadores).' });
    }

    const player: Player = {
      id: socket.id,
      name: playerName || `Jogador ${room.players.length + 1}`,
      avatar: avatar || '⚖️',
      position: 0,
      score: 0,
      skipTurns: 0,
      isBankrupt: false,
      history: [],
      socketId: socket.id
    };

    room.players.push(player);
    room.logs.push({
      id: Date.now().toString(),
      text: `${player.name} entrou na sala.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type: 'system'
    });

    socket.join(code);
    callback({ success: true, roomCode: code, player });
    io.to(code).emit('room-updated', room);
  });

  socket.on('start-game', ({ roomCode }) => {
    const room = rooms[roomCode];
    if (room && room.hostId === socket.id) {
      room.status = 'playing';
      room.logs.push({
        id: Date.now().toString(),
        text: `O jogo foi iniciado!`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        type: 'system'
      });
      io.to(roomCode).emit('room-updated', room);
    }
  });

  socket.on('roll-dice', ({ roomCode, diceValue, eventTile }) => {
    const room = rooms[roomCode];
    if (!room) return;

    const currentPlayer = room.players[room.currentPlayerIndex];
    if (currentPlayer.id !== socket.id) return; // Validação de turno

    room.lastRoll = diceValue;
    
    // Atualiza posição
    const oldPos = currentPlayer.position;
    let newPos = oldPos + diceValue;
    if (newPos >= 30) newPos = 30; // Max tiles
    
    currentPlayer.position = newPos;
    room.currentEvent = eventTile || null;

    room.logs.push({
      id: Date.now().toString(),
      text: `${currentPlayer.name} tirou ${diceValue} e tirou a casa ${newPos}.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type: 'action'
    });

    io.to(roomCode).emit('room-updated', room);
  });

  socket.on('submit-answer', ({ roomCode, selectedOptionIndex, isCorrect, points, eventDescription }) => {
    const room = rooms[roomCode];
    if (!room) return;

    const currentPlayer = room.players[room.currentPlayerIndex];
    
    // VALIDAÇÃO DE SEGURANÇA: Garante que apenas o jogador da vez pode confirmar/responder
    if (currentPlayer.id !== socket.id) {
      return;
    }

    if (isCorrect) {
      currentPlayer.score += points;
      room.logs.push({
        id: Date.now().toString(),
        text: `${currentPlayer.name} acertou a questão e ganhou +$${points}!`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        type: 'success'
      });
    } else {
      currentPlayer.score -= points;
      room.logs.push({
        id: Date.now().toString(),
        text: `${currentPlayer.name} errou a questão e perdeu -$${points}.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        type: 'error'
      });
    }

    // Passa a vez para o próximo jogador ativo
    room.currentEvent = null;
    let nextIndex = (room.currentPlayerIndex + 1) % room.players.length;
    
    // Verifica falência ou pulo de turno se houver
    room.currentPlayerIndex = nextIndex;

    io.to(roomCode).emit('room-updated', room);
  });

  socket.on('send-message', ({ roomCode, text }) => {
    const room = rooms[roomCode];
    if (!room) return;

    const player = room.players.find(p => p.id === socket.id);
    if (!player) return;

    const message: ChatMessage = {
      id: Date.now().toString(),
      senderId: player.id,
      senderName: player.name,
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    room.messages.push(message);
    io.to(roomCode).emit('new-message', message);
  });

  socket.on('disconnect', () => {
    console.log('Cliente desconectado:', socket.id);
    for (const code in rooms) {
      const room = rooms[code];
      const playerIndex = room.players.findIndex(p => p.id === socket.id);
      if (playerIndex !== -1) {
        const removedPlayer = room.players.splice(playerIndex, 1)[0];
        room.logs.push({
          id: Date.now().toString(),
          text: `${removedPlayer.name} desconectou.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          type: 'system'
        });

        if (room.players.length === 0) {
          delete rooms[code];
        } else {
          if (room.currentPlayerIndex >= room.players.length) {
            room.currentPlayerIndex = 0;
          }
          if (room.hostId === socket.id) {
            room.hostId = room.players[0].id;
          }
          io.to(code).emit('room-updated', room);
        }
        break;
      }
    }
  });
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
