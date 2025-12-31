import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'wouter';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useOfflineSync } from '@/hooks/useOfflineSync';
import type { OfflineOrder } from '@/lib/offlineDB';
import { ChevronLeft, RefreshCw, WifiOff, CheckCircle, XCircle, Clock } from 'lucide-react';

export default function OfflineOrders() {
  const { t } = useTranslation();
  const [, navigate] = useLocation();
  const { getAllOfflineOrders, syncPendingOrders, isOnline, isSyncing } = useOfflineSync();
  
  const [orders, setOrders] = useState<OfflineOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 加载离线订单
  const loadOrders = async () => {
    setIsLoading(true);
    try {
      const allOrders = await getAllOfflineOrders();
      setOrders(allOrders);
    } catch (error) {
      console.error('Failed to load offline orders:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  // 手动同步
  const handleSync = async () => {
    await syncPendingOrders();
    await loadOrders();
  };

  // 格式化时间
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // 获取状态徽章
  const getStatusBadge = (status: OfflineOrder['syncStatus']) => {
    switch (status) {
      case 'pending':
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">
            <Clock className="w-3 h-3 mr-1" />
            {t('offline.pending')}
          </Badge>
        );
      case 'syncing':
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">
            <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
            {t('offline.syncing')}
          </Badge>
        );
      case 'synced':
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
            <CheckCircle className="w-3 h-3 mr-1" />
            {t('offline.synced')}
          </Badge>
        );
      case 'failed':
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-300">
            <XCircle className="w-3 h-3 mr-1" />
            {t('offline.failed')}
          </Badge>
        );
    }
  };

  const pendingOrders = orders.filter(o => o.syncStatus === 'pending');
  const syncedOrders = orders.filter(o => o.syncStatus === 'synced');
  const failedOrders = orders.filter(o => o.syncStatus === 'failed');

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* 头部 */}
      <header className="bg-white sticky top-0 z-10 shadow-sm">
        <div className="flex items-center justify-between p-4">
          <button onClick={() => navigate('/orders')} className="p-1">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h1 className="font-bold text-lg">{t('offline.title')}</h1>
          <div className="w-6" />
        </div>
      </header>

      {/* 网络状态和同步按钮 */}
      <div className="p-4 space-y-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isOnline ? (
                <>
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <span className="text-sm text-gray-600">{t('offline.online')}</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-4 h-4 text-red-500" />
                  <span className="text-sm text-gray-600">{t('offline.offline')}</span>
                </>
              )}
            </div>
            
            {isOnline && pendingOrders.length > 0 && (
              <Button
                size="sm"
                onClick={handleSync}
                disabled={isSyncing}
                className="bg-teal-600 hover:bg-teal-700"
              >
                {isSyncing ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-1 animate-spin" />
                    {t('offline.syncing')}
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-1" />
                    {t('offline.syncNow')}
                  </>
                )}
              </Button>
            )}
          </div>

          {/* 统计信息 */}
          <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t">
            <div className="text-center">
              <p className="text-2xl font-bold text-yellow-600">{pendingOrders.length}</p>
              <p className="text-xs text-gray-500">{t('offline.pending')}</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{syncedOrders.length}</p>
              <p className="text-xs text-gray-500">{t('offline.synced')}</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600">{failedOrders.length}</p>
              <p className="text-xs text-gray-500">{t('offline.failed')}</p>
            </div>
          </div>
        </Card>

        {/* 订单列表 */}
        {isLoading ? (
          <div className="text-center py-8 text-gray-500">{t('common.loading')}</div>
        ) : orders.length === 0 ? (
          <div className="text-center py-8 text-gray-500">{t('offline.noOrders')}</div>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => (
              <Card key={order.id} className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-xs text-gray-500">{formatTime(order.createdAt)}</p>
                    <p className="text-sm font-medium mt-1">
                      {order.items.length} {t('order.items')}
                    </p>
                  </div>
                  {getStatusBadge(order.syncStatus)}
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">{t('order.deliveryType')}:</span>
                    <span>{t(`order.${order.deliveryMethod}`)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">{t('order.totalAmount')}:</span>
                    <span className="font-semibold">₽{order.finalAmount.toFixed(2)}</span>
                  </div>
                  {order.syncStatus === 'failed' && order.syncError && (
                    <div className="mt-2 p-2 bg-red-50 rounded text-xs text-red-600">
                      {order.syncError}
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
