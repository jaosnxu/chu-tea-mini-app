import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useRoute } from 'wouter';
import { Button } from '@/components/ui/button';
import { trpc } from '@/lib/trpc';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';

export default function PaymentCallback() {
  const { t } = useTranslation();
  const [, navigate] = useLocation();
  const [, params] = useRoute('/payment/callback/:orderId');
  const orderId = params?.orderId ? parseInt(params.orderId) : 0;
  
  const [status, setStatus] = useState<'checking' | 'success' | 'failed'>('checking');
  const { data: payment, refetch } = trpc.payment.getByOrderId.useQuery({ orderId }, { enabled: orderId > 0 });
  
  useEffect(() => {
    if (!payment) return;
    
    // 检查支付状态
    if (payment.status === 'succeeded') {
      setStatus('success');
    } else if (payment.status === 'failed') {
      setStatus('failed');
    } else {
      // 如果状态还是 pending 或 processing，继续轮询
      const timer = setTimeout(() => {
        refetch();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [payment, refetch]);
  
  if (status === 'checking') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-16 h-16 animate-spin text-teal-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">{t('payment.checking')}</h2>
          <p className="text-gray-600">{t('payment.checkingDesc')}</p>
        </div>
      </div>
    );
  }
  
  if (status === 'success') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <CheckCircle2 className="w-20 h-20 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2 text-green-600">{t('payment.succeeded')}</h2>
          <p className="text-gray-600 mb-6">{t('payment.succeededDesc')}</p>
          <div className="space-y-3">
            <Button 
              className="w-full bg-teal-600 hover:bg-teal-700"
              onClick={() => navigate(`/order/${orderId}`)}
            >
              {t('payment.viewOrder')}
            </Button>
            <Button 
              variant="outline"
              className="w-full"
              onClick={() => navigate('/orders')}
            >
              {t('order.viewOrders')}
            </Button>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <XCircle className="w-20 h-20 text-red-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2 text-red-600">{t('payment.failed')}</h2>
        <p className="text-gray-600 mb-6">{t('payment.failedDesc')}</p>
        <div className="space-y-3">
          <Button 
            className="w-full bg-teal-600 hover:bg-teal-700"
            onClick={() => navigate(`/payment/${orderId}`)}
          >
            {t('payment.retry')}
          </Button>
          <Button 
            variant="outline"
            className="w-full"
            onClick={() => navigate(`/order/${orderId}`)}
          >
            {t('payment.viewOrder')}
          </Button>
        </div>
      </div>
    </div>
  );
}
