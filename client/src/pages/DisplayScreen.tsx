import { useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { trpc } from '@/lib/trpc';
import { Clock } from 'lucide-react';

const statusColors: Record<string, string> = {
  paid: 'bg-blue-500 text-white',
  preparing: 'bg-orange-500 text-white',
  ready: 'bg-green-500 text-white',
};

const statusTexts: Record<string, { zh: string; ru: string; en: string }> = {
  paid: { zh: '已支付', ru: 'Оплачено', en: 'Paid' },
  preparing: { zh: '制作中', ru: 'Готовится', en: 'Preparing' },
  ready: { zh: '待取餐', ru: 'Готов', en: 'Ready' },
};

const orderSourceIcons: Record<string, string> = {
  telegram: '📱',
  delivery: '🚗',
  store: '🏪',
};

export default function DisplayScreen() {
  const { data: orders, refetch } = trpc.display.orders.useQuery(
    { limit: 20 },
    { refetchInterval: 5000 } // 每5秒刷新一次
  );

  useEffect(() => {
    // 每30秒强制刷新一次
    const interval = setInterval(() => {
      refetch();
    }, 30000);

    return () => clearInterval(interval);
  }, [refetch]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-8">
      {/* 标题栏 */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-5xl font-bold text-white mb-2">CHU TEA 取餐显示屏</h1>
            <p className="text-xl text-gray-400">请根据取件码取餐 / Pickup Orders</p>
          </div>
          <div className="flex items-center gap-3 text-gray-400">
            <Clock className="w-8 h-8" />
            <span className="text-3xl font-mono">
              {new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>
      </div>

      {/* 订单网格 */}
      {!orders || orders.length === 0 ? (
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <p className="text-4xl text-gray-500 mb-4">暂无待取餐订单</p>
            <p className="text-2xl text-gray-600">No pending orders</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {orders.map((order) => (
            <Card
              key={order.id}
              className="bg-white/10 backdrop-blur-lg border-2 border-white/20 p-6 hover:scale-105 transition-transform duration-300"
            >
              {/* 取件码 - 超大显示 */}
              <div className="text-center mb-4">
                <div className="text-7xl font-bold text-white tracking-wider font-mono mb-2 drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]">
                  {order.pickupCode}
                </div>
                <div className="flex items-center justify-center gap-2">
                  <span className="text-2xl">{orderSourceIcons[order.orderSource]}</span>
                  <Badge className={`${statusColors[order.status]} text-lg px-4 py-1`}>
                    {statusTexts[order.status]?.ru || order.status}
                  </Badge>
                </div>
              </div>

              {/* 订单信息 */}
              <div className="border-t border-white/20 pt-4 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-sm">订单号:</span>
                  <span className="text-white font-mono text-sm">{order.orderNo}</span>
                </div>
                
                {order.userName && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 text-sm">顾客:</span>
                    <span className="text-white text-sm">{order.userName}</span>
                  </div>
                )}

                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-sm">金额:</span>
                  <span className="text-white font-bold text-lg">₽{order.totalAmount}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-sm">时间:</span>
                  <span className="text-white text-sm">
                    {new Date(order.createdAt).toLocaleTimeString('ru-RU', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>

                {order.deliveryType === 'delivery' && (
                  <div className="mt-2 pt-2 border-t border-white/20">
                    <Badge className="bg-purple-500 text-white w-full justify-center">
                      🚚 外卖配送 / Delivery
                    </Badge>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* 底部提示 */}
      <div className="mt-8 text-center">
        <p className="text-gray-500 text-lg">
          自动刷新中... / Auto-refreshing... | 共 {orders?.length || 0} 个订单
        </p>
      </div>
    </div>
  );
}
