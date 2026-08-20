import { useState, useEffect } from 'react';
import { Difficulty } from '../../types';
import { sound } from '../../utils/audio';

interface Props {
  difficulty: Difficulty;
  onSuccess: (score: number, message: string) => void;
  onErrorToast: (msg: string) => void;
  onPenalty: (amount?: number, reason?: string) => void;
  soundEnabled: boolean;
}

interface PatternItem {
  id: number;
  icon: string;
  isOdd: boolean;
}

export function PatternGame({ difficulty, onSuccess, onErrorToast, onPenalty, soundEnabled }: Props) {
  const [items, setItems] = useState<PatternItem[]>([]);
  const gridCount = difficulty === 'Easy' ? 4 : difficulty === 'Medium' ? 9 : 12;

  useEffect(() => {
    const shapes = [
      { normal: '★', odd: '⭐' },
      { normal: '🔷', odd: '🔶' },
      { normal: '▲', odd: '▼' },
      { normal: '🟣', odd: '🔵' },
      { normal: '🟢', odd: '🟩' },
      { normal: '🍎', odd: '🍏' },
      { normal: '⚡', odd: '🔥' },
    ];
    const pair = shapes[Math.floor(Math.random() * shapes.length)];
    const oddIndex = Math.floor(Math.random() * gridCount);

    const grid: PatternItem[] = Array.from({ length: gridCount }, (_, i) => ({
      id: i,
      icon: i === oddIndex ? pair.odd : pair.normal,
      isOdd: i === oddIndex,
    }));

    setItems(grid);
  }, [difficulty, gridCount]);

  const handleClick = (item: PatternItem) => {
    if (item.isOdd) {
      const basePts = difficulty === 'Easy' ? 25 : difficulty === 'Medium' ? 45 : 65;
      sound.playSuccess(soundEnabled);
      onSuccess(basePts, `Eagle eye! You spotted the anomaly immediately (${difficulty}).`);
    } else {
      sound.playError(soundEnabled);
      const penaltyAmount = difficulty === 'Easy' ? 4 : difficulty === 'Medium' ? 7 : 10;
      onPenalty(penaltyAmount, 'Tapped normal pattern tile');
      onErrorToast(`That tile matches the pattern! -${penaltyAmount} pts penalty.`);
    }
  };

  return (
    <div className="flex flex-col items-center text-center py-2 select-none">
      <div className="w-full flex items-center justify-between px-2 mb-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-950/70 border border-violet-800 text-violet-200 text-xs font-bold">
          🧩 Find the 1 Odd Tile Out
        </div>
        <span className="px-2.5 py-0.5 rounded-lg text-xs font-black bg-[#151e33] border border-[#2a3958] text-violet-300">
          Tier: {difficulty}
        </span>
      </div>

      <p className="text-xs text-[#9ca7bd] mb-4">
        One tile below breaks the pattern. Spot and tap it!
      </p>

      {/* Grid */}
      <div
        className={`grid gap-2.5 w-full max-w-[320px] mx-auto p-3 bg-[#111a2c] border border-[#263149] rounded-2xl shadow-lg ${
          difficulty === 'Easy' ? 'grid-cols-2' : difficulty === 'Medium' ? 'grid-cols-3' : 'grid-cols-3 sm:grid-cols-4'
        }`}
      >
        {items.map((item) => (
          <button
            key={item.id}
            id={`pattern-tile-${item.id}`}
            type="button"
            onClick={() => handleClick(item)}
            className="h-18 sm:h-22 rounded-2xl bg-[#1a233a] hover:bg-violet-900/40 hover:border-violet-500 border border-[#2c3a57] text-2xl sm:text-3xl flex items-center justify-center transition active:scale-95 shadow-sm cursor-pointer"
          >
            {item.icon}
          </button>
        ))}
      </div>
    </div>
  );
}
