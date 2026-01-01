import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { trpc } from '@/lib/trpc';
import { useCart } from '@/contexts/CartContext';
import { getLocalizedText } from '@/lib/i18n';
import { ChevronLeft, ShoppingCart, Search, Flame } from 'lucide-react';
import { BottomNav } from '@/components/BottomNav';
import LazyImage from '@/components/LazyImage';

export default function Mall() {
  const { t } = useTranslation();
  const [, navigate] = useLocation();
  const { mallCartCount, mallCartTotal } = useCart();
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);

  const { data: categories = [] } = trpc.category.list.useQuery({ type: 'mall' });
  const { data: products = [], isLoading } = trpc.product.list.useQuery({
    type: 'mall',
    categoryId: selectedCategory || undefined,
  });

  useEffect(() => {
    if (categories.length > 0 && !selectedCategory) {
      setSelectedCategory(categories[0].id);
    }
  }, [categories, selectedCategory]);

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <BottomNav />
      <header className="bg-white sticky top-0 z-10 shadow-sm">
        <div className="flex items-center justify-between p-4">
          <button onClick={() => navigate('/')} className="p-1">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h1 className="font-bold text-lg">{t('mall.mall')}</h1>
          <button className="p-1">
            <Search className="w-6 h-6 text-gray-400" />
          </button>
        </div>
      </header>

      <div className="flex">
        <ScrollArea className="w-24 bg-gray-100 h-[calc(100vh-140px)]">
          <div className="py-2">
            {categories.map((category) => {
              const name = getLocalizedText({ zh: category.nameZh, ru: category.nameRu, en: category.nameEn });
              const isActive = selectedCategory === category.id;
              return (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`w-full py-3 px-2 text-sm text-center transition-colors ${
                    isActive ? 'bg-white text-purple-600 font-medium border-l-2 border-purple-600' : 'text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {name}
                </button>
              );
            })}
          </div>
        </ScrollArea>

        <ScrollArea className="flex-1 h-[calc(100vh-140px)]">
          <div className="p-3 grid grid-cols-2 gap-3">
            {isLoading ? (
              <div className="col-span-2 flex justify-center py-10">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
              </div>
            ) : products.length === 0 ? (
              <div className="col-span-2 text-center py-10 text-gray-400">{t('common.noData')}</div>
            ) : (
              products.map((product) => (
                <Card key={product.id} className="overflow-hidden cursor-pointer hover:shadow-md" onClick={() => navigate(`/mall/product/${product.id}`)}>
                  <div className="relative aspect-square">
                    {product.image ? (
                      <LazyImage
                        src={product.image}
                        alt={getLocalizedText({ zh: product.nameZh, ru: product.nameRu, en: product.nameEn })}
                        containerClassName="w-full h-full"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-400 text-xs">No Image</div>
                    )}
                    {product.isHot && <Badge className="absolute top-1 left-1 bg-red-500"><Flame className="w-3 h-3" /></Badge>}
                  </div>
                  <div className="p-2">
                    <h3 className="font-medium text-sm truncate">{getLocalizedText({ zh: product.nameZh, ru: product.nameRu, en: product.nameEn })}</h3>
                    <span className="text-purple-600 font-bold">₽{product.basePrice}</span>
                  </div>
                </Card>
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      {mallCartCount > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg p-4 safe-area-pb">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <ShoppingCart className="w-7 h-7 text-purple-600" />
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">{mallCartCount}</span>
              </div>
              <p className="font-bold text-lg">₽{mallCartTotal.toFixed(2)}</p>
            </div>
            <Button className="bg-purple-600 hover:bg-purple-700" onClick={() => navigate('/mall/cart')}>{t('cart.checkout')}</Button>
          </div>
        </div>
      )}
    </div>
  );
}
