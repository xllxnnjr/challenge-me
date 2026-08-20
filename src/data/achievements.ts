import { Achievement, GameState } from '../types';

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_win',
    icon: '🌟',
    title: 'First Step',
    desc: 'Complete your very first mini challenge.',
    xpReward: 25,
    isUnlocked: (state: GameState) => state.done >= 1,
  },
  {
    id: 'on_fire',
    icon: '🔥',
    title: 'On Fire',
    desc: 'Reach a streak of 3 active days.',
    xpReward: 50,
    isUnlocked: (state: GameState) => state.streak >= 3,
  },
  {
    id: 'streak_legend',
    icon: '⚡',
    title: 'Daily Warrior',
    desc: 'Reach a 7-day streak.',
    xpReward: 100,
    isUnlocked: (state: GameState) => state.streak >= 7,
  },
  {
    id: 'century_club',
    icon: '💯',
    title: 'Century Club',
    desc: 'Earn 100 total challenge points.',
    xpReward: 50,
    isUnlocked: (state: GameState) => state.points >= 100,
  },
  {
    id: 'point_collector',
    icon: '🏆',
    title: 'High Roller',
    desc: 'Accumulate 500 total points.',
    xpReward: 150,
    isUnlocked: (state: GameState) => state.points >= 500,
  },
  {
    id: 'challenge_pro',
    icon: '🎯',
    title: 'Challenge Pro',
    desc: 'Complete 10 mini challenges.',
    xpReward: 75,
    isUnlocked: (state: GameState) => state.done >= 10,
  },
  {
    id: 'level_five',
    icon: '👑',
    title: 'Grand Master',
    desc: 'Reach Player Level 5.',
    xpReward: 200,
    isUnlocked: (state: GameState) => Math.floor(state.xp / 100) + 1 >= 5,
  },
  {
    id: 'polymath',
    icon: '🧠',
    title: 'Versatile Mind',
    desc: 'Complete 25 total challenges across all vibes.',
    xpReward: 250,
    isUnlocked: (state: GameState) => state.done >= 25,
  }
];
