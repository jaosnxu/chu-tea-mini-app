import { useTranslation } from 'react-i18next';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useCart } from '@/contexts/CartContext';
import { getLocalizedText } from '@/lib/i18n';
import { ChevronLeft, Minus, Plus, Trash2, ShoppingCart } from 'lucide-react';
import { useTelegramMainButton } from '@/hooks/useTelegramMainButton';
import { isTelegramWebApp } from '@/lib/telegram';

export default function Cart() {
  const { t } = useTranslation();
  const [, navigate] = useLocation();
  const { teaCartItems, teaCartTotal, updateQuantity, removeItem, clearCart, isLoading } = useCart();
  const isTelegramApp = isTelegramWebApp();
  
  // 集成 Telegram 主按钮
  useTelegramMainButton(
    teaCartItems.length > 0 ? {
      text: `${t('cart.checkout')} (₽${teaCartTotal.toFixed(2)})`,
      color: '#14b8a6', // teal-600
      isVisible: true,
      isActive: !isLoading,
    } : null,
    () => navigate('/checkout')
  );

  if (teaCartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white sticky top-0 z-10 shadow-sm">
          <div className="flex items-center justify-between p-4">
            <button onClick={() => navigate('/menu')} className="p-1">
              <ChevronLeft className="w-6 h-6" />
            </button>
            <h1 className="font-bold text-lg">{t('cart.cart')}</h1>
            <div className="w-6" />
          </div>
        </header>
        <div className="flex flex-col items-center justify-center py-20">
          <ShoppingCart className="w-16 h-16 text-gray-300 mb-4" />
          <p className="text-gray-500 mb-4">{t('cart.empty')}</p>
          <Button onClick={() => navigate('/menu')}>{t('cart.goShopping')}</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <header className="bg-white sticky top-0 z-10 shadow-sm">
        <div className="flex items-center justify-between p-4">
          <button onClick={() => navigate('/menu')} className="p-1">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h1 className="font-bold text-lg">{t('cart.cart')}</h1>
          <button onClick={() => clearCart('tea')} className="text-red-500 text-sm">
            {t('cart.clearCart')}
          </button>
        </div>
      </header>

      <div className="p-4 space-y-3">
        {teaCartItems.map((item) => {
          const name = item.product 
            ? getLocalizedText({ zh: item.product.nameZh, ru: item.product.nameRu, en: item.product.nameEn })
            : 'Unknown';
          
          return (
            <Card key={item.id} className="p-3">
              <div className="flex gap-3">
                <div className="w-16 h-16 flex-shrink-0">
                  {item.product?.image ? (
                    <img src={item.product.image} alt={name} className="w-full h-full object-cover rounded-lg" />
                  ) : (
                    <div className="w-full h-full bg-gray-200 rounded-lg" />
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="font-medium">{name}</h3>
                  {item.selectedOptions && item.selectedOptions.length > 0 && (
                    <p className="text-xs text-gray-400 mt-1">
                      {item.selectedOptions.map(o => o.name).join(', ')}
                    </p>
                  )}
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-teal-600 font-bold">₽{item.unitPrice}</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="w-6 h-6 rounded-full border flex items-center justify-center"
                        disabled={isLoading}
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-6 text-center">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="w-6 h-6 rounded-full border border-teal-600 text-teal-600 flex items-center justify-center"
                        disabled={isLoading}
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="ml-2 text-red-500"
                        disabled={isLoading}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* 如果不在 Telegram 中，显示传统的底部按钮 */}
      {!isTelegramApp && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg p-4 safe-area-pb">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-gray-500">{t('cart.subtotal')}: </span>
              <span className="text-xl font-bold text-teal-600">₽{teaCartTotal.toFixed(2)}</span>
            </div>
            <Button 
              className="bg-teal-600 hover:bg-teal-700 px-8"
              onClick={() => navigate('/checkout')}
            >
              {t('cart.checkout')}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
