import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, RotateCw, CheckCircle2, Play, Flame } from 'lucide-react';
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

type PadColor = 'red' | 'blue' | 'green' | 'yellow';

const PAD_CONFIG: { id: PadColor; name: string; color: string; activeColor: string; bgGlow: string; freq: number }[] = [
  {
    id: 'green',
    name: 'Emerald',
    color: 'bg-emerald-600/60 border-emerald-400/50 hover:bg-emerald-500/80',
    activeColor: 'bg-emerald-400 text-black shadow-[0_0_35px_rgba(52,211,153,0.9)] scale-105 ring-4 ring-emerald-300',
    bgGlow: 'from-emerald-500/30',
    freq: 329.63, // E4
  },
  {
    id: 'red',
    name: 'Ruby',
    color: 'bg-rose-600/60 border-rose-400/50 hover:bg-rose-500/80',
    activeColor: 'bg-rose-400 text-black shadow-[0_0_35px_rgba(251,113,133,0.9)] scale-105 ring-4 ring-rose-300',
    bgGlow: 'from-rose-500/30',
    freq: 261.63, // C4
  },
  {
    id: 'yellow',
    name: 'Amber',
    color: 'bg-amber-600/60 border-amber-400/50 hover:bg-amber-500/80',
    activeColor: 'bg-amber-300 text-black shadow-[0_0_35px_rgba(252,211,77,0.9)] scale-105 ring-4 ring-amber-200',
    bgGlow: 'from-amber-500/30',
    freq: 392.0, // G4
  },
  {
    id: 'blue',
    name: 'Sapphire',
    color: 'bg-cyan-600/60 border-cyan-400/50 hover:bg-cyan-500/80',
    activeColor: 'bg-cyan-400 text-black shadow-[0_0_35px_rgba(34,211,238,0.9)] scale-105 ring-4 ring-cyan-300',
    bgGlow: 'from-cyan-500/30',
    freq: 523.25, // C5
  },
];

const COLORS: PadColor[] = ['green', 'red', 'yellow', 'blue'];

export function SimonGame({
  difficulty,
  onSuccess,
  onErrorToast,
  onPenalty,
  soundEnabled,
}: Props) {
  const [sequence, setSequence] = useState<PadColor[]>([]);
  const [userStep, setUserStep] = useState(0);
  const [isPlayingSequence, setIsPlayingSequence] = useState(false);
  const [activePad, setActivePad] = useState<PadColor | null>(null);
  const [round, setRound] = useState(1);
  const [hasStarted, setHasStarted] = useState(false);
  const [lives, setLives] = useState(difficulty === 'Hard' ? 1 : 2);

  const targetRounds = difficulty === 'Easy' ? 4 : difficulty === 'Medium' ? 5 : 7;
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Initialize Web Audio
  const playTone = (freq: number) => {
    if (!soundEnabled) return;
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') ctx.resume();

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } catch {}
  };

  // Start initial sequence
  const startNewGame = () => {
    const initialColors: PadColor[] = [];
    for (let i = 0; i < targetRounds; i++) {
      const randColor = COLORS[Math.floor(Math.random() * COLORS.length)];
      initialColors.push(randColor);
    }
    setSequence(initialColors);
    setRound(1);
    setUserStep(0);
    setHasStarted(true);
    playRoundSequence(initialColors, 1);
  };

  const playRoundSequence = async (seq: PadColor[], currentRound: number) => {
    setIsPlayingSequence(true);
    setUserStep(0);

    const speed = difficulty === 'Hard' ? 350 : difficulty === 'Medium' ? 450 : 550;

    await new Promise((r) => setTimeout(r, 600));

    for (let i = 0; i < currentRound; i++) {
      const col = seq[i];
      setActivePad(col);
      const conf = PAD_CONFIG.find((p) => p.id === col);
      if (conf) playTone(conf.freq);
      haptics.selection();

      await new Promise((r) => setTimeout(r, speed));
      setActivePad(null);
      await new Promise((r) => setTimeout(r, 150));
    }

    setIsPlayingSequence(false);
  };

  const handlePadClick = (col: PadColor) => {
    if (isPlayingSequence || !hasStarted) return;

    const conf = PAD_CONFIG.find((p) => p.id === col);
    if (conf) playTone(conf.freq);
    haptics.light();

    // Flash user pad click
    setActivePad(col);
    setTimeout(() => setActivePad(null), 200);

    const expected = sequence[userStep];
    if (col === expected) {
      // Correct step
      const nextStep = userStep + 1;
      setUserStep(nextStep);

      if (nextStep === round) {
        // Finished current round!
        if (round === targetRounds) {
          // Completed entire challenge!
          sound.playSuccess(soundEnabled);
          haptics.success();
          const pts = difficulty === 'Easy' ? 40 : difficulty === 'Medium' ? 55 : 75;
          onSuccess(pts, `🧠 Flawless Color Recall! Mastered all ${targetRounds} sequence steps!`);
        } else {
          // Next round
          sound.playPop(soundEnabled);
          haptics.selection();
          const nextRound = round + 1;
          setRound(nextRound);
          setTimeout(() => {
            playRoundSequence(sequence, nextRound);
          }, 800);
        }
      }
    } else {
      // Mistake
      sound.playError(soundEnabled);
      haptics.error();

      if (lives > 1) {
        setLives((l) => l - 1);
        onErrorToast('Incorrect pad! Replaying sequence...');
        setTimeout(() => {
          playRoundSequence(sequence, round);
        }, 1000);
      } else {
        if (onPenalty) onPenalty(4, 'Sequence memory failed');
        onErrorToast('Wrong sequence! Try again.');
        startNewGame();
      }
    }
  };

  useEffect(() => {
    startNewGame();
    return () => {
      if (audioCtxRef.current) {
        audioCtxRef.current.close().catch(() => {});
      }
    };
  }, [difficulty]);

  return (
    <div className="flex flex-col items-center text-center py-1 select-none">
      {/* Header Info */}
      <div className="w-full flex items-center justify-between px-1 mb-3">
        <div className="flex items-center gap-1 text-xs font-black text-amber-300 bg-amber-500/15 border border-amber-400/30 px-3 py-1 rounded-full">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Color Memory Sequence</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded-lg text-xs font-black bg-[#151e33] border border-[#2a3958] text-white">
            Level {round} / {targetRounds}
          </span>
        </div>
      </div>

      {/* Center Status Card */}
      <div className="w-full bg-[#0d1222]/90 border border-white/10 rounded-[24px] p-3 mb-4 flex items-center justify-between">
        <span className="text-xs font-bold text-slate-300">
          {isPlayingSequence ? '👀 Watch & listen carefully...' : '👉 Your turn: Repeat the sequence!'}
        </span>
        <span className="text-xs font-black text-amber-400">
          Step {userStep} / {round}
        </span>
      </div>

      {/* 2x2 Simon Pad Matrix */}
      <div className="w-full max-w-[280px] sm:max-w-[320px] aspect-square grid grid-cols-2 gap-3.5 p-4 rounded-[36px] bg-[#070b16] border-2 border-white/15 shadow-[0_16px_50px_rgba(0,0,0,0.8)] relative">
        {/* Center glowing orb */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full bg-[#0a1020] border-2 border-white/20 flex items-center justify-center z-10 shadow-lg pointer-events-none">
          <span className="text-xs font-black font-display text-white">
            {round}/{targetRounds}
          </span>
        </div>

        {PAD_CONFIG.map((pad) => {
          const isActive = activePad === pad.id;
          return (
            <button
              key={pad.id}
              type="button"
              disabled={isPlayingSequence}
              onClick={() => handlePadClick(pad.id)}
              className={`rounded-[26px] border-2 transition-all duration-150 cursor-pointer active:scale-90 flex items-center justify-center relative overflow-hidden ${
                isActive ? pad.activeColor : pad.color
              }`}
            >
              {isActive && (
                <div className="absolute inset-0 bg-white/30 animate-ping rounded-[26px] pointer-events-none" />
              )}
            </button>
          );
        })}
      </div>

      <p className="text-[11px] text-slate-400 mt-4">
        Memorize the sound tones and light flashes to reproduce the exact pattern.
      </p>
    </div>
  );
}
