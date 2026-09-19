import React, { useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import * as LucideIcons from 'lucide-react';
import { Tile, Player } from '../types';
import { BOARD_TILES } from '../data/boardTiles';

interface BoardProps {
  tiles: Tile[];
  players: Player[];
  activePlayerId: string;
  isMoving: boolean;
  highlightTileId?: number | null;
  onTileClick?: (tile: Tile) => void;
}

// Helper to render Lucide icon dynamically
const DynamicIcon: React.FC<{ name: string; className?: string; color?: string }> = ({
  name,
  className = 'w-4 h-4',
  color,
}) => {
  const IconComponent = (LucideIcons as unknown as Record<string, React.ComponentType<{ className?: string; style?: React.CSSProperties }>>)[name];
  if (!IconComponent) {
    return <LucideIcons.Scale className={className} style={{ color }} />;
  }
  return <IconComponent className={className} style={{ color }} />;
};

export const Board: React.FC<BoardProps> = ({
  tiles = BOARD_TILES,
  players,
  activePlayerId,
  isMoving: _isMoving,
  highlightTileId,
  onTileClick,
}) => {
  const tileRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});

  // Auto-scroll to active player or highlighted tile on small screens
  useEffect(() => {
    const activePlayer = players.find((p) => p.id === activePlayerId);
    const targetTile = highlightTileId !== undefined && highlightTileId !== null 
      ? highlightTileId 
      : activePlayer?.position;

    if (targetTile !== undefined && tileRefs.current[targetTile]) {
      tileRefs.current[targetTile]?.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center',
      });
    }
  }, [activePlayerId, highlightTileId, players]);

  // Group 35 tiles into exactly 5 rows of 7 tiles for an elegant serpentine winding path
  const TILES_PER_ROW = 7;
  const rows: { tiles: Tile[]; isReversed: boolean; rowIndex: number }[] = [];

  for (let i = 0; i < tiles.length; i += TILES_PER_ROW) {
    const rowChunk = tiles.slice(i, i + TILES_PER_ROW);
    const rowIndex = Math.floor(i / TILES_PER_ROW);
    const isReversed = rowIndex % 2 === 1;
    rows.push({
      tiles: isReversed ? rowChunk.slice().reverse() : rowChunk,
      isReversed,
      rowIndex,
    });
  }

  return (
    <div className="w-full h-full bg-slate-900/90 rounded-2xl border border-slate-800 shadow-2xl p-2.5 sm:p-3 relative overflow-hidden backdrop-blur-md flex flex-col justify-between">
      {/* Background Subtle Grid Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:16px_16px] opacity-20 pointer-events-none" />

      {/* Board Header & Stage Legend (Super Compact) */}
      <div className="flex items-center justify-between gap-2 border-b border-slate-800/80 pb-2 mb-2 flex-shrink-0">
        <div className="flex items-center gap-2 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-sm shadow-emerald-500/50" />
            <span className="font-bold text-emerald-300">Casa 1: Partida</span>
          </div>
          <span className="text-slate-600">➔</span>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-sm shadow-amber-500/50 animate-pulse" />
            <span className="font-bold text-amber-300">Casa 35: Chegada (100 pts)</span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-[11px] text-slate-400">
          <span className="hidden sm:inline-flex items-center gap-1 bg-amber-500/10 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/30">
            <span>⭐</span> 6 Bônus (+15 pts ou +2 casas)
          </span>
          <span className="text-[10px] text-slate-400 hidden md:inline">
            Clique na casa para detalhes
          </span>
        </div>
      </div>

      {/* Winding 5 Rows x 7 Columns Board Grid */}
      <div className="flex-1 min-h-0 flex flex-col justify-between gap-1.5 sm:gap-2">
        {rows.map(({ tiles: rowTiles, isReversed, rowIndex }) => {
          return (
            <div key={rowIndex} className="relative flex-1 min-h-0">
              {/* Row Tiles Grid (7 Columns) */}
              <div className="grid grid-cols-7 gap-1 sm:gap-1.5 h-full">
                {rowTiles.map((tile) => {
                  const isStart = tile.id === 1;
                  const isFinish = tile.id === 35;
                  const isBonus = !!tile.isBonus;
                  const isHighlighted = highlightTileId === tile.id;
                  
                  // Players currently on this tile
                  const playersOnTile = players.filter((p) => p.position === tile.id);
                  const hasActivePlayer = playersOnTile.some((p) => p.id === activePlayerId);

                  // Strip any remaining "Casa X:" prefix so the number isn't repeated
                  const cleanTitle = tile.title.replace(/^Casa\s+\d+[:\s-–—]*\s*/i, '');

                  return (
                    <motion.div
                      key={tile.id}
                      ref={(el) => {
                        tileRefs.current[tile.id] = el;
                      }}
                      id={`board-tile-${tile.id}`}
                      onClick={() => onTileClick?.(tile)}
                      whileHover={{ scale: 1.03 }}
                      transition={{ type: 'spring', stiffness: 450, damping: 25 }}
                      className={`relative flex flex-col justify-between p-1 sm:p-1.5 rounded-xl h-full min-h-[70px] sm:min-h-[78px] lg:min-h-0 cursor-pointer transition-all duration-150 border-2 select-none overflow-hidden ${
                        isHighlighted
                          ? 'ring-2 ring-amber-400 border-amber-300 bg-amber-950/50 shadow-lg shadow-amber-500/30 z-10'
                          : hasActivePlayer
                          ? 'border-amber-400/90 bg-slate-800/95 shadow-md shadow-amber-500/20 ring-1 ring-amber-400/50 z-10'
                          : isBonus
                          ? 'border-amber-400/80 bg-amber-950/30 shadow-sm shadow-amber-500/10'
                          : isStart
                          ? 'border-emerald-500 bg-emerald-950/40 shadow-emerald-500/10'
                          : isFinish
                          ? 'border-yellow-400 bg-gradient-to-br from-amber-950/60 to-yellow-950/60 shadow-yellow-500/20 ring-1 ring-yellow-400/40'
                          : 'border-slate-800/90 hover:border-slate-700 bg-slate-800/40 hover:bg-slate-800/70'
                      }`}
                    >
                      {/* Top Bar: Tile Number & Icon */}
                      <div className="flex items-center justify-between gap-1 leading-none flex-shrink-0">
                        <span
                          className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center font-display font-black text-[9px] sm:text-[11px] shadow-inner flex-shrink-0 ${
                            isStart
                              ? 'bg-emerald-500 text-slate-950'
                              : isFinish
                              ? 'bg-amber-400 text-slate-950 animate-bounce'
                              : isBonus
                              ? 'bg-amber-400 text-slate-950 font-black'
                              : 'bg-slate-700 text-slate-200'
                          }`}
                        >
                          {tile.id}
                        </span>

                        <div className="flex items-center gap-1">
                          {isBonus && (
                            <span className="text-[10px] text-amber-300 font-black" title="Casa Bônus (+15 pts ou +2 casas)">
                              ⭐
                            </span>
                          )}
                          <div
                            className="p-0.5 rounded-md hidden sm:flex items-center justify-center"
                            style={{ backgroundColor: `${tile.color}25` }}
                          >
                            <DynamicIcon name={tile.icon} className="w-3 h-3" color={tile.color} />
                          </div>
                        </div>
                      </div>

                      {/* Middle: Title - displayed in full without truncation */}
                      <div className="flex-1 min-h-0 flex items-center justify-center my-0.5 px-0.5 text-center">
                        <h4 className="text-[9px] sm:text-[9.5px] md:text-[10px] lg:text-[10.5px] font-bold text-white leading-[1.18] font-display tracking-tight break-words hyphens-auto">
                          {cleanTitle}
                        </h4>
                      </div>

                      {/* Bottom Row: Stage & Player Pawns */}
                      <div className="flex items-center justify-between pt-0.5 border-t border-slate-700/30 min-h-[18px] leading-none flex-shrink-0">
                        <span className="text-[8px] sm:text-[9px] text-slate-400 font-semibold uppercase truncate max-w-[48px] sm:max-w-[65px]">
                          {isStart ? 'Início' : isFinish ? 'Meta' : tile.stage}
                        </span>

                        {/* Player Pawns on this tile */}
                        <div className="flex items-center -space-x-1.5 overflow-visible">
                          {playersOnTile.map((p) => {
                            const isCurrentActive = p.id === activePlayerId;
                            return (
                              <motion.div
                                key={p.id}
                                id={`pawn-${p.id}-tile-${tile.id}`}
                                initial={{ scale: 0 }}
                                animate={{ scale: isCurrentActive ? [1, 1.15, 1] : 1 }}
                                transition={isCurrentActive ? { repeat: Infinity, duration: 2 } : undefined}
                                title={`${p.name} (${p.points} pts)`}
                                className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center text-[9px] sm:text-[10px] font-bold text-white shadow-md border border-slate-900 ${
                                  isCurrentActive ? 'ring-2 ring-amber-300 scale-110 z-20' : 'ring-1 ring-white/30'
                                }`}
                                style={{ backgroundColor: p.color }}
                              >
                                {p.avatar}
                              </motion.div>
                            );
                          })}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* Serpentine Direction Guide Indicator on Row Ends */}
              {rowIndex < rows.length - 1 && (
                <div
                  className={`absolute -bottom-1 z-20 pointer-events-none hidden lg:flex items-center justify-center text-amber-400/60 text-xs font-bold ${
                    isReversed ? 'left-1' : 'right-1'
                  }`}
                >
                  <span>↴</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
