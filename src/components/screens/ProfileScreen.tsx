import React, { useState, useRef } from 'react';
import { User, Volume2, VolumeX, RotateCcw, Share2, HelpCircle, Trophy, Camera, Upload, Trash2, Check, Lock, Sparkles, Filter, Sliders, Zap } from 'lucide-react';
import { GameState, Difficulty } from '../../types';
import { AVATARS, calculateLevel } from '../../utils/storage';
import { ACHIEVEMENTS } from '../../data/achievements';
import { sound } from '../../utils/audio';
import { haptics } from '../../utils/haptics';
import { AnimatedLevelBar } from '../AnimatedLevelBar';
import { AvatarDisplay } from '../AvatarDisplay';
import { ShareModal, ShareData } from '../ShareModal';

interface Props {
  state: GameState;
  currentDifficulty: Difficulty;
  onChangeDifficulty: (diff: Difficulty) => void;
  onUpdatePlayer: (name: string, avatar: string) => void;
  onToggleSound: () => void;
  onResetGame: () => void;
  onToast: (msg: string) => void;
}

type ProfileTab = 'profile' | 'achievements';
type AchievementFilter = 'all' | 'unlocked' | 'locked';

const DIFFICULTIES: { id: Difficulty; label: string; icon: string; bonus: string; desc: string; color: string }[] = [
  {
    id: 'Easy',
    label: 'Easy Tier',
    icon: '🌱',
    bonus: '0.75x XP',
    desc: 'Casual pace & forgiving timers',
    color: 'from-emerald-500/20 to-teal-500/10 border-emerald-400/50 text-emerald-300 ring-1 ring-emerald-400/40',
  },
  {
    id: 'Medium',
    label: 'Medium Tier',
    icon: '⚡',
    bonus: '1.0x XP',
    desc: 'Balanced precision & standard pace',
    color: 'from-amber-500/20 to-orange-500/10 border-amber-400/50 text-amber-300 ring-1 ring-amber-400/40',
  },
  {
    id: 'Hard',
    label: 'Hard Tier',
    icon: '🔥',
    bonus: '1.5x XP',
    desc: 'Lightning reflex & 1.5x score bonus',
    color: 'from-rose-500/20 to-red-500/10 border-rose-400/50 text-rose-300 ring-1 ring-rose-400/40',
  },
];

export function ProfileScreen({
  state,
  currentDifficulty,
  onChangeDifficulty,
  onUpdatePlayer,
  onToggleSound,
  onResetGame,
  onToast,
}: Props) {
  const [activeTab, setActiveTab] = useState<ProfileTab>('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [nameInput, setNameInput] = useState(state.playerName);
  const [selectedAvatar, setSelectedAvatar] = useState(state.avatar);
  const [showConfirmReset, setShowConfirmReset] = useState(false);
  const [achievementFilter, setAchievementFilter] = useState<AchievementFilter>('all');
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [shareData, setShareData] = useState<ShareData>({
    title: 'Challenge Me Scorecard',
    text: '',
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const level = calculateLevel(state.xp);
  const isCustomPicture = selectedAvatar.startsWith('data:') || selectedAvatar.startsWith('http') || selectedAvatar.startsWith('blob:');

  const unlockedAchievementsCount = state.unlockedAchievements?.length || 0;
  const totalAchievements = ACHIEVEMENTS.length;
  const totalAchievementBonusXp = ACHIEVEMENTS.filter(a => state.unlockedAchievements?.includes(a.id))
    .reduce((sum, a) => sum + a.xpReward, 0);

  const filteredAchievements = ACHIEVEMENTS.filter(a => {
    const isUnlocked = state.unlockedAchievements?.includes(a.id);
    if (achievementFilter === 'unlocked') return isUnlocked;
    if (achievementFilter === 'locked') return !isUnlocked;
    return true;
  });

  // Handle image file upload with client-side compression
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      haptics.error();
      onToast('Please select a valid image file 🖼️');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const size = 256;
        canvas.width = size;
        canvas.height = size;

        const minDim = Math.min(img.width, img.height);
        const startX = (img.width - minDim) / 2;
        const startY = (img.height - minDim) / 2;

        if (ctx) {
          ctx.drawImage(img, startX, startY, minDim, minDim, 0, 0, size, size);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
          setSelectedAvatar(dataUrl);
          onUpdatePlayer(nameInput.trim() || 'Challenger', dataUrl);
          sound.playSuccess(state.soundEnabled);
          haptics.success();
          onToast('Profile picture uploaded successfully! 📸');
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveCustomPicture = () => {
    const fallbackAvatar = '🧑🏾‍🚀';
    setSelectedAvatar(fallbackAvatar);
    onUpdatePlayer(nameInput.trim() || 'Challenger', fallbackAvatar);
    sound.playClick(state.soundEnabled);
    haptics.light();
    onToast('Reverted to avatar icon');
  };

  const handleSaveProfile = () => {
    onUpdatePlayer(nameInput.trim() || 'Challenger', selectedAvatar);
    setIsEditing(false);
    sound.playClick(state.soundEnabled);
    haptics.success();
    onToast('Profile updated successfully! ✨');
  };

  const handleShare = () => {
    sound.playSuccess(state.soundEnabled);
    haptics.celebration();
    const shareText = `🎯 ${state.playerName}'s Scorecard on Challenge Me:\n• Level: ${level} Challenger (${state.xp} XP)\n• Total Points: ${state.points} pts\n• Daily Streak: ${state.streak} days 🔥\n• Completed: ${state.done} challenges\n• Trophies: ${unlockedAchievementsCount}/${totalAchievements} unlocked 🏆\n• Active Difficulty: ${currentDifficulty}\n\nCan you beat my brain training score?`;

    setShareData({
      title: `${state.playerName}'s Challenge Me Scorecard`,
      text: shareText,
      level,
      score: state.points,
      streak: state.streak,
      trophiesCount: unlockedAchievementsCount,
    });
    setShareModalOpen(true);
  };

  const handleShareAchievement = (ach: typeof ACHIEVEMENTS[0]) => {
    sound.playSuccess(state.soundEnabled);
    haptics.celebration();
    const shareText = `🏆 Milestone Unlocked on Challenge Me!\n"${ach.title}" ${ach.icon}\n${ach.desc}\n\n• Player: ${state.playerName} (Level ${level})\n• Reward: +${ach.xpReward} XP\n• Total Trophies: ${unlockedAchievementsCount}/${totalAchievements}\n\nPlay & train your brain!`;

    setShareData({
      title: `Unlocked Achievement: ${ach.title}`,
      text: shareText,
      level,
      score: state.points,
      streak: state.streak,
    });
    setShareModalOpen(true);
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-300 pb-8">
      {/* Hidden File Input for Picture Upload */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImageUpload}
        accept="image/*"
        className="hidden"
      />

      {/* Screen Header */}
      <div className="flex items-center justify-between pt-1">
        <div>
          <h2 className="text-2xl sm:text-3xl font-display font-black tracking-tight text-white flex items-center gap-2">
            <span>Profile & Settings</span>
          </h2>
          <span className="text-xs text-[#94a3b8]">
            Customize profile, difficulty tier & trophies
          </span>
        </div>
        <div className="p-2.5 bg-white/[0.06] rounded-[20px] border border-white/10 text-amber-400 shadow-md">
          <User className="w-5 h-5" />
        </div>
      </div>

      {/* Apple-style Segmented Capsule Tabs (Profile vs Achievements) */}
      <div className="grid grid-cols-2 p-1 bg-black/40 border border-white/10 rounded-full shadow-inner backdrop-blur-xl">
        <button
          type="button"
          onClick={() => {
            haptics.selection();
            setActiveTab('profile');
          }}
          className={`flex items-center justify-center gap-2 py-2 px-3 rounded-full text-xs font-black transition-all cursor-pointer ${
            activeTab === 'profile'
              ? 'bg-white/15 text-white border border-white/20 shadow-md scale-[1.01]'
              : 'text-[#828fa6] hover:text-white'
          }`}
        >
          <User className="w-3.5 h-3.5 text-amber-400" />
          <span>My Profile</span>
        </button>

        <button
          type="button"
          onClick={() => {
            haptics.selection();
            setActiveTab('achievements');
          }}
          className={`flex items-center justify-center gap-2 py-2 px-3 rounded-full text-xs font-black transition-all cursor-pointer ${
            activeTab === 'achievements'
              ? 'bg-white/15 text-white border border-white/20 shadow-md scale-[1.01]'
              : 'text-[#828fa6] hover:text-white'
          }`}
        >
          <Trophy className="w-3.5 h-3.5 text-amber-400" />
          <span>Achievements</span>
          <span className="text-[10px] font-black bg-white/10 text-amber-300 px-2 py-0.5 rounded-full">
            {unlockedAchievementsCount}/{totalAchievements}
          </span>
        </button>
      </div>

      {/* TAB 1: PROFILE INFO, DIFFICULTY SETTINGS & PICTURE UPLOAD */}
      {activeTab === 'profile' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* Apple ID Style Profile Card */}
          <div className="rounded-[28px] bg-gradient-to-br from-white/[0.08] via-white/[0.04] to-white/[0.02] backdrop-blur-2xl border border-white/10 p-5 shadow-[0_12px_36px_rgba(0,0,0,0.4)] space-y-4 relative overflow-hidden">
            <div className="flex items-center gap-4">
              <div className="relative group">
                <AvatarDisplay
                  avatar={selectedAvatar}
                  size="xl"
                  className="ring-2 ring-amber-400/60 shadow-xl shadow-black/80"
                />

                <button
                  type="button"
                  onClick={() => {
                    haptics.light();
                    fileInputRef.current?.click();
                  }}
                  title="Upload profile picture"
                  className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-[#18233c] hover:bg-amber-500 text-slate-200 hover:text-black border border-white/20 flex items-center justify-center transition shadow-md cursor-pointer active:scale-90"
                >
                  <Camera className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="flex-1 min-w-0">
                {isEditing ? (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={nameInput}
                      onChange={(e) => setNameInput(e.target.value)}
                      maxLength={20}
                      className="w-full bg-black/40 border border-white/20 rounded-xl px-3 py-1.5 text-sm text-white font-bold outline-none focus:border-amber-400 shadow-inner"
                      placeholder="Enter challenger name"
                    />
                  </div>
                ) : (
                  <div>
                    <h3 className="font-display font-black text-white text-lg truncate flex items-center gap-1.5">
                      <span>{state.playerName}</span>
                      <span className="text-amber-400 text-sm">✨</span>
                    </h3>
                    <p className="text-xs text-amber-400 font-bold mb-0.5">
                      Level {level} Challenger • {state.points} pts
                    </p>
                    <span className="text-[11px] text-[#8e9ab0] block">
                      🎮 Dynamic Level Scale: <strong>Tier Lvl {level}</strong>
                    </span>
                  </div>
                )}
              </div>

              <button
                onClick={() => {
                  haptics.light();
                  if (isEditing) handleSaveProfile();
                  else setIsEditing(true);
                }}
                className="px-4 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-xs font-bold text-slate-200 border border-white/15 transition cursor-pointer active:scale-95 shadow-sm"
              >
                {isEditing ? 'Done' : 'Edit'}
              </button>
            </div>

            {/* Level Progress Bar with Framer Motion */}
            <div className="pt-2 border-t border-white/5">
              <AnimatedLevelBar
                xp={state.xp}
                level={level}
                soundEnabled={state.soundEnabled}
              />
            </div>

            {/* Profile Picture Management & Avatar Selection */}
            {isEditing && (
              <div className="pt-3 border-t border-white/5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#9ca7bd] font-bold">Profile Picture Options:</span>
                  <button
                    type="button"
                    onClick={() => {
                      haptics.light();
                      fileInputRef.current?.click();
                    }}
                    className="inline-flex items-center gap-1 text-xs font-bold text-amber-400 hover:text-amber-300 bg-white/10 px-3 py-1 rounded-full border border-white/10 transition cursor-pointer"
                  >
                    <Upload className="w-3 h-3" />
                    <span>Upload Photo</span>
                  </button>
                </div>

                {isCustomPicture && (
                  <div className="flex items-center justify-between p-2.5 rounded-[18px] bg-white/[0.04] border border-white/10 text-xs">
                    <span className="text-slate-300 text-[11px]">Custom photo active</span>
                    <button
                      type="button"
                      onClick={handleRemoveCustomPicture}
                      className="text-rose-400 hover:text-rose-300 font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Remove Photo</span>
                    </button>
                  </div>
                )}

                <div>
                  <span className="text-[11px] text-[#828fa6] mb-1.5 block">Or select an icon avatar:</span>
                  <div className="flex flex-wrap gap-2">
                    {AVATARS.map((av) => (
                      <button
                        key={av}
                        type="button"
                        onClick={() => {
                          haptics.selection();
                          setSelectedAvatar(av);
                          onUpdatePlayer(nameInput.trim() || 'Challenger', av);
                        }}
                        className={`w-10 h-10 rounded-[14px] text-xl flex items-center justify-center transition border cursor-pointer ${
                          selectedAvatar === av
                            ? 'bg-purple-950/80 border-amber-400 scale-110 shadow-md'
                            : 'bg-white/[0.04] border-white/10 hover:bg-white/10'
                        }`}
                      >
                        {av}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Dedicated Apple-style Difficulty Settings Section */}
          <div className="rounded-[28px] bg-gradient-to-br from-white/[0.08] via-white/[0.04] to-white/[0.02] backdrop-blur-2xl border border-white/10 p-5 shadow-[0_10px_32px_rgba(0,0,0,0.4)] space-y-3.5">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 flex items-center justify-center text-sm font-bold">
                  🎯
                </div>
                <div>
                  <h3 className="font-display font-black text-white text-sm">
                    Game Difficulty Tier
                  </h3>
                  <span className="text-[11px] text-[#94a3b8]">
                    Sets baseline challenge speed, math complexity & timers
                  </span>
                </div>
              </div>
            </div>

            {/* 3 Difficulty Option Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {DIFFICULTIES.map((diff) => {
                const isSelected = currentDifficulty === diff.id;
                return (
                  <button
                    key={diff.id}
                    id={`profile-difficulty-${diff.id.toLowerCase()}`}
                    type="button"
                    onClick={() => {
                      haptics.medium();
                      onChangeDifficulty(diff.id);
                      sound.playClick(state.soundEnabled);
                      onToast(`Difficulty set to ${diff.label} ${diff.icon}`);
                    }}
                    className={`p-3.5 rounded-[22px] text-left transition-all border cursor-pointer flex flex-col justify-between gap-2 active:scale-95 ${
                      isSelected
                        ? `bg-gradient-to-b ${diff.color} shadow-lg scale-[1.02]`
                        : 'bg-white/[0.03] border-white/5 text-slate-400 hover:text-slate-200 hover:bg-white/[0.06]'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="text-xl">{diff.icon}</span>
                      <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-black/40 border border-white/10">
                        {diff.bonus}
                      </span>
                    </div>
                    <div>
                      <strong className={`block text-xs font-black ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                        {diff.label}
                      </strong>
                      <span className="text-[10px] text-[#8e9cb4] line-clamp-2 leading-tight">
                        {diff.desc}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Share Scorecard CTA */}
          <button
            onClick={handleShare}
            className="w-full py-3.5 px-4 rounded-[22px] bg-white/[0.08] hover:bg-white/[0.12] border border-white/15 text-amber-300 font-bold text-xs flex items-center justify-center gap-2 transition active:scale-95 shadow-md cursor-pointer"
          >
            <Share2 className="w-4 h-4 text-amber-400" />
            <span>Share Scorecard & Achievements</span>
          </button>

          {/* Dynamic Scaling Explainer */}
          <div className="rounded-[24px] bg-white/[0.03] border border-white/10 p-4 space-y-2 text-xs">
            <div className="flex items-center gap-2 text-amber-400 font-bold">
              <Sparkles className="w-4 h-4" />
              <span>DYNAMIC LEVEL DIFFICULTY SCALING</span>
            </div>
            <p className="text-[#9ca7bd] leading-relaxed">
              As you level up, challenges dynamically scale in intensity: equations include multi-step operations, reaction windows tighten, memory patterns lengthen, and target quotas increase. Higher levels yield bigger XP rewards!
            </p>
          </div>

          {/* Apple Settings Group: Audio & FX */}
          <div className="space-y-2.5">
            <span className="text-xs text-[#9ca7bd] font-bold block px-1">AUDIO & SYSTEM</span>

            <div className="rounded-[24px] bg-white/[0.04] border border-white/10 p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-white/10 text-purple-300">
                  {state.soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                </div>
                <div>
                  <strong className="text-white text-sm block">Sound Effects</strong>
                  <span className="text-xs text-[#9ca7bd]">Synthesizer audio cues & chimes</span>
                </div>
              </div>

              <button
                onClick={() => {
                  haptics.selection();
                  onToggleSound();
                }}
                className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                  state.soundEnabled ? 'bg-emerald-500' : 'bg-slate-700'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white transition-transform transform absolute top-1 ${
                    state.soundEnabled ? 'right-1' : 'left-1'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Reset Progress */}
          <div className="pt-2">
            {showConfirmReset ? (
              <div className="p-4 rounded-[24px] bg-rose-950/40 border border-rose-800 text-center space-y-3">
                <p className="text-xs text-rose-200 font-bold">
                  Are you sure you want to reset all points, streak, and level progress? This cannot be undone.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      haptics.error();
                      onResetGame();
                      setShowConfirmReset(false);
                    }}
                    className="flex-1 py-2 rounded-full bg-rose-600 hover:bg-rose-500 font-bold text-xs text-white cursor-pointer"
                  >
                    Yes, Reset All
                  </button>
                  <button
                    onClick={() => {
                      haptics.light();
                      setShowConfirmReset(false);
                    }}
                    className="flex-1 py-2 rounded-full bg-white/10 text-slate-300 font-bold text-xs cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => {
                  haptics.medium();
                  setShowConfirmReset(true);
                }}
                className="w-full py-3 px-4 rounded-[22px] bg-white/[0.02] hover:bg-rose-950/20 border border-rose-900/30 text-rose-400 font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset My Progress</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: ACHIEVEMENTS & TROPHIES TAB (Game Center Style) */}
      {activeTab === 'achievements' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* Achievements Summary Banner */}
          <div className="rounded-[28px] bg-gradient-to-br from-white/[0.08] via-white/[0.04] to-white/[0.02] backdrop-blur-2xl border border-white/10 p-5 shadow-[0_12px_36px_rgba(0,0,0,0.4)] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-[18px] bg-gradient-to-tr from-amber-500 to-yellow-300 text-black flex items-center justify-center text-2xl font-black shadow-lg shadow-amber-500/20">
                  🏆
                </div>
                <div>
                  <h3 className="font-display font-black text-white text-base">
                    Trophy Cabinet
                  </h3>
                  <p className="text-xs text-[#9ca7bd]">
                    {unlockedAchievementsCount} of {totalAchievements} milestones unlocked
                  </p>
                </div>
              </div>

              <div className="text-right">
                <span className="text-xs font-black text-amber-300 bg-white/10 border border-white/15 px-3 py-1 rounded-full shadow-inner">
                  +{totalAchievementBonusXp} XP
                </span>
              </div>
            </div>

            {/* Achievement Progress Bar */}
            <div className="w-full bg-black/40 rounded-full h-2 overflow-hidden border border-white/10">
              <div
                className="bg-gradient-to-r from-amber-400 via-pink-500 to-purple-500 h-full rounded-full transition-all duration-500 ease-out"
                style={{ width: `${(unlockedAchievementsCount / totalAchievements) * 100}%` }}
              />
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center justify-between gap-2 px-1">
            <div className="flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-[#828fa6]" />
              <span className="text-xs text-[#828fa6] font-bold">Filter:</span>
            </div>

            <div className="flex items-center gap-1 bg-black/40 border border-white/10 p-1 rounded-full">
              {(['all', 'unlocked', 'locked'] as AchievementFilter[]).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => {
                    haptics.selection();
                    setAchievementFilter(f);
                  }}
                  className={`px-3 py-1 rounded-full text-xs font-bold capitalize transition-all cursor-pointer ${
                    achievementFilter === f
                      ? 'bg-amber-400 text-black shadow-sm font-black'
                      : 'text-[#828fa6] hover:text-white'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Trophy Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {filteredAchievements.map((ach) => {
              const isUnlocked = state.unlockedAchievements?.includes(ach.id);
              return (
                <div
                  key={ach.id}
                  className={`rounded-[24px] border p-4 flex items-center gap-3.5 transition-all shadow-md ${
                    isUnlocked
                      ? 'bg-gradient-to-br from-white/[0.08] to-white/[0.02] border-white/20 text-white'
                      : 'bg-white/[0.02] border-white/5 opacity-60 text-slate-400'
                  }`}
                >
                  <div
                    className={`w-12 h-12 rounded-[18px] flex items-center justify-center text-2xl border flex-shrink-0 ${
                      isUnlocked
                        ? 'bg-white/10 border-white/20 shadow-inner'
                        : 'bg-black/40 border-white/5 text-slate-600'
                    }`}
                  >
                    {isUnlocked ? ach.icon : '🔒'}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <strong className="text-xs font-black text-white truncate">
                        {ach.title}
                      </strong>
                      <div className="flex items-center gap-1.5">
                        {isUnlocked ? (
                          <>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleShareAchievement(ach);
                              }}
                              title="Share this achievement to apps"
                              className="p-1 px-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-[10px] text-amber-300 font-black flex items-center gap-1 transition active:scale-95 cursor-pointer"
                            >
                              <Share2 className="w-2.5 h-2.5" />
                              <span>Share</span>
                            </button>
                            <span className="text-[10px] text-emerald-400 font-black bg-emerald-400/10 px-2.5 py-0.5 rounded-full border border-emerald-400/20 flex items-center gap-1">
                              <Check className="w-2.5 h-2.5" />
                              <span>UNLOCKED</span>
                            </span>
                          </>
                        ) : (
                          <span className="text-[10px] text-amber-300 font-black bg-white/10 px-2.5 py-0.5 rounded-full border border-white/15">
                            +{ach.xpReward} XP
                          </span>
                        )}
                      </div>
                    </div>
                    <p className="text-[11px] text-[#9ca7bd] leading-tight font-normal">
                      {ach.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Reusable Apple-Style Multi-Application Share Sheet */}
      <ShareModal
        isOpen={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        data={shareData}
        onToast={onToast}
        soundEnabled={state.soundEnabled}
      />
    </div>
  );
}
