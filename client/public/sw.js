// Service Worker for CHU TEA PWA
const CACHE_VERSION = 'v1.1.0';
const CACHE_NAME = `chu-tea-${CACHE_VERSION}`;
const RUNTIME_CACHE = `chu-tea-runtime-${CACHE_VERSION}`;
const IMAGE_CACHE = `chu-tea-images-${CACHE_VERSION}`;

// 缓存过期时间（毫秒）
const CACHE_EXPIRATION = {
  images: 7 * 24 * 60 * 60 * 1000, // 7天
  api: 5 * 60 * 1000, // 5分钟
  static: 30 * 24 * 60 * 60 * 1000, // 30天
};

// 需要预缓存的静态资源（首屏关键资源）
const PRECACHE_URLS = [
  '/',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/offline.html',
  // 首屏 JS/CSS 会由 Vite 自动注入版本号，这里不需要预缓存
];

// 缓存策略：网络优先，失败时使用缓存
const NETWORK_FIRST_URLS = [
  '/api/trpc',
];

// 缓存策略：缓存优先，失败时使用网络
const CACHE_FIRST_URLS = [
  '/icons/',
  '/images/',
  '/products/',
  '.webp',
  '.png',
  '.jpg',
  '.jpeg',
  '.svg',
  '.woff',
  '.woff2',
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
          if (cacheName !== CACHE_NAME) {
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

  // 图片资源：缓存优先 + 过期检查
  if (url.pathname.match(/\.(webp|png|jpg|jpeg|svg|gif)$/i)) {
    event.respondWith(cacheFirstWithExpiration(request, IMAGE_CACHE, CACHE_EXPIRATION.images));
    return;
  }

  // 静态资源：缓存优先
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

// 缓存优先策略 + 过期检查
async function cacheFirstWithExpiration(request, cacheName, maxAge) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    const cachedTime = cachedResponse.headers.get('sw-cached-time');
    if (cachedTime) {
      const age = Date.now() - parseInt(cachedTime);
      if (age < maxAge) {
        return cachedResponse;
      }
    }
  }
  
  try {
    const response = await fetch(request);
    
    if (response.ok) {
      const clonedResponse = response.clone();
      const headers = new Headers(clonedResponse.headers);
      headers.set('sw-cached-time', Date.now().toString());
      
      const modifiedResponse = new Response(clonedResponse.body, {
        status: clonedResponse.status,
        statusText: clonedResponse.statusText,
        headers,
      });
      
      cache.put(request, modifiedResponse);
    }
    
    return response;
  } catch (error) {
    if (cachedResponse) {
      return cachedResponse;
    }
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
