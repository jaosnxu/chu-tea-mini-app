import React, { createContext, useContext, ReactNode } from 'react';
import { useTelegram, TelegramUser } from '../hooks/useTelegram';

// Context 类型
interface TelegramContextType {
  isReady: boolean;
  isTelegram: boolean;
  user: TelegramUser | null;
  startParam: string | null;
  colorScheme: 'light' | 'dark';
  themeParams: Record<string, string>;
  platform: string;
  version: string;
  showBackButton: (onClick: () => void) => () => void;
  hideBackButton: () => void;
  showMainButton: (text: string, onClick: () => void) => () => void;
  hideMainButton: () => void;
  setMainButtonLoading: (loading: boolean) => void;
  hapticFeedback: (type: 'impact' | 'notification' | 'selection', style?: string) => void;
  showPopup: (params: {
    title?: string;
    message: string;
    buttons?: Array<{
      id?: string;
      type?: 'default' | 'ok' | 'close' | 'cancel' | 'destructive';
      text?: string;
    }>;
  }) => Promise<string>;
  showConfirm: (message: string) => Promise<boolean>;
  showAlert: (message: string) => Promise<void>;
  openLink: (url: string, tryInstantView?: boolean) => void;
  openTelegramLink: (url: string) => void;
  close: () => void;
  setHeaderColor: (color: string) => void;
  setBackgroundColor: (color: string) => void;
  cloudStorage: {
    setItem: (key: string, value: string) => Promise<boolean>;
    getItem: (key: string) => Promise<string | null>;
    removeItem: (key: string) => Promise<boolean>;
  };
}

// 创建 Context
const TelegramContext = createContext<TelegramContextType | null>(null);

// Provider 组件
export function TelegramProvider({ children }: { children: ReactNode }) {
  const telegram = useTelegram();

  return (
    <TelegramContext.Provider value={telegram}>
      {children}
    </TelegramContext.Provider>
  );
}

// 使用 Context 的 Hook
export function useTelegramContext() {
  const context = useContext(TelegramContext);
  if (!context) {
    throw new Error('useTelegramContext must be used within a TelegramProvider');
  }
  return context;
}

export default TelegramContext;
