import { useState } from 'react';
import { Search, Dices, Layers, Sparkles, SlidersHorizontal } from 'lucide-react';
import { Challenge, Difficulty } from '../../types';
import { CHALLENGES, CATEGORIES_CONFIG } from '../../data/challenges';
import { ChallengeCard } from '../ChallengeCard';

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
  // Default to first category since "All" tab is removed as requested
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
    setSelectedCategory(catId);
    setSelectedSubCat('All');
  };

  const getDiffBadge = (diff: Difficulty) => {
    if (diff === 'Easy') return { icon: '🌱', label: 'Easy (0.75x)', color: 'text-emerald-300 bg-emerald-950/60 border-emerald-700/50' };
    if (diff === 'Hard') return { icon: '🔥', label: 'Hard (1.5x)', color: 'text-rose-300 bg-rose-950/60 border-rose-700/50' };
    return { icon: '⚡', label: 'Medium (1.0x)', color: 'text-amber-300 bg-amber-950/60 border-amber-700/50' };
  };

  const diffBadge = getDiffBadge(currentDifficulty);

  return (
    <div className="space-y-4 animate-in fade-in duration-300 pb-8">
      {/* Sleek Top Header & Action Controls */}
      <div className="flex items-center justify-between pt-1">
        <div>
          <h2 className="text-2xl sm:text-3xl font-display font-black tracking-tight text-white flex items-center gap-2">
            <span>Challenge Vault</span>
            <span className="text-amber-400 text-lg animate-bounce">⚡</span>
          </h2>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs text-[#94a3b8]">Select category & sub-skills</span>
            <span className={`inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full border ${diffBadge.color}`}>
              <span>{diffBadge.icon}</span>
              <span>{diffBadge.label}</span>
            </span>
          </div>
        </div>

        <button
          id="challenges-random-btn"
          onClick={() => onRandomChallenge(currentDifficulty)}
          title="Roll a random challenge"
          className="p-2.5 sm:px-3.5 sm:py-2.5 rounded-2xl bg-gradient-to-r from-amber-500/20 via-pink-500/20 to-purple-600/20 hover:from-amber-500/30 hover:to-purple-600/30 border border-amber-500/40 text-amber-300 text-xs font-black flex items-center gap-1.5 transition-all active:scale-95 shadow-lg shadow-amber-950/30 cursor-pointer group"
        >
          <Dices className="w-4 h-4 text-amber-400 group-hover:rotate-45 transition-transform" />
          <span className="hidden sm:inline">Surprise Me</span>
        </button>
      </div>

      {/* Sleek Category Tabs (Direct categories, no "All" side tab) */}
      <div className="space-y-2">
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
                className={`relative overflow-hidden p-3 rounded-2xl font-display font-black text-xs transition-all duration-200 border cursor-pointer flex flex-col items-start gap-1 text-left ${
                  isSelected
                    ? 'bg-gradient-to-br from-[#1d263d] to-[#12192b] border-amber-400/80 text-white shadow-xl shadow-amber-950/30 scale-[1.02] ring-1 ring-amber-400/50'
                    : 'bg-[#0f1627]/90 border-[#23304c] text-[#8e9ab2] hover:text-white hover:bg-[#162139] hover:border-[#354870]'
                }`}
              >
                {/* Active Indicator Glow */}
                {isSelected && (
                  <div className="absolute top-0 right-0 w-12 h-12 bg-amber-400/10 rounded-bl-full pointer-events-none blur-sm" />
                )}

                <div className="flex items-center justify-between w-full">
                  <span className="text-xl">{cat.icon}</span>
                  <span
                    className={`text-[10px] font-extrabold px-1.5 py-0.2 rounded-full ${
                      isSelected
                        ? 'bg-amber-400 text-black shadow-sm'
                        : 'bg-[#18233b] text-[#8ea0be] border border-[#2d3d5f]'
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
      </div>

      {/* Sleek Category Spotlight & Sub-Category Pills Bar */}
      {currentCategoryConfig && (
        <div className="p-4 rounded-3xl bg-gradient-to-br from-[#131b2e] via-[#101728] to-[#0a101f] border border-[#293856] shadow-xl space-y-3 relative overflow-hidden">
          {/* Subtle background ambient blur */}
          <div className="absolute -top-10 -right-10 w-28 h-28 bg-gradient-to-br from-amber-500/10 to-purple-500/10 rounded-full blur-xl pointer-events-none" />

          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#1c2842] border border-[#344870] flex items-center justify-center text-xl shadow-inner flex-shrink-0">
                {currentCategoryConfig.icon}
              </div>
              <div>
                <h3 className="font-display font-black text-white text-sm sm:text-base flex items-center gap-1.5">
                  <span>{currentCategoryConfig.name}</span>
                </h3>
                <p className="text-[11px] text-[#94a3b8] leading-tight">
                  {currentCategoryConfig.desc}
                </p>
              </div>
            </div>
          </div>

          {/* Sub-Category Interactive Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pt-1 no-scrollbar border-t border-white/5">
            {currentCategoryConfig.subCategories.map((sub) => {
              const isSubActive =
                selectedSubCat === sub ||
                (selectedSubCat === 'All' && sub.startsWith('All '));

              return (
                <button
                  key={sub}
                  type="button"
                  onClick={() => setSelectedSubCat(sub.startsWith('All ') ? 'All' : sub)}
                  className={`whitespace-nowrap px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer active:scale-95 ${
                    isSubActive
                      ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-black font-black border-amber-300 shadow-md shadow-amber-500/20'
                      : 'bg-[#162035]/80 text-[#9ca7bd] border-[#293959] hover:text-white hover:bg-[#1f2d4a]'
                  }`}
                >
                  {sub}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Sleek Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={`Search inside ${selectedCategory}...`}
          className="w-full bg-[#0d1424] border border-[#24314c] focus:border-amber-400/80 rounded-2xl pl-10 pr-8 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 outline-none transition shadow-inner"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white cursor-pointer"
          >
            ✕
          </button>
        )}
      </div>

      {/* Filter Stats Bar */}
      <div className="flex items-center justify-between text-xs text-[#94a3b8] px-1">
        <span className="font-semibold">
          {filteredChallenges.length} {filteredChallenges.length === 1 ? 'challenge' : 'challenges'} in{' '}
          <strong className="text-white">{selectedCategory}</strong>
          {selectedSubCat !== 'All' && !selectedSubCat.startsWith('All ') && (
            <span> • <span className="text-amber-400">{selectedSubCat}</span></span>
          )}
        </span>

        {selectedSubCat !== 'All' && !selectedSubCat.startsWith('All ') && (
          <button
            type="button"
            onClick={() => setSelectedSubCat('All')}
            className="text-[11px] text-amber-400 hover:text-amber-300 font-bold cursor-pointer"
          >
            Clear sub-filter
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
          <div className="bg-[#0f1627]/80 border border-[#24314c] rounded-3xl p-8 text-center space-y-2.5 shadow-xl">
            <span className="text-3xl">🔍</span>
            <h4 className="font-bold text-white text-sm">No challenges found</h4>
            <p className="text-xs text-[#94a3b8]">
              No mini-challenges match your sub-category filter or search query.
            </p>
            <button
              onClick={() => {
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
