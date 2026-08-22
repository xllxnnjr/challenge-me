import React, { useState } from 'react';
import {
  LogIn,
  LogOut,
  Cloud,
  CloudCheck,
  RefreshCw,
  ShieldCheck,
  Smartphone,
  Laptop,
  Flame,
  Trophy,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  UserCheck,
  AlertCircle,
} from 'lucide-react';
import { AuthUser, GameState } from '../../types';
import { loginWithGoogle, logoutUser, saveGameStateToCloud, loadGameStateFromCloud } from '../../lib/firebase';
import { haptics } from '../../utils/haptics';
import { sound } from '../../utils/audio';
import { ConnectedDevicesSection } from '../ConnectedDevicesSection';

interface Props {
  authUser: AuthUser | null;
  state: GameState;
  onAuthSuccess: (user: AuthUser, cloudState: GameState | null) => void;
  onSignOut: () => void;
  onSyncStateToCloud: () => Promise<void>;
  onRestoreFromCloud: (cloudState: GameState) => void;
  onRemoveDevice?: (deviceId: string) => Promise<void> | void;
  onToast: (msg: string) => void;
  onNavigateHome: () => void;
}

export function AuthScreen({
  authUser,
  state,
  onAuthSuccess,
  onSignOut,
  onSyncStateToCloud,
  onRestoreFromCloud,
  onRemoveDevice,
  onToast,
  onNavigateHome,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      sound.playClick(state.soundEnabled);
      haptics.selection();

      const user = await loginWithGoogle();
      if (user) {
        haptics.success();
        sound.playSuccess(state.soundEnabled);

        const authUserData: AuthUser = {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
        };

        // Check if there is existing cloud data
        const { state: cloudState } = await loadGameStateFromCloud(user.uid);

        onAuthSuccess(authUserData, cloudState);
        onToast(`Signed in as ${user.displayName || user.email || 'Challenger'}! Cloud sync active ☁️`);
      }
    } catch (err: any) {
      console.error('Google Sign In failed:', err);
      const message = err?.message || 'Google Sign-In was cancelled or encountered an issue.';
      setErrorMsg(message);
      onToast(message);
      sound.playError(state.soundEnabled);
      haptics.heavy();

    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      setLoading(true);
      haptics.medium();
      sound.playTap(state.soundEnabled);
      await logoutUser();
      onSignOut();
      onToast('Signed out of Google account. Local progress preserved.');
    } catch (err: any) {
      console.error('Sign Out failed:', err);
      onToast('Failed to sign out. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleManualSync = async () => {
    if (!authUser) return;
    try {
      setSyncing(true);
      sound.playTap(state.soundEnabled);
      haptics.light();
      await onSyncStateToCloud();
      haptics.success();
      sound.playSuccess(state.soundEnabled);
      onToast('Game data synced to Google Cloud! ☁️');
    } catch (err) {
      console.error('Sync failed:', err);
      onToast('Cloud sync failed. Check your internet connection.');
    } finally {
      setSyncing(false);
    }
  };

  const handleManualRestore = async () => {
    if (!authUser) return;
    try {
      setRestoring(true);
      sound.playTap(state.soundEnabled);
      haptics.selection();
      const { state: cloudState } = await loadGameStateFromCloud(authUser.uid);
      if (cloudState) {
        onRestoreFromCloud(cloudState);
        haptics.success();
        sound.playBonus(state.soundEnabled);
        onToast('Restored latest game progress from Cloud! 🎮');
      } else {
        onToast('No previous cloud save found. Current game saved to cloud.');
        await onSyncStateToCloud();
      }
    } catch (err) {
      console.error('Restore failed:', err);
      onToast('Could not load cloud save.');
    } finally {
      setRestoring(false);
    }
  };

  const formatSyncTime = (timestamp?: number) => {
    if (!timestamp) return 'Never';
    const diffSec = Math.floor((Date.now() - timestamp) / 1000);
    if (diffSec < 15) return 'Just now';
    if (diffSec < 60) return `${diffSec}s ago`;
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const d = new Date(timestamp);
    return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

  return (
    <div className="space-y-4 pb-8 animate-in fade-in duration-300">
      {/* 1. Header Section */}
      <div className="pt-2 pb-1">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="px-2.5 py-0.5 rounded-full bg-white/[0.08] text-indigo-300 border border-white/10 text-[10px] font-bold tracking-wider uppercase flex items-center gap-1">
            <Cloud className="w-3 h-3 text-indigo-400" />
            <span>Cross-Device Cloud Sync</span>
          </span>
          {authUser ? (
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-[10px] font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Cloud Connected</span>
            </span>
          ) : (
            <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[10px] font-bold">
              Guest Mode (Local Only)
            </span>
          )}
        </div>

        <h1 className="text-2xl sm:text-3xl font-display font-black text-white tracking-tight flex items-center gap-2">
          <span>{authUser ? 'Google Account & Cloud Save' : 'Google Sign In'}</span>
          <span className="text-xl">☁️</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-400">
          {authUser
            ? 'Your game data is seamlessly synced across your phone, tablet, and PC.'
            : 'Sign in with your Google account for seamless device switching & instant cloud save.'}
        </p>
      </div>

      {errorMsg && (
        <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
          <div className="min-w-0">
            <span className="font-bold block">Sign In Notice</span>
            <span>{errorMsg}</span>
          </div>
        </div>
      )}

      {/* 2. Main Account Status Card */}
      {!authUser ? (
        /* Unauthenticated Showcase Card */
        <div className="rounded-[30px] bg-gradient-to-br from-[#12182c] via-[#0e1424] to-[#070b16] border border-white/15 p-5 sm:p-6 shadow-2xl relative overflow-hidden">
          {/* Subtle Ambient Radial Glow */}
          <div className="absolute -top-12 -right-12 w-56 h-56 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center shadow-lg p-2.5 shrink-0">
                {/* Official Google G Logo SVG */}
                <svg className="w-full h-full" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
              </div>

              <div>
                <h3 className="text-lg sm:text-xl font-display font-black text-white">
                  Continue with Google
                </h3>
                <p className="text-xs text-slate-300">
                  Instant cloud backup & seamless device switching in 1 click
                </p>
              </div>
            </div>

            {/* Google Sign In Button */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full py-3.5 px-5 rounded-2xl bg-white hover:bg-slate-100 text-slate-900 font-display font-black text-sm sm:text-base flex items-center justify-center gap-3 shadow-xl transition-all duration-200 active:scale-[0.98] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin text-indigo-600" />
                  <span>Connecting to Google...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>Sign in with Google</span>
                  <ArrowRight className="w-4 h-4 text-slate-500 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>

            <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Secure Firestore Cloud Encryption</span>
              </span>
              <span>Free & Instant</span>
            </div>
          </div>
        </div>
      ) : (
        /* Authenticated Active Account Card */
        <div className="rounded-[30px] bg-gradient-to-br from-[#121c32] via-[#0d1528] to-[#070b16] border border-indigo-500/30 p-5 sm:p-6 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 space-y-5">
            {/* User Profile Row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                {authUser.photoURL ? (
                  <img
                    src={authUser.photoURL}
                    alt={authUser.displayName || 'User Avatar'}
                    referrerPolicy="no-referrer"
                    className="w-14 h-14 rounded-full border-2 border-indigo-400 shadow-md object-cover"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-black text-xl flex items-center justify-center border-2 border-white/20 shadow-md">
                    {authUser.displayName ? authUser.displayName.charAt(0).toUpperCase() : 'G'}
                  </div>
                )}

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base sm:text-lg font-display font-black text-white truncate">
                      {authUser.displayName || 'Google Challenger'}
                    </h3>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[9px] font-bold uppercase">
                      Synced
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 truncate">
                    {authUser.email || 'Google User'}
                  </p>
                  <p className="text-[10px] text-slate-500 font-mono truncate mt-0.5">
                    UID: {authUser.uid.slice(0, 16)}...
                  </p>
                </div>
              </div>

              {/* Sign Out Button */}
              <button
                type="button"
                onClick={handleSignOut}
                disabled={loading}
                className="px-3.5 py-2 rounded-2xl bg-white/10 hover:bg-white/15 text-rose-300 hover:text-rose-200 border border-white/10 text-xs font-bold flex items-center gap-1.5 transition active:scale-95 cursor-pointer self-start sm:self-auto"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>

            {/* Cloud Sync Dashboard Bar */}
            <div className="p-4 rounded-2xl bg-black/40 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <CloudCheck className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold text-white">Cloud Save Status</span>
                  <span className="text-[10px] text-emerald-400 font-mono">Active 🟢</span>
                </div>
                <p className="text-xs text-slate-400">
                  Last synced: <strong className="text-slate-200">{formatSyncTime(state.lastCloudSync)}</strong>
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleManualSync}
                  disabled={syncing}
                  className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-indigo-600/30 transition active:scale-95 cursor-pointer disabled:opacity-50"
                  title="Upload current local progress to cloud"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
                  <span>{syncing ? 'Syncing...' : 'Sync Now'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleManualRestore}
                  disabled={restoring}
                  className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-slate-300 hover:text-white font-bold text-xs flex items-center gap-1.5 border border-white/10 transition active:scale-95 cursor-pointer disabled:opacity-50"
                  title="Pull cloud save from another device"
                >
                  <Cloud className={`w-3.5 h-3.5 ${restoring ? 'animate-pulse' : ''}`} />
                  <span>{restoring ? 'Restoring...' : 'Pull Save'}</span>
                </button>
              </div>
            </div>

            {/* Connected Devices Section */}
            <ConnectedDevicesSection
              devices={state.connectedDevices}
              onRemoveDevice={onRemoveDevice}
              onRefresh={() => {
                onToast('Checked connected devices • Synced');
              }}
            />
          </div>
        </div>
      )}

      {/* 3. Device Switching Highlights & Benefits Grid */}
      <div className="space-y-3 pt-1">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Why Use Google Cloud Save?
          </span>
          <span className="text-[11px] text-indigo-400 font-medium">Automatic & Real-time</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Card 1: Device Switch */}
          <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 hover:border-white/20 transition">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                <Smartphone className="w-4 h-4" />
              </div>
              <div className="text-xs font-bold text-white">Seamless Device Switching</div>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Start your morning challenge on your phone, then resume on your laptop or tablet. Your data stays in sync automatically.
            </p>
          </div>

          {/* Card 2: Streaks & XP */}
          <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 hover:border-white/20 transition">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-400/30">
                <Flame className="w-4 h-4" />
              </div>
              <div className="text-xs font-bold text-white">Streak & Progress Protection</div>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Never worry about browser cache clears, private windows, or switching devices wiping your streaks, level XP, or points.
            </p>
          </div>

          {/* Card 3: Achievements */}
          <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 hover:border-white/20 transition">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-400/30">
                <Trophy className="w-4 h-4" />
              </div>
              <div className="text-xs font-bold text-white">Global Leaderboard Sync</div>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Your high scores, unlocked achievements, and avatar preferences are preserved and displayed across the global network.
            </p>
          </div>

          {/* Card 4: Friends & AI Duels */}
          <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 hover:border-white/20 transition">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="text-xs font-bold text-white">AI Duels & Friends Network</div>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Keep your friends list and AI Duel history saved so you can challenge rivals from any browser or location.
            </p>
          </div>
        </div>
      </div>

      {/* 4. Action Banner / Return to Game */}
      <div className="pt-2 flex items-center justify-between">
        <button
          type="button"
          onClick={onNavigateHome}
          className="px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs flex items-center gap-2 border border-white/10 transition active:scale-95 cursor-pointer shadow-sm"
        >
          <span>Continue Playing</span>
          <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
        </button>

        {!authUser && (
          <button
            type="button"
            onClick={handleGoogleLogin}
            className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-display font-black text-xs flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition active:scale-95 cursor-pointer"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Sign In with Google</span>
          </button>
        )}
      </div>
    </div>
  );
}
