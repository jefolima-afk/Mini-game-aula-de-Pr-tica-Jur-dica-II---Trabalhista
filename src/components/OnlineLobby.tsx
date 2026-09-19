import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trophy, 
  Users, 
  PlusCircle, 
  LogIn, 
  Copy, 
  Check, 
  Share2, 
  Play, 
  ArrowLeft, 
  Scale, 
  Globe, 
  Sparkles, 
  Send, 
  Crown, 
  Radio, 
  Monitor, 
  ShieldCheck, 
  HelpCircle,
  Hash,
  UserCheck
} from 'lucide-react';
import { CesurgLogo } from './CesurgLogo';
import { OnlinePlayer, OnlineRoom, ChatMessage } from '../types';
import { getSocket } from '../utils/socket';
import { sound } from '../utils/audio';

const AVATARS = ['⚖️', '🏛️', '📜', '💼', '🎓', '🖋️', '🔍', '🏆', '👨‍⚖️', '👩‍⚖️', '📚', '⚡'];
const COLORS = [
  '#F59E0B', '#3B82F6', '#10B981', '#EC4899', 
  '#8B5CF6', '#EF4444', '#06B6D4', '#F97316'
];
const ROLES = [
  'Advogado(a) Trabalhista',
  'Juiz(a) do Trabalho',
  'Procurador(a) do MPT',
  'Defensor(a) Público(a)',
  'Assessor(a) de Desembargador',
  'Perito(a) Judicial',
  'Auditor(a) Fiscal do Trabalho',
  'Estudante de Prática Jurídica'
];

interface OnlineLobbyProps {
  onStartLocalGame: () => void;
  onEnterOnlineGame: (room: OnlineRoom, myPlayer: OnlinePlayer) => void;
}

export const OnlineLobby: React.FC<OnlineLobbyProps> = ({
  onStartLocalGame,
  onEnterOnlineGame,
}) => {
  const socket = getSocket();
  const [activeTab, setActiveTab] = useState<'create' | 'join' | 'public'>('create');
  const [currentRoom, setCurrentRoom] = useState<OnlineRoom | null>(null);
  const [myPlayer, setMyPlayer] = useState<OnlinePlayer | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(socket.connected);

  // Form State: Create
  const [createRoomName, setCreateRoomName] = useState<string>('Turma de Prática Trabalhista');
  const [createPlayerName, setCreatePlayerName] = useState<string>('');
  const [createAvatar, setCreateAvatar] = useState<string>('⚖️');
  const [createColor, setCreateColor] = useState<string>('#F59E0B');
  const [createRole, setCreateRole] = useState<string>('Advogado(a) Trabalhista');

  // Form State: Join
  const [joinRoomCode, setJoinRoomCode] = useState<string>('');
  const [joinPlayerName, setJoinPlayerName] = useState<string>('');
  const [joinAvatar, setJoinAvatar] = useState<string>('💼');
  const [joinColor, setJoinColor] = useState<string>('#3B82F6');
  const [joinRole, setJoinRole] = useState<string>('Estudante de Prática Jurídica');

  // UI state
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [publicRooms, setPublicRooms] = useState<Array<{ roomId: string; roomName: string; playerCount: number; phase: string }>>([]);
  const [chatInput, setChatInput] = useState<string>('');

  // Check URL query parameters for direct room link (e.g. ?room=CLT-842)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get('room');
    if (roomParam) {
      setJoinRoomCode(roomParam.toUpperCase());
      setActiveTab('join');
    }
  }, []);

  // Socket Connection and Event Listeners
  useEffect(() => {
    const onConnect = () => setIsConnected(true);
    const onDisconnect = () => setIsConnected(false);

    const onRoomUpdated = (room: OnlineRoom) => {
      setCurrentRoom(room);

      // If room phase changed to playing, transition to game!
      if (room.phase === 'playing' || room.phase === 'spinning' || room.phase === 'moving' || room.phase === 'event') {
        const foundMe = room.players.find((p) => p.socketId === socket.id);
        if (foundMe) {
          setMyPlayer(foundMe);
          onEnterOnlineGame(room, foundMe);
        }
      }
    };

    const onChatReceived = (msg: ChatMessage) => {
      setCurrentRoom((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          chatMessages: [...prev.chatMessages, msg],
        };
      });
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('room:updated', onRoomUpdated);
    socket.on('chat:received', onChatReceived);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('room:updated', onRoomUpdated);
      socket.off('chat:received', onChatReceived);
    };
  }, [socket, onEnterOnlineGame]);

  // Fetch Public Rooms
  const fetchPublicRooms = async () => {
    try {
      const res = await fetch('/api/rooms');
      if (res.ok) {
        const data = await res.json();
        setPublicRooms(data.rooms || []);
      }
    } catch {}
  };

  useEffect(() => {
    if (activeTab === 'public') {
      fetchPublicRooms();
      const interval = setInterval(fetchPublicRooms, 3000);
      return () => clearInterval(interval);
    }
  }, [activeTab]);

  // Create Room Handler
  const handleCreateRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!createPlayerName.trim()) {
      setErrorMessage('Por favor, digite seu nome ou como prefere ser chamado(a).');
      return;
    }
    setErrorMessage(null);
    setIsSubmitting(true);

    sound.playClickSound();

    socket.emit(
      'room:create',
      {
        roomName: createRoomName.trim() || 'Turma de Prática Trabalhista',
        playerName: createPlayerName.trim(),
        avatar: createAvatar,
        color: createColor,
        role: createRole,
      },
      (res: { ok: boolean; roomId?: string; player?: OnlinePlayer; room?: OnlineRoom; error?: string }) => {
        setIsSubmitting(false);
        if (res.ok && res.room && res.player) {
          setCurrentRoom(res.room);
          setMyPlayer(res.player);
          sound.playAwardTrumpet();
        } else {
          setErrorMessage(res.error || 'Falha ao criar sala. Verifique a conexão.');
        }
      }
    );
  };

  // Join Room Handler
  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinRoomCode.trim()) {
      setErrorMessage('Informe o código da sala de 6 caracteres (Ex: CLT-742).');
      return;
    }
    if (!joinPlayerName.trim()) {
      setErrorMessage('Por favor, informe seu nome de aluno(a).');
      return;
    }
    setErrorMessage(null);
    setIsSubmitting(true);

    sound.playClickSound();

    socket.emit(
      'room:join',
      {
        roomId: joinRoomCode.trim().toUpperCase(),
        playerName: joinPlayerName.trim(),
        avatar: joinAvatar,
        color: joinColor,
        role: joinRole,
      },
      (res: { ok: boolean; roomId?: string; player?: OnlinePlayer; room?: OnlineRoom; error?: string }) => {
        setIsSubmitting(false);
        if (res.ok && res.room && res.player) {
          setCurrentRoom(res.room);
          setMyPlayer(res.player);
          sound.playClickSound();

          // If game is already active, enter immediately
          if (res.room.phase !== 'lobby') {
            onEnterOnlineGame(res.room, res.player);
          }
        } else {
          setErrorMessage(res.error || 'Não foi possível entrar na sala informada.');
        }
      }
    );
  };

  // Start Online Game (Host Only)
  const handleStartOnlineMatch = () => {
    if (!currentRoom) return;
    if (currentRoom.players.length < 2) {
      setErrorMessage('Aguarde ao menos mais 1 jurista entrar na sala para iniciar!');
      return;
    }

    sound.playAwardTrumpet();
    socket.emit('room:start_game', { roomId: currentRoom.roomId }, (res: { ok: boolean; error?: string }) => {
      if (!res.ok) {
        setErrorMessage(res.error || 'Erro ao iniciar partida.');
      }
    });
  };

  // Leave Room Handler
  const handleLeaveRoom = () => {
    socket.emit('room:leave');
    setCurrentRoom(null);
    setMyPlayer(null);
    setErrorMessage(null);
  };

  // Send Chat Message
  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentRoom || !chatInput.trim()) return;
    socket.emit('chat:send', { roomId: currentRoom.roomId, text: chatInput.trim() });
    setChatInput('');
  };

  // Copy helpers
  const handleCopyCode = () => {
    if (!currentRoom) return;
    navigator.clipboard.writeText(currentRoom.roomId);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyLink = () => {
    if (!currentRoom) return;
    const url = `${window.location.origin}?room=${currentRoom.roomId}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // ===========================================================================
  // RENDER: WAITING ROOM LOBBY (When player is in a room)
  // ===========================================================================
  if (currentRoom) {
    const isHost = currentRoom.hostSocketId === socket.id;
    const canStart = currentRoom.players.length >= 2;

    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-between p-3 sm:p-6 text-white relative overflow-hidden">
        {/* Ambient Top Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-48 bg-gradient-to-b from-amber-500/15 via-yellow-500/5 to-transparent blur-3xl pointer-events-none" />

        {/* Top Header */}
        <header className="w-full max-w-4xl flex items-center justify-between gap-3 relative z-10 py-2 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <CesurgLogo height={32} />
            <div>
              <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider block leading-none">
                Sala de Espera Online
              </span>
              <h1 className="text-sm sm:text-base font-black text-white font-display leading-tight truncate">
                {currentRoom.roomName}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Conectado</span>
            </div>

            <button
              type="button"
              onClick={handleLeaveRoom}
              className="px-2.5 py-1 rounded-lg text-xs font-medium text-slate-400 hover:text-rose-300 hover:bg-slate-800/80 border border-slate-700/60 transition-all flex items-center gap-1 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Sair</span>
            </button>
          </div>
        </header>

        {/* Room Share Banner & Code */}
        <div className="w-full max-w-4xl my-3 p-3 sm:p-4 rounded-2xl bg-gradient-to-r from-amber-500/15 via-slate-900 to-amber-600/15 border-2 border-amber-400/50 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-3 relative z-10">
          <div className="text-center sm:text-left">
            <div className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-300 uppercase tracking-wider">
              <Share2 className="w-3 h-3 text-amber-400" />
              <span>Compartilhe com seus colegas de turma</span>
            </div>
            <div className="flex items-center gap-2 mt-0.5 justify-center sm:justify-start">
              <span className="text-xs text-slate-300">Código de Acesso:</span>
              <span className="font-mono text-xl sm:text-2xl font-black text-amber-400 tracking-wider bg-slate-900/90 px-3 py-0.5 rounded-lg border border-amber-400/40 shadow-inner">
                {currentRoom.roomId}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyCode}
              className="px-3 py-1.5 rounded-xl font-bold text-xs bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-400/40 shadow active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedCode ? 'Código Copiado!' : 'Copiar Código'}</span>
            </button>

            <button
              type="button"
              onClick={handleCopyLink}
              className="px-3.5 py-1.5 rounded-xl font-bold text-xs bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-md shadow-amber-500/20 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-slate-950" /> : <Share2 className="w-3.5 h-3.5" />}
              <span>{copiedLink ? 'Link Copiado!' : 'Copiar Link da Sala'}</span>
            </button>
          </div>
        </div>

        {/* Main Waiting Room Area: Players Grid + Live Chat */}
        <div className="w-full max-w-4xl flex-1 grid grid-cols-1 lg:grid-cols-3 gap-3 relative z-10 min-h-0">
          {/* Connected Jurists (2 Columns) */}
          <div className="lg:col-span-2 flex flex-col justify-between p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl overflow-hidden">
            <div>
              <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-amber-400" />
                  <h3 className="text-sm font-bold text-white font-display">
                    Juristas Conectados ({currentRoom.players.length} de 12)
                  </h3>
                </div>
                <span className="text-[11px] text-slate-400">
                  {canStart ? 'Prontos para começar!' : 'Aguardando mais colegas...'}
                </span>
              </div>

              {/* Grid of Players */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[46vh] overflow-y-auto pr-1">
                {currentRoom.players.map((player, index) => {
                  const isPlayerHost = player.isHost;
                  const isMe = player.socketId === socket.id;

                  return (
                    <motion.div
                      key={player.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 transition-all ${
                        isMe
                          ? 'bg-amber-500/15 border-amber-400/80 shadow-md ring-1 ring-amber-400/30'
                          : 'bg-slate-800/60 border-slate-750'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <div
                          className="w-9 h-9 rounded-xl flex items-center justify-center text-lg shadow-sm border border-white/20 flex-shrink-0"
                          style={{ backgroundColor: player.color }}
                        >
                          {player.avatar}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <h4 className="text-xs font-bold text-white truncate">
                              {player.name}
                            </h4>
                            {isMe && (
                              <span className="text-[9px] px-1 rounded bg-amber-400/20 text-amber-300 font-bold">
                                Você
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-400 truncate">
                            {player.role}
                          </p>
                        </div>
                      </div>

                      {isPlayerHost ? (
                        <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black uppercase tracking-wider flex-shrink-0">
                          <Crown className="w-3 h-3 fill-slate-950" />
                          <span>Host</span>
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-500 font-bold px-1.5 py-0.5 rounded bg-slate-800 flex-shrink-0">
                          #{index + 1}
                        </span>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* Host Action or Waiting Message */}
            <div className="pt-3 border-t border-slate-800 mt-2">
              {isHost ? (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
                  <span className="text-xs text-slate-300 text-center sm:text-left">
                    {canStart
                      ? 'Todos prontos! Você pode iniciar a partida a qualquer momento.'
                      : 'Mínimo de 2 juristas necessário para dar a largada.'}
                  </span>

                  <button
                    type="button"
                    onClick={handleStartOnlineMatch}
                    disabled={!canStart}
                    className={`w-full sm:w-auto px-5 py-2.5 rounded-xl font-black text-xs sm:text-sm shadow-lg flex items-center justify-center gap-2 cursor-pointer font-display transition-all ${
                      canStart
                        ? 'bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 shadow-amber-500/25 active:scale-95 animate-pulse'
                        : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                    }`}
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span>Iniciar Partida Online</span>
                  </button>
                </div>
              ) : (
                <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700 flex items-center justify-center gap-2 text-xs text-amber-300 font-medium text-center">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                  <span>Aguardando o Anfitrião iniciar a partida para toda a turma...</span>
                </div>
              )}
            </div>
          </div>

          {/* Real-time In-Room Chat / Log */}
          <div className="flex flex-col justify-between p-3 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl overflow-hidden max-h-[55vh]">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-amber-400" />
                <span>Bate-Papo da Sala</span>
              </span>
              <span className="text-[10px] text-slate-400">Ao vivo</span>
            </div>

            {/* Chat List */}
            <div className="flex-1 overflow-y-auto space-y-1.5 py-2 pr-1 min-h-0 text-left">
              {currentRoom.chatMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`p-1.5 rounded-lg text-xs ${
                    msg.isSystem
                      ? 'bg-slate-800/40 text-slate-400 text-[11px] italic'
                      : 'bg-slate-800/80 border border-slate-750'
                  }`}
                >
                  {!msg.isSystem && (
                    <div className="flex items-center justify-between text-[10px] mb-0.5">
                      <span className="font-bold flex items-center gap-1 text-slate-200">
                        <span>{msg.playerAvatar}</span>
                        <span>{msg.playerName}</span>
                      </span>
                      <span className="text-slate-500">{msg.timestamp}</span>
                    </div>
                  )}
                  <p className="text-slate-300 break-words">{msg.text}</p>
                </div>
              ))}
            </div>

            {/* Chat Input */}
            <form onSubmit={handleSendChat} className="pt-2 border-t border-slate-800 flex items-center gap-1.5">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Enviar mensagem para a turma..."
                maxLength={120}
                className="flex-1 bg-slate-800 border border-slate-750 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
              />
              <button
                type="submit"
                disabled={!chatInput.trim()}
                className="p-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>

        {/* Error Notification */}
        {errorMessage && (
          <div className="w-full max-w-md mt-2 p-2 rounded-xl bg-rose-500/20 border border-rose-500 text-rose-300 text-xs text-center">
            {errorMessage}
          </div>
        )}
      </div>
    );
  }

  // ===========================================================================
  // RENDER: LOBBY MAIN SCREEN (CREATE, JOIN, PUBLIC, LOCAL)
  // ===========================================================================
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-between p-3 sm:p-6 text-white relative overflow-hidden">
      {/* Ambient Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-4/5 h-56 bg-gradient-to-b from-amber-500/15 via-yellow-500/5 to-transparent blur-3xl pointer-events-none" />

      {/* Header Banner */}
      <header className="w-full max-w-4xl text-center space-y-2 relative z-10 pt-2 pb-3">
        <div className="flex flex-col items-center justify-center gap-1.5">
          <CesurgLogo height={38} className="opacity-95 drop-shadow-sm" />
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#20140D] border border-amber-400/40 text-amber-300 text-xs font-semibold shadow-sm">
            <Scale className="w-3.5 h-3.5 text-amber-400" />
            <span>Prática do Trabalho • Prof. Ma. Giulia Signor</span>
          </div>
        </div>

        <h1 className="text-xl sm:text-2xl font-black text-white font-display tracking-tight mt-1">
          Lobby Multijogador Online • CESURG
        </h1>
        <p className="text-xs text-slate-400 max-w-xl mx-auto">
          Crie uma sala para seus alunos participarem de seus próprios celulares ou computadores em tempo real, ou junte-se a uma partida com o código de acesso.
        </p>

        {/* Connection Status Pill */}
        <div className="flex items-center justify-center gap-2 pt-0.5">
          <div className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${
            isConnected
              ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400'
              : 'bg-amber-500/15 border-amber-500/40 text-amber-400'
          }`}>
            <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
            <span>{isConnected ? 'Servidor Multijogador Online 🟢' : 'Conectando ao servidor...'}</span>
          </div>
        </div>
      </header>

      {/* Main Container with Tabs */}
      <div className="w-full max-w-2xl bg-slate-900/90 border-2 border-amber-500/40 rounded-3xl shadow-2xl overflow-hidden p-4 sm:p-6 relative z-10 my-auto">
        {/* Navigation Tabs */}
        <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-950/80 rounded-2xl border border-slate-800 mb-4">
          <button
            type="button"
            onClick={() => {
              setActiveTab('create');
              setErrorMessage(null);
            }}
            className={`py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer font-display ${
              activeTab === 'create'
                ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Criar Nova Sala</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('join');
              setErrorMessage(null);
            }}
            className={`py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer font-display ${
              activeTab === 'join'
                ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Entrar em Sala</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('public');
              setErrorMessage(null);
            }}
            className={`py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer font-display ${
              activeTab === 'public'
                ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Salas Abertas</span>
          </button>
        </div>

        {/* TAB 1: CRIAR SALA */}
        {activeTab === 'create' && (
          <form onSubmit={handleCreateRoom} className="space-y-3.5 text-left">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Nome da Sala / Turma
              </label>
              <input
                type="text"
                value={createRoomName}
                onChange={(e) => setCreateRoomName(e.target.value)}
                placeholder="Ex: Turma A - Prática do Trabalho"
                maxLength={45}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Seu Nome (Professor(a) ou Anfitrião)
              </label>
              <input
                type="text"
                value={createPlayerName}
                onChange={(e) => setCreatePlayerName(e.target.value)}
                placeholder="Digite seu nome completo ou como a turma te chama"
                maxLength={30}
                required
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 transition-all"
              />
            </div>

            {/* Role selection */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Foco de Atuação Jurídica
              </label>
              <select
                value={createRole}
                onChange={(e) => setCreateRole(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400 transition-all cursor-pointer"
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            {/* Avatar & Color Pickers */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Avatar do Anfitrião
                </label>
                <div className="grid grid-cols-6 gap-1 bg-slate-800/80 p-1.5 rounded-xl border border-slate-700">
                  {AVATARS.map((av) => (
                    <button
                      key={av}
                      type="button"
                      onClick={() => setCreateAvatar(av)}
                      className={`h-8 rounded-lg text-lg flex items-center justify-center transition-all cursor-pointer ${
                        createAvatar === av
                          ? 'bg-amber-400/30 border border-amber-400 scale-105'
                          : 'hover:bg-slate-700/60'
                      }`}
                    >
                      {av}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Cor do Peão
                </label>
                <div className="grid grid-cols-8 gap-1 bg-slate-800/80 p-2 rounded-xl border border-slate-700 items-center justify-center h-[52px]">
                  {COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setCreateColor(c)}
                      className={`w-5 h-5 rounded-full transition-all cursor-pointer ${
                        createColor === c ? 'ring-2 ring-white scale-125' : 'opacity-80 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
            </div>

            {errorMessage && (
              <div className="p-2.5 rounded-xl bg-rose-500/20 border border-rose-500/60 text-rose-300 text-xs text-center font-medium">
                {errorMessage}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 rounded-xl font-black text-sm bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 shadow-lg shadow-amber-500/30 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer font-display"
            >
              <Sparkles className="w-4 h-4 fill-slate-950" />
              <span>{isSubmitting ? 'Gerando Sala...' : 'Criar Sala e Gerar Código de Acesso'}</span>
            </button>
          </form>
        )}

        {/* TAB 2: ENTRAR EM SALA */}
        {activeTab === 'join' && (
          <form onSubmit={handleJoinRoom} className="space-y-3.5 text-left">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center justify-between">
                <span>Código da Sala (6 caracteres)</span>
                <span className="text-[10px] text-amber-400">Ex: CLT-842</span>
              </label>
              <div className="relative">
                <Hash className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={joinRoomCode}
                  onChange={(e) => setJoinRoomCode(e.target.value.toUpperCase())}
                  placeholder="DIGITE O CÓDIGO DA SALA"
                  maxLength={10}
                  required
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-base font-mono font-bold text-amber-400 uppercase tracking-widest placeholder-slate-500 focus:outline-none focus:border-amber-400 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Seu Nome de Aluno(a)
              </label>
              <input
                type="text"
                value={joinPlayerName}
                onChange={(e) => setJoinPlayerName(e.target.value)}
                placeholder="Informe seu nome para aparecer no tabuleiro"
                maxLength={30}
                required
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 transition-all"
              />
            </div>

            {/* Role selection */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Seu Foco Jurídico
              </label>
              <select
                value={joinRole}
                onChange={(e) => setJoinRole(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400 transition-all cursor-pointer"
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            {/* Avatar & Color Pickers */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Seu Avatar
                </label>
                <div className="grid grid-cols-6 gap-1 bg-slate-800/80 p-1.5 rounded-xl border border-slate-700">
                  {AVATARS.map((av) => (
                    <button
                      key={av}
                      type="button"
                      onClick={() => setJoinAvatar(av)}
                      className={`h-8 rounded-lg text-lg flex items-center justify-center transition-all cursor-pointer ${
                        joinAvatar === av
                          ? 'bg-amber-400/30 border border-amber-400 scale-105'
                          : 'hover:bg-slate-700/60'
                      }`}
                    >
                      {av}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Cor do Peão
                </label>
                <div className="grid grid-cols-8 gap-1 bg-slate-800/80 p-2 rounded-xl border border-slate-700 items-center justify-center h-[52px]">
                  {COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setJoinColor(c)}
                      className={`w-5 h-5 rounded-full transition-all cursor-pointer ${
                        joinColor === c ? 'ring-2 ring-white scale-125' : 'opacity-80 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
            </div>

            {errorMessage && (
              <div className="p-2.5 rounded-xl bg-rose-500/20 border border-rose-500/60 text-rose-300 text-xs text-center font-medium">
                {errorMessage}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 rounded-xl font-black text-sm bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 shadow-lg shadow-amber-500/30 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer font-display"
            >
              <LogIn className="w-4 h-4" />
              <span>{isSubmitting ? 'Entrando na Sala...' : 'Ingressar na Partida'}</span>
            </button>
          </form>
        )}

        {/* TAB 3: SALAS ABERTAS / PÚBLICAS */}
        {activeTab === 'public' && (
          <div className="space-y-2.5 text-left">
            <div className="flex items-center justify-between text-xs text-slate-400 pb-1 border-b border-slate-800">
              <span>Salas ativas no momento</span>
              <button
                type="button"
                onClick={fetchPublicRooms}
                className="text-[11px] text-amber-400 hover:underline cursor-pointer"
              >
                Atualizar Lista
              </button>
            </div>

            {publicRooms.length === 0 ? (
              <div className="p-6 text-center text-slate-400 space-y-2">
                <Globe className="w-8 h-8 mx-auto text-slate-600 opacity-60" />
                <p className="text-xs">Nenhuma sala aberta encontrada neste momento.</p>
                <button
                  type="button"
                  onClick={() => setActiveTab('create')}
                  className="text-xs text-amber-400 font-bold hover:underline cursor-pointer"
                >
                  Clique aqui para criar a primeira sala!
                </button>
              </div>
            ) : (
              <div className="space-y-1.5 max-h-[40vh] overflow-y-auto pr-1">
                {publicRooms.map((r) => (
                  <div
                    key={r.roomId}
                    className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-750 flex items-center justify-between gap-2 hover:border-amber-400/50 transition-all"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-black text-amber-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-700">
                          {r.roomId}
                        </span>
                        <h4 className="text-xs font-bold text-white truncate max-w-[200px]">
                          {r.roomName}
                        </h4>
                      </div>
                      <span className="text-[10px] text-slate-400 mt-0.5 block">
                        {r.playerCount} de 12 juristas • Fase: {r.phase === 'lobby' ? 'Na sala de espera' : 'Em jogo'}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setJoinRoomCode(r.roomId);
                        setActiveTab('join');
                      }}
                      className="px-3 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-bold cursor-pointer"
                    >
                      Entrar
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Alternative: Local Classroom Play */}
        <div className="mt-4 pt-3 border-t border-slate-800 text-center">
          <button
            type="button"
            onClick={onStartLocalGame}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-750 border border-slate-750 transition-all cursor-pointer"
          >
            <Monitor className="w-3.5 h-3.5 text-amber-400" />
            <span>Jogar Modo Presencial (Projetor / 1 Tela Única)</span>
          </button>
        </div>
      </div>

      {/* Footer */}
      <footer className="w-full max-w-4xl text-center py-2 text-[11px] text-slate-500 relative z-10">
        <span>CESURG • Curso de Direito • Prática Jurídica Trabalhista • </span>
        <span className="text-amber-400/80">designed by @jlima.trafego</span>
      </footer>
    </div>
  );
};
