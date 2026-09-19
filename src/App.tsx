import React, { useState, useCallback } from 'react';
import { BOARD_TILES } from './data/boardTiles';
import { getEventForTile, getRandomMiniStepEvent, QuestionTracker } from './data/eventsPool';
import { Player, LawGameEvent, GamePhase, GameLogEntry, Tile } from './types';
import { sound } from './utils/audio';

import { GameHeader } from './components/GameHeader';
import { PlayerSetup } from './components/PlayerSetup';
import { Board } from './components/Board';
import { Roulette } from './components/Roulette';
import { PlayersList } from './components/PlayersList';
import { EventModal } from './components/EventModal';
import { GameOverModal } from './components/GameOverModal';
import { GameLogsDrawer } from './components/GameLogsDrawer';
import { RulesModal } from './components/RulesModal';

export default function App() {
  const [phase, setPhase] = useState<GamePhase>('setup');
  const [players, setPlayers] = useState<Player[]>([]);
  const [activePlayerIndex, setActivePlayerIndex] = useState<number>(0);
  const [round, setRound] = useState<number>(1);
  const [isMoving, setIsMoving] = useState<boolean>(false);
  const [highlightTileId, setHighlightTileId] = useState<number | null>(null);

  // Current active event
  const [currentEvent, setCurrentEvent] = useState<LawGameEvent | null>(null);
  const [currentEventTile, setCurrentEventTile] = useState<Tile | null>(null);
  const [isEventModalOpen, setIsEventModalOpen] = useState<boolean>(false);

  // Drawers & auxiliary modals
  const [isLogsOpen, setIsLogsOpen] = useState<boolean>(false);
  const [isRulesOpen, setIsRulesOpen] = useState<boolean>(false);
  const [showRestartConfirm, setShowRestartConfirm] = useState<boolean>(false);
  const [showFinishConfirm, setShowFinishConfirm] = useState<boolean>(false);
  const [inspectTile, setInspectTile] = useState<Tile | null>(null);

  // Match event log
  const [logs, setLogs] = useState<GameLogEntry[]>([]);

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

  // Start game with configured players
  const handleStartGame = (configuredPlayers: Player[]) => {
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
      `Partida iniciada com ${configuredPlayers.length} alunos em Prática do Trabalho! Banco com 142 questões e cartas sem repetição ativado.`,
      'event'
    );
  };

  const activePlayer = players[activePlayerIndex] || players[0];
  const FINISH_TILE_ID = 35; // Casa 35: Linha de Chegada com Superpergunta

  // Next player turn logic
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

  // Handle roulette spin result
  const handleRouletteResult = (steps: number) => {
    if (!activePlayer || isMoving) return;

    sound.playRouletteTick(0.5);

    addLog(
      activePlayer.id,
      activePlayer.name,
      activePlayer.color,
      `Tirou o número ${steps} na Roleta da Sorte.`,
      'spin'
    );

    const startPos = activePlayer.position || 1;
    const targetPos = Math.min(startPos + steps, FINISH_TILE_ID);

    setIsMoving(true);
    let currentStep = startPos;

    const stepInterval = setInterval(() => {
      currentStep += 1;
      sound.playStepSound();

      if (currentStep < targetPos && currentStep < FINISH_TILE_ID) {
        const mini = getRandomMiniStepEvent();
        const passingTile = BOARD_TILES.find((t) => t.id === currentStep);
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

        const landedTile = BOARD_TILES.find((t) => t.id === targetPos) || BOARD_TILES[BOARD_TILES.length - 1];
        setCurrentEventTile(landedTile);

        const event = getEventForTile(landedTile);
        setCurrentEvent(event);
        setIsEventModalOpen(true);
      }
    }, 280);
  };

  // Resolve the labor law event / question / bonus
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
      `Casa ${currentEventTile.id}: ${currentEvent?.title}. (${impactParts.join(' | ') || 'Prosseguiu'})`,
      'event'
    );

    if (hasReachedFinish && !activePlayer.isFinished) {
      addLog(
        activePlayer.id,
        activePlayer.name,
        activePlayer.color,
        `Consagrou-se na Carreira Trabalhista em #${finishRank}º Lugar! (+300 pts de bônus de chegada)`,
        'finish'
      );
    }

    setTimeout(() => {
      setHighlightTileId(null);
      advanceToNextPlayer(updatedList, activePlayerIndex);
    }, 450);
  };

  const handleRestartConfirm = () => {
    QuestionTracker.reset();
    setShowRestartConfirm(false);
    setPhase('setup');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-amber-500 selection:text-slate-950 font-sans">
      {/* Top Application Bar */}
      <GameHeader
        round={round}
        totalLogs={logs.length}
        isPlaying={phase === 'playing'}
        onOpenLogs={() => setIsLogsOpen(true)}
        onOpenRules={() => setIsRulesOpen(true)}
        onRestartPrompt={() => setShowRestartConfirm(true)}
        onFinishPrompt={() => setShowFinishConfirm(true)}
      />

      {/* Main Screen Content */}
      {phase === 'setup' ? (
        <main className="flex-1 flex items-center justify-center p-3 sm:p-6">
          <PlayerSetup onStartGame={handleStartGame} />
        </main>
      ) : (
        <main className="flex-1 w-full max-w-[1720px] mx-auto p-2 sm:p-3 flex flex-col lg:h-[calc(100vh-3.5rem)] lg:overflow-hidden">
          {/* Main 3-Column Zero-Scroll Dashboard */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-2.5 sm:gap-3 flex-1 min-h-0">
            {/* Column 1: A Roleta & Turno do Jurista (3 cols) */}
            <div className="lg:col-span-3 flex flex-col gap-2.5 h-full min-h-0">
              {/* Active Player Turn Card */}
              {activePlayer && (
                <div
                  className="p-2.5 rounded-2xl border flex items-center justify-between gap-2 shadow-lg backdrop-blur-md flex-shrink-0"
                  style={{
                    backgroundColor: `${activePlayer.color}18`,
                    borderColor: `${activePlayer.color}45`,
                  }}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-white shadow-md border border-white/30 text-base flex-shrink-0"
                      style={{ backgroundColor: activePlayer.color }}
                    >
                      {activePlayer.avatar}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] uppercase tracking-wider font-bold text-amber-400">
                          Vez (Rodada {round})
                        </span>
                        <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                      </div>
                      <h2 className="text-sm font-black text-white leading-tight truncate">
                        {activePlayer.name}
                      </h2>
                      <span className="text-[9px] text-slate-400 truncate block">
                        {activePlayer.role || 'Acadêmico(a) de Direito'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <div className="px-2 py-1 rounded-lg bg-slate-900/90 border border-amber-500/30 text-center">
                      <span className="text-[8px] uppercase font-bold text-slate-400 block leading-none">Pontos</span>
                      <span className="text-xs font-black text-amber-400 leading-none mt-0.5 block">
                        {activePlayer.points}
                      </span>
                    </div>
                    <div className="px-2 py-1 rounded-lg bg-slate-900/90 border border-slate-700 text-center">
                      <span className="text-[8px] uppercase font-bold text-slate-400 block leading-none">Casa</span>
                      <span className="text-xs font-black text-white leading-none mt-0.5 block">
                        {activePlayer.position}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Roulette Container */}
              <div className="flex-1 min-h-0 bg-slate-900/90 rounded-2xl border border-slate-800 p-2 sm:p-3 shadow-2xl backdrop-blur-md flex flex-col items-center justify-center">
                {activePlayer && (
                  <Roulette
                    disabled={isMoving || isEventModalOpen || activePlayer.isFinished}
                    onSpinEnd={handleRouletteResult}
                    currentPlayer={activePlayer}
                  />
                )}
              </div>
            </div>

            {/* Column 2: O Tabuleiro das 35 Casas (6 cols) */}
            <div className="lg:col-span-6 flex flex-col h-full min-h-0">
              <Board
                tiles={BOARD_TILES}
                players={players}
                activePlayerId={activePlayer?.id}
                isMoving={isMoving}
                highlightTileId={highlightTileId}
                onTileClick={(tile) => setInspectTile(tile)}
              />
            </div>

            {/* Column 3: O Ranking dos Juristas (3 cols) */}
            <div className="lg:col-span-3 flex flex-col h-full min-h-0">
              <PlayersList
                players={players}
                activePlayerId={activePlayer?.id}
                totalTiles={BOARD_TILES.length}
              />
            </div>
          </div>
        </main>
      )}

      {/* Inspect Tile Information Modal */}
      {inspectTile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl p-5 text-slate-100 shadow-2xl space-y-3 relative">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-bold text-amber-400 uppercase">
                Casa {inspectTile.id} • {inspectTile.stage}
              </span>
              <button
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
            <h3 className="text-base font-bold text-white">Reiniciar a Trilha?</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              O progresso atual de todos os participantes será resetado e você poderá configurar uma nova rodada com os alunos.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowRestartConfirm(false)}
                className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleRestartConfirm}
                className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-xs font-bold text-white shadow cursor-pointer"
              >
                Sim, Reiniciar
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
                onClick={() => setShowFinishConfirm(false)}
                className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 cursor-pointer"
              >
                Continuar Jogando
              </button>
              <button
                onClick={() => {
                  setShowFinishConfirm(false);
                  setPhase('game_over');
                }}
                className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-xs font-black text-slate-950 shadow-md cursor-pointer"
              >
                Sim, Apurar Resultados
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Game Over / Victory Podium */}
      <GameOverModal
        isOpen={phase === 'game_over'}
        players={players}
        onRestartGame={() => setPhase('setup')}
      />

      {/* Rodapé Oficial da Aplicação */}
      <footer className="w-full py-2 px-4 border-t border-slate-800/80 bg-slate-950/95 text-center text-xs text-slate-400 flex items-center justify-center gap-1.5 backdrop-blur-md z-20 flex-shrink-0 select-none">
        <span>designed by</span>
        <span className="text-amber-400 font-bold tracking-wide">@jlima.trafego</span>
      </footer>
    </div>
  );
}
