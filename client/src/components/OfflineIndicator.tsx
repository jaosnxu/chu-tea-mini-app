import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { WifiOff, Wifi } from 'lucide-react';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

/**
 * 离线状态指示器
 * 在网络断开时显示提示，网络恢复时显示短暂的成功提示
 */
export function OfflineIndicator() {
  const isOnline = useOnlineStatus();
  const [showOnlineToast, setShowOnlineToast] = useState(false);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    if (!isOnline) {
      setWasOffline(true);
    } else if (wasOffline) {
      // 网络恢复，显示短暂的成功提示
      setShowOnlineToast(true);
      setTimeout(() => {
        setShowOnlineToast(false);
        setWasOffline(false);
      }, 3000);
    }
  }, [isOnline, wasOffline]);

  // 离线提示（持续显示）
  if (!isOnline) {
    return (
      <div className="fixed top-0 left-0 right-0 z-50 bg-orange-500 text-white px-4 py-2 text-center text-sm shadow-lg">
        <div className="flex items-center justify-center gap-2">
          <WifiOff className="w-4 h-4" />
          <span>您当前处于离线状态，部分功能可能受限</span>
        </div>
      </div>
    );
  }

  // 网络恢复提示（3秒后自动消失）
  if (showOnlineToast) {
    return (
      <div className={cn(
        "fixed top-4 left-1/2 -translate-x-1/2 z-50",
        "bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg",
        "text-sm transition-all duration-300",
        "animate-in fade-in slide-in-from-top-2"
      )}>
        <div className="flex items-center gap-2">
          <Wifi className="w-4 h-4" />
          <span>网络已恢复</span>
        </div>
      </div>
    );
  }

  return null;
}
