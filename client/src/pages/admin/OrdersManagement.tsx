import { useState } from "react";
import { useTranslation } from "react-i18next";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  Search,
  RefreshCw,
  Eye,
  Clock,
  CheckCircle,
  XCircle,
  Package,
  Truck,
} from "lucide-react";

type OrderStatus = 'pending' | 'paid' | 'preparing' | 'ready' | 'delivering' | 'completed' | 'cancelled' | 'refunding' | 'refunded';

export default function OrdersManagement() {
  const { t, i18n } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "all">("all");
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<OrderStatus>("pending");

  const utils = trpc.useUtils();

  const { data: orders, isLoading, refetch } = trpc.adminOrders.list.useQuery({
    status: statusFilter === "all" ? undefined : statusFilter,
    search: searchQuery || undefined,
    limit: 50,
  });

  const updateStatusMutation = trpc.adminOrders.updateStatus.useMutation({
    onSuccess: () => {
      toast.success(t("admin.common.success"));
      utils.adminOrders.list.invalidate();
      setIsStatusDialogOpen(false);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: string; icon: React.ReactNode }> = {
      pending: { color: "bg-yellow-100 text-yellow-800", icon: <Clock className="h-3 w-3" /> },
      paid: { color: "bg-blue-100 text-blue-800", icon: <CheckCircle className="h-3 w-3" /> },
      preparing: { color: "bg-orange-100 text-orange-800", icon: <Package className="h-3 w-3" /> },
      ready: { color: "bg-green-100 text-green-800", icon: <CheckCircle className="h-3 w-3" /> },
      delivering: { color: "bg-purple-100 text-purple-800", icon: <Truck className="h-3 w-3" /> },
      completed: { color: "bg-green-100 text-green-800", icon: <CheckCircle className="h-3 w-3" /> },
      cancelled: { color: "bg-red-100 text-red-800", icon: <XCircle className="h-3 w-3" /> },
      refunding: { color: "bg-orange-100 text-orange-800", icon: <Clock className="h-3 w-3" /> },
      refunded: { color: "bg-gray-100 text-gray-800", icon: <XCircle className="h-3 w-3" /> },
    };

    const config = statusConfig[status] || statusConfig.pending;

    return (
      <Badge variant="outline" className={`${config.color} flex items-center gap-1`}>
        {config.icon}
        {t(`order.status.${status}`)}
      </Badge>
    );
  };

  const handleViewDetail = (order: any) => {
    setSelectedOrder(order);
    setIsDetailOpen(true);
  };

  const handleUpdateStatus = (order: any) => {
    setSelectedOrder(order);
    setNewStatus(order.status);
    setIsStatusDialogOpen(true);
  };

  const confirmUpdateStatus = () => {
    if (!selectedOrder) return;
    updateStatusMutation.mutate({
      orderId: selectedOrder.id,
      status: newStatus,
    });
  };

  const statusOptions: OrderStatus[] = [
    'pending', 'paid', 'preparing', 'ready', 'delivering', 'completed', 'cancelled', 'refunding', 'refunded'
  ];

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t("admin.orders.title")}</h1>
          <p className="text-muted-foreground">{t("admin.orders.subtitle", "Управление всеми заказами")}</p>
        </div>
        <Button variant="outline" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          {t("admin.common.refresh")}
        </Button>
      </div>

      {/* 筛选栏 */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t("admin.orders.searchPlaceholder", "Поиск по номеру заказа...")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select
              value={statusFilter}
              onValueChange={(value) => setStatusFilter(value as OrderStatus | "all")}
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="订单状态" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("admin.common.all")}</SelectItem>
                {statusOptions.map((status) => (
                  <SelectItem key={status} value={status}>
                    {t(`order.status.${status}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* 订单列表 */}
      <Card>
        <CardHeader>
          <CardTitle>{t("admin.orders.orderList", "Список заказов")}</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-12 w-32" />
                  <Skeleton className="h-12 w-24" />
                  <Skeleton className="h-12 w-20" />
                  <Skeleton className="h-12 flex-1" />
                </div>
              ))}
            </div>
          ) : orders && orders.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("admin.orders.orderNo")}</TableHead>
                  <TableHead>{t("admin.orders.customer")}</TableHead>
                  <TableHead>{t("admin.orders.amount")}</TableHead>
                  <TableHead>{t("admin.orders.statusLabel", "Статус")}</TableHead>
                  <TableHead>{t("admin.orders.time")}</TableHead>
                  <TableHead className="text-right">{t("admin.common.actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order: any) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-mono text-sm">{order.orderNo}</TableCell>
                    <TableCell>{order.userName || t("admin.orders.unknownUser", "Неизвестный")}</TableCell>
                    <TableCell className="font-medium">₽{order.totalAmount}</TableCell>
                    <TableCell>{getStatusBadge(order.status)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(order.createdAt).toLocaleString(i18n.language === 'zh' ? 'zh-CN' : 'ru-RU')}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewDetail(order)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUpdateStatus(order)}
                        >
                          {t("admin.orders.updateStatus")}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              {t("admin.common.noData")}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 订单详情对话框 */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t("admin.orders.viewDetail")}</DialogTitle>
            <DialogDescription>{t("admin.orders.orderNo")}: {selectedOrder?.orderNo}</DialogDescription>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">{t("admin.orders.customer")}</p>
                  <p className="font-medium">{selectedOrder.userName || t("admin.orders.unknownUser", "Неизвестный")}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t("admin.orders.orderType", "Тип заказа")}</p>
                  <p className="font-medium">
                    {selectedOrder.orderType === 'tea' ? t("admin.orders.teaOrder", "Чай") : t("admin.orders.mallOrder", "Магазин")}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t("admin.orders.deliveryType", "Способ доставки")}</p>
                  <p className="font-medium">
                    {selectedOrder.deliveryType === 'delivery' ? t("order.delivery", "Доставка") : t("order.pickup", "Самовывоз")}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t("admin.orders.status.label", "Статус")}</p>
                  {getStatusBadge(selectedOrder.status)}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t("admin.orders.amount")}</p>
                  <p className="font-medium text-lg">₽{selectedOrder.totalAmount}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t("admin.orders.time")}</p>
                  <p className="font-medium">
                    {new Date(selectedOrder.createdAt).toLocaleString('zh-CN')}
                  </p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDetailOpen(false)}>
              {t("admin.common.cancel")}
            </Button>
            <Button onClick={() => {
              setIsDetailOpen(false);
              handleUpdateStatus(selectedOrder);
            }}>
              {t("admin.orders.updateStatus")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 更新状态对话框 */}
      <Dialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("admin.orders.updateStatus")}</DialogTitle>
            <DialogDescription>
              {t("admin.orders.orderNo")}: {selectedOrder?.orderNo}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Select value={newStatus} onValueChange={(v) => setNewStatus(v as OrderStatus)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((status) => (
                  <SelectItem key={status} value={status}>
                    {t(`order.status.${status}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsStatusDialogOpen(false)}>
              {t("admin.common.cancel")}
            </Button>
            <Button
              onClick={confirmUpdateStatus}
              disabled={updateStatusMutation.isPending}
            >
              {updateStatusMutation.isPending ? t("admin.common.loading") : t("admin.common.confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
