import { useTranslation } from 'react-i18next';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { trpc } from '@/lib/trpc';
import { getLocalizedText } from '@/lib/i18n';
import { ChevronLeft, ShoppingBag, ChevronRight } from 'lucide-react';
import { BottomNav } from '@/components/BottomNav';

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  paid: 'bg-blue-100 text-blue-700',
  preparing: 'bg-orange-100 text-orange-700',
  ready: 'bg-green-100 text-green-700',
  delivering: 'bg-purple-100 text-purple-700',
  completed: 'bg-gray-100 text-gray-700',
  cancelled: 'bg-red-100 text-red-700',
};

export default function Orders() {
  const { t } = useTranslation();
  const [, navigate] = useLocation();

  const { data: teaOrders = [], isLoading: teaLoading } = trpc.order.list.useQuery({ orderType: 'tea' });
  const { data: mallOrders = [], isLoading: mallLoading } = trpc.order.list.useQuery({ orderType: 'mall' });

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <BottomNav />
      <header className="bg-white sticky top-0 z-10 shadow-sm">
        <div className="flex items-center justify-between p-4">
          <button onClick={() => navigate('/')} className="p-1">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h1 className="font-bold text-lg">{t('order.orderHistory')}</h1>
          <div className="w-6" />
        </div>
      </header>

      <Tabs defaultValue="tea" className="w-full">
        <TabsList className="w-full justify-start px-4 bg-white border-b">
          <TabsTrigger value="tea">{t('nav.order')}</TabsTrigger>
          <TabsTrigger value="mall">{t('nav.mall')}</TabsTrigger>
        </TabsList>

        <TabsContent value="tea" className="p-4 space-y-3">
          {teaLoading ? (
            <div className="flex justify-center py-10">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600" />
            </div>
          ) : teaOrders.length === 0 ? (
            <EmptyOrders />
          ) : (
            teaOrders.map((order: { id: number; orderNo: string; status: string; totalAmount: string; createdAt: Date }) => (
              <OrderCard key={order.id} order={order} onClick={() => navigate(`/order/${order.id}`)} />
            ))
          )}
        </TabsContent>

        <TabsContent value="mall" className="p-4 space-y-3">
          {mallLoading ? (
            <div className="flex justify-center py-10">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600" />
            </div>
          ) : mallOrders.length === 0 ? (
            <EmptyOrders />
          ) : (
            mallOrders.map((order: { id: number; orderNo: string; status: string; totalAmount: string; createdAt: Date }) => (
              <OrderCard key={order.id} order={order} onClick={() => navigate(`/order/${order.id}`)} />
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function EmptyOrders() {
  const { t } = useTranslation();
  const [, navigate] = useLocation();
  
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <ShoppingBag className="w-16 h-16 text-gray-300 mb-4" />
      <p className="text-gray-500 mb-4">{t('order.noOrders')}</p>
      <Button onClick={() => navigate('/menu')}>{t('landing.startOrder')}</Button>
    </div>
  );
}

function OrderCard({ order, onClick }: { order: { id: number; orderNo: string; status: string; totalAmount: string; createdAt: Date }; onClick: () => void }) {
  const { t } = useTranslation();
  
  return (
    <Card className="p-4 cursor-pointer hover:shadow-md transition-shadow" onClick={onClick}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-gray-500">{order.orderNo}</span>
        <Badge className={statusColors[order.status] || 'bg-gray-100'}>
          {t(`order.status.${order.status}`)}
        </Badge>
      </div>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">
            {new Date(order.createdAt).toLocaleDateString()}
          </p>
          <p className="font-bold text-teal-600">₽{order.totalAmount}</p>
        </div>
        <ChevronRight className="w-5 h-5 text-gray-400" />
      </div>
    </Card>
  );
}
