import { useState, useEffect, useCallback, useRef } from 'react';
import confetti from 'canvas-confetti';
import { GameState, Challenge, ScreenTab, HistoryItem, Difficulty, AppNotification } from './types';
import { CHALLENGES } from './data/challenges';
import { ACHIEVEMENTS } from './data/achievements';
import { loadGameState, saveGameState, DEFAULT_STATE, calculateStreak, calculateLevel, getTodayDateStr } from './utils/storage';
import { sound } from './utils/audio';

import { Header } from './components/Header';
import { Navbar } from './components/Navbar';
import { Toast } from './components/Toast';
import { GameModal } from './components/GameModal';

import { HomeScreen } from './components/screens/HomeScreen';
import { ChallengesScreen } from './components/screens/ChallengesScreen';
import { StatsScreen } from './components/screens/StatsScreen';
import { ProfileScreen } from './components/screens/ProfileScreen';
import { NotificationsScreen } from './components/screens/NotificationsScreen';

export default function App() {
  const [state, setState] = useState<GameState>(DEFAULT_STATE);
  const [currentTab, setCurrentTab] = useState<ScreenTab>('home');
  const [difficulty, setDifficulty] = useState<Difficulty>('Medium');
  const [activeChallenge, setActiveChallenge] = useState<Challenge | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const loginBonusChecked = useRef(false);

  const showToast = useCallback((msg: string) => {
    setToastMsg(msg);
  }, []);

  // Helper to append a notification
  const addNotification = useCallback((notif: Omit<AppNotification, 'id' | 'time' | 'read'>) => {
    const newEntry: AppNotification = {
      ...notif,
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      time: 'Just now',
      read: false,
    };
    setState(prev => ({
      ...prev,
      notifications: [newEntry, ...(prev.notifications || []).slice(0, 19)],
    }));
  }, []);

  // Load state and evaluate Daily Login Bonus on app mount
  useEffect(() => {
    const loaded = loadGameState();
    const today = getTodayDateStr();

    if (loaded.selectedDifficulty) {
      setDifficulty(loaded.selectedDifficulty);
    }

    if (!loginBonusChecked.current) {
      loginBonusChecked.current = true;

      // Check if Daily Login Bonus was already claimed today
      if (loaded.lastBonusDate !== today) {
        // Calculate consecutive day check
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;

        const isConsecutive = loaded.lastBonusDate === yesterdayStr || loaded.lastActiveDate === yesterdayStr;
        const nextStreak = isConsecutive ? (loaded.streak || 0) + 1 : 1;
        const bonusXp = isConsecutive ? 25 + Math.min(nextStreak, 7) * 10 : 25;

        const bonusNotification: AppNotification = {
          id: `notif_bonus_${Date.now()}`,
          title: `Daily Bonus Claimed (+${bonusXp} XP) 🎁`,
          desc: isConsecutive
            ? `Your flame is burning! ${nextStreak}-day consecutive streak active.`
            : `Welcome back! Claimed ${bonusXp} bonus XP for logging in today.`,
          time: 'Just now',
          icon: '🎁',
          read: false,
          type: 'reward',
        };

        const updatedWithBonus: GameState = {
          ...loaded,
          xp: loaded.xp + bonusXp,
          points: loaded.points + bonusXp,
          streak: nextStreak,
          lastBonusDate: today,
          lastActiveDate: today,
          notifications: [bonusNotification, ...(loaded.notifications || [])],
        };

        setState(updatedWithBonus);
        saveGameState(updatedWithBonus);

        // Trigger celebratory audio and toast
        setTimeout(() => {
          sound.playSuccess(updatedWithBonus.soundEnabled);
          try {
            confetti({
              particleCount: 55,
              spread: 75,
              origin: { y: 0.35 },
              colors: ['#ff9f1c', '#ef3fa2', '#793cff', '#58e66b'],
            });
          } catch {}

          if (isConsecutive && nextStreak > 1) {
            showToast(`🔥 ${nextStreak}-Day Streak! Daily Bonus: +${bonusXp} XP`);
          } else {
            showToast(`🎁 Daily Login Bonus: +${bonusXp} XP Claimed!`);
          }
        }, 600);
        return;
      }
    }

    setState(loaded);
  }, [showToast]);

  // Save state on updates
  useEffect(() => {
    saveGameState({
      ...state,
      selectedDifficulty: difficulty,
    });
  }, [state, difficulty]);

  const handleToggleSound = () => {
    const nextVal = !state.soundEnabled;
    setState(prev => ({ ...prev, soundEnabled: nextVal }));
    sound.playClick(nextVal);
    showToast(nextVal ? 'Sound FX Enabled 🔊' : 'Sound FX Muted 🔇');
  };

  const handleChangeDifficulty = (newDiff: Difficulty) => {
    setDifficulty(newDiff);
    setState(prev => ({ ...prev, selectedDifficulty: newDiff }));
    sound.playClick(state.soundEnabled);
    showToast(`Difficulty set to ${newDiff} Tier ${newDiff === 'Easy' ? '🌱' : newDiff === 'Medium' ? '⚡' : '🔥'}`);
  };

  const handleOpenChallenge = (c: Challenge, chosenDiff?: Difficulty) => {
    if (chosenDiff && chosenDiff !== difficulty) {
      setDifficulty(chosenDiff);
    }
    sound.playClick(state.soundEnabled);
    setActiveChallenge(c);
  };

  const handleRandomChallenge = (chosenDiff?: Difficulty) => {
    if (chosenDiff && chosenDiff !== difficulty) {
      setDifficulty(chosenDiff);
    }
    sound.playClick(state.soundEnabled);
    const available = CHALLENGES.filter(c => c.id !== activeChallenge?.id);
    const random = available[Math.floor(Math.random() * available.length)] || CHALLENGES[0];
    setActiveChallenge(random);
  };

  // Penalty handler: automatically deducts points from user's dashboard upon wrong answer
  const handlePenalty = (deductAmount: number = 5, reason?: string) => {
    setState(prev => {
      const nextPoints = Math.max(0, prev.points - deductAmount);
      const nextXp = Math.max(0, prev.xp - deductAmount);
      return {
        ...prev,
        points: nextPoints,
        xp: nextXp,
      };
    });
    sound.playError(state.soundEnabled);
    showToast(`❌ ${reason ? reason + ' • ' : ''}-${deductAmount} pts penalty!`);
  };

  const handleCompleteChallenge = (challenge: Challenge, earnedPoints: number) => {
    setState(prev => {
      const today = getTodayDateStr();
      const updatedStreak = calculateStreak(prev.lastActiveDate, prev.streak);
      const nextPoints = prev.points + earnedPoints;
      const nextXp = prev.xp + earnedPoints;
      const nextDone = prev.done + 1;

      // Update sparkline points history
      const nextHistory = [...prev.history, earnedPoints];
      if (nextHistory.length > 15) nextHistory.shift();

      // Detailed history item
      const historyEntry: HistoryItem = {
        id: `${Date.now()}_${challenge.id}`,
        challengeId: challenge.id,
        title: challenge.title,
        icon: challenge.icon,
        pts: earnedPoints,
        timestamp: Date.now(),
        dateStr: today,
      };

      const updatedState: GameState = {
        ...prev,
        points: nextPoints,
        xp: nextXp,
        done: nextDone,
        streak: updatedStreak,
        lastActiveDate: today,
        history: nextHistory,
        detailedHistory: [historyEntry, ...(prev.detailedHistory || []).slice(0, 29)],
      };

      // Check newly unlocked achievements
      const newlyUnlocked: string[] = [];
      ACHIEVEMENTS.forEach(a => {
        if (!prev.unlockedAchievements.includes(a.id) && a.isUnlocked(updatedState)) {
          newlyUnlocked.push(a.id);
        }
      });

      if (newlyUnlocked.length > 0) {
        updatedState.unlockedAchievements = [
          ...prev.unlockedAchievements,
          ...newlyUnlocked,
        ];
        // Give bonus XP
        const bonusXp = newlyUnlocked.reduce((sum, id) => {
          const ach = ACHIEVEMENTS.find(x => x.id === id);
          return sum + (ach?.xpReward || 0);
        }, 0);
        updatedState.xp += bonusXp;

        // Push achievement notification
        const achNames = newlyUnlocked.map(id => ACHIEVEMENTS.find(x => x.id === id)?.title).filter(Boolean).join(', ');
        const notif: AppNotification = {
          id: `notif_ach_${Date.now()}`,
          title: `🏆 New Trophy: ${achNames}`,
          desc: `Earned +${bonusXp} bonus XP for unlocking ${newlyUnlocked.length} new milestone!`,
          time: 'Just now',
          icon: '🏆',
          read: false,
          type: 'achievement',
        };
        updatedState.notifications = [notif, ...(updatedState.notifications || [])];

        setTimeout(() => {
          showToast(`🏆 Achievement Unlocked! (+${bonusXp} bonus XP)`);
        }, 1200);
      }

      return updatedState;
    });
  };

  const handleUpdatePlayer = (name: string, avatar: string) => {
    setState(prev => ({
      ...prev,
      playerName: name,
      avatar: avatar,
    }));
  };

  const handleResetGame = () => {
    const reset = { ...DEFAULT_STATE, playerName: state.playerName, avatar: state.avatar, soundEnabled: state.soundEnabled };
    setState(reset);
    saveGameState(reset);
    showToast('Progress has been reset! 🔄');
  };

  // Notification action handlers
  const handleMarkAllNotificationsRead = () => {
    setState(prev => ({
      ...prev,
      notifications: (prev.notifications || []).map(n => ({ ...n, read: true })),
    }));
    sound.playClick(state.soundEnabled);
    showToast('All notifications marked as read! ✓');
  };

  const handleClearAllNotifications = () => {
    setState(prev => ({
      ...prev,
      notifications: [],
    }));
    sound.playClick(state.soundEnabled);
    showToast('Notifications cleared');
  };

  const handleNotificationClick = (notif: AppNotification) => {
    // Mark as read
    setState(prev => ({
      ...prev,
      notifications: (prev.notifications || []).map(n => n.id === notif.id ? { ...n, read: true } : n),
    }));

    if (notif.type === 'challenge' || notif.type === 'streak') {
      setCurrentTab('challenges');
    } else if (notif.type === 'achievement') {
      setCurrentTab('stats');
    }
  };

  const unreadNotificationsCount = (state.notifications || []).filter(n => !n.read).length;

  return (
    <div className="min-h-screen bg-[#070b16] text-[#f7f8ff] flex flex-col items-center justify-start selection:bg-purple-500 selection:text-white">
      {/* Centered Mobile Container */}
      <div className="w-full max-w-[500px] min-h-screen px-4 pt-2 pb-24 flex flex-col">
        {/* Custom Clean Top Bar: Profile Pic on Left | App Logo in Center | Notifications on Right */}
        <Header
          state={state}
          unreadCount={unreadNotificationsCount}
          onOpenProfile={() => setCurrentTab('profile')}
          onOpenNotifications={() => setCurrentTab('notifications')}
        />

        {/* Current Tab Screen View */}
        <main className="flex-1 w-full">
          {currentTab === 'home' && (
            <HomeScreen
              state={state}
              currentDifficulty={difficulty}
              onSelectChallenge={handleOpenChallenge}
              onRandomChallenge={handleRandomChallenge}
              onViewAllChallenges={() => setCurrentTab('challenges')}
            />
          )}

          {currentTab === 'challenges' && (
            <ChallengesScreen
              currentDifficulty={difficulty}
              onChangeDifficulty={handleChangeDifficulty}
              onSelectChallenge={handleOpenChallenge}
              onRandomChallenge={handleRandomChallenge}
            />
          )}

          {currentTab === 'stats' && (
            <StatsScreen state={state} />
          )}

          {currentTab === 'profile' && (
            <ProfileScreen
              state={state}
              currentDifficulty={difficulty}
              onChangeDifficulty={handleChangeDifficulty}
              onUpdatePlayer={handleUpdatePlayer}
              onToggleSound={handleToggleSound}
              onResetGame={handleResetGame}
              onToast={showToast}
            />
          )}

          {currentTab === 'notifications' && (
            <NotificationsScreen
              notifications={state.notifications || []}
              onMarkAllRead={handleMarkAllNotificationsRead}
              onClearAll={handleClearAllNotifications}
              onNotificationClick={handleNotificationClick}
              onBackToHome={() => setCurrentTab('home')}
            />
          )}
        </main>
      </div>

      {/* Floating Bottom Navigation (silent page switching) */}
      <Navbar
        currentTab={currentTab}
        onTabChange={(tab) => {
          setCurrentTab(tab);
        }}
      />

      {/* Interactive Game Modal Sheet */}
      <GameModal
        challenge={activeChallenge}
        difficulty={difficulty}
        playerLevel={calculateLevel(state.xp)}
        onChangeDifficulty={handleChangeDifficulty}
        onClose={() => setActiveChallenge(null)}
        onComplete={handleCompleteChallenge}
        onNextRandom={handleRandomChallenge}
        onToast={showToast}
        onPenalty={handlePenalty}
        soundEnabled={state.soundEnabled}
      />

      {/* Toast Notification */}
      <Toast message={toastMsg} onClear={() => setToastMsg(null)} />
    </div>
  );
}
