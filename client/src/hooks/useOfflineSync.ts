/**
 * 离线订单同步 Hook
 * 提供离线订单存储和自动同步功能
 */

import { useEffect, useState, useCallback } from 'react';
import { offlineDB, generateOfflineOrderId, type OfflineOrder } from '@/lib/offlineDB';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';

export interface OfflineOrderInput {
  storeId: number;
  deliveryMethod: 'delivery' | 'pickup';
  deliveryAddress?: string;
  deliveryPhone?: string;
  scheduledTime?: string;
  items: Array<{
    productId: number;
    quantity: number;
    options: Record<string, any>;
    price: number;
  }>;
  couponId?: number;
  pointsUsed?: number;
  totalAmount: number;
  finalAmount: number;
  notes?: string;
}

export function useOfflineSync() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);

  const createOrderMutation = trpc.order.create.useMutation();

  // 监听网络状态
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.success('网络已恢复');
      // 延迟1秒后开始同步
      setTimeout(() => syncPendingOrders(), 1000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast.warning('网络已断开，订单将保存到本地');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // 初始化时加载待同步订单数量
  useEffect(() => {
    loadPendingCount();
  }, []);

  // 加载待同步订单数量
  const loadPendingCount = useCallback(async () => {
    try {
      const count = await offlineDB.getPendingCount();
      setPendingCount(count);
    } catch (error) {
      console.error('Failed to load pending count:', error);
    }
  }, []);

  // 保存离线订单
  const saveOfflineOrder = useCallback(async (input: OfflineOrderInput): Promise<string> => {
    const order: OfflineOrder = {
      id: generateOfflineOrderId(),
      ...input,
      createdAt: Date.now(),
      syncStatus: 'pending',
      syncAttempts: 0,
    };

    await offlineDB.saveOrder(order);
    await loadPendingCount();

    return order.id;
  }, [loadPendingCount]);

  // 同步单个订单
  const syncOrder = useCallback(async (order: OfflineOrder): Promise<void> => {
    try {
      await offlineDB.updateOrderStatus(order.id, 'syncing');

      // 调用 tRPC mutation
      const result = await createOrderMutation.mutateAsync({
        orderType: 'tea',
        orderSource: 'telegram',
        deliveryType: order.deliveryMethod,
        storeId: order.storeId,
        remark: order.notes,
        items: order.items.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.price.toString(),
          selectedOptions: Object.entries(item.options).map(([name, value]) => ({
            name,
            value: String(value),
            price: '0',
          })),
        })),
      });

      // 同步成功
      await offlineDB.updateOrderStatus(order.id, 'synced');
      console.log(`Order ${order.id} synced successfully, server order ID: ${result.orderId}`);
    } catch (error) {
      // 同步失败
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      await offlineDB.updateOrderStatus(order.id, 'failed', errorMessage);
      throw error;
    }
  }, [createOrderMutation]);

  // 同步所有待同步订单
  const syncPendingOrders = useCallback(async () => {
    if (isSyncing || !isOnline) {
      return;
    }

    try {
      setIsSyncing(true);

      const pendingOrders = await offlineDB.getPendingOrders();
      
      if (pendingOrders.length === 0) {
        return;
      }

      console.log(`Syncing ${pendingOrders.length} offline orders`);
      toast.info(`正在同步 ${pendingOrders.length} 个离线订单...`);

      let successCount = 0;
      let failCount = 0;

      for (const order of pendingOrders) {
        try {
          await syncOrder(order);
          successCount++;
        } catch (error) {
          failCount++;
          console.error('Failed to sync order:', order.id, error);
        }
      }

      if (successCount > 0) {
        toast.success(`成功同步 ${successCount} 个订单`);
      }

      if (failCount > 0) {
        toast.error(`${failCount} 个订单同步失败`);
      }

      // 更新待同步数量
      await loadPendingCount();

      // 清理已同步的订单
      await offlineDB.cleanupSyncedOrders();

    } catch (error) {
      console.error('Sync error:', error);
      toast.error('同步失败');
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing, isOnline, syncOrder, loadPendingCount]);

  // 获取所有离线订单
  const getAllOfflineOrders = useCallback(async (): Promise<OfflineOrder[]> => {
    return await offlineDB.getAllOrders();
  }, []);

  return {
    isOnline,
    pendingCount,
    isSyncing,
    saveOfflineOrder,
    syncPendingOrders,
    getAllOfflineOrders,
  };
}
