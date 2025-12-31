import { useEffect, useCallback } from 'react';
import { showMainButton, hideMainButton, isTelegramWebApp } from '@/lib/telegram';
import WebApp from '@twa-dev/sdk';

interface MainButtonOptions {
  text: string;
  color?: string;
  textColor?: string;
  isVisible?: boolean;
  isActive?: boolean;
  isProgressVisible?: boolean;
}

/**
 * Hook to manage Telegram Main Button
 * @param options - Main button configuration
 * @param onClick - Click handler
 */
export function useTelegramMainButton(
  options: MainButtonOptions | null,
  onClick?: () => void
) {
  const { text, color, textColor, isVisible = true, isActive = true, isProgressVisible = false } = options || {};

  const handleClick = useCallback(() => {
    if (onClick && isActive) {
      onClick();
    }
  }, [onClick, isActive]);

  useEffect(() => {
    if (!isTelegramWebApp() || !options) {
      return;
    }

    const mainButton = WebApp.MainButton;

    if (isVisible && text) {
      // 设置按钮文本
      mainButton.setText(text);

      // 设置按钮颜色
      if (color) {
        mainButton.setParams({ color });
      }
      if (textColor) {
        mainButton.setParams({ text_color: textColor });
      }

      // 设置按钮状态
      if (isActive) {
        mainButton.enable();
      } else {
        mainButton.disable();
      }

      // 设置加载状态
      if (isProgressVisible) {
        mainButton.showProgress();
      } else {
        mainButton.hideProgress();
      }

      // 显示按钮
      mainButton.show();

      // 注册点击事件
      mainButton.onClick(handleClick);
    } else {
      // 隐藏按钮
      mainButton.hide();
    }

    // 清理：组件卸载时隐藏按钮并移除事件监听
    return () => {
      mainButton.offClick(handleClick);
      mainButton.hide();
    };
  }, [text, color, textColor, isVisible, isActive, isProgressVisible, handleClick, options]);

  // 返回控制函数
  return {
    showProgress: () => {
      if (isTelegramWebApp()) {
        WebApp.MainButton.showProgress();
      }
    },
    hideProgress: () => {
      if (isTelegramWebApp()) {
        WebApp.MainButton.hideProgress();
      }
    },
    enable: () => {
      if (isTelegramWebApp()) {
        WebApp.MainButton.enable();
      }
    },
    disable: () => {
      if (isTelegramWebApp()) {
        WebApp.MainButton.disable();
      }
    },
  };
}
