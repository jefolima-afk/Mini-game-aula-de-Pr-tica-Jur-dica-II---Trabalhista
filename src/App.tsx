import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { BOARD_TILES } from './data/boardTiles';
import { getEventForTile, getRandomMiniStepEvent, QuestionTracker } from './data/eventsPool';
import { Player, LawGameEvent, GamePhase, GameLogEntry, Tile, OnlineRoom, OnlinePlayer } from './types';
import { sound } from './utils/audio';
import { getSocket } from './utils/socket';

import { GameHeader } from './components/GameHeader';
import { PlayerSetup } from './components/PlayerSetup';
import { Board } from './components/Board';
import { Roulette } from './components/Roulette';
import { PlayersList } from './components/PlayersList';
import { EventModal } from './components/EventModal';
import { GameOverModal } from './components/GameOverModal';
import { GameLogsDrawer } from './components/GameLogsDrawer';
import { RulesModal } from './components/RulesModal';
import { OnlineLobby } from './components/OnlineLobby';
import { OnlineChatDrawer } from './components/OnlineChatDrawer';

const FINISH_TILE_ID = 35;

export default function App() {
  const socket = getSocket();

  // Mode: 'lobby' (Initial Lobby for room creation/joining) | 'local' | 'online'
  const [gameMode, setGameMode] = useState<'lobby' | 'local' | 'online'>('lobby');

  // Online Multiplayer State
  const [onlineRoom, setOnlineRoom] = useState<OnlineRoom | null>(null);
  const [myOnlinePlayer, setMyOnlinePlayer] = useState<OnlinePlayer | null>(null);
  const [externalSpinNumber, setExternalSpinNumber] = useState<number | null>(null);

  // Local / Synchronized Game State
  const [phase, setPhase] = useState<GamePhase>('setup');
  const [players, setPlayers] = useState<Player[]>([]);
  const [activePlayerIndex, setActivePlayerIndex] = useState<number>(0);
  const [round, setRound] = useState<number>(1);
  const [isMoving, setIsMoving] = useState<boolean>(false);
  const [highlightTileId, setHighlightTileId] = useState<number | null>(null);

  // Current active event & modals
  const [currentEvent, setCurrentEvent] = useState<LawGameEvent | null>(null);
  const [currentEventTile, setCurrentEventTile] = useState<Tile | null>(null);
  const [isEventModalOpen, setIsEventModalOpen] = useState<boolean>(false);

  // Auxiliary UI
  const [isLogsOpen, setIsLogsOpen] = useState<boolean>(false);
  const [isRulesOpen, setIsRulesOpen] = useState<boolean>(false);
  const [showRestartConfirm, setShowRestartConfirm] = useState<boolean>(false);
  const [showFinishConfirm, setShowFinishConfirm] = useState<boolean>(false);
  const [inspectTile, setInspectTile] = useState<Tile | null>(null);
  const [logs, setLogs] = useState<GameLogEntry[]>([]);

  // Log handler
  const addLog = useCallback(
    (playerId: string, playerName: string, playerColor: string, text: string, type: GameLogEntry['type']) => {
      const newEntry: GameLogEntry = {
        id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        playerId,
        playerName,
        playerColor,
        text,
        type,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      };
      setLogs((prev) => [newEntry, ...prev]);
    },
    []
  );

  // ===========================================================================
  // SOCKET.IO EVENT SUBSCRIPTIONS (ONLINE MODE)
  // ===========================================================================
  useEffect(() => {
    const onRoomUpdated = (updatedRoom: OnlineRoom) => {
      setOnlineRoom(updatedRoom);

      // Keep player list in sync
      const convertedPlayers: Player[] = updatedRoom.players.map((p) => ({
        id: p.id,
        name: p.name,
        avatar: p.avatar,
        color: p.color,
        accentColor: p.accentColor,
        role: p.role,
        points: p.points,
        reputation: p.reputation,
        position: p.position,
        isFinished: p.isFinished,
        finishRank: p.finishRank,
        skipNextTurn: p.skipNextTurn,
        achievements: p.achievements || [],
        questionsAnsweredCount: p.questionsAnsweredCount || 0,
        correctAnswersCount: p.correctAnswersCount || 0,
        bonusCount: p.bonusCount || 0,
      }));

      setPlayers(convertedPlayers);
      setActivePlayerIndex(updatedRoom.activePlayerIndex);
      setRound(updatedRoom.round);
      if (updatedRoom.logs) {
        setLogs(updatedRoom.logs);
      }

      // Check current event modal state from server
      if (updatedRoom.currentEvent && updatedRoom.currentEventTile && updatedRoom.isEventModalOpen) {
        setCurrentEvent(updatedRoom.currentEvent);
        setCurrentEventTile(updatedRoom.currentEventTile);
        setIsEventModalOpen(true);
      } else if (!updatedRoom.isEventModalOpen) {
        setIsEventModalOpen(false);
      }

      // Update game phase
      if (updatedRoom.phase === 'game_over') {
        setPhase('game_over');
      } else {
        setPhase('playing');
      }
    };

    const onRouletteSpun = ({ steps, playerId, playerName }: { steps: number; playerId: string; playerName: string }) => {
      setExternalSpinNumber(steps);
      // Reset external spin number after animation completes
      setTimeout(() => setExternalSpinNumber(null), 4000);
    };

    const onChatReceived = (msg: any) => {
      setOnlineRoom((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          chatMessages: [...(prev.chatMessages || []), msg],
        };
      });
    };

    socket.on('room:updated', onRoomUpdated);
    socket.on('game:roulette_spun', onRouletteSpun);
    socket.on('chat:received', onChatReceived);

    return () => {
      socket.off('room:updated', onRoomUpdated);
      socket.off('game:roulette_spun', onRouletteSpun);
      socket.off('chat:received', onChatReceived);
    };
  }, [socket]);

  // ===========================================================================
  // LOCAL MATCH CONTROLS
  // ===========================================================================
  const handleStartLocalGame = (configuredPlayers: Player[]) => {
    QuestionTracker.reset();
    setPlayers(configuredPlayers);
    setActivePlayerIndex(0);
    setRound(1);
    setLogs([]);
    setPhase('playing');

    addLog(
      'system',
      'Prática do Trabalho',
      '#F59E0B',
      `Partida local iniciada com ${configuredPlayers.length} alunos! Banco com 142 questões sem repetição ativado.`,
      'event'
    );
  };

  const activePlayer = players[activePlayerIndex] || players[0];

  // Local advance to next player
  const advanceToNextPlayer = useCallback((currentList: Player[], currentIndex: number) => {
    const allFinished = currentList.every((p) => p.isFinished);
    if (allFinished) {
      setPhase('game_over');
      return;
    }

    let nextIndex = (currentIndex + 1) % currentList.length;
    let loopCount = 0;

    while (currentList[nextIndex].isFinished && loopCount < currentList.length) {
      nextIndex = (nextIndex + 1) % currentList.length;
      loopCount++;
    }

    if (nextIndex <= currentIndex) {
      setRound((r) => r + 1);
    }

    if (currentList[nextIndex].skipNextTurn) {
      const skippedPlayer = currentList[nextIndex];
      addLog(
        skippedPlayer.id,
        skippedPlayer.name,
        skippedPlayer.color,
        `${skippedPlayer.name} cumpriu a penalidade e perdeu este turno.`,
        'event'
      );

      const unpenalizedList = currentList.map((p, idx) =>
        idx === nextIndex ? { ...p, skipNextTurn: false } : p
      );
      setPlayers(unpenalizedList);

      let subsequentIndex = (nextIndex + 1) % unpenalizedList.length;
      while (unpenalizedList[subsequentIndex].isFinished) {
        subsequentIndex = (subsequentIndex + 1) % unpenalizedList.length;
      }
      setActivePlayerIndex(subsequentIndex);
      return;
    }

    setActivePlayerIndex(nextIndex);
  }, [addLog]);

  // ===========================================================================
  // ROULETTE SPIN RESOLUTION (LOCAL & ONLINE)
  // ===========================================================================
  const handleRouletteResult = (steps: number) => {
    if (!activePlayer || isMoving) return;

    sound.playRouletteTick(0.5);

    const startPos = activePlayer.position || 1;
    const targetPos = Math.min(startPos + steps, FINISH_TILE_ID);
    const landedTile = BOARD_TILES.find((t) => t.id === targetPos) || BOARD_TILES[BOARD_TILES.length - 1];
    const event = getEventForTile(landedTile);

    if (gameMode === 'online' && onlineRoom) {
      // Broadcast online spin to server
      socket.emit('game:spin_roulette', {
        roomId: onlineRoom.roomId,
        steps,
        targetPosition: targetPos,
        eventData: event,
        eventTile: landedTile,
      });
      return;
    }

    // Local Mode step animation
    addLog(
      activePlayer.id,
      activePlayer.name,
      activePlayer.color,
      `Tirou o número ${steps} na Roleta da Sorte.`,
      'spin'
    );

    setIsMoving(true);
    let currentStep = startPos;

    const stepInterval = setInterval(() => {
      currentStep += 1;
      sound.playStepSound();

      if (currentStep < targetPos) {
        const passingTile = BOARD_TILES.find((t) => t.id === currentStep);
        const mini = getRandomMiniStepEvent();
        addLog(
          activePlayer.id,
          activePlayer.name,
          activePlayer.color,
          `Passou pela casa ${currentStep} (${passingTile?.title || 'Trilha'}): ${mini.text}`,
          'move'
        );
      }

      setPlayers((prev) =>
        prev.map((p) => (p.id === activePlayer.id ? { ...p, position: currentStep } : p))
      );
      setHighlightTileId(currentStep);

      if (currentStep >= targetPos) {
        clearInterval(stepInterval);
        setIsMoving(false);
        setCurrentEventTile(landedTile);
        setCurrentEvent(event);
        setIsEventModalOpen(true);
      }
    }, 280);
  };

  // ===========================================================================
  // EVENT RESOLUTION (LOCAL & ONLINE)
  // ===========================================================================
  const handleResolveEvent = (outcome: {
    pointsDelta: number;
    reputationDelta: number;
    moveStepsDelta?: number;
    skipTurn?: boolean;
    achievement?: string;
    chosenText?: string;
    wasCorrect?: boolean;
    isQuestion?: boolean;
  }) => {
    setIsEventModalOpen(false);

    if (!activePlayer || !currentEventTile) return;

    if (gameMode === 'online' && onlineRoom) {
      // Transmit to Online Server
      if (outcome.isQuestion) {
        const selectedOption = currentEvent?.question?.options.find((o) => o.text === outcome.chosenText);
        socket.emit('game:answer_question', {
          roomId: onlineRoom.roomId,
          optionId: outcome.chosenText,
          isCorrect: !!outcome.wasCorrect,
          pointsEarned: outcome.pointsDelta,
          penalty: outcome.pointsDelta < 0 ? Math.abs(outcome.pointsDelta) : 0,
          explanation: selectedOption?.explanation,
          legalBasis: selectedOption?.legalBasis,
        });
      } else if (currentEventTile.isBonus) {
        socket.emit('game:bonus_action', {
          roomId: onlineRoom.roomId,
          bonusType: currentEventTile.category,
          points: outcome.pointsDelta,
          moveSteps: outcome.moveStepsDelta,
          reputation: outcome.reputationDelta,
          headline: currentEventTile.title,
        });
      }

      // Check finish condition
      if ((activePlayer.position || 1) >= FINISH_TILE_ID && !activePlayer.isFinished) {
        const finishedCount = players.filter((p) => p.isFinished).length;
        socket.emit('game:player_finished', {
          roomId: onlineRoom.roomId,
          rank: finishedCount + 1,
          bonusPoints: 20,
        });
      }

      // Close event and advance turn on server
      socket.emit('game:close_event', { roomId: onlineRoom.roomId });
      return;
    }

    // Local Mode State Resolution
    const isQuestion = !!outcome.isQuestion;
    const newQuestionsAnsweredCount = isQuestion
      ? activePlayer.questionsAnsweredCount + 1
      : activePlayer.questionsAnsweredCount;

    const newPoints = Math.max(activePlayer.points + outcome.pointsDelta, 0);
    const newReputation = Math.max(activePlayer.reputation + outcome.reputationDelta, 0);
    const newAchievements = outcome.achievement && !activePlayer.achievements.includes(outcome.achievement)
      ? [...activePlayer.achievements, outcome.achievement]
      : activePlayer.achievements;

    const newCorrectCount = (isQuestion && outcome.wasCorrect)
      ? activePlayer.correctAnswersCount + 1
      : activePlayer.correctAnswersCount;

    const newBonusCount = currentEventTile.isBonus
      ? activePlayer.bonusCount + 1
      : activePlayer.bonusCount;

    let newPos = activePlayer.position;
    if (outcome.moveStepsDelta) {
      newPos = Math.min(newPos + outcome.moveStepsDelta, FINISH_TILE_ID);
    }

    const hasReachedFinish = newPos >= FINISH_TILE_ID;
    const currentlyFinishedCount = players.filter((p) => p.isFinished).length;
    const finishRank = hasReachedFinish && !activePlayer.isFinished ? currentlyFinishedCount + 1 : activePlayer.finishRank;

    const updatedPlayer: Player = {
      ...activePlayer,
      points: newPoints,
      reputation: newReputation,
      position: newPos,
      isFinished: hasReachedFinish || activePlayer.isFinished,
      finishRank,
      skipNextTurn: outcome.skipTurn || activePlayer.skipNextTurn,
      achievements: newAchievements,
      questionsAnsweredCount: newQuestionsAnsweredCount,
      correctAnswersCount: newCorrectCount,
      bonusCount: newBonusCount,
    };

    const updatedList = players.map((p) => (p.id === activePlayer.id ? updatedPlayer : p));
    setPlayers(updatedList);

    // Format log description
    const impactParts: string[] = [];
    if (outcome.chosenText) impactParts.push(`Opção: "${outcome.chosenText.slice(0, 45)}..."`);
    if (outcome.pointsDelta !== 0) {
      impactParts.push(outcome.pointsDelta > 0 ? `+${outcome.pointsDelta} Pontos` : `${outcome.pointsDelta} Pontos`);
    }
    if (outcome.wasCorrect !== undefined) {
      impactParts.push(outcome.wasCorrect ? 'Acertou questão!' : 'Errou questão');
    }
    if (outcome.moveStepsDelta) {
      impactParts.push(`Avanço bônus de +${outcome.moveStepsDelta} casas`);
    }

    addLog(
      activePlayer.id,
      activePlayer.name,
      activePlayer.color,
      `Resolveu evento "${currentEventTile.title}". ${impactParts.join(' | ')}`,
      'event'
    );

    if (hasReachedFinish && !activePlayer.isFinished) {
      addLog(
        activePlayer.id,
        activePlayer.name,
        activePlayer.color,
        `🏁 Chegou à Linha de Chegada em ${finishRank}º lugar!`,
        'finish'
      );
    }

    setCurrentEvent(null);
    setCurrentEventTile(null);
    advanceToNextPlayer(updatedList, activePlayerIndex);
  };

  // Restart Confirmations
  const handleRestartConfirm = () => {
    setShowRestartConfirm(false);
    if (gameMode === 'online') {
      socket.emit('room:leave');
      setGameMode('lobby');
      setOnlineRoom(null);
      setMyOnlinePlayer(null);
    } else {
      setPhase('setup');
    }
  };

  // Check turn ownership in online mode
  const isMyTurn = useMemo(() => {
    if (gameMode !== 'online') return true;
    if (!myOnlinePlayer || !activePlayer) return false;
    return activePlayer.id === myOnlinePlayer.id;
  }, [gameMode, myOnlinePlayer, activePlayer]);

  const isHost = useMemo(() => {
    if (gameMode !== 'online') return true;
    if (!onlineRoom) return true;
    return onlineRoom.hostSocketId === socket.id;
  }, [gameMode, onlineRoom, socket.id]);

  // ===========================================================================
  // RENDER SCREEN 1: ONLINE LOBBY (INITIAL SCREEN)
  // ===========================================================================
  if (gameMode === 'lobby') {
    return (
      <OnlineLobby
        onStartLocalGame={() => {
          setGameMode('local');
          setPhase('setup');
        }}
        onEnterOnlineGame={(room, player) => {
          setOnlineRoom(room);
          setMyOnlinePlayer(player);
          setGameMode('online');
          setPhase('playing');
        }}
      />
    );
  }

  // ===========================================================================
  // RENDER SCREEN 2: LOCAL SETUP (WHEN CHOOSING OFFLINE MODE)
  // ===========================================================================
  if (gameMode === 'local' && phase === 'setup') {
    return (
      <PlayerSetup
        onStartGame={handleStartLocalGame}
        onBackToLobby={() => setGameMode('lobby')}
      />
    );
  }

  // ===========================================================================
  // RENDER SCREEN 3: ACTIVE GAME BOARD (LOCAL OR MULTIPLAYER ONLINE)
  // ===========================================================================
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-between text-slate-100 select-none overflow-x-hidden">
      {/* Top Header */}
      <GameHeader
        round={round}
        totalLogs={logs.length}
        isPlaying={phase === 'playing'}
        onlineRoomCode={onlineRoom?.roomId}
        myPlayerName={myOnlinePlayer?.name}
        myPlayerAvatar={myOnlinePlayer?.avatar}
        onOpenLogs={() => setIsLogsOpen(true)}
        onOpenRules={() => setIsRulesOpen(true)}
        onRestartPrompt={() => setShowRestartConfirm(true)}
        onFinishPrompt={() => setShowFinishConfirm(true)}
        onReturnToLobby={() => {
          if (gameMode === 'online') {
            socket.emit('room:leave');
            setOnlineRoom(null);
            setMyOnlinePlayer(null);
          }
          setGameMode('lobby');
        }}
      />

      {/* Main Board Stage Layout */}
      <main className="flex-1 w-full max-w-[1920px] mx-auto p-2 sm:p-3 xl:p-4 flex flex-col lg:flex-row gap-3 xl:gap-4 items-stretch min-h-0">
        {/* Left Section: Board Tiles (Responsive) */}
        <section
          aria-label="Tabuleiro da Trilha do Trabalho"
          className="flex-[3] flex flex-col justify-between bg-slate-900/60 border border-slate-800/80 rounded-2xl sm:rounded-3xl p-2 sm:p-3 shadow-xl backdrop-blur-sm overflow-hidden"
        >
          <Board
            tiles={BOARD_TILES}
            players={players}
            activePlayerId={activePlayer?.id || ''}
            highlightTileId={highlightTileId}
            isMoving={isMoving}
            onTileClick={(tile) => setInspectTile(tile)}
          />
        </section>

        {/* Right Section: Roulette + Players Standings */}
        <aside className="flex-1 flex flex-col sm:flex-row lg:flex-col gap-3 min-w-[280px] sm:min-w-[320px] xl:min-w-[380px]">
          {/* Roulette Station */}
          <div className="flex-1 bg-slate-900/80 border border-slate-800 rounded-2xl sm:rounded-3xl p-3 shadow-xl flex flex-col items-center justify-between min-h-[300px] xl:min-h-[340px]">
            {activePlayer ? (
              <Roulette
                currentPlayer={activePlayer}
                disabled={isMoving || isEventModalOpen}
                isMyTurn={isMyTurn}
                externalSpinTarget={externalSpinNumber}
                onSpinEnd={handleRouletteResult}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400 text-xs">
                Aguardando participantes...
              </div>
            )}
          </div>

          {/* Connected Jurists Standings */}
          <div className="flex-1 bg-slate-900/80 border border-slate-800 rounded-2xl sm:rounded-3xl p-3 shadow-xl overflow-hidden min-h-[220px]">
            <PlayersList
              players={players}
              activePlayerId={activePlayer?.id || ''}
              myPlayerId={myOnlinePlayer?.id}
            />
          </div>
        </aside>
      </main>

      {/* Real-time In-Game Chat Drawer (Online Mode) */}
      {gameMode === 'online' && (
        <OnlineChatDrawer
          messages={onlineRoom?.chatMessages || []}
          myPlayer={myOnlinePlayer}
          onSendMessage={(text) => {
            if (onlineRoom) {
              socket.emit('chat:send', { roomId: onlineRoom.roomId, text });
            }
          }}
        />
      )}

      {/* Tile Inspection Modal */}
      {inspectTile && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
          onClick={() => setInspectTile(null)}
        >
          <div
            className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl p-5 text-slate-100 shadow-2xl space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                Casa #{inspectTile.id} da Trilha
              </span>
              <button
                type="button"
                onClick={() => setInspectTile(null)}
                className="text-xs text-slate-400 hover:text-white px-2 py-1 bg-slate-800 rounded-lg cursor-pointer"
              >
                Fechar
              </button>
            </div>

            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <span>{inspectTile.title}</span>
              {inspectTile.isBonus && (
                <span className="text-xs px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-400 font-extrabold">
                  CASA BÔNUS ⭐
                </span>
              )}
            </h3>

            <p className="text-sm text-slate-300 leading-relaxed bg-slate-800/50 p-3 rounded-xl">
              {inspectTile.subtitle}
            </p>

            <div className="text-xs text-slate-400 flex items-center gap-1.5 pt-1">
              <span>Tipo: </span>
              <span className="text-white font-semibold capitalize">{inspectTile.category}</span>
            </div>
          </div>
        </div>
      )}

      {/* Labor Law Question / Bonus Modal */}
      {currentEventTile && activePlayer && (
        <EventModal
          isOpen={isEventModalOpen}
          event={currentEvent}
          player={activePlayer}
          tile={currentEventTile}
          onResolve={handleResolveEvent}
        />
      )}

      {/* Game Logs Drawer */}
      <GameLogsDrawer
        isOpen={isLogsOpen}
        logs={logs}
        onClose={() => setIsLogsOpen(false)}
      />

      {/* Game Rules Modal */}
      <RulesModal
        isOpen={isRulesOpen}
        onClose={() => setIsRulesOpen(false)}
      />

      {/* Restart Match Confirmation */}
      {showRestartConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-700 rounded-2xl p-5 text-slate-100 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white">
              {gameMode === 'online' ? 'Sair da Sala Online?' : 'Reiniciar a Trilha?'}
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              {gameMode === 'online'
                ? 'Você retornará ao lobby inicial. Se você for o anfitrião, a liderança será transferida aos colegas.'
                : 'O progresso atual de todos os participantes será resetado e você poderá configurar uma nova rodada.'}
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowRestartConfirm(false)}
                className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleRestartConfirm}
                className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-xs font-bold text-white shadow cursor-pointer"
              >
                {gameMode === 'online' ? 'Sim, Sair da Sala' : 'Sim, Reiniciar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Early Finish / Final Scoring Confirmation */}
      {showFinishConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-slate-900 border border-amber-500/40 rounded-2xl p-5 text-slate-100 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <span className="text-amber-400">🏆</span>
              <span>Encerrar Partida e Apurar?</span>
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Deseja encerrar os lances da trilha e iniciar agora a <strong>apuração dos 3 bônus extras (+15 pts cada)</strong> e a <strong>revelação do ranking oficial do último ao 1º colocado</strong>?
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowFinishConfirm(false)}
                className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 cursor-pointer"
              >
                Continuar Jogando
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowFinishConfirm(false);
                  setPhase('game_over');
                  if (gameMode === 'online' && onlineRoom) {
                    socket.emit('game:ceremony_step', {
                      roomId: onlineRoom.roomId,
                      step: 'bonus_most_answered',
                      bottomRevealedCount: 0,
                      areFinalistsRevealed: false,
                    });
                  }
                }}
                className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-xs font-black text-slate-950 shadow-md cursor-pointer"
              >
                Sim, Apurar Resultados
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Game Over / Victory Podium with Synchronized Ceremony */}
      <GameOverModal
        isOpen={phase === 'game_over'}
        players={players}
        isOnline={gameMode === 'online'}
        isHost={isHost}
        externalCeremonyStep={onlineRoom?.ceremonyStep as any}
        externalBottomRevealedCount={onlineRoom?.bottomRevealedCount}
        externalAreFinalistsRevealed={onlineRoom?.areFinalistsRevealed}
        onCeremonyStepChange={(step, bottomRevealedCount, areFinalistsRevealed) => {
          if (gameMode === 'online' && onlineRoom) {
            socket.emit('game:ceremony_step', {
              roomId: onlineRoom.roomId,
              step,
              bottomRevealedCount,
              areFinalistsRevealed,
            });
          }
        }}
        onRestartGame={() => {
          if (gameMode === 'online') {
            socket.emit('room:leave');
            setOnlineRoom(null);
            setMyOnlinePlayer(null);
          }
          setGameMode('lobby');
        }}
      />

      {/* Rodapé Oficial da Aplicação */}
      <footer className="w-full py-2 px-4 border-t border-slate-800/80 bg-slate-950/95 text-center text-xs text-slate-400 flex items-center justify-center gap-1.5 backdrop-blur-md z-20 flex-shrink-0 select-none">
        <span>designed by</span>
        <span className="text-amber-400 font-bold tracking-wide">@jlima.trafego</span>
      </footer>
    </div>
  );
}
