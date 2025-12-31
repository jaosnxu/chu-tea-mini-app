import { useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'wouter';
import { Card } from '@/components/ui/card';
import { useTelegramContext } from '@/contexts/TelegramContext';
import { 
  Coffee, 
  ShoppingBag, 
  Gift,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause
} from 'lucide-react';
import { BottomNav } from '@/components/BottomNav';
import AppStoreBadge from '@/components/AppStoreBadge';

// 广告轮播项类型
interface CarouselItem {
  id: number;
  type: 'image' | 'video';
  url: string;
  link?: string;
}

// 功能入口配置类型
interface EntryConfig {
  id: string;
  type: 'order' | 'mall' | 'coupon' | 'points';
  enabled: boolean;
  icon: React.ReactNode;
  label: string;
  path: string;
  gradient: string;
}

export default function Home() {
  const { t } = useTranslation();
  const [, navigate] = useLocation();
  const { isTelegram, setHeaderColor, setBackgroundColor } = useTelegramContext();

  // 模拟广告数据 - 实际应从后台获取
  const [topCarouselItems] = useState<CarouselItem[]>([
    { id: 1, type: 'image', url: '/products/milk-tea-cup.png', link: '/menu' },
    { id: 2, type: 'image', url: '/products/fruit-tea-cup.png', link: '/menu' },
    { id: 3, type: 'image', url: '/products/pearl-milk-tea.png', link: '/product/1' },
  ]);

  const [bottomCarouselItems] = useState<CarouselItem[]>([
    { id: 4, type: 'image', url: '/products/pearl-milk-tea.png', link: '/mall' },
    { id: 5, type: 'image', url: '/products/milk-tea-cup.png', link: '/coupons' },
    { id: 6, type: 'image', url: '/products/fruit-tea-cup.png', link: '/points' },
  ]);

  // 功能入口配置 - 可从后台控制开关和类型
  const [entryConfigs, setEntryConfigs] = useState<EntryConfig[]>([
    {
      id: 'entry1',
      type: 'order',
      enabled: true,
      icon: <Coffee className="w-10 h-10" />,
      label: t('nav.order'),
      path: '/menu',
      gradient: 'from-teal-500 to-teal-600'
    },
    {
      id: 'entry2',
      type: 'mall',
      enabled: true,
      icon: <ShoppingBag className="w-10 h-10" />,
      label: t('nav.mall'),
      path: '/mall',
      gradient: 'from-purple-500 to-purple-600'
    }
  ]);

  // 设置 Telegram 主题
  useEffect(() => {
    if (isTelegram) {
      setHeaderColor('#000000');
      setBackgroundColor('#000000');
    }
  }, [isTelegram, setHeaderColor, setBackgroundColor]);

  // 切换入口类型
  const toggleEntryType = (entryId: string) => {
    setEntryConfigs(prev => prev.map(entry => {
      if (entry.id === entryId) {
        // 循环切换类型: order -> mall -> coupon -> points -> order
        const types: Array<'order' | 'mall' | 'coupon' | 'points'> = ['order', 'mall', 'coupon', 'points'];
        const currentIndex = types.indexOf(entry.type);
        const nextIndex = (currentIndex + 1) % types.length;
        const nextType = types[nextIndex];
        
        const configs: Record<string, Partial<EntryConfig>> = {
          order: { icon: <Coffee className="w-10 h-10" />, label: t('nav.order'), path: '/menu', gradient: 'from-teal-500 to-teal-600' },
          mall: { icon: <ShoppingBag className="w-10 h-10" />, label: t('nav.mall'), path: '/mall', gradient: 'from-purple-500 to-purple-600' },
          coupon: { icon: <Gift className="w-10 h-10" />, label: t('coupon.myCoupons'), path: '/coupons', gradient: 'from-orange-400 to-pink-500' },
          points: { icon: <Sparkles className="w-10 h-10" />, label: t('points.myPoints'), path: '/points', gradient: 'from-yellow-400 to-orange-500' },
        };
        
        return { ...entry, type: nextType, ...configs[nextType] };
      }
      return entry;
    }));
  };

  // 切换入口开关
  const toggleEntryEnabled = (entryId: string) => {
    setEntryConfigs(prev => prev.map(entry => 
      entry.id === entryId ? { ...entry, enabled: !entry.enabled } : entry
    ));
  };

  return (
    <div className="min-h-screen bg-black flex flex-col pb-16">
      {/* PWA 安装引导徽章 */}
      <div className="fixed top-4 left-4 right-4 z-50">
        <AppStoreBadge />
      </div>

      {/* 上部轮播区域 */}
      <div className="flex-1">
        <MediaCarousel 
          items={topCarouselItems} 
          onItemClick={(item) => item.link && navigate(item.link)}
        />
      </div>

      {/* 中间功能入口区域 */}
      <div className="px-4 py-6 bg-gradient-to-b from-black/80 to-black/80">
        <div className="grid grid-cols-2 gap-4">
          {entryConfigs.map((entry) => (
            entry.enabled && (
              <Card 
                key={entry.id}
                className={`p-6 cursor-pointer hover:shadow-xl transition-all transform hover:scale-105 bg-gradient-to-br ${entry.gradient} text-white border-0`}
                onClick={() => navigate(entry.path)}
                onContextMenu={(e) => {
                  e.preventDefault();
                  toggleEntryType(entry.id);
                }}
              >
                <div className="flex flex-col items-center text-center">
                  <div className="bg-white/20 rounded-full p-4 mb-3">
                    {entry.icon}
                  </div>
                  <h3 className="font-bold text-xl">{entry.label}</h3>
                </div>
              </Card>
            )
          ))}
        </div>
        
        {/* 入口配置提示 */}
        <p className="text-center text-gray-500 text-xs mt-3">
          {t('home.longPressToSwitch') || '长按入口可切换功能'}
        </p>
      </div>

      {/* 下部轮播区域 */}
      <div className="flex-1">
        <MediaCarousel 
          items={bottomCarouselItems} 
          onItemClick={(item) => item.link && navigate(item.link)}
        />
      </div>

      {/* 底部导航 - 固定在屏幕底部 */}
      <BottomNav />
    </div>
  );
}

// 媒体轮播组件 - 支持图片和视频
function MediaCarousel({ 
  items, 
  onItemClick 
}: { 
  items: CarouselItem[]; 
  onItemClick?: (item: CarouselItem) => void;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // 自动轮播
  useEffect(() => {
    if (isPlaying && items.length > 1) {
      intervalRef.current = setInterval(() => {
        setCurrentIndex(prev => (prev + 1) % items.length);
      }, 5000);
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPlaying, items.length]);

  const goToPrev = () => {
    setCurrentIndex(prev => (prev - 1 + items.length) % items.length);
  };

  const goToNext = () => {
    setCurrentIndex(prev => (prev + 1) % items.length);
  };

  const togglePlayPause = () => {
    setIsPlaying(prev => !prev);
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
    }
  };

  const currentItem = items[currentIndex];

  if (!currentItem) return null;

  return (
    <div className="relative w-full h-full overflow-hidden group">
      {/* 媒体内容 */}
      <div 
        className="w-full h-full cursor-pointer"
        onClick={() => onItemClick?.(currentItem)}
      >
        {currentItem.type === 'video' ? (
          <video
            ref={videoRef}
            src={currentItem.url}
            className="w-full h-full object-cover"
            autoPlay
            muted
            loop
            playsInline
          />
        ) : (
          <img
            src={currentItem.url}
            alt=""
            className="w-full h-full object-cover"
          />
        )}
      </div>

      {/* 左右切换按钮 */}
      {items.length > 1 && (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); goToPrev(); }}
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); goToNext(); }}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </>
      )}

      {/* 播放/暂停按钮（视频时显示） */}
      {currentItem.type === 'video' && (
        <button
          onClick={(e) => { e.stopPropagation(); togglePlayPause(); }}
          className="absolute bottom-4 right-4 bg-black/50 text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
        </button>
      )}

      {/* 指示器 */}
      {items.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
          {items.map((_, index) => (
            <button
              key={index}
              onClick={(e) => { e.stopPropagation(); setCurrentIndex(index); }}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentIndex 
                  ? 'bg-white w-6' 
                  : 'bg-white/50 hover:bg-white/70'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}


