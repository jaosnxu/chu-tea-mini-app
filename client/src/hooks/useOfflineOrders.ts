import { useState, useEffect, useCallback } from 'react';
import {
  initDB,
  addItem,
  getAllItems,
  updateItem,
  deleteItem,
  STORES,
  type OrderDraft,
} from '@/lib/indexedDB';
import { useOnlineStatus } from './useOnlineStatus';

/**
 * 离线订单管理 Hook
 * 支持离线保存订单草稿和自动同步
 */
export function useOfflineOrders() {
  const [drafts, setDrafts] = useState<OrderDraft[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const isOnline = useOnlineStatus();

  // 加载所有草稿
  const loadDrafts = useCallback(async () => {
    try {
      setIsLoading(true);
      await initDB();
      const allDrafts = await getAllItems<OrderDraft>(STORES.ORDER_DRAFTS);
      setDrafts(allDrafts.sort((a, b) => b.timestamp - a.timestamp));
    } catch (error) {
      console.error('[OfflineOrders] Failed to load drafts:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 初始化时加载草稿
  useEffect(() => {
    loadDrafts();
  }, [loadDrafts]);

  // 保存订单草稿
  const saveDraft = useCallback(async (draft: Omit<OrderDraft, 'id' | 'timestamp' | 'status'>) => {
    try {
      const newDraft: OrderDraft = {
        ...draft,
        timestamp: Date.now(),
        status: 'draft',
      };

      const id = await addItem(STORES.ORDER_DRAFTS, newDraft);
      await loadDrafts();
      
      console.log('[OfflineOrders] Draft saved:', id);
      return id;
    } catch (error) {
      console.error('[OfflineOrders] Failed to save draft:', error);
      throw error;
    }
  }, [loadDrafts]);

  // 更新订单草稿
  const updateDraft = useCallback(async (draft: OrderDraft) => {
    try {
      await updateItem(STORES.ORDER_DRAFTS, draft);
      await loadDrafts();
      console.log('[OfflineOrders] Draft updated:', draft.id);
    } catch (error) {
      console.error('[OfflineOrders] Failed to update draft:', error);
      throw error;
    }
  }, [loadDrafts]);

  // 删除订单草稿
  const deleteDraft = useCallback(async (id: number) => {
    try {
      await deleteItem(STORES.ORDER_DRAFTS, id);
      await loadDrafts();
      console.log('[OfflineOrders] Draft deleted:', id);
    } catch (error) {
      console.error('[OfflineOrders] Failed to delete draft:', error);
      throw error;
    }
  }, [loadDrafts]);

  // 同步草稿到服务器
  const syncDraft = useCallback(async (draft: OrderDraft) => {
    if (!isOnline) {
      console.log('[OfflineOrders] Cannot sync: offline');
      return false;
    }

    try {
      // 更新状态为同步中
      await updateDraft({ ...draft, status: 'syncing' });

      // TODO: 调用实际的订单创建 API
      // const result = await trpc.order.create.mutate({
      //   type: draft.type,
      //   items: draft.items,
      //   storeId: draft.storeId,
      // });

      // 模拟 API 调用
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // 同步成功后删除草稿
      if (draft.id) {
        await deleteDraft(draft.id);
      }

      console.log('[OfflineOrders] Draft synced successfully:', draft.id);
      return true;
    } catch (error) {
      console.error('[OfflineOrders] Failed to sync draft:', error);
      
      // 更新状态为失败
      if (draft.id) {
        await updateDraft({ ...draft, status: 'failed' });
      }
      
      return false;
    }
  }, [isOnline, updateDraft, deleteDraft]);

  // 同步所有待同步的草稿
  const syncAllDrafts = useCallback(async () => {
    if (!isOnline) {
      console.log('[OfflineOrders] Cannot sync: offline');
      return;
    }

    const pendingDrafts = drafts.filter((d) => d.status === 'draft' || d.status === 'failed');
    
    console.log('[OfflineOrders] Syncing', pendingDrafts.length, 'drafts');

    for (const draft of pendingDrafts) {
      await syncDraft(draft);
    }
  }, [isOnline, drafts, syncDraft]);

  // 网络恢复时自动同步
  useEffect(() => {
    if (isOnline && drafts.length > 0) {
      const hasPendingDrafts = drafts.some((d) => d.status === 'draft' || d.status === 'failed');
      if (hasPendingDrafts) {
        console.log('[OfflineOrders] Network restored, syncing drafts...');
        syncAllDrafts();
      }
    }
  }, [isOnline, drafts, syncAllDrafts]);

  return {
    drafts,
    isLoading,
    saveDraft,
    updateDraft,
    deleteDraft,
    syncDraft,
    syncAllDrafts,
    pendingCount: drafts.filter((d) => d.status === 'draft' || d.status === 'failed').length,
  };
}
