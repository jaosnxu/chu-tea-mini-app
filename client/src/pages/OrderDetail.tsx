import { useTranslation } from 'react-i18next';
import { useLocation, useParams } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { trpc } from '@/lib/trpc';
import { getLocalizedText } from '@/lib/i18n';
import { ChevronLeft, MapPin, Clock, Phone, RefreshCw, Star } from 'lucide-react';
import { toast } from 'sonner';
import { useTelegramBackButton } from '@/hooks/useTelegramBackButton';
import { useAuth } from '@/_core/hooks/useAuth';
import { useState } from 'react';
import { OrderReviewDialog } from '@/components/OrderReviewDialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  paid: 'bg-blue-100 text-blue-700',
  preparing: 'bg-orange-100 text-orange-700',
  ready: 'bg-green-100 text-green-700',
  delivering: 'bg-purple-100 text-purple-700',
  completed: 'bg-gray-100 text-gray-700',
  cancelled: 'bg-red-100 text-red-700',
};

export default function OrderDetail() {
  const { t } = useTranslation();
  const [, navigate] = useLocation();
  const params = useParams<{ id: string }>();
  
  // 显示 Telegram 返回按钮
  useTelegramBackButton(true, () => navigate('/orders'));

  const { data: order, isLoading, refetch } = trpc.order.getById.useQuery(
    { id: parseInt(params.id || '0') },
    { enabled: !!params.id }
  );

  // 获取订单评价
  const { data: review } = trpc.review.getByOrderId.useQuery(
    { orderId: parseInt(params.id || '0') },
    { enabled: !!params.id && order?.status === 'completed' }
  );

  const { user } = useAuth();
  const [refundAmount, setRefundAmount] = useState('');
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [isRefundDialogOpen, setIsRefundDialogOpen] = useState(false);
  const cancelMutation = trpc.order.cancel.useMutation();
  const refundMutation = trpc.payment.createRefund.useMutation();
  const { data: payment } = trpc.payment.getByOrderId.useQuery(
    { orderId: parseInt(params.id || '0') },
    { enabled: !!params.id }
  );

  const handleCancel = async () => {
    if (!order) return;
    try {
      await cancelMutation.mutateAsync({ id: order.id });
      toast.success(t('order.cancelOrder'));
      refetch();
    } catch (error) {
      toast.error(t('common.error'));
    }
  };

  const handleRefundDialogOpen = () => {
    if (order) {
      setRefundAmount(order.totalAmount);
      setIsRefundDialogOpen(true);
    }
  };

  const handleRefund = async () => {
    if (!order || !payment || !payment.gatewayPaymentId) {
      toast.error(t('order.refund.noPayment'));
      return;
    }
    
    const amount = parseFloat(refundAmount);
    const maxAmount = parseFloat(order.totalAmount);
    
    if (isNaN(amount) || amount <= 0) {
      toast.error(t('order.refund.invalidAmount'));
      return;
    }
    
    if (amount > maxAmount) {
      toast.error(t('order.refund.exceedsMax'));
      return;
    }
    
    try {
      await refundMutation.mutateAsync({
        paymentId: payment.id,
        amount: amount,
        reason: `Refund ${amount === maxAmount ? 'full' : 'partial'} for order ${order.orderNo}`,
      });
      toast.success(t('order.refund.success'));
      setIsRefundDialogOpen(false);
      refetch();
    } catch (error: any) {
      toast.error(error.message || t('order.refund.failed'));
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <p className="text-gray-500 mb-4">{t('error.notFound')}</p>
        <Button onClick={() => navigate('/orders')}>{t('common.back')}</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <header className="bg-white sticky top-0 z-10 shadow-sm">
        <div className="flex items-center justify-between p-4">
          <button onClick={() => navigate('/orders')} className="p-1">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h1 className="font-bold text-lg">{t('order.orderDetail')}</h1>
          <div className="w-6" />
        </div>
      </header>

      <div className="p-4 space-y-4">
        {/* 订单状态 */}
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">{t('order.orderNo')}</p>
              <p className="font-mono">{order.orderNo}</p>
            </div>
            <Badge className={statusColors[order.status] || 'bg-gray-100'}>
              {t(`order.status.${order.status}`)}
            </Badge>
          </div>
          
          {/* 取件码显示 */}
          {order.pickupCode && (
            <div className="mt-3 pt-3 border-t">
              <p className="text-sm text-gray-500 mb-2">{t('order.pickupCode')}</p>
              <div className="flex items-center justify-center bg-gradient-to-r from-teal-50 to-blue-50 rounded-lg p-6 border-2 border-teal-200">
                <div className="text-center">
                  <div className="text-5xl font-bold text-teal-600 tracking-widest font-mono">
                    {order.pickupCode}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    {order.deliveryType === 'pickup' ? t('order.showCodeAtStore') : t('order.showCodeToCourier')}
                  </p>
                </div>
              </div>
            </div>
          )}
          
          <div className="mt-3 pt-3 border-t">
            <p className="text-sm text-gray-500">{t('order.orderTime')}</p>
            <p>{new Date(order.createdAt).toLocaleString()}</p>
          </div>
        </Card>

        {/* 配送信息 */}
        <Card className="p-4">
          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-teal-600 mt-0.5" />
            <div>
              <p className="font-medium">
                {order.deliveryType === 'pickup' ? t('order.pickup') : t('order.delivery')}
              </p>
              {order.addressSnapshot && (
                <p className="text-sm text-gray-500 mt-1">
                  {(order.addressSnapshot as { address?: string }).address}
                </p>
              )}
            </div>
          </div>
        </Card>

        {/* 商品列表 */}
        <Card className="p-4">
          <h3 className="font-medium mb-3">{t('order.orderSummary')}</h3>
          <div className="space-y-3">
            {order.items?.map((item: { id: number; productSnapshot: { name?: string } | null; quantity: number; totalPrice: string }) => (
              <div key={item.id} className="flex justify-between text-sm">
                <span>{(item.productSnapshot as { name?: string })?.name || 'Unknown'} x{item.quantity}</span>
                <span>₽{item.totalPrice}</span>
              </div>
            ))}
          </div>
          <div className="border-t mt-3 pt-3 space-y-2">
            <div className="flex justify-between text-sm">
              <span>{t('order.subtotal')}</span>
              <span>₽{order.subtotal}</span>
            </div>
            {order.couponDiscount && parseFloat(order.couponDiscount) > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>{t('order.couponDiscount')}</span>
                <span>-₽{order.couponDiscount}</span>
              </div>
            )}
            {(order.pointsUsed ?? 0) > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>{t('order.pointsDiscount')}</span>
                <span>-₽{order.pointsDiscount}</span>
              </div>
            )}
            <div className="flex justify-between font-bold pt-2 border-t">
              <span>{t('order.total')}</span>
              <span className="text-teal-600">₽{order.totalAmount}</span>
            </div>
          </div>
        </Card>
      </div>

      {/* 底部操作 */}
      {(['pending', 'paid'].includes(order.status) || (user?.role === 'admin' && payment?.status === 'succeeded')) && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg p-4 safe-area-pb">
          <div className="flex gap-3">
            {['pending', 'paid'].includes(order.status) && (
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={handleCancel}
                disabled={cancelMutation.isPending}
              >
                {t('order.cancelOrder')}
              </Button>
            )}
            {order.status === 'pending' && (
              <Button className="flex-1 bg-teal-600 hover:bg-teal-700">
                {t('order.payNow')}
              </Button>
            )}
            {order.status === 'completed' && !review && (
              <Button 
                className="flex-1 bg-teal-600 hover:bg-teal-700"
                onClick={() => setShowReviewDialog(true)}
              >
                <Star className="w-4 h-4 mr-2" />
                {t('order.writeReview')}
              </Button>
            )}
            {user?.role === 'admin' && payment?.status === 'succeeded' && (
              <AlertDialog open={isRefundDialogOpen} onOpenChange={setIsRefundDialogOpen}>
                <AlertDialogTrigger asChild>
                  <Button 
                    variant="destructive" 
                    className="flex-1"
                    disabled={refundMutation.isPending}
                    onClick={handleRefundDialogOpen}
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    {t('order.refund.button')}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{t('order.refund.confirmTitle')}</AlertDialogTitle>
                    <AlertDialogDescription>
                      {t('order.refund.partialDesc')}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <div className="py-4">
                    <Label htmlFor="refundAmount">{t('order.refund.amountLabel')}</Label>
                    <div className="flex items-center gap-2 mt-2">
                      <Input
                        id="refundAmount"
                        type="number"
                        step="0.01"
                        min="0"
                        max={order.totalAmount}
                        value={refundAmount}
                        onChange={(e) => setRefundAmount(e.target.value)}
                        placeholder="0.00"
                      />
                      <span className="text-sm text-gray-500">RUB</span>
                    </div>
                    <p className="text-sm text-gray-500 mt-2">
                      {t('order.refund.maxAmount')}: ₽{order.totalAmount}
                    </p>
                  </div>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                    <AlertDialogAction onClick={handleRefund}>
                      {t('common.confirm')}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>
      )}

      {/* 评价对话框 */}
      {order && order.storeId && (
        <OrderReviewDialog
          open={showReviewDialog}
          onOpenChange={setShowReviewDialog}
          orderId={order.id}
          storeId={order.storeId}
          onSuccess={() => {
            refetch();
          }}
        />
      )}
    </div>
  );
}
