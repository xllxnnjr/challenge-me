import React, { useState, useMemo } from 'react';
import {
  Search,
  Sparkles,
  X,
  Play,
  Zap,
  Info,
  Heart,
  Gamepad2,
  CheckCircle2,
  HelpCircle,
  SlidersHorizontal,
  Flame,
  Award,
} from 'lucide-react';
import { Challenge, Difficulty } from '../../types';
import { CHALLENGES } from '../../data/challenges';
import { ChallengeCard } from '../ChallengeCard';
import { ChallengeIcon } from '../ChallengeIcon';
import { haptics } from '../../utils/haptics';

interface Props {
  onSelectChallenge: (challenge: Challenge, difficulty: Difficulty) => void;
  onRandomChallenge: (difficulty: Difficulty) => void;
  currentDifficulty: Difficulty;
  onChangeDifficulty?: (diff: Difficulty) => void;
  onToast?: (msg: string) => void;
  soundEnabled?: boolean;
}

export function ChallengesScreen({
  onSelectChallenge,
  onRandomChallenge,
  currentDifficulty,
  onChangeDifficulty,
  onToast,
  soundEnabled = true,
}: Props) {
  const [selectedCat, setSelectedCat] = useState<string>('All');
  const [search, setSearch] = useState('');
  const [infoChallenge, setInfoChallenge] = useState<Challenge | null>(null);

  // Favorites state persisted locally
  const [favorites, setFavorites] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem('challenge_me_favorites');
      return saved ? JSON.parse(saved) : { math: true, tech_quiz: true, stroop: true };
    } catch {
      return { math: true, tech_quiz: true, stroop: true };
    }
  });

  const handleToggleFavorite = (challengeId: string) => {
    setFavorites((prev) => {
      const next = { ...prev, [challengeId]: !prev[challengeId] };
      try {
        localStorage.setItem('challenge_me_favorites', JSON.stringify(next));
      } catch {}
      if (next[challengeId]) {
        onToast?.('Added to favorites! ❤️');
      } else {
        onToast?.('Removed from favorites');
      }
      return next;
    });
  };

  const categories = [
    { id: 'All', label: 'All Games', icon: '🎮' },
    { id: 'Favorites', label: 'Favorites', icon: '❤️' },
    { id: 'Knowledge & Trivia', label: 'Trivia', icon: '🌍' },
    { id: 'Math & Logic', label: 'Logic & Math', icon: '🧮' },
    { id: 'Speed & Reflex', label: 'Reflex', icon: '⚡' },
    { id: 'Memory & Focus', label: 'Memory', icon: '🧠' },
    { id: 'Social & Party', label: 'Party', icon: '🎉' },
  ];

  const filteredChallenges = useMemo(() => {
    return CHALLENGES.filter((c) => {
      if (search.trim() !== '') {
        const q = search.toLowerCase();
        return (
          c.title.toLowerCase().includes(q) ||
          c.desc.toLowerCase().includes(q) ||
          c.cat.toLowerCase().includes(q) ||
          (c.subCat && c.subCat.toLowerCase().includes(q))
        );
      }
      if (selectedCat === 'All') return true;
      if (selectedCat === 'Favorites') return Boolean(favorites[c.id]);
      return c.cat === selectedCat;
    });
  }, [search, selectedCat, favorites]);

  const getDiffBadge = (diff: Difficulty) => {
    if (diff === 'Easy') return { label: 'Easy (0.75x)', color: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10' };
    if (diff === 'Hard') return { label: 'Hard (1.5x)', color: 'text-rose-400 border-rose-500/30 bg-rose-500/10' };
    return { label: 'Medium (1.0x)', color: 'text-amber-400 border-amber-500/30 bg-amber-500/10' };
  };

  const diffInfo = getDiffBadge(currentDifficulty);

  return (
    <div className="space-y-4 pb-12 animate-in fade-in duration-200">
      {/* 1. Header & Quick Controls */}
      <div className="flex items-center justify-between gap-3 pt-1">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-black text-white tracking-tight">
            Game Library
          </h1>
          <p className="text-xs text-slate-400">
            {CHALLENGES.length} challenges across 5 mental & reflex disciplines
          </p>
        </div>

        {/* Quick Difficulty Toggle & Surprise Play Button */}
        <div className="flex items-center gap-2">
          {onChangeDifficulty && (
            <button
              type="button"
              onClick={() => {
                const nextDiff: Difficulty =
                  currentDifficulty === 'Easy' ? 'Medium' : currentDifficulty === 'Medium' ? 'Hard' : 'Easy';
                haptics.selection();
                onChangeDifficulty(nextDiff);
              }}
              title="Change active difficulty"
              className={`px-3 py-1.5 rounded-full border text-xs font-bold transition-all cursor-pointer ${diffInfo.color}`}
            >
              {diffInfo.label}
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              haptics.heavy();
              onRandomChallenge(currentDifficulty);
            }}
            className="px-3.5 py-1.5 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-md hover:brightness-110 active:scale-95 transition cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 fill-slate-950" />
            <span>Surprise Me</span>
          </button>
        </div>
      </div>

      {/* 2. Search Box */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search games by name, topic, or skill (e.g. math, trivia, reflex)..."
          className="w-full pl-10 pr-10 py-2.5 rounded-2xl bg-[#0c1322]/90 border border-white/10 text-white placeholder-slate-500 text-xs sm:text-sm focus:outline-none focus:border-amber-400/60 transition shadow-inner"
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch('')}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* 3. Category Filter Tabs */}
      {!search && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {categories.map((cat) => {
            const isSelected = selectedCat === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  haptics.selection();
                  setSelectedCat(cat.id);
                }}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                  isSelected
                    ? 'bg-amber-400 text-slate-950 shadow-md font-black'
                    : 'bg-[#0c1322]/80 border border-white/10 text-slate-300 hover:text-white hover:border-white/20'
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* 4. Filtered Challenges Grid */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-black uppercase text-slate-400 tracking-wider">
            {search
              ? `Search Results (${filteredChallenges.length})`
              : `${selectedCat === 'All' ? 'All Challenges' : selectedCat} (${filteredChallenges.length})`}
          </span>
          <span className="text-[11px] text-slate-400">
            Tap to play or view rules
          </span>
        </div>

        {filteredChallenges.length === 0 ? (
          <div className="py-14 text-center rounded-2xl bg-white/[0.02] border border-white/5 space-y-3">
            <p className="text-sm font-bold text-slate-400">
              {selectedCat === 'Favorites'
                ? 'No favorite games yet! Tap the heart icon on any game card to bookmark it.'
                : 'No games matched your search criteria.'}
            </p>
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setSelectedCat('All');
              }}
              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs cursor-pointer transition"
            >
              Show All Games
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {filteredChallenges.map((challenge) => (
              <ChallengeCard
                key={challenge.id}
                challenge={challenge}
                activeDifficulty={currentDifficulty}
                isFavorite={Boolean(favorites[challenge.id])}
                onToggleFavorite={handleToggleFavorite}
                onSelect={(c) => onSelectChallenge(c, currentDifficulty)}
                onInfo={(c) => setInfoChallenge(c)}
              />
            ))}
          </div>
        )}
      </div>

      {/* 5. Game Detail / Info Modal */}
      {infoChallenge && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-[28px] bg-[#0d1424] border border-white/15 p-5 space-y-4 shadow-2xl relative">
            <button
              type="button"
              onClick={() => setInfoChallenge(null)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3.5 pt-1">
              <ChallengeIcon
                type={infoChallenge.type}
                category={infoChallenge.cat}
                rawEmoji={infoChallenge.icon}
                iconUrl={infoChallenge.iconUrl}
                size="lg"
              />
              <div className="min-w-0 flex-1">
                <h3 className="font-display font-black text-lg text-white">
                  {infoChallenge.title}
                </h3>
                <span className="text-xs font-bold text-amber-400">
                  {infoChallenge.cat} • {infoChallenge.subCat || 'Standard'}
                </span>
              </div>
            </div>

            <div className="space-y-2 text-xs text-slate-300 bg-white/[0.03] p-3.5 rounded-2xl border border-white/5 leading-relaxed">
              <p className="font-medium">{infoChallenge.desc}</p>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-3 rounded-2xl bg-white/[0.04] border border-white/5">
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Reward</span>
                <span className="font-black text-amber-300 text-sm">+{infoChallenge.pts} Base XP</span>
              </div>
              <div className="p-3 rounded-2xl bg-white/[0.04] border border-white/5">
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Mechanic</span>
                <span className="font-black text-white text-sm capitalize">{infoChallenge.type}</span>
              </div>
            </div>

            <div className="pt-2 flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  handleToggleFavorite(infoChallenge.id);
                }}
                className={`p-3 rounded-2xl border text-xs font-bold flex items-center justify-center transition cursor-pointer ${
                  favorites[infoChallenge.id]
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                    : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10'
                }`}
              >
                <Heart className={`w-4 h-4 ${favorites[infoChallenge.id] ? 'fill-rose-400' : ''}`} />
              </button>

              <button
                type="button"
                onClick={() => {
                  const target = infoChallenge;
                  setInfoChallenge(null);
                  onSelectChallenge(target, currentDifficulty);
                }}
                className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-950/40 transition active:scale-95 cursor-pointer"
              >
                <span>Play Game Now</span>
                <Play className="w-4 h-4 fill-slate-950" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
