import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { trpc } from '@/lib/trpc';
import { ChevronLeft, Share2, Users, ShoppingBag, DollarSign, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';

export default function InfluencerCenter() {
  const { t } = useTranslation();
  const [, navigate] = useLocation();
  const [copied, setCopied] = useState(false);

  const { data: influencer } = trpc.influencer.getProfile.useQuery();
  const applyMutation = trpc.influencer.applyInfluencer.useMutation();

  const handleApply = async () => {
    try { await applyMutation.mutateAsync({}); toast.success(t('influencer.applied')); } catch { toast.error(t('common.error')); }
  };

  const handleCopy = () => {
    if (influencer?.code) {
      navigator.clipboard.writeText(`https://t.me/chuteabot?start=${influencer.code}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success(t('common.copied'));
    }
  };

  if (!influencer?.status || influencer.status !== 'active') {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white sticky top-0 z-10 shadow-sm">
          <div className="flex items-center justify-between p-4">
            <button onClick={() => navigate('/profile')} className="p-1"><ChevronLeft className="w-6 h-6" /></button>
            <h1 className="font-bold text-lg">{t('influencer.center')}</h1>
            <div className="w-6" />
          </div>
        </header>
        <div className="p-4 flex flex-col items-center justify-center min-h-[60vh]">
          <Share2 className="w-20 h-20 text-blue-500 mb-4" />
          <h2 className="text-xl font-bold mb-2">{t('influencer.becomeInfluencer')}</h2>
          <p className="text-gray-500 text-center mb-6">{t('influencer.becomeDesc')}</p>
          <Button className="bg-blue-500 hover:bg-blue-600" onClick={handleApply}>{t('influencer.applyNow')}</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-gradient-to-r from-blue-500 to-purple-500 text-white">
        <div className="flex items-center justify-between p-4">
          <button onClick={() => navigate('/profile')} className="p-1"><ChevronLeft className="w-6 h-6" /></button>
          <h1 className="font-bold text-lg">{t('influencer.center')}</h1>
          <div className="w-6" />
        </div>
        <div className="px-4 pb-6">
          <p className="text-white/80 text-sm">{t('influencer.totalCommission')}</p>
          <p className="text-3xl font-bold">₽{influencer.totalCommission || '0.00'}</p>
        </div>
      </header>
      <div className="p-4 space-y-4">
        <Card className="p-4">
          <h3 className="font-bold mb-3">{t('influencer.myLink')}</h3>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-gray-100 rounded-lg px-3 py-2 text-sm truncate">https://t.me/chuteabot?start={influencer.code}</div>
            <Button variant="outline" size="sm" onClick={handleCopy}>{copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}</Button>
          </div>
        </Card>
        <div className="grid grid-cols-3 gap-3">
          <Card className="p-4 text-center"><Users className="w-6 h-6 mx-auto text-blue-500 mb-2" /><p className="text-2xl font-bold">{influencer.totalClicks || 0}</p><p className="text-xs text-gray-500">{t('influencer.referrals')}</p></Card>
          <Card className="p-4 text-center"><ShoppingBag className="w-6 h-6 mx-auto text-green-500 mb-2" /><p className="text-2xl font-bold">{influencer.totalOrders || 0}</p><p className="text-xs text-gray-500">{t('influencer.orders')}</p></Card>
          <Card className="p-4 text-center"><DollarSign className="w-6 h-6 mx-auto text-yellow-500 mb-2" /><p className="text-2xl font-bold">₽{influencer.pendingCommission || '0'}</p><p className="text-xs text-gray-500">{t('influencer.pending')}</p></Card>
        </div>
      </div>
    </div>
  );
}
