import { useState, useEffect, useCallback } from 'react';
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

export function ChimpGame({
  difficulty,
  playerLevel = 1,
  onSuccess,
  onErrorToast,
  onPenalty,
  soundEnabled,
}: Props) {
  const baseCount = difficulty === 'Easy' ? 3 : difficulty === 'Medium' ? 4 : 6;
  const levelBonus = Math.min(Math.floor((playerLevel - 1) / 4), 2);
  const targetCount = Math.min(8, baseCount + levelBonus);

  const baseDelay = difficulty === 'Easy' ? 2400 : difficulty === 'Medium' ? 1800 : 1200;
  const hideDelay = Math.max(900, baseDelay - (playerLevel - 1) * 80);

  const [positions, setPositions] = useState<{ [index: number]: number }>({});
  const [revealed, setRevealed] = useState(true);
  const [nextExpected, setNextExpected] = useState(1);

  const initGame = useCallback(() => {
    // Pick targetCount random grid slots out of 9
    const slots = Array.from({ length: 9 }, (_, i) => i).sort(() => Math.random() - 0.5);
    const chosenSlots = slots.slice(0, targetCount);
    const posMap: { [index: number]: number } = {};
    chosenSlots.forEach((slot, idx) => {
      posMap[slot] = idx + 1;
    });

    setPositions(posMap);
    setRevealed(true);
    setNextExpected(1);

    const timer = setTimeout(() => {
      setRevealed(false);
    }, hideDelay);

    return () => clearTimeout(timer);
  }, [targetCount, hideDelay]);

  useEffect(() => {
    initGame();
  }, [initGame]);

  const handleTileClick = (slotIdx: number) => {
    if (revealed) return;
    const numberAtSlot = positions[slotIdx];

    if (!numberAtSlot) return;

    if (numberAtSlot === nextExpected) {
      sound.playPop(soundEnabled);
      if (nextExpected === targetCount) {
        const baseScore = difficulty === 'Easy' ? 30 : difficulty === 'Medium' ? 50 : 70;
        sound.playSuccess(soundEnabled);
        onSuccess(
          baseScore,
          `🧠 Working memory cleared in ${difficulty} Tier (Lvl ${playerLevel})!`
        );
      } else {
        setNextExpected(n => n + 1);
      }
    } else {
      sound.playError(soundEnabled);
      const penaltyAmount = difficulty === 'Easy' ? 5 : difficulty === 'Medium' ? 8 : 10;
      onPenalty(penaltyAmount, 'Chimp sequence mistake');
      onErrorToast(`Oops! Needed #${nextExpected}, tapped #${numberAtSlot}. -${penaltyAmount} pts penalty.`);
      setTimeout(() => {
        initGame();
      }, 900);
    }
  };

  return (
    <div className="flex flex-col items-center text-center py-2 select-none">
      <div className="w-full flex items-center justify-between px-2 mb-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-950/70 border border-indigo-800 text-indigo-200 text-xs font-bold">
          🧠 Chimp Memory Test • Lvl {playerLevel}
        </div>
        <div className="text-xs font-black text-indigo-300 bg-[#111a2c] px-3 py-1 rounded-lg border border-[#263149]">
          Target: <span className="text-white text-sm">#{nextExpected}</span> / {targetCount} ({difficulty})
        </div>
      </div>

      <p className="text-xs text-[#9ca7bd] mb-3">
        {revealed
          ? `Memorize numbers 1 to ${targetCount} before they hide!`
          : `Tap the hidden tiles in numerical order: 1 ➔ ${targetCount}`}
      </p>

      {/* 3x3 Grid */}
      <div className="grid grid-cols-3 gap-2.5 w-full max-w-[280px] mb-4">
        {Array.from({ length: 9 }).map((_, slotIdx) => {
          const num = positions[slotIdx];
          const hasNumber = Boolean(num);
          const alreadySolved = num ? num < nextExpected : false;

          return (
            <button
              key={slotIdx}
              type="button"
              disabled={alreadySolved}
              onClick={() => handleTileClick(slotIdx)}
              className={`h-20 sm:h-22 rounded-2xl text-2xl sm:text-3xl font-black font-mono flex items-center justify-center transition-all duration-200 border-2 select-none ${
                alreadySolved
                  ? 'bg-emerald-950/40 border-emerald-800/50 text-emerald-400 opacity-60'
                  : hasNumber
                  ? revealed
                    ? 'bg-indigo-600 border-indigo-300 text-white shadow-lg scale-105'
                    : 'bg-[#18233d] hover:bg-[#202f52] border-[#374b73] text-white active:scale-95 cursor-pointer shadow-md'
                  : 'bg-[#0b101c] border-[#1a2336] opacity-30 cursor-default'
              }`}
            >
              {revealed && hasNumber ? num : alreadySolved ? '✓' : ''}
            </button>
          );
        })}
      </div>
    </div>
  );
}
