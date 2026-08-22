/**
 * Device vibration / haptics utility designed with Apple-inspired tactile feedback patterns.
 * Gracefully handles browsers and devices that do not support navigator.vibrate.
 */

export class HapticsManager {
  private enabled = true;

  setEnabled(val: boolean) {
    this.enabled = val;
  }

  getEnabled(): boolean {
    return this.enabled;
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  toggle(): boolean {
    this.enabled = !this.enabled;
    return this.enabled;
  }

  private isSupported(): boolean {
    return this.enabled && typeof window !== 'undefined' && 'navigator' in window && typeof navigator.vibrate === 'function';
  }

  /**
   * Light subtle tap feedback (button taps, selection changes)
   */
  light() {
    if (!this.isSupported()) return;
    try {
      navigator.vibrate(12);
    } catch {}
  }

  /**
   * Medium impact (item selection, card flips)
   */
  medium() {
    if (!this.isSupported()) return;
    try {
      navigator.vibrate(25);
    } catch {}
  }

  /**
   * Heavy impact (large actions, countdown start)
   */
  heavy() {
    if (!this.isSupported()) return;
    try {
      navigator.vibrate(45);
    } catch {}
  }

  /**
   * Selection tick for dials, tabs, and toggles
   */
  selection() {
    if (!this.isSupported()) return;
    try {
      navigator.vibrate(8);
    } catch {}
  }

  /**
   * Success notification vibration pattern (challenge cleared, level up)
   */
  success() {
    if (!this.isSupported()) return;
    try {
      navigator.vibrate([25, 45, 55]);
    } catch {}
  }

  /**
   * Error notification vibration pattern (wrong answer, time out, penalty)
   */
  error() {
    if (!this.isSupported()) return;
    try {
      navigator.vibrate([50, 40, 50, 40, 70]);
    } catch {}
  }

  /**
   * Big celebration pattern for trophies and level milestones
   */
  celebration() {
    if (!this.isSupported()) return;
    try {
      navigator.vibrate([40, 40, 40, 40, 80, 50, 120]);
    } catch {}
  }

  /**
   * Distinct tactile rhythm when a friend becomes active in the app
   */
  friendActive() {
    if (!this.isSupported()) return;
    try {
      // Gentle double nudge pulse
      navigator.vibrate([35, 60, 35]);
    } catch {}
  }

  /**
   * Tactile ripple when receiving or sending a cheer / wave to a friend
   */
  friendWave() {
    if (!this.isSupported()) return;
    try {
      navigator.vibrate([20, 30, 20, 30, 40]);
    } catch {}
  }

  /**
   * High-intensity duel launch buzz
   */
  duelChallenge() {
    if (!this.isSupported()) return;
    try {
      navigator.vibrate([50, 30, 70, 40, 90]);
    } catch {}
  }
}

export const haptics = new HapticsManager();
