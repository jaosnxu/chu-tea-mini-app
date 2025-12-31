import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, Package, DollarSign, Percent, Award } from 'lucide-react';

export default function MarketingDashboard() {
  const { t } = useTranslation();
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | 'all'>('30d');

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t('admin.marketingDashboard.title')}</h1>
          <p className="text-muted-foreground mt-1">
            {t('admin.marketingDashboard.description')}
          </p>
        </div>

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
    </div>
  );
}
