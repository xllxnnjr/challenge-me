import { useState, useEffect, useRef } from 'react';
import { Flame } from 'lucide-react';
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

export function SpeedTapGame({
  difficulty,
  playerLevel = 1,
  onSuccess,
  onErrorToast,
  onPenalty,
  soundEnabled,
}: Props) {
  // Goal scales with both difficulty and player level
  const baseGoal = difficulty === 'Easy' ? 15 : difficulty === 'Medium' ? 22 : 30;
  const levelScalingGoal = Math.min((playerLevel - 1) * 2, 10);
  const targetGoal = baseGoal + levelScalingGoal;

  const [gameState, setGameState] = useState<'idle' | 'running' | 'finished'>('idle');
  const [taps, setTaps] = useState(0);
  const [timeLeft, setTimeLeft] = useState(5.0);
  const intervalRef = useRef<number | null>(null);
  const hasFinishedRef = useRef(false);

  const startTest = () => {
    hasFinishedRef.current = false;
    setGameState('running');
    setTaps(0);
    setTimeLeft(5.0);
    sound.playPop(soundEnabled);

    const startTime = Date.now();
    intervalRef.current = window.setInterval(() => {
      const elapsed = (Date.now() - startTime) / 1000;
      const remaining = Math.max(0, 5.0 - elapsed);
      setTimeLeft(parseFloat(remaining.toFixed(1)));

      if (remaining <= 0) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        setGameState('finished');
      }
    }, 50);
  };

  useEffect(() => {
    if (gameState === 'finished' && !hasFinishedRef.current) {
      hasFinishedRef.current = true;
      const cps = (taps / 5).toFixed(1);
      if (taps >= targetGoal) {
        const basePts = difficulty === 'Easy' ? 30 : difficulty === 'Medium' ? 45 : 70;
        sound.playSuccess(soundEnabled);
        onSuccess(
          basePts,
          `⚡ Blazing speed! ${taps} taps recorded (${cps} CPS on ${difficulty}, Lvl ${playerLevel}).`
        );
      } else {
        sound.playError(soundEnabled);
        const penaltyAmount = difficulty === 'Easy' ? 4 : difficulty === 'Medium' ? 6 : 10;
        onPenalty(penaltyAmount, 'Failed speed tap target goal');
        onErrorToast(`Recorded ${taps} taps. Target was ${targetGoal}+ taps! -${penaltyAmount} pts penalty.`);
      }
    }
  }, [gameState, taps, targetGoal, difficulty, playerLevel, onSuccess, onErrorToast, onPenalty, soundEnabled]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const handleTap = () => {
    if (gameState === 'idle') {
      startTest();
      setTaps(1);
      return;
    }

    if (gameState === 'running') {
      setTaps(t => t + 1);
      sound.playPop(soundEnabled);
    }
  };

  return (
    <div className="flex flex-col items-center text-center py-2 select-none">
      <div className="w-full flex items-center justify-between px-2 mb-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-950/70 border border-amber-800 text-amber-200 text-xs font-bold">
          ⚡ Turbo Tap • Lvl {playerLevel}
        </div>
        <div className="text-xs font-black text-amber-300 bg-[#111a2c] px-3 py-1 rounded-lg border border-[#263149]">
          Goal: <span className="text-white text-sm font-mono">{targetGoal}+ taps</span>
        </div>
      </div>

      <p className="text-xs text-[#9ca7bd] mb-3">
        Tap the Turbo button as fast as you can in 5 seconds! Goal: {targetGoal}+ taps ({difficulty} Mode).
      </p>

      {/* Turbo Button */}
      <div className="my-2">
        <button
          id="speed-tap-btn"
          type="button"
          onClick={handleTap}
          className={`w-36 h-36 sm:w-40 sm:h-40 rounded-full font-display font-black text-2xl tracking-wider text-white shadow-2xl flex flex-col items-center justify-center transition-transform active:scale-90 select-none cursor-pointer border-4 ${
            gameState === 'running'
              ? 'bg-gradient-to-tr from-amber-500 via-orange-500 to-red-600 border-amber-300 shadow-orange-500/50 animate-pulse'
              : 'bg-gradient-to-tr from-amber-600 to-orange-700 border-amber-400 hover:opacity-95'
          }`}
        >
          <Flame className="w-8 h-8 mb-1 text-amber-200 animate-bounce" />
          <span>{gameState === 'idle' ? 'START' : `${taps}`}</span>
          <span className="text-[10px] uppercase font-bold text-amber-200 tracking-widest mt-0.5">
            {gameState === 'idle' ? 'TAP TO BEGIN' : 'TAP! TAP!'}
          </span>
        </button>
      </div>

      <div className="w-full mt-4 bg-[#111a2c] border border-[#263149] rounded-xl p-2.5 flex items-center justify-between text-xs text-[#9ca7bd]">
        <span>Current Taps: <strong className="text-white font-mono text-sm">{taps}</strong></span>
        <span>Speed: <strong className="text-amber-400 font-mono text-sm">{((taps / Math.max(0.1, 5 - timeLeft)) || 0).toFixed(1)}</strong> CPS</span>
      </div>

      {gameState === 'finished' && taps < targetGoal && (
        <button
          onClick={startTest}
          className="mt-3 w-full py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 font-bold text-xs text-white transition cursor-pointer"
        >
          Try Again 🔄
        </button>
      )}
    </div>
  );
}
