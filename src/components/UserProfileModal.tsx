import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import {
  X,
  Swords,
  UserPlus,
  UserCheck,
  Flame,
  Trophy,
  Zap,
  Sparkles,
  Copy,
  Check,
  Shield,
  Star,
  Activity,
  Heart,
  HandMetal,
  Radio,
} from 'lucide-react';
import { LeaderboardUser } from '../data/leaderboard';
import { sound } from '../utils/audio';
import { haptics } from '../utils/haptics';

interface Props {
  user: LeaderboardUser | null;
  isOpen: boolean;
  onClose: () => void;
  onStartDuel: (user: LeaderboardUser) => void;
  onToggleFriend: (userId: string) => void;
  onToast: (msg: string) => void;
  soundEnabled: boolean;
  currentUserName?: string;
}

export function UserProfileModal({
  user,
  isOpen,
  onClose,
  onStartDuel,
  onToggleFriend,
  onToast,
  soundEnabled,
  currentUserName = 'You',
}: Props) {
  const [copied, setCopied] = useState(false);
  const [cheered, setCheered] = useState(false);

  if (!isOpen || !user) return null;

  const handleCopyCode = () => {
    if (user.friendCode) {
      navigator.clipboard.writeText(user.friendCode);
      setCopied(true);
      sound.playBonus(soundEnabled);
      haptics.light();
      onToast(`📋 Copied ${user.name}'s Friend Code!`);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSendCheer = () => {
    setCheered(true);
    sound.playBonus(soundEnabled);
    haptics.friendWave();
    try {
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#FFD700', '#FF69B4', '#00FFFF', '#7B68EE'],
      });
    } catch {}

    onToast(`👋 Sent a hype wave & cheer to ${user.name}!`);
    setTimeout(() => setCheered(false), 2500);
  };

  const isMe = user.isCurrentUser;
  const friendCode = user.friendCode || `CHALLENGE-${user.name.slice(0, 4).toUpperCase()}99`;

  // Curated specialties and achievements for realism
  const userBadges = [
    { icon: '⚡', label: 'Speed Demon', desc: 'Sub-200ms kinetic reaction' },
    { icon: '🎯', label: 'Math Wizard', desc: 'Target 24 master' },
    { icon: '🧠', label: 'Iron Memory', desc: 'Chimpanzee level 9' },
    { icon: '🕵️', label: 'Lead Detective', desc: '100% deduction accuracy' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-md bg-[#0a0e1a] border border-white/20 rounded-[32px] p-5 sm:p-6 shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        {/* Specular ambient header glow */}
        <div className="absolute top-0 inset-x-0 h-36 bg-gradient-to-b from-indigo-600/20 via-purple-600/10 to-transparent pointer-events-none" />

        {/* Top Header Close */}
        <div className="flex items-center justify-between pb-2 relative z-10">
          <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
            Player Profile Card
          </span>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/15 text-slate-300 flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-y-auto space-y-4 pt-2 flex-1 no-scrollbar relative z-10">
          {/* Main User Card Hero */}
          <div className="rounded-[26px] bg-gradient-to-b from-white/[0.08] to-white/[0.02] border border-white/10 p-5 text-center relative overflow-hidden space-y-3">
            <div className="relative inline-block mx-auto">
              <div className="w-20 h-20 sm:w-22 sm:h-22 rounded-full ring-4 ring-indigo-500/50 bg-gradient-to-br from-indigo-900 to-purple-950 flex items-center justify-center text-4xl shadow-xl">
                {user.avatar}
              </div>
              {/* Online Indicator */}
              <div
                className="absolute bottom-0 right-1 w-5 h-5 rounded-full bg-emerald-500 border-3 border-[#0a0e1a] flex items-center justify-center shadow-md"
                title="Active in app"
              >
                <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-center gap-2 flex-wrap">
                <h3 className="font-display font-black text-white text-xl sm:text-2xl">
                  {user.name}
                </h3>
                <span className="text-xs font-mono font-bold text-amber-300 bg-amber-400/15 border border-amber-400/30 px-2 py-0.5 rounded-full">
                  @{user.username || user.name.toLowerCase().replace(/\s+/g, '_')}
                </span>
                {isMe && (
                  <span className="px-2 py-0.5 rounded-full bg-pink-500 text-white text-[10px] font-black uppercase">
                    You
                  </span>
                )}
              </div>

              <div className="flex items-center justify-center gap-2 mt-1">
                <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 text-xs font-bold">
                  Level {user.level} {user.badge || 'Challenger'}
                </span>
                <span className="text-[11px] font-medium text-emerald-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  {user.statusText || 'Online Now'}
                </span>
              </div>
            </div>

            {/* Quick Stats Triple Pill */}
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/10">
              <div className="p-2 rounded-2xl bg-black/40 border border-white/5">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">
                  Score
                </span>
                <span className="text-sm sm:text-base font-black text-amber-300 font-display">
                  {user.points.toLocaleString()}
                </span>
              </div>

              <div className="p-2 rounded-2xl bg-black/40 border border-white/5">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">
                  Streak
                </span>
                <span className="text-sm sm:text-base font-black text-orange-400 font-display flex items-center justify-center gap-0.5">
                  <span>{user.streak}</span>
                  <Flame className="w-3.5 h-3.5 fill-current" />
                </span>
              </div>

              <div className="p-2 rounded-2xl bg-black/40 border border-white/5">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">
                  Domain
                </span>
                <span className="text-xs sm:text-xs font-black text-purple-300 truncate block mt-0.5">
                  {user.category || 'All Rounder'}
                </span>
              </div>
            </div>
          </div>

          {/* Friend Code Section */}
          <div className="p-3 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-between gap-3">
            <div>
              <span className="text-[10px] font-bold uppercase text-slate-400 block">
                Challenger ID Code
              </span>
              <span className="font-mono font-black text-xs sm:text-sm text-slate-200">
                {friendCode}
              </span>
            </div>

            <button
              type="button"
              onClick={handleCopyCode}
              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 text-xs font-bold flex items-center gap-1 transition active:scale-95 cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>

          {/* Special Badges & Mastered Domains */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-300 px-1 block">
              Specialist Badges & Talents
            </span>

            <div className="grid grid-cols-2 gap-2">
              {userBadges.map((b) => (
                <div
                  key={b.label}
                  className="p-2.5 rounded-2xl bg-white/[0.03] border border-white/10 flex items-start gap-2"
                >
                  <span className="text-xl p-1 rounded-xl bg-white/5">{b.icon}</span>
                  <div className="min-w-0">
                    <strong className="text-xs text-white block truncate">{b.label}</strong>
                    <span className="text-[10px] text-slate-400 line-clamp-1">{b.desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 space-y-2">
            {!isMe && (
              <button
                type="button"
                onClick={() => {
                  sound.playBonus(soundEnabled);
                  haptics.duelChallenge();
                  onClose();
                  onStartDuel(user);
                }}
                className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:brightness-110 text-white font-display font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-red-600/30 transition active:scale-95 cursor-pointer"
              >
                <Swords className="w-4 h-4" />
                <span>Launch 1-on-1 Head-to-Head Duel</span>
              </button>
            )}

            <div className="flex items-center gap-2">
              {!isMe && (
                <button
                  type="button"
                  onClick={() => {
                    onToggleFriend(user.id);
                    sound.playTap(soundEnabled);
                    haptics.selection();
                    onToast(
                      user.isFriend
                        ? `Removed ${user.name} from friends`
                        : `🎉 Added ${user.name} as friend!`
                    );
                  }}
                  className={`flex-1 py-2.5 px-3 rounded-2xl font-bold text-xs flex items-center justify-center gap-1.5 border transition active:scale-95 cursor-pointer ${
                    user.isFriend
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 hover:bg-rose-500/30'
                      : 'bg-indigo-600 text-white border-indigo-500 shadow-md hover:bg-indigo-500'
                  }`}
                >
                  {user.isFriend ? (
                    <>
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>Friend (Remove)</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Add Friend</span>
                    </>
                  )}
                </button>
              )}

              {!isMe && (
                <button
                  type="button"
                  onClick={handleSendCheer}
                  className={`py-2.5 px-4 rounded-2xl border font-bold text-xs flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer ${
                    cheered
                      ? 'bg-amber-400 text-black border-amber-400'
                      : 'bg-white/10 hover:bg-white/15 text-slate-200 border-white/15'
                  }`}
                >
                  <HandMetal className="w-3.5 h-3.5 text-amber-400" />
                  <span>{cheered ? 'Waved! 👋' : 'Wave / Cheer'}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
