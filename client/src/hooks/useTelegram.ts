import { useEffect, useState, useCallback } from 'react';

// Telegram 用户信息类型
export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  photo_url?: string;
  is_premium?: boolean;
}

// Telegram WebApp 状态
export interface TelegramState {
  isReady: boolean;
  isTelegram: boolean;
  user: TelegramUser | null;
  startParam: string | null;
  colorScheme: 'light' | 'dark';
  themeParams: Record<string, string>;
  platform: string;
  version: string;
}

// 初始状态
const initialState: TelegramState = {
  isReady: false,
  isTelegram: false,
  user: null,
  startParam: null,
  colorScheme: 'light',
  themeParams: {},
  platform: 'unknown',
  version: '0.0',
};

export function useTelegram() {
  const [state, setState] = useState<TelegramState>(initialState);

  // 初始化 Telegram WebApp
  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    
    if (tg) {
      // 通知 Telegram 应用已准备好
      tg.ready();
      
      // 展开应用到全屏
      tg.expand();
      
      // 获取用户信息
      const user = tg.initDataUnsafe?.user || null;
      const startParam = tg.initDataUnsafe?.start_param || null;
      
      setState({
        isReady: true,
        isTelegram: true,
        user,
        startParam,
        colorScheme: tg.colorScheme || 'light',
        themeParams: tg.themeParams || {},
        platform: tg.platform || 'unknown',
        version: tg.version || '0.0',
      });

      // 监听主题变化
      const handleThemeChange = () => {
        setState(prev => ({
          ...prev,
          colorScheme: tg.colorScheme || 'light',
          themeParams: tg.themeParams || {},
        }));
      };

      tg.onEvent('themeChanged', handleThemeChange);

      return () => {
        tg.offEvent('themeChanged', handleThemeChange);
      };
    } else {
      // 非 Telegram 环境
      setState({
        ...initialState,
        isReady: true,
        isTelegram: false,
      });
    }
  }, []);

  // 显示返回按钮
  const showBackButton = useCallback((onClick: () => void) => {
    const tg = window.Telegram?.WebApp;
    if (tg?.BackButton) {
      tg.BackButton.show();
      tg.BackButton.onClick(onClick);
      return () => {
        tg.BackButton.offClick(onClick);
        tg.BackButton.hide();
      };
    }
    return () => {};
  }, []);

  // 隐藏返回按钮
  const hideBackButton = useCallback(() => {
    const tg = window.Telegram?.WebApp;
    if (tg?.BackButton) {
      tg.BackButton.hide();
    }
  }, []);

  // 显示主按钮
  const showMainButton = useCallback((text: string, onClick: () => void) => {
    const tg = window.Telegram?.WebApp;
    if (tg?.MainButton) {
      tg.MainButton.setText(text);
      tg.MainButton.onClick(onClick);
      tg.MainButton.show();
      return () => {
        tg.MainButton.offClick(onClick);
        tg.MainButton.hide();
      };
    }
    return () => {};
  }, []);

  // 隐藏主按钮
  const hideMainButton = useCallback(() => {
    const tg = window.Telegram?.WebApp;
    if (tg?.MainButton) {
      tg.MainButton.hide();
    }
  }, []);

  // 设置主按钮加载状态
  const setMainButtonLoading = useCallback((loading: boolean) => {
    const tg = window.Telegram?.WebApp;
    if (tg?.MainButton) {
      if (loading) {
        tg.MainButton.showProgress();
      } else {
        tg.MainButton.hideProgress();
      }
    }
  }, []);

  // 触觉反馈
  const hapticFeedback = useCallback((type: 'impact' | 'notification' | 'selection', style?: string) => {
    const tg = window.Telegram?.WebApp;
    if (tg?.HapticFeedback) {
      switch (type) {
        case 'impact':
          tg.HapticFeedback.impactOccurred((style as 'light' | 'medium' | 'heavy') || 'medium');
          break;
        case 'notification':
          tg.HapticFeedback.notificationOccurred((style as 'error' | 'success' | 'warning') || 'success');
          break;
        case 'selection':
          tg.HapticFeedback.selectionChanged();
          break;
      }
    }
  }, []);

  // 显示弹窗
  const showPopup = useCallback((params: {
    title?: string;
    message: string;
    buttons?: Array<{
      id?: string;
      type?: 'default' | 'ok' | 'close' | 'cancel' | 'destructive';
      text?: string;
    }>;
  }): Promise<string> => {
    return new Promise((resolve) => {
      const tg = window.Telegram?.WebApp;
      if (tg?.showPopup) {
        tg.showPopup(params, (buttonId) => {
          resolve(buttonId);
        });
      } else {
        // 非 Telegram 环境，使用原生 alert
        alert(params.message);
        resolve('ok');
      }
    });
  }, []);

  // 显示确认框
  const showConfirm = useCallback((message: string): Promise<boolean> => {
    return new Promise((resolve) => {
      const tg = window.Telegram?.WebApp;
      if (tg?.showConfirm) {
        tg.showConfirm(message, (confirmed) => {
          resolve(confirmed);
        });
      } else {
        resolve(window.confirm(message));
      }
    });
  }, []);

  // 显示提示框
  const showAlert = useCallback((message: string): Promise<void> => {
    return new Promise((resolve) => {
      const tg = window.Telegram?.WebApp;
      if (tg?.showAlert) {
        tg.showAlert(message, () => {
          resolve();
        });
      } else {
        alert(message);
        resolve();
      }
    });
  }, []);

  // 打开链接
  const openLink = useCallback((url: string, tryInstantView = false) => {
    const tg = window.Telegram?.WebApp;
    if (tg?.openLink) {
      tg.openLink(url, { try_instant_view: tryInstantView });
    } else {
      window.open(url, '_blank');
    }
  }, []);

  // 打开 Telegram 链接
  const openTelegramLink = useCallback((url: string) => {
    const tg = window.Telegram?.WebApp;
    if (tg?.openTelegramLink) {
      tg.openTelegramLink(url);
    } else {
      window.open(url, '_blank');
    }
  }, []);

  // 关闭应用
  const close = useCallback(() => {
    const tg = window.Telegram?.WebApp;
    if (tg?.close) {
      tg.close();
    }
  }, []);

  // 设置头部颜色
  const setHeaderColor = useCallback((color: string) => {
    const tg = window.Telegram?.WebApp;
    if (tg?.setHeaderColor) {
      tg.setHeaderColor(color);
    }
  }, []);

  // 设置背景颜色
  const setBackgroundColor = useCallback((color: string) => {
    const tg = window.Telegram?.WebApp;
    if (tg?.setBackgroundColor) {
      tg.setBackgroundColor(color);
    }
  }, []);

  // Cloud Storage 操作
  const cloudStorage = {
    setItem: (key: string, value: string): Promise<boolean> => {
      return new Promise((resolve, reject) => {
        const tg = window.Telegram?.WebApp;
        if (tg?.CloudStorage) {
          tg.CloudStorage.setItem(key, value, (error, stored) => {
            if (error) reject(error);
            else resolve(stored);
          });
        } else {
          localStorage.setItem(key, value);
          resolve(true);
        }
      });
    },
    getItem: (key: string): Promise<string | null> => {
      return new Promise((resolve, reject) => {
        const tg = window.Telegram?.WebApp;
        if (tg?.CloudStorage) {
          tg.CloudStorage.getItem(key, (error, value) => {
            if (error) reject(error);
            else resolve(value);
          });
        } else {
          resolve(localStorage.getItem(key));
        }
      });
    },
    removeItem: (key: string): Promise<boolean> => {
      return new Promise((resolve, reject) => {
        const tg = window.Telegram?.WebApp;
        if (tg?.CloudStorage) {
          tg.CloudStorage.removeItem(key, (error, removed) => {
            if (error) reject(error);
            else resolve(removed);
          });
        } else {
          localStorage.removeItem(key);
          resolve(true);
        }
      });
    },
  };

  return {
    ...state,
    showBackButton,
    hideBackButton,
    showMainButton,
    hideMainButton,
    setMainButtonLoading,
    hapticFeedback,
    showPopup,
    showConfirm,
    showAlert,
    openLink,
    openTelegramLink,
    close,
    setHeaderColor,
    setBackgroundColor,
    cloudStorage,
  };
}

export default useTelegram;
