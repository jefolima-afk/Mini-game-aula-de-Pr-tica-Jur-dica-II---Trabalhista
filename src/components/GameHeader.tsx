import React, { useState } from 'react';
import { 
  Scale, 
  Volume2, 
  VolumeX, 
  History, 
  BookOpen, 
  RotateCcw,
  Trophy
} from 'lucide-react';
import { sound } from '../utils/audio';
import { CesurgLogo } from './CesurgLogo';

interface GameHeaderProps {
  round: number;
  totalLogs: number;
  isPlaying?: boolean;
  onOpenLogs: () => void;
  onOpenRules: () => void;
  onRestartPrompt: () => void;
  onFinishPrompt?: () => void;
}

export const GameHeader: React.FC<GameHeaderProps> = ({
  round,
  totalLogs,
  isPlaying = false,
  onOpenLogs,
  onOpenRules,
  onRestartPrompt,
  onFinishPrompt,
}) => {
  const [isMuted, setIsMuted] = useState(sound.getMuted());

  const toggleSound = () => {
    const nextMute = !isMuted;
    setIsMuted(nextMute);
    sound.setMuted(nextMute);
  };

  return (
    <header className="w-full bg-slate-900/90 border-b border-slate-800 px-3 sm:px-6 py-2.5 flex items-center justify-between gap-2 shadow-lg backdrop-blur-md sticky top-0 z-30">
      {/* Brand & Logo */}
      <div className="flex items-center gap-2.5">
        <CesurgLogo height={28} className="hidden md:inline-flex flex-shrink-0 opacity-90 pr-1" />
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-400 flex items-center justify-center text-slate-950 font-black shadow-md shadow-amber-500/20 flex-shrink-0">
          <Scale className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <h1 className="text-base sm:text-lg font-extrabold font-display text-white tracking-tight leading-none truncate">
            Prática do Trabalho
          </h1>
          <span className="text-[10px] text-amber-400 font-semibold uppercase tracking-wider block truncate mt-0.5">
            Prof. Ma. Giulia Signor • Rodada {round}
          </span>
        </div>
      </div>

      {/* Control Actions */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Sound Toggle */}
        <button
          id="btn-toggle-sound"
          onClick={toggleSound}
          title={isMuted ? 'Ativar Efeitos Sonoros' : 'Silenciar Efeitos'}
          className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer"
        >
          {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
        </button>

        {/* Rules button */}
        <button
          id="btn-open-rules"
          onClick={onOpenRules}
          title="Ver Regras do Jogo"
          className="px-2.5 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
        >
          <BookOpen className="w-4 h-4 text-amber-400" />
          <span className="hidden sm:inline">Regras</span>
        </button>

        {/* History / Logs button */}
        <button
          id="btn-open-logs"
          onClick={onOpenLogs}
          title="Ver Histórico de Lances"
          className="relative px-2.5 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
        >
          <History className="w-4 h-4 text-cyan-400" />
          <span className="hidden sm:inline">Lances</span>
          {totalLogs > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-cyan-500 text-slate-950 font-bold text-[10px]">
              {totalLogs}
            </span>
          )}
        </button>

        {/* Finish & Bonus Ceremony Button */}
        {isPlaying && onFinishPrompt && (
          <button
            id="btn-open-final-scoring"
            onClick={onFinishPrompt}
            title="Encerrar Partida e Realizar Apuração Final"
            className="px-2.5 py-2 rounded-xl bg-gradient-to-r from-amber-500/20 to-yellow-500/20 hover:from-amber-500/30 hover:to-yellow-500/30 border border-amber-400/50 text-amber-300 hover:text-amber-200 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
          >
            <Trophy className="w-4 h-4 text-amber-400 animate-pulse" />
            <span className="hidden md:inline">Apuração Final</span>
          </button>
        )}

        {/* Restart match */}
        <button
          id="btn-restart-game"
          onClick={onRestartPrompt}
          title="Reiniciar Partida"
          className="p-2 rounded-xl bg-slate-800/80 hover:bg-rose-950/60 border border-slate-700 hover:border-rose-700/60 text-slate-400 hover:text-rose-300 transition-all cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
