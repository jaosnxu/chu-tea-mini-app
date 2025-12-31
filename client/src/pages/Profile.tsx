import { useTranslation } from 'react-i18next';
import { useLocation } from 'wouter';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/_core/hooks/useAuth';
import { trpc } from '@/lib/trpc';
import { useTelegramContext } from '@/contexts/TelegramContext';
import { User, Star, Gift, MapPin, Share2, Settings, ChevronRight, Crown, Bell } from 'lucide-react';
import { BottomNav } from '@/components/BottomNav';

const memberLevelColors: Record<string, string> = {
  normal: 'from-gray-400 to-gray-500',
  silver: 'from-gray-300 to-gray-400',
  gold: 'from-yellow-400 to-yellow-500',
  diamond: 'from-purple-400 to-pink-500',
};

export default function Profile() {
  const { t } = useTranslation();
  const [, navigate] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const { user: tgUser } = useTelegramContext();

  const { data: member } = trpc.member.info.useQuery(undefined, { enabled: isAuthenticated });

  const displayName = tgUser?.first_name || user?.name || t('profile.guest');
  const memberLevel = member?.memberLevel || 'normal';

  const menuItems = [
    { icon: <Crown className="w-5 h-5 text-yellow-500" />, label: t('member.memberCenter'), path: '/member' },
    { icon: <Gift className="w-5 h-5 text-pink-500" />, label: t('coupon.myCoupons'), path: '/coupons' },
    { icon: <Star className="w-5 h-5 text-purple-500" />, label: t('points.myPoints'), path: '/points' },
    { icon: <MapPin className="w-5 h-5 text-teal-500" />, label: t('address.myAddresses'), path: '/addresses' },
    { icon: <Share2 className="w-5 h-5 text-blue-500" />, label: t('influencer.center'), path: '/influencer' },
    { icon: <Bell className="w-5 h-5 text-orange-500" />, label: t('notifications.settings.title'), path: '/notification-settings' },
    { icon: <Settings className="w-5 h-5 text-gray-500" />, label: t('settings.settings'), path: '/settings' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <BottomNav />
      <div className={`bg-gradient-to-r ${memberLevelColors[memberLevel]} text-white px-4 pt-6 pb-8 rounded-b-3xl`}>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
            <User className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-xl font-bold">{displayName}</h2>
            <p className="text-white/80 text-sm">{t(`member.level.${memberLevel}`)}</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mt-6">
          <div className="text-center">
            <p className="text-2xl font-bold">{member?.availablePoints || 0}</p>
            <p className="text-xs text-white/80">{t('points.points')}</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold">0</p>
            <p className="text-xs text-white/80">{t('coupon.coupons')}</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold">0</p>
            <p className="text-xs text-white/80">{t('order.orders')}</p>
          </div>
        </div>
      </div>

      <div className="px-4 -mt-4">
        <Card className="divide-y">
          {menuItems.map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                {item.icon}
                <span>{item.label}</span>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>
          ))}
        </Card>
      </div>
    </div>
  );
}
