import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Trophy, TrendingUp, Package, DollarSign, Percent, Download } from 'lucide-react';
import { toast } from 'sonner';

export default function ABTestComparison() {
  const { t } = useTranslation();
  const [selectedGroup, setSelectedGroup] = useState<string>('');
  
  const exportMutation = trpc.marketingTrigger.exportABTest.useMutation();

  const { data: groupTags, isLoading: tagsLoading } = trpc.marketingTrigger.getGroupTags.useQuery();
  const { data: comparison, isLoading: comparisonLoading } = trpc.marketingTrigger.getGroupComparison.useQuery(
    { groupTag: selectedGroup },
    { enabled: !!selectedGroup }
  );

  const getBestTrigger = () => {
    if (!comparison || comparison.length === 0) return null;
    return comparison.reduce((best, current) => {
      const currentScore = current.conversionRate * 0.4 + current.couponStats.usageRate * 0.3 + (current.orderStats.avgOrderValue / 100) * 0.3;
      const bestScore = best.conversionRate * 0.4 + best.couponStats.usageRate * 0.3 + (best.orderStats.avgOrderValue / 100) * 0.3;
      return currentScore > bestScore ? current : best;
    });
  };

  const bestTrigger = getBestTrigger();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t('admin.abTest.title')}</h1>
        <p className="text-muted-foreground mt-1">{t('admin.abTest.description')}</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{t('admin.abTest.selectGroup')}</CardTitle>
            {selectedGroup && (
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  try {
                    const result = await exportMutation.mutateAsync({ groupTag: selectedGroup });
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
                导出对比报告
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {tagsLoading ? (
            <Skeleton className="h-10 w-full" />
          ) : (
            <Select value={selectedGroup} onValueChange={setSelectedGroup}>
              <SelectTrigger>
                <SelectValue placeholder={t('admin.abTest.selectGroupPlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                {groupTags && groupTags.length > 0 ? (
                  groupTags.map((tag) => (
                    <SelectItem key={tag} value={tag}>{tag}</SelectItem>
                  ))
                ) : (
                  <div className="p-2 text-sm text-muted-foreground">{t('admin.abTest.noGroups')}</div>
                )}
              </SelectContent>
            </Select>
          )}
        </CardContent>
      </Card>

      {selectedGroup && (
        <>
          {comparisonLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-48 w-full" />
              ))}
            </div>
          ) : comparison && comparison.length > 0 ? (
            <>
              {bestTrigger && (
                <Card className="border-yellow-500 border-2">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Trophy className="h-5 w-5 text-yellow-500" />
                      <CardTitle className="text-yellow-600">{t('admin.abTest.recommended')}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-lg font-semibold">{bestTrigger.triggerName}</div>
                  </CardContent>
                </Card>
              )}

              <div className="grid gap-4">
                {comparison.map((item) => (
                  <Card key={item.triggerId}>
                    <CardHeader>
                      <CardTitle>{item.triggerName}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4 text-blue-500" />
                          <div>
                            <div className="text-xs text-muted-foreground">{t('admin.abTest.totalOrders')}</div>
                            <div className="text-lg font-semibold">{item.orderStats.totalOrders}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-green-500" />
                          <div>
                            <div className="text-xs text-muted-foreground">{t('admin.abTest.totalRevenue')}</div>
                            <div className="text-lg font-semibold">₽{Number(item.orderStats.totalRevenue).toFixed(2)}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Percent className="h-4 w-4 text-purple-500" />
                          <div>
                            <div className="text-xs text-muted-foreground">{t('admin.abTest.conversionRate')}</div>
                            <div className="text-lg font-semibold">{item.conversionRate}%</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-orange-500" />
                          <div>
                            <div className="text-xs text-muted-foreground">{t('admin.abTest.usageRate')}</div>
                            <div className="text-lg font-semibold">{item.couponStats.usageRate}%</div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          ) : (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">{t('admin.abTest.noData')}</CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
