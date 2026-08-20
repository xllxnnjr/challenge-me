import { useState, useEffect } from 'react';
import { Check, X } from 'lucide-react';
import { Difficulty } from '../../types';
import { sound } from '../../utils/audio';

interface Props {
  difficulty: Difficulty;
  onSuccess: (score: number, message: string) => void;
  onErrorToast: (msg: string) => void;
  onPenalty: (amount?: number, reason?: string) => void;
  soundEnabled: boolean;
}

interface Fact {
  statement: string;
  isTrue: boolean;
  explanation: string;
}

const FACTS_POOL: Fact[] = [
  {
    statement: 'Botanically speaking, bananas are classified as berries.',
    isTrue: true,
    explanation: 'Yes! Bananas develop from a single ovary flower and meet botanical berry traits.',
  },
  {
    statement: 'Sharks are classified as marine mammals because they give live birth.',
    isTrue: false,
    explanation: 'False! Sharks are cartilaginous fish that breathe through gills.',
  },
  {
    statement: 'A day on Venus is longer than an entire year on Venus.',
    isTrue: true,
    explanation: 'True! Venus takes 243 Earth days to rotate, but only 225 Earth days to orbit the Sun.',
  },
  {
    statement: 'The Eiffel Tower can grow up to 15 cm taller during hot summers.',
    isTrue: true,
    explanation: 'True! Thermal expansion of wrought iron causes the structure to expand in heat.',
  },
  {
    statement: 'Humans only use 10% of their brain capacity at any given time.',
    isTrue: false,
    explanation: 'False! Neuroimaging proves virtually all brain regions are active each day.',
  },
];

export function TruthGame({ difficulty, onSuccess, onErrorToast, onPenalty, soundEnabled }: Props) {
  const [fact, setFact] = useState<Fact>(FACTS_POOL[0]);
  const [answered, setAnswered] = useState<boolean | null>(null);

  useEffect(() => {
    const randomFact = FACTS_POOL[Math.floor(Math.random() * FACTS_POOL.length)];
    setFact(randomFact);
    setAnswered(null);
  }, [difficulty]);

  const handleAnswer = (userGuess: boolean) => {
    if (answered !== null) return;
    setAnswered(userGuess);

    if (userGuess === fact.isTrue) {
      const basePts = difficulty === 'Easy' ? 25 : difficulty === 'Medium' ? 35 : 55;
      sound.playSuccess(soundEnabled);
      setTimeout(() => {
        onSuccess(basePts, `🌟 Spot on (${difficulty})! ${fact.explanation}`);
      }, 500);
    } else {
      sound.playError(soundEnabled);
      const penaltyAmount = difficulty === 'Easy' ? 5 : difficulty === 'Medium' ? 8 : 10;
      onPenalty(penaltyAmount, 'Incorrect Fact or Fiction choice');
      onErrorToast(`Incorrect! ${fact.explanation} -${penaltyAmount} pts penalty.`);
      setTimeout(() => {
        const remaining = FACTS_POOL.filter(f => f.statement !== fact.statement);
        setFact(remaining[Math.floor(Math.random() * remaining.length)] || FACTS_POOL[0]);
        setAnswered(null);
      }, 1500);
    }
  };

  return (
    <div className="flex flex-col items-center text-center py-2 select-none">
      <div className="w-full flex items-center justify-between px-2 mb-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/70 border border-emerald-800 text-emerald-200 text-xs font-bold">
          🔍 Fact or Fiction?
        </div>
        <span className="px-2.5 py-0.5 rounded-lg text-xs font-black bg-[#151e33] border border-[#2a3958] text-emerald-300">
          Tier: {difficulty}
        </span>
      </div>

      <div className="w-full bg-[#111a2c] border border-[#263149] rounded-2xl p-5 mb-5 shadow-md">
        <span className="text-[11px] text-[#9ca7bd] uppercase tracking-wider block mb-2 font-bold">
          Statement:
        </span>
        <blockquote className="font-display font-extrabold text-white text-base sm:text-lg leading-relaxed">
          &ldquo;{fact.statement}&rdquo;
        </blockquote>
      </div>

      {/* True or False Buttons */}
      <div className="grid grid-cols-2 gap-3 w-full">
        <button
          type="button"
          disabled={answered !== null}
          onClick={() => handleAnswer(true)}
          className="py-4 px-3 rounded-2xl font-display font-black text-base text-white bg-emerald-600 hover:bg-emerald-500 active:scale-95 transition shadow-lg shadow-emerald-950/50 flex items-center justify-center gap-2 cursor-pointer"
        >
          <Check className="w-5 h-5 text-white" />
          <span>TRUE</span>
        </button>

        <button
          type="button"
          disabled={answered !== null}
          onClick={() => handleAnswer(false)}
          className="py-4 px-3 rounded-2xl font-display font-black text-base text-white bg-rose-600 hover:bg-rose-500 active:scale-95 transition shadow-lg shadow-rose-950/50 flex items-center justify-center gap-2 cursor-pointer"
        >
          <X className="w-5 h-5 text-white" />
          <span>FALSE</span>
        </button>
      </div>
    </div>
  );
}
