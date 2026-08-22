import React, { useState, useMemo } from 'react';
import {
  UserPlus,
  X,
  Search,
  Copy,
  Check,
  Users,
  Sparkles,
  UserCheck,
  UserX,
  Swords,
  Flame,
  AtSign,
  Clock,
  CheckCircle2,
  XCircle,
  Eye,
  Send,
} from 'lucide-react';
import { LeaderboardUser } from '../data/leaderboard';
import { sound } from '../utils/audio';
import { haptics } from '../utils/haptics';
import { formatUsername } from '../utils/username';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  users: LeaderboardUser[];
  onToggleFriend: (userId: string) => void;
  myFriendCode?: string;
  myUsername?: string;
  incomingRequests?: string[]; // IDs of users who sent requests
  outgoingRequests?: string[]; // IDs of users we sent requests to
  onAcceptRequest?: (userId: string) => void;
  onDeclineRequest?: (userId: string) => void;
  onSendRequest?: (userId: string) => void;
  onCancelRequest?: (userId: string) => void;
  onToast: (msg: string) => void;
  soundEnabled: boolean;
  onViewProfile?: (user: LeaderboardUser) => void;
  onStartDuel?: (user: LeaderboardUser) => void;
}

type FriendTab = 'requests' | 'discover' | 'friends';

const DEFAULT_INCOMING: string[] = ['user_7', 'user_10'];
const DEFAULT_OUTGOING: string[] = [];

export function FriendModal({
  isOpen,
  onClose,
  users,
  onToggleFriend,
  myFriendCode = 'CHALLENGE-ME88',
  myUsername = 'challenger_1',
  incomingRequests = DEFAULT_INCOMING,
  outgoingRequests = DEFAULT_OUTGOING,
  onAcceptRequest,
  onDeclineRequest,
  onSendRequest,
  onCancelRequest,
  onToast,
  soundEnabled,
  onViewProfile,
  onStartDuel,
}: Props) {
  const [searchQuery, setSearchQuery] = useState('');
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<FriendTab>(() => (incomingRequests.length > 0 ? 'requests' : 'discover'));

  // Local state fallbacks if callbacks are not provided
  const [localIncoming, setLocalIncoming] = useState<string[]>(incomingRequests);
  const [localOutgoing, setLocalOutgoing] = useState<string[]>(outgoingRequests);

  // Sync incoming requests safely without infinite loops
  React.useEffect(() => {
    if (incomingRequests && incomingRequests.length > 0) {
      setLocalIncoming((prev) => {
        if (prev.length === incomingRequests.length && prev.every((v, i) => v === incomingRequests[i])) {
          return prev;
        }
        return incomingRequests;
      });
    }
  }, [incomingRequests]);

  React.useEffect(() => {
    if (outgoingRequests) {
      setLocalOutgoing((prev) => {
        if (prev.length === outgoingRequests.length && prev.every((v, i) => v === outgoingRequests[i])) {
          return prev;
        }
        return outgoingRequests;
      });
    }
  }, [outgoingRequests]);

  if (!isOpen) return null;

  const friendsList = users.filter((u) => u.isFriend && !u.isCurrentUser);
  const nonFriendsList = users.filter((u) => !u.isFriend && !u.isCurrentUser);

  const incomingUsers = users.filter((u) => localIncoming.includes(u.id));

  // Search filter
  const cleanSearch = searchQuery.trim().toLowerCase().replace(/^@+/, '');

  const filteredDiscover = nonFriendsList.filter((u) => {
    if (!cleanSearch) return true;
    return (
      u.name.toLowerCase().includes(cleanSearch) ||
      u.username?.toLowerCase().includes(cleanSearch) ||
      u.category?.toLowerCase().includes(cleanSearch) ||
      u.friendCode?.toLowerCase().includes(cleanSearch)
    );
  });

  const filteredFriends = friendsList.filter((u) => {
    if (!cleanSearch) return true;
    return (
      u.name.toLowerCase().includes(cleanSearch) ||
      u.username?.toLowerCase().includes(cleanSearch) ||
      u.category?.toLowerCase().includes(cleanSearch)
    );
  });

  const handleCopyCode = () => {
    navigator.clipboard.writeText(`@${myUsername}`);
    setCopied(true);
    sound.playBonus(soundEnabled);
    haptics.light();
    onToast(`Copied @${myUsername} to clipboard! 📋`);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendFriendRequest = (user: LeaderboardUser) => {
    if (onSendRequest) {
      onSendRequest(user.id);
    } else {
      setLocalOutgoing((prev) => [...prev, user.id]);
    }
    sound.playBonus(soundEnabled);
    haptics.success();
    onToast(`✉️ Sent friend request to @${user.username || user.name}!`);
  };

  const handleCancelFriendRequest = (user: LeaderboardUser) => {
    if (onCancelRequest) {
      onCancelRequest(user.id);
    } else {
      setLocalOutgoing((prev) => prev.filter((id) => id !== user.id));
    }
    haptics.light();
    onToast(`Cancelled request to @${user.username || user.name}`);
  };

  const handleAccept = (user: LeaderboardUser) => {
    if (onAcceptRequest) {
      onAcceptRequest(user.id);
    } else {
      setLocalIncoming((prev) => prev.filter((id) => id !== user.id));
      onToggleFriend(user.id);
    }
    sound.playSuccess(soundEnabled);
    haptics.celebration();
    onToast(`🎉 You and @${user.username || user.name} are now friends!`);
  };

  const handleDecline = (user: LeaderboardUser) => {
    if (onDeclineRequest) {
      onDeclineRequest(user.id);
    } else {
      setLocalIncoming((prev) => prev.filter((id) => id !== user.id));
    }
    haptics.light();
    onToast(`Declined request from @${user.username || user.name}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg bg-[#0a0e1a] border border-white/15 rounded-[32px] p-5 sm:p-6 shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/15 border border-indigo-400/30 flex items-center justify-center text-indigo-400">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-black text-white text-base sm:text-lg">
                Friends & Player Search
              </h3>
              <p className="text-xs text-slate-400">
                Look up challengers by username & manage requests
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/15 text-slate-300 flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Share Handle Card */}
        <div className="mt-3 p-3 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <span className="text-[10px] font-black uppercase text-amber-400 tracking-wider block">
              Your Public Username
            </span>
            <span className="font-mono font-black text-white text-sm truncate block">
              {formatUsername(myUsername)}
            </span>
          </div>

          <button
            type="button"
            onClick={handleCopyCode}
            className="px-3.5 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs flex items-center gap-1.5 transition active:scale-95 cursor-pointer shadow"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy Handle'}</span>
          </button>
        </div>

        {/* Search Input Bar (Indexed search by username or name) */}
        <div className="mt-3 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by @username or player name..."
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-black/40 border border-white/15 text-white placeholder-slate-500 text-xs sm:text-sm font-medium focus:outline-none focus:border-amber-400 transition"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
            >
              Clear
            </button>
          )}
        </div>

        {/* Nav Tabs */}
        <div className="grid grid-cols-3 p-1 mt-3 bg-white/[0.04] border border-white/10 rounded-2xl gap-1">
          <button
            type="button"
            onClick={() => {
              setActiveTab('requests');
              haptics.selection();
            }}
            className={`py-2 px-2 rounded-xl text-xs font-bold transition-all relative cursor-pointer ${
              activeTab === 'requests'
                ? 'bg-amber-400 text-slate-950 font-black shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>Requests</span>
            {localIncoming.length > 0 && (
              <span className="ml-1.5 px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px] font-black">
                {localIncoming.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('discover');
              haptics.selection();
            }}
            className={`py-2 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'discover'
                ? 'bg-amber-400 text-slate-950 font-black shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>Discover & Add</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('friends');
              haptics.selection();
            }}
            className={`py-2 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'friends'
                ? 'bg-amber-400 text-slate-950 font-black shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>Friends ({friendsList.length})</span>
          </button>
        </div>

        {/* Tab Body Contents */}
        <div className="overflow-y-auto space-y-2.5 pt-3 flex-1 no-scrollbar relative z-10">
          {/* TAB 1: INCOMING FRIEND REQUESTS */}
          {activeTab === 'requests' && (
            <div className="space-y-2">
              {incomingUsers.length === 0 ? (
                <div className="text-center py-8 space-y-2">
                  <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 mx-auto text-xl">
                    📬
                  </div>
                  <p className="text-sm font-bold text-white">No pending friend requests</p>
                  <p className="text-xs text-slate-400">
                    Share your handle <span className="text-amber-300 font-mono">@{myUsername}</span> with friends!
                  </p>
                </div>
              ) : (
                incomingUsers.map((user) => (
                  <div
                    key={user.id}
                    className="p-3.5 rounded-2xl bg-gradient-to-r from-indigo-950/40 via-purple-950/20 to-black/40 border border-indigo-400/30 flex items-center justify-between gap-3 shadow-md"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-11 h-11 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center text-2xl shrink-0 shadow-inner">
                        {user.avatar}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <strong className="text-xs sm:text-sm font-bold text-white truncate block">
                            {user.name}
                          </strong>
                          <span className="text-[10px] text-amber-300 font-mono font-bold">
                            {formatUsername(user.username)}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-400 block truncate">
                          Level {user.level} • {user.category || 'Challenger'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleAccept(user)}
                        className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs flex items-center gap-1 transition active:scale-95 cursor-pointer shadow"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Accept</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDecline(user)}
                        className="px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-red-500/20 hover:text-red-300 text-slate-400 font-bold text-xs transition cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 2: DISCOVER & LOOKUP USERS */}
          {activeTab === 'discover' && (
            <div className="space-y-2">
              {filteredDiscover.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">
                  No challengers found matching "{searchQuery}"
                </div>
              ) : (
                filteredDiscover.map((user) => {
                  const isPending = localOutgoing.includes(user.id);

                  return (
                    <div
                      key={user.id}
                      className="p-3 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 transition-all flex items-center justify-between gap-3"
                    >
                      <div
                        onClick={() => onViewProfile?.(user)}
                        className="flex items-center gap-3 min-w-0 cursor-pointer group flex-1"
                      >
                        <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center text-xl shrink-0 group-hover:scale-105 transition-transform">
                          {user.avatar}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <strong className="text-xs sm:text-sm font-bold text-white truncate block group-hover:text-amber-300 transition-colors">
                              {user.name}
                            </strong>
                            <span className="text-[11px] font-mono text-amber-400 font-bold">
                              {formatUsername(user.username)}
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-400 block truncate">
                            Level {user.level} • {user.badge || 'Challenger'}
                          </span>
                        </div>
                      </div>

                      <div className="shrink-0 flex items-center gap-1.5">
                        {isPending ? (
                          <button
                            type="button"
                            onClick={() => handleCancelFriendRequest(user)}
                            className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-red-500/20 hover:text-red-300 text-amber-300 font-bold text-xs flex items-center gap-1 transition cursor-pointer"
                          >
                            <Clock className="w-3 h-3" />
                            <span>Requested</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleSendFriendRequest(user)}
                            className="px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs flex items-center gap-1 transition active:scale-95 cursor-pointer shadow"
                          >
                            <UserPlus className="w-3.5 h-3.5" />
                            <span>Add</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* TAB 3: MY FRIENDS LIST */}
          {activeTab === 'friends' && (
            <div className="space-y-2">
              {filteredFriends.length === 0 ? (
                <div className="text-center py-8 space-y-2">
                  <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 mx-auto text-xl">
                    👥
                  </div>
                  <p className="text-sm font-bold text-white">No friends found</p>
                  <p className="text-xs text-slate-400">
                    Search for players in the Discover tab to connect!
                  </p>
                </div>
              ) : (
                filteredFriends.map((user) => (
                  <div
                    key={user.id}
                    className="p-3 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 transition-all flex items-center justify-between gap-3"
                  >
                    <div
                      onClick={() => onViewProfile?.(user)}
                      className="flex items-center gap-3 min-w-0 cursor-pointer group flex-1"
                    >
                      <div className="relative shrink-0">
                        <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center text-xl group-hover:scale-105 transition-transform">
                          {user.avatar}
                        </div>
                        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-[#0a0e1a]" />
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <strong className="text-xs sm:text-sm font-bold text-white truncate block group-hover:text-amber-300 transition-colors">
                            {user.name}
                          </strong>
                          <span className="text-[11px] font-mono text-amber-400 font-bold">
                            {formatUsername(user.username)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-slate-400">
                          <span>Level {user.level}</span>
                          <span>•</span>
                          <span className="text-emerald-400 font-medium">Online</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {onStartDuel && (
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            onStartDuel(user);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1 transition active:scale-95 cursor-pointer shadow"
                        >
                          <Swords className="w-3.5 h-3.5" />
                          <span>Duel</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          onToggleFriend(user.id);
                          sound.playBonus(soundEnabled);
                          onToast(`Removed @${user.username || user.name} from friends`);
                        }}
                        title="Remove Friend"
                        className="w-8 h-8 rounded-xl bg-white/5 hover:bg-red-500/20 hover:text-red-400 text-slate-400 flex items-center justify-center transition cursor-pointer"
                      >
                        <UserX className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
