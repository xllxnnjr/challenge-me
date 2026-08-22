import React, { useState, useEffect } from 'react';
import { Calculator, Check, X, RefreshCw, Sparkles, Clock } from 'lucide-react';
import { Difficulty } from '../../types';
import { sound } from '../../utils/audio';
import { haptics } from '../../utils/haptics';

interface Props {
  difficulty: Difficulty;
  onSuccess: (score: number, message: string) => void;
  onErrorToast: (msg: string) => void;
  onPenalty?: (amount?: number, reason?: string) => void;
  soundEnabled: boolean;
}

interface MathPuzzle {
  target: number;
  numbers: number[];
  equationTemplate: string; // e.g. "(__ + __) × __"
  correctAnswer: number;
}

export function Math24Game({
  difficulty,
  onSuccess,
  onErrorToast,
  onPenalty,
  soundEnabled,
}: Props) {
  const [expression, setExpression] = useState('');
  const [target, setTarget] = useState(24);
  const [availableNumbers, setAvailableNumbers] = useState<{ id: number; val: number; used: boolean }[]>([]);
  const [timeLeft, setTimeLeft] = useState(20);

  const generatePuzzle = () => {
    let t = 24;
    let nums: number[] = [];

    if (difficulty === 'Easy') {
      t = 24;
      // standard easy combinations e.g. [4, 6, 2, 2] -> 4 * 6 = 24
      const sets = [
        [3, 8, 2, 4],
        [4, 6, 1, 5],
        [2, 3, 4, 1],
        [6, 4, 3, 2],
      ];
      nums = sets[Math.floor(Math.random() * sets.length)];
    } else if (difficulty === 'Medium') {
      t = 24;
      const sets = [
        [8, 8, 3, 3],
        [5, 5, 5, 1],
        [7, 3, 2, 1],
        [6, 6, 6, 6],
      ];
      nums = sets[Math.floor(Math.random() * sets.length)];
    } else {
      t = 36;
      const sets = [
        [9, 4, 2, 3],
        [6, 6, 2, 1],
        [8, 5, 1, 4],
      ];
      nums = sets[Math.floor(Math.random() * sets.length)];
    }

    setTarget(t);
    setAvailableNumbers(nums.map((n, i) => ({ id: i, val: n, used: false })));
    setExpression('');
    setTimeLeft(difficulty === 'Easy' ? 25 : difficulty === 'Medium' ? 20 : 15);
  };

  useEffect(() => {
    generatePuzzle();
  }, [difficulty]);

  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleTimeOut();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const handleTimeOut = () => {
    sound.playError(soundEnabled);
    haptics.error();
    if (onPenalty) onPenalty(15, 'Time expired on Target Math Blitz!');
    onErrorToast(`⏰ Time expired on Target ${target}!`);
  };

  const handleNumClick = (item: { id: number; val: number; used: boolean }) => {
    if (item.used) return;
    sound.playTap(soundEnabled);
    haptics.selection();
    setExpression((prev) => prev + (prev && !/[\+\-\*\/\(\s]$/.test(prev) ? ' ' : '') + item.val);
    setAvailableNumbers((prev) =>
      prev.map((n) => (n.id === item.id ? { ...n, used: true } : n))
    );
  };

  const handleOpClick = (op: string) => {
    sound.playTap(soundEnabled);
    haptics.light();
    setExpression((prev) => prev + ` ${op} `);
  };

  const handleClear = () => {
    haptics.medium();
    setExpression('');
    setAvailableNumbers((prev) => prev.map((n) => ({ ...n, used: false })));
  };

  const handleEvaluate = () => {
    try {
      // Safe math evaluation
      const sanitized = expression.replace(/[^0-9\+\-\*\/\(\)\s\.]/g, '');
      // Check if sanitized contains code
      if (!sanitized.trim()) return;

      // eslint-disable-next-line no-new-func
      const result = Function(`'use strict'; return (${sanitized})`)();

      if (Math.abs(result - target) < 0.001) {
        // Success
        sound.playSuccess(soundEnabled);
        haptics.celebration();
        const score = difficulty === 'Easy' ? 50 : difficulty === 'Medium' ? 65 : 80;
        onSuccess(score, `🎯 Target ${target} Hit! Expression: ${expression} = ${target}`);
      } else {
        sound.playError(soundEnabled);
        haptics.error();
        if (onPenalty) onPenalty(10, `Expression equaled ${result}, expected ${target}`);
        onErrorToast(`❌ Result is ${result}, not target ${target}! Try another combination.`);
      }
    } catch {
      onErrorToast('Invalid mathematical expression syntax!');
    }
  };

  return (
    <div className="space-y-3.5">
      {/* Target Objective Banner */}
      <div className="p-3.5 rounded-[22px] bg-gradient-to-r from-amber-950/40 via-[#0c1322] to-yellow-950/30 border border-amber-500/30 shadow-md flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center font-display font-black text-amber-300 text-xl shadow-inner">
            {target}
          </div>
          <div>
            <h4 className="font-display font-black text-white text-xs sm:text-sm">
              Target {target} Equation Blitz
            </h4>
            <p className="text-[11px] text-[#94a3b8]">
              Combine the numbers with +, -, ×, ÷ to equal exactly {target}!
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 text-xs font-black text-amber-300 px-2.5 py-1 rounded-full bg-black/40 border border-white/10">
          <Clock className="w-3.5 h-3.5 text-amber-400" />
          <span>{timeLeft}s</span>
        </div>
      </div>

      {/* Expression Display */}
      <div className="p-3 rounded-[20px] bg-black/50 border-2 border-amber-400/40 min-h-[56px] flex items-center justify-between px-4">
        <span className="font-mono font-black text-lg text-white tracking-wider">
          {expression || <span className="text-slate-600 text-sm font-sans">Tap numbers & operators...</span>}
        </span>
        {expression && (
          <button
            type="button"
            onClick={handleClear}
            className="text-xs text-rose-400 font-bold hover:underline cursor-pointer"
          >
            Clear
          </button>
        )}
      </div>

      {/* Number Buttons */}
      <div className="grid grid-cols-4 gap-2">
        {availableNumbers.map((num) => (
          <button
            key={num.id}
            type="button"
            disabled={num.used}
            onClick={() => handleNumClick(num)}
            className={`py-3.5 rounded-[18px] font-display font-black text-xl transition active:scale-95 shadow-md ${
              num.used
                ? 'bg-white/5 text-slate-600 border border-white/5 cursor-not-allowed'
                : 'bg-gradient-to-br from-amber-400/20 to-amber-600/30 hover:from-amber-400/30 hover:to-amber-600/40 text-amber-300 border border-amber-400/40 cursor-pointer shadow-amber-500/10'
            }`}
          >
            {num.val}
          </button>
        ))}
      </div>

      {/* Operator Buttons & Action Buttons */}
      <div className="grid grid-cols-4 gap-2">
        {['+', '-', '*', '/'].map((op) => (
          <button
            key={op}
            type="button"
            onClick={() => handleOpClick(op)}
            className="py-3 rounded-[16px] bg-white/10 hover:bg-white/15 text-white font-mono font-black text-lg border border-white/15 cursor-pointer active:scale-95 shadow-sm"
          >
            {op === '*' ? '×' : op === '/' ? '÷' : op}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-2 pt-1">
        <div className="grid grid-cols-2 gap-1.5">
          <button
            type="button"
            onClick={() => handleOpClick('(')}
            className="py-2.5 rounded-[14px] bg-white/5 hover:bg-white/10 text-slate-300 font-mono font-bold text-sm border border-white/10 cursor-pointer"
          >
            (
          </button>
          <button
            type="button"
            onClick={() => handleOpClick(')')}
            className="py-2.5 rounded-[14px] bg-white/5 hover:bg-white/10 text-slate-300 font-mono font-bold text-sm border border-white/10 cursor-pointer"
          >
            )
          </button>
        </div>

        <button
          type="button"
          onClick={handleEvaluate}
          className="py-3 rounded-[18px] bg-gradient-to-r from-amber-400 to-yellow-500 text-black font-display font-black text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-lg shadow-amber-500/30 cursor-pointer active:scale-95"
        >
          <Check className="w-4 h-4" />
          <span>SOLVE TARGET</span>
        </button>
      </div>
    </div>
  );
}
