import { useEffect, useState } from 'react';
import { getTelegramUser, isTelegramWebApp } from '@/lib/telegram';
import { trpc } from '@/lib/trpc';

export function useTelegramAuth() {
  const [isLoading, setIsLoading] = useState(true);
  const [telegramUser, setTelegramUser] = useState<any>(null);
  
  const telegramLoginMutation = trpc.auth.telegramLogin.useMutation();

  useEffect(() => {
    const initAuth = async () => {
      // 检查是否在 Telegram 中运行
      if (!isTelegramWebApp()) {
        console.log('[Telegram Auth] Not running in Telegram');
        setIsLoading(false);
        return;
      }

      // 获取 Telegram 用户信息
      const user = getTelegramUser();
      if (!user) {
        console.log('[Telegram Auth] No user data');
        setIsLoading(false);
        return;
      }

      console.log('[Telegram Auth] User data:', user);
      setTelegramUser(user);

      // 尝试自动登录
      try {
        const initData = window.Telegram?.WebApp?.initData;
        if (!initData) {
          console.log('[Telegram Auth] No init data');
          setIsLoading(false);
          return;
        }

        // 调用后端验证并登录
        await telegramLoginMutation.mutateAsync({ initData });
        console.log('[Telegram Auth] Login successful');
      } catch (error) {
        console.error('[Telegram Auth] Login failed:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  return {
    isLoading,
    telegramUser,
    isTelegramWebApp: isTelegramWebApp(),
  };
}
