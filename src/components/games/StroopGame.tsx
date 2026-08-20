import { useState, useEffect, useCallback } from 'react';
import { Difficulty } from '../../types';
import { sound } from '../../utils/audio';

interface Props {
  difficulty: Difficulty;
  onSuccess: (score: number, message: string) => void;
  onErrorToast: (msg: string) => void;
  onPenalty: (amount?: number, reason?: string) => void;
  soundEnabled: boolean;
}

const COLOR_NAMES = ['RED', 'BLUE', 'GREEN', 'YELLOW', 'PURPLE', 'ORANGE'];
const COLOR_VALUES: Record<string, string> = {
  RED: '#ef4444',
  BLUE: '#3b82f6',
  GREEN: '#22c55e',
  YELLOW: '#eab308',
  PURPLE: '#a855f7',
  ORANGE: '#f97316',
};

export function StroopGame({ difficulty, onSuccess, onErrorToast, onPenalty, soundEnabled }: Props) {
  const totalRounds = difficulty === 'Easy' ? 2 : difficulty === 'Medium' ? 3 : 5;
  const [round, setRound] = useState(1);
  const [word, setWord] = useState('RED');
  const [fontColorName, setFontColorName] = useState('BLUE');
  const [options, setOptions] = useState<string[]>([]);

  const generateRound = useCallback(() => {
    const wordChoice = COLOR_NAMES[Math.floor(Math.random() * COLOR_NAMES.length)];
    let colorChoice = COLOR_NAMES[Math.floor(Math.random() * COLOR_NAMES.length)];
    while (colorChoice === wordChoice) {
      colorChoice = COLOR_NAMES[Math.floor(Math.random() * COLOR_NAMES.length)];
    }

    setWord(wordChoice);
    setFontColorName(colorChoice);

    const optionCount = difficulty === 'Easy' ? 3 : difficulty === 'Medium' ? 4 : 6;
    const opts = new Set<string>([colorChoice]);
    while (opts.size < optionCount) {
      const rnd = COLOR_NAMES[Math.floor(Math.random() * COLOR_NAMES.length)];
      opts.add(rnd);
    }
    setOptions(Array.from(opts).sort(() => Math.random() - 0.5));
  }, [difficulty]);

  useEffect(() => {
    generateRound();
  }, [generateRound]);

  const handleChoice = (selectedColor: string) => {
    if (selectedColor === fontColorName) {
      sound.playPop(soundEnabled);
      if (round >= totalRounds) {
        const basePts = difficulty === 'Easy' ? 30 : difficulty === 'Medium' ? 45 : 65;
        sound.playSuccess(soundEnabled);
        onSuccess(basePts, `🎨 Mastered Stroop Effect (${difficulty}) in ${totalRounds} rounds!`);
      } else {
        setRound(r => r + 1);
        generateRound();
      }
    } else {
      sound.playError(soundEnabled);
      const penaltyAmount = difficulty === 'Easy' ? 5 : difficulty === 'Medium' ? 8 : 10;
      onPenalty(penaltyAmount, 'Stroop Color mismatch!');
      onErrorToast(`Incorrect! Select FONT COLOR (${fontColorName}). -${penaltyAmount} pts penalty.`);
    }
  };

  return (
    <div className="flex flex-col items-center text-center py-2 select-none">
      <div className="w-full flex items-center justify-between px-2 mb-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-pink-950/70 border border-pink-800 text-pink-200 text-xs font-bold">
          🎨 Stroop Color Clash
        </div>
        <div className="text-xs font-bold text-pink-400 bg-[#111a2c] px-3 py-1 rounded-lg border border-[#263149]">
          Round {round} / {totalRounds} ({difficulty})
        </div>
      </div>

      <div className="w-full bg-[#111a2c] border border-[#263149] rounded-2xl p-5 mb-4 shadow-lg">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
          Choose the <span className="text-white underline font-extrabold">FONT COLOR</span>
        </span>
        <div
          style={{ color: COLOR_VALUES[fontColorName] }}
          className="text-4xl sm:text-5xl font-black font-display tracking-widest my-3 filter drop-shadow-md select-none"
        >
          {word}
        </div>
        <p className="text-xs text-[#9ca7bd]">Do not read the word — identify the ink color!</p>
      </div>

      <div className="w-full grid grid-cols-2 gap-2.5">
        {options.map((opt) => (
          <button
            key={opt}
            id={`stroop-opt-${opt}`}
            onClick={() => handleChoice(opt)}
            className="py-3 px-4 bg-[#151d31] hover:bg-[#1e2a47] border border-[#263149] hover:border-pink-500/60 rounded-xl font-display font-extrabold text-base sm:text-lg text-white transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
          >
            <span
              className="w-3.5 h-3.5 rounded-full"
              style={{ backgroundColor: COLOR_VALUES[opt] }}
            />
            <span>{opt}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
