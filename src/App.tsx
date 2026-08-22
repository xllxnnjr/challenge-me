import { useState, useEffect, useCallback, useRef } from 'react';
import confetti from 'canvas-confetti';
import { GameState, Challenge, ScreenTab, HistoryItem, Difficulty, AppNotification, AuthUser } from './types';
import { CHALLENGES } from './data/challenges';
import { ACHIEVEMENTS } from './data/achievements';
import { loadGameState, saveGameState, DEFAULT_STATE, calculateStreak, calculateLevel, getTodayDateStr } from './utils/storage';
import { sound } from './utils/audio';
import { haptics } from './utils/haptics';
import {
  auth,
  saveGameStateToCloud,
  loadGameStateFromCloud,
  subscribeToCloudSave,
  removeDeviceFromCloud,
  updateDevicePermissionsInCloud,
  checkRedirectAuth,
} from './lib/firebase';
import { DevicePermissions } from './types';
import { getDeviceId } from './utils/device';
import { onAuthStateChanged } from 'firebase/auth';

import { Header } from './components/Header';
import { Navbar } from './components/Navbar';
import { Toast } from './components/Toast';
import { GameModal } from './components/GameModal';

import { HomeScreen } from './components/screens/HomeScreen';
import { ChallengesScreen } from './components/screens/ChallengesScreen';
import { LeaderboardScreen } from './components/screens/LeaderboardScreen';
import { StatsScreen } from './components/screens/StatsScreen';
import { ProfileScreen } from './components/screens/ProfileScreen';
import { NotificationsScreen } from './components/screens/NotificationsScreen';
import { AuthScreen } from './components/screens/AuthScreen';
import { LoginPage } from './components/LoginPage';

export default function App() {
  const [hasEnteredApp, setHasEnteredApp] = useState<boolean>(() => {
    return sessionStorage.getItem('challenge_me_session_entered') === 'true';
  });
  const [state, setState] = useState<GameState>(DEFAULT_STATE);
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [currentTab, setCurrentTab] = useState<ScreenTab>('home');
  const [difficulty, setDifficulty] = useState<Difficulty>('Medium');
  const [activeChallenge, setActiveChallenge] = useState<Challenge | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const loginBonusChecked = useRef(false);
  const cloudSyncTimeoutRef = useRef<any>(null);
  const isReceivingCloudSnapshotRef = useRef<boolean>(false);


  const authUserRef = useRef<AuthUser | null>(authUser);
  authUserRef.current = authUser;
  const stateRef = useRef<GameState>(state);
  stateRef.current = state;

  const showToast = useCallback((msg: string) => {
    setToastMsg(msg);
  }, []);

  const handleClearToast = useCallback(() => {
    setToastMsg(null);
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

  // Auth state listener and quiet cloud data restoration on device switch
  useEffect(() => {
    // Check for redirect result if redirect login was used
    checkRedirectAuth().catch(console.warn);

    let unsubscribeSnapshot: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      // Clean up previous Firestore snapshot listener if any
      if (unsubscribeSnapshot) {
        unsubscribeSnapshot();
        unsubscribeSnapshot = null;
      }

      if (firebaseUser) {
        const userObj: AuthUser = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
        };
        setAuthUser((prev) => (prev?.uid === userObj.uid ? prev : userObj));

        // Fetch cloud data for initial quiet restore
        try {
          const { state: cloudState, devices, lastSyncTimestamp } = await loadGameStateFromCloud(firebaseUser.uid);
          if (cloudState) {
            setState((prev) => {
              // Seamless merge: if cloud save has more XP or higher points, restore it!
              const shouldUseCloud = (cloudState.xp || 0) >= (prev.xp || 0);
              const merged: GameState = shouldUseCloud
                ? {
                    ...DEFAULT_STATE,
                    ...cloudState,
                    playerName: cloudState.playerName || firebaseUser.displayName || prev.playerName,
                    avatar: cloudState.avatar || prev.avatar,
                    connectedDevices: devices,
                    lastCloudSync: lastSyncTimestamp || Date.now(),
                    notifications: prev.notifications && prev.notifications.length > 0 ? prev.notifications : cloudState.notifications,
                  }
                : {
                    ...prev,
                    connectedDevices: devices,
                    lastCloudSync: Date.now(),
                  };

              saveGameState(merged);
              return merged;
            });
          } else {
            // First time user logged in: sync local state to cloud immediately in background
            saveGameStateToCloud(firebaseUser.uid, stateRef.current, {
              email: firebaseUser.email,
              displayName: firebaseUser.displayName,
              photoURL: firebaseUser.photoURL,
            }).catch(console.error);
          }
        } catch (e) {
          console.warn('Quiet background cloud state load notice:', e);
        }

        // Attach quiet real-time listener for instant bidirectional sync across all devices
        unsubscribeSnapshot = subscribeToCloudSave(firebaseUser.uid, (cloudState, devices, updatedAt, updatedByDeviceId) => {
          if (!cloudState) return;

          // If change originated from this device, skip updating state to prevent re-render loops
          if (updatedByDeviceId && updatedByDeviceId === getDeviceId()) {
            return;
          }

          // Set guard to prevent echoing back what we just received
          isReceivingCloudSnapshotRef.current = true;

          // Update difficulty state if it was changed on another device
          if (cloudState.selectedDifficulty) {
            setDifficulty((currentDiff) => {
              if (cloudState.selectedDifficulty && cloudState.selectedDifficulty !== currentDiff) {
                return cloudState.selectedDifficulty;
              }
              return currentDiff;
            });
          }

          setState((prev) => {
            const merged: GameState = {
              ...prev,
              points: typeof cloudState.points === 'number' ? cloudState.points : prev.points,
              xp: typeof cloudState.xp === 'number' ? cloudState.xp : prev.xp,
              done: typeof cloudState.done === 'number' ? cloudState.done : prev.done,
              streak: typeof cloudState.streak === 'number' ? cloudState.streak : prev.streak,
              lastActiveDate: cloudState.lastActiveDate || prev.lastActiveDate,
              lastBonusDate: cloudState.lastBonusDate || prev.lastBonusDate,
              history: cloudState.history && cloudState.history.length > 0 ? cloudState.history : prev.history,
              detailedHistory: cloudState.detailedHistory || prev.detailedHistory,
              unlockedAchievements: cloudState.unlockedAchievements || prev.unlockedAchievements,
              playerName: cloudState.playerName || prev.playerName,
              avatar: cloudState.avatar || prev.avatar,
              profileBanner: cloudState.profileBanner !== undefined ? cloudState.profileBanner : prev.profileBanner,
              soundEnabled: cloudState.soundEnabled !== undefined ? cloudState.soundEnabled : prev.soundEnabled,
              hapticsEnabled: cloudState.hapticsEnabled !== undefined ? cloudState.hapticsEnabled : prev.hapticsEnabled,
              friendNotificationsEnabled: cloudState.friendNotificationsEnabled !== undefined ? cloudState.friendNotificationsEnabled : prev.friendNotificationsEnabled,
              selectedDifficulty: cloudState.selectedDifficulty || prev.selectedDifficulty || 'Medium',
              friendIds: cloudState.friendIds || prev.friendIds,
              notifications: cloudState.notifications !== undefined ? cloudState.notifications : prev.notifications,
              connectedDevices: devices,
              activeSession: cloudState.activeSession,
              lastCloudSync: updatedAt || Date.now(),
            };
            saveGameState(merged);
            return merged;
          });

          setTimeout(() => {
            isReceivingCloudSnapshotRef.current = false;
          }, 400);
        });
      } else {
        setAuthUser(null);
      }
    });

    // Listen to online events to drain and sync any queued offline actions
    const handleOnline = () => {
      const currentAuth = authUserRef.current;
      if (currentAuth?.uid) {
        saveGameStateToCloud(currentAuth.uid, stateRef.current, {
          email: currentAuth.email,
          displayName: currentAuth.displayName,
          photoURL: currentAuth.photoURL,
        }).then(() => {
          showToast('Connection restored • Synced 🌐');
        }).catch(() => {});
      }
    };
    window.addEventListener('online', handleOnline);

    return () => {
      unsubscribeAuth();
      window.removeEventListener('online', handleOnline);
      if (unsubscribeSnapshot) {
        unsubscribeSnapshot();
      }
    };
  }, []); // Run on mount only to prevent re-subscribing on auth state change

  // Save state on updates and debounced quiet cloud sync in background
  useEffect(() => {
    const updatedState: GameState = {
      ...state,
      selectedDifficulty: difficulty,
      activeSession: {
        currentScreen: currentTab,
        activeChallengeId: activeChallenge?.id,
        lastActionTimestamp: Date.now(),
        deviceId: getDeviceId(),
      },
    };
    saveGameState(updatedState);

    // If authenticated and not in the middle of receiving snapshot, quietly sync in background
    if (authUser?.uid && !isReceivingCloudSnapshotRef.current) {
      if (cloudSyncTimeoutRef.current) {
        clearTimeout(cloudSyncTimeoutRef.current);
      }
      cloudSyncTimeoutRef.current = setTimeout(() => {
        saveGameStateToCloud(authUser.uid, updatedState, {
          email: authUser.email,
          displayName: authUser.displayName,
          photoURL: authUser.photoURL,
        }).catch((err) => console.warn('Quiet background auto-sync notice:', err));
      }, 500); // 500ms safe debounced sync
    }
  }, [state, difficulty, currentTab, activeChallenge, authUser]);

  // Remove a connected device handler
  const handleRemoveDevice = async (deviceId: string) => {
    if (!authUser?.uid) return;
    try {
      const updatedDevices = await removeDeviceFromCloud(authUser.uid, deviceId);
      setState((prev) => ({
        ...prev,
        connectedDevices: updatedDevices,
      }));
      showToast('Device removed from your account 📱');
    } catch (err) {
      console.error('Failed to remove device:', err);
      showToast('Could not remove device. Please try again.');
    }
  };

  // Update permissions for a device handler
  const handleUpdatePermissions = async (deviceId: string, permissions: DevicePermissions) => {
    if (!authUser?.uid) return;
    try {
      const updatedDevices = await updateDevicePermissionsInCloud(authUser.uid, deviceId, permissions);
      setState((prev) => ({
        ...prev,
        connectedDevices: updatedDevices,
      }));
      showToast('Device permissions updated 🔒');
    } catch (err) {
      console.error('Failed to update device permissions:', err);
      showToast('Could not update permissions.');
    }
  };

  // Auth Action Handlers
  const handleEnterApp = (user?: AuthUser | null, cloudState?: GameState | null, guestName?: string) => {
    if (user) {
      setAuthUser(user);
      if (cloudState) {
        setState((prev) => {
          const merged: GameState = {
            ...DEFAULT_STATE,
            ...cloudState,
            playerName: cloudState.playerName || user.displayName || prev.playerName,
            avatar: cloudState.avatar || prev.avatar,
            lastCloudSync: Date.now(),
            notifications: prev.notifications && prev.notifications.length > 0 ? prev.notifications : cloudState.notifications,
          };
          saveGameState(merged);
          return merged;
        });
      }
    } else if (guestName) {
      setState((prev) => {
        const updated = { ...prev, playerName: guestName };
        saveGameState(updated);
        return updated;
      });
    }
    sessionStorage.setItem('challenge_me_session_entered', 'true');
    setHasEnteredApp(true);
  };

  const handleAuthSuccess = (user: AuthUser, cloudState: GameState | null) => {
    setAuthUser(user);
    if (cloudState) {
      // Promptly merge / restore
      setState((prev) => {
        const merged: GameState = {
          ...DEFAULT_STATE,
          ...cloudState,
          playerName: cloudState.playerName || user.displayName || prev.playerName,
          avatar: cloudState.avatar || prev.avatar,
          lastCloudSync: Date.now(),
          notifications: prev.notifications,
        };
        saveGameState(merged);
        return merged;
      });
    } else {
      // Save current local to cloud
      saveGameStateToCloud(user.uid, state, {
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
      }).catch(console.error);
    }
  };

  const handleSignOut = () => {
    setAuthUser(null);
    sessionStorage.removeItem('challenge_me_session_entered');
    setHasEnteredApp(false);
  };

  const handleSyncStateToCloud = async () => {
    if (!authUser?.uid) return;
    await saveGameStateToCloud(authUser.uid, state, {
      email: authUser.email,
      displayName: authUser.displayName,
      photoURL: authUser.photoURL,
    });
    setState((p) => ({ ...p, lastCloudSync: Date.now() }));
  };

  const handleRestoreFromCloud = (cloudState: GameState) => {
    setState((prev) => {
      const merged: GameState = {
        ...DEFAULT_STATE,
        ...cloudState,
        playerName: cloudState.playerName || authUser?.displayName || prev.playerName,
        avatar: cloudState.avatar || prev.avatar,
        lastCloudSync: Date.now(),
        notifications: prev.notifications,
      };
      saveGameState(merged);
      return merged;
    });
  };


  // Sync Haptics configuration
  useEffect(() => {
    haptics.setEnabled(state.hapticsEnabled !== false);
  }, [state.hapticsEnabled]);

  // Periodic active friend detection & notification
  useEffect(() => {
    if (state.friendNotificationsEnabled === false) return;

    // Trigger an initial friend active pulse after 20s if no recent friend alert
    const timer = setTimeout(() => {
      const activeFriends = [
        { name: 'Elena Rostova', cat: 'Spatial Matrix' },
        { name: 'Samir Patel', cat: 'Speed & Reflex' },
        { name: 'Marcus Chen', cat: 'Mental Math' },
        { name: 'Zara Sterling', cat: 'Riddles & Wordplay' },
      ];
      const friend = activeFriends[Math.floor(Math.random() * activeFriends.length)];
      
      const newNotif: AppNotification = {
        id: `notif_friend_live_${Date.now()}`,
        title: `🟢 ${friend.name} is Active Now!`,
        desc: `${friend.name} is currently training in ${friend.cat}. Challenge them to a duel!`,
        time: 'Just now',
        icon: '👥',
        read: false,
        type: 'friend_active',
      };

      setState((prev) => ({
        ...prev,
        notifications: [newNotif, ...(prev.notifications || []).slice(0, 25)],
      }));

      haptics.friendActive();
      sound.playBonus(state.soundEnabled);
      showToast(`🟢 Friend Active: ${friend.name} is online!`);
    }, 25000);

    return () => clearTimeout(timer);
  }, [state.friendNotificationsEnabled, state.soundEnabled, showToast]);

  const handleToggleSound = () => {
    const nextVal = !state.soundEnabled;
    setState(prev => ({ ...prev, soundEnabled: nextVal }));
    sound.playClick(nextVal);
    showToast(nextVal ? 'Sound FX Enabled 🔊' : 'Sound FX Muted 🔇');
  };

  const handleToggleHaptics = () => {
    const nextVal = state.hapticsEnabled === false ? true : false;
    setState(prev => ({ ...prev, hapticsEnabled: nextVal }));
    haptics.setEnabled(nextVal);
    if (nextVal) {
      haptics.success();
      showToast('Haptic Feedback Enabled 📳');
    } else {
      showToast('Haptic Feedback Disabled');
    }
  };

  const handleToggleFriendNotifications = () => {
    const nextVal = state.friendNotificationsEnabled === false ? true : false;
    setState(prev => ({ ...prev, friendNotificationsEnabled: nextVal }));
    haptics.selection();
    showToast(nextVal ? 'Friend Activity Alerts Enabled 👥' : 'Friend Alerts Muted');
  };

  const handleSimulateFriendActive = () => {
    const sampleFriends = [
      { name: 'Luna Vance', cat: 'Pattern Sequence' },
      { name: 'Elena Rostova', cat: 'Spatial Matrix' },
      { name: 'Samir Patel', cat: 'Reflex Tap' },
      { name: 'Alex Rivera', cat: 'Quantum Logic' },
    ];
    const friend = sampleFriends[Math.floor(Math.random() * sampleFriends.length)];

    const simNotif: AppNotification = {
      id: `notif_friend_active_${Date.now()}`,
      title: `🟢 Friend Active: ${friend.name} is online!`,
      desc: `${friend.name} is active in ${friend.cat} and waiting for challengers.`,
      time: 'Just now',
      icon: '👥',
      read: false,
      type: 'friend_active',
    };

    setState(prev => ({
      ...prev,
      notifications: [simNotif, ...(prev.notifications || [])],
    }));

    haptics.friendActive();
    sound.playBonus(state.soundEnabled);
    showToast(`🟢 Friend Active: ${friend.name} is online now! 📳`);
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

  const handleUpdatePlayer = (name: string, avatar: string, profileBanner?: string, username?: string) => {
    setState(prev => {
      const isNewUsername = Boolean(username && username !== prev.username);
      const updated: GameState = {
        ...prev,
        playerName: name,
        avatar: avatar,
        ...(username ? { username } : {}),
        ...(isNewUsername ? { hasChangedUsername: true, usernameChangesCount: (prev.usernameChangesCount || 0) + 1 } : {}),
        ...(profileBanner !== undefined ? { profileBanner } : {}),
      };
      saveGameState(updated);
      return updated;
    });
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

  const handleDuelReward = (earnedPoints: number, message: string) => {
    setState(prev => ({
      ...prev,
      points: prev.points + earnedPoints,
      xp: prev.xp + earnedPoints,
    }));
    showToast(message);
  };

  const unreadNotificationsCount = (state.notifications || []).filter(n => !n.read).length;

  if (!hasEnteredApp) {
    return (
      <>
        <LoginPage
          authUser={authUser}
          state={state}
          onEnterApp={handleEnterApp}
          onToast={showToast}
        />
        <Toast message={toastMsg} onClear={() => setToastMsg(null)} />
      </>
    );
  }

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

        {/* Current Tab Screen View with Smooth Transition */}
        <main className="flex-1 w-full">
          <div key={currentTab} className="w-full animate-in fade-in duration-200">
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
                onToast={showToast}
                soundEnabled={state.soundEnabled}
              />
            )}

            {currentTab === 'leaderboard' && (
              <LeaderboardScreen
                state={state}
                onToast={showToast}
                onStartChallenge={() => setCurrentTab('challenges')}
                onReward={handleDuelReward}
                onPenalty={handlePenalty}
                currentDifficulty={difficulty}
              />
            )}

            {currentTab === 'stats' && (
              <StatsScreen state={state} onToast={showToast} />
            )}

            {currentTab === 'profile' && (
              <ProfileScreen
                state={state}
                authUser={authUser}
                currentDifficulty={difficulty}
                onChangeDifficulty={handleChangeDifficulty}
                onUpdatePlayer={handleUpdatePlayer}
                onToggleSound={handleToggleSound}
                onToggleHaptics={handleToggleHaptics}
                onToggleFriendNotifications={handleToggleFriendNotifications}
                onSimulateFriendActive={handleSimulateFriendActive}
                onOpenAuth={() => setCurrentTab('auth')}
                onRemoveDevice={handleRemoveDevice}
                onUpdatePermissions={handleUpdatePermissions}
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

            {currentTab === 'auth' && (
              <AuthScreen
                authUser={authUser}
                state={state}
                onAuthSuccess={handleAuthSuccess}
                onSignOut={handleSignOut}
                onSyncStateToCloud={handleSyncStateToCloud}
                onRestoreFromCloud={handleRestoreFromCloud}
                onRemoveDevice={handleRemoveDevice}
                onToast={showToast}
                onNavigateHome={() => setCurrentTab('home')}
              />
            )}
          </div>
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
      <Toast message={toastMsg} onClear={handleClearToast} />
    </div>
  );
}
