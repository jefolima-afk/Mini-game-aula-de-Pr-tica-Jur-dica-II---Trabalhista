import React, { useState } from 'react';
import { GameEvent } from '../types';
import { HelpCircle, AlertTriangle, CheckCircle, XCircle, Award } from 'lucide-react';
import { getSocket } from '../utils/socket';

interface EventModalProps {
  event: GameEvent;
  onClose: (result?: { correct: boolean; scoreDelta: number }) => void;
  isOnline?: boolean;
  currentPlayerId?: string;
}

export const EventModal: React.FC<EventModalProps> = ({ 
  event, 
  onClose, 
  isOnline = false, 
  currentPlayerId 
}) => {
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [hasAnswered, setHasAnswered] = useState<boolean>(false);

  const socket = getSocket();
  const isMyTurn = !isOnline || (socket && socket.id === currentPlayerId);

  const handleSelectOption = (index: number) => {
    if (!isMyTurn || hasAnswered) return;
    setSelectedOption(index);
  };

  const handleConfirm = () => {
    if (!isMyTurn || selectedOption === null || hasAnswered) return;

    setHasAnswered(true);
    const isCorrect = selectedOption === event.correctOption;
    const scoreDelta = isCorrect ? (event.points || 100) : -(event.points || 100);

    setTimeout(() => {
      onClose({ correct: isCorrect, scoreDelta });
    }, 1500);
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className="bg-slate-800 border-2 border-amber-500/50 rounded-2xl max-w-xl w-full p-6 shadow-2xl text-white relative overflow-hidden">
        
        {/* Banner do Tipo de Evento */}
        <div className="flex items-center gap-3 mb-4 pb-3 border-b border-slate-700">
          {event.type === 'question' ? (
            <div className="p-2 bg-blue-500/20 text-blue-400 rounded-lg">
              <HelpCircle className="w-6 h-6" />
            </div>
          ) : event.type === 'penalty' ? (
            <div className="p-2 bg-red-500/20 text-red-400 rounded-lg">
              <AlertTriangle className="w-6 h-6" />
            </div>
          ) : (
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg">
              <Award className="w-6 h-6" />
            </div>
          )}
          <div>
            <h3 className="text-xl font-bold text-amber-400">{event.title}</h3>
            <span className="text-xs text-slate-400 uppercase tracking-wider">
              {event.type === 'question' ? 'Questão Prática' : event.type === 'penalty' ? 'Penalidade' : 'Bônus'}
            </span>
          </div>
        </div>

        {/* Notificação de Turno para Modo Online */}
        {!isMyTurn && (
          <div className="mb-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-300 text-sm font-medium text-center">
            Aguardando a resposta do jogador da vez...
          </div>
        )}

        {/* Descrição / Pergunta */}
        <p className="text-slate-200 text-base mb-6 leading-relaxed">
          {event.description}
        </p>

        {/* Lista de Opções (se houver) */}
        {event.options && event.options.length > 0 && (
          <div className="space-y-3 mb-6">
            {event.options.map((option, index) => {
              let buttonStyle = "border-slate-700 bg-slate-700/40 hover:bg-slate-700 text-slate-200";

              if (selectedOption === index) {
                buttonStyle = "border-amber-500 bg-amber-500/20 text-amber-300";
              }

              if (hasAnswered) {
                if (index === event.correctOption) {
                  buttonStyle = "border-emerald-500 bg-emerald-500/20 text-emerald-300 font-bold";
                } else if (selectedOption === index) {
                  buttonStyle = "border-red-500 bg-red-500/20 text-red-300";
                }
              }

              return (
                <button
                  key={index}
                  disabled={!isMyTurn || hasAnswered}
                  onClick={() => handleSelectOption(index)}
                  className={`w-full text-left p-4 rounded-xl border transition-all duration-200 flex items-center justify-between ${buttonStyle} ${
                    !isMyTurn || hasAnswered ? 'cursor-not-allowed opacity-80' : 'cursor-pointer'
                  }`}
                >
                  <span className="pr-4">{option}</span>
                  {hasAnswered && index === event.correctOption && (
                    <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
                  )}
                  {hasAnswered && selectedOption === index && index !== event.correctOption && (
                    <XCircle className="w-5 h-5 text-red-400 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Botão de Ação */}
        <div className="flex justify-end gap-3 pt-4 border-t border-slate-700">
          {event.options && event.options.length > 0 ? (
            <button
              disabled={!isMyTurn || selectedOption === null || hasAnswered}
              onClick={handleConfirm}
              className={`px-6 py-2.5 rounded-xl font-bold shadow-lg transition-all ${
                !isMyTurn || selectedOption === null || hasAnswered
                  ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                  : 'bg-amber-500 hover:bg-amber-400 text-slate-950 cursor-pointer'
              }`}
            >
              Confirmar Resposta
            </button>
          ) : (
            <button
              disabled={!isMyTurn}
              onClick={() => onClose()}
              className={`px-6 py-2.5 rounded-xl font-bold shadow-lg transition-all ${
                !isMyTurn
                  ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                  : 'bg-amber-500 hover:bg-amber-400 text-slate-950 cursor-pointer'
              }`}
            >
              Continuar
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
