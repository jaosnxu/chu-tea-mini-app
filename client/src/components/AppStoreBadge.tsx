import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Download, Smartphone } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function AppStoreBadge() {
  const { t } = useTranslation();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBadge, setShowBadge] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // 检测是否为 iOS 设备
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(isIOSDevice);

    // 检查是否已经安装
    const isInstalled = window.matchMedia('(display-mode: standalone)').matches || 
                       (window.navigator as any).standalone === true;
    
    if (isInstalled) {
      return;
    }

    // 检查是否永久关闭
    const permanentlyDismissed = localStorage.getItem('pwa-badge-never-show');
    if (permanentlyDismissed === 'true') {
      return;
    }

    // 检查是否临时关闭
    const tempDismissed = localStorage.getItem('pwa-badge-dismissed');
    if (tempDismissed) {
      const dismissedTime = parseInt(tempDismissed, 10);
      const now = Date.now();
      // 如果关闭时间小于 3 天，不再显示
      if (now - dismissedTime < 3 * 24 * 60 * 60 * 1000) {
        return;
      }
    }

    // iOS 设备直接显示徽章（因为不支持 beforeinstallprompt）
    if (isIOSDevice) {
      setTimeout(() => {
        setShowBadge(true);
      }, 2000);
      return;
    }

    // Android/Desktop: 监听 beforeinstallprompt 事件
    const handler = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      setDeferredPrompt(promptEvent);
      
      // 延迟 2 秒显示徽章
      setTimeout(() => {
        setShowBadge(true);
      }, 2000);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstall = async () => {
    if (isIOS) {
      // iOS 设备显示安装说明
      alert(t('pwa.iosInstructions'));
      return;
    }

    if (!deferredPrompt) {
      return;
    }

    // 显示安装提示
    deferredPrompt.prompt();

    // 等待用户响应
    const { outcome } = await deferredPrompt.userChoice;
    
    console.log(`User response to the install prompt: ${outcome}`);

    // 清除 deferredPrompt
    setDeferredPrompt(null);
    setShowBadge(false);

    // 如果用户接受安装，清除所有关闭记录
    if (outcome === 'accepted') {
      localStorage.removeItem('pwa-badge-dismissed');
      localStorage.removeItem('pwa-badge-never-show');
    } else {
      // 用户拒绝，记录临时关闭
      localStorage.setItem('pwa-badge-dismissed', Date.now().toString());
    }
  };

  const handleDismiss = (permanent: boolean = false) => {
    setShowBadge(false);
    
    if (permanent) {
      // 永久关闭
      localStorage.setItem('pwa-badge-never-show', 'true');
    } else {
      // 临时关闭
      localStorage.setItem('pwa-badge-dismissed', Date.now().toString());
    }
  };

  if (!showBadge) {
    return null;
  }

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-teal-500 to-teal-600 p-4 shadow-lg animate-in slide-in-from-top-4">
      {/* 背景装饰 */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />
      
      {/* 内容 */}
      <div className="relative flex items-center gap-4">
        {/* 图标 */}
        <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-white shadow-md flex items-center justify-center">
          <Smartphone className="w-8 h-8 text-teal-600" />
        </div>
        
        {/* 文本 */}
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-white text-base leading-tight">
            {t('pwa.badge.title')}
          </h3>
          <p className="text-white/90 text-xs mt-1 leading-tight">
            {t('pwa.badge.description')}
          </p>
          
          {/* 按钮 */}
          <div className="flex gap-2 mt-3">
            <button
              onClick={handleInstall}
              className="px-4 py-1.5 bg-white text-teal-600 rounded-lg text-sm font-semibold hover:bg-white/90 transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <Download className="w-4 h-4" />
              {t('pwa.badge.install')}
            </button>
            <button
              onClick={() => handleDismiss(false)}
              className="px-3 py-1.5 text-white/90 text-sm hover:text-white transition-colors"
            >
              {t('pwa.badge.later')}
            </button>
          </div>
        </div>
        
        {/* 关闭按钮 */}
        <button
          onClick={() => handleDismiss(true)}
          className="flex-shrink-0 w-6 h-6 rounded-full bg-white/20 hover:bg-white/30 transition-colors flex items-center justify-center"
          aria-label={t('common.close')}
        >
          <X className="w-4 h-4 text-white" />
        </button>
      </div>
    </div>
  );
}
