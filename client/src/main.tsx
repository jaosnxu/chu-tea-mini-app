import { trpc } from "@/lib/trpc";
import { UNAUTHED_ERR_MSG } from '@shared/const';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink, TRPCClientError } from "@trpc/client";
import { createRoot } from "react-dom/client";
import superjson from "superjson";
import App from "./App";
import { getLoginUrl } from "./const";
import "./index.css";
import "./lib/i18n"; // 初始化 i18n
import { initTelegramSDK, applyTelegramTheme } from "./lib/telegram"; // 初始化 Telegram SDK
import { initWebVitals } from "./lib/webVitals"; // 初始化 Web Vitals 监控

// 初始化 Telegram Web App
initTelegramSDK();
// 应用 Telegram 主题颜色
applyTelegramTheme();
// 初始化 Web Vitals 性能监控
initWebVitals();

// 注册 Service Worker
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        console.log('[SW] Registered:', registration);
      })
      .catch((error) => {
        console.error('[SW] Registration failed:', error);
      });
  });
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // 激进缓存策略：30 分钟内数据视为新鲜
      staleTime: 30 * 60 * 1000,
      // 缓存保留时间：1 小时
      gcTime: 60 * 60 * 1000,
      // 窗口获得焦点时不重新获取
      refetchOnWindowFocus: false,
      // 重连时不重新获取
      refetchOnReconnect: false,
      // 挂载时不重新获取（使用缓存）
      refetchOnMount: false,
      // 重试配置
      retry: 1,
      // 启用网络模式：优先使用缓存
      networkMode: 'offlineFirst' as const,
    },
    mutations: {
      // mutation 错误不重试
      retry: false,
    },
  },
});

const redirectToLoginIfUnauthorized = (error: unknown) => {
  if (!(error instanceof TRPCClientError)) return;
  if (typeof window === "undefined") return;

  const isUnauthorized = error.message === UNAUTHED_ERR_MSG;

  if (!isUnauthorized) return;

  const loginUrl = getLoginUrl();
  // 只有在有效的 OAuth URL 时才重定向
  if (loginUrl && loginUrl !== '/' && loginUrl.startsWith('http')) {
    window.location.href = loginUrl;
  }
};

queryClient.getQueryCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.query.state.error;
    redirectToLoginIfUnauthorized(error);
    console.error("[API Query Error]", error);
  }
});

queryClient.getMutationCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.mutation.state.error;
    redirectToLoginIfUnauthorized(error);
    console.error("[API Mutation Error]", error);
  }
});

const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: "/api/trpc",
      transformer: superjson,
      fetch(input, init) {
        return globalThis.fetch(input, {
          ...(init ?? {}),
          credentials: "include",
        });
      },
    }),
  ],
});

createRoot(document.getElementById("root")!).render(
  <trpc.Provider client={trpcClient} queryClient={queryClient}>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </trpc.Provider>
);
