import { Bell, CheckCheck, Trash2, ArrowRight, Flame, Trophy, Sparkles, AlertTriangle, Users, Waves } from 'lucide-react';
import { AppNotification } from '../../types';
import { haptics } from '../../utils/haptics';

interface Props {
  notifications: AppNotification[];
  onMarkAllRead: () => void;
  onClearAll: () => void;
  onNotificationClick: (notif: AppNotification) => void;
  onBackToHome: () => void;
}

export function NotificationsScreen({
  notifications,
  onMarkAllRead,
  onClearAll,
  onNotificationClick,
  onBackToHome,
}: Props) {
  const unreadCount = notifications.filter(n => !n.read).length;

  const getIcon = (type: AppNotification['type']) => {
    switch (type) {
      case 'streak':
        return <Flame className="w-4 h-4 text-orange-400" />;
      case 'achievement':
        return <Trophy className="w-4 h-4 text-amber-400" />;
      case 'reward':
        return <Sparkles className="w-4 h-4 text-pink-400" />;
      case 'friend_active':
        return <Users className="w-4 h-4 text-emerald-400" />;
      case 'friend_wave':
        return <Waves className="w-4 h-4 text-cyan-400" />;
      case 'system':
        return <AlertTriangle className="w-4 h-4 text-rose-400" />;
      default:
        return <Bell className="w-4 h-4 text-indigo-400" />;
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-300 pb-8">
      {/* Screen Header */}
      <div className="flex items-center justify-between pt-1">
        <div>
          <h2 className="text-2xl sm:text-3xl font-display font-black text-white flex items-center gap-2">
            <span>Notification Center</span>
            {unreadCount > 0 && (
              <span className="text-xs bg-pink-500/20 border border-pink-500/30 text-pink-300 px-2.5 py-0.5 rounded-full font-bold">
                {unreadCount} new
              </span>
            )}
          </h2>
          <span className="text-xs text-[#9ca7bd]">
            Streaks, achievements, and quest rewards
          </span>
        </div>

        <button
          onClick={() => {
            haptics.light();
            onBackToHome();
          }}
          className="text-xs font-bold text-slate-300 hover:text-white bg-white/10 hover:bg-white/15 px-3.5 py-1.5 rounded-full border border-white/10 transition cursor-pointer"
        >
          Done
        </button>
      </div>

      {/* Action Toolbar */}
      {notifications.length > 0 && (
        <div className="flex items-center justify-between px-1 text-xs">
          <button
            onClick={() => {
              haptics.light();
              onMarkAllRead();
            }}
            disabled={unreadCount === 0}
            className="flex items-center gap-1 text-slate-300 hover:text-white disabled:opacity-40 transition cursor-pointer"
          >
            <CheckCheck className="w-3.5 h-3.5 text-purple-400" />
            <span>Mark all as read</span>
          </button>

          <button
            onClick={() => {
              haptics.light();
              onClearAll();
            }}
            className="flex items-center gap-1 text-rose-400 hover:text-rose-300 transition cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear all</span>
          </button>
        </div>
      )}

      {/* Notifications List (Apple iOS Stacked Cards) */}
      <div className="space-y-2.5">
        {notifications.length > 0 ? (
          notifications.map((notif) => (
            <div
              key={notif.id}
              onClick={() => {
                haptics.selection();
                onNotificationClick(notif);
              }}
              className={`p-4 rounded-[22px] border transition-all cursor-pointer flex items-start gap-3.5 active:scale-[0.98] shadow-sm backdrop-blur-xl ${
                notif.read
                  ? 'bg-white/[0.03] border-white/5 opacity-75'
                  : 'bg-white/[0.08] border-white/20 shadow-md ring-1 ring-white/10'
              }`}
            >
              <div className="w-10 h-10 rounded-[16px] bg-white/10 border border-white/15 flex items-center justify-center text-xl flex-shrink-0">
                {notif.icon || getIcon(notif.type)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <h4 className={`text-sm font-bold truncate ${notif.read ? 'text-slate-200' : 'text-white'}`}>
                    {notif.title}
                  </h4>
                  <span className="text-[10px] text-slate-400 font-medium whitespace-nowrap ml-2">
                    {notif.time}
                  </span>
                </div>
                <p className="text-xs text-[#9ca7bd] leading-relaxed font-normal">
                  {notif.desc}
                </p>
              </div>

              {!notif.read && (
                <div className="w-2 h-2 rounded-full bg-pink-500 flex-shrink-0 mt-1.5 shadow-[0_0_8px_rgba(236,72,153,0.8)]" />
              )}
            </div>
          ))
        ) : (
          <div className="rounded-[28px] bg-white/[0.02] border border-white/10 p-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-[18px] bg-white/[0.05] border border-white/10 flex items-center justify-center mx-auto text-2xl text-slate-400">
              🔕
            </div>
            <h4 className="text-white font-bold text-sm">No Notifications</h4>
            <p className="text-xs text-[#9ca7bd] max-w-xs mx-auto leading-relaxed font-normal">
              You are all caught up! Complete quests, claim daily login bonuses, and earn trophies to see updates here.
            </p>
            <button
              onClick={() => {
                haptics.light();
                onBackToHome();
              }}
              className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 bg-white/10 hover:bg-white/15 border border-white/15 rounded-full text-white font-bold text-xs shadow-md transition active:scale-95 cursor-pointer"
            >
              <span>Explore Challenges</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
