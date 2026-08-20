import { Home, Target, BarChart3, User } from 'lucide-react';
import { ScreenTab } from '../types';
import { haptics } from '../utils/haptics';

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
    <nav className="fixed bottom-3.5 left-1/2 -translate-x-1/2 w-[calc(100%-24px)] max-w-[480px] bg-[#0c1322]/85 backdrop-blur-2xl border border-white/10 rounded-[28px] p-1.5 grid grid-cols-4 z-40 shadow-[0_12px_40px_rgba(0,0,0,0.65)]">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = currentTab === tab.id;
        return (
          <button
            key={tab.id}
            id={`nav-tab-${tab.id}`}
            onClick={() => {
              haptics.selection();
              onTabChange(tab.id);
            }}
            className={`flex flex-col items-center justify-center py-2 px-1 rounded-[20px] transition-all duration-200 relative cursor-pointer active:scale-90 ${
              isActive
                ? 'text-white bg-gradient-to-b from-white/15 to-white/5 border border-white/15 shadow-md shadow-black/40 font-bold'
                : 'text-[#828fa6] hover:text-slate-200 hover:bg-white/[0.04] font-medium'
            }`}
          >
            {isActive && (
              <span className="absolute top-1.5 w-1 h-1 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]" />
            )}
            <Icon
              className={`w-5 h-5 mb-1 transition-transform duration-200 ${
                isActive ? 'scale-110 text-amber-400' : 'text-slate-400'
              }`}
            />
            <span className="text-[11px] leading-none tracking-tight">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
