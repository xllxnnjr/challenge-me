import React, { useState, useEffect } from 'react';
import { ShieldAlert, Check, RefreshCw, KeyRound, Lightbulb } from 'lucide-react';
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

interface Attempt {
  guess: string;
  exact: number; // Correct digit and position (Green)
  present: number; // Correct digit wrong position (Yellow)
}

export function CodeBreakerGame({
  difficulty,
  onSuccess,
  onErrorToast,
  onPenalty,
  soundEnabled,
}: Props) {
  const [secretCode, setSecretCode] = useState('');
  const [currentGuess, setCurrentGuess] = useState('');
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [maxAttempts, setMaxAttempts] = useState(5);
  const [hintsUsed, setHintsUsed] = useState(0);

  const codeLength = difficulty === 'Hard' ? 4 : 3;

  // Initialize or reset game
  const initGame = () => {
    // Generate unique digits
    const digits = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];
    const shuffled = [...digits].sort(() => 0.5 - Math.random());
    const code = shuffled.slice(0, codeLength).join('');
    setSecretCode(code);
    setCurrentGuess('');
    setAttempts([]);
    setMaxAttempts(difficulty === 'Easy' ? 6 : difficulty === 'Medium' ? 5 : 4);
    setHintsUsed(0);
  };

  useEffect(() => {
    initGame();
  }, [difficulty]);

  const handleDigitPress = (d: string) => {
    if (currentGuess.length >= codeLength) return;
    if (currentGuess.includes(d)) {
      onErrorToast('Each digit in the code is unique!');
      return;
    }
    sound.playTap(soundEnabled);
    haptics.selection();
    setCurrentGuess((prev) => prev + d);
  };

  const handleDelete = () => {
    haptics.light();
    setCurrentGuess((prev) => prev.slice(0, -1));
  };

  const handleClear = () => {
    haptics.light();
    setCurrentGuess('');
  };

  const handleCheckGuess = () => {
    if (currentGuess.length !== codeLength) {
      onErrorToast(`Enter a ${codeLength}-digit code to test!`);
      return;
    }

    // Evaluate exact (green) and present (yellow)
    let exact = 0;
    let present = 0;

    for (let i = 0; i < codeLength; i++) {
      if (currentGuess[i] === secretCode[i]) {
        exact++;
      } else if (secretCode.includes(currentGuess[i])) {
        present++;
      }
    }

    const newAttempt: Attempt = {
      guess: currentGuess,
      exact,
      present,
    };

    const nextAttempts = [newAttempt, ...attempts];
    setAttempts(nextAttempts);
    setCurrentGuess('');

    if (exact === codeLength) {
      // Won!
      sound.playSuccess(soundEnabled);
      haptics.celebration();
      const basePts = difficulty === 'Easy' ? 45 : difficulty === 'Medium' ? 60 : 75;
      const attemptBonus = (maxAttempts - attempts.length) * 5;
      onSuccess(basePts + attemptBonus, `Vault cracked in ${nextAttempts.length} attempts! Code: ${secretCode}`);
    } else {
      // Miss
      sound.playError(soundEnabled);
      haptics.error();

      if (nextAttempts.length >= maxAttempts) {
        // Out of attempts
        if (onPenalty) onPenalty(15, `Failed to crack vault. The code was ${secretCode}`);
        onErrorToast(`🔒 Vault locked down! The code was ${secretCode}`);
        setTimeout(() => initGame(), 1600);
      }
    }
  };

  const handleHint = () => {
    if (hintsUsed >= 1) {
      onErrorToast('Maximum 1 hint per lock session!');
      return;
    }
    setHintsUsed(1);
    haptics.medium();
    sound.playBonus(soundEnabled);
    // Reveal one digit in secretCode
    const hintDigit = secretCode[0];
    onErrorToast(`💡 Security leak: The code contains the digit ${hintDigit}!`);
  };

  return (
    <div className="space-y-4">
      {/* Objective Card */}
      <div className="p-3.5 rounded-[22px] bg-gradient-to-r from-emerald-950/40 via-[#0c1322] to-teal-950/40 border border-emerald-500/30 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300">
            <KeyRound className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-display font-black text-white text-xs sm:text-sm">
              Crack the {codeLength}-Digit Cipher
            </h4>
            <p className="text-[11px] text-[#94a3b8]">
              🟢 Exact spot & digit • 🟡 Correct digit wrong spot
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleHint}
          disabled={hintsUsed >= 1}
          className={`px-2.5 py-1.5 rounded-full text-xs font-bold flex items-center gap-1 border transition ${
            hintsUsed >= 1
              ? 'opacity-40 border-white/10 text-slate-500'
              : 'bg-amber-400/20 text-amber-300 border-amber-400/40 hover:bg-amber-400/30'
          }`}
        >
          <Lightbulb className="w-3 h-3" />
          <span>Hint</span>
        </button>
      </div>

      {/* Secret Code Input Slots */}
      <div className="flex justify-center items-center gap-2.5 py-2">
        {Array.from({ length: codeLength }).map((_, idx) => {
          const char = currentGuess[idx] || '';
          return (
            <div
              key={idx}
              className={`w-14 h-16 rounded-[20px] border-2 flex items-center justify-center font-display font-black text-2xl transition-all shadow-inner ${
                char
                  ? 'border-emerald-400 bg-emerald-500/20 text-white shadow-emerald-500/20'
                  : 'border-white/15 bg-black/40 text-slate-600'
              }`}
            >
              {char || '•'}
            </div>
          );
        })}
      </div>

      {/* Attempt History Feed */}
      <div className="bg-black/30 border border-white/10 rounded-[20px] p-3 max-h-32 overflow-y-auto space-y-1.5 no-scrollbar">
        <div className="flex items-center justify-between text-[10px] font-black uppercase text-slate-400 px-1 border-b border-white/5 pb-1">
          <span>Attempts ({attempts.length}/{maxAttempts})</span>
          <span>Analysis Clues</span>
        </div>

        {attempts.length === 0 ? (
          <div className="text-center py-2 text-slate-500 text-xs italic">
            Enter your first guess below to analyze cipher telemetry...
          </div>
        ) : (
          attempts.map((att, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between py-1 px-2 rounded-xl bg-white/[0.03] border border-white/5 text-xs"
            >
              <span className="font-mono font-black tracking-widest text-white text-sm">
                {att.guess}
              </span>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-black text-[11px] border border-emerald-500/30">
                  🟢 {att.exact} Exact
                </span>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-black text-[11px] border border-amber-500/30">
                  🟡 {att.present} Present
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Keypad */}
      <div className="grid grid-cols-3 gap-2">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => {
          const isSelected = currentGuess.includes(num);
          return (
            <button
              key={num}
              type="button"
              disabled={isSelected}
              onClick={() => handleDigitPress(num)}
              className={`py-3 rounded-[16px] font-display font-black text-lg transition active:scale-95 shadow-md ${
                isSelected
                  ? 'bg-white/5 text-slate-600 border border-white/5 cursor-not-allowed'
                  : 'bg-white/10 hover:bg-white/15 text-white border border-white/15 hover:border-white/30 cursor-pointer'
              }`}
            >
              {num}
            </button>
          );
        })}

        <button
          type="button"
          onClick={handleClear}
          className="py-3 rounded-[16px] bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 font-black text-xs transition active:scale-95 cursor-pointer"
        >
          CLEAR
        </button>

        <button
          type="button"
          onClick={handleDelete}
          className="py-3 rounded-[16px] bg-white/10 hover:bg-white/15 text-slate-300 border border-white/15 font-black text-xs transition active:scale-95 cursor-pointer"
        >
          ⌫ DEL
        </button>

        <button
          type="button"
          onClick={handleCheckGuess}
          disabled={currentGuess.length !== codeLength}
          className={`py-3 rounded-[16px] font-black text-xs flex items-center justify-center gap-1 transition active:scale-95 shadow-md cursor-pointer ${
            currentGuess.length === codeLength
              ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-black shadow-emerald-500/30'
              : 'bg-white/10 text-slate-500 cursor-not-allowed border border-white/5'
          }`}
        >
          <Check className="w-4 h-4" />
          <span>CHECK</span>
        </button>
      </div>
    </div>
  );
}
