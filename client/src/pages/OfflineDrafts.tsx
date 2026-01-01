import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useOfflineOrders } from '@/hooks/useOfflineOrders';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { ChevronLeft, RefreshCw, Trash2, Package, Clock, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function OfflineDrafts() {
  const { t } = useTranslation();
  const [, navigate] = useLocation();
  const { drafts, deleteDraft, syncDraft } = useOfflineOrders();
  const isOnline = useOnlineStatus();
  const [syncing, setSyncing] = useState<number | null>(null);

  const handleSync = async (draft: any) => {
    if (!isOnline) {
      toast.error('网络未连接，无法同步订单');
      return;
    }

    setSyncing(draft.id);
    try {
      await syncDraft(draft);
      toast.success('订单同步成功');
    } catch (error) {
      toast.error('订单同步失败，请稍后重试');
    } finally {
      setSyncing(null);
    }
  };

  const handleDelete = async (draftId: number) => {
    if (confirm('确定要删除这个订单草稿吗？')) {
      await deleteDraft(draftId);
      toast.success('草稿已删除');
    }
  };

  const getSyncStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
          <Clock className="w-3 h-3 mr-1" />
          待同步
        </Badge>;
      case 'syncing':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
          <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
          同步中
        </Badge>;
      case 'failed':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
          <AlertCircle className="w-3 h-3 mr-1" />
          同步失败
        </Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white pb-20">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/orders')}
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-lg font-semibold">离线订单草稿</h1>
            <p className="text-sm text-muted-foreground">
              {drafts.length} 个待同步订单
            </p>
          </div>
        </div>
      </div>

      {/* Network Status */}
      {!isOnline && (
        <div className="container mx-auto px-4 py-3">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
            <p className="text-sm text-yellow-800">
              当前网络未连接，订单将在网络恢复后自动同步
            </p>
          </div>
        </div>
      )}

      {/* Drafts List */}
      <div className="container mx-auto px-4 py-6 space-y-4">
        {drafts.length === 0 ? (
          <div className="text-center py-16">
            <Package className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">暂无离线订单草稿</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => navigate('/menu')}
            >
              去下单
            </Button>
          </div>
        ) : (
          drafts.map((draft) => (
            <Card key={draft.id} className="p-4">
              {/* Draft Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="secondary">
                      {draft.type === 'tea' ? '茶饮订单' : '商城订单'}
                    </Badge>
                    {getSyncStatusBadge(draft.status)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    创建时间：{new Date(draft.timestamp).toLocaleString('zh-CN')}
                  </p>
                </div>
              </div>

              {/* Draft Items */}
              <div className="space-y-2 mb-3">
                {draft.items.map((item, index) => (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <div className="flex-1">
                      <p className="font-medium">{item.productName}</p>
                      {item.options && (
                        <p className="text-xs text-muted-foreground">
                          {Array.isArray(item.options) 
                            ? item.options.map((opt: any) => opt.name).join(', ')
                            : ''}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-muted-foreground">x{item.quantity}</p>
                      <p className="font-medium">¥{item.price}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Draft Total */}
              <div className="flex items-center justify-between pt-3 border-t">
                <p className="font-semibold">总计</p>
                <p className="text-lg font-bold text-orange-600">
                  ¥{draft.totalAmount}
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-2 mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => handleDelete(draft.id!)}
                  disabled={syncing === draft.id}
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  删除
                </Button>
                <Button
                  size="sm"
                  className="flex-1"
                  onClick={() => handleSync(draft)}
                  disabled={!isOnline || syncing === draft.id || draft.status === 'syncing'}
                >
                  {syncing === draft.id ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-1 animate-spin" />
                      同步中...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4 mr-1" />
                      {draft.status === 'failed' ? '重试' : '立即同步'}
                    </>
                  )}
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
