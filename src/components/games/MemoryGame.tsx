import { useState, useEffect } from 'react';
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

const ITEMS = [
  { id: 1, label: '🔴', name: 'Red', color: 'border-red-500 bg-red-950/40 text-red-400' },
  { id: 2, label: '🔵', name: 'Blue', color: 'border-blue-500 bg-blue-950/40 text-blue-400' },
  { id: 3, label: '🟢', name: 'Green', color: 'border-green-500 bg-green-950/40 text-green-400' },
  { id: 4, label: '🟡', name: 'Yellow', color: 'border-yellow-500 bg-yellow-950/40 text-yellow-400' },
  { id: 5, label: '🟣', name: 'Purple', color: 'border-purple-500 bg-purple-950/40 text-purple-400' },
];

export function MemoryGame({
  difficulty,
  playerLevel = 1,
  onSuccess,
  onErrorToast,
  onPenalty,
  soundEnabled,
}: Props) {
  const [phase, setPhase] = useState<'memorize' | 'recall'>('memorize');
  const [sequence, setSequence] = useState<number[]>([]);
  const [userInput, setUserInput] = useState<number[]>([]);

  // Sequence length scales with difficulty and player level
  const baseLength = difficulty === 'Easy' ? 3 : difficulty === 'Medium' ? 5 : 6;
  const levelBonusLength = Math.min(Math.floor((playerLevel - 1) / 3), 2);
  const seqLength = baseLength + levelBonusLength;

  const initialCountdown = difficulty === 'Easy' ? 4 : difficulty === 'Medium' ? 3 : 2;
  const [countdown, setCountdown] = useState(initialCountdown);

  useEffect(() => {
    const seq = Array.from({ length: seqLength }, () => Math.floor(Math.random() * 4) + 1);
    setSequence(seq);
    setCountdown(initialCountdown);

    const timer = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) {
          clearInterval(timer);
          setPhase('recall');
          return 0;
        }
        return c - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [difficulty, seqLength, initialCountdown]);

  const handlePick = (id: number) => {
    sound.playPop(soundEnabled);
    const updated = [...userInput, id];
    setUserInput(updated);

    // Check if match so far
    const stepIdx = updated.length - 1;
    if (updated[stepIdx] !== sequence[stepIdx]) {
      sound.playError(soundEnabled);
      const penaltyAmount = difficulty === 'Easy' ? 5 : difficulty === 'Medium' ? 8 : 10;
      onPenalty(penaltyAmount, 'Incorrect item in memory sequence!');
      onErrorToast(`Wrong sequence step! -${penaltyAmount} pts penalty.`);
      setUserInput([]);
      return;
    }

    // Complete sequence
    if (updated.length === sequence.length) {
      const baseScore = difficulty === 'Easy' ? 30 : difficulty === 'Medium' ? 45 : 65;
      sound.playSuccess(soundEnabled);
      onSuccess(
        baseScore,
        `Flawless ${sequence.length}-step recall in ${difficulty} tier (Lvl ${playerLevel})!`
      );
    }
  };

  const handleReset = () => {
    sound.playClick(soundEnabled);
    setUserInput([]);
  };

  return (
    <div className="flex flex-col items-center text-center py-2 select-none">
      {phase === 'memorize' ? (
        <div className="w-full space-y-4 animate-in fade-in duration-300">
          <div className="w-full flex items-center justify-between px-1 mb-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-pink-950/70 border border-pink-800 text-pink-200 text-xs font-bold">
              👀 Memorize in {countdown}s
            </div>
            <span className="px-2.5 py-0.5 rounded-lg text-xs font-black bg-[#151e33] border border-[#2a3958] text-pink-300">
              Tier: {difficulty} • Lvl {playerLevel} ({seqLength} items)
            </span>
          </div>

          <div className="w-full bg-[#111a2c] border border-[#263149] rounded-2xl p-5 sm:p-6 shadow-lg">
            <p className="text-xs text-[#9ca7bd] mb-3">Remember this exact order from left to right:</p>
            <div className="flex flex-wrap justify-center items-center gap-2 sm:gap-3 py-3">
              {sequence.map((num, i) => {
                const item = ITEMS.find(x => x.id === num);
                return (
                  <div
                    key={i}
                    className="w-11 h-11 sm:w-13 sm:h-13 rounded-2xl bg-[#1c263c] border-2 border-indigo-500/40 flex items-center justify-center text-2xl shadow-md transform hover:scale-105 transition"
                  >
                    {item?.label}
                  </div>
                );
              })}
            </div>
            <div className="w-full bg-[#1c263c] rounded-full h-1.5 mt-3 overflow-hidden">
              <div
                className="bg-gradient-to-r from-pink-500 to-yellow-400 h-full transition-all duration-1000 ease-linear"
                style={{ width: `${(countdown / initialCountdown) * 100}%` }}
              />
            </div>
          </div>

          <button
            type="button"
            onClick={() => setPhase('recall')}
            className="px-6 py-2.5 bg-[#1f2b48] hover:bg-[#28385e] text-white text-sm font-bold rounded-xl transition cursor-pointer"
          >
            I&apos;M READY NOW ⚡
          </button>
        </div>
      ) : (
        <div className="w-full space-y-4 animate-in fade-in duration-300">
          <div className="w-full flex items-center justify-between px-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-950/70 border border-indigo-800 text-indigo-200 text-xs font-bold">
              🧠 Tap in order ({userInput.length}/{sequence.length})
            </div>
            <span className="text-xs text-[#9ca7bd]">{difficulty} Mode • Lvl {playerLevel}</span>
          </div>

          {/* User Progress Slots */}
          <div className="flex flex-wrap justify-center items-center gap-2 p-4 bg-[#111a2c] border border-[#263149] rounded-2xl">
            {Array.from({ length: sequence.length }).map((_, i) => {
              const pickedId = userInput[i];
              const item = ITEMS.find(x => x.id === pickedId);
              return (
                <div
                  key={i}
                  className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl border flex items-center justify-center text-xl transition ${
                    item
                      ? 'bg-[#1a253d] border-indigo-400 text-white scale-100'
                      : 'bg-[#0a1020] border-[#263149] border-dashed text-slate-600'
                  }`}
                >
                  {item ? item.label : '•'}
                </div>
              );
            })}
          </div>

          {/* Selection buttons */}
          <div className="grid grid-cols-2 gap-2.5 pt-1">
            {ITEMS.slice(0, 4).map((it) => (
              <button
                key={it.id}
                type="button"
                id={`memory-choice-${it.id}`}
                onClick={() => handlePick(it.id)}
                className={`py-3 px-4 rounded-xl font-bold flex items-center justify-center gap-2 border transition active:scale-95 hover:brightness-110 cursor-pointer ${it.color}`}
              >
                <span className="text-2xl">{it.label}</span>
                <span>{it.name}</span>
              </button>
            ))}
          </div>

          {userInput.length > 0 && (
            <button
              type="button"
              onClick={handleReset}
              className="text-xs text-[#9ca7bd] hover:text-white underline transition cursor-pointer"
            >
              Clear selection & restart
            </button>
          )}
        </div>
      )}
    </div>
  );
}
