import React from 'react';
import { Play, Info, Heart, Sparkles, Zap, Flame, ShieldAlert, Award } from 'lucide-react';
import { Challenge, Difficulty } from '../types';
import { ChallengeIcon } from './ChallengeIcon';
import { haptics } from '../utils/haptics';

interface Props {
  key?: string;
  challenge: Challenge;
  onSelect: (challenge: Challenge) => void;
  onInfo?: (challenge: Challenge) => void;
  isFavorite?: boolean;
  onToggleFavorite?: (challengeId: string) => void;
  featured?: boolean;
  activeDifficulty?: Difficulty;
}

export function ChallengeCard({
  challenge,
  onSelect,
  onInfo,
  isFavorite = false,
  onToggleFavorite,
  featured,
  activeDifficulty = 'Medium',
}: Props) {
  const getCatBadge = (cat: string) => {
    switch (cat) {
      case 'Math & Logic':
        return {
          pill: 'border-amber-400/40 text-amber-300 bg-amber-500/10',
          accent: 'from-amber-500/20 to-transparent',
        };
      case 'Social & Party':
        return {
          pill: 'border-pink-400/40 text-pink-300 bg-pink-500/10',
          accent: 'from-pink-500/20 to-transparent',
        };
      case 'Memory & Focus':
        return {
          pill: 'border-purple-400/40 text-purple-300 bg-purple-500/10',
          accent: 'from-purple-500/20 to-transparent',
        };
      case 'Speed & Reflex':
        return {
          pill: 'border-cyan-400/40 text-cyan-300 bg-cyan-500/10',
          accent: 'from-cyan-500/20 to-transparent',
        };
      default:
        return {
          pill: 'border-indigo-400/40 text-indigo-300 bg-indigo-500/10',
          accent: 'from-indigo-500/20 to-transparent',
        };
    }
  };

  const getDifficultyPoints = (basePts: number, diff: Difficulty) => {
    if (diff === 'Easy') return Math.round(basePts * 0.75);
    if (diff === 'Hard') return Math.round(basePts * 1.5);
    return basePts;
  };

  const pts = getDifficultyPoints(challenge.pts, activeDifficulty);
  const badge = getCatBadge(challenge.cat);

  const handlePlayClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    haptics.medium();
    onSelect(challenge);
  };

  const handleInfoClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    haptics.light();
    if (onInfo) {
      onInfo(challenge);
    } else {
      onSelect(challenge);
    }
  };

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    haptics.selection();
    if (onToggleFavorite) {
      onToggleFavorite(challenge.id);
    }
  };

  return (
    <div
      onClick={handlePlayClick}
      className={`group relative overflow-hidden rounded-[24px] bg-[#0c1324]/90 hover:bg-[#111a33] border border-white/10 hover:border-amber-400/40 p-4 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-[0_14px_32px_rgba(0,0,0,0.5)] active:scale-[0.985] cursor-pointer flex flex-col justify-between gap-3.5 shadow-md ${
        featured ? 'ring-1 ring-amber-400/50' : ''
      }`}
    >
      {/* Ambient category glow accent */}
      <div
        className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl ${badge.accent} rounded-full blur-2xl pointer-events-none opacity-40 group-hover:opacity-80 transition-opacity`}
      />

      {/* Top row: Icon + Info + Actions */}
      <div className="flex items-start gap-3.5 min-w-0 z-10">
        <ChallengeIcon
          type={challenge.type}
          category={challenge.cat}
          rawEmoji={challenge.icon}
          iconUrl={challenge.iconUrl}
          size="md"
          className="group-hover:scale-105 transition-transform duration-200 shrink-0 shadow-inner"
        />

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap mb-1">
            <h3 className="font-display font-black text-white text-sm sm:text-base tracking-tight truncate group-hover:text-amber-300 transition-colors">
              {challenge.title}
            </h3>
            <span
              className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border whitespace-nowrap ${badge.pill}`}
            >
              {challenge.cat}
            </span>
          </div>

          <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
            {challenge.desc}
          </p>
        </div>

        {/* Top-Right Quick Actions: Info + Favorite */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            title="Game Info & Rules"
            onClick={handleInfoClick}
            className="w-7 h-7 rounded-full bg-white/[0.05] hover:bg-white/[0.12] text-slate-400 hover:text-white flex items-center justify-center transition active:scale-90 cursor-pointer"
          >
            <Info className="w-3.5 h-3.5" />
          </button>

          {onToggleFavorite && (
            <button
              type="button"
              title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
              onClick={handleFavoriteClick}
              className={`w-7 h-7 rounded-full flex items-center justify-center transition active:scale-90 cursor-pointer ${
                isFavorite
                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                  : 'bg-white/[0.05] hover:bg-white/[0.12] text-slate-400 hover:text-rose-400'
              }`}
            >
              <Heart
                className={`w-3.5 h-3.5 ${isFavorite ? 'fill-rose-400' : ''}`}
              />
            </button>
          )}
        </div>
      </div>

      {/* Bottom row: Sub-category/tags & Primary Play CTA */}
      <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/5 z-10">
        <div className="flex items-center gap-2 text-[11px] text-slate-400 truncate">
          <span className="text-slate-300 font-medium truncate">
            {challenge.subCat || challenge.cat}
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[11px] font-black text-amber-400 px-2 py-0.5 rounded-full bg-amber-400/10 border border-amber-400/20">
            +{pts} XP
          </span>

          <button
            type="button"
            onClick={handlePlayClick}
            className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:brightness-110 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-sm transition active:scale-95 cursor-pointer"
          >
            <span>Play</span>
            <Play className="w-3 h-3 fill-slate-950" />
          </button>
        </div>
      </div>
    </div>
  );
}
