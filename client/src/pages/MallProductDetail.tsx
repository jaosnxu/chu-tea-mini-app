import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useParams } from 'wouter';
import { Button } from '@/components/ui/button';
import { trpc } from '@/lib/trpc';
import { useCart } from '@/contexts/CartContext';
import { getLocalizedText } from '@/lib/i18n';
import { ChevronLeft, Minus, Plus, ShoppingCart } from 'lucide-react';
import { toast } from 'sonner';
import { useTelegramBackButton } from '@/hooks/useTelegramBackButton';
import LazyImage from '@/components/LazyImage';

export default function MallProductDetail() {
  const { t } = useTranslation();
  const [, navigate] = useLocation();
  const params = useParams<{ id: string }>();
  const { addToCart, mallCartCount } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);
  
  // 显示 Telegram 返回按钮
  useTelegramBackButton(true, () => navigate('/mall'));

  const { data: product, isLoading } = trpc.product.getById.useQuery(
    { id: parseInt(params.id || '0') },
    { enabled: !!params.id }
  );

  if (isLoading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" /></div>;
  if (!product) return <div className="min-h-screen flex flex-col items-center justify-center p-4"><p className="text-gray-500 mb-4">{t('error.notFound')}</p><Button onClick={() => navigate('/mall')}>{t('common.back')}</Button></div>;

  const name = getLocalizedText({ zh: product.nameZh, ru: product.nameRu, en: product.nameEn });
  const totalPrice = parseFloat(product.basePrice) * quantity;

  const handleAddToCart = async () => {
    setIsAdding(true);
    try {
      await addToCart({ productId: product.id, quantity, unitPrice: product.basePrice, cartType: 'mall' });
      toast.success(t('menu.addToCart'));
    } catch { toast.error(t('common.error')); }
    finally { setIsAdding(false); }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <header className="bg-white sticky top-0 z-10 shadow-sm">
        <div className="flex items-center justify-between p-4">
          <button onClick={() => window.history.back()} className="p-1"><ChevronLeft className="w-6 h-6" /></button>
          <h1 className="font-bold text-lg">{t('mall.productDetail')}</h1>
          <div className="relative" onClick={() => navigate('/mall/cart')}>
            <ShoppingCart className="w-6 h-6 text-gray-600" />
            {mallCartCount > 0 && <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">{mallCartCount}</span>}
          </div>
        </div>
      </header>
      <div className="bg-white">
        {product.image ? (
          <LazyImage
            src={product.image}
            alt={name}
            containerClassName="w-full h-64"
            className="w-full h-64 object-cover"
          />
        ) : (
          <div className="w-full h-64 bg-gray-200 flex items-center justify-center text-gray-400">No Image</div>
        )}
      </div>
      <div className="bg-white p-4 mt-2">
        <h2 className="text-xl font-bold">{name}</h2>
        <span className="text-2xl font-bold text-purple-600">₽{product.basePrice}</span>
      </div>
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg p-4 safe-area-pb">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-8 h-8 rounded-full border flex items-center justify-center" disabled={quantity <= 1}><Minus className="w-4 h-4" /></button>
            <span className="font-bold text-lg w-8 text-center">{quantity}</span>
            <button onClick={() => setQuantity(quantity + 1)} className="w-8 h-8 rounded-full border border-purple-600 text-purple-600 flex items-center justify-center"><Plus className="w-4 h-4" /></button>
          </div>
          <Button className="bg-purple-600 hover:bg-purple-700 px-8" onClick={handleAddToCart} disabled={isAdding}>{isAdding ? t('common.loading') : `${t('mall.addToCart')} ₽${totalPrice.toFixed(2)}`}</Button>
        </div>
      </div>
    </div>
  );
}
