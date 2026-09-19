import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { Sparkles, Dices } from 'lucide-react';
import { sound } from '../utils/audio';
import { Player } from '../types';

interface RouletteProps {
  onSpinEnd: (result: number) => void;
  disabled: boolean;
  currentPlayer: Player;
  isMyTurn?: boolean;
  externalSpinTarget?: number | null;
}

const SEGMENTS = [
  { num: 1, color: '#EF4444', label: '1' },
  { num: 2, color: '#F97316', label: '2' },
  { num: 3, color: '#F59E0B', label: '3' },
  { num: 4, color: '#10B981', label: '4' },
  { num: 5, color: '#06B6D4', label: '5' },
  { num: 6, color: '#3B82F6', label: '6' },
  { num: 7, color: '#8B5CF6', label: '7' },
  { num: 8, color: '#EC4899', label: '8' },
];

const NUM_SEGMENTS = SEGMENTS.length;
const SEGMENT_ANGLE = 360 / NUM_SEGMENTS;

export const Roulette: React.FC<RouletteProps> = ({
  onSpinEnd,
  disabled,
  currentPlayer,
  isMyTurn = true,
  externalSpinTarget = null,
}) => {
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [lastResult, setLastResult] = useState<number | null>(null);
  const [needleBounce, setNeedleBounce] = useState(0);

  const rotationRef = useRef(0);
  const animFrameRef = useRef<number | null>(null);
  const lastTickAngleRef = useRef(0);

  // Clean up animation on unmount
  useEffect(() => {
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  const runSpinAnimation = (targetNum: number) => {
    if (isSpinning) return;

    sound.playSpinStart();
    setIsSpinning(true);
    setLastResult(null);

    const targetIndex = SEGMENTS.findIndex((s) => s.num === targetNum);
    const segmentCenter = targetIndex * SEGMENT_ANGLE + SEGMENT_ANGLE / 2;
    const extraSpins = (5 + Math.floor(Math.random() * 3)) * 360;
    const randomJitter = (Math.random() - 0.5) * (SEGMENT_ANGLE * 0.5);

    const baseTargetAngle = 270 - segmentCenter + randomJitter;
    const currentRot = rotationRef.current % 360;
    const diff = (baseTargetAngle - currentRot + 360) % 360;
    const finalRotation = rotationRef.current + extraSpins + diff;

    const startRot = rotationRef.current;
    const totalDelta = finalRotation - startRot;
    const duration = 3600;
    const startTime = performance.now();
    lastTickAngleRef.current = startRot;

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3.8);
      const currentAngle = startRot + totalDelta * easeOut;

      rotationRef.current = currentAngle;
      setRotation(currentAngle);

      const passedAngle = currentAngle - lastTickAngleRef.current;
      if (passedAngle >= SEGMENT_ANGLE) {
        sound.playRouletteTick(progress);
        setNeedleBounce((prev) => (prev === 10 ? -10 : 10));
        lastTickAngleRef.current = currentAngle;
      }

      if (progress < 1) {
        animFrameRef.current = requestAnimationFrame(animate);
      } else {
        setNeedleBounce(0);
        setIsSpinning(false);
        setLastResult(targetNum);
        sound.playCashSound();
        setTimeout(() => {
          onSpinEnd(targetNum);
        }, 650);
      }
    };

    animFrameRef.current = requestAnimationFrame(animate);
  };

  // Trigger spin when externalSpinTarget arrives
  useEffect(() => {
    if (externalSpinTarget && !isSpinning) {
      runSpinAnimation(externalSpinTarget);
    }
  }, [externalSpinTarget]);

  const spinWheel = () => {
    if (isSpinning || disabled || !isMyTurn) return;
    const targetNum = Math.floor(Math.random() * NUM_SEGMENTS) + 1;
    runSpinAnimation(targetNum);
  };

  return (
    <div className="relative flex flex-col items-center justify-between select-none w-full h-full py-1">
      {/* Current Turn Player Mini Tag */}
      <div
        className="mb-2 flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold shadow-sm border flex-shrink-0"
        style={{
          borderColor: currentPlayer.color,
          backgroundColor: `${currentPlayer.color}20`,
        }}
      >
        <span
          className="w-2 h-2 rounded-full animate-pulse flex-shrink-0"
          style={{ backgroundColor: currentPlayer.color }}
        />
        <span className="text-slate-300">Vez de:</span>
        <span className="font-bold text-white tracking-wide truncate max-w-[150px]">
          {currentPlayer.name}
        </span>
      </div>

      {/* Wheel Frame - Proportional Sizing */}
      <div className="relative w-48 h-48 sm:w-56 sm:h-56 xl:w-60 xl:h-60 2xl:w-64 2xl:h-64 flex items-center justify-center my-auto flex-shrink-0">
        {/* Decorative Outer Bezel */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-b from-amber-400 via-amber-600 to-amber-900 p-2 shadow-xl shadow-amber-500/20">
          <div className="w-full h-full rounded-full bg-slate-900 border-2 border-amber-300/50 relative overflow-hidden flex items-center justify-center">
            {/* Spinning SVG Wheel */}
            <div
              className="w-full h-full rounded-full"
              style={{
                transform: `rotate(${rotation}deg)`,
                willChange: 'transform',
              }}
            >
              <svg viewBox="0 0 200 200" className="w-full h-full">
                {/* Segments */}
                <g transform="translate(100, 100)">
                  {SEGMENTS.map((seg, i) => {
                    const startAngle = (i * SEGMENT_ANGLE * Math.PI) / 180;
                    const endAngle = (((i + 1) * SEGMENT_ANGLE) * Math.PI) / 180;
                    const x1 = 96 * Math.cos(startAngle);
                    const y1 = 96 * Math.sin(startAngle);
                    const x2 = 96 * Math.cos(endAngle);
                    const y2 = 96 * Math.sin(endAngle);

                    // Mid angle for text positioning
                    const midAngle = ((i + 0.5) * SEGMENT_ANGLE * Math.PI) / 180;
                    const textX = 64 * Math.cos(midAngle);
                    const textY = 64 * Math.sin(midAngle);
                    const textRot = (i + 0.5) * SEGMENT_ANGLE + 90;

                    return (
                      <g key={seg.num}>
                        <path
                          d={`M 0 0 L ${x1} ${y1} A 96 96 0 0 1 ${x2} ${y2} Z`}
                          fill={seg.color}
                          stroke="#0F172A"
                          strokeWidth="1.5"
                        />
                        <text
                          x={textX}
                          y={textY}
                          fill="#FFFFFF"
                          fontSize="21"
                          fontWeight="900"
                          fontFamily="Fredoka, sans-serif"
                          textAnchor="middle"
                          dominantBaseline="central"
                          transform={`rotate(${textRot}, ${textX}, ${textY})`}
                          style={{
                            filter: 'drop-shadow(0 1.5px 2px rgba(0,0,0,0.7))',
                          }}
                        >
                          {seg.label}
                        </text>
                      </g>
                    );
                  })}
                  {/* Subtle rim border */}
                  <circle r="95" fill="none" stroke="#FDE68A" strokeWidth="1.5" opacity="0.35" />
                </g>
              </svg>
            </div>
          </div>
        </div>

        {/* Center Spin Hub & Button */}
        <button
          id="btn-spin-roulette"
          onClick={spinWheel}
          disabled={isSpinning || disabled || !isMyTurn}
          aria-label="Girar Roleta da Vida"
          className={`absolute z-20 w-16 h-16 sm:w-20 sm:h-20 rounded-full flex flex-col items-center justify-center font-display font-bold shadow-2xl transition-transform active:scale-95 ${
            isSpinning || disabled || !isMyTurn
              ? 'bg-slate-700 text-slate-400 cursor-not-allowed border-2 border-slate-600 opacity-90'
              : 'bg-gradient-to-br from-amber-400 via-amber-500 to-yellow-600 hover:from-amber-300 hover:to-amber-500 text-slate-950 border-2 sm:border-3 border-amber-200 cursor-pointer hover:scale-105 shadow-amber-500/50'
          }`}
        >
          {isSpinning ? (
            <div className="flex flex-col items-center">
              <Dices className="w-5 h-5 sm:w-6 sm:h-6 animate-spin text-slate-300" />
              <span className="text-[9px] sm:text-[10px] uppercase font-black tracking-wider mt-0.5">Gira...</span>
            </div>
          ) : !isMyTurn ? (
            <div className="flex flex-col items-center leading-tight">
              <span className="text-[9px] sm:text-[10px] uppercase font-black tracking-wider text-slate-400">VEZ DE</span>
              <span className="text-[9px] sm:text-[10px] font-bold text-amber-300 truncate max-w-[50px]">
                {currentPlayer.name.split(' ')[0]}
              </span>
            </div>
          ) : (
            <div className="flex flex-col items-center leading-tight">
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-amber-950" />
              <span className="text-[11px] sm:text-xs xl:text-sm font-black uppercase tracking-wider">GIRAR!</span>
            </div>
          )}
        </button>

        {/* Needle / Indicator at Top */}
        <div
          className="absolute -top-3 z-30 flex flex-col items-center pointer-events-none transition-transform duration-75"
          style={{
            transform: `rotate(${needleBounce}deg)`,
            transformOrigin: 'top center',
          }}
        >
          <div className="w-0 h-0 border-l-[9px] border-l-transparent border-r-[9px] border-r-transparent border-t-[18px] sm:border-t-[20px] border-t-amber-300 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]" />
          <div className="w-3.5 h-3.5 -mt-4 rounded-full bg-red-600 border border-amber-200 shadow-sm" />
        </div>
      </div>

      {/* Result Indicator Badge */}
      <div className="mt-2 min-h-[32px] flex items-center justify-center flex-shrink-0">
        {lastResult !== null ? (
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/50 text-amber-300 font-bold text-xs shadow-md"
          >
            <span>Avançar</span>
            <span className="text-sm font-black text-white px-1.5 py-0.2 rounded bg-amber-500 text-slate-950">
              {lastResult}
            </span>
            <span>casas!</span>
          </motion.div>
        ) : (
          <p className="text-slate-400 text-xs font-medium">
            {isSpinning
              ? 'Torcendo pela sorte...'
              : !isMyTurn
              ? `Vez de ${currentPlayer.name} jogar... Aguardando lance`
              : 'Toque em GIRAR para andar!'}
          </p>
        )}
      </div>
    </div>
  );
};
