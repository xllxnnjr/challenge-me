import React, { useState } from 'react';
import { Search, Dices, Sparkles, X, ChevronRight } from 'lucide-react';
import { Challenge, Difficulty } from '../../types';
import { CHALLENGES, CATEGORIES_CONFIG } from '../../data/challenges';
import { ChallengeCard } from '../ChallengeCard';
import { ChallengeIcon } from '../ChallengeIcon';
import { haptics } from '../../utils/haptics';

interface Props {
  onSelectChallenge: (challenge: Challenge, difficulty: Difficulty) => void;
  onRandomChallenge: (difficulty: Difficulty) => void;
  currentDifficulty: Difficulty;
  onChangeDifficulty?: (diff: Difficulty) => void;
}

export function ChallengesScreen({
  onSelectChallenge,
  onRandomChallenge,
  currentDifficulty,
}: Props) {
  const [selectedCategory, setSelectedCategory] = useState<string>('Math & Logic');
  const [selectedSubCat, setSelectedSubCat] = useState<string>('All');
  const [search, setSearch] = useState('');

  const currentCategoryConfig =
    CATEGORIES_CONFIG.find((c) => c.id === selectedCategory) || CATEGORIES_CONFIG[0];

  // Filter challenges strictly by active category, sub-category, and search
  const filteredChallenges = CHALLENGES.filter((c) => {
    const matchesCat = c.cat === selectedCategory;
    const matchesSubCat =
      selectedSubCat === 'All' ||
      selectedSubCat.startsWith('All ') ||
      c.subCat === selectedSubCat;

    const matchesSearch =
      search.trim() === '' ||
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.desc.toLowerCase().includes(search.toLowerCase()) ||
      c.cat.toLowerCase().includes(search.toLowerCase()) ||
      c.subCat.toLowerCase().includes(search.toLowerCase()) ||
      c.tags?.some((t) => t.toLowerCase().includes(search.toLowerCase()));

    return matchesCat && matchesSubCat && matchesSearch;
  });

  const handleSelectCategory = (catId: string) => {
    haptics.selection();
    setSelectedCategory(catId);
    setSelectedSubCat('All');
  };

  const handleSelectSubCategory = (sub: string) => {
    haptics.selection();
    setSelectedSubCat(sub.startsWith('All ') ? 'All' : sub);
  };

  const getDiffBadge = (diff: Difficulty) => {
    if (diff === 'Easy') return { icon: '🌱', label: 'Easy (0.75x)', color: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20' };
    if (diff === 'Hard') return { icon: '🔥', label: 'Hard (1.5x)', color: 'text-rose-400 bg-rose-400/10 border-rose-400/20' };
    return { icon: '⚡', label: 'Medium (1.0x)', color: 'text-amber-400 bg-amber-400/10 border-amber-400/20' };
  };

  const diffBadge = getDiffBadge(currentDifficulty);

  return (
    <div className="space-y-4 animate-in fade-in duration-300 pb-8">
      {/* Sleek Top Header & Action Controls */}
      <div className="flex items-center justify-between pt-1">
        <div>
          <h2 className="text-2xl sm:text-3xl font-display font-black tracking-tight text-white flex items-center gap-2">
            <span>Challenge Vault</span>
          </h2>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs text-[#94a3b8]">Apple Arcade collection</span>
            <span className={`inline-flex items-center gap-1 text-[10px] font-black px-2.5 py-0.5 rounded-full border ${diffBadge.color}`}>
              <span>{diffBadge.icon}</span>
              <span>{diffBadge.label}</span>
            </span>
          </div>
        </div>

        <button
          id="challenges-random-btn"
          onClick={() => {
            haptics.heavy();
            onRandomChallenge(currentDifficulty);
          }}
          title="Roll a random challenge"
          className="p-2.5 sm:px-3.5 sm:py-2.5 rounded-[20px] bg-white/[0.08] hover:bg-white/[0.12] border border-white/15 text-amber-300 text-xs font-black flex items-center gap-1.5 transition-all active:scale-95 shadow-md cursor-pointer group"
        >
          <Dices className="w-4 h-4 text-amber-400 group-hover:rotate-45 transition-transform" />
          <span className="hidden sm:inline">Surprise Me</span>
        </button>
      </div>

      {/* Apple Arcade Category Grid (Direct 4 Categories with Squircle Badges) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {CATEGORIES_CONFIG.map((cat) => {
          const isSelected = selectedCategory === cat.id;
          const count = CHALLENGES.filter((c) => c.cat === cat.id).length;

          return (
            <button
              key={cat.id}
              id={`cat-tab-${cat.id.toLowerCase().replace(/\s+/g, '-')}`}
              type="button"
              onClick={() => handleSelectCategory(cat.id)}
              className={`relative overflow-hidden p-3 rounded-[24px] font-display font-black text-xs transition-all duration-200 border cursor-pointer flex flex-col items-start gap-2 text-left active:scale-95 ${
                isSelected
                  ? 'bg-gradient-to-br from-white/[0.16] to-white/[0.06] border-white/30 text-white shadow-[0_10px_30px_rgba(0,0,0,0.45)] ring-1 ring-white/30'
                  : 'bg-white/[0.03] border-white/5 text-[#8e9ab2] hover:text-white hover:bg-white/[0.07] hover:border-white/15'
              }`}
            >
              {isSelected && (
                <div className="absolute top-0 right-0 w-14 h-14 bg-amber-400/15 rounded-bl-full pointer-events-none blur-sm" />
              )}

              <div className="flex items-center justify-between w-full">
                <ChallengeIcon category={cat.id} size="sm" />
                <span
                  className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                    isSelected
                      ? 'bg-amber-400 text-black shadow-sm'
                      : 'bg-white/10 text-slate-300'
                  }`}
                >
                  {count}
                </span>
              </div>
              <span className="text-xs font-black truncate w-full tracking-tight">
                {cat.name}
              </span>
            </button>
          );
        })}
      </div>

      {/* Category Spotlight & Sub-Category Capsule Pills Bar */}
      {currentCategoryConfig && (
        <div className="p-4 rounded-[26px] bg-gradient-to-br from-white/[0.08] via-white/[0.04] to-white/[0.015] backdrop-blur-2xl border border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.35)] space-y-3 relative overflow-hidden">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-3">
              <ChallengeIcon category={currentCategoryConfig.id} size="md" />
              <div>
                <h3 className="font-display font-black text-white text-sm sm:text-base flex items-center gap-1.5">
                  <span>{currentCategoryConfig.name}</span>
                </h3>
                <p className="text-[11px] text-[#94a3b8] leading-tight font-normal">
                  {currentCategoryConfig.desc}
                </p>
              </div>
            </div>
          </div>

          {/* Sub-Category Interactive Filter Capsules */}
          <div className="flex items-center gap-1.5 overflow-x-auto pt-1 no-scrollbar border-t border-white/5">
            {currentCategoryConfig.subCategories.map((sub) => {
              const isSubActive =
                selectedSubCat === sub ||
                (selectedSubCat === 'All' && sub.startsWith('All '));

              return (
                <button
                  key={sub}
                  type="button"
                  onClick={() => handleSelectSubCategory(sub)}
                  className={`whitespace-nowrap px-3.5 py-1.5 rounded-full text-xs font-bold transition-all border cursor-pointer active:scale-95 ${
                    isSubActive
                      ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-black font-black border-amber-300 shadow-md shadow-amber-500/20'
                      : 'bg-white/[0.05] text-[#9ca7bd] border-white/10 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {sub}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Apple-style Frosted Glass Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={`Search in ${selectedCategory}...`}
          className="w-full bg-white/[0.04] focus:bg-white/[0.08] border border-white/10 focus:border-white/20 rounded-[22px] pl-11 pr-9 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 outline-none transition-all shadow-inner backdrop-blur-xl"
        />
        {search && (
          <button
            onClick={() => {
              haptics.selection();
              setSearch('');
            }}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-slate-400 hover:text-white cursor-pointer"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Filter Stats Bar */}
      <div className="flex items-center justify-between text-xs text-[#94a3b8] px-1">
        <span className="font-semibold">
          {filteredChallenges.length} {filteredChallenges.length === 1 ? 'game' : 'games'} in{' '}
          <strong className="text-white">{selectedCategory}</strong>
          {selectedSubCat !== 'All' && !selectedSubCat.startsWith('All ') && (
            <span> • <span className="text-amber-400">{selectedSubCat}</span></span>
          )}
        </span>

        {selectedSubCat !== 'All' && !selectedSubCat.startsWith('All ') && (
          <button
            type="button"
            onClick={() => {
              haptics.selection();
              setSelectedSubCat('All');
            }}
            className="text-[11px] text-amber-400 hover:text-amber-300 font-bold cursor-pointer"
          >
            Reset filter
          </button>
        )}
      </div>

      {/* Challenge Cards Grid */}
      <div className="space-y-3">
        {filteredChallenges.length > 0 ? (
          filteredChallenges.map((c) => (
            <ChallengeCard
              key={c.id}
              challenge={c}
              activeDifficulty={currentDifficulty}
              onSelect={(item) => onSelectChallenge(item, currentDifficulty)}
            />
          ))
        ) : (
          <div className="bg-white/[0.03] border border-white/10 rounded-[28px] p-8 text-center space-y-2.5 shadow-xl">
            <span className="text-3xl">🔍</span>
            <h4 className="font-bold text-white text-sm">No challenges found</h4>
            <p className="text-xs text-[#94a3b8]">
              No micro-games match your sub-category filter or search query.
            </p>
            <button
              onClick={() => {
                haptics.selection();
                setSelectedSubCat('All');
                setSearch('');
              }}
              className="mt-2 text-xs font-bold text-amber-400 hover:underline cursor-pointer"
            >
              Reset Search & Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
