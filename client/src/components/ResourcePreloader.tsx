import { useEffect } from "react";

/**
 * 资源预加载组件
 * 在页面加载完成后预加载关键资源
 */
export default function ResourcePreloader() {
  useEffect(() => {
    // 预加载关键字体
    const preloadFonts = () => {
      const fontUrls: string[] = [
        // 添加您的字体 URL
        // 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap',
      ];

      fontUrls.forEach((url) => {
        const link = document.createElement("link");
        link.rel = "preload";
        link.as = "font";
        link.href = url;
        link.crossOrigin = "anonymous";
        document.head.appendChild(link);
      });
    };

    // 预加载关键图片
    const preloadImages = () => {
      const imageUrls: string[] = [
        // 添加常用的产品图片、Logo 等
        // '/images/logo.png',
        // '/images/placeholder.png',
      ];

      imageUrls.forEach((url) => {
        const link = document.createElement("link");
        link.rel = "preload";
        link.as = "image";
        link.href = url;
        document.head.appendChild(link);
      });
    };

    // 使用 requestIdleCallback 在空闲时预加载
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => {
        preloadFonts();
        preloadImages();
      });
    } else {
      // 降级方案
      setTimeout(() => {
        preloadFonts();
        preloadImages();
      }, 1000);
    }
  }, []);

  return null;
}
