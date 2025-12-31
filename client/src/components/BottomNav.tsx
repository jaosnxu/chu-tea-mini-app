import { useTranslation } from 'react-i18next';
import { useLocation } from 'wouter';
import { 
  Home,
  Coffee, 
  ShoppingBag, 
  ClipboardList,
  User
} from 'lucide-react';

// 底部导航组件 - 固定在屏幕底部
export function BottomNav() {
  const { t } = useTranslation();
  const [location, navigate] = useLocation();

  const navItems = [
    { path: '/', icon: Home, label: t('nav.home') },
    { path: '/menu', icon: Coffee, label: t('nav.order') },
    { path: '/mall', icon: ShoppingBag, label: t('nav.mall') },
    { path: '/orders', icon: ClipboardList, label: t('nav.orders') },
    { path: '/profile', icon: User, label: t('nav.profile') },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-black/95 backdrop-blur-lg border-t border-gray-800 px-2 py-2 safe-area-pb z-50">
      <div className="flex justify-around items-center">
        {navItems.map((item) => {
          const isActive = location === item.path || 
            (item.path !== '/' && location.startsWith(item.path));
          const Icon = item.icon;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center px-3 py-1 rounded-lg transition-colors ${
                isActive 
                  ? 'text-teal-400' 
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs mt-1">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

export default BottomNav;
