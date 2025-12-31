import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, Package, DollarSign, Percent, Award, Download } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { toast } from 'sonner';

export default function MarketingDashboard() {
  const { t } = useTranslation();
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | 'all'>('30d');
  
  const exportMutation = trpc.marketingTrigger.exportReport.useMutation();

  // 计算时间范围
  const getDateRange = () => {
    const endDate = new Date();
    let startDate: Date | undefined;

    if (timeRange === '7d') {
      startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);
    } else if (timeRange === '30d') {
      startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);
    }

    return {
      startDate: startDate?.toISOString(),
      endDate: endDate.toISOString(),
    };
  };

  const dateRange = getDateRange();

  // 获取触发器效果排名
  const { data: ranking, isLoading } = trpc.marketingTrigger.getPerformanceRanking.useQuery({
    startDate: dateRange.startDate,
    endDate: dateRange.endDate,
    limit: 5,
  });
  
  // 获取趋势数据
  const { data: trends, isLoading: trendsLoading } = trpc.marketingTrigger.getTrends.useQuery({
    startDate: dateRange.startDate,
    endDate: dateRange.endDate,
  });
  
  // 获取执行时间线
  const { data: timeline, isLoading: timelineLoading } = trpc.marketingTrigger.getExecutionTimeline.useQuery({
    days: timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90,
  });
  
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const { data: dateDetails } = trpc.marketingTrigger.getDateExecutionDetails.useQuery(
    { date: selectedDate! },
    { enabled: !!selectedDate }
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t('admin.marketingDashboard.title')}</h1>
          <p className="text-muted-foreground mt-1">
            {t('admin.marketingDashboard.description')}
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={async () => {
              try {
                const result = await exportMutation.mutateAsync({
                  startDate: dateRange.startDate,
                  endDate: dateRange.endDate,
                  limit: 5,
                });
                const link = document.createElement('a');
                link.href = `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${result.data}`;
                link.download = result.filename;
                link.click();
                toast.success('导出成功');
              } catch (error) {
                toast.error('导出失败');
              }
            }}
          >
            <Download className="h-4 w-4 mr-2" />
            导出报告
          </Button>
          <Select value={timeRange} onValueChange={(v) => setTimeRange(v as any)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">{t('admin.marketingDashboard.last7Days')}</SelectItem>
              <SelectItem value="30d">{t('admin.marketingDashboard.last30Days')}</SelectItem>
              <SelectItem value="all">{t('admin.marketingDashboard.allTime')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Top 5 触发器排名 */}
      <div>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Award className="h-5 w-5 text-yellow-500" />
          {t('admin.marketingDashboard.topTriggers')}
        </h2>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        ) : ranking && ranking.length > 0 ? (
          <div className="space-y-3">
            {ranking.map((item, index) => {
              // 从 campaignId 中提取 triggerId
              const triggerId = item.campaignId?.match(/trigger_(\d+)_/)?.[1];

              return (
                <Card key={item.campaignId}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`
                          flex items-center justify-center w-8 h-8 rounded-full font-bold
                          ${index === 0 ? 'bg-yellow-500 text-white' : ''}
                          ${index === 1 ? 'bg-gray-400 text-white' : ''}
                          ${index === 2 ? 'bg-orange-600 text-white' : ''}
                          ${index >= 3 ? 'bg-muted text-muted-foreground' : ''}
                        `}>
                          {index + 1}
                        </div>
                        <div>
                          <CardTitle className="text-base">
                            {t('admin.marketingDashboard.triggerLabel')} #{triggerId || '?'}
                          </CardTitle>
                          <CardDescription className="text-xs">
                            {item.campaignId}
                          </CardDescription>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-blue-500" />
                        <div>
                          <div className="text-xs text-muted-foreground">
                            {t('admin.marketingDashboard.orders')}
                          </div>
                          <div className="text-lg font-semibold">{item.totalOrders}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-green-500" />
                        <div>
                          <div className="text-xs text-muted-foreground">
                            {t('admin.marketingDashboard.revenue')}
                          </div>
                          <div className="text-lg font-semibold">
                            ₽{Number(item.totalRevenue).toFixed(2)}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-purple-500" />
                        <div>
                          <div className="text-xs text-muted-foreground">
                            {t('admin.marketingDashboard.avgOrderValue')}
                          </div>
                          <div className="text-lg font-semibold">
                            ₽{Number(item.avgOrderValue).toFixed(2)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              {t('admin.marketingDashboard.noData')}
            </CardContent>
          </Card>
        )}
      </div>
      
      {/* 趋势图表 */}
      <div>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-blue-500" />
          {t('admin.marketingDashboard.trends.title')}
        </h2>
        
        {trendsLoading ? (
          <Skeleton className="h-80 w-full" />
        ) : trends && trends.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>{t('admin.marketingDashboard.trends.chartTitle')}</CardTitle>
              <CardDescription>{t('admin.marketingDashboard.trends.chartDescription')}</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={trends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Line 
                    yAxisId="left" 
                    type="monotone" 
                    dataKey="orderCount" 
                    stroke="#8884d8" 
                    name={t('admin.marketingDashboard.trends.orders')} 
                  />
                  <Line 
                    yAxisId="right" 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#82ca9d" 
                    name={t('admin.marketingDashboard.trends.revenue')} 
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              {t('admin.marketingDashboard.noData')}
            </CardContent>
          </Card>
        )}
      </div>
      
      {/* 执行时间线 */}
      <div>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-purple-500" />
          {t('admin.marketingDashboard.timeline.title')}
        </h2>
        
        {timelineLoading ? (
          <Skeleton className="h-96 w-full" />
        ) : timeline && timeline.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>{t('admin.marketingDashboard.timeline.chartTitle')}</CardTitle>
              <CardDescription>{t('admin.marketingDashboard.timeline.chartDescription')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {timeline.map((item: any) => (
                  <div
                    key={item.date}
                    className="flex items-center justify-between p-3 border rounded hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => setSelectedDate(item.date)}
                  >
                    <div className="flex-1">
                      <div className="font-medium">{new Date(item.date).toLocaleDateString('zh-CN')}</div>
                      <div className="text-sm text-muted-foreground">
                        {item.totalExecutions} 次执行 · {item.successRate}% 成功率
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <div className="text-right">
                        <div className="text-muted-foreground">{t('admin.marketingDashboard.timeline.orders')}</div>
                        <div className="font-semibold">{item.orderCount}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-muted-foreground">{t('admin.marketingDashboard.timeline.revenue')}</div>
                        <div className="font-semibold">₽{Number(item.revenue).toFixed(2)}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {selectedDate && dateDetails && (
                <div className="mt-4 p-4 border-t">
                  <h3 className="font-semibold mb-2">{new Date(selectedDate).toLocaleDateString('zh-CN')} 的触发器详情</h3>
                  <div className="space-y-2">
                    {dateDetails.map((detail: any) => (
                      <div key={detail.triggerId} className="flex items-center justify-between text-sm">
                        <span>{detail.triggerName}</span>
                        <span className="text-muted-foreground">
                          {detail.executionCount} 次 · {detail.successRate}% 成功
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              {t('admin.marketingDashboard.noData')}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
