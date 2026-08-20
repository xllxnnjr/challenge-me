import { useState, useEffect } from 'react';
import { CheckCircle2, RotateCw } from 'lucide-react';
import { Difficulty } from '../../types';
import { sound } from '../../utils/audio';

interface Props {
  difficulty: Difficulty;
  onSuccess: (score: number, message: string) => void;
  onErrorToast: (msg: string) => void;
  soundEnabled: boolean;
}

const TWISTERS: { text: string; diff: Difficulty }[] = [
  // Easy
  { text: 'Red lorry, yellow lorry, red lorry, yellow lorry.', diff: 'Easy' },
  { text: 'She sells seashells by the seashore.', diff: 'Easy' },
  // Medium
  { text: 'Peter Piper picked a peck of pickled peppers.', diff: 'Medium' },
  { text: 'How much wood would a woodchuck chuck if a woodchuck could chuck wood?', diff: 'Medium' },
  // Hard
  { text: 'Unique New York, unique New York, you know you need unique New York.', diff: 'Hard' },
  { text: 'Fuzzy Wuzzy was a bear. Fuzzy Wuzzy had no hair. Fuzzy Wuzzy wasn’t fuzzy, was he?', diff: 'Hard' },
  { text: 'Pad kid pour curd pulled cod, pad kid pour curd pulled cod.', diff: 'Hard' },
];

export function TwisterGame({ difficulty, onSuccess, soundEnabled }: Props) {
  const [twister, setTwister] = useState(TWISTERS[0]);
  const [reps, setReps] = useState(0);
  const targetReps = difficulty === 'Easy' ? 2 : difficulty === 'Medium' ? 3 : 4;

  useEffect(() => {
    const matching = TWISTERS.filter(t => t.diff === difficulty);
    const pool = matching.length > 0 ? matching : TWISTERS;
    const random = pool[Math.floor(Math.random() * pool.length)];
    setTwister(random);
    setReps(0);
  }, [difficulty]);

  const handleNextTwister = () => {
    sound.playClick(soundEnabled);
    const matching = TWISTERS.filter(t => t.diff === difficulty && t.text !== twister.text);
    const pool = matching.length > 0 ? matching : TWISTERS;
    setTwister(pool[Math.floor(Math.random() * pool.length)]);
    setReps(0);
  };

  const handleRep = () => {
    sound.playPop(soundEnabled);
    setReps(r => r + 1);
  };

  const handleComplete = () => {
    const basePts = difficulty === 'Easy' ? 25 : difficulty === 'Medium' ? 35 : 55;
    sound.playSuccess(soundEnabled);
    onSuccess(basePts, `🗣️ Super vocal dexterity! Tongue-twister champion (${difficulty})!`);
  };

  return (
    <div className="flex flex-col items-center text-center py-2 select-none">
      <div className="w-full flex items-center justify-between px-2 mb-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-950/70 border border-amber-800 text-amber-200 text-xs font-bold">
          🗣️ Say {targetReps}× out loud as fast as you can!
        </div>
        <span className="px-2.5 py-0.5 rounded-lg text-xs font-black bg-[#151e33] border border-[#2a3958] text-amber-300">
          Tier: {difficulty}
        </span>
      </div>

      <div className="w-full bg-[#111a2c] border border-[#263149] rounded-2xl p-6 mb-4 shadow-lg relative">
        <p className="text-xl sm:text-2xl font-black font-display text-white leading-relaxed my-2">
          &ldquo;{twister.text}&rdquo;
        </p>

        <div className="mt-4 flex items-center justify-center gap-2">
          <button
            onClick={handleNextTwister}
            className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200 bg-[#18233c] px-3 py-1.5 rounded-lg border border-[#2c3a57] transition cursor-pointer"
          >
            <RotateCw className="w-3.5 h-3.5" /> Another Twister
          </button>
        </div>
      </div>

      <div className="w-full bg-[#0a1020] border border-[#263149] rounded-2xl p-4 mb-4 flex items-center justify-between">
        <div className="text-left">
          <p className="text-xs text-[#9ca7bd]">Count your repetitions:</p>
          <div className="text-lg font-black text-amber-300">{reps} of {targetReps} recited</div>
        </div>
        <button
          onClick={handleRep}
          className="px-4 py-2 bg-[#1f2b48] hover:bg-amber-900/40 text-amber-300 font-bold text-xs rounded-xl border border-amber-500/40 transition active:scale-95 flex items-center gap-1.5 cursor-pointer"
        >
          <CheckCircle2 className="w-4 h-4" /> Tap Repetition
        </button>
      </div>

      <button
        id="twister-done-btn"
        onClick={handleComplete}
        disabled={reps < targetReps}
        className="w-full py-3.5 rounded-xl font-black text-white bg-gradient-to-r from-amber-500 via-orange-500 to-pink-500 hover:opacity-95 active:scale-[0.98] transition disabled:opacity-40 shadow-lg shadow-amber-950/40 cursor-pointer"
      >
        I SAID IT {targetReps}× CLEANLY 🚀
      </button>
    </div>
  );
}
