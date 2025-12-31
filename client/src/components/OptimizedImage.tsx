import { useState, useEffect, useRef } from 'react';

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  priority?: boolean; // 是否优先加载（首屏图片）
}

export default function OptimizedImage({
  src,
  alt,
  className = '',
  width,
  height,
  priority = false,
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(priority); // 优先加载的图片直接设为可见
  const imgRef = useRef<HTMLImageElement>(null);

  // 自动转换为 WebP 格式（如果存在）
  const webpSrc = src.replace(/\.(jpg|jpeg|png)$/i, '.webp');
  const imageSrc = webpSrc;

  useEffect(() => {
    if (priority) return; // 优先加载的图片不需要 IntersectionObserver

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: '50px', // 提前 50px 开始加载
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [priority]);

  return (
    <div
      className={`relative overflow-hidden bg-gray-200 dark:bg-gray-800 ${className}`}
      style={{ width, height }}
    >
      {/* 占位符 */}
      {!isLoaded && (
        <div className="absolute inset-0 animate-pulse bg-gray-300 dark:bg-gray-700" />
      )}

      {/* 实际图片 */}
      {isInView && (
        <picture>
          <source srcSet={webpSrc} type="image/webp" />
          <img
            ref={imgRef}
            src={src}
            alt={alt}
          className={`w-full h-full object-cover transition-opacity duration-300 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          loading={priority ? 'eager' : 'lazy'}
          onLoad={() => setIsLoaded(true)}
          width={width}
          height={height}
        />
        </picture>
      )}
    </div>
  );
}
