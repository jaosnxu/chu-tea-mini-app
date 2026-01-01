import { useState, useEffect } from 'react';

/**
 * 在线状态检测 Hook
 * 监听网络连接状态变化
 */
export function useOnlineStatus(): boolean {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => {
      console.log('[Network] Connection restored');
      setIsOnline(true);
    };

    const handleOffline = () => {
      console.log('[Network] Connection lost');
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}
