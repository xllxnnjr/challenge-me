import { useState, useEffect, useRef, useCallback } from 'react';
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

export function ReactionGame({
  difficulty,
  playerLevel = 1,
  onSuccess,
  onErrorToast,
  onPenalty,
  soundEnabled,
}: Props) {
  const [state, setState] = useState<'idle' | 'waiting' | 'ready' | 'clicked'>('idle');
  const [reactionTime, setReactionTime] = useState<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const timerRef = useRef<number | null>(null);

  // Reaction threshold gets tighter as level increases
  const levelAdjustment = Math.min((playerLevel - 1) * 10, 80);
  const baseCutoff = difficulty === 'Easy' ? 350 : difficulty === 'Medium' ? 270 : 200;
  const topCutoff = Math.max(140, baseCutoff - levelAdjustment);

  const startRound = useCallback(() => {
    setState('waiting');
    setReactionTime(null);
    startTimeRef.current = null;

    // Easy: 2.5s - 4.5s; Medium: 1.6s - 3.8s; Hard: 0.8s - 2.2s
    const minDelay = difficulty === 'Easy' ? 2500 : difficulty === 'Medium' ? 1600 : 800;
    const extraDelay = difficulty === 'Easy' ? 2000 : difficulty === 'Medium' ? 2200 : 1400;
    const delay = Math.max(600, minDelay - (playerLevel - 1) * 80) + Math.random() * extraDelay;

    timerRef.current = window.setTimeout(() => {
      setState('ready');
      startTimeRef.current = performance.now();
      sound.playBeep(soundEnabled, 880);
    }, delay);
  }, [difficulty, playerLevel, soundEnabled]);

  useEffect(() => {
    startRound();
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [startRound]);

  const handleTap = () => {
    if (state === 'waiting') {
      if (timerRef.current) clearTimeout(timerRef.current);
      sound.playError(soundEnabled);
      const penaltyAmount = difficulty === 'Easy' ? 5 : difficulty === 'Medium' ? 8 : 10;
      onPenalty(penaltyAmount, 'Premature tap before green signal!');
      onErrorToast(`Too early! -${penaltyAmount} pts penalty. Wait for green!`);
      setState('idle');
      setTimeout(startRound, 900);
      return;
    }

    if (state === 'ready' && startTimeRef.current) {
      const ms = Math.round(performance.now() - startTimeRef.current);
      setReactionTime(ms);
      setState('clicked');

      let pts = difficulty === 'Easy' ? 30 : difficulty === 'Medium' ? 45 : 65;
      if (ms < topCutoff) {
        pts += 15 + Math.min(playerLevel * 2, 20);
      }

      sound.playSuccess(soundEnabled);
      setTimeout(() => {
        onSuccess(pts, `⚡ Reflex speed: ${ms} ms (${difficulty} Tier, Lvl ${playerLevel})!`);
      }, 500);
    }
  };

  return (
    <div className="flex flex-col items-center text-center py-2 select-none">
      <div className="w-full flex items-center justify-between px-1 mb-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 border border-slate-700 text-slate-300 text-xs font-bold">
          ⚡ Reaction Reflex • Lvl {playerLevel}
        </div>
        <span className="px-2.5 py-0.5 rounded-lg text-xs font-black bg-[#151e33] border border-[#2a3958] text-amber-300">
          Tier: {difficulty}
        </span>
      </div>

      <p className="text-xs sm:text-sm text-[#9ca7bd] mb-5">
        {state === 'waiting' && 'Wait for it... Tap as fast as you can when green!'}
        {state === 'ready' && 'TAP TAP TAP! NOW!'}
        {state === 'idle' && 'Resetting... Get ready'}
        {state === 'clicked' && `Reaction: ${reactionTime} ms!`}
      </p>

      {/* Big Interactive Circle */}
      <button
        id="reaction-tap-target"
        type="button"
        onClick={handleTap}
        className={`w-44 h-44 sm:w-52 sm:h-52 rounded-full flex flex-col items-center justify-center font-black transition-all transform active:scale-95 shadow-2xl cursor-pointer select-none ${
          state === 'waiting'
            ? 'bg-gradient-to-br from-red-600 to-rose-900 text-white border-4 border-red-400/40 shadow-red-950/80 animate-pulse'
            : state === 'ready'
            ? 'bg-gradient-to-br from-emerald-400 to-green-600 text-black border-4 border-green-200 shadow-green-500/50 scale-105'
            : 'bg-[#151d31] text-slate-400 border border-slate-700'
        }`}
      >
        {state === 'waiting' && (
          <>
            <span className="text-4xl mb-1">✋</span>
            <span className="text-base font-extrabold tracking-wider">WAIT...</span>
          </>
        )}
        {state === 'ready' && (
          <>
            <span className="text-4xl mb-1 animate-bounce">⚡</span>
            <span className="text-2xl font-black tracking-widest uppercase">TAP!</span>
          </>
        )}
        {state === 'clicked' && (
          <>
            <span className="text-3xl font-display text-emerald-300">{reactionTime} ms</span>
            <span className="text-xs text-slate-300">Recorded</span>
          </>
        )}
      </button>

      <div className="mt-5 flex items-center justify-center gap-4 text-xs text-[#9ca7bd]">
        <span>🟢 Top Tier: &lt; {topCutoff}ms</span>
        <span className="text-rose-400/80">⚠️ False start = penalty</span>
      </div>
    </div>
  );
}
