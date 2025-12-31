import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { trpc } from '@/lib/trpc';
import { useCart } from '@/contexts/CartContext';
import { useStore } from '@/contexts/StoreContext';
import { getLocalizedText } from '@/lib/i18n';
import { ChevronLeft, MapPin, Clock, Ticket, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { useTelegramMainButton } from '@/hooks/useTelegramMainButton';
import { isTelegramWebApp } from '@/lib/telegram';

export default function Checkout() {
  const { t } = useTranslation();
  const [, navigate] = useLocation();
  const { teaCartItems, teaCartTotal, clearCart } = useCart();
  const { currentStore } = useStore();
  const isTelegramApp = isTelegramWebApp();
  
  const [deliveryType, setDeliveryType] = useState<'pickup' | 'delivery'>('pickup');
  const [remark, setRemark] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createOrderMutation = trpc.order.create.useMutation();

  const storeName = currentStore 
    ? getLocalizedText({ zh: currentStore.nameZh, ru: currentStore.nameRu, en: currentStore.nameEn })
    : '';

  const handleSubmit = async () => {
    if (teaCartItems.length === 0) {
      toast.error(t('cart.empty'));
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. 创建订单
      const result = await createOrderMutation.mutateAsync({
        orderType: 'tea',
        orderSource: 'telegram',
        deliveryType,
        storeId: currentStore?.id,
        remark,
        items: teaCartItems.map(item => ({
          productId: item.productId,
          skuId: item.skuId || undefined,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          selectedOptions: item.selectedOptions?.map(o => ({
            name: o.name,
            value: o.name,
            price: o.price,
          })),
        })),
      });

      toast.success(t('order.createOrder'));
      
      // 2. 跳转到支付页面（带上订单 ID）
      navigate(`/payment/${result.orderId}`);
    } catch (error) {
      toast.error(t('common.error'));
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // 集成 Telegram 主按钮
  const mainButtonControls = useTelegramMainButton(
    {
      text: isSubmitting ? t('common.loading') : `${t('order.payNow')} ₽${teaCartTotal.toFixed(2)}`,
      color: '#14b8a6', // teal-600
      isVisible: true,
      isActive: !isSubmitting && teaCartItems.length > 0,
      isProgressVisible: isSubmitting,
    },
    handleSubmit
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <header className="bg-white sticky top-0 z-10 shadow-sm">
        <div className="flex items-center justify-between p-4">
          <button onClick={() => navigate('/cart')} className="p-1">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h1 className="font-bold text-lg">{t('order.createOrder')}</h1>
          <div className="w-6" />
        </div>
      </header>

      <div className="p-4 space-y-4">
        {/* 配送方式 */}
        <Card className="p-4">
          <h3 className="font-medium mb-3">{t('order.deliveryType')}</h3>
          <RadioGroup value={deliveryType} onValueChange={(v) => setDeliveryType(v as 'pickup' | 'delivery')}>
            <div className="flex gap-4">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="pickup" id="pickup" />
                <Label htmlFor="pickup">{t('order.pickup')}</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="delivery" id="delivery" />
                <Label htmlFor="delivery">{t('order.delivery')}</Label>
              </div>
            </div>
          </RadioGroup>
        </Card>

        {/* 门店信息 */}
        {deliveryType === 'pickup' && currentStore && (
          <Card className="p-4">
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-teal-600 mt-0.5" />
              <div>
                <p className="font-medium">{storeName}</p>
                <p className="text-sm text-gray-500 mt-1">
                  {getLocalizedText({ zh: currentStore.addressZh || '', ru: currentStore.addressRu || '', en: currentStore.addressEn || '' })}
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* 商品列表 */}
        <Card className="p-4">
          <h3 className="font-medium mb-3">{t('order.orderSummary')}</h3>
          <div className="space-y-3">
            {teaCartItems.map((item) => {
              const name = item.product 
                ? getLocalizedText({ zh: item.product.nameZh, ru: item.product.nameRu, en: item.product.nameEn })
                : 'Unknown';
              return (
                <div key={item.id} className="flex justify-between text-sm">
                  <span>{name} x{item.quantity}</span>
                  <span>₽{(parseFloat(item.unitPrice) * item.quantity).toFixed(2)}</span>
                </div>
              );
            })}
          </div>
          <div className="border-t mt-3 pt-3 flex justify-between font-bold">
            <span>{t('order.total')}</span>
            <span className="text-teal-600">₽{teaCartTotal.toFixed(2)}</span>
          </div>
        </Card>

        {/* 备注 */}
        <Card className="p-4">
          <h3 className="font-medium mb-3">{t('order.remark')}</h3>
          <Textarea
            placeholder={t('order.remarkPlaceholder')}
            value={remark}
            onChange={(e) => setRemark(e.target.value)}
            rows={3}
          />
        </Card>
      </div>

      {/* 如果不在 Telegram 中，显示传统的底部按钮 */}
      {!isTelegramApp && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg p-4 safe-area-pb">
          <Button 
            className="w-full bg-teal-600 hover:bg-teal-700 py-6"
            onClick={handleSubmit}
            disabled={isSubmitting || teaCartItems.length === 0}
          >
            {isSubmitting ? t('common.loading') : `${t('order.payNow')} ₽${teaCartTotal.toFixed(2)}`}
          </Button>
        </div>
      )}
    </div>
  );
}
