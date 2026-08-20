import React, { useState, useEffect, useCallback } from 'react';
import { Difficulty } from '../../types';
import { sound } from '../../utils/audio';

interface Props {
  difficulty: Difficulty;
  playerLevel?: number;
  onSuccess: (score: number, message: string) => void;
  onErrorToast: (msg: string) => void;
  onPenalty: (amount?: number, reason?: string) => void;
  soundEnabled: boolean;
}

export function TargetGame({
  difficulty,
  playerLevel = 1,
  onSuccess,
  onErrorToast,
  onPenalty,
  soundEnabled,
}: Props) {
  const baseCount = difficulty === 'Easy' ? 3 : difficulty === 'Medium' ? 5 : 7;
  const levelBonus = Math.min(Math.floor((playerLevel - 1) / 3), 3);
  const targetCount = baseCount + levelBonus;

  const baseInterval = difficulty === 'Easy' ? 1400 : difficulty === 'Medium' ? 1000 : 700;
  const speedInterval = Math.max(500, baseInterval - (playerLevel - 1) * 45);

  const targetSize = difficulty === 'Easy' ? 'w-14 h-14 text-2xl' : difficulty === 'Medium' ? 'w-12 h-12 text-xl' : 'w-10 h-10 text-lg';

  const [hits, setHits] = useState(0);
  const [pos, setPos] = useState({ top: 45, left: 45 });

  const moveTarget = useCallback(() => {
    const top = Math.floor(Math.random() * 70) + 10;
    const left = Math.floor(Math.random() * 70) + 10;
    setPos({ top, left });
  }, []);

  useEffect(() => {
    const timer = setInterval(moveTarget, speedInterval);
    return () => clearInterval(timer);
  }, [moveTarget, speedInterval]);

  const handleHit = () => {
    sound.playPop(soundEnabled);
    const nextHits = hits + 1;
    setHits(nextHits);
    moveTarget();

    if (nextHits >= targetCount) {
      const basePts = difficulty === 'Easy' ? 30 : difficulty === 'Medium' ? 50 : 75;
      sound.playSuccess(soundEnabled);
      onSuccess(
        basePts,
        `🎯 Sharp Shooter! All ${targetCount} targets struck in ${difficulty} tier (Lvl ${playerLevel})!`
      );
    }
  };

  const handleMiss = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).id === 'target-ball') return;
    sound.playError(soundEnabled);
    const penaltyAmount = difficulty === 'Easy' ? 3 : difficulty === 'Medium' ? 5 : 8;
    onPenalty(penaltyAmount, 'Missed target arena tap');
    onErrorToast(`Missed aim! -${penaltyAmount} pts.`);
  };

  return (
    <div className="flex flex-col items-center text-center py-2 select-none">
      <div className="w-full flex items-center justify-between px-2 mb-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-950/70 border border-rose-800 text-rose-200 text-xs font-bold">
          🎯 Target Tap Aim • Lvl {playerLevel}
        </div>
        <div className="text-xs font-black text-rose-300 bg-[#111a2c] px-3 py-1 rounded-lg border border-[#263149]">
          Hits: <span className="text-white text-sm">{hits}</span> / {targetCount} ({difficulty})
        </div>
      </div>

      <p className="text-xs text-[#9ca7bd] mb-3">
        Tap the moving bullseye before it jumps position! Avoid clicking empty space.
      </p>

      {/* Target Arena */}
      <div
        onClick={handleMiss}
        className="w-full h-64 sm:h-72 bg-[#090f1d] border-2 border-dashed border-[#263149] rounded-3xl relative overflow-hidden cursor-crosshair shadow-inner"
      >
        <button
          id="target-ball"
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleHit();
          }}
          style={{
            top: `${pos.top}%`,
            left: `${pos.left}%`,
          }}
          className={`absolute rounded-full bg-gradient-to-tr from-rose-500 via-pink-500 to-amber-400 border-2 border-white shadow-lg shadow-rose-500/50 flex items-center justify-center -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-300 active:scale-90 select-none animate-pulse ${targetSize}`}
        >
          🎯
        </button>
      </div>
    </div>
  );
}
