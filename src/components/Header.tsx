import { Bell } from 'lucide-react';
import { GameState } from '../types';
import { calculateLevel } from '../utils/storage';
import { AppLogo } from './AppLogo';
import { AvatarDisplay } from './AvatarDisplay';

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
    <header className="w-full mb-3.5 pt-1 sticky top-2 z-30">
      <div className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-[26px] bg-[#0c1322]/80 backdrop-blur-2xl border border-white/[0.08] shadow-[0_8px_30px_rgb(0,0,0,0.4)]">
        {/* Left: Apple ID style mini capsule */}
        <button
          id="header-profile-btn"
          type="button"
          onClick={onOpenProfile}
          title={`Profile (${state.playerName} • Level ${level})`}
          className="flex items-center gap-2.5 p-1 pr-3 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] hover:border-amber-400/50 transition-all duration-200 active:scale-95 cursor-pointer shadow-sm group"
        >
          <AvatarDisplay
            avatar={state.avatar}
            size="md"
            className="ring-1.5 ring-amber-400/70 group-hover:scale-105 transition-transform"
          />
          <div className="flex flex-col text-left leading-none">
            <span className="text-[12px] font-bold text-white tracking-tight truncate max-w-[85px] sm:max-w-[110px]">
              {state.playerName}
            </span>
            <span className="text-[10px] font-extrabold text-amber-400 mt-0.5 tracking-wide">
              LVL {level}
            </span>
          </div>
        </button>

        {/* Center: App Logo */}
        <div className="flex items-center justify-center select-none pointer-events-none transform hover:scale-105 transition-transform">
          <AppLogo size={36} />
        </div>

        {/* Right: Apple Notification Capsule */}
        <button
          id="header-notifications-btn"
          type="button"
          onClick={onOpenNotifications}
          title="Notifications & Alerts"
          className="relative w-9 h-9 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] hover:border-amber-400/50 text-slate-300 hover:text-white flex items-center justify-center transition-all duration-200 active:scale-95 cursor-pointer shadow-sm"
        >
          <Bell className="w-4 h-4 text-amber-300" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[17px] h-[17px] px-1 bg-[#ff2d55] text-white text-[9px] font-black rounded-full flex items-center justify-center border-2 border-[#0c1322] shadow-sm animate-pulse">
              {unreadCount}
            </span>
          )}
        </button>
      </div>
    </header>
  );
}
