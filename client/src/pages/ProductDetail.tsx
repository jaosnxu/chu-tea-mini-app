import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useParams } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { trpc } from '@/lib/trpc';
import { useCart } from '@/contexts/CartContext';
import { useTelegramContext } from '@/contexts/TelegramContext';
import { getLocalizedText } from '@/lib/i18n';
import { ChevronLeft, Minus, Plus, ShoppingCart, Star } from 'lucide-react';
import { toast } from 'sonner';
import { useTelegramBackButton } from '@/hooks/useTelegramBackButton';
import { ProductReviews } from '@/components/ProductReviews';
import LazyImage from '@/components/LazyImage';

export default function ProductDetail() {
  const { t } = useTranslation();
  const [, navigate] = useLocation();
  const params = useParams<{ id: string }>();
  const { addToCart, teaCartCount } = useCart();
  const { hapticFeedback } = useTelegramContext();
  
  // 显示 Telegram 返回按钮
  useTelegramBackButton(true, () => navigate('/menu'));
  
  const [quantity, setQuantity] = useState(1);
  const [selectedOptions, setSelectedOptions] = useState<Record<number, { itemId: number; name: string; price: string }>>({});
  const [isAdding, setIsAdding] = useState(false);
  const [isBuying, setIsBuying] = useState(false);
  
  const buyNowMutation = trpc.order.buyNow.useMutation();

  const { data: product, isLoading } = trpc.product.getById.useQuery(
    { id: parseInt(params.id || '0') },
    { enabled: !!params.id }
  );

  const { data: options = [] } = trpc.product.getOptions.useQuery(
    { productId: parseInt(params.id || '0') },
    { enabled: !!params.id }
  );

  // 初始化默认选项（根据选项类型决定是否默认选中）
  useEffect(() => {
    if (options.length > 0) {
      const defaults: Record<number, { itemId: number; name: string; price: string }> = {};
      options.forEach((option: any) => {
        // 小料（topping）默认不选，其他选项选中默认值
        const optionType = option.type?.toLowerCase() || '';
        if (optionType === 'topping') {
          // 小料默认不选，用户手动选择
          return;
        }
        
        const defaultItem = option.items?.find((i: any) => i.isDefault) || option.items?.[0];
        if (defaultItem) {
          defaults[option.id] = {
            itemId: defaultItem.id,
            name: getLocalizedText({ zh: defaultItem.nameZh, ru: defaultItem.nameRu, en: defaultItem.nameEn }),
            price: defaultItem.priceAdjust || '0',
          };
        }
      });
      setSelectedOptions(defaults);
    }
  }, [options]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <p className="text-gray-500 mb-4">{t('error.notFound')}</p>
        <Button onClick={() => navigate('/menu')}>{t('common.back')}</Button>
      </div>
    );
  }

  const name = getLocalizedText({ zh: product.nameZh, ru: product.nameRu, en: product.nameEn });
  const description = getLocalizedText({ zh: product.descriptionZh || '', ru: product.descriptionRu || '', en: product.descriptionEn || '' });
  
  // 计算总价
  const basePrice = parseFloat(product.basePrice);
  const optionsPrice = Object.values(selectedOptions).reduce((sum, opt) => sum + parseFloat(opt.price || '0'), 0);
  const totalPrice = (basePrice + optionsPrice) * quantity;

  const handleAddToCart = async () => {
    setIsAdding(true);
    hapticFeedback?.('impact', 'medium');
    
    try {
      const optionsArray = Object.entries(selectedOptions).map(([optionId, opt]) => ({
        optionId: parseInt(optionId),
        itemId: opt.itemId,
        name: opt.name,
        price: opt.price,
      }));

      await addToCart({
        productId: product.id,
        quantity,
        selectedOptions: optionsArray,
        unitPrice: (basePrice + optionsPrice).toFixed(2),
        cartType: 'tea',
      });

      toast.success(t('menu.addedToCart'));
    } catch (error) {
      toast.error(t('common.error'));
    } finally {
      setIsAdding(false);
    }
  };
  
  const handleBuyNow = async () => {
    setIsBuying(true);
    hapticFeedback?.('impact', 'heavy');
    
    try {
      const optionsArray = Object.entries(selectedOptions).map(([optionId, opt]) => ({
        optionId: parseInt(optionId),
        itemId: opt.itemId,
        name: opt.name,
        price: opt.price,
      }));

      const order = await buyNowMutation.mutateAsync({
        productId: product.id,
        quantity,
        selectedOptions: optionsArray,
        orderType: 'tea',
      });

      toast.success(t('menu.orderCreated'));
      // 跳转到订单详情页面
      navigate(`/order/${order.orderId}`);
    } catch (error) {
      toast.error(t('common.error'));
    } finally {
      setIsBuying(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* 头部 */}
      <header className="bg-white sticky top-0 z-10 shadow-sm">
        <div className="flex items-center justify-between p-4">
          <button onClick={() => window.history.back()} className="p-1">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h1 className="font-bold text-lg">{t('menu.productDetail')}</h1>
          <div className="relative" onClick={() => navigate('/cart')}>
            <ShoppingCart className="w-6 h-6 text-gray-600" />
            {teaCartCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {teaCartCount}
              </span>
            )}
          </div>
        </div>
      </header>

      {/* 商品图片 */}
      <div className="bg-white">
        {product.image ? (
          <LazyImage
            src={product.image}
            alt={name}
            containerClassName="w-full h-64"
            className="w-full h-64 object-cover"
          />
        ) : (
          <div className="w-full h-64 bg-gray-200 flex items-center justify-center text-gray-400">
            No Image
          </div>
        )}
      </div>

      {/* 商品信息 */}
      <div className="bg-white p-4 mt-2">
        <h2 className="text-xl font-bold">{name}</h2>
        {description && <p className="text-gray-500 mt-2">{description}</p>}
        <div className="flex items-baseline gap-2 mt-3">
          <span className="text-2xl font-bold text-teal-600">₽{product.basePrice}</span>
          {product.originalPrice && parseFloat(product.originalPrice) > parseFloat(product.basePrice) && (
            <span className="text-gray-400 line-through">₽{product.originalPrice}</span>
          )}
        </div>
      </div>

      {/* 规格选择 */}
      {options.map((option: any) => {
        const optionName = getLocalizedText({ zh: option.nameZh || '', ru: option.nameRu || '', en: option.nameEn || '' });
        
        return (
          <Card key={option.id} className="mx-4 mt-3 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium">{optionName}</h3>
              {option.isRequired && (
                <span className="text-xs text-red-500">{t('common.required')}</span>
              )}
            </div>
            <RadioGroup
              value={selectedOptions[option.id]?.itemId?.toString()}
              onValueChange={(value) => {
                const item = option.items?.find((i: any) => i.id === parseInt(value));
                if (item) {
                  setSelectedOptions(prev => ({
                    ...prev,
                    [option.id]: {
                      itemId: item.id,
                      name: getLocalizedText({ zh: item.nameZh, ru: item.nameRu, en: item.nameEn }),
                      price: item.priceAdjust || '0',
                    }
                  }));
                }
              }}
            >
              <div className="grid grid-cols-3 gap-2">
                {option.items?.map((item: any) => {
                  const itemName = getLocalizedText({ zh: item.nameZh, ru: item.nameRu, en: item.nameEn });
                  const isSelected = selectedOptions[option.id]?.itemId === item.id;
                  const priceAdjust = parseFloat(item.priceAdjust || '0');
                  
                  return (
                    <div key={item.id}>
                      <RadioGroupItem value={item.id.toString()} id={`item-${item.id}`} className="sr-only" />
                      <Label
                        htmlFor={`item-${item.id}`}
                        className={`block text-center py-2 px-3 rounded-lg border cursor-pointer transition-colors ${
                          isSelected
                            ? 'border-teal-600 bg-teal-50 text-teal-600'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <span className="text-sm">{itemName}</span>
                        {priceAdjust > 0 && (
                          <span className="text-xs text-gray-400 block">+₽{priceAdjust}</span>
                        )}
                      </Label>
                    </div>
                  );
                })}
              </div>
            </RadioGroup>
          </Card>
        );
      })}

      {/* 评价展示 */}
      <div className="p-4">
        <ProductReviews productId={product.id} productName={name} />
      </div>

      {/* 底部购买栏 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg p-4 safe-area-pb">
        <div className="flex items-center gap-3 mb-3">
          <button
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
            className="w-10 h-10 rounded-full border flex items-center justify-center"
            disabled={quantity <= 1}
          >
            <Minus className="w-4 h-4" />
          </button>
          <span className="font-bold text-lg flex-1 text-center">{quantity}</span>
          <button
            onClick={() => setQuantity(quantity + 1)}
            className="w-10 h-10 rounded-full border border-teal-600 text-teal-600 flex items-center justify-center"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1 border-teal-600 text-teal-600 hover:bg-teal-50"
            onClick={handleAddToCart}
            disabled={isAdding || isBuying}
          >
            {isAdding ? t('common.loading') : t('menu.addToCart')}
          </Button>
          <Button
            className="flex-1 bg-teal-600 hover:bg-teal-700"
            onClick={handleBuyNow}
            disabled={isAdding || isBuying}
          >
            {isBuying ? t('common.loading') : `${t('menu.buyNow')} ₽${totalPrice.toFixed(2)}`}
          </Button>
        </div>
      </div>
    </div>
  );
}
