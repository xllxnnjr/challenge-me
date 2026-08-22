import React, { useState, useRef, useEffect } from 'react';
import {
  Volume2,
  VolumeX,
  RotateCcw,
  Share2,
  Trophy,
  Camera,
  Image as ImageIcon,
  Lock,
  Sparkles,
  Vibrate,
  Cloud,
  Check,
  Trash2,
  Shield,
  User,
  LogOut,
  Mail,
  ChevronRight,
  Flame,
  Award,
  AtSign,
  AlertCircle,
  CheckCircle2,
  Edit3,
  SlidersHorizontal,
  Smartphone,
  Laptop,
  Radio,
  Eye,
  EyeOff,
} from 'lucide-react';
import { GameState, Difficulty, AuthUser, DevicePermissions } from '../../types';
import { AVATARS, calculateLevel } from '../../utils/storage';
import { ACHIEVEMENTS } from '../../data/achievements';
import { validateUsername, formatUsername } from '../../utils/username';
import { sound } from '../../utils/audio';
import { haptics } from '../../utils/haptics';
import { AvatarDisplay } from '../AvatarDisplay';
import { ShareModal, ShareData } from '../ShareModal';
import { ConnectedDevicesSection } from '../ConnectedDevicesSection';

interface Props {
  state: GameState;
  authUser?: AuthUser | null;
  currentDifficulty: Difficulty;
  onChangeDifficulty: (diff: Difficulty) => void;
  onUpdatePlayer: (name: string, avatar: string, profileBanner?: string, username?: string) => void;
  onToggleSound: () => void;
  onToggleHaptics?: () => void;
  onToggleFriendNotifications?: () => void;
  onSimulateFriendActive?: (friendName: string) => void;
  onOpenAuth?: () => void;
  onRemoveDevice?: (deviceId: string) => Promise<void> | void;
  onUpdatePermissions?: (deviceId: string, permissions: DevicePermissions) => Promise<void> | void;
  onResetGame: () => void;
  onToast: (msg: string) => void;
}

type ProfileTab = 'identity' | 'devices' | 'preferences' | 'achievements';
type AchievementFilter = 'all' | 'unlocked' | 'locked';

const DIFFICULTIES: { id: Difficulty; label: string; icon: string; bonus: string; desc: string }[] = [
  {
    id: 'Easy',
    label: 'Easy Tier',
    icon: '🌱',
    bonus: '0.75x XP',
    desc: 'Casual pace & forgiving timers',
  },
  {
    id: 'Medium',
    label: 'Medium Tier',
    icon: '⚡',
    bonus: '1.0x XP',
    desc: 'Balanced precision & standard pace',
  },
  {
    id: 'Hard',
    label: 'Hard Tier',
    icon: '🔥',
    bonus: '1.5x XP',
    desc: 'Lightning reflex & 1.5x score bonus',
  },
];

export function ProfileScreen({
  state,
  authUser,
  currentDifficulty,
  onChangeDifficulty,
  onUpdatePlayer,
  onToggleSound,
  onToggleHaptics,
  onToggleFriendNotifications,
  onOpenAuth,
  onRemoveDevice,
  onUpdatePermissions,
  onResetGame,
  onToast,
}: Props) {
  const [activeTab, setActiveTab] = useState<ProfileTab>('identity');
  const [isEditing, setIsEditing] = useState(false);
  const [nameInput, setNameInput] = useState(state.playerName);
  const [usernameInput, setUsernameInput] = useState(state.username || 'challenger_1');
  const [bioInput, setBioInput] = useState(() => {
    try {
      return localStorage.getItem('challenge_me_user_bio') || 'Challenger on a mission to master trivia & reflex games!';
    } catch {
      return 'Challenger on a mission to master trivia & reflex games!';
    }
  });
  const [selectedAvatar, setSelectedAvatar] = useState(state.avatar);
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [showConfirmReset, setShowConfirmReset] = useState(false);
  const [achievementFilter, setAchievementFilter] = useState<AchievementFilter>('all');
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [shareData, setShareData] = useState<ShareData>({
    title: 'Challenge Me Scorecard',
    text: '',
  });

  const avatarInputRef = useRef<HTMLInputElement>(null);

  const isUsernameLocked = Boolean(
    state.hasChangedUsername || (state.usernameChangesCount && state.usernameChangesCount >= 1)
  );

  useEffect(() => {
    if (!isEditing) {
      setNameInput(state.playerName);
      setUsernameInput(state.username || 'challenger_1');
      setSelectedAvatar(state.avatar);
      setUsernameError(null);
    }
  }, [state.playerName, state.username, state.avatar, isEditing]);

  const level = calculateLevel(state.xp);
  const unlockedAchievementsCount = state.unlockedAchievements?.length || 0;
  const totalAchievements = ACHIEVEMENTS.length;
  const totalAchievementBonusXp = ACHIEVEMENTS.filter((a) =>
    state.unlockedAchievements?.includes(a.id)
  ).reduce((sum, a) => sum + a.xpReward, 0);

  const filteredAchievements = ACHIEVEMENTS.filter((a) => {
    const isUnlocked = state.unlockedAchievements?.includes(a.id);
    if (achievementFilter === 'unlocked') return isUnlocked;
    if (achievementFilter === 'locked') return !isUnlocked;
    return true;
  });

  // Avatar upload handler
  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      onToast('Please select a valid image file');
      return;
    }

    if (file.size > 2.5 * 1024 * 1024) {
      onToast('Image size must be under 2.5 MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      if (base64) {
        setSelectedAvatar(base64);
        haptics.success();
        sound.playSuccess(state.soundEnabled);
        onToast('Photo avatar uploaded! Click Save to apply.');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = () => {
    const cleanName = nameInput.trim();
    if (!cleanName) {
      onToast('Display name cannot be empty');
      return;
    }

    // Save bio locally
    try {
      localStorage.setItem('challenge_me_user_bio', bioInput.trim());
    } catch {}

    const cleanUsername = formatUsername(usernameInput);

    if (!isUsernameLocked && cleanUsername !== (state.username || '')) {
      const val = validateUsername(cleanUsername, 'user_current');
      if (!val.isValid) {
        setUsernameError(val.error || 'Invalid username');
        onToast(val.error || 'Invalid username format');
        return;
      }
      onUpdatePlayer(cleanName, selectedAvatar, undefined, cleanUsername);
    } else {
      onUpdatePlayer(cleanName, selectedAvatar);
    }

    setIsEditing(false);
    haptics.success();
    sound.playSuccess(state.soundEnabled);
    onToast('Profile updated successfully! ✓');
  };

  const handleOpenShare = () => {
    haptics.light();
    sound.playClick(state.soundEnabled);
    setShareData({
      title: `${state.playerName}'s Challenge Me Profile`,
      text: `🔥 Level ${level} Player (${state.points} Points • ${state.streak}-day streak). Think you can beat me? Join Challenge Me!`,
    });
    setShareModalOpen(true);
  };

  const tabs: { id: ProfileTab; label: string; icon: any }[] = [
    { id: 'identity', label: 'Identity', icon: User },
    { id: 'devices', label: 'Devices & Cloud', icon: Smartphone },
    { id: 'preferences', label: 'Preferences', icon: SlidersHorizontal },
    { id: 'achievements', label: 'Trophies', icon: Trophy },
  ];

  return (
    <div className="space-y-4 pb-12 animate-in fade-in duration-200">
      {/* 1. Profile Header Hero Block */}
      <div className="relative rounded-[28px] bg-gradient-to-br from-[#12192e] via-[#0e1526] to-[#070b16] border border-white/10 p-5 shadow-lg overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          {/* Avatar and Primary Identity */}
          <div className="flex items-center gap-4 min-w-0">
            <div className="relative shrink-0">
              <AvatarDisplay
                avatar={state.avatar}
                size="lg"
                className="ring-4 ring-amber-400/50 shadow-xl"
              />
              <span className="absolute -bottom-1 -right-1 px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 font-black text-[10px] shadow-sm border border-slate-950">
                Lv. {level}
              </span>
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-display font-black text-xl sm:text-2xl text-white tracking-tight truncate">
                  {state.playerName}
                </h1>
                {authUser && (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Verified
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                <span className="text-amber-400 font-bold">
                  @{state.username || 'challenger_1'}
                </span>
                <span>•</span>
                <span className="truncate">{state.streak}-Day Streak 🔥</span>
              </div>

              <p className="text-xs text-slate-300 line-clamp-1 mt-1 font-medium">
                {bioInput}
              </p>
            </div>
          </div>

          {/* Action buttons: Edit & Share */}
          <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end">
            <button
              type="button"
              onClick={handleOpenShare}
              className="p-2.5 rounded-2xl bg-white/[0.06] hover:bg-white/[0.12] text-slate-300 hover:text-white border border-white/10 transition active:scale-95 cursor-pointer shadow-sm"
              title="Share Scorecard"
            >
              <Share2 className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => {
                haptics.light();
                setIsEditing(!isEditing);
              }}
              className={`px-3.5 py-2 rounded-2xl font-bold text-xs flex items-center gap-1.5 transition active:scale-95 cursor-pointer shadow-sm ${
                isEditing
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  : 'bg-amber-400 hover:bg-amber-300 text-slate-950 font-black'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>{isEditing ? 'Cancel Edit' : 'Edit Profile'}</span>
            </button>
          </div>
        </div>

        {/* Level XP Progress Bar */}
        <div className="mt-4 pt-3 border-t border-white/10 space-y-1.5">
          <div className="flex items-center justify-between text-xs font-bold">
            <span className="text-slate-300 flex items-center gap-1.5">
              <span className="text-amber-400">Level {level} Master</span>
              <span className="text-slate-500">•</span>
              <span className="text-slate-400">{state.points} Total Points</span>
            </span>
            <span className="text-amber-400/90">{state.xp % 100}/100 XP</span>
          </div>
          <div className="w-full bg-black/40 h-2 rounded-full overflow-hidden border border-white/10">
            <div
              className="h-full bg-gradient-to-r from-amber-400 via-pink-500 to-indigo-500 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(100, state.xp % 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* 2. Edit Profile Modal / Expanding Card */}
      {isEditing && (
        <div className="rounded-[26px] bg-[#0d1424] border border-amber-400/40 p-5 space-y-4 shadow-xl animate-in slide-in-from-top-3 duration-200">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-black text-white text-base flex items-center gap-2">
              <Edit3 className="w-4 h-4 text-amber-400" />
              <span>Edit Identity & Avatar</span>
            </h3>
            <span className="text-xs text-slate-400">Customizations save instantly</span>
          </div>

          {/* Form Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Display Name Input */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-300 block">
                Display Name
              </label>
              <input
                type="text"
                value={nameInput}
                maxLength={20}
                onChange={(e) => setNameInput(e.target.value)}
                placeholder="Your display name"
                className="w-full px-3.5 py-2 rounded-xl bg-white/[0.05] border border-white/10 text-white placeholder-slate-500 text-xs font-medium focus:outline-none focus:border-amber-400"
              />
            </div>

            {/* Username Input */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                <span>Unique Username</span>
                {isUsernameLocked && (
                  <span className="text-[10px] text-amber-400 flex items-center gap-1 font-normal">
                    <Lock className="w-3 h-3" /> Locked
                  </span>
                )}
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-xs font-bold">
                  @
                </span>
                <input
                  type="text"
                  value={usernameInput}
                  disabled={isUsernameLocked}
                  maxLength={18}
                  onChange={(e) => {
                    setUsernameInput(e.target.value);
                    setUsernameError(null);
                  }}
                  placeholder="unique_username"
                  className={`w-full pl-8 pr-3.5 py-2 rounded-xl border text-xs font-medium focus:outline-none ${
                    isUsernameLocked
                      ? 'bg-white/[0.02] border-white/5 text-slate-500 cursor-not-allowed'
                      : 'bg-white/[0.05] border-white/10 text-white focus:border-amber-400'
                  }`}
                />
              </div>
              {usernameError && (
                <span className="text-[10px] text-rose-400 font-medium block">
                  {usernameError}
                </span>
              )}
            </div>
          </div>

          {/* Bio Input */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-300 block">
              Bio / Motto
            </label>
            <input
              type="text"
              value={bioInput}
              maxLength={80}
              onChange={(e) => setBioInput(e.target.value)}
              placeholder="A short motto or status message..."
              className="w-full px-3.5 py-2 rounded-xl bg-white/[0.05] border border-white/10 text-white placeholder-slate-500 text-xs font-medium focus:outline-none focus:border-amber-400"
            />
          </div>

          {/* Avatar Selection: 20 avatars + Custom Photo */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-300">
                Choose Avatar Character
              </label>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                className="text-[11px] text-indigo-300 hover:text-white font-bold flex items-center gap-1 px-2.5 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/30 cursor-pointer transition active:scale-95"
              >
                <Camera className="w-3 h-3" />
                <span>Upload Custom Photo</span>
              </button>
            </div>

            <div className="grid grid-cols-5 sm:grid-cols-10 gap-2 p-2 rounded-2xl bg-black/40 border border-white/5 max-h-36 overflow-y-auto no-scrollbar">
              {AVATARS.map((av) => (
                <button
                  key={av}
                  type="button"
                  onClick={() => {
                    haptics.selection();
                    setSelectedAvatar(av);
                  }}
                  className={`h-11 rounded-xl flex items-center justify-center text-xl transition-all cursor-pointer ${
                    selectedAvatar === av
                      ? 'bg-amber-400/30 border-2 border-amber-400 scale-105 shadow'
                      : 'bg-white/5 hover:bg-white/10 border border-transparent'
                  }`}
                >
                  <span>{av}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-bold text-xs cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveProfile}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-black text-xs shadow transition active:scale-95 cursor-pointer"
            >
              Save Changes
            </button>
          </div>
        </div>
      )}

      {/* 3. Section Navigation Tabs */}
      <div className="flex items-center gap-1.5 bg-[#0c1322]/80 border border-white/10 p-1.5 rounded-2xl overflow-x-auto no-scrollbar">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                haptics.selection();
                setActiveTab(tab.id);
              }}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 whitespace-nowrap transition cursor-pointer ${
                isActive
                  ? 'bg-white/15 text-white border border-white/15 shadow-sm font-black'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 4. Tab Content Panels */}
      {/* TAB A: Identity & Stats Summary */}
      {activeTab === 'identity' && (
        <div className="space-y-3 animate-in fade-in duration-150">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="p-3.5 rounded-2xl bg-[#0c1322]/80 border border-white/10 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Total XP
              </span>
              <span className="font-display font-black text-lg text-amber-300">
                {state.xp}
              </span>
            </div>
            <div className="p-3.5 rounded-2xl bg-[#0c1322]/80 border border-white/10 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Completed
              </span>
              <span className="font-display font-black text-lg text-cyan-300">
                {state.done} Games
              </span>
            </div>
            <div className="p-3.5 rounded-2xl bg-[#0c1322]/80 border border-white/10 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Streak Flame
              </span>
              <span className="font-display font-black text-lg text-rose-300">
                {state.streak} Days
              </span>
            </div>
            <div className="p-3.5 rounded-2xl bg-[#0c1322]/80 border border-white/10 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Trophies
              </span>
              <span className="font-display font-black text-lg text-indigo-300">
                {unlockedAchievementsCount}/{totalAchievements}
              </span>
            </div>
          </div>

          {/* Account Login / Sync status banner */}
          <div className="p-4 rounded-2xl bg-[#0c1322]/80 border border-white/10 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-300 shrink-0">
                <Cloud className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">
                  {authUser ? 'Cloud Sync Active' : 'Guest Mode (Local Only)'}
                </h4>
                <p className="text-[11px] text-slate-400">
                  {authUser ? `Signed in as ${authUser.email || authUser.displayName}` : 'Sign in with Google to sync across multiple devices'}
                </p>
              </div>
            </div>

            {onOpenAuth && (
              <button
                type="button"
                onClick={() => {
                  haptics.light();
                  onOpenAuth();
                }}
                className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition cursor-pointer"
              >
                {authUser ? 'Manage' : 'Sign In'}
              </button>
            )}
          </div>
        </div>
      )}

      {/* TAB B: Connected Devices & Multi-Device Manager */}
      {activeTab === 'devices' && (
        <div className="space-y-3 animate-in fade-in duration-150">
          <ConnectedDevicesSection
            devices={state.connectedDevices}
            onRemoveDevice={onRemoveDevice}
            onUpdatePermissions={onUpdatePermissions}
            onToast={onToast}
          />
        </div>
      )}

      {/* TAB C: Preferences & Sound */}
      {activeTab === 'preferences' && (
        <div className="space-y-3 animate-in fade-in duration-150">
          {/* Difficulty Selection Card */}
          <div className="p-4 rounded-2xl bg-[#0c1322]/80 border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase text-slate-200 tracking-wider">
                Default Gameplay Difficulty
              </span>
              <span className="text-[11px] font-bold text-amber-400">
                Active: {currentDifficulty}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {DIFFICULTIES.map((diff) => {
                const isSelected = currentDifficulty === diff.id;
                return (
                  <button
                    key={diff.id}
                    type="button"
                    onClick={() => {
                      haptics.selection();
                      onChangeDifficulty(diff.id);
                      onToast(`Switched to ${diff.label} (${diff.bonus})`);
                    }}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-amber-500/15 border-amber-400 text-white shadow-md'
                        : 'bg-white/[0.03] border-white/10 text-slate-400 hover:text-white hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs text-white">{diff.label}</span>
                      <span className="text-xs">{diff.icon}</span>
                    </div>
                    <span className="text-[10px] text-amber-400 font-bold block">{diff.bonus}</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">{diff.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sound & Haptics Toggles */}
          <div className="p-4 rounded-2xl bg-[#0c1322]/80 border border-white/10 space-y-2.5">
            <span className="text-xs font-black uppercase text-slate-200 tracking-wider block">
              Audio & Haptic Feedback
            </span>

            <div className="space-y-2">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.03] border border-white/5">
                <div className="flex items-center gap-2.5">
                  {state.soundEnabled ? (
                    <Volume2 className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <VolumeX className="w-4 h-4 text-slate-500" />
                  )}
                  <div>
                    <span className="text-xs font-bold text-white block">Sound Effects</span>
                    <span className="text-[10px] text-slate-400">Audio chime feedback on taps & wins</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onToggleSound}
                  className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                    state.soundEnabled ? 'bg-emerald-500' : 'bg-slate-700'
                  }`}
                >
                  <span
                    className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                      state.soundEnabled ? 'left-6' : 'left-1'
                    }`}
                  />
                </button>
              </div>

              {onToggleHaptics && (
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.03] border border-white/5">
                  <div className="flex items-center gap-2.5">
                    <Vibrate className="w-4 h-4 text-indigo-400" />
                    <div>
                      <span className="text-xs font-bold text-white block">Haptic Vibrations</span>
                      <span className="text-[10px] text-slate-400">Tactile pulse on button presses & correct answers</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={onToggleHaptics}
                    className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                      state.hapticsEnabled !== false ? 'bg-indigo-500' : 'bg-slate-700'
                    }`}
                  >
                    <span
                      className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                        state.hapticsEnabled !== false ? 'left-6' : 'left-1'
                      }`}
                    />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Reset Progress Danger Zone */}
          <div className="p-4 rounded-2xl bg-rose-950/20 border border-rose-500/25 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase text-rose-300 tracking-wider">
                Danger Zone
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Reset points, level streaks, and unlocked badges to factory default.
            </p>

            {showConfirmReset ? (
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowConfirmReset(false)}
                  className="flex-1 py-2 rounded-xl bg-white/10 text-slate-300 font-bold text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowConfirmReset(false);
                    onResetGame();
                  }}
                  className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs cursor-pointer"
                >
                  Confirm Reset
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowConfirmReset(true)}
                className="px-3 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/30 text-rose-400 font-bold text-xs border border-rose-500/30 transition cursor-pointer"
              >
                Reset All Progress
              </button>
            )}
          </div>
        </div>
      )}

      {/* TAB D: Achievements Catalog */}
      {activeTab === 'achievements' && (
        <div className="space-y-3 animate-in fade-in duration-150">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold text-slate-400">
              {unlockedAchievementsCount} of {totalAchievements} Unlocked (+{totalAchievementBonusXp} XP)
            </span>

            {/* Filter pills */}
            <div className="flex items-center gap-1">
              {(['all', 'unlocked', 'locked'] as AchievementFilter[]).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => {
                    haptics.selection();
                    setAchievementFilter(f);
                  }}
                  className={`px-2.5 py-1 rounded-full text-[10px] font-bold capitalize transition cursor-pointer ${
                    achievementFilter === f
                      ? 'bg-amber-400 text-slate-950 font-black'
                      : 'bg-white/5 text-slate-400 hover:text-white'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {filteredAchievements.map((ach) => {
              const isUnlocked = state.unlockedAchievements?.includes(ach.id);
              return (
                <div
                  key={ach.id}
                  className={`p-3 rounded-2xl border flex items-center gap-3 transition ${
                    isUnlocked
                      ? 'bg-[#0c1322]/90 border-amber-400/40 shadow-sm'
                      : 'bg-white/[0.02] border-white/5 opacity-60'
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center text-xl shrink-0 ${
                      isUnlocked
                        ? 'bg-amber-400/20 border border-amber-400/40'
                        : 'bg-white/5 border border-white/10 grayscale'
                    }`}
                  >
                    <span>{ach.icon}</span>
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <h4 className="font-bold text-xs text-white truncate">{ach.title}</h4>
                      {isUnlocked && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      )}
                    </div>
                    <p className="text-[10px] text-slate-400 line-clamp-1">{ach.desc}</p>
                  </div>

                  <span className="text-[10px] font-black text-amber-400 shrink-0">
                    +{ach.xpReward} XP
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Share Scorecard Modal */}
      <ShareModal
        isOpen={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        data={shareData}
        onToast={onToast}
      />
    </div>
  );
}
