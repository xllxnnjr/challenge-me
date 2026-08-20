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

interface Comparison {
  leftExpr: string;
  leftVal: number;
  rightExpr: string;
  rightVal: number;
}

const COMPARISONS: Comparison[] = [
  { leftExpr: '8 × 7', leftVal: 56, rightExpr: '9 × 6', rightVal: 54 },
  { leftExpr: '120 ÷ 4', leftVal: 30, rightExpr: '6 × 6', rightVal: 36 },
  { leftExpr: '15 × 4', leftVal: 60, rightExpr: '75 - 15', rightVal: 60 },
  { leftExpr: '45 + 38', leftVal: 83, rightExpr: '12 × 7', rightVal: 84 },
  { leftExpr: '99 ÷ 3', leftVal: 33, rightExpr: '5 × 7', rightVal: 35 },
  { leftExpr: '14 × 5', leftVal: 70, rightExpr: '8 × 9', rightVal: 72 },
  { leftExpr: '64 ÷ 2', leftVal: 32, rightExpr: '4 × 8', rightVal: 32 },
  { leftExpr: '18 × 4', leftVal: 72, rightExpr: '100 - 27', rightVal: 73 },
];

export function CompareGame({ difficulty, onSuccess, onErrorToast, onPenalty, soundEnabled }: Props) {
  const targetRounds = difficulty === 'Easy' ? 2 : difficulty === 'Medium' ? 3 : 5;
  const [round, setRound] = useState(1);
  const [current, setCurrent] = useState<Comparison>(COMPARISONS[0]);

  useEffect(() => {
    const randomComp = COMPARISONS[Math.floor(Math.random() * COMPARISONS.length)];
    setCurrent(randomComp);
  }, [round, difficulty]);

  const handlePick = (choice: 'left' | 'equal' | 'right') => {
    let isCorrect = false;

    if (choice === 'left' && current.leftVal > current.rightVal) isCorrect = true;
    else if (choice === 'right' && current.rightVal > current.leftVal) isCorrect = true;
    else if (choice === 'equal' && current.leftVal === current.rightVal) isCorrect = true;

    if (isCorrect) {
      sound.playPop(soundEnabled);
      if (round >= targetRounds) {
        const basePts = difficulty === 'Easy' ? 30 : difficulty === 'Medium' ? 45 : 65;
        sound.playSuccess(soundEnabled);
        onSuccess(basePts, `⚖️ Mastermind! ${targetRounds}/${targetRounds} comparisons solved (${difficulty}).`);
      } else {
        setRound(r => r + 1);
      }
    } else {
      sound.playError(soundEnabled);
      const penaltyAmount = difficulty === 'Easy' ? 5 : difficulty === 'Medium' ? 8 : 10;
      onPenalty(penaltyAmount, 'Incorrect value comparison');
      onErrorToast(`Incorrect! ${current.leftExpr} (${current.leftVal}) vs ${current.rightExpr} (${current.rightVal}). -${penaltyAmount} pts penalty.`);
    }
  };

  return (
    <div className="flex flex-col items-center text-center py-2 select-none">
      <div className="w-full flex items-center justify-between px-2 mb-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-950/70 border border-violet-800 text-violet-200 text-xs font-bold">
          ⚖️ Quick Compare
        </div>
        <div className="text-xs font-black text-violet-300 bg-[#111a2c] px-3 py-1 rounded-lg border border-[#263149]">
          Round: <span className="text-white text-sm">{round}</span> / {targetRounds} ({difficulty})
        </div>
      </div>

      <p className="text-xs text-[#9ca7bd] mb-3">
        Which side calculates to the <strong className="text-violet-300">GREATER</strong> value? (Or tap Equal)
      </p>

      {/* Comparison Duel Cards */}
      <div className="grid grid-cols-2 gap-3 w-full mb-3">
        <button
          type="button"
          onClick={() => handlePick('left')}
          className="p-5 rounded-2xl bg-gradient-to-br from-[#151e36] to-[#0f1629] hover:from-[#1c2948] hover:to-[#141f38] border-2 border-[#2b3a5a] hover:border-violet-500 text-white font-mono font-black text-xl sm:text-2xl shadow-lg transition active:scale-95 flex flex-col items-center justify-center cursor-pointer"
        >
          <span className="text-[10px] text-slate-400 font-sans uppercase font-bold tracking-widest mb-1">Side A</span>
          <span>{current.leftExpr}</span>
        </button>

        <button
          type="button"
          onClick={() => handlePick('right')}
          className="p-5 rounded-2xl bg-gradient-to-br from-[#151e36] to-[#0f1629] hover:from-[#1c2948] hover:to-[#141f38] border-2 border-[#2b3a5a] hover:border-violet-500 text-white font-mono font-black text-xl sm:text-2xl shadow-lg transition active:scale-95 flex flex-col items-center justify-center cursor-pointer"
        >
          <span className="text-[10px] text-slate-400 font-sans uppercase font-bold tracking-widest mb-1">Side B</span>
          <span>{current.rightExpr}</span>
        </button>
      </div>

      {/* Equal Option */}
      <button
        type="button"
        onClick={() => handlePick('equal')}
        className="w-full py-3 rounded-xl bg-[#111a2d] hover:bg-[#1a2642] border border-[#263654] text-slate-300 font-bold text-xs transition active:scale-98 cursor-pointer"
      >
        EQUAL (=)
      </button>
    </div>
  );
}
