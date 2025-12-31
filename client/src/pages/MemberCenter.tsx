import { useTranslation } from 'react-i18next';
import { useLocation } from 'wouter';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { trpc } from '@/lib/trpc';
import { ChevronLeft, Crown, Gift, Star, Zap } from 'lucide-react';
import { BottomNav } from '@/components/BottomNav';

export default function MemberCenter() {
  const { t } = useTranslation();
  const [, navigate] = useLocation();
  const { data: member } = trpc.member.info.useQuery();

  const level = member?.memberLevel || 'normal';
  const benefits = [
    { icon: <Gift className="w-5 h-5" />, title: t('member.benefit.birthday'), desc: t('member.benefit.birthdayDesc') },
    { icon: <Star className="w-5 h-5" />, title: t('member.benefit.points'), desc: t('member.benefit.pointsDesc') },
    { icon: <Zap className="w-5 h-5" />, title: t('member.benefit.discount'), desc: t('member.benefit.discountDesc') },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <BottomNav />
      <header className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white">
        <div className="flex items-center justify-between p-4">
          <button onClick={() => navigate('/profile')} className="p-1"><ChevronLeft className="w-6 h-6" /></button>
          <h1 className="font-bold text-lg">{t('member.memberCenter')}</h1>
          <div className="w-6" />
        </div>
        <div className="px-4 pb-6">
          <div className="flex items-center gap-3 mb-4">
            <Crown className="w-8 h-8" />
            <div><p className="font-bold text-lg">{t(`member.${level}`)}</p><p className="text-sm text-white/80">{t('member.currentLevel')}</p></div>
          </div>
          <Progress value={50} className="h-2 bg-white/30" />
        </div>
      </header>
      <div className="p-4 space-y-4">
        <Card className="p-4">
          <h3 className="font-bold mb-4">{t('member.benefits')}</h3>
          <div className="space-y-4">
            {benefits.map((benefit, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="p-2 bg-yellow-100 rounded-lg text-yellow-600">{benefit.icon}</div>
                <div><p className="font-medium">{benefit.title}</p><p className="text-sm text-gray-500">{benefit.desc}</p></div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
