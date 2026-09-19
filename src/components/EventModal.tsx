import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  HelpCircle, 
  CheckCircle2, 
  XCircle, 
  ArrowRight, 
  Trophy, 
  FileText,
  Zap,
  Footprints,
  Clock,
  UserCheck,
  Check,
  Loader2
} from 'lucide-react';
import { LawGameEvent, Player, Tile, QuestionOption, EventChoice, ActiveQuestionAnswer } from '../types';
import { sound } from '../utils/audio';

interface EventModalProps {
  isOpen: boolean;
  event: LawGameEvent | null;
  player: Player;
  tile: Tile;
  onResolve: (outcome: {
    pointsDelta: number;
    reputationDelta: number;
    moveStepsDelta?: number;
    skipTurn?: boolean;
    achievement?: string;
    chosenText?: string;
    wasCorrect?: boolean;
    isQuestion?: boolean;
  }) => void;
  isOnline?: boolean;
  isMyTurn?: boolean;
  isHost?: boolean;
  activeQuestionAnswer?: ActiveQuestionAnswer | null;
  onSubmitOnlineAnswer?: (optionId: string, optionText: string) => Promise<{ ok: boolean; error?: string }>;
  onContinueOnline?: () => void;
}

export const EventModal: React.FC<EventModalProps> = ({
  isOpen,
  event,
  player,
  tile,
  onResolve,
  isOnline = false,
  isMyTurn = true,
  isHost = false,
  activeQuestionAnswer = null,
  onSubmitOnlineAnswer,
  onContinueOnline,
}) => {
  // Local question state for offline / optimistic selection
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState<boolean>(false);
  const [isCorrectAnswer, setIsCorrectAnswer] = useState<boolean>(false);
  const [isPendingSubmit, setIsPendingSubmit] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Bonus choice state: 'points' (+15 pts) or 'steps' (+2 casas)
  const [bonusChoice, setBonusChoice] = useState<'points' | 'steps'>('points');

  // Dilemma state
  const [selectedChoice, setSelectedChoice] = useState<EventChoice | null>(null);

  useEffect(() => {
    if (isOpen && event) {
      setSelectedOptionId(null);
      setIsAnswerSubmitted(false);
      setIsCorrectAnswer(false);
      setIsPendingSubmit(false);
      setSubmitError(null);
      setSelectedChoice(null);
      setBonusChoice('points');

      if (event.type === 'bonus') {
        sound.playCashSound();
      } else {
        sound.playStepSound();
      }
    }
  }, [isOpen, event?.id]);

  // Synchronize when activeQuestionAnswer is received from server
  useEffect(() => {
    if (activeQuestionAnswer) {
      setIsAnswerSubmitted(true);
      setIsCorrectAnswer(activeQuestionAnswer.isCorrect);
      setIsPendingSubmit(false);
    }
  }, [activeQuestionAnswer]);

  if (!isOpen || !event) return null;

  // Effective answer state (derived from server if online, or local if offline)
  const isQuestionAnswered = isOnline ? !!activeQuestionAnswer : isAnswerSubmitted;
  const answeredOptionId = isOnline
    ? activeQuestionAnswer?.selectedOptionId
    : selectedOptionId;
  const answeredOptionText = isOnline
    ? activeQuestionAnswer?.selectedOptionText
    : event.question?.options.find((o) => o.id === selectedOptionId)?.text;
  const isAnswerCorrect = isOnline
    ? !!activeQuestionAnswer?.isCorrect
    : isCorrectAnswer;
  const answeredByName = isOnline
    ? activeQuestionAnswer?.playerName || player.name
    : player.name;

  // Handle Question Option Selection (Purely local state for active player before confirmation)
  const handleSelectOption = (option: QuestionOption) => {
    if (isQuestionAnswered || isPendingSubmit) return;
    if (isOnline && !isMyTurn) return;

    // Immediately select alternative locally
    setSelectedOptionId(option.id);
  };

  // Submit Question Answer (Offline Mode)
  const handleSubmitAnswerOffline = () => {
    if (!event.question || !selectedOptionId || isAnswerSubmitted) return;

    const chosen = event.question.options.find((opt) => opt.id === selectedOptionId);
    const correct = !!chosen?.isCorrect;

    setIsAnswerSubmitted(true);
    setIsCorrectAnswer(correct);

    if (correct) {
      sound.playCashSound();
    } else {
      sound.playLossSound();
    }
  };

  // Confirm Question Answer (Unified for Online and Offline)
  const handleConfirmAnswer = async () => {
    if (!event.question || !selectedOptionId || isQuestionAnswered || isPendingSubmit) return;

    const chosen = event.question.options.find((opt) => opt.id === selectedOptionId);
    if (!chosen) return;

    if (isOnline) {
      if (!isMyTurn || !onSubmitOnlineAnswer) return;
      setSubmitError(null);
      setIsPendingSubmit(true);
      const res = await onSubmitOnlineAnswer(chosen.id, chosen.text);
      setIsPendingSubmit(false);
      if (!res.ok) {
        setSubmitError(res.error || 'Não foi possível enviar a resposta.');
      }
    } else {
      handleSubmitAnswerOffline();
    }
  };

  // Confirm and close after answering question
  const handleConfirmQuestionOutcome = () => {
    if (isOnline && onContinueOnline) {
      onContinueOnline();
      return;
    }

    if (!event.question) return;

    const chosen = event.question.options.find((opt) => opt.id === selectedOptionId);
    const pointsDelta = isCorrectAnswer ? event.question.pointsReward : 0;
    const reputationDelta = isCorrectAnswer ? 20 : 5;

    onResolve({
      pointsDelta,
      reputationDelta,
      achievement: isCorrectAnswer 
        ? (tile.id === 35 ? 'Mestre da Chegada' : 'Acerto Jurídico') 
        : undefined,
      chosenText: chosen?.text,
      wasCorrect: isCorrectAnswer,
      isQuestion: true,
    });
  };

  // Handle Bonus Confirmation
  const handleConfirmBonus = () => {
    if (isOnline && onContinueOnline) {
      onContinueOnline();
      return;
    }

    if (!event.bonus) return;

    if (bonusChoice === 'points') {
      onResolve({
        pointsDelta: 15,
        reputationDelta: 15,
        achievement: 'Estratégia Pontual',
        chosenText: '+15 Pontos Imediatos da Casa Bônus',
        wasCorrect: false,
        isQuestion: false,
      });
    } else {
      onResolve({
        pointsDelta: 0,
        reputationDelta: 15,
        moveStepsDelta: 2,
        achievement: 'Impulso na Trilha',
        chosenText: 'Avançou 2 Casas na Trilha Trabalhista',
        wasCorrect: false,
        isQuestion: false,
      });
    }
  };

  // Handle Dilemma Choice Selection & Resolve
  const handleSelectDilemmaChoice = (choice: EventChoice) => {
    if (isOnline && !isMyTurn) return;
    setSelectedChoice(choice);
    sound.playCashSound();
  };

  const handleConfirmDilemma = () => {
    if (!selectedChoice) return;

    if (isOnline && onContinueOnline) {
      onContinueOnline();
      return;
    }

    onResolve({
      pointsDelta: selectedChoice.points || 0,
      reputationDelta: selectedChoice.reputation || 0,
      moveStepsDelta: selectedChoice.moveSteps,
      skipTurn: selectedChoice.skipTurn,
      achievement: selectedChoice.achievement,
      chosenText: selectedChoice.text,
    });
  };

  const selectedOption = event.question?.options.find(
    (o) => o.id === answeredOptionId || o.text === answeredOptionText
  );

  // Level Badge helper
  const renderLevelBadge = () => {
    if (event.level === 'Superpergunta' || tile.id === 35) {
      return (
        <span className="px-2.5 py-1 rounded-full text-xs font-black bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1 shadow-sm">
          <Trophy className="w-3.5 h-3.5 text-amber-400" />
          Superpergunta Final (100 pts)
        </span>
      );
    }
    if (event.level === 'Difícil') {
      return (
        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40">
          Nível Difícil (+30 pts)
        </span>
      );
    }
    if (event.level === 'Média') {
      return (
        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-500/20 text-blue-300 border border-blue-500/40">
          Nível Médio (+20 pts)
        </span>
      );
    }
    return (
      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
        Nível Fácil (+10 pts)
      </span>
    );
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: 'spring', duration: 0.4 }}
          className="relative w-full max-w-2xl bg-slate-900 rounded-2xl border border-slate-700 shadow-2xl overflow-hidden my-auto"
          style={{
            boxShadow: `0 0 35px ${player.color}35`,
          }}
        >
          {/* Header Bar */}
          <div
            className="px-5 py-3 flex items-center justify-between border-b border-slate-800"
            style={{
              background: `linear-gradient(90deg, ${player.color}25, rgba(15,23,42,0.9))`,
            }}
          >
            <div className="flex items-center gap-2.5">
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-white border border-white/30 shadow-md text-base"
                style={{ backgroundColor: player.color }}
              >
                {player.avatar || '⚖️'}
              </div>
              <div>
                <div className="text-[11px] font-semibold text-slate-400">
                  {isOnline ? (isMyTurn ? 'Sua Vez de Jogar' : 'Vez de Responder') : 'Vez de Responder'}
                </div>
                <div className="text-sm font-bold text-white tracking-wide flex items-center gap-1.5">
                  <span>{player.name}</span>
                  {isOnline && isMyTurn && (
                    <span className="text-[10px] font-black px-1.5 py-0.2 rounded bg-amber-400 text-slate-950">
                      Você
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800/90 border border-slate-700 text-xs">
              <span className="font-bold text-amber-400">Casa {tile.id.toString().padStart(2, '0')}</span>
              <span className="text-slate-500">•</span>
              <span className="text-slate-300 font-medium">{tile.stage}</span>
            </div>
          </div>

          {/* Modal Content */}
          <div className="p-5 sm:p-6 space-y-4 max-h-[75vh] overflow-y-auto">
            {/* Stage Title, Card Badge and Level */}
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                {event.cardLetter && (
                  <span className="px-2.5 py-1 rounded-md text-xs font-black bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 tracking-wider uppercase">
                    {event.cardLetter.startsWith('CHEGADA') ? 'Superpergunta de Chegada' : `Carta ${event.cardLetter}`}
                  </span>
                )}
                {event.questionNumber && (
                  <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                    Pergunta #{event.questionNumber} do Manual
                  </span>
                )}
                {renderLevelBadge()}
              </div>

              <h3 className="text-xl sm:text-2xl font-bold font-display text-white">
                {event.title}
              </h3>
            </div>

            {/* Context/Description */}
            <p className="text-sm text-slate-300 leading-relaxed bg-slate-800/40 p-3 rounded-xl border border-slate-800">
              {event.description}
            </p>

            {/* CASE 1: QUESTION TYPE */}
            {event.type === 'question' && event.question && (
              <div className="space-y-3 pt-1">
                {/* Multiplayer Status Indicator */}
                {isOnline && !isQuestionAnswered && (
                  <div
                    className={`p-3 rounded-xl border flex items-center justify-between gap-2 ${
                      isMyTurn
                        ? 'bg-blue-500/15 border-blue-500/40 text-blue-200'
                        : 'bg-amber-500/10 border-amber-500/30 text-amber-200'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {isMyTurn ? (
                        <>
                          <span className="w-2.5 h-2.5 rounded-full bg-blue-400 animate-ping" />
                          <span className="text-xs sm:text-sm font-bold text-white">
                            É a sua vez de responder! Escolha uma alternativa:
                          </span>
                        </>
                      ) : (
                        <>
                          <Clock className="w-4 h-4 text-amber-400 animate-spin" />
                          <span className="text-xs sm:text-sm font-semibold">
                            É a vez de <strong className="text-amber-300">{player.name}</strong> responder.
                          </span>
                        </>
                      )}
                    </div>
                    <span
                      className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${
                        isMyTurn
                          ? 'bg-blue-500/20 text-blue-300 border border-blue-400/40'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-400/40'
                      }`}
                    >
                      {isMyTurn ? 'Sua Vez' : 'Aguardando'}
                    </span>
                  </div>
                )}

                {/* Question Statement Box */}
                <div className="p-3 rounded-xl bg-blue-950/30 border border-blue-500/40">
                  <div className="text-xs font-bold text-blue-300 uppercase tracking-wider mb-1 flex items-center justify-between">
                    <span>Questão de Prova</span>
                    <span className="text-amber-400 font-extrabold">+{event.question.pointsReward} Pontos</span>
                  </div>
                  <div className="text-sm sm:text-base font-semibold text-white leading-snug">
                    {event.question.statement}
                  </div>
                </div>

                {/* Multiple choice options */}
                <div className="space-y-2">
                  {event.question.options.map((opt) => {
                    const isSelected = selectedOptionId === opt.id;
                    const isChosenAnswer =
                      answeredOptionId === opt.id ||
                      answeredOptionText === opt.text;

                    const canClickOption = !isQuestionAnswered && !isPendingSubmit && (!isOnline || isMyTurn);

                    let optionStyle = '';

                    if (isQuestionAnswered) {
                      // Post-answer: official result from server / offline evaluation
                      if (isChosenAnswer) {
                        if (opt.isCorrect) {
                          optionStyle =
                            'border-emerald-500 bg-emerald-950/70 text-emerald-100 ring-2 ring-emerald-400 shadow-md shadow-emerald-900/30 cursor-default';
                        } else {
                          optionStyle =
                            'border-rose-500 bg-rose-950/70 text-rose-100 ring-2 ring-rose-400 shadow-md shadow-rose-900/30 cursor-default';
                        }
                      } else if (opt.isCorrect && !isAnswerCorrect) {
                        // Reveal correct answer if player got it wrong
                        optionStyle =
                          'border-emerald-500/80 bg-emerald-950/40 text-emerald-200 ring-1 ring-emerald-400/60 cursor-default';
                      } else {
                        optionStyle = 'border-slate-800 bg-slate-900/40 text-slate-500 opacity-50 cursor-default';
                      }
                    } else if (isSelected) {
                      // Immediate, distinct local selection for active player
                      optionStyle =
                        'border-blue-400 bg-blue-950/80 text-blue-100 ring-2 ring-blue-400 shadow-lg shadow-blue-500/25 cursor-pointer';
                    } else if (canClickOption) {
                      // Available option for active player
                      optionStyle =
                        'border-slate-700 bg-slate-800/60 hover:bg-slate-800 hover:border-slate-600 text-slate-200 cursor-pointer';
                    } else {
                      // Disabled state for non-active players or during submission
                      optionStyle =
                        'border-slate-800 bg-slate-900/40 text-slate-400 opacity-60 cursor-not-allowed';
                    }

                    return (
                      <button
                        key={opt.id}
                        id={`btn-option-${opt.id}`}
                        type="button"
                        onClick={() => handleSelectOption(opt)}
                        disabled={!canClickOption}
                        className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-start gap-3 disabled:cursor-not-allowed ${optionStyle}`}
                      >
                        <div className="mt-0.5 flex-shrink-0">
                          {isQuestionAnswered ? (
                            isChosenAnswer ? (
                              opt.isCorrect ? (
                                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                              ) : (
                                <XCircle className="w-5 h-5 text-rose-400" />
                              )
                            ) : opt.isCorrect ? (
                              <CheckCircle2 className="w-5 h-5 text-emerald-400/80" />
                            ) : (
                              <div className="w-5 h-5 rounded-full border border-slate-700" />
                            )
                          ) : (
                            <div
                              className={`w-6 h-6 rounded-full border flex items-center justify-center text-xs font-bold transition-all ${
                                isSelected
                                  ? 'border-blue-400 bg-blue-500 text-white shadow-sm ring-2 ring-blue-300/60'
                                  : canClickOption
                                  ? 'border-slate-600 bg-slate-800/80 text-slate-300'
                                  : 'border-slate-700 bg-slate-900/60 text-slate-600'
                              }`}
                            >
                              {isSelected ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : opt.text.slice(0, 1)}
                            </div>
                          )}
                        </div>

                        <div className="flex-1 text-sm font-medium leading-snug space-y-1">
                          <div className="flex items-center justify-between gap-2">
                            <span>{opt.text}</span>
                            {!isQuestionAnswered && isSelected && (
                              <span className="text-[10px] uppercase font-bold tracking-wider text-blue-300 bg-blue-500/25 px-2 py-0.5 rounded border border-blue-400/40 shrink-0">
                                Selecionada
                              </span>
                            )}
                          </div>

                          {isQuestionAnswered && isChosenAnswer && (
                            <div className="inline-flex items-center gap-1 text-[11px] font-bold">
                              {opt.isCorrect ? (
                                <span className="text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                                  {answeredByName} escolheu esta alternativa (CORRETA!)
                                </span>
                              ) : (
                                <span className="text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/30">
                                  {answeredByName} escolheu esta alternativa (INCORRETA)
                                </span>
                              )}
                            </div>
                          )}
                          {isQuestionAnswered && !isChosenAnswer && opt.isCorrect && !isAnswerCorrect && (
                            <div className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                              Gabarito Oficial (Resposta Correta)
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {submitError && (
                  <div className="p-2.5 rounded-xl bg-rose-950/40 border border-rose-500/50 text-rose-200 text-xs">
                    {submitError}
                  </div>
                )}

                {/* Feedback & Grounded Legal Basis after Answer */}
                {isQuestionAnswered && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-3.5 rounded-xl border ${
                      isAnswerCorrect
                        ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200'
                        : 'bg-rose-950/40 border-rose-500/50 text-rose-200'
                    }`}
                  >
                    <div className="flex items-center gap-2 font-bold text-sm mb-1">
                      {isAnswerCorrect ? (
                        <>
                          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                          <span>
                            Resposta Correta de {answeredByName}! (+{activeQuestionAnswer?.pointsEarned || event.question.pointsReward} Pontos)
                          </span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-5 h-5 text-rose-400" />
                          <span>Resposta Incorreta de {answeredByName} (0 Pontos)</span>
                        </>
                      )}
                    </div>
                    <div className="text-xs text-slate-300 leading-relaxed mb-2">
                      {activeQuestionAnswer?.explanation || selectedOption?.explanation || event.question.options.find(o => o.isCorrect)?.explanation}
                    </div>
                    {(activeQuestionAnswer?.legalBasis || event.legalContext) && (
                      <div className="pt-2 border-t border-slate-800/80 text-xs text-amber-200/90 flex items-start gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
                        <span>
                          <strong>Fundamentação Legal:</strong>{' '}
                          {activeQuestionAnswer?.legalBasis || event.legalContext}
                        </span>
                      </div>
                    )}
                  </motion.div>
                )}
              </div>
            )}

            {/* CASE 2: BONUS TILE */}
            {event.type === 'bonus' && event.bonus && (
              <div className="space-y-4 pt-1">
                {isOnline && !isMyTurn && (
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 flex items-center gap-2 text-xs sm:text-sm">
                    <Clock className="w-4 h-4 text-amber-400" />
                    <span>Aguardando <strong>{player.name}</strong> escolher o benefício da Casa Bônus...</span>
                  </div>
                )}

                <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-500/50 space-y-2">
                  <div className="flex items-center gap-2 text-amber-400 font-black text-base">
                    <Sparkles className="w-5 h-5 text-amber-400" />
                    <span>{event.bonus.headline}</span>
                  </div>
                  <p className="text-sm text-amber-100/90 leading-relaxed">
                    {event.bonus.benefitDescription}
                  </p>
                </div>

                {/* Escolha Interativa Oficial: +15 Pontos OU Avançar 2 Casas */}
                {event.bonus.allowChoice && (
                  <div className="space-y-2">
                    <div className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                      Escolha seu benefício direto conforme o manual de regras:
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <button
                        type="button"
                        disabled={isOnline && !isMyTurn}
                        onClick={() => setBonusChoice('points')}
                        className={`p-3.5 rounded-xl border text-left transition-all flex flex-col gap-1.5 ${
                          isOnline && !isMyTurn ? 'cursor-not-allowed opacity-75' : 'cursor-pointer'
                        } ${
                          bonusChoice === 'points'
                            ? 'border-amber-400 bg-amber-950/40 ring-2 ring-amber-400/50 text-white'
                            : 'border-slate-700 bg-slate-800/60 hover:bg-slate-800 text-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-extrabold text-sm flex items-center gap-1.5 text-amber-300">
                            <Zap className="w-4 h-4 text-amber-400" />
                            +15 Pontos
                          </span>
                          {bonusChoice === 'points' && (
                            <span className="text-[10px] uppercase font-black px-1.5 py-0.5 rounded bg-amber-400 text-slate-950">
                              Selecionado
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-slate-300">
                          Soma +15 pontos imediatos na sua pontuação geral da partida.
                        </span>
                      </button>

                      <button
                        type="button"
                        disabled={isOnline && !isMyTurn}
                        onClick={() => setBonusChoice('steps')}
                        className={`p-3.5 rounded-xl border text-left transition-all flex flex-col gap-1.5 ${
                          isOnline && !isMyTurn ? 'cursor-not-allowed opacity-75' : 'cursor-pointer'
                        } ${
                          bonusChoice === 'steps'
                            ? 'border-cyan-400 bg-cyan-950/40 ring-2 ring-cyan-400/50 text-white'
                            : 'border-slate-700 bg-slate-800/60 hover:bg-slate-800 text-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-extrabold text-sm flex items-center gap-1.5 text-cyan-300">
                            <Footprints className="w-4 h-4 text-cyan-400" />
                            Avançar 2 Casas
                          </span>
                          {bonusChoice === 'steps' && (
                            <span className="text-[10px] uppercase font-black px-1.5 py-0.5 rounded bg-cyan-400 text-slate-950">
                              Selecionado
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-slate-300">
                          Acelera seu percurso na trilha rumo à linha de chegada.
                        </span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* CASE 3: DILEMMA TYPE */}
            {event.type === 'dilemma' && event.choices && (
              <div className="space-y-3 pt-1">
                {isOnline && !isMyTurn && (
                  <div className="p-3 rounded-xl bg-pink-500/10 border border-pink-500/30 text-pink-200 flex items-center gap-2 text-xs sm:text-sm">
                    <Clock className="w-4 h-4 text-pink-400" />
                    <span>Aguardando <strong>{player.name}</strong> decidir a conduta ética...</span>
                  </div>
                )}

                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase tracking-wider">
                  <HelpCircle className="w-3.5 h-3.5 text-pink-400" />
                  <span>Selecione a conduta jurídica a ser adotada:</span>
                </div>

                <div className="space-y-2.5">
                  {event.choices.map((choice, idx) => {
                    const isSelected = selectedChoice?.text === choice.text;
                    const canSelect = !isOnline || isMyTurn;

                    return (
                      <button
                        key={idx}
                        type="button"
                        disabled={!canSelect}
                        onClick={() => handleSelectDilemmaChoice(choice)}
                        className={`w-full text-left p-3.5 rounded-xl border transition-all ${
                          !canSelect ? 'cursor-not-allowed opacity-75' : 'cursor-pointer'
                        } ${
                          isSelected
                            ? 'border-pink-500 bg-pink-950/40 text-pink-100 ring-2 ring-pink-500/50'
                            : 'border-slate-700 bg-slate-800/60 hover:bg-slate-800 text-slate-200'
                        }`}
                      >
                        <div className="text-sm font-semibold mb-1">{choice.text}</div>
                        {choice.outcomeDesc && (
                          <div className="text-xs text-slate-400">{choice.outcomeDesc}</div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Action Footer */}
          <div className="px-5 py-3 bg-slate-950/90 border-t border-slate-800 flex items-center justify-between gap-2">
            <div className="text-xs text-slate-400">
              {event.type === 'question' && (
                !isQuestionAnswered
                  ? (isOnline && !isMyTurn
                      ? `Aguardando a escolha jurídica de ${player.name}...`
                      : (selectedOptionId
                          ? 'Alternativa selecionada. Clique em Confirmar Resposta.'
                          : 'Selecione uma alternativa (A, B, C ou D)'))
                  : 'Resultado registrado pela banca examinadora'
              )}
              {event.type === 'bonus' && (
                isOnline && !isMyTurn
                  ? `Aguardando benefício de ${player.name}...`
                  : (event.bonus?.allowChoice ? 'Benefício selecionado pronto para aplicar' : 'Largada inicial')
              )}
              {event.type === 'dilemma' && (
                isOnline && !isMyTurn
                  ? `Aguardando decisão de ${player.name}...`
                  : (selectedChoice ? 'Conduta selecionada' : 'Escolha uma opção')
              )}
            </div>

            {/* Question Actions */}
            {event.type === 'question' && (
              <>
                {!isQuestionAnswered ? (
                  (!isOnline || isMyTurn) ? (
                    <button
                      id="btn-submit-answer"
                      type="button"
                      onClick={handleConfirmAnswer}
                      disabled={!selectedOptionId || isPendingSubmit}
                      className="px-5 py-2.5 rounded-xl font-bold text-sm bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-400 hover:to-indigo-500 text-white shadow-md disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-all flex items-center gap-1.5"
                    >
                      {isPendingSubmit ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Enviando...</span>
                        </>
                      ) : (
                        <>
                          <span>Confirmar Resposta</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  ) : (
                    <div className="text-xs text-slate-400 flex items-center gap-1.5 bg-slate-900/60 px-3 py-1.5 rounded-lg border border-slate-800">
                      <Clock className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                      <span>Na vez de <strong className="text-amber-300">{player.name}</strong> responder...</span>
                    </div>
                  )
                ) : (
                  // Question answered: show continue button for active player or room host
                  (!isOnline || isMyTurn || isHost) ? (
                    <button
                      id="btn-confirm-question-continue"
                      type="button"
                      onClick={handleConfirmQuestionOutcome}
                      className="px-5 py-2 rounded-xl font-bold text-sm bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-md cursor-pointer transition-all flex items-center gap-1.5"
                    >
                      <span>{isOnline && isHost && !isMyTurn ? 'Avançar Turno (Host)' : 'Continuar Partida'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <div className="text-xs text-slate-400 flex items-center gap-1.5">
                      <UserCheck className="w-3.5 h-3.5 text-amber-400" />
                      <span>Aguardando {player.name} continuar...</span>
                    </div>
                  )
                )}
              </>
            )}

            {/* Bonus Actions */}
            {event.type === 'bonus' && (
              (!isOnline || isMyTurn || isHost) ? (
                <button
                  id="btn-confirm-bonus-benefit"
                  type="button"
                  onClick={handleConfirmBonus}
                  className="px-5 py-2 rounded-xl font-bold text-sm bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-md cursor-pointer transition-all flex items-center gap-1.5"
                >
                  <span>{event.bonus?.allowChoice ? 'Confirmar Benefício' : 'Entendido!'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <div className="text-xs text-slate-400 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <span>Aguardando {player.name}...</span>
                </div>
              )
            )}

            {/* Dilemma Actions */}
            {event.type === 'dilemma' && (
              (!isOnline || isMyTurn || isHost) ? (
                <button
                  id="btn-confirm-dilemma-decision"
                  type="button"
                  onClick={handleConfirmDilemma}
                  disabled={!selectedChoice}
                  className="px-5 py-2 rounded-xl font-bold text-sm bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-400 hover:to-rose-500 text-white shadow-md disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-all flex items-center gap-1.5"
                >
                  <span>Confirmar Decisão</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <div className="text-xs text-slate-400 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-pink-400" />
                  <span>Aguardando {player.name}...</span>
                </div>
              )
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
