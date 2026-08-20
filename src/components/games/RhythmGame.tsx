import { useState, useEffect, useRef } from 'react';
import { Difficulty } from '../../types';
import { sound } from '../../utils/audio';

interface Props {
  difficulty: Difficulty;
  onSuccess: (score: number, message: string) => void;
  onErrorToast: (msg: string) => void;
  onPenalty: (amount?: number, reason?: string) => void;
  soundEnabled: boolean;
}

export function RhythmGame({ difficulty, onSuccess, onErrorToast, onPenalty, soundEnabled }: Props) {
  const totalRounds = difficulty === 'Easy' ? 2 : difficulty === 'Medium' ? 3 : 5;
  const tolerance = difficulty === 'Easy' ? 0.25 : difficulty === 'Medium' ? 0.18 : 0.12;

  const [round, setRound] = useState(1);
  const [scale, setScale] = useState(2.2);
  const [isRunning, setIsRunning] = useState(true);
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    let currentScale = 2.2;
    const baseSpeed = difficulty === 'Easy' ? 0.016 : difficulty === 'Medium' ? 0.022 : 0.032;
    const speed = baseSpeed + round * 0.004;

    const loop = () => {
      currentScale -= speed;
      if (currentScale < 0.4) {
        currentScale = 2.2;
      }
      setScale(currentScale);
      animFrameRef.current = requestAnimationFrame(loop);
    };

    if (isRunning) {
      animFrameRef.current = requestAnimationFrame(loop);
    }

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isRunning, round, difficulty]);

  const handleStrike = () => {
    const diff = Math.abs(scale - 1.0);

    if (diff <= tolerance) {
      sound.playPop(soundEnabled);
      if (round >= totalRounds) {
        setIsRunning(false);
        const basePts = difficulty === 'Easy' ? 30 : difficulty === 'Medium' ? 50 : 75;
        sound.playSuccess(soundEnabled);
        onSuccess(basePts, `🥁 Rhythm Maestro! ${totalRounds}/${totalRounds} perfect beat strikes (${difficulty}).`);
      } else {
        setRound(r => r + 1);
        setScale(2.2);
      }
    } else {
      sound.playError(soundEnabled);
      const penaltyAmount = difficulty === 'Easy' ? 4 : difficulty === 'Medium' ? 7 : 10;
      onPenalty(penaltyAmount, 'Missed rhythm timing');
      onErrorToast(`${scale > 1.0 ? 'Too early!' : 'Too late!'} Strike on the marker. -${penaltyAmount} pts penalty.`);
    }
  };

  return (
    <div className="flex flex-col items-center text-center py-2 select-none">
      <div className="w-full flex items-center justify-between px-2 mb-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-950/70 border border-cyan-800 text-cyan-200 text-xs font-bold">
          🥁 Rhythm Strike
        </div>
        <div className="text-xs font-black text-cyan-300 bg-[#111a2c] px-3 py-1 rounded-lg border border-[#263149]">
          Round: <span className="text-white text-sm">{round}</span> / {totalRounds} ({difficulty})
        </div>
      </div>

      <p className="text-xs text-[#9ca7bd] mb-3">
        Tap <strong className="text-cyan-300">STRIKE</strong> the exact instant the outer ring aligns with the inner target!
      </p>

      {/* Rhythm Circle Visualizer */}
      <div className="w-48 h-48 sm:w-56 sm:h-56 relative flex items-center justify-center my-2 bg-[#0a1020] rounded-full border border-[#263149] shadow-inner overflow-hidden">
        {/* Center Target Marker (Scale 1.0) */}
        <div className="w-20 h-20 rounded-full border-4 border-cyan-400 bg-cyan-500/20 shadow-lg shadow-cyan-500/30 flex items-center justify-center text-2xl z-10 animate-pulse">
          🎯
        </div>

        {/* Shrinking Ring */}
        <div
          style={{
            transform: `scale(${scale})`,
          }}
          className={`w-20 h-20 rounded-full border-4 absolute pointer-events-none transition-transform duration-75 ${
            Math.abs(scale - 1.0) <= tolerance
              ? 'border-emerald-400 shadow-lg shadow-emerald-400/80 bg-emerald-500/10'
              : 'border-pink-500 shadow-md shadow-pink-500/40'
          }`}
        />
      </div>

      <button
        id="rhythm-strike-btn"
        type="button"
        onClick={handleStrike}
        className="w-full mt-3 py-3.5 rounded-xl font-display font-black text-lg tracking-wider text-white bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-600 hover:opacity-95 active:scale-95 transition shadow-lg shadow-cyan-950/40 cursor-pointer"
      >
        ⚡ STRIKE NOW!
      </button>
    </div>
  );
}
