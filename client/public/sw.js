// Service Worker for CHU TEA Mini App
const CACHE_VERSION = 'v1.1.0';
const CACHE_NAME = `chu-tea-${CACHE_VERSION}`;
const IMAGE_CACHE_NAME = `chu-tea-images-${CACHE_VERSION}`;
const MAX_IMAGE_CACHE_SIZE = 50; // 最多缓存 50 张图片

// 需要预缓存的静态资源
const PRECACHE_URLS = [
  '/',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/offline.html',
];

// 缓存策略：网络优先，失败时使用缓存
const NETWORK_FIRST_URLS = [
  '/api/trpc',
  '/api/',
];

// 图片资源模式（使用独立缓存和 LRU 策略）
const IMAGE_PATTERNS = [
  '/products/',
  '/images/',
  '.webp',
  '.png',
  '.jpg',
  '.jpeg',
];

// 缓存策略：缓存优先，失败时使用网络
const CACHE_FIRST_URLS = [
  '/icons/',
  '/images/',
  '/products/',
  '/assets/',
  '.webp',
  '.png',
  '.jpg',
  '.jpeg',
  '.svg',
  '.gif',
  '.ico',
  '.woff',
  '.woff2',
  '.ttf',
  '.eot',
  '.js',
  '.css',
];

// 安装事件：预缓存静态资源
self.addEventListener('install', (event) => {
  console.log('[SW] Installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Precaching static assets');
      return cache.addAll(PRECACHE_URLS);
    }).then(() => {
      // 强制激活新的 Service Worker
      return self.skipWaiting();
    })
  );
});

// 激活事件：清理旧缓存
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== IMAGE_CACHE_NAME) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // 立即控制所有页面
      return self.clients.claim();
    })
  );
});

// 拦截请求
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 跳过非 GET 请求
  if (request.method !== 'GET') {
    return;
  }

  // 跳过 Chrome 扩展请求
  if (url.protocol === 'chrome-extension:') {
    return;
  }

  // 网络优先策略（API 请求）
  if (NETWORK_FIRST_URLS.some(pattern => url.pathname.includes(pattern))) {
    event.respondWith(networkFirst(request));
    return;
  }

  // 图片资源：缓存优先 + LRU 策略
  if (IMAGE_PATTERNS.some(pattern => url.pathname.includes(pattern) || url.pathname.endsWith(pattern))) {
    event.respondWith(imageCache(request));
    return;
  }

  // 缓存优先策略（其他静态资源）
  if (CACHE_FIRST_URLS.some(pattern => url.pathname.includes(pattern) || url.pathname.endsWith(pattern))) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // 默认：网络优先，失败时显示离线页面
  event.respondWith(networkFirst(request, true));
});

// 网络优先策略
async function networkFirst(request, showOfflinePage = false) {
  try {
    const response = await fetch(request);
    
    // 只缓存成功的响应
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    console.log('[SW] Network request failed, trying cache:', request.url);
    
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // 如果是导航请求且没有缓存，显示离线页面
    if (showOfflinePage && request.mode === 'navigate') {
      const offlinePage = await caches.match('/offline.html');
      if (offlinePage) {
        return offlinePage;
      }
    }
    
    throw error;
  }
}

// 图片缓存策略：缓存优先 + LRU 管理
async function imageCache(request) {
  const cache = await caches.open(IMAGE_CACHE_NAME);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    // 缓存命中，更新访问时间戳
    updateImageCacheTimestamp(request.url);
    return cachedResponse;
  }
  
  try {
    const response = await fetch(request);
    
    if (response.ok) {
      // 缓存新图片
      await cacheImage(cache, request, response.clone());
    }
    
    return response;
  } catch (error) {
    console.log('[SW] Image fetch failed:', request.url);
    throw error;
  }
}

// 缓存图片并管理 LRU
async function cacheImage(cache, request, response) {
  // 获取当前缓存的所有图片
  const keys = await cache.keys();
  
  // 如果超过最大缓存数量，删除最久未使用的图片
  if (keys.length >= MAX_IMAGE_CACHE_SIZE) {
    const oldestKey = await findOldestCachedImage(keys);
    if (oldestKey) {
      await cache.delete(oldestKey);
      console.log('[SW] Removed old image from cache:', oldestKey.url);
    }
  }
  
  // 缓存新图片
  await cache.put(request, response);
  await updateImageCacheTimestamp(request.url);
  console.log('[SW] Cached new image:', request.url);
}

// 查找最久未使用的图片
async function findOldestCachedImage(keys) {
  let oldestKey = null;
  let oldestTime = Infinity;
  
  for (const key of keys) {
    const timestamp = await getImageCacheTimestamp(key.url);
    if (timestamp < oldestTime) {
      oldestTime = timestamp;
      oldestKey = key;
    }
  }
  
  return oldestKey;
}

// 获取图片缓存时间戳
async function getImageCacheTimestamp(url) {
  try {
    const db = await openTimestampDB();
    const tx = db.transaction('timestamps', 'readonly');
    const store = tx.objectStore('timestamps');
    const result = await store.get(url);
    return result ? result.timestamp : 0;
  } catch {
    return 0;
  }
}

// 更新图片缓存时间戳
async function updateImageCacheTimestamp(url) {
  try {
    const db = await openTimestampDB();
    const tx = db.transaction('timestamps', 'readwrite');
    const store = tx.objectStore('timestamps');
    await store.put({ url, timestamp: Date.now() });
  } catch (error) {
    console.error('[SW] Failed to update timestamp:', error);
  }
}

// 打开时间戳数据库
function openTimestampDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('ImageCacheTimestamps', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('timestamps')) {
        db.createObjectStore('timestamps', { keyPath: 'url' });
      }
    };
  });
}

// 缓存优先策略
async function cacheFirst(request) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const response = await fetch(request);
    
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    console.log('[SW] Cache and network both failed:', request.url);
    throw error;
  }
}

// 后台同步（用于离线时的数据同步）
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag);
  
  if (event.tag === 'sync-orders') {
    event.waitUntil(syncOrders());
  }
});

// 同步订单数据
async function syncOrders() {
  try {
    // 从 IndexedDB 获取待同步的订单
    // 这里需要配合前端的 IndexedDB 实现
    console.log('[SW] Syncing orders...');
    
    // TODO: 实现订单同步逻辑
    
    return Promise.resolve();
  } catch (error) {
    console.error('[SW] Order sync failed:', error);
    return Promise.reject(error);
  }
}

// 推送通知（可选）
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received');
  
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'CHU TEA';
  const options = {
    body: data.body || '您有新的消息',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    data: data.url || '/',
  };
  
  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// 通知点击事件
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked');
  
  event.notification.close();
  
  const urlToOpen = event.notification.data || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // 如果已有窗口打开，聚焦到该窗口
      for (const client of clientList) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      
      // 否则打开新窗口
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

console.log('[SW] Service Worker loaded');
