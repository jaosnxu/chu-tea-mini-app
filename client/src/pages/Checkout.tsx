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
import { CouponSelector } from '@/components/CouponSelector';
import { useOfflineOrders } from '@/hooks/useOfflineOrders';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';

export default function Checkout() {
  const { t } = useTranslation();
  const [, navigate] = useLocation();
  const { teaCartItems, teaCartTotal, clearCart } = useCart();
  const { currentStore } = useStore();
  const isTelegramApp = isTelegramWebApp();
  
  const [deliveryType, setDeliveryType] = useState<'pickup' | 'delivery'>('pickup');
  const [remark, setRemark] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedCouponId, setSelectedCouponId] = useState<number | null>(null);
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [usePoints, setUsePoints] = useState(false);
  
  // 获取用户信息（积分）
  const { data: currentUser } = trpc.auth.me.useQuery();
  
  // 获取配送方式配置
  const { data: deliverySettings } = trpc.system.getDeliverySettings.useQuery();

  const createOrderMutation = trpc.order.create.useMutation();
  const { saveDraft } = useOfflineOrders();
  const isOnline = useOnlineStatus();

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
      // 检查网络状态
      if (!isOnline) {
        // 离线时保存草稿
        await saveDraft({
          type: 'tea',
          items: teaCartItems.map(item => ({
            productId: item.productId,
            productName: item.product ? getLocalizedText({ zh: item.product.nameZh, ru: item.product.nameRu, en: item.product.nameEn }) : '商品',
            quantity: item.quantity,
            price: item.unitPrice,
            options: item.selectedOptions ? item.selectedOptions as Record<string, any> : undefined,
          })),
          totalAmount: finalAmount.toString(),
          storeId: currentStore?.id,
        });
        
        toast.success('订单已保存为草稿，网络恢复后将自动提交');
        clearCart();
        navigate('/orders');
        return;
      }
      
      // 1. 创建订单
      const result = await createOrderMutation.mutateAsync({
        orderType: 'tea',
        orderSource: 'telegram',
        deliveryType,
        storeId: currentStore?.id,
        couponId: selectedCouponId || undefined,
        usePoints,
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
  
  // 计算最终金额
  let finalAmount = teaCartTotal;
  if (usePoints) {
    // 使用积分支付，金额为 0
    finalAmount = 0;
  } else if (couponDiscount > 0) {
    // 使用优惠券
    finalAmount = teaCartTotal - couponDiscount;
  }

  const handleCouponSelect = (couponId: number | null, discount: number) => {
    setSelectedCouponId(couponId);
    setCouponDiscount(discount);
    // 选择优惠券后取消积分支付
    if (couponId) {
      setUsePoints(false);
    }
  };
  
  const handlePointsToggle = (checked: boolean) => {
    setUsePoints(checked);
    // 选择积分支付后取消优惠券
    if (checked) {
      setSelectedCouponId(null);
      setCouponDiscount(0);
    }
  };
  
  // 检查积分是否足够支付订单
  const canUsePoints = currentUser && currentUser.availablePoints >= Math.ceil(teaCartTotal);

  // 集成 Telegram 主按钮
  const mainButtonControls = useTelegramMainButton(
    {
      text: isSubmitting ? t('common.loading') : `${t('order.payNow')} ₽${finalAmount.toFixed(2)}`,
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
              {deliverySettings?.enablePickup && (
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="pickup" id="pickup" />
                  <Label htmlFor="pickup">{t('order.pickup')}</Label>
                </div>
              )}
              {deliverySettings?.enableDelivery && (
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="delivery" id="delivery" />
                  <Label htmlFor="delivery">{t('order.delivery')}</Label>
                </div>
              )}
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
          <div className="border-t mt-3 pt-3 space-y-2">
            <div className="flex justify-between">
              <span>{t('order.subtotal')}</span>
              <span>₽{teaCartTotal.toFixed(2)}</span>
            </div>
            {couponDiscount > 0 && (
              <div className="flex justify-between text-teal-600">
                <span>{t('coupon.discount')}</span>
                <span>-₽{couponDiscount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-lg">
              <span>{t('order.total')}</span>
              <span className="text-teal-600">₽{finalAmount.toFixed(2)}</span>
            </div>
          </div>
        </Card>

        {/* 优惠券选择 */}
        <CouponSelector
          orderAmount={teaCartTotal}
          items={teaCartItems.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            price: parseFloat(item.unitPrice),
          }))}
          selectedCouponId={selectedCouponId}
          onSelectCoupon={handleCouponSelect}
          disabled={usePoints}
        />

        {/* 积分支付 */}
        {canUsePoints && (
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Ticket className="w-5 h-5 text-teal-600" />
                <div>
                  <p className="font-medium">{t('points.usePoints')}</p>
                  <p className="text-sm text-gray-500">
                    {t('points.available')}: {currentUser?.availablePoints} {t('points.points')}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="usePoints"
                  checked={usePoints}
                  onChange={(e) => handlePointsToggle(e.target.checked)}
                  disabled={selectedCouponId !== null}
                  className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500"
                />
                <Label htmlFor="usePoints" className="cursor-pointer">
                  {usePoints ? t('points.using') : t('points.use')}
                </Label>
              </div>
            </div>
            {usePoints && (
              <div className="mt-3 p-3 bg-teal-50 rounded-lg">
                <p className="text-sm text-teal-800">
                  {t('points.willUse')} {Math.ceil(teaCartTotal)} {t('points.points')}
                </p>
              </div>
            )}
          </Card>
        )}

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
