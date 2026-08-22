import React, { useState, useEffect } from 'react';
import { Volume2, Music, Check, X, Sparkles, ArrowUp, ArrowDown, Equal } from 'lucide-react';
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

export function PitchMatchGame({
  difficulty,
  onSuccess,
  onErrorToast,
  onPenalty,
  soundEnabled,
}: Props) {
  const [pitch1, setPitch1] = useState(440);
  const [pitch2, setPitch2] = useState(550);
  const [selectedAns, setSelectedAns] = useState<'higher' | 'lower' | 'same' | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // Play audio frequency via Web Audio API
  const playTone = (freq: number, durationSec = 0.4, delaySec = 0) => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + delaySec);

      gain.gain.setValueAtTime(0.01, ctx.currentTime + delaySec);
      gain.gain.exponentialRampToValueAtTime(0.3, ctx.currentTime + delaySec + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delaySec + durationSec);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + delaySec);
      osc.stop(ctx.currentTime + delaySec + durationSec);
    } catch {}
  };

  const generateRound = () => {
    // Generate base frequency (260Hz - 600Hz)
    const base = Math.floor(260 + Math.random() * 300);
    const step = difficulty === 'Easy' ? 120 : difficulty === 'Medium' ? 70 : 35;
    const relation = Math.random() > 0.5 ? 1 : -1;
    const second = relation === 1 ? base + step : base - step;

    setPitch1(base);
    setPitch2(second);
    setSelectedAns(null);
  };

  useEffect(() => {
    generateRound();
  }, [difficulty]);

  const playSequence = () => {
    setIsPlaying(true);
    haptics.selection();
    // Play Note 1 then Note 2
    playTone(pitch1, 0.4, 0);
    setTimeout(() => {
      playTone(pitch2, 0.4, 0);
    }, 550);

    setTimeout(() => {
      setIsPlaying(false);
    }, 1100);
  };

  useEffect(() => {
    const t = setTimeout(() => {
      playSequence();
    }, 300);
    return () => clearTimeout(t);
  }, [pitch1, pitch2]);

  const handleChoice = (choice: 'higher' | 'lower' | 'same') => {
    if (selectedAns) return;
    setSelectedAns(choice);

    const actual = pitch2 > pitch1 ? 'higher' : pitch2 < pitch1 ? 'lower' : 'same';

    if (choice === actual) {
      sound.playSuccess(soundEnabled);
      haptics.celebration();
      const score = difficulty === 'Easy' ? 45 : difficulty === 'Medium' ? 60 : 75;
      onSuccess(
        score,
        `Pitch Perfect! Note 2 (${pitch2}Hz) was indeed ${actual.toUpperCase()} than Note 1 (${pitch1}Hz)!`
      );
    } else {
      sound.playError(soundEnabled);
      haptics.error();
      if (onPenalty) onPenalty(15, `Incorrect pitch evaluation. Note 2 was ${actual}`);
      onErrorToast(`❌ Missed! Note 2 was actually ${actual.toUpperCase()} in pitch.`);
    }
  };

  return (
    <div className="space-y-4">
      {/* Visualizer Tone Banner */}
      <div className="rounded-[26px] bg-gradient-to-br from-indigo-950/60 via-[#100e28] to-purple-950/40 border border-indigo-500/30 p-5 text-center shadow-xl relative overflow-hidden">
        <div className="flex justify-center items-center gap-4 py-3">
          <div
            className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl border-2 transition-all ${
              isPlaying
                ? 'border-indigo-400 bg-indigo-500/30 scale-105 shadow-lg shadow-indigo-500/30 animate-pulse'
                : 'border-white/10 bg-black/40 text-slate-300'
            }`}
          >
            🎵
          </div>
          <span className="text-xl font-black text-slate-500">➔</span>
          <div
            className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl border-2 transition-all ${
              isPlaying
                ? 'border-purple-400 bg-purple-500/30 scale-105 shadow-lg shadow-purple-500/30 animate-pulse'
                : 'border-white/10 bg-black/40 text-slate-300'
            }`}
          >
            🎶
          </div>
        </div>

        <h3 className="font-display font-black text-white text-sm sm:text-base mt-1">
          Is the 2nd Musical Tone Higher or Lower?
        </h3>
        <p className="text-xs text-[#94a3b8] mt-0.5">
          Listen carefully to the pitch frequency shift between Tone 1 and Tone 2.
        </p>

        <button
          type="button"
          onClick={playSequence}
          disabled={isPlaying}
          className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-400/40 text-xs font-bold transition active:scale-95 cursor-pointer shadow-md"
        >
          <Volume2 className="w-4 h-4" />
          <span>{isPlaying ? 'Playing Tones...' : 'Replay Notes 🔊'}</span>
        </button>
      </div>

      {/* Choice Buttons */}
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          disabled={!!selectedAns}
          onClick={() => handleChoice('higher')}
          className="p-4 rounded-[22px] bg-gradient-to-r from-emerald-600/20 to-teal-600/30 hover:from-emerald-600/30 hover:to-teal-600/40 border border-emerald-400/40 text-emerald-300 font-display font-black text-sm sm:text-base flex flex-col items-center justify-center gap-1.5 transition active:scale-95 shadow-md cursor-pointer"
        >
          <ArrowUp className="w-5 h-5 text-emerald-400" />
          <span>HIGHER PITCH ⬆️</span>
        </button>

        <button
          type="button"
          disabled={!!selectedAns}
          onClick={() => handleChoice('lower')}
          className="p-4 rounded-[22px] bg-gradient-to-r from-rose-600/20 to-pink-600/30 hover:from-rose-600/30 hover:to-pink-600/40 border border-rose-400/40 text-rose-300 font-display font-black text-sm sm:text-base flex flex-col items-center justify-center gap-1.5 transition active:scale-95 shadow-md cursor-pointer"
        >
          <ArrowDown className="w-5 h-5 text-rose-400" />
          <span>LOWER PITCH ⬇️</span>
        </button>
      </div>
    </div>
  );
}
