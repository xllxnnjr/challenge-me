import { GameState, AppNotification } from '../types';

const STORAGE_KEY = 'challenge_me_state_v2';

export const AVATARS = [
  '🧑🏾‍🚀', // 1. Astronaut
  '🥷',   // 2. Ninja
  '🧙‍♂️',  // 3. Wizard
  '🦸',   // 4. Superhero
  '🤖',   // 5. Cyborg Robot
  '👩‍💻',  // 6. Cyber Dev
  '👩‍🔬',  // 7. Quantum Scientist
  '🔥',   // 8. Blaze Flame
  '⚡',   // 9. Thunder Lightning
  '🧠',   // 10. Cyber Brain
  '🐉',   // 11. Mythic Dragon
  '🦅',   // 12. Sky Phoenix
  '🐯',   // 13. Shadow Tiger
  '🦊',   // 14. Swift Fox
  '🦁',   // 15. Golden Lion
  '👾',   // 16. Pixel Alien
  '🦄',   // 17. Star Unicorn
  '🌟',   // 18. Radiant Star
  '🎯',   // 19. Bullseye Sniper
  '🏆',   // 20. Grand Champion
];

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
    id: 'notif_friend_req_1',
    title: 'Friend Request: Charlotte Harper 👥',
    desc: '@charlotte_speed sent you a friend request. Tap to accept or view profile!',
    time: '10m ago',
    icon: '👥',
    read: false,
    type: 'friend_request',
    friendId: 'user_7',
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
  {
    id: 'notif_friend_active_init',
    title: 'Friend Active: Emma Ema is online 🟢',
    desc: '@emma_ema is now active and challenging players in the Science & Cosmos arena!',
    time: '5m ago',
    icon: '👥',
    read: false,
    type: 'friend_active',
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
  username: 'challenger_1',
  hasChangedUsername: false,
  usernameChangesCount: 0,
  avatar: '🧑🏾‍🚀',
  profileBanner: 'from-indigo-900/60 via-purple-950/40 to-[#070b16]',
  soundEnabled: true,
  hapticsEnabled: true,
  friendNotificationsEnabled: true,
  friendIds: ['user_1', 'user_2', 'user_4'],
  friendRequestsIncoming: ['user_7', 'user_10'],
  friendRequestsOutgoing: [],
  customChallenges: [],
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
