import React from 'react';
import { motion } from 'motion/react';
import { Scale, CheckCircle } from 'lucide-react';
import { Player } from '../types';

interface PlayersListProps {
  players: Player[];
  activePlayerId: string;
  totalTiles?: number;
  myPlayerId?: string;
}

export const PlayersList: React.FC<PlayersListProps> = ({
  players,
  activePlayerId,
  totalTiles = 35,
  myPlayerId,
}) => {
  // Compute rankings based on points descending
  const sortedByPoints = [...players].sort((a, b) => b.points - a.points);
  const getRank = (playerId: string) => {
    return sortedByPoints.findIndex((p) => p.id === playerId) + 1;
  };

  return (
    <div className="w-full h-full bg-slate-900/90 rounded-2xl border border-slate-800 p-2.5 sm:p-3 shadow-2xl backdrop-blur-md flex flex-col justify-between overflow-hidden">
      {/* Leaderboard Header */}
      <div className="flex items-center justify-between gap-2 pb-2 mb-2 border-b border-slate-800 flex-shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-6 h-6 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center flex-shrink-0">
            <Scale className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="min-w-0">
            <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-200 leading-none truncate">
              Ranking dos Juristas
            </h3>
            <span className="text-[10px] text-slate-400 block mt-0.5">
              {players.length} alunos • Trilha 1 a {totalTiles}
            </span>
          </div>
        </div>

        {/* Leading jurist quick pill */}
        {sortedByPoints[0] && (
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-[10px] flex-shrink-0">
            <span className="text-amber-400 font-black">1º:</span>
            <span className="text-white font-bold truncate max-w-[70px]">{sortedByPoints[0].name}</span>
            <span className="text-amber-300 font-extrabold">{sortedByPoints[0].points}p</span>
          </div>
        )}
      </div>

      {/* Vertical Leaderboard List */}
      <div className="flex-1 min-h-0 overflow-y-auto space-y-1.5 pr-1 scrollbar-thin">
        {sortedByPoints.map((p) => {
          const isActive = p.id === activePlayerId;
          const rank = getRank(p.id);
          const progressPercent = Math.min(
            Math.max(Math.round(((p.position - 1) / (totalTiles - 1)) * 100), 0),
            100
          );

          return (
            <motion.div
              key={p.id}
              id={`player-card-${p.id}`}
              animate={{
                scale: isActive ? 1.01 : 1,
              }}
              transition={{ duration: 0.15 }}
              className={`relative p-2 rounded-xl border transition-all flex flex-col justify-between ${
                isActive
                  ? 'border-amber-400/90 bg-slate-800/95 shadow-md shadow-amber-500/15 ring-1 ring-amber-400/60'
                  : p.isFinished
                  ? 'border-emerald-500/40 bg-emerald-950/20'
                  : 'border-slate-800/80 bg-slate-900/60 hover:bg-slate-800/40'
              }`}
            >
              {/* Row: Rank + Avatar + Name + Points + Status */}
              <div className="flex items-center justify-between gap-1.5">
                {/* Left: Rank & Avatar & Identity */}
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  {/* Rank Badge */}
                  <span
                    className={`w-5 h-5 rounded-md text-[10px] font-black flex items-center justify-center flex-shrink-0 shadow border ${
                      rank === 1
                        ? 'bg-amber-400 text-slate-950 border-amber-300'
                        : rank === 2
                        ? 'bg-slate-300 text-slate-950 border-white'
                        : rank === 3
                        ? 'bg-amber-700 text-white border-amber-600'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}
                  >
                    {rank}º
                  </span>

                  {/* Avatar Circle */}
                  <div
                    className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold text-white shadow-sm flex-shrink-0"
                    style={{ backgroundColor: p.color }}
                  >
                    {p.avatar}
                  </div>

                  {/* Name and Role */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1">
                      <h4 className="text-xs font-bold text-white truncate leading-tight">
                        {p.name}
                      </h4>
                      {myPlayerId === p.id && (
                        <span className="text-[9px] font-black text-amber-300 bg-amber-500/20 px-1 py-0.2 rounded border border-amber-400/40">
                          Você
                        </span>
                      )}
                      {isActive && (
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse flex-shrink-0" />
                      )}
                    </div>
                    <span className="text-[9px] text-slate-400 truncate block leading-none">
                      Casa {p.position === 1 ? '00' : p.position} • {p.correctAnswersCount} acertos ({p.questionsAnsweredCount || 0} perg.)
                    </span>
                  </div>
                </div>

                {/* Right: Points Counter */}
                <div className="flex items-center gap-1.5 flex-shrink-0 text-right">
                  <div className="px-2 py-1 rounded-lg bg-slate-950/80 border border-slate-800 text-right">
                    <span className="text-xs font-black text-amber-400 leading-none block">
                      {p.points}
                    </span>
                    <span className="text-[8px] text-slate-400 uppercase font-semibold leading-none block">
                      pts
                    </span>
                  </div>

                  {p.isFinished && (
                    <div className="p-1 rounded-md bg-emerald-500/20 text-emerald-400" title={`Chegou em ${p.finishRank}º lugar!`}>
                      <CheckCircle className="w-3.5 h-3.5" />
                    </div>
                  )}
                </div>
              </div>

              {/* Progress Bar towards Casa 35 */}
              <div className="w-full h-1 bg-slate-950 rounded-full overflow-hidden border border-slate-800/80 mt-1.5">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${progressPercent}%`,
                    backgroundColor: p.color,
                  }}
                />
              </div>

              {/* Penalty Notice if skipped */}
              {p.skipNextTurn && (
                <div className="mt-1 text-[9px] font-bold text-rose-300 bg-rose-950/60 border border-rose-900/60 rounded px-1.5 py-0.2 text-center">
                  ⚠️ Suspenso por 1 turno
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
