import { useTranslation } from 'react-i18next';
import { trpc } from '@/lib/trpc';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Download, Search } from 'lucide-react';
import { useState } from 'react';
import { Input } from '@/components/ui/input';

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  processing: 'bg-blue-100 text-blue-700',
  succeeded: 'bg-green-100 text-green-700',
  failed: 'bg-red-100 text-red-700',
  refunded: 'bg-gray-100 text-gray-700',
};

export default function PaymentHistory() {
  const { t } = useTranslation();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: payments, isLoading } = trpc.payment.list.useQuery({
    status: statusFilter === 'all' ? undefined : statusFilter,
    search: searchQuery || undefined,
  });

  const handleExport = () => {
    if (!payments || payments.length === 0) {
      return;
    }

    // 生成 CSV 内容
    const headers = [
      t('payment.paymentNo'),
      t('payment.orderId'),
      t('payment.amount'),
      t('payment.currency'),
      t('payment.status'),
      t('payment.gateway'),
      t('payment.paidAt'),
      t('payment.createdAt'),
    ];

    const rows = payments.map(payment => [
      payment.paymentNo,
      payment.orderId.toString(),
      payment.amount,
      payment.currency,
      t(`payment.status.${payment.status}`),
      payment.gateway,
      payment.paidAt ? new Date(payment.paidAt).toLocaleString() : '-',
      new Date(payment.createdAt).toLocaleString(),
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n');

    // 下载 CSV 文件
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `payments_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('payment.history')}</h1>
        <Button onClick={handleExport} disabled={!payments || payments.length === 0}>
          <Download className="w-4 h-4 mr-2" />
          {t('common.export')}
        </Button>
      </div>

      {/* 筛选和搜索 */}
      <Card className="p-4">
        <div className="flex gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder={t('payment.searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder={t('payment.filterByStatus')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('common.all')}</SelectItem>
              <SelectItem value="pending">{t('payment.status.pending')}</SelectItem>
              <SelectItem value="processing">{t('payment.status.processing')}</SelectItem>
              <SelectItem value="succeeded">{t('payment.status.succeeded')}</SelectItem>
              <SelectItem value="failed">{t('payment.status.failed')}</SelectItem>
              <SelectItem value="refunded">{t('payment.status.refunded')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* 支付记录列表 */}
      <div className="space-y-4">
        {payments && payments.length > 0 ? (
          payments.map((payment) => (
            <Card key={payment.id} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-mono text-sm text-gray-600">
                      {payment.paymentNo}
                    </span>
                    <Badge className={statusColors[payment.status]}>
                      {t(`payment.status.${payment.status}`)}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">{t('payment.orderId')}:</span>{' '}
                      <span className="font-medium">#{payment.orderId}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">{t('payment.gateway')}:</span>{' '}
                      <span className="font-medium">{payment.gateway}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">{t('payment.amount')}:</span>{' '}
                      <span className="font-medium">
                        ₽{payment.amount} {payment.currency}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">{t('payment.createdAt')}:</span>{' '}
                      <span className="font-medium">
                        {new Date(payment.createdAt).toLocaleString()}
                      </span>
                    </div>
                    {payment.paidAt && (
                      <div>
                        <span className="text-gray-500">{t('payment.paidAt')}:</span>{' '}
                        <span className="font-medium">
                          {new Date(payment.paidAt).toLocaleString()}
                        </span>
                      </div>
                    )}
                    {payment.errorMessage && (
                      <div className="col-span-2">
                        <span className="text-gray-500">{t('payment.error')}:</span>{' '}
                        <span className="text-red-600">{payment.errorMessage}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))
        ) : (
          <Card className="p-8 text-center text-gray-500">
            {t('payment.noRecords')}
          </Card>
        )}
      </div>
    </div>
  );
}
