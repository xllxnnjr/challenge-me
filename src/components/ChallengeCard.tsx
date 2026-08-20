import React from 'react';
import { Challenge, Difficulty } from '../types';

interface Props {
  challenge: Challenge;
  onSelect: (challenge: Challenge) => void;
  featured?: boolean;
  activeDifficulty?: Difficulty;
  key?: React.Key;
}

export function ChallengeCard({ challenge, onSelect, featured, activeDifficulty = 'Medium' }: Props) {
  const getCatStyle = (cat: string) => {
    switch (cat) {
      case 'Math & Logic':
        return {
          badge: 'border-amber-500/40 text-amber-300 bg-amber-950/40',
          hoverBorder: 'hover:border-amber-400/60',
          glow: 'group-hover:shadow-amber-950/30',
        };
      case 'Social & Party':
        return {
          badge: 'border-pink-500/40 text-pink-300 bg-pink-950/40',
          hoverBorder: 'hover:border-pink-400/60',
          glow: 'group-hover:shadow-pink-950/30',
        };
      case 'Memory & Focus':
        return {
          badge: 'border-purple-500/40 text-purple-300 bg-purple-950/40',
          hoverBorder: 'hover:border-purple-400/60',
          glow: 'group-hover:shadow-purple-950/30',
        };
      case 'Speed & Reflex':
        return {
          badge: 'border-cyan-500/40 text-cyan-300 bg-cyan-950/40',
          hoverBorder: 'hover:border-cyan-400/60',
          glow: 'group-hover:shadow-cyan-950/30',
        };
      default:
        return {
          badge: 'border-indigo-500/40 text-indigo-300 bg-indigo-950/40',
          hoverBorder: 'hover:border-indigo-400/60',
          glow: 'group-hover:shadow-indigo-950/30',
        };
    }
  };

  const getDifficultyPoints = (basePts: number, diff: Difficulty) => {
    if (diff === 'Easy') return Math.round(basePts * 0.75);
    if (diff === 'Hard') return Math.round(basePts * 1.5);
    return basePts;
  };

  const pts = getDifficultyPoints(challenge.pts, activeDifficulty);
  const catStyle = getCatStyle(challenge.cat);

  return (
    <div
      onClick={() => onSelect(challenge)}
      className={`group relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#121b2d] via-[#0e1526] to-[#090f1d] border border-[#23314d] ${catStyle.hoverBorder} p-4 transition-all duration-200 cursor-pointer active:scale-[0.98] shadow-lg shadow-black/40 ${catStyle.glow} flex items-start sm:items-center gap-3.5 ${
        featured ? 'ring-2 ring-amber-400/50' : ''
      }`}
    >
      {/* Icon block with smooth neon hover effect */}
      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#1b263e] to-[#121a2c] border border-[#2e4066] flex items-center justify-center text-2xl flex-shrink-0 group-hover:scale-110 group-hover:border-white/20 transition-all duration-200 shadow-md shadow-black/40 mt-0.5 sm:mt-0">
        {challenge.icon}
      </div>

      {/* Info Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap mb-1">
          <span className="font-display font-black text-white text-base truncate group-hover:text-amber-300 transition">
            {challenge.title}
          </span>
          <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase border ${catStyle.badge}`}>
            {challenge.cat}
          </span>
          {challenge.subCat && (
            <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold text-slate-300 bg-[#162138] border border-[#2c3d5f]">
              {challenge.subCat}
            </span>
          )}
        </div>
        <p className="text-xs text-[#94a3b8] line-clamp-2 leading-relaxed font-medium">
          {challenge.desc}
        </p>
      </div>

      {/* Points & Action */}
      <div className="flex items-center gap-2 flex-shrink-0 self-center">
        <div className="px-2.5 py-1.5 rounded-xl bg-gradient-to-br from-[#231846] to-[#140f29] border border-purple-500/50 text-purple-200 font-black text-xs shadow-inner shadow-black/40">
          +{pts}
        </div>
      </div>
    </div>
  );
}
