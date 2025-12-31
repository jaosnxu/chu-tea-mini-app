import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import zh from '../locales/zh.json';
import ru from '../locales/ru.json';
import en from '../locales/en.json';

// 支持的语言列表
export const supportedLanguages = [
  { code: 'zh', name: '中文', nativeName: '中文' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский' },
  { code: 'en', name: 'English', nativeName: 'English' },
] as const;

export type LanguageCode = typeof supportedLanguages[number]['code'];

// 获取 Telegram 用户语言
function getTelegramLanguage(): string | null {
  if (typeof window !== 'undefined' && window.Telegram?.WebApp?.initDataUnsafe?.user?.language_code) {
    const langCode = window.Telegram.WebApp.initDataUnsafe.user.language_code;
    // 映射 Telegram 语言代码到我们支持的语言
    if (langCode.startsWith('zh')) return 'zh';
    if (langCode.startsWith('ru')) return 'ru';
    if (langCode.startsWith('en')) return 'en';
  }
  return null;
}

// 自定义语言检测器
const telegramLanguageDetector = {
  name: 'telegramDetector',
  lookup() {
    return getTelegramLanguage();
  },
  cacheUserLanguage() {
    // 不缓存，每次从 Telegram 获取
  },
};

// 初始化 i18n
i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      zh: { translation: zh },
      ru: { translation: ru },
      en: { translation: en },
    },
    fallbackLng: 'ru', // 俄罗斯市场，默认俄语
    supportedLngs: ['zh', 'ru', 'en'],
    interpolation: {
      escapeValue: false, // React 已经处理了 XSS
    },
    detection: {
      order: ['telegramDetector', 'localStorage', 'navigator'],
      lookupLocalStorage: 'chu-tea-language',
      caches: ['localStorage'],
    },
  });

// 添加自定义检测器
const languageDetector = i18n.services.languageDetector as { addDetector: (detector: typeof telegramLanguageDetector) => void };
if (languageDetector?.addDetector) {
  languageDetector.addDetector(telegramLanguageDetector);
}

// 切换语言的函数
export const changeLanguage = async (lang: LanguageCode) => {
  await i18n.changeLanguage(lang);
  localStorage.setItem('chu-tea-language', lang);
  // 更新 HTML lang 属性
  document.documentElement.lang = lang;
};

// 获取当前语言
export const getCurrentLanguage = (): LanguageCode => {
  return (i18n.language || 'ru') as LanguageCode;
};

// 根据语言获取本地化文本
export const getLocalizedText = (
  textObj: { zh?: string; ru?: string; en?: string } | null | undefined,
  fallback = ''
): string => {
  if (!textObj) return fallback;
  const lang = getCurrentLanguage();
  const key = `${lang}` as keyof typeof textObj;
  return textObj[key] || textObj.ru || textObj.en || textObj.zh || fallback;
};

export default i18n;

// Telegram WebApp 类型声明
declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        initData: string;
        initDataUnsafe: {
          user?: {
            id: number;
            first_name: string;
            last_name?: string;
            username?: string;
            language_code?: string;
            photo_url?: string;
            is_premium?: boolean;
          };
          start_param?: string;
          chat_type?: string;
          chat_instance?: string;
        };
        version: string;
        platform: string;
        colorScheme: 'light' | 'dark';
        themeParams: {
          bg_color?: string;
          text_color?: string;
          hint_color?: string;
          link_color?: string;
          button_color?: string;
          button_text_color?: string;
          secondary_bg_color?: string;
          header_bg_color?: string;
          accent_text_color?: string;
          section_bg_color?: string;
          section_header_text_color?: string;
          subtitle_text_color?: string;
          destructive_text_color?: string;
        };
        isExpanded: boolean;
        viewportHeight: number;
        viewportStableHeight: number;
        headerColor: string;
        backgroundColor: string;
        isClosingConfirmationEnabled: boolean;
        BackButton: {
          isVisible: boolean;
          show: () => void;
          hide: () => void;
          onClick: (callback: () => void) => void;
          offClick: (callback: () => void) => void;
        };
        MainButton: {
          text: string;
          color: string;
          textColor: string;
          isVisible: boolean;
          isActive: boolean;
          isProgressVisible: boolean;
          setText: (text: string) => void;
          onClick: (callback: () => void) => void;
          offClick: (callback: () => void) => void;
          show: () => void;
          hide: () => void;
          enable: () => void;
          disable: () => void;
          showProgress: (leaveActive?: boolean) => void;
          hideProgress: () => void;
        };
        HapticFeedback: {
          impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void;
          notificationOccurred: (type: 'error' | 'success' | 'warning') => void;
          selectionChanged: () => void;
        };
        ready: () => void;
        expand: () => void;
        close: () => void;
        setHeaderColor: (color: string) => void;
        setBackgroundColor: (color: string) => void;
        enableClosingConfirmation: () => void;
        disableClosingConfirmation: () => void;
        onEvent: (eventType: string, callback: () => void) => void;
        offEvent: (eventType: string, callback: () => void) => void;
        sendData: (data: string) => void;
        openLink: (url: string, options?: { try_instant_view?: boolean }) => void;
        openTelegramLink: (url: string) => void;
        openInvoice: (url: string, callback?: (status: string) => void) => void;
        showPopup: (params: {
          title?: string;
          message: string;
          buttons?: Array<{
            id?: string;
            type?: 'default' | 'ok' | 'close' | 'cancel' | 'destructive';
            text?: string;
          }>;
        }, callback?: (buttonId: string) => void) => void;
        showAlert: (message: string, callback?: () => void) => void;
        showConfirm: (message: string, callback?: (confirmed: boolean) => void) => void;
        requestContact: (callback: (shared: boolean) => void) => void;
        requestWriteAccess: (callback?: (granted: boolean) => void) => void;
        CloudStorage: {
          setItem: (key: string, value: string, callback?: (error: Error | null, stored: boolean) => void) => void;
          getItem: (key: string, callback: (error: Error | null, value: string | null) => void) => void;
          getItems: (keys: string[], callback: (error: Error | null, values: Record<string, string>) => void) => void;
          removeItem: (key: string, callback?: (error: Error | null, removed: boolean) => void) => void;
          removeItems: (keys: string[], callback?: (error: Error | null, removed: boolean) => void) => void;
          getKeys: (callback: (error: Error | null, keys: string[]) => void) => void;
        };
      };
    };
  }
}
