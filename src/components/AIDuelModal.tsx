import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import {
  Swords,
  X,
  Sparkles,
  Bot,
  Play,
  Trophy,
  Flame,
  Zap,
  ArrowRight,
  Shield,
  Share2,
  RefreshCw,
  Clock,
  CheckCircle2,
  Users,
  Gamepad2,
} from 'lucide-react';
import { AIDuel, DuelRound, Difficulty } from '../types';
import { LeaderboardUser } from '../data/leaderboard';
import { sound } from '../utils/audio';
import { haptics } from '../utils/haptics';
import { CodeBreakerGame } from './games/CodeBreakerGame';
import { DetectiveRiddleGame } from './games/DetectiveRiddleGame';
import { CinemaQuizGame } from './games/CinemaQuizGame';
import { MathGame } from './games/MathGame';
import { ReactionGame } from './games/ReactionGame';
import { EmojiRiddleGame } from './games/EmojiRiddleGame';
import { StroopGame } from './games/StroopGame';
import { AnagramBlitzGame } from './games/AnagramBlitzGame';
import { SpeedTapGame } from './games/SpeedTapGame';
import { TriviaGame } from './games/TriviaGame';
import { MemoryGame } from './games/MemoryGame';
import { WordScrambleGame } from './games/WordScrambleGame';
import { ShareModal } from './ShareModal';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  targetFriend: LeaderboardUser | null;
  playerName: string;
  playerAvatar: string;
  difficulty: Difficulty;
  onReward: (points: number, message: string) => void;
  onToast: (msg: string) => void;
  soundEnabled: boolean;
}

const DUEL_GAMES = [
  { id: 'speed_tap', name: 'Speed Tap Sprint', icon: '⚡', desc: '10s kinetic tap blitz' },
  { id: 'trivia', name: 'Lightning Trivia', icon: '🌍', desc: 'High-speed knowledge quiz' },
  { id: 'math', name: 'Mental Math Blitz', icon: '🧮', desc: 'Rapid arithmetic calculation' },
  { id: 'reaction', name: 'Reflex Strike', icon: '🎯', desc: 'Sub-millisecond reaction duel' },
  { id: 'anagram_blitz', name: 'Anagram Blitz', icon: '🔤', desc: 'Rapid unscramble sprint' },
  { id: 'stroop', name: 'Color Stroop Clash', icon: '🎨', desc: 'Cognitive reflex test' },
  { id: 'memory', name: 'Memory Matrix', icon: '🧠', desc: 'Grid pattern memorization' },
];

export function AIDuelModal({
  isOpen,
  onClose,
  targetFriend,
  playerName,
  playerAvatar,
  difficulty,
  onReward,
  onToast,
  soundEnabled,
}: Props) {
  const [duelMode, setDuelMode] = useState<'instant' | 'gauntlet'>('instant');
  const [selectedGameId, setSelectedGameId] = useState<string>('speed_tap');
  const [loading, setLoading] = useState(false);
  const [duel, setDuel] = useState<AIDuel | null>(null);
  
  // Game execution state
  // null = setup/lobby, 0..2 = active round, 3 = finished
  const [currentRoundIdx, setCurrentRoundIdx] = useState<number | null>(null);
  const [playerRoundScores, setPlayerRoundScores] = useState<number[]>([]);
  const [rivalRoundScores, setRivalRoundScores] = useState<number[]>([]);
  const [rivalCurrentScore, setRivalCurrentScore] = useState<number>(0);
  const [rivalStatus, setRivalStatus] = useState<string>('Ready for showdown');
  const [shareOpen, setShareOpen] = useState(false);

  const rivalIntervalRef = useRef<any>(null);

  useEffect(() => {
    if (isOpen && targetFriend) {
      // Reset state on open
      setCurrentRoundIdx(null);
      setPlayerRoundScores([]);
      setRivalRoundScores([]);
      setRivalCurrentScore(0);
      setRivalStatus(`${targetFriend.name} is ready for duel!`);
      if (duelMode === 'gauntlet') {
        generateGauntletDuel();
      }
    } else {
      setDuel(null);
      setCurrentRoundIdx(null);
      setPlayerRoundScores([]);
      setRivalRoundScores([]);
      setRivalCurrentScore(0);
      clearInterval(rivalIntervalRef.current);
    }
  }, [isOpen, targetFriend, duelMode]);

  // Clean up interval
  useEffect(() => {
    return () => clearInterval(rivalIntervalRef.current);
  }, []);

  const generateGauntletDuel = async () => {
    if (!targetFriend) return;
    setLoading(true);
    try {
      const res = await fetch('/api/generate-duel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          challengerName: playerName || 'Challenger',
          opponentName: targetFriend.name,
          opponentAvatar: targetFriend.avatar,
          category: targetFriend.category || 'All',
          difficulty,
          wagerDiamonds: 50,
        }),
      });

      const data = await res.json();
      if (data.success && data.duel) {
        setDuel(data.duel);
        sound.playBonus(soundEnabled);
      } else {
        throw new Error('AI fallback');
      }
    } catch (e) {
      setDuel({
        id: `duel_${Date.now()}`,
        title: `Clash of Minds: ${playerName} vs ${targetFriend.name}`,
        storyline: `${playerName} has challenged ${targetFriend.name} to a 3-round battle!`,
        challengerName: playerName || 'Challenger',
        opponentName: targetFriend.name,
        opponentAvatar: targetFriend.avatar,
        wagerDiamonds: 50,
        difficulty,
        refereeBanter: `⚡ Two brilliant rivals enter the arena! 3 fast rounds. Winner takes all!`,
        rounds: [
          {
            roundNum: 1,
            title: 'Round 1: Speed Tap Sprint',
            type: 'speed_tap',
            instructions: 'Tap the glowing reactor cell at maximum speed.',
            targetGoal: 'Score 40+ taps in 10s',
            timeLimitSec: 10,
          },
          {
            roundNum: 2,
            title: 'Round 2: Lightning Trivia Duel',
            type: 'trivia',
            instructions: 'Answer rapid knowledge questions with zero errors.',
            targetGoal: 'Accuracy 100%',
            timeLimitSec: 15,
          },
          {
            roundNum: 3,
            title: 'Round 3: Reflex Strike',
            type: 'reaction',
            instructions: 'Strike the target when the signal turns green.',
            targetGoal: 'Sub-250ms reaction',
            timeLimitSec: 10,
          },
        ],
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !targetFriend) return null;

  // Start Instant Duel
  const handleStartInstantDuel = () => {
    sound.playTap(soundEnabled);
    haptics.medium();
    setPlayerRoundScores([]);
    setRivalRoundScores([]);
    setRivalCurrentScore(0);
    setCurrentRoundIdx(0);

    // Simulate real-time rival score ticker
    let scoreAccum = 0;
    const phrases = [
      `${targetFriend.name} is focusing...`,
      `${targetFriend.name} hit a combo!`,
      `${targetFriend.name} made a fast move!`,
      `${targetFriend.name} is accelerating!`,
    ];

    clearInterval(rivalIntervalRef.current);
    rivalIntervalRef.current = setInterval(() => {
      scoreAccum += Math.floor(Math.random() * 12) + 6;
      setRivalCurrentScore(scoreAccum);
      const phrase = phrases[Math.floor(Math.random() * phrases.length)];
      setRivalStatus(phrase);
    }, 1200);
  };

  // Start Gauntlet Duel
  const handleStartGauntletRound = () => {
    sound.playTap(soundEnabled);
    haptics.medium();
    setCurrentRoundIdx(0);
  };

  // Handle player completion of a round
  const handleRoundSuccess = (playerScore: number, message: string) => {
    clearInterval(rivalIntervalRef.current);
    sound.playSuccess(soundEnabled);
    haptics.celebration();

    // Calculate balanced opponent score based on difficulty and player performance
    const variance = Math.floor(Math.random() * 24) - 10;
    const simulatedOppScore = Math.max(25, playerScore + variance);

    const nextPlayerScores = [...playerRoundScores, playerScore];
    const nextRivalScores = [...rivalRoundScores, simulatedOppScore];
    setPlayerRoundScores(nextPlayerScores);
    setRivalRoundScores(nextRivalScores);

    if (duelMode === 'gauntlet' && currentRoundIdx !== null && currentRoundIdx < 2) {
      onToast(`⚡ Round ${currentRoundIdx + 1} Done! +${playerScore} pts`);
      setCurrentRoundIdx(currentRoundIdx + 1);
    } else {
      // Duel finished!
      setCurrentRoundIdx(3);
      const totalPlayer = nextPlayerScores.reduce((a, b) => a + b, 0);
      const totalRival = nextRivalScores.reduce((a, b) => a + b, 0);

      const isWon = totalPlayer >= totalRival;
      if (isWon) {
        confetti({ particleCount: 90, spread: 70, origin: { y: 0.6 } });
        sound.playCelebration(soundEnabled);
        haptics.celebration();
        onReward(
          totalPlayer + 120,
          `🏆 Duel Victory over ${targetFriend.name}! Earned +${totalPlayer + 120} pts & +50 💎`
        );
      } else {
        sound.playError(soundEnabled);
        haptics.error();
        onReward(
          totalPlayer,
          `Battle concluded! Scored +${totalPlayer} pts against ${targetFriend.name}`
        );
      }
    }
  };

  const totalPlayerScore = playerRoundScores.reduce((a, b) => a + b, 0);
  const totalRivalScore = rivalRoundScores.reduce((a, b) => a + b, 0);
  const isDuelComplete = currentRoundIdx === 3;
  const isVictorious = isDuelComplete && totalPlayerScore >= totalRivalScore;

  // Active game type to render
  const activeGameType =
    duelMode === 'instant'
      ? selectedGameId
      : duel?.rounds[currentRoundIdx || 0]?.type || 'speed_tap';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-[#0b0e1a] border border-red-500/30 rounded-[32px] p-5 sm:p-6 shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        {/* Ambient Red & Amber Arena Spotlight */}
        <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-red-600/20 via-amber-600/10 to-transparent pointer-events-none" />

        {/* Modal Top Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10 relative z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-red-600/20 border border-red-500/40 flex items-center justify-center text-red-400 shadow-md">
              <Swords className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="px-2 py-0.2 rounded-full bg-red-600 text-white font-black text-[9px] uppercase tracking-wider">
                  HEAD-TO-HEAD DUEL
                </span>
                <span className="text-[10px] font-bold text-amber-300">
                  💎 50 Diamond Stakes
                </span>
              </div>
              <h3 className="font-display font-black text-white text-base sm:text-lg">
                Challenge {targetFriend.name}
              </h3>
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

        {/* Versus Live Score Banner (Visible in all screens) */}
        <div className="p-3.5 mt-3 rounded-[24px] bg-gradient-to-r from-red-950/60 via-black to-blue-950/60 border border-white/15 shadow-xl relative z-10">
          <div className="flex items-center justify-between">
            {/* Player */}
            <div className="flex items-center gap-2.5">
              <div className="w-11 h-11 rounded-2xl bg-red-500/20 border border-red-400/40 flex items-center justify-center text-2xl shadow-inner">
                {playerAvatar || '🧑‍🚀'}
              </div>
              <div>
                <span className="text-[9px] font-black text-red-400 uppercase block">YOU</span>
                <h4 className="font-display font-black text-white text-xs sm:text-sm truncate max-w-[90px]">
                  {playerName || 'Challenger'}
                </h4>
                <span className="font-mono text-xs font-bold text-emerald-400">
                  {totalPlayerScore} pts
                </span>
              </div>
            </div>

            <div className="text-center px-1">
              <div className="w-8 h-8 rounded-full bg-red-600/30 border border-red-400 flex items-center justify-center font-display font-black text-white text-xs shadow-md">
                VS
              </div>
            </div>

            {/* Rival */}
            <div className="flex items-center gap-2.5 text-right flex-row-reverse">
              <div className="w-11 h-11 rounded-2xl bg-blue-500/20 border border-blue-400/40 flex items-center justify-center text-2xl shadow-inner">
                {targetFriend.avatar}
              </div>
              <div>
                <span className="text-[9px] font-black text-blue-400 uppercase block">RIVAL</span>
                <h4 className="font-display font-black text-white text-xs sm:text-sm truncate max-w-[90px]">
                  {targetFriend.name}
                </h4>
                <span className="font-mono text-xs font-bold text-blue-400">
                  {currentRoundIdx !== null && currentRoundIdx < 3 ? rivalCurrentScore : totalRivalScore} pts
                </span>
              </div>
            </div>
          </div>

          {/* Real-time Rival Action Sub-bar during gameplay */}
          {currentRoundIdx !== null && currentRoundIdx < 3 && (
            <div className="mt-2.5 pt-2 border-t border-white/10 flex items-center justify-between text-[11px]">
              <span className="text-slate-400 flex items-center gap-1.5 truncate">
                <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping shrink-0" />
                <span className="truncate">{rivalStatus}</span>
              </span>
              <span className="text-amber-400 font-mono font-bold shrink-0">
                1v1 Live
              </span>
            </div>
          )}
        </div>

        {/* 1. DUEL LOBBY & GAME SELECTION (when currentRoundIdx === null) */}
        {currentRoundIdx === null && (
          <div className="overflow-y-auto space-y-4 pt-3 flex-1 no-scrollbar relative z-10">
            {/* Mode Switcher */}
            <div className="grid grid-cols-2 p-1 bg-white/5 border border-white/10 rounded-2xl">
              <button
                type="button"
                onClick={() => {
                  haptics.selection();
                  setDuelMode('instant');
                }}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  duelMode === 'instant'
                    ? 'bg-red-600 text-white font-black shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Instant 1v1 Clash</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  haptics.selection();
                  setDuelMode('gauntlet');
                }}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  duelMode === 'gauntlet'
                    ? 'bg-red-600 text-white font-black shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Bot className="w-3.5 h-3.5" />
                <span>AI 3-Round Gauntlet</span>
              </button>
            </div>

            {/* INSTANT 1v1 GAME PICKER */}
            {duelMode === 'instant' ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between px-1">
                  <span className="text-xs font-black uppercase text-slate-400 tracking-wider">
                    Select Duel Game
                  </span>
                  <span className="text-[11px] text-amber-400 font-bold">
                    Fast 10-20s Showdown
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {DUEL_GAMES.map((g) => {
                    const isSelected = selectedGameId === g.id;
                    return (
                      <button
                        key={g.id}
                        type="button"
                        onClick={() => {
                          haptics.selection();
                          setSelectedGameId(g.id);
                        }}
                        className={`p-3 rounded-2xl border text-left transition cursor-pointer flex items-center gap-3 ${
                          isSelected
                            ? 'bg-red-600/20 border-red-500 text-white shadow-md'
                            : 'bg-white/[0.03] border-white/10 hover:border-white/20 text-slate-300'
                        }`}
                      >
                        <span className="text-2xl shrink-0">{g.icon}</span>
                        <div className="min-w-0">
                          <strong className="text-xs block text-white font-bold leading-tight truncate">
                            {g.name}
                          </strong>
                          <span className="text-[10px] text-slate-400 block truncate">
                            {g.desc}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={handleStartInstantDuel}
                  className="w-full py-3.5 rounded-[22px] bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white font-display font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-red-600/30 hover:brightness-110 transition active:scale-95 cursor-pointer mt-2"
                >
                  <Swords className="w-4 h-4" />
                  <span>Launch Duel vs {targetFriend.name}</span>
                </button>
              </div>
            ) : (
              /* GAUNTLET 3-ROUND MODE */
              <div className="space-y-3">
                {loading ? (
                  <div className="py-12 text-center space-y-2">
                    <div className="w-10 h-10 border-4 border-red-500/20 border-t-red-500 rounded-full animate-spin mx-auto" />
                    <p className="text-xs font-bold text-white">Gemini AI is crafting 3 unique rounds...</p>
                  </div>
                ) : duel ? (
                  <div className="space-y-3">
                    <div className="p-3 rounded-2xl bg-purple-950/30 border border-purple-500/30 flex items-start gap-2.5">
                      <Bot className="w-4 h-4 text-purple-300 shrink-0 mt-0.5" />
                      <p className="text-xs text-purple-200 italic leading-snug">
                        &ldquo;{duel.refereeBanter}&rdquo;
                      </p>
                    </div>

                    <div className="space-y-2">
                      {duel.rounds.map((round, idx) => (
                        <div
                          key={idx}
                          className="p-3 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-between gap-3"
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="w-6 h-6 rounded-lg bg-red-600/20 text-red-400 font-black text-xs flex items-center justify-center border border-red-500/30">
                              {round.roundNum}
                            </span>
                            <div>
                              <h5 className="font-bold text-white text-xs">
                                {round.title}
                              </h5>
                              <p className="text-[10px] text-slate-400">
                                {round.instructions}
                              </p>
                            </div>
                          </div>
                          <span className="px-2 py-0.5 rounded-full bg-black/40 text-amber-300 font-mono text-[10px] font-bold shrink-0">
                            ⏱️ {round.timeLimitSec}s
                          </span>
                        </div>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={handleStartGauntletRound}
                      className="w-full py-3.5 rounded-[22px] bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white font-display font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-red-600/30 hover:brightness-110 transition active:scale-95 cursor-pointer"
                    >
                      <Play className="w-4 h-4 fill-white" />
                      <span>Start Round 1 of 3</span>
                    </button>
                  </div>
                ) : null}
              </div>
            )}
          </div>
        )}

        {/* 2. ACTIVE DUEL ROUND PLAY (when currentRoundIdx !== null && currentRoundIdx < 3) */}
        {currentRoundIdx !== null && currentRoundIdx < 3 && (
          <div className="overflow-y-auto pt-3 flex-1 no-scrollbar relative z-10 space-y-3">
            <div className="flex items-center justify-between px-1">
              <span className="px-2.5 py-0.5 rounded-full bg-red-600 text-white font-black text-[10px] uppercase">
                {duelMode === 'gauntlet' ? `Round ${currentRoundIdx + 1} of 3` : 'Live 1v1 Battle'}
              </span>
              <span className="text-xs text-amber-400 font-bold">
                {difficulty} Tier • Play Fast!
              </span>
            </div>

            {/* Game Component Execution */}
            {activeGameType === 'speed_tap' && (
              <SpeedTapGame
                difficulty={difficulty}
                onSuccess={(s, m) => handleRoundSuccess(s, m)}
                onErrorToast={onToast}
                onPenalty={(amt, r) => onToast(`Penalty: -${amt || 10} pts`)}
                soundEnabled={soundEnabled}
              />
            )}

            {activeGameType === 'trivia' && (
              <TriviaGame
                difficulty={difficulty}
                onSuccess={(s, m) => handleRoundSuccess(s, m)}
                onErrorToast={onToast}
                onPenalty={(amt, r) => onToast(`Penalty: -${amt || 10} pts`)}
                soundEnabled={soundEnabled}
              />
            )}

            {activeGameType === 'math' && (
              <MathGame
                difficulty={difficulty}
                onSuccess={(s, m) => handleRoundSuccess(s, m)}
                onErrorToast={onToast}
                onPenalty={(amt, r) => onToast(`Penalty: -${amt || 10} pts`)}
                soundEnabled={soundEnabled}
              />
            )}

            {activeGameType === 'reaction' && (
              <ReactionGame
                difficulty={difficulty}
                onSuccess={(s, m) => handleRoundSuccess(s, m)}
                onErrorToast={onToast}
                onPenalty={(amt, r) => onToast(`Penalty: -${amt || 10} pts (Early tap)`)}
                soundEnabled={soundEnabled}
              />
            )}

            {activeGameType === 'anagram_blitz' && (
              <AnagramBlitzGame
                difficulty={difficulty}
                onSuccess={(s, m) => handleRoundSuccess(s, m)}
                onErrorToast={onToast}
                onPenalty={(amt, r) => onToast(`Penalty: -${amt || 10} pts`)}
                soundEnabled={soundEnabled}
              />
            )}

            {activeGameType === 'stroop' && (
              <StroopGame
                difficulty={difficulty}
                onSuccess={(s, m) => handleRoundSuccess(s, m)}
                onErrorToast={onToast}
                onPenalty={(amt, r) => onToast(`Penalty: -${amt || 10} pts`)}
                soundEnabled={soundEnabled}
              />
            )}

            {activeGameType === 'memory' && (
              <MemoryGame
                difficulty={difficulty}
                onSuccess={(s, m) => handleRoundSuccess(s, m)}
                onErrorToast={onToast}
                onPenalty={(amt, r) => onToast(`Penalty: -${amt || 10} pts`)}
                soundEnabled={soundEnabled}
              />
            )}

            {activeGameType === 'code_breaker' && (
              <CodeBreakerGame
                difficulty={difficulty}
                onSuccess={(s, m) => handleRoundSuccess(s, m)}
                onErrorToast={onToast}
                onPenalty={(amt, r) => onToast(`Penalty: -${amt || 10} pts`)}
                soundEnabled={soundEnabled}
              />
            )}

            {activeGameType === 'detective_riddle' && (
              <DetectiveRiddleGame
                difficulty={difficulty}
                onSuccess={(s, m) => handleRoundSuccess(s, m)}
                onErrorToast={onToast}
                onPenalty={(amt, r) => onToast(`Penalty: -${amt || 10} pts`)}
                soundEnabled={soundEnabled}
              />
            )}

            {activeGameType === 'cinema_quiz' && (
              <CinemaQuizGame
                difficulty={difficulty}
                onSuccess={(s, m) => handleRoundSuccess(s, m)}
                onErrorToast={onToast}
                onPenalty={(amt, r) => onToast(`Penalty: -${amt || 10} pts`)}
                soundEnabled={soundEnabled}
              />
            )}

            {activeGameType === 'emoji_riddle' && (
              <EmojiRiddleGame
                difficulty={difficulty}
                onSuccess={(s, m) => handleRoundSuccess(s, m)}
                onErrorToast={onToast}
                onPenalty={(amt, r) => onToast(`Penalty: -${amt || 10} pts`)}
                soundEnabled={soundEnabled}
              />
            )}
          </div>
        )}

        {/* 3. VICTORY / RESULTS SCREEN (when currentRoundIdx === 3) */}
        {isDuelComplete && (
          <div className="overflow-y-auto pt-4 flex-1 no-scrollbar relative z-10 space-y-4 text-center animate-in zoom-in-95 duration-300">
            <div className="w-20 h-20 rounded-[24px] bg-gradient-to-tr from-amber-500 via-rose-500 to-red-600 flex items-center justify-center text-4xl shadow-xl shadow-red-900/40 mx-auto animate-bounce">
              {isVictorious ? '🏆' : '⚔️'}
            </div>

            <div>
              <span className="text-xs font-black tracking-widest uppercase text-amber-400">
                {isVictorious ? 'DUEL VICTORY!' : 'HONORABLE CLASH'}
              </span>
              <h3 className="text-2xl font-display font-black text-white mt-1">
                {isVictorious ? `Defeated ${targetFriend.name}!` : `${targetFriend.name} edged ahead!`}
              </h3>
              <p className="text-xs text-slate-300 mt-1">
                Final Score: <strong className="text-emerald-400">{totalPlayerScore}</strong> vs <strong className="text-blue-400">{totalRivalScore}</strong>
              </p>
            </div>

            {/* Scorecard */}
            <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-slate-400">Duel Reward</span>
                <span className="text-amber-400">+{totalPlayerScore + (isVictorious ? 120 : 0)} XP</span>
              </div>
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-slate-400">Diamond Stake Payout</span>
                <span className="text-cyan-300">{isVictorious ? '+50 💎 Won' : '+15 💎 Consolation'}</span>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setCurrentRoundIdx(null);
                  setPlayerRoundScores([]);
                  setRivalRoundScores([]);
                }}
                className="flex-1 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Rematch</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-red-600/30 transition cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Done</span>
              </button>
            </div>
          </div>
        )}
      </div>

      <ShareModal
        isOpen={shareOpen}
        onClose={() => setShareOpen(false)}
        data={{
          title: `Challenge Me Duel Scorecard`,
          text: `⚔️ Just battled ${targetFriend.name} in Challenge Me!\nFinal Score: ${totalPlayerScore} - ${totalRivalScore}\nPlay Challenge Me to battle friends!`,
        }}
        onToast={onToast}
        soundEnabled={soundEnabled}
      />
    </div>
  );
}
