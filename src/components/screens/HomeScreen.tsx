import { Dices, ChevronRight, Sparkles, Zap, Flame, Trophy } from 'lucide-react';
import { GameState, Challenge, Difficulty } from '../../types';
import { CHALLENGES } from '../../data/challenges';
import { ChallengeCard } from '../ChallengeCard';
import { calculateLevel } from '../../utils/storage';
import { AnimatedLevelBar } from '../AnimatedLevelBar';
import { AvatarDisplay } from '../AvatarDisplay';

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

  // Showcase one curated challenge from each of the 4 core categories on Home screen
  const mathPick = CHALLENGES.find(c => c.cat === 'Math & Logic') || CHALLENGES[0];
  const socialPick = CHALLENGES.find(c => c.cat === 'Social & Party') || CHALLENGES[3];
  const memoryPick = CHALLENGES.find(c => c.cat === 'Memory & Focus') || CHALLENGES[7];
  const speedPick = CHALLENGES.find(c => c.cat === 'Speed & Reflex') || CHALLENGES[13];
  const curatedPicks = [mathPick, socialPick, memoryPick, speedPick];

  return (
    <div className="space-y-4 animate-in fade-in duration-300 pb-8">
      {/* Hero Header with Modern Dynamic Typography */}
      <div className="pt-2 pb-1 relative">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[11px] font-black uppercase tracking-wider text-amber-400 bg-amber-950/60 border border-amber-800/60 px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
            <Sparkles className="w-3 h-3 text-amber-300" />
            <span>DAILY BRAIN & REFLEX SPRINT</span>
          </span>
        </div>

        <h2 className="text-3xl sm:text-4xl font-black font-display tracking-tight text-white leading-tight mb-1">
          Step out.{' '}
          <span className="bg-gradient-to-r from-amber-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
            Have fun.
          </span>
        </h2>
        <p className="text-xs sm:text-sm text-[#94a3b8] leading-relaxed">
          Quick daily mini challenges across Math, Social, Memory & Speed.
        </p>
      </div>

      {/* Sleek Profile & XP Status Card with Animated Level Bar */}
      <div className="rounded-3xl bg-gradient-to-br from-[#131d33] via-[#0f172a] to-[#090f1e] border border-[#263756] p-4 sm:p-5 shadow-2xl space-y-3.5 relative overflow-hidden">
        <div className="absolute -top-12 -right-12 w-36 h-36 bg-amber-400/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-center gap-3.5">
          <AvatarDisplay
            avatar={state.avatar}
            size="lg"
            className="ring-2 ring-amber-400/60 shadow-lg shadow-black/80"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1.5">
              <h3 className="font-display font-black text-white text-base truncate flex items-center gap-1">
                <span>{state.playerName}</span>
                <span className="text-amber-400 text-xs">👑</span>
              </h3>
              <span className="px-2.5 py-0.5 rounded-full bg-gradient-to-r from-purple-950/90 to-indigo-950/90 border border-purple-600/80 text-purple-200 text-[11px] font-black shadow-sm">
                Lvl {currentLevel}
              </span>
            </div>

            {/* Framer Motion Animated Level Bar */}
            <AnimatedLevelBar
              xp={state.xp}
              level={currentLevel}
              soundEnabled={state.soundEnabled}
            />
          </div>
        </div>

        {/* Quick Mini Stats Grid with Sleek Glow */}
        <div className="grid grid-cols-3 gap-2.5 pt-2.5 border-t border-white/5">
          <div className="bg-[#10192e]/90 border border-[#233352] rounded-2xl p-2.5 text-center shadow-inner">
            <strong className="block font-display font-black text-lg sm:text-xl text-amber-400 leading-tight">
              {state.points}
            </strong>
            <small className="text-[11px] text-[#8e9cb4] font-bold">⭐ Points</small>
          </div>
          <div className="bg-[#10192e]/90 border border-[#233352] rounded-2xl p-2.5 text-center shadow-inner">
            <strong className="block font-display font-black text-lg sm:text-xl text-orange-400 leading-tight">
              {state.streak}
            </strong>
            <small className="text-[11px] text-[#8e9cb4] font-bold">🔥 Streak</small>
          </div>
          <div className="bg-[#10192e]/90 border border-[#233352] rounded-2xl p-2.5 text-center shadow-inner">
            <strong className="block font-display font-black text-lg sm:text-xl text-purple-300 leading-tight">
              {state.done}
            </strong>
            <small className="text-[11px] text-[#8e9cb4] font-bold">⚡ Solved</small>
          </div>
        </div>
      </div>

      {/* Main Random CTA Button with Vibrant Modern Gradient */}
      <button
        id="home-random-cta"
        onClick={() => onRandomChallenge(currentDifficulty)}
        className="w-full py-4 px-5 rounded-3xl font-display font-black text-base tracking-wide text-white bg-gradient-to-r from-amber-500 via-pink-500 to-purple-600 hover:opacity-95 active:scale-[0.98] transition-all shadow-xl shadow-purple-900/30 flex items-center justify-center gap-2.5 cursor-pointer group"
      >
        <Dices className="w-5 h-5 group-hover:rotate-45 transition-transform" />
        <span>🎲 ROLL RANDOM CHALLENGE</span>
      </button>

      {/* Today's Curated Picks Section */}
      <div className="space-y-3 pt-1">
        <div className="flex items-center justify-between px-1">
          <div>
            <h3 className="font-display font-black text-base sm:text-lg text-white">
              Today&apos;s Featured Picks
            </h3>
            <span className="text-xs text-[#8e9cb4]">One curated challenge from each core skill</span>
          </div>
          <button
            onClick={onViewAllChallenges}
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
