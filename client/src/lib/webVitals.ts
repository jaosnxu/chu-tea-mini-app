import { onCLS, onINP, onLCP, onFCP, onTTFB, type Metric } from 'web-vitals';

/**
 * Web Vitals 性能监控
 * 收集关键性能指标并上报到后台
 */

// 性能指标阈值（Google 推荐）
const THRESHOLDS = {
  LCP: { good: 2500, needsImprovement: 4000 },
  INP: { good: 200, needsImprovement: 500 },
  CLS: { good: 0.1, needsImprovement: 0.25 },
  FCP: { good: 1800, needsImprovement: 3000 },
  TTFB: { good: 800, needsImprovement: 1800 },
};

// 判断性能等级
function getRating(metric: Metric): 'good' | 'needs-improvement' | 'poor' {
  const threshold = THRESHOLDS[metric.name as keyof typeof THRESHOLDS];
  if (!threshold) return 'good';
  
  if (metric.value <= threshold.good) return 'good';
  if (metric.value <= threshold.needsImprovement) return 'needs-improvement';
  return 'poor';
}

// 上报性能数据到后台
async function reportMetric(metric: Metric) {
  const rating = getRating(metric);
  
  const data = {
    name: metric.name,
    value: metric.value,
    rating,
    delta: metric.delta,
    id: metric.id,
    navigationType: metric.navigationType,
    timestamp: Date.now(),
    url: window.location.href,
    userAgent: navigator.userAgent,
  };

  // 在开发环境打印到控制台
  if (import.meta.env.DEV) {
    console.log(`[Web Vitals] ${metric.name}:`, {
      value: `${metric.value.toFixed(2)}ms`,
      rating,
      threshold: THRESHOLDS[metric.name as keyof typeof THRESHOLDS],
    });
  }

  // 生产环境上报到后台
  if (import.meta.env.PROD) {
    try {
      // 使用 sendBeacon API 确保数据发送（即使页面关闭）
      if (navigator.sendBeacon) {
        const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
        navigator.sendBeacon('/api/analytics/web-vitals', blob);
      } else {
        // 降级方案：使用 fetch
        fetch('/api/analytics/web-vitals', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
          keepalive: true,
        }).catch((error) => {
          console.error('[Web Vitals] Failed to report:', error);
        });
      }
    } catch (error) {
      console.error('[Web Vitals] Failed to report:', error);
    }
  }
}

/**
 * 初始化 Web Vitals 监控
 */
export function initWebVitals() {
  // Largest Contentful Paint (LCP)
  // 最大内容绘制时间，衡量加载性能
  // 良好: < 2.5s, 需要改进: 2.5s - 4s, 差: > 4s
  onLCP(reportMetric);

  // Interaction to Next Paint (INP)
  // 交互到下一次绘制，衡量交互性能（替代 FID）
  // 良好: < 200ms, 需要改进: 200ms - 500ms, 差: > 500ms
  onINP(reportMetric);

  // Cumulative Layout Shift (CLS)
  // 累积布局偏移，衡量视觉稳定性
  // 良好: < 0.1, 需要改进: 0.1 - 0.25, 差: > 0.25
  onCLS(reportMetric);

  // First Contentful Paint (FCP)
  // 首次内容绘制时间，衡量感知加载速度
  // 良好: < 1.8s, 需要改进: 1.8s - 3s, 差: > 3s
  onFCP(reportMetric);

  // Time to First Byte (TTFB)
  // 首字节时间，衡量服务器响应速度
  // 良好: < 800ms, 需要改进: 800ms - 1800ms, 差: > 1800ms
  onTTFB(reportMetric);

  console.log('[Web Vitals] Monitoring initialized');
}

/**
 * 获取性能摘要（用于调试）
 */
export function getPerformanceSummary() {
  if (!window.performance) return null;

  const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
  
  return {
    // DNS 查询时间
    dns: navigation.domainLookupEnd - navigation.domainLookupStart,
    // TCP 连接时间
    tcp: navigation.connectEnd - navigation.connectStart,
    // 请求响应时间
    request: navigation.responseEnd - navigation.requestStart,
    // DOM 解析时间
    domParse: navigation.domInteractive - navigation.responseEnd,
    // 资源加载时间
    resourceLoad: navigation.loadEventStart - navigation.domContentLoadedEventEnd,
    // 总加载时间
    total: navigation.loadEventEnd - navigation.fetchStart,
  };
}
