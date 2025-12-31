/**
 * IndexedDB 工具类
 * 用于离线订单存储和同步
 */

const DB_NAME = 'ChuTeaOfflineDB';
const DB_VERSION = 1;
const STORE_NAME = 'offlineOrders';

export interface OfflineOrder {
  id: string; // 本地生成的临时 ID
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
  createdAt: number; // 时间戳
  syncStatus: 'pending' | 'syncing' | 'synced' | 'failed';
  syncError?: string;
  syncAttempts: number;
  lastSyncAttempt?: number;
}

class OfflineDB {
  private db: IDBDatabase | null = null;

  /**
   * 初始化数据库
   */
  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        reject(new Error('Failed to open IndexedDB'));
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // 创建对象存储（如果不存在）
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const objectStore = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          
          // 创建索引
          objectStore.createIndex('syncStatus', 'syncStatus', { unique: false });
          objectStore.createIndex('createdAt', 'createdAt', { unique: false });
        }
      };
    });
  }

  /**
   * 确保数据库已初始化
   */
  private async ensureDB(): Promise<IDBDatabase> {
    if (!this.db) {
      await this.init();
    }
    if (!this.db) {
      throw new Error('Database not initialized');
    }
    return this.db;
  }

  /**
   * 保存离线订单
   */
  async saveOrder(order: OfflineOrder): Promise<void> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(order);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('Failed to save offline order'));
    });
  }

  /**
   * 获取所有待同步的订单
   */
  async getPendingOrders(): Promise<OfflineOrder[]> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const index = store.index('syncStatus');
      const request = index.getAll('pending');

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(new Error('Failed to get pending orders'));
    });
  }

  /**
   * 获取所有离线订单
   */
  async getAllOrders(): Promise<OfflineOrder[]> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        // 按创建时间倒序排序
        const orders = request.result.sort((a, b) => b.createdAt - a.createdAt);
        resolve(orders);
      };
      request.onerror = () => reject(new Error('Failed to get all orders'));
    });
  }

  /**
   * 获取单个订单
   */
  async getOrder(id: string): Promise<OfflineOrder | null> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(new Error('Failed to get order'));
    });
  }

  /**
   * 更新订单状态
   */
  async updateOrderStatus(
    id: string,
    status: OfflineOrder['syncStatus'],
    error?: string
  ): Promise<void> {
    const order = await this.getOrder(id);
    if (!order) {
      throw new Error('Order not found');
    }

    order.syncStatus = status;
    order.lastSyncAttempt = Date.now();
    
    if (status === 'failed') {
      order.syncAttempts += 1;
      order.syncError = error;
    }

    await this.saveOrder(order);
  }

  /**
   * 删除订单
   */
  async deleteOrder(id: string): Promise<void> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('Failed to delete order'));
    });
  }

  /**
   * 清理已同步的订单（保留最近7天）
   */
  async cleanupSyncedOrders(): Promise<void> {
    const db = await this.ensureDB();
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const index = store.index('createdAt');
      const request = index.openCursor(IDBKeyRange.upperBound(sevenDaysAgo));

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
        if (cursor) {
          const order = cursor.value as OfflineOrder;
          if (order.syncStatus === 'synced') {
            cursor.delete();
          }
          cursor.continue();
        } else {
          resolve();
        }
      };

      request.onerror = () => reject(new Error('Failed to cleanup orders'));
    });
  }

  /**
   * 获取待同步订单数量
   */
  async getPendingCount(): Promise<number> {
    const orders = await this.getPendingOrders();
    return orders.length;
  }
}

// 导出单例
export const offlineDB = new OfflineDB();

// 生成临时订单 ID
export function generateOfflineOrderId(): string {
  return `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
