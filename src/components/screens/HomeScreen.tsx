import React, { useState } from 'react';
import {
  Sparkles,
  Heart,
  Dices,
  Play,
  Flame,
  ChevronRight,
  Zap,
  Trophy,
  Brain,
  Timer,
  Compass,
  ArrowRight,
} from 'lucide-react';
import { GameState, Challenge, Difficulty } from '../../types';
import { CHALLENGES, CATEGORIES_CONFIG } from '../../data/challenges';
import { calculateLevel } from '../../utils/storage';
import { AvatarDisplay } from '../AvatarDisplay';
import { ActivityRings } from '../ActivityRings';
import { ChallengeIcon } from '../ChallengeIcon';
import { sound } from '../../utils/audio';
import { haptics } from '../../utils/haptics';

interface Props {
  state: GameState;
  onSelectChallenge: (challenge: Challenge, difficulty: Difficulty) => void;
  onRandomChallenge: (difficulty: Difficulty) => void;
  onViewAllChallenges: () => void;
  currentDifficulty: Difficulty;
}

export function HomeScreen({
  state,
  onSelectChallenge,
  onRandomChallenge,
  onViewAllChallenges,
  currentDifficulty,
}: Props) {
  const currentLevel = calculateLevel(state.xp);
  const userDiamonds = Math.max(20, Math.round(state.points * 0.7) + state.streak * 5);
  const [selectedCategory, setSelectedCategory] = useState<string>('Knowledge & Trivia');

  // Favorites state
  const [favorites, setFavorites] = useState<Record<string, boolean>>({
    tech_quiz: true,
    science_quiz: false,
    math: true,
    geo_quiz: false,
  });

  const toggleFavorite = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    haptics.selection();
    sound.playPop(state.soundEnabled);
    setFavorites((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Categories list for quick pill filter
  const categoryFilters = [
    { id: 'Knowledge & Trivia', label: 'Trivia', icon: '🌍' },
    { id: 'Math & Logic', label: 'Logic & Math', icon: '🧮' },
    { id: 'Speed & Reflex', label: 'Reflex', icon: '⚡' },
    { id: 'Memory & Focus', label: 'Memory', icon: '🧠' },
    { id: 'Social & Party', label: 'Party', icon: '🎉' },
  ];

  // Filtered games
  const allChallenges = CHALLENGES;
  const filteredPopularGames = allChallenges.filter((c) => c.cat === selectedCategory).slice(0, 6);

  const handleSurpriseClick = () => {
    haptics.heavy();
    sound.playClick(state.soundEnabled);
    onRandomChallenge(currentDifficulty);
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-300 pb-10">
      {/* 1. Sleek Hero Overview Card */}
      <div className="rounded-[28px] bg-gradient-to-br from-[#121b33] via-[#0d1527] to-[#070b16] border border-white/10 p-4 sm:p-5 shadow-[0_12px_40px_rgba(0,0,0,0.5)] relative overflow-hidden">
        {/* Glow ambient background */}
        <div className="absolute -top-12 -right-12 w-40 h-40 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-40 h-40 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex items-center justify-between gap-3 mb-4">
          {/* User info */}
          <div className="flex items-center gap-3 min-w-0">
            <AvatarDisplay
              avatar={state.avatar}
              size="md"
              className="ring-2 ring-amber-400/40 shadow-md shrink-0"
            />
            <div className="min-w-0">
              <span className="text-[11px] font-bold text-slate-400 block uppercase tracking-wider">
                Welcome back
              </span>
              <h2 className="text-base sm:text-lg font-display font-black text-white truncate">
                {state.playerName}
              </h2>
            </div>
          </div>

          {/* Badges: Level & Diamonds */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-400/30 text-amber-300 text-xs font-black">
              <Flame className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              <span>{state.streak}d</span>
            </div>
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-cyan-500/15 border border-cyan-400/30 text-cyan-300 text-xs font-black">
              <span>💎</span>
              <span>{userDiamonds}</span>
            </div>
          </div>
        </div>

        {/* Level XP Bar */}
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between text-[11px] font-bold">
            <span className="text-slate-300 flex items-center gap-1">
              <span className="text-amber-400">Level {currentLevel}</span>
              <span className="text-slate-500">•</span>
              <span className="text-slate-400">{state.points} Total Pts</span>
            </span>
            <span className="text-amber-400/90">{state.xp % 100}/100 XP</span>
          </div>
          <div className="w-full bg-black/40 h-2 rounded-full overflow-hidden border border-white/10">
            <div
              className="h-full bg-gradient-to-r from-amber-400 via-pink-500 to-indigo-500 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, state.xp % 100)}%` }}
            />
          </div>
        </div>

        {/* Quick Launch Actions */}
        <div className="grid grid-cols-2 gap-2.5 pt-4 mt-3 border-t border-white/10">
          <button
            type="button"
            onClick={handleSurpriseClick}
            className="py-2.5 px-3 rounded-2xl bg-gradient-to-r from-amber-500 via-pink-500 to-purple-600 hover:opacity-95 text-white font-display font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-pink-900/30 transition active:scale-95 cursor-pointer"
          >
            <Dices className="w-4 h-4" />
            <span>Surprise Game</span>
          </button>
          <button
            type="button"
            onClick={onViewAllChallenges}
            className="py-2.5 px-3 rounded-2xl bg-white/[0.06] hover:bg-white/[0.1] text-white font-display font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 border border-white/10 transition active:scale-95 cursor-pointer"
          >
            <span>All {CHALLENGES.length} Games</span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
          </button>
        </div>
      </div>

      {/* 2. Category Filter Pills */}
      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
        {categoryFilters.map((cat) => {
          const isActive = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => {
                haptics.selection();
                setSelectedCategory(cat.id);
              }}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-200 flex items-center gap-1.5 cursor-pointer shrink-0 ${
                isActive
                  ? 'bg-white text-slate-900 shadow-md font-black'
                  : 'bg-white/[0.05] hover:bg-white/[0.09] text-slate-300 border border-white/10'
              }`}
            >
              <span>{cat.icon}</span>
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* 3. Featured Games Grid */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <h3 className="font-display font-black text-sm sm:text-base text-white flex items-center gap-1.5">
            <span>Featured Challenges</span>
            <span className="text-amber-400 text-xs font-bold">🔥</span>
          </h3>
          <button
            onClick={onViewAllChallenges}
            className="text-xs font-bold text-slate-400 hover:text-white flex items-center gap-0.5 transition cursor-pointer"
          >
            <span>See all</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {filteredPopularGames.map((game) => {
            const isFav = !!favorites[game.id];
            return (
              <div
                key={game.id}
                onClick={() => {
                  haptics.heavy();
                  sound.playPop(state.soundEnabled);
                  onSelectChallenge(game, currentDifficulty);
                }}
                className="group p-3.5 rounded-[22px] bg-gradient-to-br from-[#101729]/90 to-[#0a0f1d]/90 hover:from-[#151f38] hover:to-[#0e162b] border border-white/10 hover:border-white/20 transition-all duration-200 flex items-center justify-between gap-3 cursor-pointer shadow-md hover:shadow-lg active:scale-[0.98]"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <ChallengeIcon
                    type={game.type}
                    category={game.cat}
                    rawEmoji={game.icon}
                    iconUrl={game.iconUrl}
                    size="md"
                    className="group-hover:scale-105 transition-transform shrink-0"
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h4 className="font-display font-bold text-white text-xs sm:text-sm truncate group-hover:text-amber-300 transition-colors">
                        {game.title}
                      </h4>
                    </div>
                    <span className="text-[11px] text-slate-400 truncate block mt-0.5">
                      {game.subCat || game.cat} • +{game.pts} XP
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={(e) => toggleFavorite(e, game.id)}
                    className="p-1.5 rounded-full hover:bg-white/10 text-slate-400 transition"
                  >
                    <Heart
                      className={`w-3.5 h-3.5 ${
                        isFav ? 'fill-rose-500 text-rose-500' : 'text-slate-500'
                      }`}
                    />
                  </button>
                  <div className="w-7 h-7 rounded-xl bg-white/[0.08] group-hover:bg-amber-400 group-hover:text-black text-white flex items-center justify-center transition-colors shadow-sm">
                    <Play className="w-3 h-3 fill-current ml-0.5" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Daily Activity Rings Compact Pod */}
      <div className="rounded-[24px] bg-gradient-to-b from-white/[0.05] to-white/[0.02] border border-white/10 p-4 shadow-md space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <h4 className="text-xs font-display font-black text-white uppercase tracking-wider">
              Today&apos;s Rings
            </h4>
          </div>
          <span className="text-[11px] font-bold text-slate-400">
            {state.points >= 150 ? 'Goals Crushed 🎯' : 'Keep Training ⚡'}
          </span>
        </div>

        <ActivityRings
          points={state.points}
          pointsGoal={Math.max(100, (currentLevel + 1) * 60)}
          streak={state.streak}
          streakGoal={7}
          completed={state.done}
          completedGoal={10}
          size={95}
          showLabels={true}
        />
      </div>
    </div>
  );
}
