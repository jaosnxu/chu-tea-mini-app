import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { trpc } from '@/lib/trpc';
import { useStore } from '@/contexts/StoreContext';
import { useCart } from '@/contexts/CartContext';
import { getLocalizedText } from '@/lib/i18n';
import { 
  MapPin, 
  ShoppingCart, 
  Plus,
  ChevronLeft,
  Search,
  Flame
} from 'lucide-react';
import { BottomNav } from '@/components/BottomNav';
import LazyImage from '@/components/LazyImage';

export default function Menu() {
  const { t } = useTranslation();
  const [, navigate] = useLocation();
  const { currentStore } = useStore();
  const { teaCartCount, teaCartTotal } = useCart();
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);

  // 获取分类
  const { data: categories = [] } = trpc.category.list.useQuery({ type: 'tea' });

  // 获取商品
  const { data: products = [], isLoading } = trpc.product.list.useQuery({
    type: 'tea',
    categoryId: selectedCategory || undefined,
  });

  // 默认选中第一个分类
  useEffect(() => {
    if (categories.length > 0 && !selectedCategory) {
      setSelectedCategory(categories[0].id);
    }
  }, [categories, selectedCategory]);

  const storeName = currentStore 
    ? getLocalizedText({ zh: currentStore.nameZh, ru: currentStore.nameRu, en: currentStore.nameEn })
    : t('store.selectStore');

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* 底部固定导航栏 */}
      <BottomNav />
      {/* 头部 */}
      <header className="bg-white sticky top-0 z-10 shadow-sm">
        <div className="flex items-center justify-between p-4">
          <button onClick={() => navigate('/')} className="p-1">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h1 className="font-bold text-lg">{t('nav.order')}</h1>
          <button className="p-1">
            <Search className="w-6 h-6 text-gray-400" />
          </button>
        </div>
        
        {/* 门店信息 */}
        <div 
          className="flex items-center gap-2 px-4 pb-3 cursor-pointer"
          onClick={() => navigate('/store-selector')}
        >
          <MapPin className="w-4 h-4 text-teal-600" />
          <span className="text-sm text-gray-600">{storeName}</span>
          {currentStore?.isOpen ? (
            <Badge variant="secondary" className="bg-green-100 text-green-700 text-xs">
              {t('store.open')}
            </Badge>
          ) : (
            <Badge variant="secondary" className="bg-red-100 text-red-700 text-xs">
              {t('store.closed')}
            </Badge>
          )}
        </div>
      </header>

      <div className="flex">
        {/* 左侧分类 */}
        <ScrollArea className="w-24 bg-gray-100 h-[calc(100vh-140px)]">
          <div className="py-2">
            {categories.map((category) => {
              const name = getLocalizedText({ 
                zh: category.nameZh, 
                ru: category.nameRu, 
                en: category.nameEn 
              });
              const isActive = selectedCategory === category.id;
              
              return (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`w-full py-3 px-2 text-sm text-center transition-colors ${
                    isActive 
                      ? 'bg-white text-teal-600 font-medium border-l-2 border-teal-600' 
                      : 'text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {name}
                </button>
              );
            })}
          </div>
        </ScrollArea>

        {/* 右侧商品列表 */}
        <ScrollArea className="flex-1 h-[calc(100vh-140px)]">
          <div className="p-3 space-y-3">
            {isLoading ? (
              <div className="flex items-center justify-center py-10">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600" />
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-10 text-gray-400">
                {t('common.noData')}
              </div>
            ) : (
              products.map((product) => (
                <ProductCard 
                  key={product.id} 
                  product={product}
                  onClick={() => navigate(`/product/${product.id}`)}
                />
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      {/* 底部购物车栏 */}
      {teaCartCount > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg p-4 safe-area-pb">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <ShoppingCart className="w-7 h-7 text-teal-600" />
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {teaCartCount}
                </span>
              </div>
              <div>
                <p className="font-bold text-lg">₽{teaCartTotal.toFixed(2)}</p>
              </div>
            </div>
            <Button 
              className="bg-teal-600 hover:bg-teal-700"
              onClick={() => navigate('/cart')}
            >
              {t('cart.checkout')}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// 商品卡片组件
function ProductCard({ 
  product, 
  onClick 
}: { 
  product: {
    id: number;
    nameZh: string;
    nameRu: string;
    nameEn: string;
    descriptionZh: string | null;
    descriptionRu: string | null;
    descriptionEn: string | null;
    image: string | null;
    basePrice: string;
    originalPrice: string | null;
    isHot: boolean | null;
    isNew: boolean | null;
    stock: number | null;
  };
  onClick: () => void;
}) {
  const { t } = useTranslation();
  
  const name = getLocalizedText({ zh: product.nameZh, ru: product.nameRu, en: product.nameEn });
  const description = getLocalizedText({ 
    zh: product.descriptionZh || '', 
    ru: product.descriptionRu || '', 
    en: product.descriptionEn || '' 
  });

  const isSoldOut = (product.stock ?? 0) === 0;

  return (
    <Card 
      className={`p-3 cursor-pointer hover:shadow-md transition-shadow ${isSoldOut ? 'opacity-60' : ''}`}
      onClick={onClick}
    >
      <div className="flex gap-3">
        {/* 商品图片 */}
        <div className="relative w-20 h-20 flex-shrink-0">
          {product.image ? (
            <LazyImage
              src={product.image} 
              alt={name}
              containerClassName="w-full h-full rounded-lg"
              className="w-full h-full object-cover rounded-lg"
            />
          ) : (
            <div className="w-full h-full bg-gray-200 rounded-lg flex items-center justify-center">
              <span className="text-gray-400 text-xs">No Image</span>
            </div>
          )}
          {product.isHot && (
            <Badge className="absolute -top-1 -left-1 bg-red-500 text-white text-xs px-1">
              <Flame className="w-3 h-3" />
            </Badge>
          )}
          {product.isNew && (
            <Badge className="absolute -top-1 -right-1 bg-green-500 text-white text-xs">
              NEW
            </Badge>
          )}
        </div>

        {/* 商品信息 */}
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-gray-800 truncate">{name}</h3>
          {description && (
            <p className="text-xs text-gray-400 mt-1 line-clamp-2">{description}</p>
          )}
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-baseline gap-1">
              <span className="text-teal-600 font-bold">₽{product.basePrice}</span>
              {product.originalPrice && parseFloat(product.originalPrice) > parseFloat(product.basePrice) && (
                <span className="text-xs text-gray-400 line-through">₽{product.originalPrice}</span>
              )}
            </div>
            {isSoldOut ? (
              <Badge variant="secondary" className="text-xs">{t('menu.soldOut')}</Badge>
            ) : (
              <Button size="sm" variant="outline" className="h-7 w-7 p-0 rounded-full border-teal-600 text-teal-600">
                <Plus className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
