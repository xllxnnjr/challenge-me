/**
 * Device vibration / haptics utility designed with Apple-inspired tactile feedback patterns.
 * Gracefully handles browsers and devices that do not support navigator.vibrate.
 */

export class HapticsManager {
  private isSupported(): boolean {
    return typeof window !== 'undefined' && 'navigator' in window && typeof navigator.vibrate === 'function';
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
      // Crisp double haptic pulse
      navigator.vibrate([25, 45, 55]);
    } catch {}
  }

  /**
   * Error notification vibration pattern (wrong answer, time out, penalty)
   */
  error() {
    if (!this.isSupported()) return;
    try {
      // Rapid buzz sequence
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
}

export const haptics = new HapticsManager();
