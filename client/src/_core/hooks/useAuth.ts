import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { TRPCClientError } from "@trpc/client";
import { useCallback, useEffect, useMemo, useState, useRef } from "react";

type UseAuthOptions = {
  redirectOnUnauthenticated?: boolean;
  redirectPath?: string;
};

export function useAuth(options?: UseAuthOptions) {
  const { redirectOnUnauthenticated = false, redirectPath = getLoginUrl() } =
    options ?? {};
  const utils = trpc.useUtils();
  const [isInitializing, setIsInitializing] = useState(true);
  const hasAttemptedTelegramLogin = useRef(false);

  const meQuery = trpc.auth.me.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
  });

  const telegramLoginMutation = trpc.auth.telegramLogin.useMutation({
    onSuccess: () => {
      // 登录成功后刷新用户信息
      utils.auth.me.invalidate();
    },
  });

  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      utils.auth.me.setData(undefined, null);
    },
  });

  // Telegram 自动登录 - 只执行一次
  useEffect(() => {
    // 如果已经尝试过登录，跳过
    if (hasAttemptedTelegramLogin.current) {
      return;
    }

    // 如果正在加载，等待
    if (meQuery.isLoading) {
      return;
    }

    // 如果已经有用户，不需要登录
    if (meQuery.data) {
      setIsInitializing(false);
      return;
    }

    // 标记已尝试登录
    hasAttemptedTelegramLogin.current = true;

    // 检查是否在 Telegram 环境中
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      const initData = tg.initData;
      
      if (initData) {
        console.log('[Auth] Telegram environment detected, auto-logging in...');
        telegramLoginMutation.mutate(
          { initData },
          {
            onSuccess: () => {
              console.log('[Auth] Telegram auto-login successful');
              setIsInitializing(false);
            },
            onError: (error) => {
              console.error('[Auth] Telegram auto-login failed:', error);
              setIsInitializing(false);
            },
          }
        );
        return;
      }
    }
    
    setIsInitializing(false);
  }, [meQuery.isLoading, meQuery.data]); // 移除 telegramLoginMutation 依赖

  const logout = useCallback(async () => {
    try {
      await logoutMutation.mutateAsync();
    } catch (error: unknown) {
      if (
        error instanceof TRPCClientError &&
        error.data?.code === "UNAUTHORIZED"
      ) {
        return;
      }
      throw error;
    } finally {
      utils.auth.me.setData(undefined, null);
      await utils.auth.me.invalidate();
    }
  }, [logoutMutation, utils]);

  const state = useMemo(() => {
    localStorage.setItem(
      "manus-runtime-user-info",
      JSON.stringify(meQuery.data)
    );
    return {
      user: meQuery.data ?? null,
      loading: isInitializing || meQuery.isLoading || logoutMutation.isPending || telegramLoginMutation.isPending,
      error: meQuery.error ?? logoutMutation.error ?? telegramLoginMutation.error ?? null,
      isAuthenticated: Boolean(meQuery.data),
    };
  }, [
    isInitializing,
    meQuery.data,
    meQuery.error,
    meQuery.isLoading,
    logoutMutation.error,
    logoutMutation.isPending,
    telegramLoginMutation.error,
    telegramLoginMutation.isPending,
  ]);

  useEffect(() => {
    if (!redirectOnUnauthenticated) return;
    if (state.loading) return;
    if (state.user) return;
    if (typeof window === "undefined") return;
    if (window.location.pathname === redirectPath) return;

    // 只有在有效的 OAuth URL 时才重定向
    if (redirectPath && redirectPath !== '/' && redirectPath.startsWith('http')) {
      window.location.href = redirectPath;
    }
  }, [
    redirectOnUnauthenticated,
    redirectPath,
    state.loading,
    state.user,
  ]);

  return {
    ...state,
    refresh: () => meQuery.refetch(),
    logout,
  };
}
