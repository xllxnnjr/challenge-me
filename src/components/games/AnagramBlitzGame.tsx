import React, { useState, useEffect, useRef, useCallback } from 'react';
import { SpellCheck, Check, X, RefreshCw, Clock, Lightbulb } from 'lucide-react';
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

interface AnagramWord {
  scrambled: string;
  solution: string;
  hint: string;
  category: string;
}

const ANAGRAM_VAULT: AnagramWord[] = [
  { scrambled: 'G A L A X Y', solution: 'GALAXY', hint: 'A massive system of billions of stars', category: 'Cosmos' },
  { scrambled: 'P Y R A M I D', solution: 'PYRAMID', hint: 'Ancient monumental Egyptian tomb', category: 'History' },
  { scrambled: 'C Y B E R', solution: 'CYBER', hint: 'Relating to computers and the internet', category: 'Tech' },
  { scrambled: 'Q U A N T U M', solution: 'QUANTUM', hint: 'Smallest discrete quantity of energy in physics', category: 'Science' },
  { scrambled: 'N E U R O N', solution: 'NEURON', hint: 'A specialized brain cell transmitting impulses', category: 'Biology' },
  { scrambled: 'C I N E M A', solution: 'CINEMA', hint: 'The art of film-making and movie theatres', category: 'Culture' },
  { scrambled: 'E N I G M A', solution: 'ENIGMA', hint: 'A person or thing that is mysterious or difficult to understand', category: 'Language' },
];

export function AnagramBlitzGame({
  difficulty,
  onSuccess,
  onErrorToast,
  onPenalty,
  soundEnabled,
}: Props) {
  const [targetWord, setTargetWord] = useState<AnagramWord>(ANAGRAM_VAULT[0]);
  const [letterTiles, setLetterTiles] = useState<{ id: number; char: string; used: boolean }[]>([]);
  const [assembledWord, setAssembledWord] = useState<{ tileId: number; char: string }[]>([]);
  const [timeLeft, setTimeLeft] = useState(20);
  const [showHint, setShowHint] = useState(false);
  const hasTimedOutRef = useRef(false);

  const initRound = useCallback(() => {
    const word = ANAGRAM_VAULT[Math.floor(Math.random() * ANAGRAM_VAULT.length)];
    setTargetWord(word);

    // Shuffle letters of solution
    const letters = word.solution.split('');
    const shuffled = [...letters].sort(() => 0.5 - Math.random());
    // Ensure not already equal to solution
    if (shuffled.join('') === word.solution) {
      shuffled.reverse();
    }

    setLetterTiles(shuffled.map((c, i) => ({ id: i, char: c, used: false })));
    setAssembledWord([]);
    setShowHint(false);
    setTimeLeft(difficulty === 'Easy' ? 25 : difficulty === 'Medium' ? 18 : 14);
    hasTimedOutRef.current = false;
  }, [difficulty]);

  useEffect(() => {
    initRound();
  }, [initRound]);

  const handleTimeOut = useCallback(() => {
    sound.playError(soundEnabled);
    haptics.error();
    if (onPenalty) onPenalty(15, `Time expired on Anagram: ${targetWord.solution}`);
    onErrorToast(`⏰ Time expired! The secret word was "${targetWord.solution}"`);
  }, [soundEnabled, onPenalty, onErrorToast, targetWord.solution]);

  useEffect(() => {
    if (timeLeft <= 0) {
      if (!hasTimedOutRef.current) {
        hasTimedOutRef.current = true;
        handleTimeOut();
      }
      return;
    }
    const timer = setInterval(() => {
      setTimeLeft((t) => Math.max(0, t - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft, handleTimeOut]);

  const handleTileClick = (tile: { id: number; char: string; used: boolean }) => {
    if (tile.used) return;
    sound.playTap(soundEnabled);
    haptics.selection();

    setLetterTiles((prev) =>
      prev.map((t) => (t.id === tile.id ? { ...t, used: true } : t))
    );
    setAssembledWord((prev) => [...prev, { tileId: tile.id, char: tile.char }]);
  };

  const handleRemoveAssembled = (index: number) => {
    sound.playTap(soundEnabled);
    haptics.light();
    const item = assembledWord[index];
    setLetterTiles((prev) =>
      prev.map((t) => (t.id === item.tileId ? { ...t, used: false } : t))
    );
    setAssembledWord((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleCheck = () => {
    const wordStr = assembledWord.map((w) => w.char).join('');
    if (wordStr === targetWord.solution) {
      sound.playSuccess(soundEnabled);
      haptics.celebration();
      const score = difficulty === 'Easy' ? 45 : difficulty === 'Medium' ? 60 : 75;
      onSuccess(score, `Anagram Solved: "${targetWord.solution}"! ${targetWord.hint}`);
    } else {
      sound.playError(soundEnabled);
      haptics.error();
      if (onPenalty) onPenalty(10, 'Incorrect anagram spelling');
      onErrorToast(`❌ "${wordStr}" is not correct! Try rearranging.`);
    }
  };

  const handleClear = () => {
    haptics.medium();
    setAssembledWord([]);
    setLetterTiles((prev) => prev.map((t) => ({ ...t, used: false })));
  };

  return (
    <div className="space-y-4">
      {/* Category & Hint Banner */}
      <div className="p-3.5 rounded-[22px] bg-gradient-to-r from-teal-950/50 via-[#0a1420] to-emerald-950/40 border border-teal-500/30 shadow-md flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 font-black text-[10px] uppercase border border-teal-500/40">
              {targetWord.category}
            </span>
            <span className="text-xs text-slate-300 font-bold">
              {targetWord.solution.length} Letters
            </span>
          </div>
          <p className="text-xs text-[#94a3b8] mt-1 font-medium">
            {showHint ? `💡 Hint: ${targetWord.hint}` : 'Tap letter tiles in order to spell the word'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {!showHint && (
            <button
              type="button"
              onClick={() => {
                setShowHint(true);
                sound.playBonus(soundEnabled);
                haptics.light();
              }}
              className="p-2 rounded-full bg-white/10 hover:bg-white/15 text-amber-400 text-xs font-bold flex items-center gap-1 cursor-pointer"
              title="Show hint"
            >
              <Lightbulb className="w-4 h-4" />
            </button>
          )}

          <div className="flex items-center gap-1 text-xs font-black text-teal-300 px-2.5 py-1 rounded-full bg-black/40 border border-white/10">
            <Clock className="w-3.5 h-3.5 text-teal-400" />
            <span>{timeLeft}s</span>
          </div>
        </div>
      </div>

      {/* Assembled Word Slot Row */}
      <div className="p-3.5 rounded-[22px] bg-black/50 border-2 border-teal-500/40 min-h-[64px] flex items-center justify-center gap-1.5 flex-wrap">
        {assembledWord.length === 0 ? (
          <span className="text-xs text-slate-500 italic">Tap letter tiles below to spell...</span>
        ) : (
          assembledWord.map((item, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleRemoveAssembled(idx)}
              className="w-10 h-12 rounded-[14px] bg-gradient-to-b from-teal-400 to-emerald-600 text-black font-display font-black text-xl flex items-center justify-center shadow-md active:scale-90 transition cursor-pointer hover:brightness-110"
              title="Tap to remove"
            >
              {item.char}
            </button>
          ))
        )}
      </div>

      {/* Available Letter Tiles */}
      <div className="flex justify-center items-center gap-2 flex-wrap">
        {letterTiles.map((tile) => (
          <button
            key={tile.id}
            type="button"
            disabled={tile.used}
            onClick={() => handleTileClick(tile)}
            className={`w-12 h-14 rounded-[16px] font-display font-black text-xl transition active:scale-95 shadow-md flex items-center justify-center ${
              tile.used
                ? 'bg-white/5 text-slate-600 border border-white/5 cursor-not-allowed'
                : 'bg-white/10 hover:bg-white/20 text-white border border-white/20 cursor-pointer shadow-black/40'
            }`}
          >
            {tile.char}
          </button>
        ))}
      </div>

      {/* Control Buttons */}
      <div className="grid grid-cols-2 gap-2.5 pt-1">
        <button
          type="button"
          onClick={handleClear}
          className="py-3 rounded-[18px] bg-white/10 hover:bg-white/15 text-slate-300 font-black text-xs border border-white/15 transition active:scale-95 cursor-pointer"
        >
          CLEAR LETTERS
        </button>

        <button
          type="button"
          onClick={handleCheck}
          disabled={assembledWord.length !== targetWord.solution.length}
          className={`py-3 rounded-[18px] font-display font-black text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-lg transition active:scale-95 cursor-pointer ${
            assembledWord.length === targetWord.solution.length
              ? 'bg-gradient-to-r from-teal-400 to-emerald-500 text-black shadow-teal-500/30'
              : 'bg-white/10 text-slate-500 cursor-not-allowed border border-white/5'
          }`}
        >
          <Check className="w-4 h-4" />
          <span>CHECK ANAGRAM</span>
        </button>
      </div>
    </div>
  );
}
