import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import {
  Swords,
  X,
  Trophy,
  Flame,
  Zap,
  Play,
  RotateCcw,
  ArrowRight,
  Shield,
  Clock,
  Sparkles,
} from 'lucide-react';
import { LeaderboardUser } from '../data/leaderboard';
import { Difficulty } from '../types';
import { sound } from '../utils/audio';
import { haptics } from '../utils/haptics';
import { SpeedTapGame } from './games/SpeedTapGame';
import { ReactionGame } from './games/ReactionGame';
import { MathGame } from './games/MathGame';
import { AnagramBlitzGame } from './games/AnagramBlitzGame';
import { StroopGame } from './games/StroopGame';
import { MemoryGame } from './games/MemoryGame';
import { TriviaGame } from './games/TriviaGame';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  targetFriend: LeaderboardUser | null;
  playerName: string;
  playerAvatar: string;
  difficulty: Difficulty;
  onReward: (points: number, message: string) => void;
  onPenalty: (amount?: number, reason?: string) => void;
  onToast: (msg: string) => void;
  soundEnabled: boolean;
}

interface DuelGameOption {
  id: string;
  name: string;
  icon: string;
  desc: string;
  duration: string;
}

const DUEL_GAMES: DuelGameOption[] = [
  { id: 'speed_tap', name: 'Speed Tap Sprint', icon: '⚡', desc: '10s kinetic tap blitz', duration: '10s' },
  { id: 'reaction', name: 'Reflex Strike', icon: '🎯', desc: 'Sub-millisecond reaction duel', duration: '15s' },
  { id: 'math', name: 'Rapid Mental Math', icon: '🧮', desc: 'Fast arithmetic sprint', duration: '30s' },
  { id: 'anagram_blitz', name: 'Anagram Blitz', icon: '🔤', desc: 'Unscramble letters at top speed', duration: '30s' },
  { id: 'stroop', name: 'Color Stroop Clash', icon: '🎨', desc: 'Optical reflex & focus clash', duration: '25s' },
  { id: 'memory', name: 'Memory Matrix', icon: '🧠', desc: 'Grid pattern recall challenge', duration: '30s' },
  { id: 'trivia', name: 'Lightning Trivia', icon: '🌍', desc: 'Quick general knowledge quiz', duration: '25s' },
];

export function DuelModal({
  isOpen,
  onClose,
  targetFriend,
  playerName,
  playerAvatar,
  difficulty,
  onReward,
  onPenalty,
  onToast,
  soundEnabled,
}: Props) {
  const [selectedGameId, setSelectedGameId] = useState<string>('speed_tap');
  const [gameState, setGameState] = useState<'lobby' | 'playing' | 'result'>('lobby');
  const [playerScore, setPlayerScore] = useState<number>(0);
  const [rivalScore, setRivalScore] = useState<number>(0);
  const [duelOutcome, setDuelOutcome] = useState<'win' | 'loss' | 'draw' | null>(null);

  useEffect(() => {
    if (isOpen) {
      setGameState('lobby');
      setPlayerScore(0);
      setRivalScore(0);
      setDuelOutcome(null);
    }
  }, [isOpen, targetFriend]);

  if (!isOpen || !targetFriend) return null;

  const opponentName = targetFriend.name;
  const opponentAvatar = targetFriend.avatar;

  const handleStartDuel = () => {
    haptics.heavy();
    sound.playBonus(soundEnabled);
    setGameState('playing');
  };

  const handleGameFinish = (score: number) => {
    setPlayerScore(score);

    // Generate opponent score calibrated to difficulty and friend level
    const baseTarget = Math.max(25, score);
    const variance = (Math.random() - 0.45) * (score * 0.4);
    let calculatedRivalScore = Math.round(baseTarget + variance);
    if (calculatedRivalScore < 10) calculatedRivalScore = 15;

    setRivalScore(calculatedRivalScore);

    let outcome: 'win' | 'loss' | 'draw' = 'draw';
    if (score > calculatedRivalScore) {
      outcome = 'win';
    } else if (score < calculatedRivalScore) {
      outcome = 'loss';
    } else {
      outcome = 'draw';
    }

    setDuelOutcome(outcome);
    setGameState('result');

    if (outcome === 'win') {
      sound.playSuccess(soundEnabled);
      haptics.celebration();
      try {
        confetti({
          particleCount: 70,
          spread: 80,
          origin: { y: 0.5 },
          colors: ['#FFD700', '#FFA500', '#FF4500', '#10B981'],
        });
      } catch {}

      // Reward 100 points from the loser
      onReward(100, `Won Duel against ${opponentName}! +100 PTS won ⚔️`);
      onToast(`🏆 Victory! 100 Points won from ${opponentName}!`);
    } else if (outcome === 'loss') {
      sound.playError(soundEnabled);
      haptics.error();
      // Deduct 100 points to the winner
      onPenalty(100, `Lost Duel against ${opponentName} (-100 pts)`);
      onToast(`💔 Defeat! 100 Points transferred to ${opponentName}.`);
    } else {
      sound.playPop(soundEnabled);
      haptics.light();
      onToast(`⚖️ Duel Draw! Points preserved.`);
    }
  };

  const handleRematch = () => {
    haptics.medium();
    sound.playBonus(soundEnabled);
    setGameState('playing');
  };

  const selectedGame = DUEL_GAMES.find((g) => g.id === selectedGameId) || DUEL_GAMES[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg bg-[#0a0e1a] border border-white/15 rounded-[32px] p-5 sm:p-6 shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        {/* Specular ambient header glow */}
        <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-rose-600/20 via-indigo-600/10 to-transparent pointer-events-none" />

        {/* Modal Top Bar */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10 relative z-10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-rose-500 to-red-600 flex items-center justify-center text-white shadow-md">
              <Swords className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-display font-black text-white text-base leading-tight">
                Head-to-Head Duel
              </h3>
              <span className="text-[11px] font-bold text-amber-400">
                100 Points Wager on the Line
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/15 text-slate-300 flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Main Content Body */}
        <div className="overflow-y-auto space-y-4 pt-3 flex-1 no-scrollbar relative z-10">
          {/* 1. Duelists Face-Off Banner */}
          <div className="rounded-2xl bg-gradient-to-r from-indigo-950/60 via-[#10162a] to-rose-950/60 border border-white/10 p-3 sm:p-4 flex items-center justify-between gap-3 shadow-inner">
            {/* Player Side */}
            <div className="flex flex-col items-center text-center flex-1 min-w-0">
              <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-full ring-2 ring-indigo-400 bg-indigo-900/60 flex items-center justify-center text-2xl sm:text-3xl shadow-md mb-1">
                {playerAvatar}
              </div>
              <span className="font-display font-bold text-white text-xs truncate max-w-[100px]">
                {playerName || 'You'}
              </span>
              <span className="text-[10px] font-semibold text-indigo-300">Challenger</span>
            </div>

            {/* VS Badge */}
            <div className="flex flex-col items-center justify-center shrink-0 px-2">
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-amber-400 to-rose-500 flex items-center justify-center text-slate-950 font-black text-xs shadow-lg ring-2 ring-white/20 animate-pulse">
                VS
              </div>
              <span className="text-[10px] font-black text-amber-300 mt-1 uppercase tracking-wider">
                100 PTS
              </span>
            </div>

            {/* Opponent Side */}
            <div className="flex flex-col items-center text-center flex-1 min-w-0">
              <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-full ring-2 ring-rose-400 bg-rose-900/60 flex items-center justify-center text-2xl sm:text-3xl shadow-md mb-1">
                {opponentAvatar}
              </div>
              <span className="font-display font-bold text-white text-xs truncate max-w-[100px]">
                {opponentName}
              </span>
              <span className="text-[10px] font-semibold text-rose-300">Rival</span>
            </div>
          </div>

          {/* 2. LOBBY VIEW: Choose Game & Start */}
          {gameState === 'lobby' && (
            <div className="space-y-3.5">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-black uppercase text-slate-300 tracking-wider">
                  Select Duel Mini-Game
                </span>
                <span className="text-[11px] font-bold text-amber-400">
                  {selectedGame.duration} Battle
                </span>
              </div>

              {/* Game Selection Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {DUEL_GAMES.map((game) => {
                  const isSelected = selectedGameId === game.id;
                  return (
                    <button
                      key={game.id}
                      type="button"
                      onClick={() => {
                        haptics.selection();
                        setSelectedGameId(game.id);
                      }}
                      className={`p-3 rounded-2xl border text-left transition flex items-center gap-3 cursor-pointer ${
                        isSelected
                          ? 'bg-gradient-to-r from-amber-500/20 via-rose-500/20 to-transparent border-amber-400 shadow-md ring-1 ring-amber-400/40'
                          : 'bg-white/[0.03] border-white/10 hover:bg-white/[0.06]'
                      }`}
                    >
                      <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-xl shrink-0">
                        {game.icon}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <strong className="text-xs text-white truncate block">
                            {game.name}
                          </strong>
                          <span className="text-[10px] text-amber-300 font-bold">
                            {game.duration}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 truncate mt-0.5">
                          {game.desc}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Duel Rules Card */}
              <div className="p-3 rounded-2xl bg-black/40 border border-white/10 flex items-start gap-2.5 text-xs text-slate-300">
                <Shield className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <strong>Duel Rules:</strong> Winner receives{' '}
                  <span className="text-amber-400 font-bold">+100 Points</span> deducted from the
                  loser. High score takes the pot!
                </div>
              </div>

              {/* Start Button */}
              <button
                type="button"
                onClick={handleStartDuel}
                className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-rose-500 via-red-500 to-amber-500 hover:opacity-95 text-white font-display font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-red-900/40 transition active:scale-95 cursor-pointer"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>Start Duel for 100 PTS</span>
              </button>
            </div>
          )}

          {/* 3. PLAYING VIEW: Active Mini-Game */}
          {gameState === 'playing' && (
            <div className="space-y-3">
              <div className="p-2.5 rounded-xl bg-amber-500/15 border border-amber-400/30 flex items-center justify-between text-xs">
                <span className="text-white font-bold flex items-center gap-1.5">
                  <span>{selectedGame.icon}</span>
                  <span>{selectedGame.name}</span>
                </span>
                <span className="text-amber-300 font-black animate-pulse">
                  ⚔️ DUEL IN PROGRESS
                </span>
              </div>

              <div className="p-2 bg-black/40 rounded-2xl border border-white/10">
                {selectedGameId === 'speed_tap' && (
                  <SpeedTapGame
                    difficulty={difficulty}
                    onSuccess={(score) => handleGameFinish(score)}
                    onPenalty={() => {}}
                    onErrorToast={onToast}
                    soundEnabled={soundEnabled}
                  />
                )}
                {selectedGameId === 'reaction' && (
                  <ReactionGame
                    difficulty={difficulty}
                    onSuccess={(score) => handleGameFinish(score)}
                    onPenalty={() => {}}
                    onErrorToast={onToast}
                    soundEnabled={soundEnabled}
                  />
                )}
                {selectedGameId === 'math' && (
                  <MathGame
                    difficulty={difficulty}
                    onSuccess={(score) => handleGameFinish(score)}
                    onPenalty={() => {}}
                    onErrorToast={onToast}
                    soundEnabled={soundEnabled}
                  />
                )}
                {selectedGameId === 'anagram_blitz' && (
                  <AnagramBlitzGame
                    difficulty={difficulty}
                    onSuccess={(score) => handleGameFinish(score)}
                    onPenalty={() => {}}
                    onErrorToast={onToast}
                    soundEnabled={soundEnabled}
                  />
                )}
                {selectedGameId === 'stroop' && (
                  <StroopGame
                    difficulty={difficulty}
                    onSuccess={(score) => handleGameFinish(score)}
                    onPenalty={() => {}}
                    onErrorToast={onToast}
                    soundEnabled={soundEnabled}
                  />
                )}
                {selectedGameId === 'memory' && (
                  <MemoryGame
                    difficulty={difficulty}
                    onSuccess={(score) => handleGameFinish(score)}
                    onPenalty={() => {}}
                    onErrorToast={onToast}
                    soundEnabled={soundEnabled}
                  />
                )}
                {selectedGameId === 'trivia' && (
                  <TriviaGame
                    difficulty={difficulty}
                    onSuccess={(score) => handleGameFinish(score)}
                    onPenalty={() => {}}
                    onErrorToast={onToast}
                    soundEnabled={soundEnabled}
                  />
                )}
              </div>
            </div>
          )}

          {/* 4. RESULT VIEW */}
          {gameState === 'result' && (
            <div className="space-y-4 text-center py-2 animate-in fade-in zoom-in-95 duration-200">
              <div className="inline-block p-4 rounded-3xl bg-white/[0.04] border border-white/15 shadow-xl">
                {duelOutcome === 'win' ? (
                  <div className="text-4xl sm:text-5xl mb-2">🏆</div>
                ) : duelOutcome === 'loss' ? (
                  <div className="text-4xl sm:text-5xl mb-2">💔</div>
                ) : (
                  <div className="text-4xl sm:text-5xl mb-2">⚖️</div>
                )}

                <h3
                  className={`font-display font-black text-xl sm:text-2xl ${
                    duelOutcome === 'win'
                      ? 'text-amber-400'
                      : duelOutcome === 'loss'
                      ? 'text-rose-400'
                      : 'text-slate-200'
                  }`}
                >
                  {duelOutcome === 'win'
                    ? 'VICTORY!'
                    : duelOutcome === 'loss'
                    ? 'DEFEAT!'
                    : 'DRAW!'}
                </h3>

                <p className="text-xs text-slate-300 mt-1 max-w-xs mx-auto">
                  {duelOutcome === 'win'
                    ? `You won the Duel against ${opponentName}! +100 Points transferred to you!`
                    : duelOutcome === 'loss'
                    ? `${opponentName} won the Duel. -100 Points transferred from your pot.`
                    : 'Both champions scored equally! Wagers have been preserved.'}
                </p>
              </div>

              {/* Scoreboard Comparison */}
              <div className="grid grid-cols-2 gap-3 max-w-xs mx-auto">
                <div
                  className={`p-3 rounded-2xl border text-center ${
                    duelOutcome === 'win'
                      ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                      : 'bg-white/5 border-white/10 text-white'
                  }`}
                >
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">
                    Your Score
                  </span>
                  <span className="text-2xl font-black font-display">{playerScore}</span>
                </div>

                <div
                  className={`p-3 rounded-2xl border text-center ${
                    duelOutcome === 'loss'
                      ? 'bg-rose-500/20 border-rose-500/40 text-rose-300'
                      : 'bg-white/5 border-white/10 text-white'
                  }`}
                >
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">
                    {opponentName}&apos;s Score
                  </span>
                  <span className="text-2xl font-black font-display">{rivalScore}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleRematch}
                  className="flex-1 py-3 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer shadow-md"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Rematch (100 PTS)</span>
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="py-3 px-5 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs transition active:scale-95 cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
