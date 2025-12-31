import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { showBackButton, hideBackButton, isTelegramWebApp } from '@/lib/telegram';

/**
 * Hook to show/hide Telegram back button and handle navigation
 * @param show - Whether to show the back button
 * @param onBack - Optional custom back handler. If not provided, uses wouter navigation
 */
export function useTelegramBackButton(show: boolean = true, onBack?: () => void) {
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isTelegramWebApp()) {
      return;
    }

    if (show) {
      const handleBack = () => {
        if (onBack) {
          onBack();
        } else {
          // 默认行为：返回上一页
          window.history.back();
        }
      };

      showBackButton(handleBack);
    } else {
      hideBackButton();
    }

    // 清理：组件卸载时隐藏返回按钮
    return () => {
      hideBackButton();
    };
  }, [show, onBack, setLocation]);
}
