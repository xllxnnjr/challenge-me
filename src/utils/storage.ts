import { GameState, AppNotification } from '../types';

const STORAGE_KEY = 'challenge_me_state_v2';

export const AVATARS = ['🧑🏾‍🚀', '⚡', '🧠', '🦁', '🦊', '🚀', '🎯', '🔥', '💎', '👾', '🌟', '🦄'];

export const INITIAL_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'notif_welcome',
    title: 'Welcome to Challenge Me! 🎯',
    desc: 'Pick your difficulty level and tackle fast 15-30s brain, reflex, and memory quests.',
    time: 'Just now',
    icon: '👋',
    read: false,
    type: 'system',
  },
  {
    id: 'notif_streak_tip',
    title: 'Daily Streak Bonus Active 🔥',
    desc: 'Log in daily and conquer challenges to keep your flame blazing and earn extra XP multipliers.',
    time: '2h ago',
    icon: '🔥',
    read: false,
    type: 'streak',
  },
  {
    id: 'notif_difficulty',
    title: 'New: Difficulty Tiers & Penalties ⚡',
    desc: 'Play in Easy, Medium, or Hard modes. Beware: wrong answers deduct points from your dashboard!',
    time: 'Today',
    icon: '⚡',
    read: false,
    type: 'challenge',
  },
];

export const DEFAULT_STATE: GameState = {
  points: 0,
  xp: 0,
  done: 0,
  streak: 0,
  lastActiveDate: '',
  lastBonusDate: '',
  history: [15, 25, 20, 40, 35, 50],
  detailedHistory: [],
  unlockedAchievements: [],
  playerName: 'Challenger',
  avatar: '🧑🏾‍🚀',
  soundEnabled: true,
  notifications: INITIAL_NOTIFICATIONS,
};

export function getTodayDateStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function loadGameState(): GameState {
  if (typeof window === 'undefined') return DEFAULT_STATE;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATE;
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_STATE,
      ...parsed,
      notifications: parsed.notifications && parsed.notifications.length > 0
        ? parsed.notifications
        : INITIAL_NOTIFICATIONS,
    };
  } catch (e) {
    console.error('Failed to load game state:', e);
    return DEFAULT_STATE;
  }
}

export function saveGameState(state: GameState): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('Failed to save game state:', e);
  }
}

export function calculateLevel(xp: number): number {
  return Math.floor(xp / 100) + 1;
}

export function calculateStreak(lastActive: string, currentStreak: number): number {
  const today = getTodayDateStr();
  if (!lastActive) return 1;
  if (lastActive === today) return currentStreak || 1;

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;

  if (lastActive === yesterdayStr) {
    return (currentStreak || 0) + 1;
  } else {
    // missed days
    return 1;
  }
}
