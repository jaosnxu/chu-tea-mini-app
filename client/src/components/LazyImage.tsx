import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  /** 低质量占位图（可选） */
  placeholder?: string;
  /** 图片容器类名 */
  containerClassName?: string;
  /** 是否使用模糊效果 */
  blur?: boolean;
}

/**
 * 懒加载图片组件
 * 支持 Intersection Observer 和原生 loading="lazy"
 * 带有低质量占位图（LQIP）和渐进式加载效果
 */
export default function LazyImage({
  src,
  alt,
  placeholder,
  containerClassName,
  blur = true,
  className,
  ...props
}: LazyImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    // 如果浏览器不支持 Intersection Observer，直接加载
    if (!('IntersectionObserver' in window)) {
      setIsInView(true);
      return;
    }

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
        // 提前 100px 开始加载
        rootMargin: '100px',
        threshold: 0.01,
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <div className={cn("relative overflow-hidden bg-muted", containerClassName)}>
      {/* 占位图（如果提供） */}
      {placeholder && !isLoaded && (
        <img
          src={placeholder}
          alt={alt}
          className={cn(
            "absolute inset-0 w-full h-full object-cover",
            blur && "blur-sm scale-110"
          )}
          aria-hidden="true"
        />
      )}

      {/* 主图片 */}
      <img
        ref={imgRef}
        src={isInView ? src : placeholder || ''}
        alt={alt}
        loading="lazy"
        decoding="async"
        onLoad={() => setIsLoaded(true)}
        className={cn(
          "w-full h-full object-cover transition-opacity duration-300",
          isLoaded ? "opacity-100" : "opacity-0",
          className
        )}
        {...props}
      />

      {/* 加载指示器 */}
      {!isLoaded && isInView && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/50">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
}
