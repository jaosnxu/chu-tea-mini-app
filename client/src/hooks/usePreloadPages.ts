import { useEffect } from "react";

/**
 * 预加载常用页面的 Hook
 * 在用户空闲时预加载可能访问的页面，提升导航速度
 */
export function usePreloadPages() {
  useEffect(() => {
    // 使用 requestIdleCallback 在浏览器空闲时预加载
    const preloadCallback = (deadline: IdleDeadline) => {
      // 如果还有空闲时间，继续预加载
      if (deadline.timeRemaining() > 0) {
        // 预加载常用页面
        const pagesToPreload = [
          () => import("../pages/Menu"),
          () => import("../pages/Cart"),
          () => import("../pages/Orders"),
          () => import("../pages/Profile"),
          () => import("../pages/Mall"),
        ];

        // 逐个预加载
        pagesToPreload.forEach((loadPage, index) => {
          setTimeout(() => {
            loadPage().catch((error) => {
              console.warn(`[Preload] Failed to preload page ${index}:`, error);
            });
          }, index * 100); // 间隔 100ms 避免阻塞
        });
      }
    };

    // 检查浏览器是否支持 requestIdleCallback
    if ('requestIdleCallback' in window) {
      const idleCallbackId = requestIdleCallback(preloadCallback, {
        timeout: 2000, // 最多等待 2 秒
      });

      return () => {
        cancelIdleCallback(idleCallbackId);
      };
    } else {
      // 降级方案：使用 setTimeout
      const timeoutId = setTimeout(() => {
        preloadCallback({ didTimeout: false, timeRemaining: () => 50 } as IdleDeadline);
      }, 1000);

      return () => {
        clearTimeout(timeoutId);
      };
    }
  }, []);
}
