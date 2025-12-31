import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useRoute } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { trpc } from '@/lib/trpc';
import { getLocalizedText } from '@/lib/i18n';
import { ChevronLeft, Loader2, CreditCard, CheckCircle2, XCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function Payment() {
  const { t } = useTranslation();
  const [, navigate] = useLocation();
  const [, params] = useRoute('/payment/:orderId');
  const orderId = params?.orderId ? parseInt(params.orderId) : 0;
  
  const [isCreatingPayment, setIsCreatingPayment] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'processing' | 'succeeded' | 'failed' | 'refunded'>('pending');
  
  const { data: order, isLoading: isLoadingOrder } = trpc.order.getById.useQuery({ id: orderId }, { enabled: orderId > 0 });
  const { data: payment } = trpc.payment.getByOrderId.useQuery({ orderId }, { enabled: orderId > 0 });
  const createPaymentMutation = trpc.payment.createPayment.useMutation();
  
  useEffect(() => {
    if (payment) {
      setPaymentStatus(payment.status);
    }
  }, [payment]);
  
  const handlePayment = async () => {
    if (!order) return;
    
    setIsCreatingPayment(true);
    try {
      const returnUrl = `${window.location.origin}/payment/callback/${orderId}`;
      const result = await createPaymentMutation.mutateAsync({
        orderId: order.id,
        returnUrl,
      });
      
      if (result.confirmationUrl) {
        // 跳转到 YooKassa 支付页面
        window.location.href = result.confirmationUrl;
      } else {
        toast.error(t('payment.failed'));
      }
    } catch (error) {
      console.error('Payment creation failed:', error);
      toast.error(t('payment.failed'));
    } finally {
      setIsCreatingPayment(false);
    }
  };
  
  if (isLoadingOrder) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
      </div>
    );
  }
  
  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600">{t('order.notFound')}</p>
          <Button className="mt-4" onClick={() => navigate('/orders')}>
            {t('order.viewOrders')}
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <header className="bg-white sticky top-0 z-10 shadow-sm">
        <div className="flex items-center justify-between p-4">
          <button onClick={() => navigate(`/order/${orderId}`)} className="p-1">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h1 className="font-bold text-lg">{t('payment.title')}</h1>
          <div className="w-6" />
        </div>
      </header>

      <div className="p-4 space-y-4">
        {/* 订单信息 */}
        <Card className="p-4">
          <h3 className="font-medium mb-3">{t('order.orderInfo')}</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">{t('order.orderNo')}</span>
              <span className="font-medium">{order.orderNo}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">{t('order.orderType')}</span>
              <span className="font-medium">{order.orderType === 'tea' ? t('order.teaOrder') : t('order.mallOrder')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">{t('order.total')}</span>
              <span className="font-bold text-lg text-teal-600">₽{parseFloat(order.totalAmount).toFixed(2)}</span>
            </div>
          </div>
        </Card>

        {/* 支付状态 */}
        {payment && (
          <Card className="p-4">
            <h3 className="font-medium mb-3">{t('payment.status')}</h3>
            <div className="flex items-center gap-3">
              {paymentStatus === 'succeeded' && (
                <>
                  <CheckCircle2 className="w-6 h-6 text-green-500" />
                  <div>
                    <p className="font-medium text-green-600">{t('payment.succeeded')}</p>
                    <p className="text-sm text-gray-500">{t('payment.succeededDesc')}</p>
                  </div>
                </>
              )}
              {paymentStatus === 'processing' && (
                <>
                  <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                  <div>
                    <p className="font-medium text-blue-600">{t('payment.processing')}</p>
                    <p className="text-sm text-gray-500">{t('payment.processingDesc')}</p>
                  </div>
                </>
              )}
              {paymentStatus === 'failed' && (
                <>
                  <XCircle className="w-6 h-6 text-red-500" />
                  <div>
                    <p className="font-medium text-red-600">{t('payment.failed')}</p>
                    <p className="text-sm text-gray-500">{t('payment.failedDesc')}</p>
                  </div>
                </>
              )}
              {paymentStatus === 'pending' && (
                <>
                  <CreditCard className="w-6 h-6 text-gray-400" />
                  <div>
                    <p className="font-medium text-gray-600">{t('payment.pending')}</p>
                    <p className="text-sm text-gray-500">{t('payment.pendingDesc')}</p>
                  </div>
                </>
              )}
            </div>
          </Card>
        )}

        {/* 支付方式说明 */}
        <Card className="p-4">
          <h3 className="font-medium mb-3">{t('payment.methods')}</h3>
          <div className="space-y-2 text-sm text-gray-600">
            <p>• {t('payment.methodCard')}</p>
            <p>• {t('payment.methodSberPay')}</p>
            <p>• {t('payment.methodYooMoney')}</p>
            <p>• {t('payment.methodSBP')}</p>
          </div>
        </Card>
      </div>

      {/* 支付按钮 */}
      {(!payment || paymentStatus === 'pending' || paymentStatus === 'failed') && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg p-4 safe-area-pb">
          <Button 
            className="w-full bg-teal-600 hover:bg-teal-700 py-6"
            onClick={handlePayment}
            disabled={isCreatingPayment}
          >
            {isCreatingPayment ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                {t('payment.creating')}
              </>
            ) : (
              <>
                <CreditCard className="w-5 h-5 mr-2" />
                {t('payment.payNow')} ₽{parseFloat(order.totalAmount).toFixed(2)}
              </>
            )}
          </Button>
        </div>
      )}

      {/* 支付成功后显示返回订单按钮 */}
      {paymentStatus === 'succeeded' && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg p-4 safe-area-pb">
          <Button 
            className="w-full bg-green-600 hover:bg-green-700 py-6"
            onClick={() => navigate(`/order/${orderId}`)}
          >
            {t('payment.viewOrder')}
          </Button>
        </div>
      )}
    </div>
  );
}
