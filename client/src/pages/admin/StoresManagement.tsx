import { useState } from "react";
import { useTranslation } from "react-i18next";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Plus, Edit, Store, MapPin, Phone, Clock } from "lucide-react";

export default function StoresManagement() {
  const { t, i18n } = useTranslation();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingStore, setEditingStore] = useState<any>(null);

  const utils = trpc.useUtils();

  const { data: stores, isLoading } = trpc.adminStores.list.useQuery();

  const createMutation = trpc.adminStores.create.useMutation({
    onSuccess: () => {
      toast.success(t("admin.common.success"));
      utils.adminStores.list.invalidate();
      setIsAddDialogOpen(false);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const updateMutation = trpc.adminStores.update.useMutation({
    onSuccess: () => {
      toast.success(t("admin.common.success"));
      utils.adminStores.list.invalidate();
      setEditingStore(null);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const getStoreName = (store: any) => {
    if (i18n.language === 'zh') return store.nameZh;
    if (i18n.language === 'ru') return store.nameRu;
    return store.nameEn;
  };

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t("admin.stores.title")}</h1>
          <p className="text-muted-foreground">{t("admin.stores.subtitle", "Управление магазинами")}</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              {t("admin.stores.addStore")}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{t("admin.stores.addStore")}</DialogTitle>
              <DialogDescription>{t("admin.stores.addStoreDesc", "Добавить новый магазин")}</DialogDescription>
            </DialogHeader>
            <StoreForm
              onSubmit={(data) => createMutation.mutate(data)}
              isLoading={createMutation.isPending}
              onCancel={() => setIsAddDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* 门店列表 */}
      <Card>
        <CardHeader>
          <CardTitle>{t("admin.stores.storeList", "Список магазинов")}</CardTitle>
          <CardDescription>{t("admin.stores.totalStores", { count: stores?.length || 0, defaultValue: `Всего ${stores?.length || 0} магазинов` })}</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-16 w-16 rounded-lg" />
                  <Skeleton className="h-16 flex-1" />
                </div>
              ))}
            </div>
          ) : stores && stores.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("admin.stores.storeName")}</TableHead>
                  <TableHead>{t("admin.stores.address")}</TableHead>
                  <TableHead>{t("admin.stores.businessHours")}</TableHead>
                  <TableHead>{t("admin.stores.status")}</TableHead>
                  <TableHead className="text-right">{t("admin.common.actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stores.map((store: any) => (
                  <TableRow key={store.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <Store className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{getStoreName(store)}</p>
                          <p className="text-xs text-muted-foreground">{store.city}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span className="max-w-[200px] truncate">
                          {i18n.language === 'zh' ? store.addressZh : store.addressRu || store.address}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span>{store.openTime} - {store.closeTime}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={store.isOpen ? "default" : "secondary"}>
                        {store.isOpen ? t("admin.stores.open") : t("admin.stores.closed")}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setEditingStore(store)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Store className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>{t("admin.common.noData")}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 编辑对话框 */}
      <Dialog open={!!editingStore} onOpenChange={() => setEditingStore(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t("admin.stores.editStore")}</DialogTitle>
            <DialogDescription>{t("admin.stores.editStoreDesc", "Редактировать информацию")}</DialogDescription>
          </DialogHeader>
          {editingStore && (
            <StoreForm
              initialData={editingStore}
              onSubmit={(data) => updateMutation.mutate({ id: editingStore.id, ...data })}
              isLoading={updateMutation.isPending}
              onCancel={() => setEditingStore(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface StoreFormProps {
  initialData?: any;
  onSubmit: (data: any) => void;
  isLoading: boolean;
  onCancel: () => void;
}

function StoreForm({ initialData, onSubmit, isLoading, onCancel }: StoreFormProps) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    nameZh: initialData?.nameZh || "",
    nameRu: initialData?.nameRu || "",
    nameEn: initialData?.nameEn || "",
    address: initialData?.address || "",
    city: initialData?.city || "",
    phone: initialData?.phone || "",
    openTime: initialData?.openTime || "09:00",
    closeTime: initialData?.closeTime || "22:00",
    deliveryFee: initialData?.deliveryFee || "0",
    minOrderAmount: initialData?.minOrderAmount || "0",
    iikoTerminalId: initialData?.iikoTerminalId || "",
    isActive: initialData?.isActive ?? true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>门店名称（中文）</Label>
          <Input
            value={formData.nameZh}
            onChange={(e) => setFormData({ ...formData, nameZh: e.target.value })}
            placeholder="莫斯科红场店"
            required
          />
        </div>
        <div className="space-y-2">
          <Label>门店名称（俄文）</Label>
          <Input
            value={formData.nameRu}
            onChange={(e) => setFormData({ ...formData, nameRu: e.target.value })}
            placeholder="Красная площадь"
            required
          />
        </div>
        <div className="space-y-2">
          <Label>门店名称（英文）</Label>
          <Input
            value={formData.nameEn}
            onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
            placeholder="Red Square Store"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>城市</Label>
          <Input
            value={formData.city}
            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            placeholder="Москва"
            required
          />
        </div>
        <div className="space-y-2">
          <Label>{t("admin.stores.phone")}</Label>
          <Input
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder="+7 495 123-4567"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>{t("admin.stores.address")}</Label>
        <Input
          value={formData.address}
          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          placeholder="详细地址"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>营业开始时间</Label>
          <Input
            type="time"
            value={formData.openTime}
            onChange={(e) => setFormData({ ...formData, openTime: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label>营业结束时间</Label>
          <Input
            type="time"
            value={formData.closeTime}
            onChange={(e) => setFormData({ ...formData, closeTime: e.target.value })}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>配送费（₽）</Label>
          <Input
            value={formData.deliveryFee}
            onChange={(e) => setFormData({ ...formData, deliveryFee: e.target.value })}
            placeholder="0"
          />
        </div>
        <div className="space-y-2">
          <Label>最低订单金额（₽）</Label>
          <Input
            value={formData.minOrderAmount}
            onChange={(e) => setFormData({ ...formData, minOrderAmount: e.target.value })}
            placeholder="0"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>IIKO 终端ID</Label>
        <Input
          value={formData.iikoTerminalId}
          onChange={(e) => setFormData({ ...formData, iikoTerminalId: e.target.value })}
          placeholder="IIKO系统终端标识"
        />
      </div>

      {initialData && (
        <div className="flex items-center gap-2">
          <Switch
            checked={formData.isActive}
            onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
          />
          <Label>门店启用</Label>
        </div>
      )}

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          {t("admin.common.cancel")}
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? t("admin.common.loading") : t("admin.common.save")}
        </Button>
      </DialogFooter>
    </form>
  );
}
