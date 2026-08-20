import { Home, Target, BarChart3, User } from 'lucide-react';
import { ScreenTab } from '../types';

interface Props {
  currentTab: ScreenTab;
  onTabChange: (tab: ScreenTab) => void;
}

export function Navbar({ currentTab, onTabChange }: Props) {
  const tabs = [
    { id: 'home' as ScreenTab, label: 'Today', icon: Home },
    { id: 'challenges' as ScreenTab, label: 'Vault', icon: Target },
    { id: 'stats' as ScreenTab, label: 'Activity', icon: BarChart3 },
    { id: 'profile' as ScreenTab, label: 'Profile', icon: User },
  ];

  return (
    <nav className="fixed bottom-4 left-1/2 -translate-x-1/2 w-[calc(100%-28px)] max-w-[440px] bg-[#0c1322]/85 backdrop-blur-3xl border border-white/[0.1] rounded-[32px] p-1.5 grid grid-cols-4 z-40 shadow-[0_12px_40px_rgba(0,0,0,0.65)]">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = currentTab === tab.id;
        return (
          <button
            key={tab.id}
            id={`nav-tab-${tab.id}`}
            onClick={() => onTabChange(tab.id)}
            className={`flex flex-col items-center justify-center py-2 px-1 rounded-[24px] transition-all duration-200 relative cursor-pointer active:scale-90 ${
              isActive
                ? 'text-white bg-white/[0.12] shadow-sm font-bold'
                : 'text-[#8692a6] hover:text-slate-200 hover:bg-white/[0.04] font-medium'
            }`}
          >
            {isActive && (
              <span className="absolute top-1.5 w-1 h-1 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(255,191,0,0.8)]" />
            )}
            <Icon
              className={`w-4.5 h-4.5 mb-1 transition-transform duration-200 ${
                isActive ? 'scale-110 text-amber-400' : 'text-slate-400'
              }`}
            />
            <span className="text-[10.5px] leading-none tracking-tight font-semibold">
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
