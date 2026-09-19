import express from 'express';
import http from 'http';
import path from 'path';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { createServer as createViteServer } from 'vite';

const PORT = 3000;
const app = express();
const server = http.createServer(app);

// Initialize Socket.io with permissive CORS for container preview iframe
const io = new SocketIOServer(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

app.use(express.json());

// In-Memory Room Management
export interface OnlinePlayer {
  id: string;
  socketId: string;
  name: string;
  avatar: string;
  color: string;
  accentColor: string;
  role: string;
  isHost: boolean;
  points: number;
  reputation: number;
  position: number;
  isFinished: boolean;
  finishRank?: number;
  skipNextTurn?: boolean;
  questionsAnsweredCount: number;
  correctAnswersCount: number;
  bonusCount: number;
  achievements: string[];
}

export interface ChatMessage {
  id: string;
  playerId: string;
  playerName: string;
  playerAvatar: string;
  playerColor: string;
  text: string;
  timestamp: string;
  isSystem?: boolean;
}

export interface ActiveQuestionAnswer {
  playerId: string;
  playerName: string;
  playerAvatar?: string;
  playerColor?: string;
  selectedOptionId: string;
  selectedOptionText: string;
  isCorrect: boolean;
  pointsEarned: number;
  explanation?: string;
  legalBasis?: string;
}

export interface OnlineRoom {
  roomId: string;
  roomName: string;
  hostSocketId: string;
  phase: 'lobby' | 'playing' | 'spinning' | 'moving' | 'event' | 'game_over';
  players: OnlinePlayer[];
  activePlayerIndex: number;
  round: number;
  logs: any[];
  chatMessages: ChatMessage[];
  currentEvent: any | null;
  currentEventTile: any | null;
  isEventModalOpen: boolean;
  activeQuestionAnswer?: ActiveQuestionAnswer | null;
  spinningNumber: number | null;
  ceremonyStep?: string;
  bottomRevealedCount?: number;
  areFinalistsRevealed?: boolean;
  createdAt: number;
}

const rooms = new Map<string, OnlineRoom>();

const FINISH_TILE_ID = 35;
const MAX_ROULETTE_STEPS = 8; // a roleta tem 8 casas (1 a 8)

// Tokens de reconexão: ficam SOMENTE no servidor (nunca dentro do objeto da sala,
// que é enviado a todos os jogadores em 'room:updated').
// chave: `${roomId}:${token}` -> playerId
const reconnectTokens = new Map<string, string>();

// Somente o socket do jogador da vez pode jogar a rodada dele.
function isActivePlayerSocket(room: OnlineRoom, socketId: string): boolean {
  const active = room.players[room.activePlayerIndex];
  return !!active && active.socketId === socketId;
}

function isSocketConnected(socketId: string): boolean {
  return io.sockets.sockets.has(socketId);
}

// Generate friendly 6-char Room Code (e.g. CLT-842)
function generateRoomCode(): string {
  const letters = ['CLT', 'TST', 'OAB', 'JUR', 'LEX', 'JUS'];
  const prefix = letters[Math.floor(Math.random() * letters.length)];
  const num = Math.floor(100 + Math.random() * 900);
  const code = `${prefix}-${num}`;
  if (rooms.has(code)) {
    return generateRoomCode();
  }
  return code;
}

// REST Endpoints
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

app.get('/api/rooms', (req, res) => {
  const publicRooms = Array.from(rooms.values()).map((r) => ({
    roomId: r.roomId,
    roomName: r.roomName,
    playerCount: r.players.length,
    phase: r.phase,
    createdAt: r.createdAt,
  }));
  res.json({ rooms: publicRooms });
});

app.get('/api/rooms/:roomId', (req, res) => {
  const room = rooms.get(req.params.roomId.toUpperCase());
  if (!room) {
    return res.status(404).json({ error: 'Sala não encontrada' });
  }
  return res.json({
    roomId: room.roomId,
    roomName: room.roomName,
    playerCount: room.players.length,
    phase: room.phase,
  });
});

// Socket.io Real-Time Synchronization
io.on('connection', (socket: Socket) => {
  let currentRoomId: string | null = null;
  let currentPlayerId: string | null = null;

  // 1. Create a new Online Room
  socket.on('room:create', ({ roomName, playerName, avatar, color, role, playerToken }, callback) => {
    const roomId = generateRoomCode();
    const playerId = `player-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

    const hostPlayer: OnlinePlayer = {
      id: playerId,
      socketId: socket.id,
      name: playerName.trim() || 'Professor(a) Jurista',
      avatar: avatar || '⚖️',
      color: color || '#F59E0B',
      accentColor: '#FBBF24',
      role: role || 'Coordenador(a) / Host',
      isHost: true,
      points: 0,
      reputation: 100,
      position: 1,
      isFinished: false,
      questionsAnsweredCount: 0,
      correctAnswersCount: 0,
      bonusCount: 0,
      achievements: ['Host da Sala'],
    };

    const newRoom: OnlineRoom = {
      roomId,
      roomName: roomName.trim() || `Turma de Prática Trabalhista (${roomId})`,
      hostSocketId: socket.id,
      phase: 'lobby',
      players: [hostPlayer],
      activePlayerIndex: 0,
      round: 1,
      logs: [
        {
          id: `log-${Date.now()}`,
          playerId: 'system',
          playerName: 'Sistema CESURG',
          playerColor: '#F59E0B',
          text: `Sala ${roomId} criada por ${hostPlayer.name}. Aguardando alunos conectarem!`,
          type: 'event',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ],
      chatMessages: [
        {
          id: `msg-${Date.now()}`,
          playerId: 'system',
          playerName: 'CESURG Direito',
          playerAvatar: '⚖️',
          playerColor: '#F59E0B',
          text: `Bem-vindos à sala ${roomId}! Compartilhe o código para seus colegas entrarem.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isSystem: true,
        },
      ],
      currentEvent: null,
      currentEventTile: null,
      isEventModalOpen: false,
      activeQuestionAnswer: null,
      spinningNumber: null,
      createdAt: Date.now(),
    };

    rooms.set(roomId, newRoom);
    if (playerToken) reconnectTokens.set(`${roomId}:${playerToken}`, playerId);
    currentRoomId = roomId;
    currentPlayerId = playerId;

    socket.join(roomId);

    if (callback) {
      callback({ ok: true, roomId, player: hostPlayer, room: newRoom });
    }
    io.to(roomId).emit('room:updated', newRoom);
  });

  // 2. Join an existing Online Room
  socket.on('room:join', ({ roomId, playerName, avatar, color, role, playerToken }, callback) => {
    const targetRoomId = (roomId || '').trim().toUpperCase();
    const room = rooms.get(targetRoomId);

    if (!room) {
      if (callback) callback({ ok: false, error: 'Código de sala inválido ou sala não encontrada.' });
      return;
    }

    const cleanName = (playerName || '').trim();
    const tokenKey = playerToken ? `${targetRoomId}:${playerToken}` : null;

    // RECONEXÃO SEGURA (só depois que a partida começou).
    // 1) Por token (guardado no navegador do próprio jogador): é a forma confiável.
    // 2) Por nome: só vale se a vaga estiver DESCONECTADA. Assim, ninguém consegue
    //    "assumir" a vez de um colega que está online apenas digitando o mesmo nome.
    let existing: OnlinePlayer | undefined;
    if (room.phase !== 'lobby') {
      const tokenPlayerId = tokenKey ? reconnectTokens.get(tokenKey) : undefined;
      if (tokenPlayerId) {
        existing = room.players.find((p) => p.id === tokenPlayerId);
      }
      if (!existing && cleanName) {
        existing = room.players.find(
          (p) =>
            p.name.toLowerCase() === cleanName.toLowerCase() &&
            (p.socketId === socket.id || !isSocketConnected(p.socketId))
        );
      }
    }

    let joinedPlayer: OnlinePlayer;

    if (existing) {
      existing.socketId = socket.id;
      if (existing.isHost) room.hostSocketId = socket.id;
      joinedPlayer = existing;
    } else {
      if (room.players.length >= 12) {
        if (callback) callback({ ok: false, error: 'A sala já atingiu o limite máximo de 12 juristas.' });
        return;
      }

      if (
        room.phase !== 'lobby' &&
        cleanName &&
        room.players.some((p) => p.name.toLowerCase() === cleanName.toLowerCase())
      ) {
        if (callback) callback({ ok: false, error: 'Já existe um jogador conectado com esse nome nesta partida. Use outro nome.' });
        return;
      }

      const playerId = `player-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      joinedPlayer = {
        id: playerId,
        socketId: socket.id,
        name: cleanName || `Aluno ${room.players.length + 1}`,
        avatar: avatar || '💼',
        color: color || '#3B82F6',
        accentColor: '#60A5FA',
        role: role || 'Estudante de Direito',
        isHost: false,
        points: 0,
        reputation: 100,
        position: 1,
        isFinished: false,
        questionsAnsweredCount: 0,
        correctAnswersCount: 0,
        bonusCount: 0,
        achievements: [],
      };
      room.players.push(joinedPlayer);
    }

    if (tokenKey) reconnectTokens.set(tokenKey, joinedPlayer.id);

    currentRoomId = targetRoomId;
    currentPlayerId = joinedPlayer.id;

    socket.join(targetRoomId);

    // Add log and chat
    room.chatMessages.push({
      id: `msg-${Date.now()}`,
      playerId: 'system',
      playerName: 'Sistema',
      playerAvatar: '🔔',
      playerColor: '#10B981',
      text: `${joinedPlayer.name} ingressou na sala!`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isSystem: true,
    });

    if (callback) {
      callback({ ok: true, roomId: targetRoomId, player: joinedPlayer, room });
    }
    io.to(targetRoomId).emit('room:updated', room);
  });

  // 3. Start Game (Host only)
  socket.on('room:start_game', ({ roomId }, callback) => {
    const room = rooms.get(roomId);
    if (!room) return;

    if (socket.id !== room.hostSocketId) {
      if (callback) callback({ ok: false, error: 'Apenas o anfitrião pode iniciar a partida.' });
      return;
    }

    if (room.players.length < 2) {
      if (callback) callback({ ok: false, error: 'É necessário pelo menos 2 juristas para iniciar a partida online.' });
      return;
    }

    room.phase = 'playing';
    room.activePlayerIndex = 0;
    room.round = 1;
    // reset player positions to start tile
    room.players.forEach((p) => {
      p.position = 1;
      p.points = 0;
      p.reputation = 100;
      p.isFinished = false;
      p.finishRank = undefined;
      p.skipNextTurn = false;
      p.questionsAnsweredCount = 0;
      p.correctAnswersCount = 0;
      p.bonusCount = 0;
    });

    room.logs.unshift({
      id: `log-${Date.now()}`,
      playerId: 'system',
      playerName: 'CESURG',
      playerColor: '#F59E0B',
      text: `Partida iniciada com ${room.players.length} juristas! Turno de ${room.players[0].name}.`,
      type: 'event',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    });

    if (callback) callback({ ok: true });
    io.to(roomId).emit('room:updated', room);
  });

  // 4. Roulette Spin Action
  socket.on('game:spin_roulette', ({ roomId, steps, eventData, eventTile }) => {
    if (roomId !== currentRoomId) return;
    const room = rooms.get(roomId);
    if (!room || room.phase !== 'playing') return;

    // Somente o jogador da vez pode girar a roleta.
    if (!isActivePlayerSocket(room, socket.id)) {
      console.warn(`[Multiplayer Security] Ignored game:spin_roulette from non-active socket ${socket.id}`);
      return;
    }

    const activePlayer = room.players[room.activePlayerIndex];

    const stepsNumber = Number(steps);
    if (!Number.isInteger(stepsNumber) || stepsNumber < 1 || stepsNumber > MAX_ROULETTE_STEPS) return;

    // A posição de destino é calculada pelo servidor (não confiamos no valor enviado pelo cliente).
    const targetPosition = Math.min((activePlayer.position || 1) + stepsNumber, FINISH_TILE_ID);

    room.spinningNumber = stepsNumber;
    room.phase = 'spinning';

    // Broadcast spin animation immediately
    io.to(roomId).emit('game:roulette_spun', {
      steps: stepsNumber,
      playerId: activePlayer.id,
      playerName: activePlayer.name,
    });

    room.logs.unshift({
      id: `log-${Date.now()}`,
      playerId: activePlayer.id,
      playerName: activePlayer.name,
      playerColor: activePlayer.color,
      text: `Girou a roleta e tirou o número ${stepsNumber}!`,
      type: 'spin',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    });

    // Update player position and prepare event
    setTimeout(() => {
      activePlayer.position = targetPosition;
      room.phase = 'event';
      room.currentEvent = eventData;
      room.currentEventTile = eventTile;
      room.isEventModalOpen = true;
      room.activeQuestionAnswer = null;

      io.to(roomId).emit('room:updated', room);
    }, 1800);
  });

  // 5. Submit Question Answer (Strict Multiplayer Validation)
  socket.on('game:answer_question', ({ roomId, optionId, optionText, isCorrect, pointsEarned, penalty, explanation, legalBasis }) => {
    if (roomId !== currentRoomId) return;
    const room = rooms.get(roomId);
    if (!room || !room.isEventModalOpen) return;

    const activePlayer = room.players[room.activePlayerIndex];
    if (!activePlayer) return;

    // MULTIPLAYER SECURITY VALIDATION:
    // Only the active player corresponding to activePlayerIndex can answer.
    // If sent by any other socket, reject immediately and do not alter match state.
    if (!isActivePlayerSocket(room, socket.id)) {
      console.warn(`[Multiplayer Security] Ignored game:answer_question from unauthorized socket ${socket.id} (active player is ${activePlayer.name} [${activePlayer.id}])`);
      return;
    }

    // Prevent duplicate answers if already answered
    if (room.activeQuestionAnswer) {
      console.warn(`[Multiplayer Security] Ignored duplicate answer attempt in room ${roomId}`);
      return;
    }

    // Resolve question and option data
    const question = room.currentEvent?.question;
    const matchedOption = question?.options?.find((opt: any) => opt.id === optionId || opt.text === optionId || opt.text === optionText);

    const correct = matchedOption ? !!matchedOption.isCorrect : !!isCorrect;
    const points = matchedOption ? (question?.pointsReward || pointsEarned || 20) : (pointsEarned || 20);
    const chosenText = matchedOption ? matchedOption.text : (optionText || optionId || '');
    const chosenId = matchedOption ? matchedOption.id : (optionId || '');
    const expl = matchedOption?.explanation || explanation || question?.explanation || '';
    const basis = matchedOption?.legalBasis || legalBasis || room.currentEvent?.legalContext || 'CLT/CF/88';

    activePlayer.questionsAnsweredCount = (activePlayer.questionsAnsweredCount || 0) + 1;
    if (correct) {
      activePlayer.correctAnswersCount = (activePlayer.correctAnswersCount || 0) + 1;
      activePlayer.points += points;
      activePlayer.reputation = Math.min(100, activePlayer.reputation + 5);
      room.logs.unshift({
        id: `log-${Date.now()}`,
        playerId: activePlayer.id,
        playerName: activePlayer.name,
        playerColor: activePlayer.color,
        text: `Acertou a questão! Escolheu "${chosenText.slice(0, 40)}..." e ganhou +${points} pontos. Fundamento: ${basis}`,
        type: 'event',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      });
    } else {
      if (penalty) {
        activePlayer.points = Math.max(0, activePlayer.points - penalty);
      }
      room.logs.unshift({
        id: `log-${Date.now()}`,
        playerId: activePlayer.id,
        playerName: activePlayer.name,
        playerColor: activePlayer.color,
        text: `Errou a questão ao escolher "${chosenText.slice(0, 40)}...". ${expl ? `Explicação: ${expl}` : ''}`,
        type: 'event',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      });
    }

    // Store active question answer state so all players see the result
    const questionAnswer: ActiveQuestionAnswer = {
      playerId: activePlayer.id,
      playerName: activePlayer.name,
      playerAvatar: activePlayer.avatar,
      playerColor: activePlayer.color,
      selectedOptionId: chosenId,
      selectedOptionText: chosenText,
      isCorrect: correct,
      pointsEarned: correct ? points : 0,
      explanation: expl,
      legalBasis: basis,
    };

    room.activeQuestionAnswer = questionAnswer;

    // Broadcast answer event and updated room to all players
    io.to(roomId).emit('game:question_answered', questionAnswer);
    io.to(roomId).emit('room:updated', room);
  });

  // 6. Bonus Tile Choice Action
  socket.on('game:bonus_action', ({ roomId, bonusType, points, moveSteps, reputation, headline }) => {
    if (roomId !== currentRoomId) return;
    const room = rooms.get(roomId);
    if (!room) return;

    const activePlayer = room.players[room.activePlayerIndex];
    if (!activePlayer) return;

    // Security: Only active player can choose bonus action
    if (!isActivePlayerSocket(room, socket.id)) return;

    activePlayer.bonusCount = (activePlayer.bonusCount || 0) + 1;
    if (points) activePlayer.points += points;
    if (reputation) activePlayer.reputation = Math.min(100, activePlayer.reputation + reputation);
    if (moveSteps) {
      activePlayer.position = Math.min(35, activePlayer.position + moveSteps);
    }

    room.logs.unshift({
      id: `log-${Date.now()}`,
      playerId: activePlayer.id,
      playerName: activePlayer.name,
      playerColor: activePlayer.color,
      text: `Contemplado(a) com a Casa Bônus: ${headline}! (${points ? `+${points} pts` : ''}${moveSteps ? ` +${moveSteps} casas` : ''})`,
      type: 'event',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    });

    io.to(roomId).emit('room:updated', room);
  });

  // 7. Finish Tile Reached
  socket.on('game:player_finished', ({ roomId }) => {
    if (roomId !== currentRoomId) return;
    const room = rooms.get(roomId);
    if (!room) return;

    const activePlayer = room.players[room.activePlayerIndex];
    if (!activePlayer) return;

    // Segurança: só o jogador da vez (ou o anfitrião, ao avançar o turno) pode registrar a chegada.
    if (!isActivePlayerSocket(room, socket.id) && socket.id !== room.hostSocketId) return;

    // O servidor decide se o jogador realmente chegou e qual é a colocação/bônus.
    if (activePlayer.isFinished || (activePlayer.position || 1) < FINISH_TILE_ID) return;

    const rank = room.players.filter((p) => p.isFinished).length + 1;
    const bonusPoints = 20;

    activePlayer.isFinished = true;
    activePlayer.finishRank = rank;
    activePlayer.position = FINISH_TILE_ID;
    activePlayer.points += bonusPoints;

    room.logs.unshift({
      id: `log-${Date.now()}`,
      playerId: activePlayer.id,
      playerName: activePlayer.name,
      playerColor: activePlayer.color,
      text: `🏁 Chegou na Linha de Chegada em ${rank}º Lugar! Bônus de chegada: +${bonusPoints} pts`,
      type: 'finish',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    });

    io.to(roomId).emit('room:updated', room);
  });

  // 8. Close Event and Advance Turn
  socket.on('game:close_event', ({ roomId }) => {
    if (roomId !== currentRoomId) return;
    const room = rooms.get(roomId);
    if (!room) return;

    // Evita avançar o turno duas vezes (ex.: jogador da vez e anfitrião clicando ao mesmo tempo).
    if (!room.isEventModalOpen) return;

    const activePlayer = room.players[room.activePlayerIndex];
    // Security: Only active player or room host can advance turn
    const isAuthorized = !activePlayer ||
      isActivePlayerSocket(room, socket.id) ||
      socket.id === room.hostSocketId;
    if (!isAuthorized) {
      console.warn(`[Multiplayer Security] game:close_event rejected from unauthorized socket ${socket.id}`);
      return;
    }

    room.isEventModalOpen = false;
    room.currentEvent = null;
    room.currentEventTile = null;
    room.activeQuestionAnswer = null;

    // Check if all players finished
    const allFinished = room.players.every((p) => p.isFinished);
    if (allFinished) {
      room.phase = 'game_over';
      io.to(roomId).emit('room:updated', room);
      return;
    }

    // Advance to next active player
    let nextIndex = (room.activePlayerIndex + 1) % room.players.length;
    let loopCount = 0;
    while (room.players[nextIndex].isFinished && loopCount < room.players.length) {
      nextIndex = (nextIndex + 1) % room.players.length;
      loopCount++;
    }

    if (nextIndex <= room.activePlayerIndex) {
      room.round += 1;
    }

    room.activePlayerIndex = nextIndex;
    room.phase = 'playing';

    io.to(roomId).emit('room:updated', room);
  });

  // 9. Synchronize Game Over Ceremony Steps (Suspense, 1st & 2nd reveal)
  socket.on('game:ceremony_step', ({ roomId, step, bottomRevealedCount, areFinalistsRevealed }) => {
    const room = rooms.get(roomId);
    if (!room) return;

    room.ceremonyStep = step;
    room.bottomRevealedCount = bottomRevealedCount;
    room.areFinalistsRevealed = areFinalistsRevealed;

    io.to(roomId).emit('game:ceremony_updated', {
      step,
      bottomRevealedCount,
      areFinalistsRevealed,
    });
  });

  // 10. Real-time In-Game Chat
  socket.on('chat:send', ({ roomId, text }) => {
    const room = rooms.get(roomId);
    if (!room) return;

    const sender = room.players.find((p) => p.id === currentPlayerId);
    if (!sender || !text.trim()) return;

    const msg: ChatMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      playerId: sender.id,
      playerName: sender.name,
      playerAvatar: sender.avatar,
      playerColor: sender.color,
      text: text.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    room.chatMessages.push(msg);
    if (room.chatMessages.length > 50) room.chatMessages.shift();

    io.to(roomId).emit('chat:received', msg);
  });

  // 11. Leave Room or Disconnect
  const handleLeave = () => {
    if (!currentRoomId || !currentPlayerId) return;
    const room = rooms.get(currentRoomId);
    if (!room) return;

    const leavingPlayer = room.players.find((p) => p.id === currentPlayerId);
    if (room.phase === 'lobby') {
      // Remove player in lobby
      room.players = room.players.filter((p) => p.id !== currentPlayerId);
      if (room.players.length === 0) {
        rooms.delete(currentRoomId);
      } else {
        if (room.hostSocketId === socket.id) {
          room.hostSocketId = room.players[0].socketId;
          room.players[0].isHost = true;
        }
        io.to(currentRoomId).emit('room:updated', room);
      }
    } else {
      // In active game, mark presence or notify
      if (leavingPlayer && leavingPlayer.socketId === socket.id) {
        room.chatMessages.push({
          id: `msg-${Date.now()}`,
          playerId: 'system',
          playerName: 'Sistema',
          playerAvatar: '⚠️',
          playerColor: '#EF4444',
          text: `${leavingPlayer.name} desconectou.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isSystem: true,
        });
        io.to(currentRoomId).emit('room:updated', room);
      }
    }
    socket.leave(currentRoomId);
    currentRoomId = null;
    currentPlayerId = null;
  };

  socket.on('room:leave', handleLeave);
  socket.on('disconnect', handleLeave);
});

// Vite & Static Asset Handling
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Prática do Trabalho Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
