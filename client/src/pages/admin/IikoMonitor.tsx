import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "react-i18next";
import { RefreshCw, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";

/**
 * IIKO 同步状态监控页面
 * 显示订单同步队列状态、菜单同步历史、成功/失败统计
 */
export default function IikoMonitor() {
  const { t } = useTranslation();
  const [autoRefresh, setAutoRefresh] = useState(true);

  // 获取调度器状态
  const { data: schedulerStatus, refetch: refetchScheduler } =
    trpc.iiko.getSchedulerStatus.useQuery(undefined, {
      refetchInterval: autoRefresh ? 5000 : false,
    });

  // 手动触发订单同步
  const triggerOrderSync = trpc.iiko.triggerOrderSync.useMutation({
    onSuccess: () => {
      alert(t("admin.iiko.syncTriggered"));
      refetchScheduler();
    },
    onError: (error) => {
      alert(t("admin.iiko.syncFailed") + ": " + error.message);
    },
  });

  // 手动触发菜单同步
  const triggerMenuSync = trpc.iiko.triggerMenuSync.useMutation({
    onSuccess: () => {
      alert(t("admin.iiko.menuSyncTriggered"));
      refetchScheduler();
    },
    onError: (error) => {
      alert(t("admin.iiko.menuSyncFailed") + ": " + error.message);
    },
  });

  return (
    <div className="container py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">{t("admin.iiko.monitorTitle")}</h1>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded"
            />
            {t("admin.iiko.autoRefresh")}
          </label>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetchScheduler()}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            {t("admin.iiko.refresh")}
          </Button>
        </div>
      </div>

      {/* 调度器状态 */}
      <div className="mb-8 grid gap-6 md:grid-cols-2">
        {/* 订单同步调度器 */}
        <Card className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold">
              {t("admin.iiko.orderSyncScheduler")}
            </h2>
            {schedulerStatus?.orderSync.running ? (
              <Badge variant="default" className="bg-green-500">
                <CheckCircle className="mr-1 h-3 w-3" />
                {t("admin.iiko.running")}
              </Badge>
            ) : (
              <Badge variant="destructive">
                <XCircle className="mr-1 h-3 w-3" />
                {t("admin.iiko.stopped")}
              </Badge>
            )}
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                {t("admin.iiko.interval")}
              </span>
              <span className="font-medium">
                {schedulerStatus?.orderSync.interval
                  ? `${schedulerStatus.orderSync.interval / 1000}s`
                  : "-"}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-muted-foreground">
                {t("admin.iiko.processing")}
              </span>
              <span className="font-medium">
                {schedulerStatus?.orderSync.processing ? (
                  <Badge variant="secondary">
                    <Clock className="mr-1 h-3 w-3" />
                    {t("admin.iiko.processing")}
                  </Badge>
                ) : (
                  <Badge variant="outline">{t("admin.iiko.idle")}</Badge>
                )}
              </span>
            </div>
          </div>

          <Button
            className="mt-6 w-full"
            onClick={() => triggerOrderSync.mutate()}
            disabled={triggerOrderSync.isPending}
          >
            {triggerOrderSync.isPending ? (
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            {t("admin.iiko.triggerOrderSync")}
          </Button>
        </Card>

        {/* 菜单同步调度器 */}
        <Card className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold">
              {t("admin.iiko.menuSyncScheduler")}
            </h2>
            {schedulerStatus?.menuSync.running ? (
              <Badge variant="default" className="bg-green-500">
                <CheckCircle className="mr-1 h-3 w-3" />
                {t("admin.iiko.running")}
              </Badge>
            ) : (
              <Badge variant="destructive">
                <XCircle className="mr-1 h-3 w-3" />
                {t("admin.iiko.stopped")}
              </Badge>
            )}
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                {t("admin.iiko.interval")}
              </span>
              <span className="font-medium">
                {schedulerStatus?.menuSync.interval
                  ? `${schedulerStatus.menuSync.interval / 1000 / 60}min`
                  : "-"}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-muted-foreground">
                {t("admin.iiko.processing")}
              </span>
              <span className="font-medium">
                {schedulerStatus?.menuSync.processing ? (
                  <Badge variant="secondary">
                    <Clock className="mr-1 h-3 w-3" />
                    {t("admin.iiko.processing")}
                  </Badge>
                ) : (
                  <Badge variant="outline">{t("admin.iiko.idle")}</Badge>
                )}
              </span>
            </div>
          </div>

          <Button
            className="mt-6 w-full"
            onClick={() => triggerMenuSync.mutate()}
            disabled={triggerMenuSync.isPending}
          >
            {triggerMenuSync.isPending ? (
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            {t("admin.iiko.triggerMenuSync")}
          </Button>
        </Card>
      </div>

      {/* 提示信息 */}
      <Card className="p-6">
        <div className="flex items-start gap-3">
          <AlertCircle className="mt-0.5 h-5 w-5 text-blue-500" />
          <div className="flex-1 text-sm">
            <p className="font-medium">{t("admin.iiko.monitorTip")}</p>
            <ul className="mt-2 list-inside list-disc space-y-1 text-muted-foreground">
              <li>{t("admin.iiko.monitorTip1")}</li>
              <li>{t("admin.iiko.monitorTip2")}</li>
              <li>{t("admin.iiko.monitorTip3")}</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}
