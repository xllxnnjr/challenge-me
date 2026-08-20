import { Bell, Sparkles } from 'lucide-react';
import { GameState } from '../types';
import { calculateLevel } from '../utils/storage';
import { AppLogo } from './AppLogo';
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
      <div className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-[24px] bg-[#0c1322]/85 backdrop-blur-2xl border border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.5)]">
        {/* Left: Interactive Profile Capsule (Apple ID style) */}
        <button
          id="header-profile-btn"
          type="button"
          onClick={() => {
            haptics.light();
            onOpenProfile();
          }}
          title={`Profile (${state.playerName} • Level ${level})`}
          className="flex items-center gap-2 p-1 pr-2.5 rounded-full bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 hover:border-amber-400/50 transition-all duration-200 active:scale-95 cursor-pointer shadow-sm group"
        >
          <AvatarDisplay
            avatar={state.avatar}
            size="md"
            className="group-hover:scale-105 transition-transform duration-200"
          />
          <div className="flex flex-col text-left leading-none">
            <span className="text-xs font-bold text-white tracking-tight truncate max-w-[85px] sm:max-w-[110px]">
              {state.playerName}
            </span>
            <span className="text-[10px] font-black text-amber-400 mt-0.5 tracking-tight flex items-center gap-0.5">
              <span>Lvl {level}</span>
            </span>
          </div>
        </button>

        {/* Center: Standalone Clean App Logo */}
        <div className="flex items-center justify-center select-none pointer-events-none transform transition hover:scale-105">
          <AppLogo size={36} />
        </div>

        {/* Right: Notifications Capsule with Unread Indicator */}
        <button
          id="header-notifications-btn"
          type="button"
          onClick={() => {
            haptics.light();
            onOpenNotifications();
          }}
          title="Notifications & Alerts"
          className="relative w-9 h-9 rounded-full bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 hover:border-amber-400/50 text-slate-300 hover:text-white flex items-center justify-center transition-all duration-200 active:scale-90 cursor-pointer shadow-sm"
        >
          <Bell className="w-4 h-4 text-amber-300" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-gradient-to-r from-pink-500 to-rose-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-[#0c1322] shadow-sm animate-pulse">
              {unreadCount}
            </span>
          )}
        </button>
      </div>
    </header>
  );
}
