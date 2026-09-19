import React from 'react';
import { History, X, Dices, Footprints, Sparkles, CheckCircle2 } from 'lucide-react';
import { GameLogEntry } from '../types';

interface GameLogsDrawerProps {
  logs: GameLogEntry[];
  isOpen: boolean;
  onClose: () => void;
}

export const GameLogsDrawer: React.FC<GameLogsDrawerProps> = ({ logs, isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-40 w-full max-w-sm bg-slate-900/95 border-l border-slate-800 shadow-2xl backdrop-blur-md flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-amber-400" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200">
            Histórico da Partida
          </h3>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Log list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {logs.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-500">
            Nenhum evento registrado ainda. Gire a roleta para começar!
          </div>
        ) : (
          logs.map((log) => (
            <div
              key={log.id}
              className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 text-xs space-y-1"
            >
              <div className="flex items-center justify-between">
                <span
                  className="font-bold text-white px-2 py-0.5 rounded text-[11px]"
                  style={{ backgroundColor: `${log.playerColor}30`, color: log.playerColor }}
                >
                  {log.playerName}
                </span>
                <span className="text-[10px] text-slate-500 font-mono">{log.timestamp}</span>
              </div>

              <div className="flex items-start gap-2 pt-1 text-slate-300">
                {log.type === 'spin' && <Dices className="w-3.5 h-3.5 text-amber-400 mt-0.5 flex-shrink-0" />}
                {log.type === 'move' && <Footprints className="w-3.5 h-3.5 text-cyan-400 mt-0.5 flex-shrink-0" />}
                {log.type === 'event' && <Sparkles className="w-3.5 h-3.5 text-pink-400 mt-0.5 flex-shrink-0" />}
                {log.type === 'finish' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mt-0.5 flex-shrink-0" />}
                <p className="leading-snug">{log.text}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
