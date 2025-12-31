import { useTranslation } from 'react-i18next';
import { useLocation } from 'wouter';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronLeft, Globe, Bell, Shield, HelpCircle, Info } from 'lucide-react';

export default function Settings() {
  const { t, i18n } = useTranslation();
  const [, navigate] = useLocation();

  const handleLanguageChange = (lang: string) => { i18n.changeLanguage(lang); localStorage.setItem('language', lang); };

  const menuItems = [
    { icon: <Bell className="w-5 h-5" />, label: t('settings.notifications'), action: () => {} },
    { icon: <Shield className="w-5 h-5" />, label: t('settings.privacy'), action: () => {} },
    { icon: <HelpCircle className="w-5 h-5" />, label: t('settings.help'), action: () => {} },
    { icon: <Info className="w-5 h-5" />, label: t('settings.about'), action: () => {} },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white sticky top-0 z-10 shadow-sm">
        <div className="flex items-center justify-between p-4">
          <button onClick={() => navigate('/profile')} className="p-1"><ChevronLeft className="w-6 h-6" /></button>
          <h1 className="font-bold text-lg">{t('settings.settings')}</h1>
          <div className="w-6" />
        </div>
      </header>
      <div className="p-4 space-y-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3"><Globe className="w-5 h-5 text-gray-500" /><span>{t('settings.language')}</span></div>
            <Select value={i18n.language} onValueChange={handleLanguageChange}>
              <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="zh">中文</SelectItem>
                <SelectItem value="ru">Русский</SelectItem>
                <SelectItem value="en">English</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Card>
        <Card className="divide-y">
          {menuItems.map((item, i) => (
            <button key={i} onClick={item.action} className="w-full flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors">
              <span className="text-gray-500">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </Card>
      </div>
    </div>
  );
}
