import { useEffect } from 'react';
import { applyTelegramTheme, isTelegramWebApp } from '@/lib/telegram';
import WebApp from '@twa-dev/sdk';

/**
 * Hook to listen for Telegram theme changes and apply them to the app
 */
export function useTelegramTheme() {
  useEffect(() => {
    if (!isTelegramWebApp()) {
      return;
    }

    // 初始应用主题
    applyTelegramTheme();

    // 监听主题变化
    const handleThemeChanged = () => {
      console.log('[Telegram SDK] Theme changed, reapplying...');
      applyTelegramTheme();
    };

    // 注册主题变化监听器
    WebApp.onEvent('themeChanged', handleThemeChanged);

    // 清理监听器
    return () => {
      WebApp.offEvent('themeChanged', handleThemeChanged);
    };
  }, []);
}
