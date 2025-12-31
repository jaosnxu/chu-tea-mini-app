import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, CheckCircle, XCircle, TrendingUp, Activity, Package, DollarSign, Percent, Gift } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function TriggerExecutionHistory() {
  const { t } = useTranslation();
  const params = useParams();
  const [, setLocation] = useLocation();
  const triggerId = params.id ? parseInt(params.id) : undefined;

  const [statusFilter, setStatusFilter] = useState<'success' | 'failed' | undefined>(undefined);
  const [page, setPage] = useState(0);
  const pageSize = 20;

  // 获取执行历史
  const { data: executions, isLoading: executionsLoading } = trpc.marketingTrigger.getExecutions.useQuery({
    triggerId,
    status: statusFilter,
    limit: pageSize,
    offset: page * pageSize,
  });

  // 获取执行统计数据
  const { data: stats } = trpc.marketingTrigger.getExecutionStats.useQuery(
    { triggerId: triggerId! },
    { enabled: !!triggerId }
  );

  // 获取效果统计数据
  const { data: performance } = trpc.marketingTrigger.getPerformance.useQuery(
    { triggerId: triggerId! },
    { enabled: !!triggerId }
  );

  // 获取触发器列表以找到当前触发器
  const { data: triggers } = trpc.marketingTrigger.list.useQuery({});
  const trigger = triggers?.find(t => t.id === triggerId);

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* 返回按钮和标题 */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setLocation("/admin/marketing-triggers")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t('common.back')}
        </Button>
        <div>
          <h1 className="text-3xl font-bold">{t('admin.triggerExecutionHistory')}</h1>
          {trigger && (
            <p className="text-muted-foreground mt-1">
              {trigger.name}
            </p>
          )}
        </div>
      </div>

      {/* 执行统计卡片 */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('admin.totalExecutions')}</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {t('admin.executionHistory')}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('admin.successfulExecutions')}</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.successful}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('admin.failedExecutions')}</CardTitle>
              <XCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('admin.successRate')}</CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.successRate}%</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 效果统计卡片 */}
      {performance && (
        <div>
          <h2 className="text-lg font-semibold mb-4">{t('admin.performanceStats.title')}</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* 订单统计 */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t('admin.performanceStats.totalOrders')}</CardTitle>
                <Package className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{performance.orderStats.totalOrders}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {t('admin.performanceStats.completedOrders')}: {performance.orderStats.completedOrders}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t('admin.performanceStats.totalRevenue')}</CardTitle>
                <DollarSign className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  ₽{Number(performance.orderStats.totalRevenue).toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {t('admin.performanceStats.avgOrderValue')}: ₽{Number(performance.orderStats.avgOrderValue).toFixed(2)}
                </p>
              </CardContent>
            </Card>

            {/* 优惠券统计 */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t('admin.performanceStats.couponsIssued')}</CardTitle>
                <Gift className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{performance.couponStats.totalIssued}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {t('admin.performanceStats.couponsUsed')}: {performance.couponStats.totalUsed}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t('admin.performanceStats.conversionRate')}</CardTitle>
                <Percent className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">{performance.conversionRate}%</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {t('admin.performanceStats.usageRate')}: {performance.couponStats.usageRate}%
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* 执行历史列表 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{t('admin.executionHistory')}</CardTitle>
              <CardDescription>{t('admin.executionHistoryDescription')}</CardDescription>
            </div>
            <Select
              value={statusFilter || 'all'}
              onValueChange={(value) => {
                setStatusFilter(value === 'all' ? undefined : value as 'success' | 'failed');
                setPage(0);
              }}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('admin.allStatuses')}</SelectItem>
                <SelectItem value="success">{t('admin.success')}</SelectItem>
                <SelectItem value="failed">{t('admin.failed')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {executionsLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              {t('common.loading')}
            </div>
          ) : !executions || executions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {t('admin.noExecutions')}
            </div>
          ) : (
            <div className="space-y-4">
              {executions.map((execution: any) => (
                <div
                  key={execution.id}
                  className="flex items-start gap-4 p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex-shrink-0 mt-1">
                    {execution.status === 'success' ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={execution.status === 'success' ? 'default' : 'destructive'}>
                        {execution.status === 'success' ? t('admin.success') : t('admin.failed')}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {t('admin.userId')}: {execution.userId}
                      </span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {formatDate(execution.executedAt)}
                    </div>
                    {execution.errorMessage && (
                      <div className="mt-2 text-sm text-red-600 bg-red-50 p-2 rounded">
                        {execution.errorMessage}
                      </div>
                    )}
                    {execution.result && (
                      <div className="mt-2 text-sm text-muted-foreground bg-muted p-2 rounded font-mono">
                        {JSON.stringify(execution.result, null, 2)}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 分页 */}
          {executions && executions.length > 0 && (
            <div className="flex items-center justify-between mt-6">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
              >
                {t('common.previous')}
              </Button>
              <span className="text-sm text-muted-foreground">
                {t('common.page', { count: page + 1 })}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => p + 1)}
                disabled={!executions || executions.length < pageSize}
              >
                {t('common.next')}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
