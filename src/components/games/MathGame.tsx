import React, { useState, useEffect } from 'react';
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

export function MathGame({
  difficulty,
  playerLevel = 1,
  onSuccess,
  onErrorToast,
  onPenalty,
  soundEnabled,
}: Props) {
  const [problem, setProblem] = useState<{ eq: string; ans: number }>({ eq: '', ans: 0 });
  const [inputVal, setInputVal] = useState('');

  // Scaling time limit and number ranges based on both difficulty and player level
  const baseTime = difficulty === 'Easy' ? 25 : difficulty === 'Medium' ? 20 : 15;
  const levelTimeDeduction = Math.min(Math.floor((playerLevel - 1) / 2), 6);
  const totalTime = Math.max(8, baseTime - levelTimeDeduction);

  const [timeLeft, setTimeLeft] = useState(totalTime);

  useEffect(() => {
    let ans = 0;
    let eq = '';

    // Scale numbers dynamically with player level
    const lvlMultiplier = 1 + (playerLevel - 1) * 0.15;

    if (difficulty === 'Easy') {
      const op = ['+', '-', '×'][Math.floor(Math.random() * 3)];
      if (op === '+') {
        const a = Math.floor((Math.random() * 20 + 5) * lvlMultiplier);
        const b = Math.floor((Math.random() * 20 + 5) * lvlMultiplier);
        ans = a + b;
        eq = `${a} + ${b}`;
      } else if (op === '-') {
        const a = Math.floor((Math.random() * 30 + 15) * lvlMultiplier);
        const b = Math.floor((Math.random() * 15 + 1) * lvlMultiplier);
        ans = a - b;
        eq = `${a} − ${b}`;
      } else {
        const a = Math.floor(Math.random() * 8) + 2;
        const b = Math.floor((Math.random() * 8 + 2) * Math.min(lvlMultiplier, 1.5));
        ans = a * b;
        eq = `${a} × ${b}`;
      }
    } else if (difficulty === 'Medium') {
      const a = Math.floor((Math.random() * 12 + 5) * lvlMultiplier);
      const b = Math.floor(Math.random() * 8) + 2;
      const c = Math.floor((Math.random() * 6 + 2) * Math.min(lvlMultiplier, 1.4));
      const op = Math.random() > 0.5 ? '+' : '-';
      if (op === '+') {
        ans = a + b * c;
        eq = `${a} + ${b} × ${c}`;
      } else {
        const large = b * c + a;
        ans = large - b * c;
        eq = `${large} − ${b} × ${c}`;
      }
    } else {
      // Hard: multi-operator with larger numbers
      const a = Math.floor((Math.random() * 10 + 6) * lvlMultiplier);
      const b = Math.floor(Math.random() * 9) + 4;
      const c = Math.floor((Math.random() * 20 + 10) * lvlMultiplier);
      const d = Math.floor(Math.random() * 12) + 5;
      ans = a * b - (c + d);
      eq = `${a} × ${b} − (${c} + ${d})`;
    }

    setProblem({ eq, ans });
    setTimeLeft(totalTime);
  }, [difficulty, playerLevel, totalTime]);

  useEffect(() => {
    if (timeLeft <= 0) {
      sound.playError(soundEnabled);
      const penaltyAmount = difficulty === 'Easy' ? 5 : difficulty === 'Medium' ? 8 : 12;
      onPenalty(penaltyAmount, 'Time ran out on Math Speed!');
      onErrorToast(`Time ran out! -${penaltyAmount} pts penalty.`);
      return;
    }
    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft, onErrorToast, onPenalty, soundEnabled, difficulty]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const val = parseInt(inputVal.trim(), 10);
    if (val === problem.ans) {
      const basePoints = difficulty === 'Easy' ? 30 : difficulty === 'Medium' ? 50 : 75;
      const speedBonus = timeLeft > (totalTime / 2) ? 10 : 0;
      sound.playSuccess(soundEnabled);
      onSuccess(
        basePoints + speedBonus,
        `Lightning calculation in ${totalTime - timeLeft}s (Lvl ${playerLevel} scaling)!`
      );
    } else {
      const penaltyAmount = difficulty === 'Easy' ? 5 : difficulty === 'Medium' ? 8 : 12;
      onPenalty(penaltyAmount, `Wrong calculation (Answer was ${problem.ans})`);
      onErrorToast(`Incorrect! Expected ${problem.ans}. -${penaltyAmount} pts deducted.`);
    }
  };

  return (
    <div className="flex flex-col items-center text-center py-2">
      <div className="w-full flex items-center justify-between px-1 mb-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-950/70 border border-purple-800 text-purple-200 text-xs font-bold">
          <span>⏱️</span> {timeLeft}s remaining
        </div>
        <span className="px-2.5 py-0.5 rounded-lg text-xs font-black bg-[#151e33] border border-[#2a3958] text-amber-300">
          Tier: {difficulty} • Lvl {playerLevel}
        </span>
      </div>

      <div className="w-full bg-[#111a2c] border border-[#263149] rounded-2xl p-5 sm:p-6 mb-4 shadow-lg">
        <span className="text-xs font-extrabold tracking-wider uppercase text-amber-400">
          Mental Arithmetic (Lvl {playerLevel} Scaling)
        </span>
        <div className="text-3xl sm:text-4xl font-black font-display my-3 tracking-wide text-white">
          {problem.eq} = <span className="text-yellow-400">?</span>
        </div>
        <p className="text-xs text-[#9ca7bd]">
          {difficulty === 'Easy' ? 'Simple arithmetic' : 'Remember operator precedence (× before +/−)'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="w-full space-y-3">
        <input
          id="math-answer-input"
          type="number"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          placeholder="Enter result..."
          autoFocus
          className="w-full bg-[#0a1020] border border-[#34405a] focus:border-amber-400 rounded-xl px-4 py-3 text-center text-xl font-bold text-white placeholder-slate-500 outline-none transition"
        />

        {/* Quick NumPad */}
        <div className="grid grid-cols-3 gap-2">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 'C', 0, '⌫'].map((k) => (
            <button
              key={String(k)}
              type="button"
              id={`numpad-btn-${k}`}
              onClick={() => {
                sound.playClick(soundEnabled);
                if (k === 'C') setInputVal('');
                else if (k === '⌫') setInputVal(prev => prev.slice(0, -1));
                else setInputVal(prev => prev + String(k));
              }}
              className="py-2.5 bg-[#151d31] hover:bg-[#1f2b48] active:scale-95 text-white font-bold rounded-xl text-lg transition border border-[#263149]/60 cursor-pointer"
            >
              {k}
            </button>
          ))}
        </div>

        <button
          id="math-submit-btn"
          type="submit"
          disabled={!inputVal}
          className="w-full py-3.5 rounded-xl font-black text-white bg-gradient-to-r from-orange-500 via-pink-500 to-purple-600 hover:opacity-95 active:scale-[0.98] transition disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-purple-900/30 cursor-pointer"
        >
          SUBMIT ANSWER
        </button>
      </form>
    </div>
  );
}
