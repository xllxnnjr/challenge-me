import React, { useState, useMemo } from 'react';
import {
  Trophy,
  Flame,
  Sparkles,
  Share2,
  Medal,
  Crown,
  Zap,
  TrendingUp,
  Search,
  UserPlus,
  Swords,
  Users,
  Eye,
  Award,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { GameState, Difficulty } from '../../types';
import { INITIAL_LEADERBOARD_USERS, LeaderboardUser } from '../../data/leaderboard';
import { calculateLevel } from '../../utils/storage';
import { sound } from '../../utils/audio';
import { haptics } from '../../utils/haptics';
import { AvatarDisplay } from '../AvatarDisplay';
import { FriendModal } from '../FriendModal';
import { DuelModal } from '../DuelModal';
import { UserProfileModal } from '../UserProfileModal';

interface Props {
  state: GameState;
  onToast: (msg: string) => void;
  onStartChallenge?: () => void;
  onReward?: (points: number, message: string) => void;
  onPenalty?: (amount?: number, reason?: string) => void;
  currentDifficulty?: Difficulty;
}

type Timeframe = 'all' | 'week' | 'today';
type LeaderboardScope = 'global' | 'friends';

export function LeaderboardScreen({
  state,
  onToast,
  onReward = () => {},
  onPenalty = () => {},
  currentDifficulty = 'Medium',
}: Props) {
  const [scope, setScope] = useState<LeaderboardScope>('global');
  const [timeframe, setTimeframe] = useState<Timeframe>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [friendModalOpen, setFriendModalOpen] = useState(false);
  const [duelTarget, setDuelTarget] = useState<LeaderboardUser | null>(null);
  const [selectedProfileUser, setSelectedProfileUser] = useState<LeaderboardUser | null>(null);

  // Friends set
  const [friendsSet, setFriendsSet] = useState<Set<string>>(() => {
    const initialFriends = new Set(
      INITIAL_LEADERBOARD_USERS.filter((u) => u.isFriend).map((u) => u.id)
    );
    if (state.friendIds) {
      state.friendIds.forEach((id) => initialFriends.add(id));
    }
    return initialFriends;
  });

  const handleToggleFriend = (userId: string) => {
    setFriendsSet((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) {
        next.delete(userId);
      } else {
        next.add(userId);
      }
      return next;
    });
  };

  const currentLevel = calculateLevel(state.xp);

  // 1. Calculate overall global rank for EVERY user in the global ladder
  const globalLadder: (LeaderboardUser & { overallRank: number })[] = useMemo(() => {
    const me: LeaderboardUser = {
      id: 'current_user_me',
      name: state.playerName,
      username: state.username || 'challenger_1',
      avatar: state.avatar,
      points: state.points,
      xp: state.xp,
      streak: state.streak,
      level: currentLevel,
      isCurrentUser: true,
      isFriend: false,
      badge: currentLevel >= 10 ? 'Grandmaster' : currentLevel >= 5 ? 'Rising Star' : 'Challenger',
      category: 'All Rounder',
      statusText: 'Active Now 🟢',
      friendCode: 'CHALLENGE-ME88',
    };

    const adjustedList = INITIAL_LEADERBOARD_USERS.map((u) => {
      let multiplier = 1;
      if (timeframe === 'week') multiplier = 0.55;
      if (timeframe === 'today') multiplier = 0.25;

      return {
        ...u,
        isFriend: friendsSet.has(u.id),
        points: Math.round(u.points * multiplier),
      };
    });

    const userAdjustedMe = {
      ...me,
      points: timeframe === 'all' ? me.points : Math.round(me.points * (timeframe === 'week' ? 0.7 : 0.4)),
    };

    const combined = [...adjustedList, userAdjustedMe].sort((a, b) => b.points - a.points);

    return combined.map((u, index) => ({
      ...u,
      overallRank: index + 1,
    }));
  }, [state.playerName, state.username, state.avatar, state.points, state.xp, state.streak, currentLevel, timeframe, friendsSet]);

  // 2. Filter displayed users based on scope ('global' vs 'friends')
  // In the 'friends' tab, show each friend with their actual position in the overall rankings!
  const displayedUsers = useMemo(() => {
    let list = globalLadder;
    if (scope === 'friends') {
      list = globalLadder.filter((u) => u.isFriend || u.isCurrentUser);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().replace(/^@+/, '');
      list = list.filter(
        (u) =>
          u.name.toLowerCase().includes(q) ||
          u.username?.toLowerCase().includes(q) ||
          u.category?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [globalLadder, scope, searchQuery]);

  const top1 = globalLadder[0];
  const top2 = globalLadder[1];
  const top3 = globalLadder[2];

  const myLeaderboardEntry = globalLadder.find((u) => u.isCurrentUser);

  const handleShareRank = () => {
    haptics.heavy();
    sound.playSuccess(state.soundEnabled);
    try {
      confetti({
        particleCount: 50,
        spread: 70,
        origin: { y: 0.3 },
        colors: ['#FFD700', '#FFA500', '#FF4500', '#FF1493'],
      });
    } catch {}

    if (navigator.share) {
      navigator
        .share({
          title: 'My Challenge Me Rank',
          text: `🏆 I am currently Rank #${myLeaderboardEntry?.overallRank || 1} with ${state.points} points on Challenge Me! Can you beat me?`,
        })
        .catch(() => {});
    } else {
      onToast(`Copied Rank #${myLeaderboardEntry?.overallRank || 1} to clipboard!`);
    }
  };

  return (
    <div className="space-y-4 pb-12 animate-in fade-in duration-300">
      {/* 1. Header & Friends Button */}
      <div className="flex items-center justify-between gap-3 pt-1">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-black text-white tracking-tight flex items-center gap-2">
            <Trophy className="w-6 h-6 text-amber-400" />
            <span>Rankings</span>
          </h1>
          <p className="text-xs text-slate-400">
            Compete globally & duel friends for 100 PTS wagers
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            haptics.selection();
            setFriendModalOpen(true);
          }}
          className="px-3.5 py-1.5 rounded-full bg-indigo-600/30 hover:bg-indigo-600/45 border border-indigo-400/40 text-indigo-300 text-xs font-bold flex items-center gap-1.5 transition active:scale-95 cursor-pointer shadow-sm"
        >
          <Users className="w-3.5 h-3.5" />
          <span>Friends ({friendsSet.size})</span>
        </button>
      </div>

      {/* 2. Scope Selector: Global vs Friends */}
      <div className="grid grid-cols-2 p-1 bg-[#0c1322]/90 border border-white/10 rounded-full">
        <button
          type="button"
          onClick={() => {
            haptics.selection();
            setScope('global');
          }}
          className={`py-2 px-4 rounded-full text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            scope === 'global'
              ? 'bg-white text-slate-900 shadow font-black'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Trophy className="w-3.5 h-3.5 text-amber-400" />
          <span>Global Leaderboard</span>
        </button>

        <button
          type="button"
          onClick={() => {
            haptics.selection();
            setScope('friends');
          }}
          className={`py-2 px-4 rounded-full text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            scope === 'friends'
              ? 'bg-white text-slate-900 shadow font-black'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Users className="w-3.5 h-3.5 text-indigo-400" />
          <span>Friends in Overall Rank</span>
        </button>
      </div>

      {/* 3. My Standing Sticky Card */}
      {myLeaderboardEntry && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/20 via-orange-500/15 to-[#0c1322] border border-amber-400/40 flex items-center justify-between gap-3 shadow-md">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-amber-400 text-slate-950 font-black text-base flex items-center justify-center shrink-0 shadow-md">
              #{myLeaderboardEntry.overallRank}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-display font-black text-white text-sm truncate">
                  {state.playerName} (You)
                </span>
                <span className="px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[9px] font-black uppercase">
                  Rank #{myLeaderboardEntry.overallRank} Overall
                </span>
              </div>
              <span className="text-[11px] text-slate-300 font-medium block mt-0.5">
                {state.points.toLocaleString()} Points • {state.streak}-day streak
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleShareRank}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-amber-300 transition active:scale-95 cursor-pointer shrink-0"
            title="Share Your Rank"
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 4. Top 3 Podium (Shown in Global Mode) */}
      {scope === 'global' && !searchQuery && (
        <div className="grid grid-cols-3 gap-2 pt-2 items-end">
          {/* 2nd Place */}
          {top2 && (
            <div
              onClick={() => setSelectedProfileUser(top2)}
              className="p-3 rounded-2xl bg-[#0c1322]/80 border border-slate-400/30 text-center space-y-1.5 transition hover:scale-105 cursor-pointer"
            >
              <span className="text-lg">🥈</span>
              <div className="w-11 h-11 rounded-full bg-slate-700/50 mx-auto flex items-center justify-center text-xl shadow">
                {top2.avatar}
              </div>
              <strong className="text-xs text-white block truncate">{top2.name}</strong>
              <span className="text-[10px] text-slate-400 font-bold block">
                {top2.points.toLocaleString()} pts
              </span>
              <span className="text-[9px] text-slate-400 block">Rank #2</span>
            </div>
          )}

          {/* 1st Place */}
          {top1 && (
            <div
              onClick={() => setSelectedProfileUser(top1)}
              className="p-3.5 rounded-2xl bg-gradient-to-b from-amber-500/20 to-[#0c1322] border border-amber-400/60 text-center space-y-1.5 transition hover:scale-105 cursor-pointer shadow-lg -translate-y-2"
            >
              <Crown className="w-5 h-5 text-amber-400 mx-auto" />
              <div className="w-13 h-13 rounded-full ring-2 ring-amber-400 bg-amber-950/60 mx-auto flex items-center justify-center text-2xl shadow">
                {top1.avatar}
              </div>
              <strong className="text-xs font-black text-amber-300 block truncate">{top1.name}</strong>
              <span className="text-[11px] text-amber-400 font-black block">
                {top1.points.toLocaleString()} pts
              </span>
              <span className="text-[9px] text-amber-300/80 font-bold block">Rank #1 World</span>
            </div>
          )}

          {/* 3rd Place */}
          {top3 && (
            <div
              onClick={() => setSelectedProfileUser(top3)}
              className="p-3 rounded-2xl bg-[#0c1322]/80 border border-amber-700/30 text-center space-y-1.5 transition hover:scale-105 cursor-pointer"
            >
              <span className="text-lg">🥉</span>
              <div className="w-11 h-11 rounded-full bg-amber-900/40 mx-auto flex items-center justify-center text-xl shadow">
                {top3.avatar}
              </div>
              <strong className="text-xs text-white block truncate">{top3.name}</strong>
              <span className="text-[10px] text-slate-400 font-bold block">
                {top3.points.toLocaleString()} pts
              </span>
              <span className="text-[9px] text-slate-400 block">Rank #3</span>
            </div>
          )}
        </div>
      )}

      {/* 5. Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={scope === 'friends' ? 'Search friends in overall rankings...' : 'Search global challengers...'}
          className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[#0c1322]/90 border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-amber-400/60 shadow-inner"
        />
      </div>

      {/* 6. Main Ranked List */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-black uppercase text-slate-400 tracking-wider">
            {scope === 'friends'
              ? `Friends Position in Overall Rankings (${displayedUsers.length})`
              : `Global Standings (${displayedUsers.length})`}
          </span>
          <span className="text-[11px] text-slate-400">
            Tap rival to duel (100 PTS)
          </span>
        </div>

        {displayedUsers.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-white/[0.02] border border-white/5 space-y-2">
            <p className="text-sm font-bold text-slate-400">
              {scope === 'friends'
                ? 'No friends found. Connect with challengers to see where your friends rank!'
                : 'No players match your search.'}
            </p>
            {scope === 'friends' && (
              <button
                type="button"
                onClick={() => setFriendModalOpen(true)}
                className="text-xs text-amber-400 font-bold underline cursor-pointer"
              >
                Find & Add Friends
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {displayedUsers.map((user) => {
              const isMe = user.isCurrentUser;
              return (
                <div
                  key={user.id}
                  onClick={() => setSelectedProfileUser(user)}
                  className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 cursor-pointer ${
                    isMe
                      ? 'bg-amber-500/15 border-amber-400/40 shadow-sm'
                      : 'bg-[#0c1322]/80 border-white/10 hover:border-white/20 hover:bg-[#10192e]'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Position in Overall Rankings */}
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center font-display font-black text-xs shrink-0 ${
                        user.overallRank === 1
                          ? 'bg-amber-400 text-black shadow'
                          : user.overallRank === 2
                          ? 'bg-slate-300 text-black shadow'
                          : user.overallRank === 3
                          ? 'bg-amber-700 text-white shadow'
                          : 'bg-white/5 text-slate-300 border border-white/10'
                      }`}
                    >
                      #{user.overallRank}
                    </div>

                    <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center text-xl shrink-0">
                      {user.avatar}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h4 className="font-display font-bold text-white text-xs sm:text-sm truncate">
                          {user.name}
                        </h4>
                        <span className="text-[10px] font-mono text-amber-300 font-bold">
                          @{user.username || user.name.toLowerCase().replace(/\s+/g, '_')}
                        </span>
                        {isMe && (
                          <span className="px-1.5 py-0.2 rounded-md bg-amber-400 text-black text-[9px] font-black">
                            YOU
                          </span>
                        )}
                        {user.isFriend && !isMe && (
                          <span className="px-1.5 py-0.2 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 text-[9px] font-bold">
                            Friend
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                        <span className="text-amber-300 font-semibold">
                          #{user.overallRank} Overall
                        </span>
                        <span>•</span>
                        <span className="text-slate-300 font-medium">
                          {user.points.toLocaleString()} pts
                        </span>
                        <span>•</span>
                        <span className="text-orange-400 flex items-center gap-0.5">
                          <Flame className="w-3 h-3 fill-current" />
                          {user.streak}d
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Duel Trigger Button (100 PTS Wager) */}
                  {!isMe && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        haptics.heavy();
                        sound.playBonus(state.soundEnabled);
                        setDuelTarget(user);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-rose-500 to-red-600 hover:brightness-110 text-white font-black text-xs flex items-center gap-1 transition active:scale-95 cursor-pointer shadow shrink-0"
                    >
                      <Swords className="w-3.5 h-3.5" />
                      <span>Duel</span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modals */}
      <FriendModal
        isOpen={friendModalOpen}
        onClose={() => setFriendModalOpen(false)}
        users={globalLadder}
        myUsername={state.username || 'challenger_1'}
        onToggleFriend={handleToggleFriend}
        onToast={onToast}
        soundEnabled={state.soundEnabled}
        onStartDuel={(u) => setDuelTarget(u)}
        onViewProfile={(u) => {
          setFriendModalOpen(false);
          setSelectedProfileUser(u);
        }}
      />

      <UserProfileModal
        user={selectedProfileUser}
        isOpen={!!selectedProfileUser}
        onClose={() => setSelectedProfileUser(null)}
        onStartDuel={(u) => {
          setSelectedProfileUser(null);
          setDuelTarget(u);
        }}
        onToggleFriend={handleToggleFriend}
        onToast={onToast}
        soundEnabled={state.soundEnabled}
        currentUserName={state.playerName}
      />

      {/* Head to Head Duel Modal (100 PTS simple wager) */}
      <DuelModal
        isOpen={!!duelTarget}
        onClose={() => setDuelTarget(null)}
        targetFriend={duelTarget}
        playerName={state.playerName}
        playerAvatar={state.avatar}
        difficulty={currentDifficulty}
        onReward={onReward}
        onPenalty={onPenalty}
        onToast={onToast}
        soundEnabled={state.soundEnabled}
      />
    </div>
  );
}
