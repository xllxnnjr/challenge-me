import React from 'react';
import { Dices, ChevronRight, Sparkles, Flame, Zap, Trophy, Play, Compass, ArrowRight } from 'lucide-react';
import { GameState, Challenge, Difficulty } from '../../types';
import { CHALLENGES, CATEGORIES_CONFIG } from '../../data/challenges';
import { ChallengeCard } from '../ChallengeCard';
import { calculateLevel } from '../../utils/storage';
import { AnimatedLevelBar } from '../AnimatedLevelBar';
import { AvatarDisplay } from '../AvatarDisplay';
import { ActivityRings } from '../ActivityRings';
import { ChallengeIcon } from '../ChallengeIcon';
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

  // Showcase curated picks
  const mathPick = CHALLENGES.find((c) => c.cat === 'Math & Logic') || CHALLENGES[0];
  const socialPick = CHALLENGES.find((c) => c.cat === 'Social & Party') || CHALLENGES[3];
  const memoryPick = CHALLENGES.find((c) => c.cat === 'Memory & Focus') || CHALLENGES[7];
  const speedPick = CHALLENGES.find((c) => c.cat === 'Speed & Reflex') || CHALLENGES[13];
  const curatedPicks = [mathPick, socialPick, memoryPick, speedPick];

  // Daily Hero Spotlight Challenge
  const heroChallenge = CHALLENGES[Math.abs(state.points * 3 + state.streak) % CHALLENGES.length] || mathPick;

  const handleSurpriseClick = () => {
    haptics.heavy();
    onRandomChallenge(currentDifficulty);
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-300 pb-8">
      {/* Apple-style Top Hero Greeting */}
      <div className="pt-2 pb-1 relative">
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 bg-amber-400/10 border border-amber-400/20 px-3 py-0.5 rounded-full flex items-center gap-1.5 backdrop-blur-md">
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span>DAILY SPRINT</span>
          </span>

          <span className="text-[11px] font-bold text-slate-400 bg-white/[0.04] border border-white/10 px-2.5 py-0.5 rounded-full">
            Tier: <strong className="text-white">{currentDifficulty}</strong>
          </span>
        </div>

        <h2 className="text-3xl sm:text-4xl font-black font-display tracking-tight text-white leading-tight mb-1">
          Good day,{' '}
          <span className="bg-gradient-to-r from-[#FF9500] via-[#FF2D55] to-[#AF52DE] bg-clip-text text-transparent">
            {state.playerName}.
          </span>
        </h2>
        <p className="text-xs sm:text-sm text-[#94a3b8] leading-relaxed">
          Level {currentLevel} Challenger • Close your daily activity rings & conquer micro-games.
        </p>
      </div>

      {/* Apple Fitness Activity Rings Bento Card */}
      <div className="rounded-[30px] bg-gradient-to-br from-white/[0.09] via-white/[0.04] to-white/[0.015] backdrop-blur-2xl border border-white/10 p-5 shadow-[0_12px_40px_rgba(0,0,0,0.45)] relative overflow-hidden space-y-4">
        {/* Apple specular reflection */}
        <div className="absolute top-0 inset-x-0 h-1/3 bg-gradient-to-b from-white/10 to-transparent pointer-events-none rounded-t-[30px]" />

        {/* Profile + Animated Level Header */}
        <div className="flex items-center gap-3.5">
          <AvatarDisplay
            avatar={state.avatar}
            size="lg"
            className="ring-2 ring-amber-400/50 shadow-lg shadow-black/60 flex-shrink-0"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-display font-black text-white text-base truncate flex items-center gap-1.5">
                <span>{state.playerName}</span>
                <span className="text-amber-400 text-xs">👑</span>
              </h3>
              <span className="px-2.5 py-0.5 rounded-full bg-white/10 border border-white/15 text-amber-300 text-[11px] font-black shadow-sm">
                Level {currentLevel}
              </span>
            </div>

            <AnimatedLevelBar
              xp={state.xp}
              level={currentLevel}
              soundEnabled={state.soundEnabled}
            />
          </div>
        </div>

        {/* Apple Watch 3-Ring Activity Component */}
        <div className="pt-3 border-t border-white/5 bg-black/25 rounded-[22px] p-3.5 border border-white/5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
              Daily Activity Goals
            </span>
            <span className="text-[10px] text-amber-400 font-bold">
              {state.points >= 300 && state.streak >= 7 && state.done >= 10 ? '✨ Rings Closed!' : 'In Progress'}
            </span>
          </div>

          <ActivityRings
            points={state.points}
            pointsGoal={Math.max(100, (currentLevel + 1) * 60)}
            streak={state.streak}
            streakGoal={7}
            completed={state.done}
            completedGoal={10}
            size={110}
            showLabels={true}
          />
        </div>
      </div>

      {/* Apple Arcade Featured Hero Banner */}
      <div
        onClick={() => {
          haptics.heavy();
          onSelectChallenge(heroChallenge, currentDifficulty);
        }}
        className="group relative overflow-hidden rounded-[30px] p-5 bg-gradient-to-br from-[#1E1B4B] via-[#0F172A] to-[#18181B] border border-white/15 shadow-[0_12px_40px_rgba(0,0,0,0.5)] cursor-pointer active:scale-[0.98] transition-all duration-200"
      >
        {/* Glowing Apple Neon Orbs in background */}
        <div className="absolute -top-10 -right-10 w-44 h-44 bg-gradient-to-br from-amber-500/20 via-pink-500/20 to-purple-600/20 rounded-full blur-3xl pointer-events-none group-hover:scale-125 transition-transform duration-500" />

        <div className="relative z-10 space-y-3">
          <div className="flex items-center justify-between">
            <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-gradient-to-r from-amber-400 to-pink-500 text-black shadow-md shadow-pink-500/20">
              FEATURED TODAY
            </span>
            <span className="text-xs font-black text-amber-300 bg-white/10 px-2.5 py-0.5 rounded-full border border-white/15">
              +{heroChallenge.pts} XP
            </span>
          </div>

          <div className="flex items-center gap-3.5">
            <ChallengeIcon
              type={heroChallenge.type}
              category={heroChallenge.cat}
              rawEmoji={heroChallenge.icon}
              size="lg"
              className="group-hover:scale-110 transition-transform duration-300"
            />
            <div className="flex-1 min-w-0">
              <h3 className="text-xl font-display font-black text-white tracking-tight leading-tight group-hover:text-amber-300 transition-colors truncate">
                {heroChallenge.title}
              </h3>
              <p className="text-xs text-[#94a3b8] line-clamp-2 leading-relaxed mt-0.5">
                {heroChallenge.desc}
              </p>
            </div>
          </div>

          <div className="pt-1 flex items-center justify-between">
            <span className="text-[11px] text-slate-400 font-semibold">
              Category: <strong className="text-white">{heroChallenge.cat}</strong>
            </span>
            <button
              type="button"
              className="px-4 py-1.5 rounded-full bg-white text-black font-black text-xs flex items-center gap-1.5 shadow-lg group-hover:bg-amber-400 transition-colors"
            >
              <span>PLAY</span>
              <Play className="w-3 h-3 fill-current" />
            </button>
          </div>
        </div>
      </div>

      {/* Surprise Challenge Tactile Button */}
      <button
        id="home-random-cta"
        onClick={handleSurpriseClick}
        className="w-full py-4 px-5 rounded-[26px] font-display font-black text-base tracking-wide text-white bg-gradient-to-r from-[#FF9500] via-[#FF2D55] to-[#AF52DE] hover:brightness-105 active:scale-[0.97] transition-all duration-200 shadow-[0_10px_35px_rgba(255,45,85,0.35)] flex items-center justify-center gap-2.5 cursor-pointer group"
      >
        <Dices className="w-5 h-5 group-hover:rotate-45 transition-transform duration-300" />
        <span>SURPRISE CHALLENGE</span>
      </button>

      {/* Quick Category Discovery Pills Grid (Apple Arcade Category Browse) */}
      <div className="space-y-2 pt-1">
        <div className="flex items-center justify-between px-1">
          <h3 className="font-display font-black text-sm uppercase tracking-wider text-slate-400">
            Browse Categories
          </h3>
          <button
            onClick={() => {
              haptics.light();
              onViewAllChallenges();
            }}
            className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-0.5 cursor-pointer"
          >
            <span>View all</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {CATEGORIES_CONFIG.map((cat) => {
            const count = CHALLENGES.filter((c) => c.cat === cat.id).length;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  haptics.selection();
                  onViewAllChallenges();
                }}
                className="p-3 rounded-[22px] bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-white/20 transition-all text-left flex items-center gap-2.5 active:scale-95 cursor-pointer shadow-sm group"
              >
                <ChallengeIcon category={cat.id} size="sm" />
                <div className="min-w-0 flex-1">
                  <strong className="block text-xs font-black text-white truncate group-hover:text-amber-300 transition-colors">
                    {cat.name}
                  </strong>
                  <span className="text-[10px] text-slate-400 font-medium">{count} games</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Today's Featured Picks List */}
      <div className="space-y-3 pt-1">
        <div className="flex items-center justify-between px-1">
          <div>
            <h3 className="font-display font-black text-base sm:text-lg text-white">
              Today&apos;s Featured
            </h3>
            <span className="text-xs text-[#8e9cb4]">Handpicked micro-games across all disciplines</span>
          </div>
          <button
            onClick={() => {
              haptics.light();
              onViewAllChallenges();
            }}
            className="text-xs font-black text-amber-400 hover:text-amber-300 flex items-center gap-0.5 transition cursor-pointer"
          >
            <span>See all ({CHALLENGES.length})</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="space-y-3">
          {curatedPicks.map((c) => (
            <ChallengeCard
              key={c.id}
              challenge={c}
              activeDifficulty={currentDifficulty}
              onSelect={(item) => onSelectChallenge(item, currentDifficulty)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
