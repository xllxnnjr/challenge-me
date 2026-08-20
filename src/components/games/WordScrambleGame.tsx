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

const WORDS: { word: string; hint: string; diff: Difficulty }[] = [
  // Easy (4 letters)
  { word: 'STAR', hint: 'Glows in the night sky', diff: 'Easy' },
  { word: 'LION', hint: 'King of the jungle', diff: 'Easy' },
  { word: 'BLUE', hint: 'Color of a clear daytime sky', diff: 'Easy' },
  // Medium (5-6 letters)
  { word: 'PLANET', hint: 'Orbits a star in space', diff: 'Medium' },
  { word: 'GALAXY', hint: 'Massive system of millions of stars', diff: 'Medium' },
  { word: 'NATURE', hint: 'The physical world and living flora/fauna', diff: 'Medium' },
  // Hard (7-8 letters)
  { word: 'SPECTRUM', hint: 'Band of colors produced by light separation', diff: 'Hard' },
  { word: 'UNIVERSE', hint: 'All existing matter and spacetime', diff: 'Hard' },
  { word: 'DIAMOND', hint: 'Precious solid carbon gemstone', diff: 'Hard' },
];

export function WordScrambleGame({ difficulty, onSuccess, onErrorToast, onPenalty, soundEnabled }: Props) {
  const [selectedWord, setSelectedWord] = useState(WORDS[0]);
  const [scrambled, setScrambled] = useState<string[]>([]);
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const [assembled, setAssembled] = useState<string>('');

  useEffect(() => {
    const matching = WORDS.filter(w => w.diff === difficulty);
    const pool = matching.length > 0 ? matching : WORDS;
    const chosen = pool[Math.floor(Math.random() * pool.length)];
    setSelectedWord(chosen);

    // Scramble letters
    let letters = chosen.word.split('').sort(() => Math.random() - 0.5);
    while (letters.join('') === chosen.word && letters.length > 2) {
      letters = chosen.word.split('').sort(() => Math.random() - 0.5);
    }
    setScrambled(letters);
    setSelectedIndices([]);
    setAssembled('');
  }, [difficulty]);

  const handleLetterClick = (letter: string, index: number) => {
    if (selectedIndices.includes(index)) return;
    sound.playPop(soundEnabled);

    const nextIndices = [...selectedIndices, index];
    const nextAssembled = assembled + letter;
    setSelectedIndices(nextIndices);
    setAssembled(nextAssembled);

    if (nextAssembled.length === selectedWord.word.length) {
      if (nextAssembled === selectedWord.word) {
        const basePts = difficulty === 'Easy' ? 30 : difficulty === 'Medium' ? 45 : 70;
        sound.playSuccess(soundEnabled);
        onSuccess(basePts, `🔤 Vocabulary wizard! Solved "${selectedWord.word}" (${difficulty}).`);
      } else {
        sound.playError(soundEnabled);
        const penaltyAmount = difficulty === 'Easy' ? 5 : difficulty === 'Medium' ? 8 : 10;
        onPenalty(penaltyAmount, 'Incorrect anagram spelling');
        onErrorToast(`Not quite! "${nextAssembled}" is incorrect. -${penaltyAmount} pts penalty.`);
        setTimeout(() => {
          setSelectedIndices([]);
          setAssembled('');
        }, 800);
      }
    }
  };

  const handleReset = () => {
    sound.playClick(soundEnabled);
    setSelectedIndices([]);
    setAssembled('');
  };

  return (
    <div className="flex flex-col items-center text-center py-2 select-none">
      <div className="w-full flex items-center justify-between px-2 mb-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-950/70 border border-indigo-800 text-indigo-200 text-xs font-bold">
          🔤 Word Anagram
        </div>
        <span className="px-2.5 py-0.5 rounded-lg text-xs font-black bg-[#151e33] border border-[#2a3958] text-indigo-300">
          Tier: {difficulty}
        </span>
      </div>

      <div className="w-full bg-[#111a2c] border border-[#263149] rounded-2xl p-4 sm:p-5 mb-4 shadow-lg">
        <span className="text-xs text-amber-400 font-bold uppercase tracking-wider block mb-1">
          Hint: {selectedWord.hint}
        </span>
        <div className="text-2xl sm:text-3xl font-mono font-black text-white tracking-widest min-h-[40px] flex items-center justify-center">
          {assembled ? (
            <span className="text-purple-300">{assembled}</span>
          ) : (
            <span className="text-slate-600">_ _ _ _</span>
          )}
        </div>
      </div>

      {/* Scrambled Letter Tiles */}
      <div className="flex flex-wrap items-center justify-center gap-2 mb-4">
        {scrambled.map((letter, idx) => {
          const isUsed = selectedIndices.includes(idx);
          return (
            <button
              key={idx}
              type="button"
              disabled={isUsed}
              onClick={() => handleLetterClick(letter, idx)}
              className={`w-11 h-12 sm:w-13 sm:h-14 rounded-xl font-mono font-black text-xl sm:text-2xl transition border cursor-pointer ${
                isUsed
                  ? 'bg-[#0b101c] border-[#1a2336] text-slate-600 opacity-40'
                  : 'bg-[#18233d] hover:bg-[#202f52] border-indigo-500/50 text-white active:scale-95 shadow-md'
              }`}
            >
              {letter}
            </button>
          );
        })}
      </div>

      {selectedIndices.length > 0 && (
        <button
          type="button"
          onClick={handleReset}
          className="text-xs text-[#9ca7bd] hover:text-white underline cursor-pointer"
        >
          Clear & re-try
        </button>
      )}
    </div>
  );
}
