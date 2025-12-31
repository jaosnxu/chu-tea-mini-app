import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Ticket, ChevronRight, Check } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { getLocalizedText } from '@/lib/i18n';

interface CouponSelectorProps {
  orderAmount: number;
  items: Array<{ productId: number; quantity: number; price: number }>;
  selectedCouponId?: number | null;
  onSelectCoupon: (couponId: number | null, discount: number) => void;
  disabled?: boolean;
}

interface UserCoupon {
  id: number;
  templateId: number;
  status: string;
  expireAt: Date | null;
  template: {
    id: number;
    code: string;
    nameZh: string;
    nameRu: string;
    nameEn: string;
    descriptionZh?: string | null;
    descriptionRu?: string | null;
    descriptionEn?: string | null;
    type: string;
    value: string;
    minOrderAmount?: string | null;
    maxDiscount?: string | null;
  };
}

export function CouponSelector({ orderAmount, items, selectedCouponId, onSelectCoupon, disabled = false }: CouponSelectorProps) {
  const { t } = useTranslation();
  const [showDialog, setShowDialog] = useState(false);
  const [calculatingCouponId, setCalculatingCouponId] = useState<number | null>(null);

  // 查询用户可用优惠券
  const { data: coupons, isLoading } = trpc.coupon.available.useQuery({
    orderAmount: orderAmount.toString(),
    productIds: items.map(item => item.productId),
  });

  // 计算优惠券折扣
  const calculateDiscountMutation = trpc.coupon.calculateDiscount.useMutation();

  const selectedCoupon = coupons?.find((c: UserCoupon) => c.id === selectedCouponId);

  const handleSelectCoupon = async (coupon: UserCoupon) => {
    if (coupon.id === selectedCouponId) {
      // 取消选择
      onSelectCoupon(null, 0);
      setShowDialog(false);
      return;
    }

    setCalculatingCouponId(coupon.id);
    try {
      const result = await calculateDiscountMutation.mutateAsync({
        couponId: coupon.id,
        orderAmount,
        items,
      });

      onSelectCoupon(coupon.id, result.discount.discount);
      setShowDialog(false);
    } catch (error: any) {
      console.error('Failed to calculate discount:', error);
      // 如果计算失败，仍然允许选择，但折扣为0
      onSelectCoupon(coupon.id, 0);
    } finally {
      setCalculatingCouponId(null);
    }
  };

  const getCouponTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      fixed: t('coupon.type.fixed'),
      percent: t('coupon.type.percent'),
      product: t('coupon.type.product'),
      gift: t('coupon.type.gift'),
      buy_one_get_one: t('coupon.type.buyOneGetOne'),
      free_product: t('coupon.type.freeProduct'),
    };
    return labels[type] || type;
  };

  const getCouponValueDisplay = (coupon: UserCoupon) => {
    const template = coupon.template;
    switch (template.type) {
      case 'fixed':
        return `₽${template.value}`;
      case 'percent':
        return `${template.value}%`;
      case 'buy_one_get_one':
        return t('coupon.buyOneGetOne');
      case 'free_product':
        return t('coupon.freeProduct');
      default:
        return template.value;
    }
  };

  const isAvailable = (coupon: UserCoupon) => {
    const minAmount = coupon.template.minOrderAmount ? parseFloat(coupon.template.minOrderAmount) : 0;
    return orderAmount >= minAmount;
  };

  return (
    <>
      <Card 
        className={`p-4 transition-colors ${
          disabled 
            ? 'opacity-50 cursor-not-allowed' 
            : 'cursor-pointer hover:bg-gray-50'
        }`} 
        onClick={() => !disabled && setShowDialog(true)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Ticket className="w-5 h-5 text-teal-600" />
            <div>
              <p className="font-medium">
                {selectedCoupon 
                  ? getLocalizedText({ 
                      zh: selectedCoupon.template.nameZh, 
                      ru: selectedCoupon.template.nameRu, 
                      en: selectedCoupon.template.nameEn 
                    })
                  : t('coupon.selectCoupon')}
              </p>
              {selectedCoupon && (
                <p className="text-sm text-teal-600">
                  {t('coupon.saving')} ₽{calculateDiscountMutation.data?.discount.discount.toFixed(2) || '0.00'}
                </p>
              )}
              {!selectedCoupon && coupons && coupons.length > 0 && (
                <p className="text-sm text-gray-500">
                  {t('coupon.available', { count: coupons.filter((c: UserCoupon) => isAvailable(c)).length })}
                </p>
              )}
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-400" />
        </div>
      </Card>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('coupon.selectCoupon')}</DialogTitle>
          </DialogHeader>

          <div className="space-y-3 mt-4">
            {isLoading && (
              <div className="text-center py-8 text-gray-500">
                {t('common.loading')}
              </div>
            )}

            {!isLoading && coupons && coupons.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                {t('coupon.noCoupons')}
              </div>
            )}

            {!isLoading && coupons && coupons.map((coupon: UserCoupon) => {
              const available = isAvailable(coupon);
              const isSelected = coupon.id === selectedCouponId;
              const isCalculating = coupon.id === calculatingCouponId;

              return (
                <Card 
                  key={coupon.id} 
                  className={`p-4 cursor-pointer transition-all ${
                    available 
                      ? isSelected 
                        ? 'border-teal-600 bg-teal-50' 
                        : 'hover:border-teal-300'
                      : 'opacity-50 cursor-not-allowed'
                  }`}
                  onClick={() => available && !isCalculating && handleSelectCoupon(coupon)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-lg text-teal-600">
                          {getCouponValueDisplay(coupon)}
                        </span>
                        <span className="px-2 py-0.5 rounded text-xs bg-teal-100 text-teal-700">
                          {getCouponTypeLabel(coupon.template.type)}
                        </span>
                      </div>
                      <p className="font-medium">
                        {getLocalizedText({ 
                          zh: coupon.template.nameZh, 
                          ru: coupon.template.nameRu, 
                          en: coupon.template.nameEn 
                        })}
                      </p>
                      {coupon.template.descriptionZh && (
                        <p className="text-sm text-gray-500 mt-1">
                          {getLocalizedText({ 
                            zh: coupon.template.descriptionZh, 
                            ru: coupon.template.descriptionRu || '', 
                            en: coupon.template.descriptionEn || '' 
                          })}
                        </p>
                      )}
                      {coupon.template.minOrderAmount && (
                        <p className="text-xs text-gray-400 mt-1">
                          {t('coupon.minOrder')}: ₽{coupon.template.minOrderAmount}
                        </p>
                      )}
                      {!available && (
                        <p className="text-xs text-red-500 mt-1">
                          {t('coupon.notMeetRequirement')}
                        </p>
                      )}
                    </div>
                    {isSelected && (
                      <Check className="w-5 h-5 text-teal-600 flex-shrink-0 ml-2" />
                    )}
                    {isCalculating && (
                      <div className="w-5 h-5 border-2 border-teal-600 border-t-transparent rounded-full animate-spin flex-shrink-0 ml-2" />
                    )}
                  </div>
                </Card>
              );
            })}

            {selectedCouponId && (
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => {
                  onSelectCoupon(null, 0);
                  setShowDialog(false);
                }}
              >
                {t('coupon.notUse')}
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
