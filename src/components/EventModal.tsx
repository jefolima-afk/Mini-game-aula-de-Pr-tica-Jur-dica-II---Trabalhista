import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  HelpCircle, 
  CheckCircle2, 
  XCircle, 
  BookOpen, 
  ArrowRight, 
  Trophy, 
  FileText,
  Zap,
  Footprints
} from 'lucide-react';
import { LawGameEvent, Player, Tile, QuestionOption, EventChoice } from '../types';
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
}

export const EventModal: React.FC<EventModalProps> = ({
  isOpen,
  event,
  player,
  tile,
  onResolve,
}) => {
  // Question state
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState<boolean>(false);
  const [isCorrectAnswer, setIsCorrectAnswer] = useState<boolean>(false);

  // Bonus choice state: 'points' (+15 pts) or 'steps' (+2 casas)
  const [bonusChoice, setBonusChoice] = useState<'points' | 'steps'>('points');

  // Dilemma state
  const [selectedChoice, setSelectedChoice] = useState<EventChoice | null>(null);

  useEffect(() => {
    if (isOpen && event) {
      setSelectedOptionId(null);
      setIsAnswerSubmitted(false);
      setIsCorrectAnswer(false);
      setSelectedChoice(null);
      setBonusChoice('points');

      if (event.type === 'bonus') {
        sound.playCashSound();
      } else {
        sound.playStepSound();
      }
    }
  }, [isOpen, event]);

  if (!isOpen || !event) return null;

  // Handle Question Option Selection
  const handleSelectOption = (option: QuestionOption) => {
    if (isAnswerSubmitted) return;
    setSelectedOptionId(option.id);
  };

  // Submit Question Answer
  const handleSubmitAnswer = () => {
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

  // Confirm and close after answering question
  const handleConfirmQuestionOutcome = () => {
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
    setSelectedChoice(choice);
    sound.playCashSound();
  };

  const handleConfirmDilemma = () => {
    if (!selectedChoice) return;

    onResolve({
      pointsDelta: selectedChoice.points || 0,
      reputationDelta: selectedChoice.reputation || 0,
      moveStepsDelta: selectedChoice.moveSteps,
      skipTurn: selectedChoice.skipTurn,
      achievement: selectedChoice.achievement,
      chosenText: selectedChoice.text,
    });
  };

  const selectedOption = event.question?.options.find((o) => o.id === selectedOptionId);

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
                <div className="text-[11px] font-semibold text-slate-400">Vez de Responder</div>
                <div className="text-sm font-bold text-white tracking-wide">{player.name}</div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800/90 border border-slate-700 text-xs">
              <span className="font-bold text-amber-400">Casa {tile.id}</span>
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
                    let optionStyle = 'border-slate-700 bg-slate-800/60 hover:bg-slate-800 text-slate-200';

                    if (isAnswerSubmitted) {
                      if (opt.isCorrect) {
                        optionStyle = 'border-emerald-500 bg-emerald-950/60 text-emerald-100 shadow-md shadow-emerald-900/30 ring-1 ring-emerald-400';
                      } else if (isSelected && !opt.isCorrect) {
                        optionStyle = 'border-rose-500 bg-rose-950/60 text-rose-100 shadow-md shadow-rose-900/30 ring-1 ring-rose-400';
                      } else {
                        optionStyle = 'border-slate-800 bg-slate-900/40 text-slate-500 opacity-60';
                      }
                    } else if (isSelected) {
                      optionStyle = 'border-blue-400 bg-blue-900/40 text-blue-100 ring-2 ring-blue-500/50';
                    }

                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => handleSelectOption(opt)}
                        disabled={isAnswerSubmitted}
                        className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-start gap-3 cursor-pointer disabled:cursor-default ${optionStyle}`}
                      >
                        <div className="mt-0.5 flex-shrink-0">
                          {isAnswerSubmitted ? (
                            opt.isCorrect ? (
                              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                            ) : isSelected ? (
                              <XCircle className="w-5 h-5 text-rose-400" />
                            ) : (
                              <div className="w-5 h-5 rounded-full border border-slate-700" />
                            )
                          ) : (
                            <div
                              className={`w-5 h-5 rounded-full border flex items-center justify-center text-xs font-bold ${
                                isSelected
                                  ? 'border-blue-400 bg-blue-500 text-white'
                                  : 'border-slate-600 text-slate-400'
                              }`}
                            >
                              {opt.text.slice(0, 1)}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 text-sm font-medium leading-snug">
                          {opt.text}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Feedback & Grounded Legal Basis after Answer */}
                {isAnswerSubmitted && selectedOption && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-3.5 rounded-xl border ${
                      isCorrectAnswer
                        ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200'
                        : 'bg-rose-950/40 border-rose-500/50 text-rose-200'
                    }`}
                  >
                    <div className="flex items-center gap-2 font-bold text-sm mb-1">
                      {isCorrectAnswer ? (
                        <>
                          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                          <span>Resposta Correta! (+{event.question.pointsReward} Pontos)</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-5 h-5 text-rose-400" />
                          <span>Resposta Incorreta (0 Pontos)</span>
                        </>
                      )}
                    </div>
                    <div className="text-xs text-slate-300 leading-relaxed mb-2">
                      {selectedOption.explanation}
                    </div>
                    {event.legalContext && (
                      <div className="pt-2 border-t border-slate-800/80 text-xs text-amber-200/90 flex items-start gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
                        <span><strong>Fundamentação Legal:</strong> {event.legalContext}</span>
                      </div>
                    )}
                  </motion.div>
                )}
              </div>
            )}

            {/* CASE 2: BONUS TILE (Conforme Manual das Regras) */}
            {event.type === 'bonus' && event.bonus && (
              <div className="space-y-4 pt-1">
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
                        onClick={() => setBonusChoice('points')}
                        className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-1.5 ${
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
                        onClick={() => setBonusChoice('steps')}
                        className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-1.5 ${
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
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase tracking-wider">
                  <HelpCircle className="w-3.5 h-3.5 text-pink-400" />
                  <span>Selecione a conduta jurídica a ser adotada:</span>
                </div>

                <div className="space-y-2.5">
                  {event.choices.map((choice, idx) => {
                    const isSelected = selectedChoice?.text === choice.text;

                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSelectDilemmaChoice(choice)}
                        className={`w-full text-left p-3.5 rounded-xl border transition-all flex flex-col gap-1 cursor-pointer ${
                          isSelected
                            ? 'border-amber-400 bg-slate-800 ring-2 ring-amber-400/50'
                            : 'border-slate-700 bg-slate-800/60 hover:bg-slate-800 hover:border-slate-600'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-sm text-white">{choice.text}</span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            +{choice.points} pts
                          </span>
                        </div>
                        <span className="text-xs text-slate-400">{choice.outcomeDesc}</span>
                        {choice.legalBasis && (
                          <span className="text-[11px] text-amber-300/80 mt-1">
                            ⚖️ {choice.legalBasis}
                          </span>
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
              {event.type === 'question' && !isAnswerSubmitted && 'Selecione uma alternativa para validar'}
              {event.type === 'question' && isAnswerSubmitted && 'Revise os fundamentos e continue'}
              {event.type === 'bonus' && (event.bonus?.allowChoice ? 'Benefício selecionado pronto para aplicar' : 'Largada inicial')}
              {event.type === 'dilemma' && (selectedChoice ? 'Conduta selecionada' : 'Escolha uma opção')}
            </div>

            {/* Question Actions */}
            {event.type === 'question' && (
              <>
                {!isAnswerSubmitted ? (
                  <button
                    id="btn-submit-answer"
                    type="button"
                    onClick={handleSubmitAnswer}
                    disabled={!selectedOptionId}
                    className="px-5 py-2 rounded-xl font-bold text-sm bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-400 hover:to-indigo-500 text-white shadow-md disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-all flex items-center gap-1.5"
                  >
                    <span>Confirmar Resposta</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    id="btn-confirm-question-continue"
                    type="button"
                    onClick={handleConfirmQuestionOutcome}
                    className="px-5 py-2 rounded-xl font-bold text-sm bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-md cursor-pointer transition-all flex items-center gap-1.5"
                  >
                    <span>Continuar Partida</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </>
            )}

            {/* Bonus Actions */}
            {event.type === 'bonus' && (
              <button
                id="btn-confirm-bonus-benefit"
                type="button"
                onClick={handleConfirmBonus}
                className="px-5 py-2 rounded-xl font-bold text-sm bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-md cursor-pointer transition-all flex items-center gap-1.5"
              >
                <span>{event.bonus?.allowChoice ? 'Confirmar Benefício' : 'Entendido!'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}

            {/* Dilemma Actions */}
            {event.type === 'dilemma' && (
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
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
