import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { 
  Trophy, 
  Award, 
  RotateCcw, 
  Scale, 
  CheckCircle2, 
  HelpCircle, 
  ArrowRight, 
  Sparkles, 
  Eye, 
  ChevronUp, 
  Medal,
  Users,
  Music,
  Upload,
  Flame,
  RefreshCw,
  Lock,
  Crown
} from 'lucide-react';
import { Player } from '../types';
import { sound } from '../utils/audio';
import { CesurgLogo } from './CesurgLogo';

interface GameOverModalProps {
  isOpen: boolean;
  players: Player[];
  onRestartGame: () => void;
  isOnline?: boolean;
  isHost?: boolean;
  onCeremonyStepChange?: (step: CeremonyStep, bottomRevealedCount: number, areFinalistsRevealed: boolean) => void;
  externalCeremonyStep?: CeremonyStep;
  externalBottomRevealedCount?: number;
  externalAreFinalistsRevealed?: boolean;
}

type CeremonyStep = 'bonus_most_answered' | 'bonus_most_correct' | 'bonus_fewest_answered' | 'ranking_reveal';

export const GameOverModal: React.FC<GameOverModalProps> = ({
  isOpen,
  players,
  onRestartGame,
  isOnline = false,
  isHost = true,
  onCeremonyStepChange,
  externalCeremonyStep,
  externalBottomRevealedCount,
  externalAreFinalistsRevealed,
}) => {
  const [currentStep, setCurrentStep] = useState<CeremonyStep>('bonus_most_answered');
  const [bottomRevealedCount, setBottomRevealedCount] = useState<number>(0);
  const [areFinalistsRevealed, setAreFinalistsRevealed] = useState<boolean>(false);
  const [isSuspenseLoading, setIsSuspenseLoading] = useState<boolean>(false);
  const [hasTriggeredChampionEffects, setHasTriggeredChampionEffects] = useState<boolean>(false);
  const [isPlayingSenna, setIsPlayingSenna] = useState<boolean>(false);
  const [customAudioName, setCustomAudioName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Synchronize external online ceremony updates from host
  useEffect(() => {
    if (isOnline && !isHost) {
      if (externalCeremonyStep && externalCeremonyStep !== currentStep) {
        setCurrentStep(externalCeremonyStep);
      }
      if (externalBottomRevealedCount !== undefined && externalBottomRevealedCount !== bottomRevealedCount) {
        setBottomRevealedCount(externalBottomRevealedCount);
      }
      if (externalAreFinalistsRevealed !== undefined && externalAreFinalistsRevealed !== areFinalistsRevealed) {
        setAreFinalistsRevealed(externalAreFinalistsRevealed);
        if (externalAreFinalistsRevealed && !hasTriggeredChampionEffects) {
          setHasTriggeredChampionEffects(true);
          triggerChampionCelebration();
        }
      }
    }
  }, [
    isOnline,
    isHost,
    externalCeremonyStep,
    externalBottomRevealedCount,
    externalAreFinalistsRevealed,
    currentStep,
    bottomRevealedCount,
    areFinalistsRevealed,
    hasTriggeredChampionEffects,
  ]);

  // Compute all bonus categories and final scores
  const evaluation = useMemo(() => {
    // 1. Quem respondeu mais perguntas (pode haver empate)
    const maxAnswered = Math.max(...players.map((p) => p.questionsAnsweredCount || 0), 0);
    const mostAnsweredWinners = players.filter(
      (p) => (p.questionsAnsweredCount || 0) === maxAnswered
    );

    // 2. Quem acertou mais perguntas (pode haver empate)
    const maxCorrect = Math.max(...players.map((p) => p.correctAnswersCount || 0), 0);
    const mostCorrectWinners = players.filter(
      (p) => (p.correctAnswersCount || 0) === maxCorrect
    );

    // 3. Quem respondeu menos perguntas (pode haver empate) - Ajustado com segurança
    const minAnswered = players.length > 0 
      ? Math.min(...players.map((p) => p.questionsAnsweredCount || 0)) 
      : 0;

    const fewestAnsweredWinners = players.filter(
      (p) => (p.questionsAnsweredCount || 0) === minAnswered
    );

    // Calculate final scores for each player
    const playersWithScores = players.map((player) => {
      const gotMostAnswered = mostAnsweredWinners.some((w) => w.id === player.id);
      const gotMostCorrect = mostCorrectWinners.some((w) => w.id === player.id);
      const gotFewestAnswered = fewestAnsweredWinners.some((w) => w.id === player.id);

      const bonusMostAnsweredPts = gotMostAnswered ? 15 : 0;
      const bonusMostCorrectPts = gotMostCorrect ? 15 : 0;
      const bonusFewestAnsweredPts = gotFewestAnswered ? 15 : 0;
      const totalBonusPts = bonusMostAnsweredPts + bonusMostCorrectPts + bonusFewestAnsweredPts;

      // Bonus for reaching finish
      const finishBonus = player.finishRank === 1
        ? 300
        : player.finishRank === 2
        ? 200
        : player.finishRank === 3
        ? 100
        : player.finishRank
        ? 50
        : 0;

      const totalFinalScore = player.points + finishBonus + totalBonusPts;

      return {
        ...player,
        finishBonus,
        gotMostAnswered,
        gotMostCorrect,
        gotFewestAnswered,
        bonusMostAnsweredPts,
        bonusMostCorrectPts,
        bonusFewestAnsweredPts,
        totalBonusPts,
        totalFinalScore,
      };
    });

    // Sort descending by total score, breaking ties by correct answers, then total questions answered
    const rankedDescending = [...playersWithScores].sort((a, b) => {
      if (b.totalFinalScore !== a.totalFinalScore) {
        return b.totalFinalScore - a.totalFinalScore;
      }
      if (b.correctAnswersCount !== a.correctAnswersCount) {
        return b.correctAnswersCount - a.correctAnswersCount;
      }
      return b.questionsAnsweredCount - a.questionsAnsweredCount;
    });

    return {
      maxAnswered,
      mostAnsweredWinners,
      maxCorrect,
      mostCorrectWinners,
      minAnswered,
      fewestAnsweredWinners,
      rankedDescending,
    };
  }, [players]);

  const totalPlayersCount = evaluation.rankedDescending.length;
  const bottomPositionsCount = Math.max(0, totalPlayersCount - 2);

  const bottomList = useMemo(() => {
    if (totalPlayersCount <= 2) return [];
    return evaluation.rankedDescending.slice(2);
  }, [evaluation.rankedDescending, totalPlayersCount]);

  useEffect(() => {
    if (isOpen) {
      setCurrentStep('bonus_most_answered');
      setBottomRevealedCount(0);
      setAreFinalistsRevealed(false);
      setIsSuspenseLoading(false);
      setHasTriggeredChampionEffects(false);
      setIsPlayingSenna(false);
      sound.playAwardTrumpet();
    } else {
      sound.stopSennaVictoryTheme();
      setIsPlayingSenna(false);
    }
    return () => {
      sound.stopSennaVictoryTheme();
    };
  }, [isOpen]);

  const triggerChampionCelebration = () => {
    setIsPlayingSenna(true);
    sound.playSennaVictoryTheme(() => {
      setIsPlayingSenna(false);
    });

    try {
      const duration = 6500;
      const animationEnd = Date.now() + duration;

      const frame = () => {
        confetti({
          particleCount: 6,
          angle: 60,
          spread: 60,
          origin: { x: 0 },
          colors: ['#F59E0B', '#10B981', '#3B82F6', '#EC4899', '#EAB308', '#FFFFFF'],
        });
        confetti({
          particleCount: 6,
          angle: 120,
          spread: 60,
          origin: { x: 1 },
          colors: ['#F59E0B', '#10B981', '#3B82F6', '#EC4899', '#EAB308', '#FFFFFF'],
        });

        if (Date.now() < animationEnd) {
          requestAnimationFrame(frame);
        }
      };
      frame();
    } catch {}
  };

  const handleToggleSennaMusic = () => {
    if (isPlayingSenna) {
      sound.stopSennaVictoryTheme();
      setIsPlayingSenna(false);
    } else {
      setIsPlayingSenna(true);
      sound.playSennaVictoryTheme(() => {
        setIsPlayingSenna(false);
      });
    }
  };

  const handleAudioFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      sound.setCustomVictoryAudio(url);
      setCustomAudioName(file.name);
      setIsPlayingSenna(true);
      sound.playSennaVictoryTheme(() => {
        setIsPlayingSenna(false);
      });
    }
  };

  const handleResetDefaultAudio = () => {
    sound.setCustomVictoryAudio(null);
    setCustomAudioName(null);
    if (isPlayingSenna) {
      sound.playSennaVictoryTheme(() => {
        setIsPlayingSenna(false);
      });
    }
  };

  const changeStep = (newStep: CeremonyStep) => {
    if (isOnline && !isHost) return;
    setCurrentStep(newStep);
    onCeremonyStepChange?.(newStep, bottomRevealedCount, areFinalistsRevealed);
  };

  const handleRevealNext = () => {
    if (bottomRevealedCount < bottomPositionsCount) {
      const nextCount = bottomRevealedCount + 1;
      setBottomRevealedCount(nextCount);
      sound.playRevealSound(nextCount);
      onCeremonyStepChange?.(currentStep, nextCount, areFinalistsRevealed);
    } else if (!areFinalistsRevealed) {
      handleRevealFinalistsTogether();
    }
  };

  const handleRevealFinalistsTogether = () => {
    if (isSuspenseLoading || areFinalistsRevealed) return;
    setIsSuspenseLoading(true);
    sound.playDrumrollSuspense(2.2);

    setTimeout(() => {
      setIsSuspenseLoading(false);
      setAreFinalistsRevealed(true);
      onCeremonyStepChange?.(currentStep, bottomPositionsCount, true);
      if (!hasTriggeredChampionEffects) {
        setHasTriggeredChampionEffects(true);
        triggerChampionCelebration();
      }
    }, 2200);
  };

  const handleRevealAll = () => {
    setBottomRevealedCount(bottomPositionsCount);
    setAreFinalistsRevealed(true);
    onCeremonyStepChange?.(currentStep, bottomPositionsCount, true);
    if (!hasTriggeredChampionEffects) {
      setHasTriggeredChampionEffects(true);
      setTimeout(triggerChampionCelebration, 300);
    }
  };

  if (!isOpen) return null;

  const firstPlace = evaluation.rankedDescending[0];
  const secondPlace = evaluation.rankedDescending[1];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-3 bg-slate-950/94 backdrop-blur-xl">
      <motion.div
        initial={{ scale: 0.92, opacity: 0, y: 15 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="w-full max-w-5xl bg-slate-900 border-2 border-amber-500/40 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden my-auto p-3 sm:p-4.5 relative flex flex-col justify-between max-h-[96vh]"
      >
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-4/5 h-24 bg-gradient-to-b from-amber-500/15 via-yellow-500/5 to-transparent blur-2xl pointer-events-none" />

        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleAudioFileUpload} 
          accept="audio/*" 
          className="hidden" 
        />

        <div className="text-center space-y-1.5 mb-2.5 flex-shrink-0 relative z-10">
          <div className="flex items-center justify-between gap-2 px-1">
            <CesurgLogo height={32} className="opacity-95 drop-shadow-sm flex-shrink-0" />
             
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#20140D] border border-amber-400/40 text-amber-300 text-[11px] font-medium shadow-sm">
              <Scale className="w-3 h-3 text-amber-400" />
              <span>Prática do Trabalho <span className="text-amber-500/50 mx-1">•</span> Prof. Ma. Giulia Signor</span>
            </div>

            <div className="text-[11px] text-slate-400 hidden sm:flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-slate-400" />
              <span>{totalPlayersCount} juristas</span>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-1 sm:gap-1.5 max-w-2xl mx-auto pt-0.5">
            <button
              type="button"
              onClick={() => changeStep('bonus_most_answered')}
              className={`p-1 sm:p-1.5 rounded-lg text-center border transition-all cursor-pointer ${
                currentStep === 'bonus_most_answered'
                  ? 'bg-amber-500/20 border-amber-400 text-white shadow-sm'
                  : 'bg-slate-800/50 border-slate-700/60 text-slate-400 hover:text-slate-200'
              }`}
            >
              <span className="text-[10px] font-black block leading-none">Bônus 1</span>
              <span className="text-[9px] truncate block mt-0.5 font-medium">Mais Respondeu</span>
            </button>

            <button
              type="button"
              onClick={() => changeStep('bonus_most_correct')}
              className={`p-1 sm:p-1.5 rounded-lg text-center border transition-all cursor-pointer ${
                currentStep === 'bonus_most_correct'
                  ? 'bg-amber-500/20 border-amber-400 text-white shadow-sm'
                  : 'bg-slate-800/50 border-slate-700/60 text-slate-400 hover:text-slate-200'
              }`}
            >
              <span className="text-[10px] font-black block leading-none">Bônus 2</span>
              <span className="text-[9px] truncate block mt-0.5 font-medium">Mais Acertou</span>
            </button>

            <button
              type="button"
              onClick={() => changeStep('bonus_fewest_answered')}
              className={`p-1 sm:p-1.5 rounded-lg text-center border transition-all cursor-pointer ${
                currentStep === 'bonus_fewest_answered'
                  ? 'bg-amber-500/20 border-amber-400 text-white shadow-sm'
                  : 'bg-slate-800/50 border-slate-700/60 text-slate-400 hover:text-slate-200'
              }`}
            >
              <span className="text-[10px] font-black block leading-none">Bônus 3</span>
              <span className="text-[9px] truncate block mt-0.5 font-medium">Menos Respondeu</span>
            </button>

            <button
              type="button"
              onClick={() => changeStep('ranking_reveal')}
              className={`p-1 sm:p-1.5 rounded-lg text-center border transition-all cursor-pointer ${
                currentStep === 'ranking_reveal'
                  ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 border-amber-300 font-bold shadow'
                  : 'bg-slate-800/50 border-slate-700/60 text-slate-400 hover:text-slate-200'
              }`}
            >
              <span className="text-[10px] font-black block leading-none">🏆 Pódio & Ranking</span>
              <span className="text-[9px] truncate block mt-0.5 font-medium">1º e 2º Juntos</span>
            </button>
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto px-1 py-1 relative z-10">
          <AnimatePresence mode="wait">
            {currentStep === 'bonus_most_answered' && (
              <motion.div
                key="step-bonus-1"
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -15 }}
                className="space-y-3 text-center py-1"
              >
                <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-slate-800/90 border border-slate-700 text-slate-300 text-xs font-semibold">
                  <span>🔒</span>
                  <span>O ranking geral permanece oculto durante a apuração dos bônus extras</span>
                </div>

                <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/20 via-slate-800/80 to-slate-900 border-2 border-amber-400/60 shadow-xl max-w-xl mx-auto space-y-2.5">
                  <div className="w-12 h-12 mx-auto rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400 shadow-md">
                    <HelpCircle className="w-6 h-6" />
                  </div>

                  <div>
                    <span className="text-[10px] font-black text-amber-400 uppercase tracking-wider block">
                      Bônus Extra 1 de 3
                    </span>
                    <h3 className="text-lg sm:text-xl font-black text-white font-display mt-0.5">
                      Quem Respondeu Mais Perguntas
                    </h3>
                    <p className="text-xs text-slate-300 mt-0.5 max-w-md mx-auto">
                      Reconhecimento pelo alto volume de desafios enfrentados na CLT e CF/88.
                    </p>
                  </div>

                  <div className="inline-block bg-amber-400 text-slate-950 px-3 py-0.5 rounded-full font-black text-xs shadow-md shadow-amber-500/30">
                    +15 PONTOS EXTRAS
                  </div>

                  <div className="pt-2 border-t border-slate-700/60 mt-2 space-y-1.5">
                    <div className="flex items-center justify-center gap-1 text-xs text-amber-300 font-bold">
                      <Sparkles className="w-3 h-3" />
                      {evaluation.mostAnsweredWinners.length > 1 ? (
                        <span>Empate técnico! ({evaluation.mostAnsweredWinners.length} juristas empatados com {evaluation.maxAnswered} perguntas)</span>
                      ) : (
                        <span>Jurista Vencedor(a) ({evaluation.maxAnswered} perguntas respondidas)</span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      {evaluation.mostAnsweredWinners.map((w) => (
                        <div
                          key={w.id}
                          className="flex items-center justify-between p-2 rounded-xl bg-slate-900/90 border border-amber-400/50 shadow-sm"
                        >
                          <div className="flex items-center gap-2 text-left min-w-0">
                            <div
                              className="w-7 h-7 rounded-lg flex items-center justify-center text-sm font-bold text-white shadow-sm flex-shrink-0"
                              style={{ backgroundColor: w.color }}
                            >
                              {w.avatar}
                            </div>
                            <div className="min-w-0">
                              <h4 className="text-xs font-bold text-white truncate">{w.name}</h4>
                              <span className="text-[10px] text-slate-400 block truncate">
                                {w.questionsAnsweredCount} perguntas
                              </span>
                            </div>
                          </div>
                          <span className="text-xs font-black text-amber-400 bg-amber-500/20 px-2 py-0.5 rounded-lg border border-amber-500/40 flex-shrink-0">
                            +15 pts
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-1">
                  <button
                    type="button"
                    id="btn-next-bonus-1"
                    onClick={() => {
                      changeStep('bonus_most_correct');
                      sound.playAwardTrumpet();
                    }}
                    className="px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 shadow-md shadow-amber-500/25 active:scale-95 transition-all inline-flex items-center gap-2 cursor-pointer font-display"
                  >
                    <span>Avançar para o 2º Bônus: Quem Mais Acertou</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}

            {currentStep === 'bonus_most_correct' && (
              <motion.div
                key="step-bonus-2"
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -15 }}
                className="space-y-3 text-center py-1"
              >
                <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-slate-800/90 border border-slate-700 text-slate-300 text-xs font-semibold">
                  <span>🔒</span>
                  <span>O ranking geral permanece oculto durante a apuração dos bônus extras</span>
                </div>

                <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500/20 via-slate-800/80 to-slate-900 border-2 border-emerald-400/60 shadow-xl max-w-xl mx-auto space-y-2.5">
                  <div className="w-12 h-12 mx-auto rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400 shadow-md">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>

                  <div>
                    <span className="text-[10px] font-black text-emerald-400 uppercase tracking-wider block">
                      Bônus Extra 2 de 3
                    </span>
                    <h3 className="text-lg sm:text-xl font-black text-white font-display mt-0.5">
                      Quem Acertou Mais Perguntas
                    </h3>
                    <p className="text-xs text-slate-300 mt-0.5 max-w-md mx-auto">
                      Homenagem à precisão dogmática e domínio das teses doutrinárias e do TST.
                    </p>
                  </div>

                  <div className="inline-block bg-emerald-400 text-slate-950 px-3 py-0.5 rounded-full font-black text-xs shadow-md shadow-emerald-500/30">
                    +15 PONTOS EXTRAS
                  </div>

                  <div className="pt-2 border-t border-slate-700/60 mt-2 space-y-1.5">
                    <div className="flex items-center justify-center gap-1 text-xs text-emerald-300 font-bold">
                      <Sparkles className="w-3 h-3" />
                      {evaluation.mostCorrectWinners.length > 1 ? (
                        <span>Empate técnico! ({evaluation.mostCorrectWinners.length} juristas com {evaluation.maxCorrect} acertos)</span>
                      ) : (
                        <span>Jurista Vencedor(a) ({evaluation.maxCorrect} respostas corretas)</span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      {evaluation.mostCorrectWinners.map((w) => (
                        <div
                          key={w.id}
                          className="flex items-center justify-between p-2 rounded-xl bg-slate-900/90 border border-emerald-400/50 shadow-sm"
                        >
                          <div className="flex items-center gap-2 text-left min-w-0">
                            <div
                              className="w-7 h-7 rounded-lg flex items-center justify-center text-sm font-bold text-white shadow-sm flex-shrink-0"
                              style={{ backgroundColor: w.color }}
                            >
                              {w.avatar}
                            </div>
                            <div className="min-w-0">
                              <h4 className="text-xs font-bold text-white truncate">{w.name}</h4>
                              <span className="text-[10px] text-slate-400 block truncate">
                                {w.correctAnswersCount} acertos comprovados
                              </span>
                            </div>
                          </div>
                          <span className="text-xs font-black text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-lg border border-emerald-500/40 flex-shrink-0">
                            +15 pts
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-1">
                  <button
                    type="button"
                    id="btn-next-bonus-2"
                    onClick={() => {
                      changeStep('bonus_fewest_answered');
                      sound.playAwardTrumpet();
                    }}
                    className="px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm bg-gradient-to-r from-emerald-400 to-emerald-500 hover:from-emerald-300 hover:to-emerald-400 text-slate-950 shadow-md shadow-emerald-500/25 active:scale-95 transition-all inline-flex items-center gap-2 cursor-pointer font-display"
                  >
                    <span>Avançar para o 3º Bônus: Quem Menos Respondeu</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}

            {currentStep === 'bonus_fewest_answered' && (
              <motion.div
                key="step-bonus-3"
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -15 }}
                className="space-y-3 text-center py-1"
              >
                <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-slate-800/90 border border-slate-700 text-slate-300 text-xs font-semibold">
                  <span>🔒</span>
                  <span>O ranking geral permanece oculto durante a apuração dos bônus extras</span>
                </div>

                <div className="p-4 rounded-2xl bg-gradient-to-br from-cyan-500/20 via-slate-800/80 to-slate-900 border-2 border-cyan-400/60 shadow-xl max-w-xl mx-auto space-y-2.5">
                  <div className="w-12 h-12 mx-auto rounded-xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-400 shadow-md">
                    <Sparkles className="w-6 h-6" />
                  </div>

                  <div>
                    <span className="text-[10px] font-black text-cyan-400 uppercase tracking-wider block">
                      Bônus Extra 3 de 3
                    </span>
                    <h3 className="text-lg sm:text-xl font-black text-white font-display mt-0.5">
                      Quem Respondeu Menos Perguntas
                    </h3>
                    <p className="text-xs text-slate-300 mt-0.5 max-w-md mx-auto">
                      Bonificação especial da sorte e agilidade na trilha de casas.
                    </p>
                  </div>

                  <div className="inline-block bg-cyan-400 text-slate-950 px-3 py-0.5 rounded-full font-black text-xs shadow-md shadow-cyan-500/30">
                    +15 PONTOS EXTRAS
                  </div>

                  <div className="pt-2 border-t border-slate-700/60 mt-2 space-y-1.5">
                    <div className="flex items-center justify-center gap-1 text-xs text-cyan-300 font-bold">
                      <Sparkles className="w-3 h-3" />
                      {evaluation.fewestAnsweredWinners.length > 1 ? (
                        <span>Empate! ({evaluation.fewestAnsweredWinners.length} juristas com apenas {evaluation.minAnswered} perguntas)</span>
                      ) : (
                        <span>Jurista Contemplado(a) (apenas {evaluation.minAnswered} perguntas)</span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      {evaluation.fewestAnsweredWinners.map((w) => (
                        <div
                          key={w.id}
                          className="flex items-center justify-between p-2 rounded-xl bg-slate-900/90 border border-cyan-400/50 shadow-sm"
                        >
                          <div className="flex items-center gap-2 text-left min-w-0">
                            <div
                              className="w-7 h-7 rounded-lg flex items-center justify-center text-sm font-bold text-white shadow-sm flex-shrink-0"
                              style={{ backgroundColor: w.color }}
                            >
                              {w.avatar}
                            </div>
                            <div className="min-w-0">
                              <h4 className="text-xs font-bold text-white truncate">{w.name}</h4>
                              <span className="text-[10px] text-slate-400 block truncate">
                                {w.questionsAnsweredCount} perguntas
                              </span>
                            </div>
                          </div>
                          <span className="text-xs font-black text-cyan-400 bg-cyan-500/20 px-2 py-0.5 rounded-lg border border-cyan-500/40 flex-shrink-0">
                            +15 pts
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-1">
                  <button
                    type="button"
                    id="btn-next-to-ranking"
                    onClick={() => {
                      changeStep('ranking_reveal');
                      sound.playRevealSound(1);
                    }}
                    className="px-6 py-2.5 rounded-xl font-bold text-xs sm:text-sm bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 shadow-lg shadow-amber-500/30 active:scale-95 transition-all inline-flex items-center gap-2 cursor-pointer font-display animate-pulse"
                  >
                    <Trophy className="w-4 h-4" />
                    <span>Apurar Pontuação e Iniciar Revelação do Ranking</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}

            {currentStep === 'ranking_reveal' && (
              <motion.div
                key="step-ranking-reveal"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-2 py-0.5"
              >
                <div className="flex flex-col sm:flex-row items-center justify-between gap-1.5 border-b border-slate-800 pb-2">
                  <div className="text-center sm:text-left">
                    <h3 className="text-base sm:text-lg font-black text-white font-display flex items-center gap-1.5 justify-center sm:justify-start">
                      <Trophy className="w-4 h-4 text-amber-400" />
                      <span>Classificação Final • Revelação de Baixo para Cima</span>
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      {areFinalistsRevealed
                        ? 'Todas as posições consagradas!'
                        : bottomRevealedCount < bottomPositionsCount
                        ? `Revelando posições anteriores (${bottomRevealedCount} de ${bottomPositionsCount} reveladas) antes do duelo final`
                        : '🔥 Atenção: 1º e 2º colocado prontos para revelação conjunta com suspense!'}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap justify-center">
                    {isOnline && !isHost ? (
                      <div className="px-3.5 py-1.5 rounded-xl bg-amber-500/15 border border-amber-400/40 text-amber-300 text-xs font-semibold flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                        <span>Aguardando o professor(a) avançar a revelação do pódio... 🥁</span>
                      </div>
                    ) : !areFinalistsRevealed ? (
                      <>
                        {bottomRevealedCount < bottomPositionsCount ? (
                          <button
                            type="button"
                            id="btn-reveal-next-position"
                            onClick={handleRevealNext}
                            className="px-3.5 py-1.5 rounded-xl font-bold text-xs bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-md active:scale-95 transition-all flex items-center gap-1 cursor-pointer font-display"
                          >
                            <ChevronUp className="w-3.5 h-3.5" />
                            <span>
                              {bottomRevealedCount === 0
                                ? `Revelar Último (${totalPlayersCount}º Lugar)`
                                : bottomRevealedCount === bottomPositionsCount - 1
                                ? `Revelar 3º Lugar (Bronze)`
                                : `Revelar Próximo (${totalPlayersCount - bottomRevealedCount}º Lugar)`}
                            </span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            id="btn-reveal-finalists-together"
                            onClick={handleRevealFinalistsTogether}
                            disabled={isSuspenseLoading}
                            className="px-4 py-1.5 rounded-xl font-black text-xs bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:to-yellow-300 text-slate-950 shadow-lg shadow-amber-500/35 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer font-display animate-bounce"
                          >
                            <Flame className="w-3.5 h-3.5 text-amber-950 fill-amber-950" />
                            <span>{isSuspenseLoading ? '🥁 Suspense na Turma...' : '⚡ Revelar 1º e 2º Colocados JUNTOS!'}</span>
                          </button>
                        )}

                        <button
                          type="button"
                          id="btn-reveal-all-positions"
                          onClick={handleRevealAll}
                          className="px-2.5 py-1.5 rounded-xl font-semibold text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 active:scale-95 transition-all flex items-center gap-1 cursor-pointer"
                        >
                          <Eye className="w-3 h-3" />
                          <span>Revelar Todos</span>
                        </button>
                      </>
                    ) : (
                      <div className="flex items-center gap-2">
                        <div className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[11px] font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Pódio consagrado com sucesso!</span>
                        </div>

                        <button
                          type="button"
                          id="btn-toggle-senna-theme-header"
                          onClick={handleToggleSennaMusic}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all shadow cursor-pointer ${
                            isPlayingSenna
                              ? 'bg-amber-400 text-slate-950 ring-1 ring-amber-300 animate-pulse'
                              : 'bg-slate-800 text-amber-300 hover:bg-slate-700 border border-amber-400/40'
                          }`}
                          title="Tocar ou Pausar o Tema da Vitória"
                        >
                          <Music className="w-3 h-3" />
                          <span>{isPlayingSenna ? 'Tema Tocando 🏁' : 'Tocar Tema 🏁'}</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {areFinalistsRevealed ? (
                  <motion.div
                    initial={{ scale: 0.94, opacity: 0, y: -10 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, type: 'spring', stiffness: 200 }}
                    className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3"
                  >
                    <div className="p-2.5 sm:p-3 rounded-2xl bg-gradient-to-br from-amber-500/25 via-yellow-500/15 to-slate-900 border-2 border-amber-400 shadow-xl relative overflow-hidden flex flex-col justify-between">
                      <div className="absolute -top-6 -right-6 w-24 h-24 bg-amber-400/15 rounded-full blur-xl pointer-events-none" />

                      <div>
                        <div className="flex items-center justify-between gap-1.5 mb-1.5">
                          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black uppercase tracking-wider shadow-sm">
                            <Crown className="w-3 h-3 fill-slate-950" />
                            <span>1º Lugar • Grande Campeão(ã)</span>
                          </div>

                          <span className="text-xs font-black text-amber-300 font-display">
                            Taça de Ouro 🏆
                          </span>
                        </div>

                        <div className="flex items-center gap-2.5">
                          <div
                            className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center text-xl shadow-md border-2 border-amber-300 flex-shrink-0"
                            style={{ backgroundColor: firstPlace?.color }}
                          >
                            {firstPlace?.avatar}
                          </div>

                          <div className="min-w-0 flex-1">
                            <h4 className="text-sm sm:text-base font-black text-white truncate font-display">
                              {firstPlace?.name}
                            </h4>
                            <p className="text-[10px] text-slate-300 truncate">
                              {firstPlace?.role || 'Jurista Trabalhista'}
                            </p>
                          </div>

                          <div className="text-right bg-slate-900/90 px-2.5 py-1 rounded-xl border border-amber-400/50 flex-shrink-0">
                            <span className="text-[8px] text-slate-400 uppercase font-bold block leading-none">Pontuação Final</span>
                            <span className="text-base sm:text-lg font-black text-amber-400 leading-none mt-0.5 block font-display">
                              {firstPlace?.totalFinalScore} pts
                            </span>
                          </div>
                        </div>

                        <div className="mt-2 pt-2 border-t border-amber-500/20 flex items-center justify-between gap-1 flex-wrap">
                          <div className="flex items-center gap-1 flex-wrap">
                            <span className="text-[9px] text-slate-400 font-bold uppercase">Bônus:</span>
                            {firstPlace?.finishBonus > 0 && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/25 text-amber-300 font-bold border border-amber-500/35">
                                +{firstPlace.finishBonus} Chegada
                              </span>
                            )}
                            {firstPlace?.gotMostAnswered && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/25 text-amber-300 font-bold border border-amber-500/35">
                                +15 Mais Perguntas
                              </span>
                            )}
                            {firstPlace?.gotMostCorrect && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/25 text-emerald-300 font-bold border border-emerald-500/35">
                                +15 Mais Acertos
                              </span>
                            )}
                            {firstPlace?.gotFewestAnswered && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-500/25 text-cyan-300 font-bold border border-cyan-500/35">
                                +15 Menos Perguntas
                              </span>
                            )}
                          </div>

                          <span className="text-[9px] text-slate-400">
                            ({firstPlace?.points} tab. + {firstPlace?.finishBonus + firstPlace?.totalBonusPts} bônus)
                          </span>
                        </div>
                      </div>

                      <div className="mt-2 pt-1.5 border-t border-amber-500/20 flex items-center justify-between gap-2 flex-wrap text-[10px]">
                        <button
                          type="button"
                          onClick={handleToggleSennaMusic}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold transition-all shadow cursor-pointer ${
                            isPlayingSenna
                              ? 'bg-amber-400 text-slate-950 ring-2 ring-amber-300 animate-pulse'
                              : 'bg-slate-800 text-amber-300 hover:bg-slate-700 border border-amber-400/40'
                          }`}
                        >
                          <Music className="w-3 h-3 text-amber-400" />
                          <span>{isPlayingSenna ? 'Tema da Vitória Tocando 🏁' : 'Tocar Tema da Vitória 🏁'}</span>
                        </button>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="text-[9px] text-slate-400 hover:text-amber-300 underline inline-flex items-center gap-0.5 cursor-pointer"
                          >
                            <Upload className="w-2.5 h-2.5" />
                            <span>{customAudioName ? 'Trocar MP3' : 'Usar outro áudio'}</span>
                          </button>

                          {customAudioName && (
                            <button
                              type="button"
                              onClick={handleResetDefaultAudio}
                              className="text-[9px] text-slate-400 hover:text-rose-300 underline inline-flex items-center gap-0.5 cursor-pointer ml-1"
                            >
                              <RefreshCw className="w-2.5 h-2.5" />
                              <span>Restaurar</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="p-2.5 sm:p-3 rounded-2xl bg-gradient-to-br from-slate-700/30 via-slate-800/40 to-slate-900 border-2 border-slate-300/80 shadow-xl relative overflow-hidden flex flex-col justify-between">
                      <div className="absolute -top-6 -right-6 w-24 h-24 bg-slate-300/10 rounded-full blur-xl pointer-events-none" />

                      <div>
                        <div className="flex items-center justify-between gap-1.5 mb-1.5">
                          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-200 text-slate-950 text-[10px] font-black uppercase tracking-wider shadow-sm">
                            <Medal className="w-3 h-3 fill-slate-950" />
                            <span>2º Lugar • Vice-Campeão(ã)</span>
                          </div>

                          <span className="text-xs font-black text-slate-300 font-display">
                            Medalha de Prata 🥈
                          </span>
                        </div>

                        <div className="flex items-center gap-2.5">
                          <div
                            className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center text-xl shadow-md border-2 border-slate-300 flex-shrink-0"
                            style={{ backgroundColor: secondPlace?.color }}
                          >
                            {secondPlace?.avatar}
                          </div>

                          <div className="min-w-0 flex-1">
                            <h4 className="text-sm sm:text-base font-black text-white truncate font-display">
                              {secondPlace?.name}
                            </h4>
                            <p className="text-[10px] text-slate-300 truncate">
                              {secondPlace?.role || 'Jurista Trabalhista'}
                            </p>
                          </div>

                          <div className="text-right bg-slate-900/90 px-2.5 py-1 rounded-xl border border-slate-400/50 flex-shrink-0">
                            <span className="text-[8px] text-slate-400 uppercase font-bold block leading-none">Pontuação Final</span>
                            <span className="text-base sm:text-lg font-black text-slate-200 leading-none mt-0.5 block font-display">
                              {secondPlace?.totalFinalScore} pts
                            </span>
                          </div>
                        </div>

                        <div className="mt-2 pt-2 border-t border-slate-700/60 flex items-center justify-between gap-1 flex-wrap">
                          <div className="flex items-center gap-1 flex-wrap">
                            <span className="text-[9px] text-slate-400 font-bold uppercase">Bônus:</span>
                            {secondPlace?.finishBonus > 0 && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-700/50 text-slate-200 font-bold border border-slate-600">
                                +{secondPlace.finishBonus} Chegada
                              </span>
                            )}
                            {secondPlace?.gotMostAnswered && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/25 text-amber-300 font-bold border border-amber-500/35">
                                +15 Mais Perguntas
                              </span>
                            )}
                            {secondPlace?.gotMostCorrect && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/25 text-emerald-300 font-bold border border-emerald-500/35">
                                +15 Mais Acertos
                              </span>
                            )}
                            {secondPlace?.gotFewestAnswered && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-500/25 text-cyan-300 font-bold border border-cyan-500/35">
                                +15 Menos Perguntas
                              </span>
                            )}
                          </div>

                          <span className="text-[9px] text-slate-400">
                            ({secondPlace?.points} tab. + {secondPlace?.finishBonus + secondPlace?.totalBonusPts} bônus)
                          </span>
                        </div>
                      </div>

                      <div className="mt-2 pt-1.5 border-t border-slate-700/60 flex items-center justify-between text-[10px] text-slate-400">
                        <span>Desempenho de excelência jurídica</span>
                        <span className="font-bold text-slate-300">Diferença: {(firstPlace?.totalFinalScore || 0) - (secondPlace?.totalFinalScore || 0)} pts</span>
                      </div>
                    </div>
                  </motion.div>
                ) : isSuspenseLoading ? (
                  <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/20 via-yellow-500/30 to-amber-500/20 border-2 border-amber-400 shadow-2xl text-center space-y-2 animate-pulse"
                  >
                    <div className="flex items-center justify-center gap-2 text-amber-400 font-black text-sm tracking-wider uppercase">
                      <Flame className="w-5 h-5 text-amber-400 animate-bounce" />
                      <span>Duelo Final pelo Título • Apurando 1º e 2º Colocados</span>
                      <Flame className="w-5 h-5 text-amber-400 animate-bounce" />
                    </div>
                    <h4 className="text-xl sm:text-2xl font-black text-white font-display">
                      🥁 Segurem a Respiração! Quem Levou a Melhor?!
                    </h4>
                    <p className="text-xs text-amber-200">
                      Consagrando Campeão e Vice-Campeão juntos neste exato instante...
                    </p>
                  </motion.div>
                ) : (
                  <div className="p-3 rounded-2xl bg-slate-900/60 border border-dashed border-amber-500/40 text-center flex flex-col sm:flex-row items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-left">
                      <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center flex-shrink-0">
                        <Lock className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs sm:text-sm font-bold text-amber-300">
                          Duelo Final (1º e 2º Colocados Ocultos para Máximo Suspense)
                        </h4>
                        <p className="text-[10px] text-slate-400">
                          {bottomRevealedCount < bottomPositionsCount
                            ? 'Revele os colocados de baixo para cima antes de coroar os dois grandes finalistas!'
                            : '⚡ Posições anteriores apuradas! Clique no botão de suspense para revelar o 1º e 2º lugar juntos!'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <span className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-800 text-amber-400 font-mono font-bold border border-slate-700">
                        🥇 1º & 🥈 2º Lugar
                      </span>
                    </div>
                  </div>
                )}

                {bottomList.length > 0 && (
                  <div className="space-y-1 pt-1">
                    <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
                      <span className="font-bold flex items-center gap-1">
                        <Medal className="w-3.5 h-3.5 text-amber-500" />
                        <span>Demais Posições da Turma (Ordem Revelada de Baixo para Cima)</span>
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {bottomRevealedCount} de {bottomPositionsCount} posições abertas
                      </span>
                    </div>

                    <div className={`grid gap-1.5 ${
                      bottomList.length <= 3 
                        ? 'grid-cols-1 sm:grid-cols-3' 
                        : bottomList.length <= 6 
                        ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3' 
                        : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
                    }`}>
                      {bottomList.map((player, idx) => {
                        const rankNumber = idx + 3;
                        const isRevealed = (bottomPositionsCount - 1 - idx) < bottomRevealedCount || areFinalistsRevealed;
                        const isBronze = rankNumber === 3;

                        if (!isRevealed) {
                          return (
                            <div
                              key={`hidden-rank-${rankNumber}`}
                              className="p-1.5 sm:p-2 rounded-xl border border-slate-800/60 bg-slate-900/40 flex items-center justify-between opacity-55 select-none"
                            >
                              <div className="flex items-center gap-2">
                                <span className="w-6 h-6 rounded-md bg-slate-800 text-slate-500 font-black text-[11px] flex items-center justify-center">
                                  {rankNumber}º
                                </span>
                                <span className="text-[11px] text-slate-500 italic">
                                  Posição Oculta
                                </span>
                              </div>
                              <span className="text-slate-600 font-mono text-[11px]">??? pts</span>
                            </div>
                          );
                        }

                        return (
                          <motion.div
                            key={player.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className={`p-1.5 sm:p-2 rounded-xl border flex items-center justify-between gap-1.5 transition-all ${
                              isBronze
                                ? 'bg-amber-950/25 border-amber-700/60 shadow-sm'
                                : 'bg-slate-800/40 border-slate-800/90'
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              <span
                                className={`w-6 h-6 rounded-md text-[11px] font-black flex items-center justify-center flex-shrink-0 shadow border ${
                                  isBronze
                                    ? 'bg-amber-700 text-white border-amber-600'
                                    : 'bg-slate-800 text-slate-400 border-slate-700'
                                }`}
                              >
                                {rankNumber}º
                              </span>

                              <div
                                className="w-6 h-6 rounded-md flex items-center justify-center text-xs shadow flex-shrink-0"
                                style={{ backgroundColor: player.color }}
                              >
                                {player.avatar}
                              </div>

                              <div className="min-w-0 flex-1">
                                <h4 className="text-xs font-bold text-white truncate leading-tight">
                                  {player.name}
                                </h4>
                                <div className="flex items-center gap-1 text-[9px] text-slate-400 truncate">
                                  {player.finishBonus > 0 && (
                                    <span className="text-amber-300 font-semibold">
                                      +{player.finishBonus} cheg.
                                    </span>
                                  )}
                                  {player.gotMostAnswered && (
                                    <span className="text-amber-300 font-semibold">+15 resp.</span>
                                  )}
                                  {player.gotMostCorrect && (
                                    <span className="text-emerald-300 font-semibold">+15 acert.</span>
                                  )}
                                  {player.gotFewestAnswered && (
                                    <span className="text-cyan-300 font-semibold">+15 menos resp.</span>
                                  )}
                                  {player.finishBonus === 0 && player.totalBonusPts === 0 && (
                                    <span className="text-slate-500">Sem bônus</span>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="text-right flex-shrink-0 pl-1">
                              <span className={`text-xs sm:text-sm font-black block leading-none ${
                                isBronze ? 'text-amber-400' : 'text-slate-200'
                              }`}>
                                {player.totalFinalScore} pts
                              </span>
                              <span className="text-[8px] text-slate-500 block leading-none mt-0.5">
                                {player.points}+{player.finishBonus + player.totalBonusPts}
                              </span>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="border-t border-slate-800 pt-2.5 mt-1.5 flex flex-wrap items-center justify-between gap-2 flex-shrink-0 relative z-10">
          {currentStep === 'ranking_reveal' ? (
            <button
              type="button"
              id="btn-revisit-bonuses"
              onClick={() => setCurrentStep('bonus_most_answered')}
              className="px-2.5 py-1.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition-all flex items-center gap-1 cursor-pointer"
            >
              <Award className="w-3.5 h-3.5 text-amber-400" />
              <span>Rever Bônus</span>
            </button>
          ) : (
            <div className="text-[11px] text-slate-400 flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-slate-400" />
              <span>{players.length} juristas competindo</span>
            </div>
          )}

          <div className="flex items-center gap-2.5">
            <span className="text-[10px] text-slate-500 hidden sm:inline select-none">
              designed by <strong className="text-amber-400/90 font-semibold">@jlima.trafego</strong>
            </span>
            <button
              type="button"
              id="btn-restart-from-gameover"
              onClick={() => {
                sound.stopSennaVictoryTheme();
                onRestartGame();
              }}
              className="px-4 py-2 rounded-xl font-bold text-xs sm:text-sm bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-md shadow-amber-500/20 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer font-display"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Nova Partida com a Turma</span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
