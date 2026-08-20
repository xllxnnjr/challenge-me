import React from 'react';
import { Play, Sparkles } from 'lucide-react';
import { Challenge, Difficulty } from '../types';
import { ChallengeIcon } from './ChallengeIcon';
import { haptics } from '../utils/haptics';

interface Props {
  challenge: Challenge;
  onSelect: (challenge: Challenge) => void;
  featured?: boolean;
  activeDifficulty?: Difficulty;
  key?: React.Key;
}

export function ChallengeCard({ challenge, onSelect, featured, activeDifficulty = 'Medium' }: Props) {
  const getCatBadge = (cat: string) => {
    switch (cat) {
      case 'Math & Logic':
        return 'border-amber-400/30 text-amber-300 bg-amber-400/10';
      case 'Social & Party':
        return 'border-pink-400/30 text-pink-300 bg-pink-400/10';
      case 'Memory & Focus':
        return 'border-purple-400/30 text-purple-300 bg-purple-400/10';
      case 'Speed & Reflex':
        return 'border-cyan-400/30 text-cyan-300 bg-cyan-400/10';
      default:
        return 'border-indigo-400/30 text-indigo-300 bg-indigo-400/10';
    }
  };

  const getDifficultyPoints = (basePts: number, diff: Difficulty) => {
    if (diff === 'Easy') return Math.round(basePts * 0.75);
    if (diff === 'Hard') return Math.round(basePts * 1.5);
    return basePts;
  };

  const pts = getDifficultyPoints(challenge.pts, activeDifficulty);
  const badgeStyle = getCatBadge(challenge.cat);

  const handleClick = () => {
    haptics.medium();
    onSelect(challenge);
  };

  return (
    <div
      onClick={handleClick}
      className={`group relative overflow-hidden rounded-[26px] bg-gradient-to-br from-white/[0.08] via-white/[0.04] to-white/[0.015] backdrop-blur-2xl border border-white/10 hover:border-white/25 p-4 transition-all duration-200 cursor-pointer active:scale-[0.98] shadow-[0_8px_28px_rgba(0,0,0,0.35)] hover:shadow-[0_12px_36px_rgba(0,0,0,0.5)] flex items-start sm:items-center gap-3.5 ${
        featured ? 'ring-1 ring-amber-400/60 shadow-amber-950/25' : ''
      }`}
    >
      {/* Specular glass sheen on top */}
      <div className="absolute top-0 inset-x-0 h-1/3 bg-gradient-to-b from-white/10 to-transparent pointer-events-none rounded-t-[26px]" />

      {/* Apple App Store / Arcade Style Icon */}
      <ChallengeIcon
        type={challenge.type}
        category={challenge.cat}
        rawEmoji={challenge.icon}
        size="md"
        className="group-hover:scale-105 transition-transform duration-200 mt-0.5 sm:mt-0 flex-shrink-0"
      />

      {/* Info Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap mb-1">
          <span className="font-display font-black text-white text-base tracking-tight truncate group-hover:text-amber-300 transition-colors">
            {challenge.title}
          </span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${badgeStyle}`}>
            {challenge.cat}
          </span>
          {challenge.subCat && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold text-slate-300 bg-white/[0.06] border border-white/10">
              {challenge.subCat}
            </span>
          )}
        </div>
        <p className="text-xs text-[#94a3b8] line-clamp-2 leading-relaxed font-normal">
          {challenge.desc}
        </p>
      </div>

      {/* Apple "GET" / Play button with XP Capsule */}
      <div className="flex items-center gap-2 flex-shrink-0 self-center">
        <div className="px-3 py-1.5 rounded-full bg-white/[0.09] group-hover:bg-amber-400 group-hover:text-black border border-white/15 text-amber-300 font-black text-xs shadow-sm transition-all duration-200 flex items-center gap-1.5">
          <span>+{pts}</span>
          <Play className="w-2.5 h-2.5 fill-current opacity-75" />
        </div>
      </div>
    </div>
  );
}
