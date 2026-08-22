export type MainCategory =
  | 'All'
  | 'Cinema & Pop Culture'
  | 'Detective & Mystery'
  | 'Science & Knowledge'
  | 'Math & Logic'
  | 'Memory & Focus'
  | 'Speed & Reflex'
  | 'Language & Words'
  | 'Social & Party';

export type Category = MainCategory | 'Brain' | 'Memory' | 'Action' | 'Fun' | 'Educational';

export type Difficulty = 'Easy' | 'Medium' | 'Hard';

export type ChallengeType =
  | 'math'
  | 'memory'
  | 'reaction'
  | 'number'
  | 'draw'
  | 'twister'
  | 'pattern'
  | 'target'
  | 'stroop'
  | 'scramble'
  | 'pairs'
  | 'chimp'
  | 'speedtap'
  | 'rhythm'
  | 'trivia'
  | 'truth'
  | 'compare'
  | 'voice_riddle'
  | 'edu_quiz'
  | 'emoji_riddle'
  | 'simon'
  | 'cinema_quiz'
  | 'detective_riddle'
  | 'code_breaker'
  | 'math24'
  | 'flag_quiz'
  | 'pitch_match'
  | 'anagram_blitz';

export interface Challenge {
  id: string;
  cat: string;
  subCat: string;
  icon: string;
  title: string;
  desc: string;
  pts: number;
  type: ChallengeType;
  difficulty?: Difficulty;
  tags?: string[];
  backdropGradient?: string;
  rating?: string;
  iconUrl?: string;
  iconType?: 'emoji' | 'svg' | 'image';
}

export interface CategoryMetadata {
  id: string;
  name: string;
  icon: string;
  desc: string;
  synopsis?: string;
  color: string;
  badgeColor: string;
  subCategories: string[];
  gradient: string;
  ratingScore: number;
  badge?: string; // e.g. "FEATURED", "POPULAR", "HIGH SPEED", "LOGIC"
  gamesCountLabel?: string;
  tags?: string[];
}

export interface Achievement {
  id: string;
  icon: string;
  title: string;
  desc: string;
  xpReward: number;
  isUnlocked: (state: GameState) => boolean;
}

export interface HistoryItem {
  id: string;
  challengeId: string;
  title: string;
  icon: string;
  pts: number;
  timestamp: number;
  dateStr: string;
}

export interface AppNotification {
  id: string;
  title: string;
  desc: string;
  time: string;
  icon: string;
  read: boolean;
  type: 'streak' | 'achievement' | 'challenge' | 'system' | 'reward' | 'friend' | 'friend_active' | 'friend_wave' | 'friend_request';
  friendId?: string;
}

export interface FriendRequest {
  id: string;
  fromUserId: string;
  fromUserName: string;
  fromUserUsername: string;
  fromUserAvatar: string;
  toUserId: string;
  createdAt: number;
}

export interface DuelRound {
  roundNum: number;
  title: string;
  type: ChallengeType;
  instructions: string;
  targetGoal: string;
  timeLimitSec: number;
}

export interface AIDuel {
  id: string;
  title: string;
  storyline: string;
  challengerName: string;
  opponentName: string;
  opponentAvatar: string;
  wagerPoints: number;
  difficulty: Difficulty;
  refereeBanter: string;
  rounds: DuelRound[];
}

export interface DevicePermissions {
  audio: boolean;
  haptics: boolean;
  notifications: boolean;
  cloudSync: boolean;
}

export interface ConnectedDevice {
  id: string;
  name: string;
  type: 'desktop' | 'mobile' | 'tablet';
  browser: string;
  os: string;
  lastActive: number;
  isCurrent?: boolean;
  location?: string;
  screenResolution?: string;
  batteryLevel?: number | null;
  batteryCharging?: boolean | null;
  onlineStatus?: boolean;
  currentActivity?: string;
  activeScreen?: string;
  permissions?: DevicePermissions;
}

export interface ActiveSession {
  currentScreen: ScreenTab;
  activeChallengeId?: string;
  lastActionTimestamp: number;
  deviceId: string;
}

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

export interface GameState {
  points: number;
  xp: number;
  done: number;
  streak: number;
  lastActiveDate: string; // YYYY-MM-DD
  lastBonusDate?: string; // YYYY-MM-DD
  history: number[]; // points history for sparkline chart
  detailedHistory: HistoryItem[];
  unlockedAchievements: string[];
  playerName: string;
  username?: string;
  hasChangedUsername?: boolean;
  usernameChangesCount?: number;
  avatar: string;
  profileBanner?: string;
  soundEnabled: boolean;
  hapticsEnabled?: boolean;
  friendNotificationsEnabled?: boolean;
  selectedDifficulty?: Difficulty;
  notifications?: AppNotification[];
  friendIds?: string[];
  friendRequestsIncoming?: string[];
  friendRequestsOutgoing?: string[];
  customChallenges?: Challenge[];
  lastCloudSync?: number;
  connectedDevices?: ConnectedDevice[];
  activeSession?: ActiveSession;
}

export type ScreenTab = 'home' | 'challenges' | 'leaderboard' | 'stats' | 'profile' | 'notifications' | 'auth';


