import { useCallback } from 'react';

declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        HapticFeedback?: {
          impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void;
          notificationOccurred: (type: 'error' | 'success' | 'warning') => void;
          selectionChanged: () => void;
        };
      };
    };
  }
}

/**
 * Hook for Telegram WebApp haptic feedback
 * Provides native-like tactile feedback for user interactions
 * 
 * @example
 * const { impact, notification, selection } = useHaptic();
 * 
 * <button onClick={() => {
 *   impact('medium');
 *   handleClick();
 * }}>Click me</button>
 */
export function useHaptic() {
  const haptic = window.Telegram?.WebApp?.HapticFeedback;

  const impact = useCallback(
    (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft' = 'medium') => {
      haptic?.impactOccurred(style);
    },
    [haptic]
  );

  const notification = useCallback(
    (type: 'error' | 'success' | 'warning') => {
      haptic?.notificationOccurred(type);
    },
    [haptic]
  );

  const selection = useCallback(() => {
    haptic?.selectionChanged();
  }, [haptic]);

  return { impact, notification, selection };
}
