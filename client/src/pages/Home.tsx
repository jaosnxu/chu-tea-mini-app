import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useTelegramContext } from '@/contexts/TelegramContext';
import { useStore } from '@/contexts/StoreContext';
import { getLocalizedText } from '@/lib/i18n';
import { 
  Coffee, 
  ShoppingBag, 
  MapPin, 
  Gift, 
  Star,
  ChevronRight,
  Sparkles
} from 'lucide-react';

export default function Home() {
  const { t } = useTranslation();
  const [, navigate] = useLocation();
  const { isTelegram, user, setHeaderColor, setBackgroundColor } = useTelegramContext();
  const { currentStore } = useStore();

  // 设置 Telegram 主题
  useEffect(() => {
    if (isTelegram) {
      setHeaderColor('#0d9488');
      setBackgroundColor('#f0fdfa');
    }
  }, [isTelegram, setHeaderColor, setBackgroundColor]);

  const storeName = currentStore 
    ? getLocalizedText({ 
        zh: currentStore.nameZh, 
        ru: currentStore.nameRu, 
        en: currentStore.nameEn 
      })
    : t('store.selectStore');

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50 to-white">
      {/* 头部 */}
      <header className="bg-gradient-to-r from-teal-600 to-teal-500 text-white px-4 pt-6 pb-12 rounded-b-3xl shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold">CHU TEA</h1>
            <p className="text-teal-100 text-sm">{t('landing.slogan')}</p>
          </div>
          {user && (
            <div className="flex items-center gap-2">
              <span className="text-sm">{user.first_name}</span>
            </div>
          )}
        </div>
        
        {/* 门店选择 */}
        <Card 
          className="bg-white/20 backdrop-blur border-0 p-3 cursor-pointer hover:bg-white/30 transition-colors"
          onClick={() => navigate('/store-selector')}
        >
          <div className="flex items-center justify-between text-white">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              <div>
                <p className="font-medium">{storeName}</p>
                {currentStore?.isOpen ? (
                  <span className="text-xs text-teal-100">{t('store.open')}</span>
                ) : (
                  <span className="text-xs text-orange-200">{t('store.closed')}</span>
                )}
              </div>
            </div>
            <ChevronRight className="w-5 h-5" />
          </div>
        </Card>
      </header>

      {/* 新用户礼包 */}
      <div className="px-4 -mt-6">
        <Card className="bg-gradient-to-r from-orange-400 to-pink-500 text-white p-4 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 rounded-full p-2">
                <Gift className="w-6 h-6" />
              </div>
              <div>
                <p className="font-bold">{t('landing.newUserGift')}</p>
                <p className="text-sm text-white/80">3 {t('coupon.available')}</p>
              </div>
            </div>
            <Button 
              variant="secondary" 
              size="sm"
              className="bg-white text-orange-500 hover:bg-white/90"
              onClick={() => navigate('/coupons')}
            >
              {t('landing.getCoupon')}
            </Button>
          </div>
        </Card>
      </div>

      {/* 主要功能入口 */}
      <div className="px-4 mt-6 grid grid-cols-2 gap-4">
        {/* 点单 */}
        <Card 
          className="p-4 cursor-pointer hover:shadow-lg transition-shadow bg-gradient-to-br from-teal-500 to-teal-600 text-white"
          onClick={() => navigate('/menu')}
        >
          <div className="flex flex-col items-center text-center">
            <div className="bg-white/20 rounded-full p-3 mb-3">
              <Coffee className="w-8 h-8" />
            </div>
            <h3 className="font-bold text-lg">{t('nav.order')}</h3>
            <p className="text-sm text-teal-100 mt-1">{t('landing.viewMenu')}</p>
          </div>
        </Card>

        {/* 商城 */}
        <Card 
          className="p-4 cursor-pointer hover:shadow-lg transition-shadow bg-gradient-to-br from-purple-500 to-purple-600 text-white"
          onClick={() => navigate('/mall')}
        >
          <div className="flex flex-col items-center text-center">
            <div className="bg-white/20 rounded-full p-3 mb-3">
              <ShoppingBag className="w-8 h-8" />
            </div>
            <h3 className="font-bold text-lg">{t('nav.mall')}</h3>
            <p className="text-sm text-purple-100 mt-1">{t('mall.hotProducts')}</p>
          </div>
        </Card>
      </div>

      {/* 快捷入口 */}
      <div className="px-4 mt-6">
        <div className="grid grid-cols-4 gap-2">
          <QuickEntry 
            icon={<Star className="w-5 h-5 text-yellow-500" />}
            label={t('member.memberCenter')}
            onClick={() => navigate('/member')}
          />
          <QuickEntry 
            icon={<Gift className="w-5 h-5 text-pink-500" />}
            label={t('coupon.myCoupons')}
            onClick={() => navigate('/coupons')}
          />
          <QuickEntry 
            icon={<Sparkles className="w-5 h-5 text-purple-500" />}
            label={t('points.myPoints')}
            onClick={() => navigate('/points')}
          />
          <QuickEntry 
            icon={<ShoppingBag className="w-5 h-5 text-teal-500" />}
            label={t('order.orderHistory')}
            onClick={() => navigate('/orders')}
          />
        </div>
      </div>

      {/* 热门推荐 */}
      <div className="px-4 mt-6 pb-24">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-800">{t('menu.popular')}</h2>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-teal-600"
            onClick={() => navigate('/menu')}
          >
            {t('common.viewAll')}
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
        
        <div className="text-center text-gray-400 py-8">
          {t('common.loading')}
        </div>
      </div>

      {/* 底部导航 */}
      <BottomNav />
    </div>
  );
}

// 快捷入口组件
function QuickEntry({ 
  icon, 
  label, 
  onClick 
}: { 
  icon: React.ReactNode; 
  label: string; 
  onClick: () => void;
}) {
  return (
    <div 
      className="flex flex-col items-center p-2 cursor-pointer hover:bg-gray-50 rounded-lg transition-colors"
      onClick={onClick}
    >
      <div className="bg-gray-100 rounded-full p-2 mb-1">
        {icon}
      </div>
      <span className="text-xs text-gray-600 text-center">{label}</span>
    </div>
  );
}

// 底部导航组件
function BottomNav() {
  const { t } = useTranslation();
  const [location, navigate] = useLocation();

  const navItems = [
    { path: '/', icon: <Coffee className="w-5 h-5" />, label: t('nav.home') },
    { path: '/menu', icon: <Coffee className="w-5 h-5" />, label: t('nav.order') },
    { path: '/mall', icon: <ShoppingBag className="w-5 h-5" />, label: t('nav.mall') },
    { path: '/orders', icon: <ShoppingBag className="w-5 h-5" />, label: t('nav.orders') },
    { path: '/profile', icon: <Star className="w-5 h-5" />, label: t('nav.profile') },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-2 py-2 safe-area-pb">
      <div className="flex justify-around items-center">
        {navItems.map((item) => {
          const isActive = location === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center px-3 py-1 rounded-lg transition-colors ${
                isActive 
                  ? 'text-teal-600' 
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              {item.icon}
              <span className="text-xs mt-1">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
