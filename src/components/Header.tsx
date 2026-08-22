import React from 'react';
import { Bell, Sparkles, Trophy, Flame } from 'lucide-react';
import { GameState } from '../types';
import { calculateLevel } from '../utils/storage';
import { AvatarDisplay } from './AvatarDisplay';
import { haptics } from '../utils/haptics';

interface Props {
  state: GameState;
  unreadCount?: number;
  onOpenProfile: () => void;
  onOpenNotifications: () => void;
}

export function Header({
  state,
  unreadCount = 0,
  onOpenProfile,
  onOpenNotifications,
}: Props) {
  const level = calculateLevel(state.xp);

  return (
    <header className="w-full mb-3 pt-1 sticky top-1 z-30">
      <div className="w-full flex items-center justify-between px-3 sm:px-4 py-2 rounded-2xl sm:rounded-3xl bg-[#090d1a]/95 backdrop-blur-xl border border-white/10 shadow-lg shadow-black/50">
        {/* Left: Player Profile Pill */}
        <button
          id="header-profile-btn"
          type="button"
          onClick={() => {
            haptics.light();
            onOpenProfile();
          }}
          title={`Profile (${state.playerName} • Level ${level})`}
          className="flex items-center gap-2 py-1 px-1.5 pr-2.5 rounded-full bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 transition active:scale-95 cursor-pointer group"
        >
          <AvatarDisplay
            avatar={state.avatar}
            size="sm"
            className="group-hover:scale-105 transition-transform"
          />
          <div className="flex flex-col text-left leading-none">
            <span className="text-xs font-bold text-white tracking-tight truncate max-w-[80px] sm:max-w-[120px]">
              {state.playerName}
            </span>
            <span className="text-[10px] font-black text-amber-400 mt-0.5 tracking-tight">
              Lv. {level}
            </span>
          </div>
        </button>

        {/* Center: Clean Minimal Brand Header */}
        <div className="flex items-center gap-1.5 select-none pointer-events-none">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-amber-400 to-rose-500 flex items-center justify-center text-slate-950 font-black shadow-sm">
            <Sparkles className="w-3.5 h-3.5 fill-slate-950" />
          </div>
          <span className="font-display font-black text-xs sm:text-sm tracking-wider text-white uppercase">
            CHALLENGE<span className="text-amber-400">ME</span>
          </span>
        </div>

        {/* Right: Notifications Capsule */}
        <button
          id="header-notifications-btn"
          type="button"
          onClick={() => {
            haptics.light();
            onOpenNotifications();
          }}
          title="Notifications & Alerts"
          className="relative w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-slate-300 hover:text-white flex items-center justify-center transition active:scale-90 cursor-pointer"
        >
          <Bell className="w-4 h-4 text-amber-300" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[16px] h-[16px] px-1 bg-gradient-to-r from-rose-500 to-pink-500 text-white text-[9px] font-black rounded-full flex items-center justify-center border border-[#090d1a] shadow-sm animate-pulse">
              {unreadCount}
            </span>
          )}
        </button>
      </div>
    </header>
  );
}
