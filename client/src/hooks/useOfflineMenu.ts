import { useState, useEffect, useCallback } from 'react';
import {
  initDB,
  updateItem,
  getAllItems,
  STORES,
} from '@/lib/indexedDB';
import { useOnlineStatus } from './useOnlineStatus';

/**
 * 菜单缓存类型
 */
interface MenuCache {
  id: string; // 'categories' | 'products-{type}'
  type: 'tea' | 'mall';
  data: any[];
  timestamp: number;
}

/**
 * 离线菜单缓存 Hook
 * 自动缓存菜单数据并在离线时提供访问
 */
export function useOfflineMenu() {
  const [isInitialized, setIsInitialized] = useState(false);
  const isOnline = useOnlineStatus();

  // 初始化 IndexedDB
  useEffect(() => {
    initDB().then(() => {
      setIsInitialized(true);
      console.log('[OfflineMenu] Initialized');
    });
  }, []);

  // 缓存分类数据
  const cacheCategories = useCallback(async (type: 'tea' | 'mall', categories: any[]) => {
    if (!isInitialized) return;

    try {
      const cache: MenuCache = {
        id: `categories-${type}`,
        type,
        data: categories,
        timestamp: Date.now(),
      };

      await updateItem(STORES.MENU_CACHE, cache);
      console.log(`[OfflineMenu] Cached ${type} categories:`, categories.length);
    } catch (error) {
      console.error('[OfflineMenu] Failed to cache categories:', error);
    }
  }, [isInitialized]);

  // 缓存商品数据
  const cacheProducts = useCallback(async (type: 'tea' | 'mall', products: any[]) => {
    if (!isInitialized) return;

    try {
      const cache: MenuCache = {
        id: `products-${type}`,
        type,
        data: products,
        timestamp: Date.now(),
      };

      await updateItem(STORES.PRODUCTS_CACHE, cache);
      console.log(`[OfflineMenu] Cached ${type} products:`, products.length);
    } catch (error) {
      console.error('[OfflineMenu] Failed to cache products:', error);
    }
  }, [isInitialized]);

  // 获取缓存的分类数据
  const getCachedCategories = useCallback(async (type: 'tea' | 'mall'): Promise<any[] | null> => {
    if (!isInitialized) return null;

    try {
      const allCache = await getAllItems<MenuCache>(STORES.MENU_CACHE);
      const cache = allCache.find((c) => c.id === `categories-${type}`);

      if (cache) {
        console.log(`[OfflineMenu] Retrieved cached ${type} categories:`, cache.data.length);
        return cache.data;
      }

      return null;
    } catch (error) {
      console.error('[OfflineMenu] Failed to get cached categories:', error);
      return null;
    }
  }, [isInitialized]);

  // 获取缓存的商品数据
  const getCachedProducts = useCallback(async (type: 'tea' | 'mall'): Promise<any[] | null> => {
    if (!isInitialized) return null;

    try {
      const allCache = await getAllItems<MenuCache>(STORES.PRODUCTS_CACHE);
      const cache = allCache.find((c) => c.id === `products-${type}`);

      if (cache) {
        console.log(`[OfflineMenu] Retrieved cached ${type} products:`, cache.data.length);
        return cache.data;
      }

      return null;
    } catch (error) {
      console.error('[OfflineMenu] Failed to get cached products:', error);
      return null;
    }
  }, [isInitialized]);

  return {
    isOnline,
    isInitialized,
    cacheCategories,
    cacheProducts,
    getCachedCategories,
    getCachedProducts,
  };
}
