import { useTranslation } from 'react-i18next';
import { useLocation } from 'wouter';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { trpc } from '@/lib/trpc';
import { getLocalizedText } from '@/lib/i18n';
import { ChevronLeft, Ticket } from 'lucide-react';
import { BottomNav } from '@/components/BottomNav';

export default function Coupons() {
  const { t } = useTranslation();
  const [, navigate] = useLocation();
  const { data: coupons = [], isLoading } = trpc.coupon.list.useQuery();

  const availableCoupons = coupons.filter((c: { status: string }) => c.status === 'available');
  const usedCoupons = coupons.filter((c: { status: string }) => c.status === 'used');
  const expiredCoupons = coupons.filter((c: { status: string }) => c.status === 'expired');

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <BottomNav />
      <header className="bg-white sticky top-0 z-10 shadow-sm">
        <div className="flex items-center justify-between p-4">
          <button onClick={() => navigate('/profile')} className="p-1"><ChevronLeft className="w-6 h-6" /></button>
          <h1 className="font-bold text-lg">{t('coupon.myCoupons')}</h1>
          <div className="w-6" />
        </div>
      </header>
      <Tabs defaultValue="available" className="w-full">
        <TabsList className="w-full justify-start px-4 bg-white border-b">
          <TabsTrigger value="available">{t('coupon.available')} ({availableCoupons.length})</TabsTrigger>
          <TabsTrigger value="used">{t('coupon.used')} ({usedCoupons.length})</TabsTrigger>
          <TabsTrigger value="expired">{t('coupon.expired')} ({expiredCoupons.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="available" className="p-4 space-y-3">
          {isLoading ? <div className="flex justify-center py-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600" /></div> : 
           availableCoupons.length === 0 ? <div className="flex flex-col items-center py-20"><Ticket className="w-16 h-16 text-gray-300 mb-4" /><p className="text-gray-500">{t('coupon.noCoupons')}</p></div> :
           availableCoupons.map((coupon: any) => <CouponCard key={coupon.id} coupon={coupon} />)}
        </TabsContent>
        <TabsContent value="used" className="p-4 space-y-3">{usedCoupons.map((coupon: any) => <CouponCard key={coupon.id} coupon={coupon} disabled />)}</TabsContent>
        <TabsContent value="expired" className="p-4 space-y-3">{expiredCoupons.map((coupon: any) => <CouponCard key={coupon.id} coupon={coupon} disabled />)}</TabsContent>
      </Tabs>
    </div>
  );
}

function CouponCard({ coupon, disabled }: { coupon: any; disabled?: boolean }) {
  const { t } = useTranslation();
  const name = coupon.template ? getLocalizedText({ zh: coupon.template.nameZh, ru: coupon.template.nameRu, en: coupon.template.nameEn }) : '';
  return (
    <Card className={`overflow-hidden ${disabled ? 'opacity-60' : ''}`}>
      <div className="flex">
        <div className="bg-gradient-to-br from-orange-400 to-pink-500 text-white p-4 w-24 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold">₽{coupon.template?.value}</span>
          <span className="text-xs">{t('coupon.off')}</span>
        </div>
        <div className="flex-1 p-3">
          <h3 className="font-medium">{name}</h3>
          <p className="text-xs text-gray-500 mt-1">{t('coupon.minAmount', { amount: coupon.template?.minAmount })}</p>
          <p className="text-xs text-gray-400 mt-1">{t('coupon.expiresAt', { date: new Date(coupon.expiresAt).toLocaleDateString() })}</p>
        </div>
      </div>
    </Card>
  );
}
