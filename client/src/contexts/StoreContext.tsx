import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';

// 门店类型
export interface Store {
  id: number;
  code: string;
  nameZh: string;
  nameRu: string;
  nameEn: string;
  addressZh: string | null;
  addressRu: string | null;
  addressEn: string | null;
  phone: string | null;
  latitude: string | null;
  longitude: string | null;
  openTime: string | null;
  closeTime: string | null;
  isOpen: boolean;
  status: 'active' | 'inactive' | 'maintenance';
  deliveryRadius: number | null;
  minOrderAmount: string | null;
  deliveryFee: string | null;
  distance?: number;
}

// 位置类型
interface Location {
  latitude: number;
  longitude: number;
}

// Context 类型
interface StoreContextType {
  stores: Store[];
  currentStore: Store | null;
  isLoading: boolean;
  error: string | null;
  userLocation: Location | null;
  isLocating: boolean;
  locationError: string | null;
  setCurrentStore: (store: Store) => void;
  refreshStores: () => void;
  requestLocation: () => Promise<void>;
  getNearestStore: () => Store | null;
}

// 创建 Context
const StoreContext = createContext<StoreContextType | null>(null);

// 计算两点之间的距离（米）
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Provider 组件
export function StoreProvider({ children }: { children: ReactNode }) {
  const [stores, setStores] = useState<Store[]>([]);
  const [currentStore, setCurrentStoreState] = useState<Store | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<Location | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  // 请求用户位置
  const requestLocation = useCallback(async () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported');
      return;
    }

    setIsLocating(true);
    setLocationError(null);

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000,
        });
      });

      setUserLocation({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });
    } catch (err) {
      const geoError = err as GeolocationPositionError;
      switch (geoError.code) {
        case geoError.PERMISSION_DENIED:
          setLocationError('Location permission denied');
          break;
        case geoError.POSITION_UNAVAILABLE:
          setLocationError('Location unavailable');
          break;
        case geoError.TIMEOUT:
          setLocationError('Location request timeout');
          break;
        default:
          setLocationError('Failed to get location');
      }
    } finally {
      setIsLocating(false);
    }
  }, []);

  // 加载门店数据
  const loadStores = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/trpc/store.list');
      const data = await response.json();
      
      if (data.result?.data) {
        let storeList = data.result.data as Store[];
        
        // 如果有用户位置，计算距离并排序
        if (userLocation) {
          storeList = storeList.map(store => {
            if (store.latitude && store.longitude) {
              const distance = calculateDistance(
                userLocation.latitude,
                userLocation.longitude,
                parseFloat(store.latitude),
                parseFloat(store.longitude)
              );
              return { ...store, distance };
            }
            return store;
          }).sort((a, b) => (a.distance || Infinity) - (b.distance || Infinity));
        }
        
        setStores(storeList);
        
        // 如果没有选中门店，自动选择
        if (!currentStore && storeList.length > 0) {
          const savedStoreId = localStorage.getItem('chu-tea-store-id');
          if (savedStoreId) {
            const savedStore = storeList.find(s => s.id === parseInt(savedStoreId));
            if (savedStore) {
              setCurrentStoreState(savedStore);
              setIsLoading(false);
              return;
            }
          }
          setCurrentStoreState(storeList[0]);
        }
      }
    } catch (err) {
      setError('Failed to load stores');
    } finally {
      setIsLoading(false);
    }
  }, [userLocation, currentStore]);

  // 设置当前门店
  const setCurrentStore = useCallback((store: Store) => {
    setCurrentStoreState(store);
    localStorage.setItem('chu-tea-store-id', store.id.toString());
  }, []);

  // 刷新门店列表
  const refreshStores = useCallback(() => {
    loadStores();
  }, [loadStores]);

  // 获取最近的门店
  const getNearestStore = useCallback((): Store | null => {
    if (stores.length === 0) return null;
    if (!userLocation) return stores[0];
    
    return stores.reduce((nearest, store) => {
      if (!store.distance) return nearest;
      if (!nearest.distance) return store;
      return store.distance < nearest.distance ? store : nearest;
    }, stores[0]);
  }, [stores, userLocation]);

  // 初始化
  useEffect(() => {
    requestLocation();
  }, [requestLocation]);

  useEffect(() => {
    loadStores();
  }, [loadStores]);

  return (
    <StoreContext.Provider
      value={{
        stores,
        currentStore,
        isLoading,
        error,
        userLocation,
        isLocating,
        locationError,
        setCurrentStore,
        refreshStores,
        requestLocation,
        getNearestStore,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

// 使用 Context 的 Hook
export function useStore() {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
}

export default StoreContext;
