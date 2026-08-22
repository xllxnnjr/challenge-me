import { LeaderboardUser } from '../data/leaderboard';

// Moderation: Banned / offensive words list to protect community safety
const BANNED_TERMS = [
  'admin',
  'moderator',
  'system',
  'official',
  'support',
  'staff',
  'fuck',
  'shit',
  'bitch',
  'asshole',
  'nigger',
  'nigga',
  'faggot',
  'cunt',
  'dick',
  'pussy',
  'whore',
  'slut',
  'bastard',
  'nazi',
  'hitler',
  'kill',
  'suicide',
  'terrorist',
  'pedophile',
  'porn',
  'sex',
];

export interface UsernameValidationResult {
  isValid: boolean;
  error?: string;
  cleanUsername?: string;
}

/**
 * Validate a candidate username against formatting rules, offensive terms, and uniqueness.
 */
export function validateUsername(
  rawUsername: string,
  currentUserId: string,
  existingUsers: LeaderboardUser[] = []
): UsernameValidationResult {
  // Strip leading '@' if user entered it
  const clean = rawUsername.trim().replace(/^@+/, '').toLowerCase();

  // 1. Length check
  if (clean.length < 3) {
    return {
      isValid: false,
      error: 'Username must be at least 3 characters long',
    };
  }

  if (clean.length > 20) {
    return {
      isValid: false,
      error: 'Username cannot exceed 20 characters',
    };
  }

  // 2. Character pattern check (alphanumeric and underscores only)
  const pattern = /^[a-zA-Z0-9_]+$/;
  if (!pattern.test(clean)) {
    return {
      isValid: false,
      error: 'Username can only contain letters, numbers, and underscores (_)',
    };
  }

  // 3. Offensive / reserved words moderation check
  const hasOffensiveTerm = BANNED_TERMS.some((banned) => {
    return clean.includes(banned);
  });

  if (hasOffensiveTerm) {
    return {
      isValid: false,
      error: 'Username contains reserved or offensive terms. Please choose another.',
    };
  }

  // 4. Duplicate / Uniqueness check against other players
  const isDuplicate = existingUsers.some(
    (u) => u.id !== currentUserId && u.username?.toLowerCase() === clean
  );

  if (isDuplicate) {
    return {
      isValid: false,
      error: `@${clean} is already taken by another challenger. Please pick a unique handle.`,
    };
  }

  return {
    isValid: true,
    cleanUsername: clean,
  };
}

/**
 * Normalizes username display with leading '@'
 */
export function formatUsername(username?: string): string {
  if (!username) return '@challenger';
  const clean = username.trim().replace(/^@+/, '');
  return `@${clean}`;
}
