import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';

/**
 * Mobile Haptics Service for Koin.
 * Delivers precise native tactile feedback on Android/iOS via Capacitor,
 * and gracefully falls back to HTML5 Vibration API or a silent no-op in web browsers.
 */
export const hapticFeedback = {
  /**
   * Subtle micro-impact for standard keypad touch, number digits, or chip taps.
   */
  async light(): Promise<void> {
    try {
      if (Capacitor.isNativePlatform()) {
        await Haptics.impact({ style: ImpactStyle.Light });
      } else if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(15);
      }
    } catch (_) {}
  },

  /**
   * Medium impact for backspace, deletions, or clearing inputs.
   */
  async medium(): Promise<void> {
    try {
      if (Capacitor.isNativePlatform()) {
        await Haptics.impact({ style: ImpactStyle.Medium });
      } else if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(25);
      }
    } catch (_) {}
  },

  /**
   * Heavy impact for destructive operations or critical warnings.
   */
  async heavy(): Promise<void> {
    try {
      if (Capacitor.isNativePlatform()) {
        await Haptics.impact({ style: ImpactStyle.Heavy });
      } else if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(40);
      }
    } catch (_) {}
  },

  /**
   * Distinct haptic pattern for successful transaction creation or save.
   */
  async success(): Promise<void> {
    try {
      if (Capacitor.isNativePlatform()) {
        await Haptics.notification({ type: NotificationType.Success });
      } else if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate([20, 50, 30]);
      }
    } catch (_) {}
  },

  /**
   * Distinct haptic pattern for warning (e.g. budget exceeded).
   */
  async warning(): Promise<void> {
    try {
      if (Capacitor.isNativePlatform()) {
        await Haptics.notification({ type: NotificationType.Warning });
      } else if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate([40, 60, 40]);
      }
    } catch (_) {}
  },

  /**
   * Distinct haptic pattern for error (e.g. invalid PIN or transaction failure).
   */
  async error(): Promise<void> {
    try {
      if (Capacitor.isNativePlatform()) {
        await Haptics.notification({ type: NotificationType.Error });
      } else if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate([50, 50, 50, 50]);
      }
    } catch (_) {}
  },
};
