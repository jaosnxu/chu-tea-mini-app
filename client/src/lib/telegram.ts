import WebApp from '@twa-dev/sdk';

// 初始化 Telegram Web App
export function initTelegramSDK() {
  if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
    WebApp.ready();
    WebApp.expand();
    WebApp.enableClosingConfirmation();
    
    console.log('[Telegram SDK] Initialized');
    console.log('[Telegram SDK] Platform:', WebApp.platform);
    console.log('[Telegram SDK] Version:', WebApp.version);
    console.log('[Telegram SDK] Init Data:', WebApp.initData);
    
    return true;
  }
  return false;
}

// 获取 Telegram 用户信息
export function getTelegramUser() {
  if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
    return WebApp.initDataUnsafe?.user;
  }
  return null;
}

// 获取 Telegram 主题参数
export function getTelegramTheme() {
  if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
    return WebApp.themeParams;
  }
  return null;
}

// 显示/隐藏返回按钮
export function showBackButton(onClick: () => void) {
  if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
    WebApp.BackButton.show();
    WebApp.BackButton.onClick(onClick);
  }
}

export function hideBackButton() {
  if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
    WebApp.BackButton.hide();
  }
}

// 显示/隐藏主按钮
export function showMainButton(text: string, onClick: () => void) {
  if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
    WebApp.MainButton.setText(text);
    WebApp.MainButton.show();
    WebApp.MainButton.onClick(onClick);
  }
}

export function hideMainButton() {
  if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
    WebApp.MainButton.hide();
  }
}

// 显示弹窗
export function showAlert(message: string) {
  if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
    WebApp.showAlert(message);
  } else {
    alert(message);
  }
}

// 显示确认对话框
export function showConfirm(message: string, callback: (confirmed: boolean) => void) {
  if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
    WebApp.showConfirm(message, callback);
  } else {
    callback(confirm(message));
  }
}

// 关闭 Mini App
export function closeTelegramApp() {
  if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
    WebApp.close();
  }
}

// 打开链接
export function openTelegramLink(url: string) {
  if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
    WebApp.openTelegramLink(url);
  } else {
    window.open(url, '_blank');
  }
}

// 打开外部链接
export function openLink(url: string) {
  if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
    WebApp.openLink(url);
  } else {
    window.open(url, '_blank');
  }
}

// 触发震动反馈
export function hapticFeedback(type: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft' = 'medium') {
  if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
    if (type === 'light' || type === 'medium' || type === 'heavy') {
      WebApp.HapticFeedback.impactOccurred(type);
    } else if (type === 'rigid' || type === 'soft') {
      WebApp.HapticFeedback.notificationOccurred(type === 'rigid' ? 'error' : 'success');
    }
  }
}

// 应用 Telegram 主题颜色到 CSS 变量
export function applyTelegramTheme() {
  if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
    const theme = WebApp.themeParams;
    const root = document.documentElement;
    
    // 如果有主题参数，应用到 CSS 变量
    if (theme) {
      // 背景色
      if (theme.bg_color) {
        root.style.setProperty('--tg-bg-color', theme.bg_color);
      }
      if (theme.secondary_bg_color) {
        root.style.setProperty('--tg-secondary-bg-color', theme.secondary_bg_color);
      }
      
      // 文字颜色
      if (theme.text_color) {
        root.style.setProperty('--tg-text-color', theme.text_color);
      }
      if (theme.hint_color) {
        root.style.setProperty('--tg-hint-color', theme.hint_color);
      }
      if (theme.link_color) {
        root.style.setProperty('--tg-link-color', theme.link_color);
      }
      
      // 按钮颜色
      if (theme.button_color) {
        root.style.setProperty('--tg-button-color', theme.button_color);
      }
      if (theme.button_text_color) {
        root.style.setProperty('--tg-button-text-color', theme.button_text_color);
      }
      
      // 头部颜色
      if (theme.header_bg_color) {
        root.style.setProperty('--tg-header-bg-color', theme.header_bg_color);
      }
      
      // 分隔线颜色
      if (theme.section_bg_color) {
        root.style.setProperty('--tg-section-bg-color', theme.section_bg_color);
      }
      if (theme.section_header_text_color) {
        root.style.setProperty('--tg-section-header-text-color', theme.section_header_text_color);
      }
      
      // 副标题颜色
      if (theme.subtitle_text_color) {
        root.style.setProperty('--tg-subtitle-text-color', theme.subtitle_text_color);
      }
      
      // 破坏性按钮颜色
      if (theme.destructive_text_color) {
        root.style.setProperty('--tg-destructive-text-color', theme.destructive_text_color);
      }
      
      console.log('[Telegram SDK] Theme applied:', theme);
    }
  }
}

// 检查是否在 Telegram 中运行
export function isTelegramWebApp() {
  return typeof window !== 'undefined' && !!window.Telegram?.WebApp;
}

export default WebApp;
