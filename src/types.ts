export type MainCategory = 'All' | 'Math & Logic' | 'Social & Party' | 'Memory & Focus' | 'Speed & Reflex';

export type Category = MainCategory | 'Brain' | 'Memory' | 'Action' | 'Fun';

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
  | 'compare';

export interface Challenge {
  id: string;
  cat: string; // e.g. 'Math & Logic', 'Social & Party', 'Memory & Focus', 'Speed & Reflex'
  subCat: string; // e.g. 'Arithmetic Speed', 'Vocal & Speech', 'Working Memory'
  icon: string;
  title: string;
  desc: string;
  pts: number;
  type: ChallengeType;
  difficulty?: Difficulty;
  tags?: string[];
}

export interface CategoryMetadata {
  id: string;
  name: string;
  icon: string;
  desc: string;
  color: string;
  badgeColor: string;
  subCategories: string[];
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
  type: 'streak' | 'achievement' | 'challenge' | 'system' | 'reward';
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
  avatar: string;
  soundEnabled: boolean;
  selectedDifficulty?: Difficulty;
  notifications?: AppNotification[];
}

export type ScreenTab = 'home' | 'challenges' | 'stats' | 'profile' | 'notifications';
