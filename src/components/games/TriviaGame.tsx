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

interface Question {
  q: string;
  opts: string[];
  ans: number;
  fact: string;
  diff: Difficulty;
}

const TRIVIA_POOL: Question[] = [
  // Easy
  {
    q: 'How many legs does an insect have?',
    opts: ['4 Legs', '6 Legs', '8 Legs', '10 Legs'],
    ans: 1,
    fact: 'All insects have exactly 6 legs (3 pairs)!',
    diff: 'Easy',
  },
  {
    q: 'What is the largest ocean on Earth?',
    opts: ['Atlantic Ocean', 'Indian Ocean', 'Pacific Ocean', 'Arctic Ocean'],
    ans: 2,
    fact: 'The Pacific Ocean covers over 30% of Earth’s surface.',
    diff: 'Easy',
  },
  // Medium
  {
    q: 'How many hearts does an octopus have?',
    opts: ['1 Heart', '2 Hearts', '3 Hearts', '4 Hearts'],
    ans: 2,
    fact: 'Octopuses have 3 hearts: two pump blood to gills, one to the body!',
    diff: 'Medium',
  },
  {
    q: 'Which element makes up roughly 78% of Earth’s atmosphere?',
    opts: ['Oxygen', 'Nitrogen', 'Carbon Dioxide', 'Argon'],
    ans: 1,
    fact: 'Nitrogen gas (N2) makes up 78.08% of Earth’s atmosphere.',
    diff: 'Medium',
  },
  // Hard
  {
    q: 'Which planet in our solar system spins clockwise in retrograde?',
    opts: ['Venus', 'Mars', 'Jupiter', 'Neptune'],
    ans: 0,
    fact: 'Venus rotates clockwise, opposite to most other planets.',
    diff: 'Hard',
  },
  {
    q: 'Honey never spoils. Edible honey found in tombs is over how many years old?',
    opts: ['300 years', '1,000 years', '3,000 years', '10,000 years'],
    ans: 2,
    fact: 'Sealed honey from ancient Egyptian tombs 3,000+ years old is still edible!',
    diff: 'Hard',
  },
];

export function TriviaGame({ difficulty, onSuccess, onErrorToast, onPenalty, soundEnabled }: Props) {
  const [question, setQuestion] = useState<Question>(TRIVIA_POOL[0]);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);

  useEffect(() => {
    const matching = TRIVIA_POOL.filter(q => q.diff === difficulty);
    const pool = matching.length > 0 ? matching : TRIVIA_POOL;
    const randomQ = pool[Math.floor(Math.random() * pool.length)];
    setQuestion(randomQ);
    setSelectedIdx(null);
  }, [difficulty]);

  const handleSelect = (idx: number) => {
    if (selectedIdx !== null) return;
    setSelectedIdx(idx);

    if (idx === question.ans) {
      const basePts = difficulty === 'Easy' ? 30 : difficulty === 'Medium' ? 45 : 60;
      sound.playSuccess(soundEnabled);
      setTimeout(() => {
        onSuccess(basePts, `💡 Trivia genius! ${question.fact}`);
      }, 500);
    } else {
      sound.playError(soundEnabled);
      const penaltyAmount = difficulty === 'Easy' ? 5 : difficulty === 'Medium' ? 8 : 10;
      onPenalty(penaltyAmount, 'Incorrect trivia answer');
      onErrorToast(`Incorrect! Expected "${question.opts[question.ans]}". -${penaltyAmount} pts penalty.`);
      setTimeout(() => {
        const pool = TRIVIA_POOL.filter(q => q.diff === difficulty && q.q !== question.q);
        setQuestion(pool[Math.floor(Math.random() * pool.length)] || TRIVIA_POOL[0]);
        setSelectedIdx(null);
      }, 1400);
    }
  };

  return (
    <div className="flex flex-col items-center text-center py-2 select-none">
      <div className="w-full flex items-center justify-between px-2 mb-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-pink-950/70 border border-pink-800 text-pink-200 text-xs font-bold">
          💡 Quick Trivia
        </div>
        <span className="px-2.5 py-0.5 rounded-lg text-xs font-black bg-[#151e33] border border-[#2a3958] text-pink-300">
          Tier: {difficulty}
        </span>
      </div>

      <div className="w-full bg-[#111a2c] border border-[#263149] rounded-2xl p-4 sm:p-5 mb-4 shadow-md">
        <span className="text-xs text-amber-400 font-bold uppercase tracking-wider block mb-1">
          Curious Question
        </span>
        <h3 className="font-display font-extrabold text-white text-base sm:text-lg leading-snug">
          {question.q}
        </h3>
      </div>

      {/* 4 Choices */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full">
        {question.opts.map((opt, idx) => {
          let style = 'bg-[#131d33] hover:bg-[#1a2846] border-[#293856] text-white';
          if (selectedIdx !== null) {
            if (idx === question.ans) {
              style = 'bg-emerald-900/80 border-emerald-400 text-emerald-100 shadow-md';
            } else if (idx === selectedIdx) {
              style = 'bg-rose-950/80 border-rose-500 text-rose-200';
            } else {
              style = 'bg-[#0d1424] border-[#1f2a42] opacity-40 text-slate-400';
            }
          }

          return (
            <button
              key={opt}
              type="button"
              disabled={selectedIdx !== null}
              onClick={() => handleSelect(idx)}
              className={`p-3.5 rounded-xl border font-bold text-xs sm:text-sm text-left transition-all active:scale-98 flex items-center justify-between cursor-pointer ${style}`}
            >
              <span>{opt}</span>
              {selectedIdx !== null && idx === question.ans && <span>✓</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
