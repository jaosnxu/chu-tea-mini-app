/**
 * 图片优化工具函数
 */

/**
 * 生成低质量占位图 URL（使用图片服务）
 * @param url 原始图片 URL
 * @param width 占位图宽度（默认 20px）
 * @returns 低质量占位图 URL
 */
export function generatePlaceholder(url: string, width: number = 20): string {
  // 如果是外部 URL，尝试使用图片服务生成缩略图
  if (url.startsWith('http')) {
    // 示例：使用 imgproxy 或其他图片服务
    // return `https://imgproxy.example.com/insecure/w:${width}/plain/${url}`;
    
    // 如果没有图片服务，返回原图（浏览器会自动缩放）
    return url;
  }
  
  // 本地图片，返回原图
  return url;
}

/**
 * 检查浏览器是否支持 WebP 格式
 * @returns Promise<boolean>
 */
export async function supportsWebP(): Promise<boolean> {
  if (!window.createImageBitmap) return false;

  const webpData = 'data:image/webp;base64,UklGRh4AAABXRUJQVlA4TBEAAAAvAAAAAAfQ//73v/+BiOh/AAA=';
  
  try {
    const blob = await fetch(webpData).then(r => r.blob());
    return await createImageBitmap(blob).then(() => true, () => false);
  } catch {
    return false;
  }
}

/**
 * 获取优化后的图片 URL
 * 如果浏览器支持 WebP，返回 WebP 版本
 * @param url 原始图片 URL
 * @param options 优化选项
 * @returns 优化后的图片 URL
 */
export function getOptimizedImageUrl(
  url: string,
  options?: {
    width?: number;
    height?: number;
    quality?: number;
    format?: 'webp' | 'jpg' | 'png';
  }
): string {
  // 如果是本地图片或已经是 data URL，直接返回
  if (!url.startsWith('http') || url.startsWith('data:')) {
    return url;
  }

  // 这里可以集成图片 CDN 服务（如 Cloudinary, imgproxy, 七牛云等）
  // 示例：
  // const params = new URLSearchParams();
  // if (options?.width) params.set('w', options.width.toString());
  // if (options?.height) params.set('h', options.height.toString());
  // if (options?.quality) params.set('q', options.quality.toString());
  // if (options?.format) params.set('f', options.format);
  // return `https://cdn.example.com/image?url=${encodeURIComponent(url)}&${params.toString()}`;

  // 暂时返回原图
  return url;
}

/**
 * 预加载图片
 * @param urls 图片 URL 列表
 */
export function preloadImages(urls: string[]): Promise<void[]> {
  return Promise.all(
    urls.map((url) => {
      return new Promise<void>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve();
        img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
        img.src = url;
      });
    })
  );
}

/**
 * 批量预加载图片（带限流）
 * @param urls 图片 URL 列表
 * @param concurrency 并发数（默认 3）
 */
export async function preloadImagesWithLimit(
  urls: string[],
  concurrency: number = 3
): Promise<void> {
  const queue = [...urls];
  const loading: Promise<void>[] = [];

  while (queue.length > 0 || loading.length > 0) {
    // 填充加载队列
    while (loading.length < concurrency && queue.length > 0) {
      const url = queue.shift()!;
      const promise = new Promise<void>((resolve) => {
        const img = new Image();
        img.onload = () => resolve();
        img.onerror = () => resolve(); // 失败也继续
        img.src = url;
      });
      loading.push(promise);
    }

    // 等待一个完成
    if (loading.length > 0) {
      await Promise.race(loading);
      // 移除已完成的
      const completed = loading.findIndex((p) => {
        return Promise.race([p, Promise.resolve('done')]).then((v) => v === 'done');
      });
      if (completed !== -1) {
        loading.splice(completed, 1);
      }
    }
  }
}
