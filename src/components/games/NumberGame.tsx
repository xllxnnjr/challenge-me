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

export function NumberGame({ difficulty, onSuccess, onErrorToast, onPenalty, soundEnabled }: Props) {
  const [sequence, setSequence] = useState<string[]>([]);
  const [correctNum, setCorrectNum] = useState<number>(0);
  const [options, setOptions] = useState<number[]>([]);

  useEffect(() => {
    let series: number[] = [];
    const missingIdx = 3;

    if (difficulty === 'Easy') {
      // Simple +2, +3, +5 constant step
      const step = [2, 3, 5, 10][Math.floor(Math.random() * 4)];
      const base = Math.floor(Math.random() * 10) + 1;
      series = [base, base + step, base + step * 2, base + step * 3, base + step * 4];
    } else if (difficulty === 'Medium') {
      // +2, +4, +6 or ×2
      if (Math.random() > 0.5) {
        const base = Math.floor(Math.random() * 5) + 2;
        series = [base, base * 2, base * 4, base * 8, base * 16];
      } else {
        const base = Math.floor(Math.random() * 10) + 3;
        series = [base, base + 2, base + 6, base + 12, base + 20];
      }
    } else {
      // Hard: Fibonacci, square progression (n^2), or alternating operators
      const base = Math.floor(Math.random() * 4) + 2;
      const stepA = Math.floor(Math.random() * 3) + 3;
      // Pattern: *2 -1, *2 -1, etc. or squares
      series = [base, base * stepA, base * stepA - 2, (base * stepA - 2) * stepA, (base * stepA - 2) * stepA - 2];
    }

    const answer = series[missingIdx];
    setCorrectNum(answer);

    const seqDisplay = series.map((n, i) => (i === missingIdx ? '?' : String(n)));
    setSequence(seqDisplay);

    // 4 multiple choices
    const opts = new Set<number>([answer]);
    while (opts.size < 4) {
      const delta = (Math.floor(Math.random() * 9) - 4) * 2;
      const fake = answer + (delta === 0 ? 4 : delta);
      if (fake > 0) opts.add(fake);
    }
    setOptions(Array.from(opts).sort(() => Math.random() - 0.5));
  }, [difficulty]);

  const handleSelect = (choice: number) => {
    if (choice === correctNum) {
      const baseScore = difficulty === 'Easy' ? 30 : difficulty === 'Medium' ? 45 : 65;
      sound.playSuccess(soundEnabled);
      onSuccess(baseScore, `Spot on! The missing number was ${correctNum} (${difficulty} Tier).`);
    } else {
      sound.playError(soundEnabled);
      const penaltyAmount = difficulty === 'Easy' ? 5 : difficulty === 'Medium' ? 8 : 10;
      onPenalty(penaltyAmount, 'Incorrect sequence number choice');
      onErrorToast(`Not quite! Look closer at the step. -${penaltyAmount} pts penalty.`);
    }
  };

  return (
    <div className="flex flex-col items-center text-center py-2 select-none">
      <div className="w-full flex items-center justify-between px-2 mb-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-950/70 border border-cyan-800 text-cyan-200 text-xs font-bold">
          🔢 Sequence Pattern Logic
        </div>
        <span className="px-2.5 py-0.5 rounded-lg text-xs font-black bg-[#151e33] border border-[#2a3958] text-cyan-300">
          Tier: {difficulty}
        </span>
      </div>

      <div className="w-full bg-[#111a2c] border border-[#263149] rounded-2xl p-5 mb-4 shadow-lg">
        <p className="text-xs text-[#9ca7bd] mb-3">What number replaces the question mark?</p>
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 py-2">
          {sequence.map((item, idx) => (
            <div
              key={idx}
              className={`px-3 sm:px-4 py-2 sm:py-3 rounded-xl font-display font-black text-xl sm:text-2xl border transition ${
                item === '?'
                  ? 'bg-yellow-500/20 border-yellow-400 text-yellow-300 shadow-md shadow-yellow-500/10 scale-110'
                  : 'bg-[#18233c] border-[#2c3a57] text-white'
              }`}
            >
              {item}
            </div>
          ))}
        </div>
      </div>

      {/* Multiple choices */}
      <div className="w-full grid grid-cols-2 gap-2.5">
        {options.map((opt, i) => (
          <button
            key={i}
            id={`num-option-${opt}`}
            onClick={() => handleSelect(opt)}
            className="py-3 px-4 bg-[#151d31] hover:bg-cyan-900/30 hover:border-cyan-500 border border-[#263149] rounded-xl font-display font-bold text-xl text-white transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>{opt}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
