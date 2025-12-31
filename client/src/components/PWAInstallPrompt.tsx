import { useState, useEffect } from 'react';
import { X, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // 检查是否已经安装
    const isInstalled = window.matchMedia('(display-mode: standalone)').matches || 
                       (window.navigator as any).standalone === true;
    
    if (isInstalled) {
      return;
    }

    // 检查是否已经关闭过提示
    const promptDismissed = localStorage.getItem('pwa-install-dismissed');
    if (promptDismissed) {
      const dismissedTime = parseInt(promptDismissed, 10);
      const now = Date.now();
      // 如果关闭时间小于 7 天，不再显示
      if (now - dismissedTime < 7 * 24 * 60 * 60 * 1000) {
        return;
      }
    }

    // 监听 beforeinstallprompt 事件
    const handler = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      setDeferredPrompt(promptEvent);
      
      // 延迟 3 秒显示提示，避免打扰用户
      setTimeout(() => {
        setShowPrompt(true);
      }, 3000);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstall = async () => {
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
    setShowPrompt(false);

    // 如果用户接受安装，清除关闭记录
    if (outcome === 'accepted') {
      localStorage.removeItem('pwa-install-dismissed');
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    // 记录关闭时间
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
  };

  if (!showPrompt || !deferredPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 animate-in slide-in-from-bottom-4">
      <div className="mx-auto max-w-md rounded-lg bg-white p-4 shadow-lg dark:bg-gray-800">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 rounded-full bg-primary/10 p-2">
            <Download className="h-5 w-5 text-primary" />
          </div>
          
          <div className="flex-1">
            <h3 className="font-semibold text-foreground">
              安装 CHU TEA 应用
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              添加到主屏幕，获得更快的访问速度和更好的体验
            </p>
            
            <div className="mt-3 flex gap-2">
              <Button
                size="sm"
                onClick={handleInstall}
                className="flex-1"
              >
                立即安装
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleDismiss}
              >
                稍后再说
              </Button>
            </div>
          </div>
          
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 rounded-full p-1 hover:bg-gray-100 dark:hover:bg-gray-700"
            aria-label="关闭"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
      </div>
    </div>
  );
}
