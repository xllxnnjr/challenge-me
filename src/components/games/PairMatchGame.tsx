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

interface Card {
  id: number;
  emoji: string;
  isFlipped: boolean;
  isMatched: boolean;
}

const EMOJI_POOL = ['🦁', '🚀', '💎', '🎯', '🔥', '⚡', '🥑', '👾', '🌈', '🔮'];

export function PairMatchGame({ difficulty, onSuccess, onErrorToast, onPenalty, soundEnabled }: Props) {
  const pairCount = difficulty === 'Easy' ? 2 : difficulty === 'Medium' ? 3 : 4;

  const [cards, setCards] = useState<Card[]>([]);
  const [flippedIds, setFlippedIds] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [isLocked, setIsLocked] = useState(false);

  useEffect(() => {
    const shuffledPool = [...EMOJI_POOL].sort(() => Math.random() - 0.5);
    const chosen = shuffledPool.slice(0, pairCount);
    const deck = [...chosen, ...chosen]
      .sort(() => Math.random() - 0.5)
      .map((emoji, idx) => ({
        id: idx,
        emoji,
        isFlipped: false,
        isMatched: false,
      }));
    setCards(deck);
    setFlippedIds([]);
    setMoves(0);
    setIsLocked(false);
  }, [difficulty, pairCount]);

  const handleCardClick = (id: number) => {
    if (isLocked) return;
    const card = cards.find(c => c.id === id);
    if (!card || card.isFlipped || card.isMatched) return;

    sound.playClick(soundEnabled);

    // Flip the clicked card
    const nextCards = cards.map(c => (c.id === id ? { ...c, isFlipped: true } : c));
    setCards(nextCards);

    const nextFlipped = [...flippedIds, id];
    setFlippedIds(nextFlipped);

    if (nextFlipped.length === 2) {
      const nextMoves = moves + 1;
      setMoves(nextMoves);
      setIsLocked(true);

      const [firstId, secondId] = nextFlipped;
      const firstCard = nextCards.find(c => c.id === firstId);
      const secondCard = nextCards.find(c => c.id === secondId);

      if (firstCard && secondCard && firstCard.emoji === secondCard.emoji) {
        // Matched!
        sound.playPop(soundEnabled);
        setTimeout(() => {
          const updatedCards = nextCards.map(c =>
            c.id === firstId || c.id === secondId ? { ...c, isMatched: true, isFlipped: true } : c
          );
          setCards(updatedCards);
          setFlippedIds([]);
          setIsLocked(false);

          const allMatched = updatedCards.every(c => c.isMatched);
          if (allMatched) {
            const basePts = difficulty === 'Easy' ? 25 : difficulty === 'Medium' ? 45 : 70;
            sound.playSuccess(soundEnabled);
            onSuccess(basePts, `🎴 Masterful memory! Cleared ${pairCount} pairs in ${nextMoves} turns (${difficulty}).`);
          }
        }, 450);
      } else {
        // No match -> penalty if excessive moves
        setTimeout(() => {
          setCards(prev =>
            prev.map(c =>
              c.id === firstId || c.id === secondId ? { ...c, isFlipped: false } : c
            )
          );
          setFlippedIds([]);
          setIsLocked(false);

          if (nextMoves > pairCount * 2) {
            const penaltyAmount = 2;
            onPenalty(penaltyAmount, 'Missed pair match');
            onErrorToast(`No match! -${penaltyAmount} pts penalty.`);
          }
        }, 750);
      }
    }
  };

  const matchedCount = cards.filter(c => c.isMatched).length / 2;

  return (
    <div className="flex flex-col items-center text-center py-2 select-none">
      <div className="w-full flex items-center justify-between px-2 mb-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-950/70 border border-purple-800 text-purple-200 text-xs font-bold">
          🎴 Pair Matcher
        </div>
        <div className="text-xs font-black text-purple-300 bg-[#111a2c] px-3 py-1 rounded-lg border border-[#263149]">
          Pairs: <span className="text-white text-sm">{matchedCount}</span> / {pairCount} ({difficulty})
        </div>
      </div>

      <p className="text-xs text-[#9ca7bd] mb-3">
        Flip cards to find all {pairCount} matching pairs! (Moves: {moves})
      </p>

      {/* Card Grid */}
      <div
        className={`grid gap-2.5 w-full max-w-xs mb-4 ${
          pairCount === 2 ? 'grid-cols-2' : pairCount === 3 ? 'grid-cols-3' : 'grid-cols-4'
        }`}
      >
        {cards.map(c => (
          <button
            key={c.id}
            type="button"
            onClick={() => handleCardClick(c.id)}
            className={`h-22 sm:h-26 rounded-2xl text-2xl sm:text-3xl flex items-center justify-center transition-all duration-300 font-bold border-2 cursor-pointer shadow-md select-none ${
              c.isFlipped || c.isMatched
                ? 'bg-gradient-to-tr from-purple-900/90 to-indigo-900/90 border-purple-400 text-white scale-100 rotate-0'
                : 'bg-[#10182a] hover:bg-[#162138] border-[#2c3a57] text-slate-500 hover:border-purple-500/50'
            }`}
          >
            {c.isFlipped || c.isMatched ? c.emoji : '❓'}
          </button>
        ))}
      </div>
    </div>
  );
}
