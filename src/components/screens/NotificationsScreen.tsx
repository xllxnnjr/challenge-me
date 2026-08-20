import { Bell, CheckCheck, Trash2, ArrowRight, Flame, Trophy, Sparkles, AlertTriangle } from 'lucide-react';
import { AppNotification } from '../../types';

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
      case 'system':
        return <AlertTriangle className="w-4 h-4 text-rose-400" />;
      default:
        return <Bell className="w-4 h-4 text-purple-400" />;
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-300 pb-8">
      {/* Screen Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-display font-black text-white flex items-center gap-2">
            <span>Notifications</span>
            {unreadCount > 0 && (
              <span className="text-xs bg-pink-950 border border-pink-700 text-pink-300 px-2 py-0.5 rounded-full font-bold">
                {unreadCount} new
              </span>
            )}
          </h2>
          <span className="text-xs text-[#9ca7bd]">
            Stay updated with streaks, achievements, and quest drops
          </span>
        </div>

        <button
          onClick={onBackToHome}
          className="text-xs font-bold text-purple-400 hover:text-purple-300 bg-[#121b2e] px-3 py-1.5 rounded-xl border border-[#263149] transition cursor-pointer"
        >
          ← Back
        </button>
      </div>

      {/* Action Toolbar */}
      {notifications.length > 0 && (
        <div className="flex items-center justify-between px-1 text-xs">
          <button
            onClick={onMarkAllRead}
            disabled={unreadCount === 0}
            className="flex items-center gap-1 text-slate-300 hover:text-white disabled:opacity-40 transition cursor-pointer"
          >
            <CheckCheck className="w-3.5 h-3.5 text-purple-400" />
            <span>Mark all as read</span>
          </button>

          <button
            onClick={onClearAll}
            className="flex items-center gap-1 text-rose-400 hover:text-rose-300 transition cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear all</span>
          </button>
        </div>
      )}

      {/* Notifications List */}
      <div className="space-y-2.5">
        {notifications.length > 0 ? (
          notifications.map((notif) => (
            <div
              key={notif.id}
              onClick={() => onNotificationClick(notif)}
              className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-3.5 active:scale-[0.99] shadow-md ${
                notif.read
                  ? 'bg-[#0e1627]/80 border-[#222e47] opacity-75'
                  : 'bg-gradient-to-br from-[#151f38] to-[#10182b] border-purple-500/40 shadow-purple-950/20 ring-1 ring-purple-500/20'
              }`}
            >
              <div className="w-10 h-10 rounded-xl bg-[#1a253e] border border-[#2d3e62] flex items-center justify-center text-xl flex-shrink-0">
                {notif.icon || getIcon(notif.type)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h4 className={`text-sm font-extrabold truncate ${notif.read ? 'text-slate-200' : 'text-white'}`}>
                    {notif.title}
                  </h4>
                  <span className="text-[10px] text-slate-400 font-medium whitespace-nowrap ml-2">
                    {notif.time}
                  </span>
                </div>
                <p className="text-xs text-[#9ca7bd] leading-relaxed">
                  {notif.desc}
                </p>
              </div>

              {!notif.read && (
                <div className="w-2 h-2 rounded-full bg-pink-500 flex-shrink-0 mt-1.5 shadow-sm" />
              )}
            </div>
          ))
        ) : (
          <div className="rounded-2xl bg-[#0e1627] border border-[#263149] p-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-[#141e33] border border-[#263149] flex items-center justify-center mx-auto text-2xl text-slate-500">
              🔕
            </div>
            <h4 className="text-white font-extrabold text-sm">No Notifications Yet</h4>
            <p className="text-xs text-[#9ca7bd] max-w-xs mx-auto leading-relaxed">
              You are all caught up! Complete quests, claim daily login bonuses, and earn trophies to see updates here.
            </p>
            <button
              onClick={onBackToHome}
              className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-orange-500 via-pink-500 to-purple-600 rounded-xl text-white font-bold text-xs shadow-md transition active:scale-95 cursor-pointer"
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
