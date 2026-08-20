import React, { useState, useRef } from 'react';
import { User, Volume2, VolumeX, RotateCcw, Share2, HelpCircle, Trophy, Camera, Upload, Trash2, Check, Lock, Sparkles, Filter, Sliders, Zap, Award } from 'lucide-react';
import { GameState, Difficulty } from '../../types';
import { AVATARS, calculateLevel } from '../../utils/storage';
import { ACHIEVEMENTS } from '../../data/achievements';
import { sound } from '../../utils/audio';
import { AnimatedLevelBar } from '../AnimatedLevelBar';
import { AvatarDisplay } from '../AvatarDisplay';

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
    desc: 'Casual pace, generous timers & great for warmup',
    color: 'from-emerald-600/30 to-teal-950/40 border-emerald-500 text-emerald-300',
  },
  {
    id: 'Medium',
    label: 'Medium Tier',
    icon: '⚡',
    bonus: '1.0x XP',
    desc: 'Balanced precision, standard pace & standard points',
    color: 'from-amber-600/30 to-orange-950/40 border-amber-500 text-amber-300',
  },
  {
    id: 'Hard',
    label: 'Hard Tier',
    icon: '🔥',
    bonus: '1.5x XP',
    desc: 'Lightning reflexes, intense timers & 1.5x score bonus',
    color: 'from-rose-600/30 to-red-950/40 border-rose-500 text-rose-300',
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
      onToast('Please select a valid image file 🖼️');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Resize and compress to 256x256 for clean storage
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const size = 256;
        canvas.width = size;
        canvas.height = size;

        // Calculate center crop square
        const minDim = Math.min(img.width, img.height);
        const startX = (img.width - minDim) / 2;
        const startY = (img.height - minDim) / 2;

        if (ctx) {
          ctx.drawImage(img, startX, startY, minDim, minDim, 0, 0, size, size);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
          setSelectedAvatar(dataUrl);
          onUpdatePlayer(nameInput.trim() || 'Challenger', dataUrl);
          sound.playSuccess(state.soundEnabled);
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
    onToast('Reverted to avatar icon');
  };

  const handleSaveProfile = () => {
    onUpdatePlayer(nameInput.trim() || 'Challenger', selectedAvatar);
    setIsEditing(false);
    sound.playClick(state.soundEnabled);
    onToast('Profile updated successfully! ✨');
  };

  const handleShare = () => {
    sound.playSuccess(state.soundEnabled);
    const shareText = `🎯 I'm at Level ${level} on Challenge Me with ${state.points} points, a ${state.streak}-day streak, and ${unlockedAchievementsCount} trophies! Can you beat my score?`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareText).then(() => {
        onToast('Scorecard copied to clipboard! 📋');
      }).catch(() => {
        onToast('Ready to share!');
      });
    } else {
      onToast('Scorecard ready to share!');
    }
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
            Customize profile photo, difficulty tier & trophies
          </span>
        </div>
        <div className="p-2.5 bg-[#121a2c] rounded-2xl border border-[#263149] text-amber-400 shadow-md">
          <User className="w-5 h-5" />
        </div>
      </div>

      {/* Profile Navigation Tabs (Profile vs Achievements) */}
      <div className="grid grid-cols-2 p-1.5 bg-[#0b1222] border border-[#23324f] rounded-2xl shadow-inner">
        <button
          type="button"
          onClick={() => setActiveTab('profile')}
          className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-black transition-all cursor-pointer ${
            activeTab === 'profile'
              ? 'bg-gradient-to-r from-amber-500/20 via-pink-500/20 to-purple-600/20 text-white border border-amber-400/50 shadow-md scale-[1.01]'
              : 'text-[#828fa6] hover:text-white'
          }`}
        >
          <User className="w-4 h-4 text-amber-400" />
          <span>My Profile</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('achievements')}
          className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-black transition-all cursor-pointer ${
            activeTab === 'achievements'
              ? 'bg-gradient-to-r from-amber-500/20 via-pink-500/20 to-purple-600/20 text-white border border-amber-400/50 shadow-md scale-[1.01]'
              : 'text-[#828fa6] hover:text-white'
          }`}
        >
          <Trophy className="w-4 h-4 text-amber-400" />
          <span>Achievements</span>
          <span className="text-[10px] font-black bg-[#1a253d] border border-[#2f3f63] text-amber-300 px-1.5 py-0.2 rounded-full">
            {unlockedAchievementsCount}/{totalAchievements}
          </span>
        </button>
      </div>

      {/* TAB 1: PROFILE INFO, DIFFICULTY SETTINGS & PICTURE UPLOAD */}
      {activeTab === 'profile' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* Profile Card with Photo Upload and Dynamic Level Scaling */}
          <div className="rounded-3xl bg-gradient-to-br from-[#121c30] via-[#0e1627] to-[#090f1d] border border-[#263552] p-5 shadow-2xl space-y-4 relative overflow-hidden">
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-amber-400/10 rounded-full blur-2xl pointer-events-none" />

            <div className="flex items-center gap-4">
              {/* Profile Avatar / Photo Container with quick upload badge */}
              <div className="relative group">
                <AvatarDisplay
                  avatar={selectedAvatar}
                  size="xl"
                  className="ring-2 ring-amber-400/60 shadow-xl shadow-black/80"
                />

                {/* Upload Action Overlay Button */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  title="Upload profile picture"
                  className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-[#18233c] hover:bg-amber-500 text-slate-200 hover:text-black border border-[#3b4b6f] flex items-center justify-center transition shadow-md cursor-pointer active:scale-90"
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
                      className="w-full bg-[#090f1f] border border-[#37496d] rounded-xl px-3 py-1.5 text-sm text-white font-bold outline-none focus:border-amber-400 shadow-inner"
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
                  if (isEditing) handleSaveProfile();
                  else setIsEditing(true);
                }}
                className="px-3.5 py-1.5 rounded-xl bg-[#1a253f] hover:bg-[#233152] text-xs font-bold text-slate-200 border border-[#304269] transition cursor-pointer active:scale-95 shadow-sm"
              >
                {isEditing ? 'Save' : 'Edit'}
              </button>
            </div>

            {/* Level Progress Bar with Framer Motion */}
            <div className="pt-2 border-t border-[#263149]/60">
              <AnimatedLevelBar
                xp={state.xp}
                level={level}
                soundEnabled={state.soundEnabled}
              />
            </div>

            {/* Profile Picture Management & Avatar Selection */}
            {isEditing && (
              <div className="pt-3 border-t border-[#263149]/60 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#9ca7bd] font-bold">Profile Picture Options:</span>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-1 text-xs font-bold text-amber-400 hover:text-amber-300 bg-[#162035] px-2.5 py-1 rounded-lg border border-[#2d3f63] transition cursor-pointer"
                  >
                    <Upload className="w-3 h-3" />
                    <span>Upload Photo</span>
                  </button>
                </div>

                {isCustomPicture && (
                  <div className="flex items-center justify-between p-2 rounded-xl bg-[#151e33] border border-[#273654] text-xs">
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
                          setSelectedAvatar(av);
                          onUpdatePlayer(nameInput.trim() || 'Challenger', av);
                        }}
                        className={`w-10 h-10 rounded-xl text-xl flex items-center justify-center transition border cursor-pointer ${
                          selectedAvatar === av
                            ? 'bg-purple-950 border-amber-400 scale-110 shadow-md'
                            : 'bg-[#151d31] border-[#263149] hover:bg-[#1f2b48]'
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

          {/* Dedicated Sleek Difficulty Settings Tier (Moved to Profile as requested) */}
          <div className="rounded-3xl bg-gradient-to-br from-[#121c30] to-[#0c1322] border border-[#263552] p-4 sm:p-5 shadow-xl space-y-3.5">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center justify-center text-sm font-bold">
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
                      onChangeDifficulty(diff.id);
                      sound.playClick(state.soundEnabled);
                      onToast(`Difficulty set to ${diff.label} ${diff.icon}`);
                    }}
                    className={`p-3 rounded-2xl text-left transition-all border cursor-pointer flex flex-col justify-between gap-1.5 ${
                      isSelected
                        ? `bg-gradient-to-b ${diff.color} shadow-xl ring-1 ring-amber-400/60 scale-[1.02]`
                        : 'bg-[#0f172a]/90 border-[#22314e] text-slate-400 hover:text-slate-200 hover:bg-[#152038]'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="text-lg">{diff.icon}</span>
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-black/40 border border-white/10">
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
            className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-[#141e33] to-[#182540] hover:from-[#1b2845] hover:to-[#203052] border border-amber-500/40 text-amber-200 font-bold text-xs flex items-center justify-center gap-2 transition active:scale-98 shadow-md cursor-pointer"
          >
            <Share2 className="w-4 h-4 text-amber-400" />
            <span>Share Scorecard & Achievements</span>
          </button>

          {/* Level Progression & Difficulty Scaling Explainer */}
          <div className="rounded-2xl bg-[#0e1627] border border-[#263149] p-4 space-y-2 text-xs">
            <div className="flex items-center gap-2 text-amber-400 font-bold">
              <Sparkles className="w-4 h-4" />
              <span>DYNAMIC LEVEL DIFFICULTY SCALING</span>
            </div>
            <p className="text-[#9ca7bd] leading-relaxed">
              As you level up, challenges dynamically scale in intensity: equations include multi-step operations, reaction windows tighten, memory patterns lengthen, and target quotas increase. Higher levels yield bigger XP rewards!
            </p>
          </div>

          {/* How it works section */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-1.5 px-1 text-xs text-[#9ca7bd] font-bold">
              <HelpCircle className="w-3.5 h-3.5" />
              <span>HOW IT WORKS</span>
            </div>

            <div className="rounded-2xl bg-[#0e1627] border border-[#263149] divide-y divide-[#263149]/60 overflow-hidden text-xs">
              <div className="p-3.5 flex items-start gap-3">
                <span className="text-2xl">🎲</span>
                <div>
                  <strong className="block text-white text-sm">1. Pick or Roll a Challenge</strong>
                  <span className="text-[#9ca7bd] leading-relaxed">
                    Choose from Math, Social, Memory, and Speed mini-games designed for 15-30 second gameplay.
                  </span>
                </div>
              </div>

              <div className="p-3.5 flex items-start gap-3">
                <span className="text-2xl">⭐</span>
                <div>
                  <strong className="block text-white text-sm">2. Earn Points & Level Up</strong>
                  <span className="text-[#9ca7bd] leading-relaxed">
                    Complete challenges accurately to earn score points, unlock achievements, and level up your player badge.
                  </span>
                </div>
              </div>

              <div className="p-3.5 flex items-start gap-3">
                <span className="text-2xl">🔥</span>
                <div>
                  <strong className="block text-white text-sm">3. Build Daily Momentum</strong>
                  <span className="text-[#9ca7bd] leading-relaxed">
                    Come back daily to keep your active streak burning and unlock high-tier trophies.
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Game Preferences */}
          <div className="space-y-2.5">
            <span className="text-xs text-[#9ca7bd] font-bold block px-1">AUDIO & FX</span>

            <div className="rounded-2xl bg-[#0e1627] border border-[#263149] p-3.5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-[#18233c] text-purple-300">
                  {state.soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                </div>
                <div>
                  <strong className="text-white text-sm block">Sound Effects</strong>
                  <span className="text-xs text-[#9ca7bd]">Synthesizer audio cues & chimes</span>
                </div>
              </div>

              <button
                onClick={onToggleSound}
                className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                  state.soundEnabled ? 'bg-purple-600' : 'bg-slate-700'
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

          {/* Danger Zone: Reset Progress */}
          <div className="pt-2">
            {showConfirmReset ? (
              <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-800 text-center space-y-3">
                <p className="text-xs text-rose-200 font-bold">
                  Are you sure you want to reset all points, streak, and level progress? This cannot be undone.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      onResetGame();
                      setShowConfirmReset(false);
                    }}
                    className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 font-bold text-xs text-white cursor-pointer"
                  >
                    Yes, Reset All
                  </button>
                  <button
                    onClick={() => setShowConfirmReset(false)}
                    className="flex-1 py-2 rounded-xl bg-[#18233c] text-slate-300 font-bold text-xs cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowConfirmReset(true)}
                className="w-full py-3 px-4 rounded-xl bg-[#111827] hover:bg-rose-950/30 border border-rose-900/40 text-rose-400 font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset My Progress</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: ACHIEVEMENTS & TROPHIES TAB */}
      {activeTab === 'achievements' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* Achievements Summary Banner */}
          <div className="rounded-3xl bg-gradient-to-br from-[#1b253d] to-[#11192b] border border-[#2d3e64] p-5 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-300 text-black flex items-center justify-center text-2xl font-black shadow-lg shadow-amber-500/20">
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
                <span className="text-xs font-extrabold text-amber-400 bg-amber-950/60 border border-amber-800 px-2.5 py-1 rounded-xl shadow-inner">
                  +{totalAchievementBonusXp} XP Earned
                </span>
              </div>
            </div>

            {/* Achievement Progress Bar */}
            <div className="w-full bg-[#0d1424] rounded-full h-2 overflow-hidden border border-[#22304d]">
              <div
                className="bg-gradient-to-r from-amber-400 via-pink-500 to-purple-500 h-full rounded-full transition-all duration-500 ease-out"
                style={{ width: `${(unlockedAchievementsCount / totalAchievements) * 100}%` }}
              />
            </div>
          </div>

          {/* Filter Pills: All | Unlocked | Locked */}
          <div className="flex items-center justify-between gap-2 px-1">
            <div className="flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-[#828fa6]" />
              <span className="text-xs text-[#828fa6] font-bold">Filter:</span>
            </div>

            <div className="flex items-center gap-1 bg-[#0c1322] border border-[#263149] p-1 rounded-xl">
              {(['all', 'unlocked', 'locked'] as AchievementFilter[]).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setAchievementFilter(f)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold capitalize transition-all cursor-pointer ${
                    achievementFilter === f
                      ? 'bg-amber-500 text-black shadow-sm font-black'
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
                  className={`rounded-2xl border p-4 flex items-center gap-3.5 transition-all shadow-md ${
                    isUnlocked
                      ? 'bg-gradient-to-br from-[#121c2e] to-[#0e1726] border-purple-500/40 text-white shadow-purple-950/20'
                      : 'bg-[#0d1423]/60 border-[#1e2a42] opacity-60 text-slate-400'
                  }`}
                >
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl border flex-shrink-0 ${
                      isUnlocked
                        ? 'bg-[#1e2942] border-purple-400/50 shadow-inner'
                        : 'bg-[#111827] border-slate-700 text-slate-600'
                    }`}
                  >
                    {isUnlocked ? ach.icon : '🔒'}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <strong className="text-xs font-black text-white truncate">
                        {ach.title}
                      </strong>
                      {isUnlocked ? (
                        <span className="text-[10px] text-emerald-400 font-black bg-emerald-950/70 px-2 py-0.5 rounded-full border border-emerald-800 flex items-center gap-1">
                          <Check className="w-2.5 h-2.5" />
                          <span>UNLOCKED</span>
                        </span>
                      ) : (
                        <span className="text-[10px] text-amber-400/90 font-black bg-amber-950/40 px-2 py-0.5 rounded-full border border-amber-900/50">
                          +{ach.xpReward} XP
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-[#9ca7bd] leading-tight">
                      {ach.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
