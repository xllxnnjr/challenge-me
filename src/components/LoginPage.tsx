import React, { useState, useEffect } from 'react';
import {
  LogIn,
  ArrowRight,
  ShieldCheck,
  Zap,
  Flame,
  Trophy,
  Sparkles,
  Gamepad2,
  Users,
  CheckCircle2,
  RefreshCw,
  User,
  Star,
  Layers,
} from 'lucide-react';
import { AuthUser, GameState } from '../types';
import { loginWithGoogle, loadGameStateFromCloud } from '../lib/firebase';
import { AppLogo } from './AppLogo';
import { haptics } from '../utils/haptics';
import { sound } from '../utils/audio';

interface Props {
  authUser: AuthUser | null;
  state: GameState;
  onEnterApp: (user?: AuthUser | null, cloudState?: GameState | null, guestName?: string) => void;
  onToast: (msg: string) => void;
}

export function LoginPage({
  authUser,
  state,
  onEnterApp,
  onToast,
}: Props) {
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [guestName, setGuestName] = useState(state.playerName || 'Challenger');
  const [isGuestMode, setIsGuestMode] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    try {
      setLoadingGoogle(true);
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

        // Load existing cloud save from Firestore
        let cloudState: GameState | null = null;
        try {
          const res = await loadGameStateFromCloud(user.uid);
          cloudState = res.state;
        } catch (cloudErr) {
          console.warn('Could not load cloud save:', cloudErr);
        }

        onEnterApp(authUserData, cloudState);
        onToast(`Welcome, ${user.displayName || 'Challenger'}! Cloud save synced ☁️`);
      }
    } catch (err: any) {
      console.error('Google Sign In error:', err);
      const msg = err?.message || 'Google Sign-In was cancelled or failed.';
      setErrorMsg(msg);
      onToast(msg);
      sound.playError(state.soundEnabled);
      haptics.heavy();
    } finally {
      setLoadingGoogle(false);
    }
  };

  const handleContinueAsGuest = (e: React.FormEvent) => {
    e.preventDefault();
    sound.playTap(state.soundEnabled);
    haptics.medium();

    const name = guestName.trim() || 'Challenger';
    onEnterApp(null, null, name);
    onToast(`Welcome, ${name}! Starting your daily challenges 🎯`);
  };

  const handleContinueWithExisting = () => {
    sound.playSuccess(state.soundEnabled);
    haptics.success();
    onEnterApp(authUser, null);
    onToast(`Welcome back, ${authUser?.displayName || state.playerName}!`);
  };

  return (
    <div className="min-h-screen bg-[#070b16] text-[#f7f8ff] flex flex-col items-center justify-center p-4 relative overflow-hidden selection:bg-purple-500 selection:text-white">
      {/* Background Decorative Ambient Orbs */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-pink-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Main Container Card */}
      <div className="w-full max-w-[460px] z-10 space-y-5 animate-in fade-in zoom-in-95 duration-500">
        {/* Brand Header */}
        <div className="text-center space-y-3 pt-2">
          <div className="inline-block transform hover:scale-105 transition-transform duration-300">
            <AppLogo size={68} />
          </div>

          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.06] border border-white/10 text-[11px] font-bold text-indigo-300 uppercase tracking-widest mb-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Daily Mind & Mini-Games</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-display font-black text-white tracking-tight">
              Challenge<span className="bg-gradient-to-r from-amber-400 via-pink-400 to-indigo-400 bg-clip-text text-transparent">Me</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-sm mx-auto mt-1">
              Level up your brain daily with micro-challenges, streaks, global leaderboards & AI duels.
            </p>
          </div>
        </div>

        {/* Error Notice */}
        {errorMsg && (
          <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5 animate-shake">
            <span className="font-bold">Notice:</span>
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Login Box */}
        <div className="rounded-[32px] bg-gradient-to-b from-[#12192e] via-[#0e1426] to-[#080d1a] border border-white/15 p-6 sm:p-7 shadow-[0_20px_60px_rgba(0,0,0,0.7)] backdrop-blur-xl relative overflow-hidden">
          {/* Subtle top edge highlight */}
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/30 to-transparent" />

          {/* If already signed in with Google */}
          {authUser ? (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-white/[0.05] border border-white/10 flex items-center gap-3.5">
                {authUser.photoURL ? (
                  <img
                    src={authUser.photoURL}
                    alt={authUser.displayName || 'User'}
                    referrerPolicy="no-referrer"
                    className="w-12 h-12 rounded-full border-2 border-emerald-400 shadow-md object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-black text-lg flex items-center justify-center border-2 border-white/20 shadow-md">
                    {authUser.displayName ? authUser.displayName.charAt(0).toUpperCase() : 'G'}
                  </div>
                )}
                <div className="min-w-0">
                  <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider block">
                    Signed In with Google
                  </span>
                  <h3 className="text-sm sm:text-base font-bold text-white truncate">
                    {authUser.displayName || authUser.email}
                  </h3>
                  <span className="text-xs text-slate-400 block truncate">
                    {authUser.email}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleContinueWithExisting}
                className="w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-amber-500 via-pink-500 to-indigo-600 hover:opacity-95 text-white font-display font-black text-sm sm:text-base flex items-center justify-center gap-2 shadow-xl shadow-pink-900/30 transition active:scale-[0.98] cursor-pointer"
              >
                <span>Enter Challenge Me</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={handleGoogleLogin}
                className="w-full py-2.5 px-4 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-xs font-bold text-slate-300 hover:text-white border border-white/10 transition cursor-pointer"
              >
                Switch Google Account
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Google Log In Primary Button */}
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={loadingGoogle}
                className="w-full py-3.5 px-5 rounded-2xl bg-white hover:bg-slate-100 text-slate-900 font-display font-black text-sm sm:text-base flex items-center justify-center gap-3 shadow-xl transition-all duration-200 active:scale-[0.98] cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed group"
              >
                {loadingGoogle ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin text-indigo-600" />
                    <span>Connecting to Google...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
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

              <div className="flex items-center gap-3 py-1">
                <div className="h-[1px] flex-1 bg-white/10" />
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">or</span>
                <div className="h-[1px] flex-1 bg-white/10" />
              </div>

              {/* Guest / Quick Start Form */}
              {!isGuestMode ? (
                <button
                  type="button"
                  onClick={() => {
                    haptics.light();
                    setIsGuestMode(true);
                  }}
                  className="w-full py-3 px-4 rounded-2xl bg-white/[0.06] hover:bg-white/[0.1] text-white font-bold text-xs sm:text-sm border border-white/10 transition active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
                >
                  <User className="w-4 h-4 text-slate-400" />
                  <span>Play as Guest / Choose Name</span>
                </button>
              ) : (
                <form onSubmit={handleContinueAsGuest} className="space-y-3 pt-1 animate-in fade-in">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                      Challenger Name
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={guestName}
                        onChange={(e) => setGuestName(e.target.value)}
                        placeholder="Enter your nickname"
                        maxLength={18}
                        className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/20 text-white placeholder-slate-500 text-sm font-bold focus:outline-none focus:border-indigo-400 transition"
                      />
                      <span className="absolute right-3 top-2.5 text-xs text-slate-500">
                        {guestName.length}/18
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="submit"
                      className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs sm:text-sm transition active:scale-95 cursor-pointer shadow-md flex items-center justify-center gap-1.5"
                    >
                      <span>Enter as Guest</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsGuestMode(false)}
                      className="px-3 py-2.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-xs font-bold text-slate-400 hover:text-white border border-white/10 transition cursor-pointer"
                    >
                      Back
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* Perks / Benefits Footer */}
          <div className="pt-4 mt-5 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Cloud Saved & Sync Ready</span>
            </span>
            <span className="text-indigo-300 font-bold">100% Free</span>
          </div>
        </div>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-3 gap-2 px-1">
          <div className="p-2.5 rounded-2xl bg-white/[0.03] border border-white/5 text-center space-y-1">
            <Flame className="w-4 h-4 text-amber-400 mx-auto" />
            <span className="text-[10px] font-bold text-slate-300 block">Daily Streaks</span>
          </div>
          <div className="p-2.5 rounded-2xl bg-white/[0.03] border border-white/5 text-center space-y-1">
            <Trophy className="w-4 h-4 text-pink-400 mx-auto" />
            <span className="text-[10px] font-bold text-slate-300 block">Leaderboard</span>
          </div>
          <div className="p-2.5 rounded-2xl bg-white/[0.03] border border-white/5 text-center space-y-1">
            <Gamepad2 className="w-4 h-4 text-indigo-400 mx-auto" />
            <span className="text-[10px] font-bold text-slate-300 block">AI Duels</span>
          </div>
        </div>
      </div>
    </div>
  );
}
