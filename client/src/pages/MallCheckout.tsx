import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { trpc } from '@/lib/trpc';
import { useCart } from '@/contexts/CartContext';
import { getLocalizedText } from '@/lib/i18n';
import { ChevronLeft, MapPin, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { useTelegramMainButton } from '@/hooks/useTelegramMainButton';
import { isTelegramWebApp } from '@/lib/telegram';
import { useOfflineOrders } from '@/hooks/useOfflineOrders';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';

export default function MallCheckout() {
  const { t } = useTranslation();
  const [, navigate] = useLocation();
  const { mallCartItems, mallCartTotal } = useCart();
  const [remark, setRemark] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isTelegramApp = isTelegramWebApp();

  const { data: addresses = [] } = trpc.address.list.useQuery();
  const defaultAddress = addresses.find((a: { isDefault: boolean }) => a.isDefault) || addresses[0];
  const createOrderMutation = trpc.order.create.useMutation();
  const { saveDraft } = useOfflineOrders();
  const isOnline = useOnlineStatus();

  const handleSubmit = async () => {
    if (mallCartItems.length === 0) { toast.error(t('cart.empty')); return; }
    if (!defaultAddress) { toast.error(t('address.noAddress')); navigate('/addresses'); return; }
    setIsSubmitting(true);
    try {
      // 检查网络状态
      if (!isOnline) {
        // 离线时保存草稿
        await saveDraft({
          type: 'mall',
          items: mallCartItems.map(item => ({
            productId: item.productId,
            productName: item.product ? getLocalizedText({ zh: item.product.nameZh, ru: item.product.nameRu, en: item.product.nameEn }) : '商品',
            quantity: item.quantity,
            price: item.unitPrice,
          })),
          totalAmount: mallCartTotal.toString(),
        });
        
        toast.success('订单已保存为草稿，网络恢复后将自动提交');
        navigate('/orders');
        return;
      }
      
      // 1. 创建订单
      const result = await createOrderMutation.mutateAsync({
        orderType: 'mall',
        orderSource: 'telegram',
        deliveryType: 'delivery',
        addressId: defaultAddress.id,
        remark,
        items: mallCartItems.map(item => ({ productId: item.productId, skuId: item.skuId || undefined, quantity: item.quantity, unitPrice: item.unitPrice })),
      });
      toast.success(t('order.createOrder'));
      
      // 2. 跳转到支付页面（带上订单 ID）
      navigate(`/payment/${result.orderId}`);
    } catch { toast.error(t('common.error')); }
    finally { setIsSubmitting(false); }
  };
  
  // 集成 Telegram 主按钮
  const mainButtonControls = useTelegramMainButton(
    {
      text: isSubmitting ? t('common.loading') : `${t('order.payNow')} ₽${mallCartTotal.toFixed(2)}`,
      color: '#9333ea', // purple-600
      isVisible: true,
      isActive: !isSubmitting && mallCartItems.length > 0 && !!defaultAddress,
      isProgressVisible: isSubmitting,
    },
    handleSubmit
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <header className="bg-white sticky top-0 z-10 shadow-sm">
        <div className="flex items-center justify-between p-4">
          <button onClick={() => navigate('/mall/cart')} className="p-1"><ChevronLeft className="w-6 h-6" /></button>
          <h1 className="font-bold text-lg">{t('order.createOrder')}</h1>
          <div className="w-6" />
        </div>
      </header>
      <div className="p-4 space-y-4">
        <Card className="p-4 cursor-pointer" onClick={() => navigate('/addresses')}>
          <div className="flex items-center justify-between">
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-purple-600 mt-0.5" />
              {defaultAddress ? (<div><p className="font-medium">{defaultAddress.name} {defaultAddress.phone}</p><p className="text-sm text-gray-500 mt-1">{defaultAddress.address}</p></div>) : (<p className="text-gray-500">{t('order.addAddress')}</p>)}
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </div>
        </Card>
        <Card className="p-4">
          <h3 className="font-medium mb-3">{t('order.orderSummary')}</h3>
          <div className="space-y-3">
            {mallCartItems.map((item) => {
              const name = item.product ? getLocalizedText({ zh: item.product.nameZh, ru: item.product.nameRu, en: item.product.nameEn }) : 'Unknown';
              return <div key={item.id} className="flex justify-between text-sm"><span>{name} x{item.quantity}</span><span>₽{(parseFloat(item.unitPrice) * item.quantity).toFixed(2)}</span></div>;
            })}
          </div>
          <div className="border-t mt-3 pt-3 flex justify-between font-bold"><span>{t('order.total')}</span><span className="text-purple-600">₽{mallCartTotal.toFixed(2)}</span></div>
        </Card>
        <Card className="p-4"><h3 className="font-medium mb-3">{t('order.remark')}</h3><Textarea placeholder={t('order.remarkPlaceholder')} value={remark} onChange={(e) => setRemark(e.target.value)} rows={3} /></Card>
      </div>
      {/* 如果不在 Telegram 中，显示传统的底部按钮 */}
      {!isTelegramApp && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg p-4 safe-area-pb">
          <Button className="w-full bg-purple-600 hover:bg-purple-700 py-6" onClick={handleSubmit} disabled={isSubmitting || mallCartItems.length === 0}>{isSubmitting ? t('common.loading') : `${t('order.payNow')} ₽${mallCartTotal.toFixed(2)}`}</Button>
        </div>
      )}
    </div>
  );
}
