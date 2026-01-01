/**
 * IndexedDB 工具
 * 用于离线数据存储和同步
 */

const DB_NAME = 'ChuTeaDB';
const DB_VERSION = 1;

// 对象存储名称
export const STORES = {
  ORDER_DRAFTS: 'orderDrafts',      // 离线订单草稿
  MENU_CACHE: 'menuCache',          // 菜单缓存
  PRODUCTS_CACHE: 'productsCache',  // 商品缓存
  SYNC_QUEUE: 'syncQueue',          // 同步队列
} as const;

let dbInstance: IDBDatabase | null = null;

/**
 * 初始化 IndexedDB
 */
export async function initDB(): Promise<IDBDatabase> {
  if (dbInstance) return dbInstance;

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error('[IndexedDB] Failed to open database:', request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      dbInstance = request.result;
      console.log('[IndexedDB] Database opened successfully');
      resolve(dbInstance);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // 创建订单草稿存储
      if (!db.objectStoreNames.contains(STORES.ORDER_DRAFTS)) {
        const orderStore = db.createObjectStore(STORES.ORDER_DRAFTS, { keyPath: 'id', autoIncrement: true });
        orderStore.createIndex('timestamp', 'timestamp', { unique: false });
        orderStore.createIndex('type', 'type', { unique: false });
      }

      // 创建菜单缓存存储
      if (!db.objectStoreNames.contains(STORES.MENU_CACHE)) {
        const menuStore = db.createObjectStore(STORES.MENU_CACHE, { keyPath: 'id' });
        menuStore.createIndex('timestamp', 'timestamp', { unique: false });
        menuStore.createIndex('type', 'type', { unique: false });
      }

      // 创建商品缓存存储
      if (!db.objectStoreNames.contains(STORES.PRODUCTS_CACHE)) {
        const productsStore = db.createObjectStore(STORES.PRODUCTS_CACHE, { keyPath: 'id' });
        productsStore.createIndex('timestamp', 'timestamp', { unique: false });
        productsStore.createIndex('categoryId', 'categoryId', { unique: false });
      }

      // 创建同步队列存储
      if (!db.objectStoreNames.contains(STORES.SYNC_QUEUE)) {
        const syncStore = db.createObjectStore(STORES.SYNC_QUEUE, { keyPath: 'id', autoIncrement: true });
        syncStore.createIndex('timestamp', 'timestamp', { unique: false });
        syncStore.createIndex('status', 'status', { unique: false });
      }

      console.log('[IndexedDB] Database upgraded to version', DB_VERSION);
    };
  });
}

/**
 * 添加数据到存储
 */
export async function addItem<T>(storeName: string, item: T): Promise<number> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.add(item);

    request.onsuccess = () => resolve(request.result as number);
    request.onerror = () => reject(request.error);
  });
}

/**
 * 更新存储中的数据
 */
export async function updateItem<T>(storeName: string, item: T): Promise<void> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.put(item);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * 从存储中获取数据
 */
export async function getItem<T>(storeName: string, key: IDBValidKey): Promise<T | undefined> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.get(key);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * 获取存储中的所有数据
 */
export async function getAllItems<T>(storeName: string): Promise<T[]> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * 从存储中删除数据
 */
export async function deleteItem(storeName: string, key: IDBValidKey): Promise<void> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.delete(key);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * 清空存储
 */
export async function clearStore(storeName: string): Promise<void> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.clear();

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * 通过索引查询数据
 */
export async function getItemsByIndex<T>(
  storeName: string,
  indexName: string,
  value: IDBValidKey
): Promise<T[]> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const index = store.index(indexName);
    const request = index.getAll(value);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * 订单草稿类型
 */
export interface OrderDraft {
  id?: number;
  type: 'tea' | 'mall';
  items: Array<{
    productId: number;
    productName: string;
    quantity: number;
    price: string;
    options?: Record<string, any>;
  }>;
  totalAmount: string;
  storeId?: number;
  timestamp: number;
  status: 'draft' | 'syncing' | 'synced' | 'failed';
}

/**
 * 同步队列项类型
 */
export interface SyncQueueItem {
  id?: number;
  type: 'order' | 'review' | 'other';
  data: any;
  timestamp: number;
  status: 'pending' | 'syncing' | 'synced' | 'failed';
  retryCount: number;
  error?: string;
}
