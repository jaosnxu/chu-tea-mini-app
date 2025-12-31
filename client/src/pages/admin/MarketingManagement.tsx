import { useState } from "react";
import { useTranslation } from "react-i18next";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  Plus,
  Edit,
  Trash2,
  Megaphone,
  Gift,
  UserPlus,
  Cake,
  ShoppingCart,
  Clock,
} from "lucide-react";

export default function MarketingManagement() {
  const { t } = useTranslation();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<any>(null);

  const utils = trpc.useUtils();

  const { data: rules, isLoading } = trpc.adminMarketing.listRules.useQuery();

  const createMutation = trpc.adminMarketing.createRule.useMutation({
    onSuccess: () => {
      toast.success(t("admin.common.success"));
      utils.adminMarketing.listRules.invalidate();
      setIsAddDialogOpen(false);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const updateMutation = trpc.adminMarketing.updateRule.useMutation({
    onSuccess: () => {
      toast.success(t("admin.common.success"));
      utils.adminMarketing.listRules.invalidate();
      setEditingRule(null);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const deleteMutation = trpc.adminMarketing.deleteRule.useMutation({
    onSuccess: () => {
      toast.success(t("admin.common.success"));
      utils.adminMarketing.listRules.invalidate();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const getTriggerIcon = (type: string) => {
    switch (type) {
      case "register":
        return <UserPlus className="h-4 w-4" />;
      case "birthday":
        return <Cake className="h-4 w-4" />;
      case "first_order":
        return <ShoppingCart className="h-4 w-4" />;
      case "inactive":
        return <Clock className="h-4 w-4" />;
      default:
        return <Megaphone className="h-4 w-4" />;
    }
  };

  const getTriggerLabel = (type: string) => {
    const labels: Record<string, string> = {
      register: t("admin.marketing.newUser"),
      birthday: t("admin.marketing.birthday"),
      first_order: t("admin.marketing.firstOrder"),
      inactive: t("admin.marketing.inactiveUser"),
      order_count: t("admin.marketing.orderCount", "Кол-во заказов"),
      total_spent: t("admin.marketing.totalSpent", "Сумма покупок"),
    };
    return labels[type] || type;
  };

  const getActionLabel = (type: string) => {
    const labels: Record<string, string> = {
      send_coupon: t("admin.marketing.sendCoupon"),
      add_points: t("admin.marketing.sendPoints"),
      upgrade_level: t("admin.marketing.upgradeLevel", "Повысить уровень"),
      send_notification: t("admin.marketing.sendNotification"),
    };
    return labels[type] || type;
  };

  const handleToggleActive = async (rule: any) => {
    updateMutation.mutate({
      id: rule.id,
      isActive: !rule.isActive,
    });
  };

  const handleDelete = (id: number) => {
    if (confirm(t("admin.common.confirmDelete"))) {
      deleteMutation.mutate({ id });
    }
  };

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t("admin.marketing.title")}</h1>
          <p className="text-muted-foreground">{t("admin.marketing.subtitle", "Настройка автоматических правил маркетинга")}</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              {t("admin.marketing.addRule")}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{t("admin.marketing.addRule")}</DialogTitle>
              <DialogDescription>{t("admin.marketing.addRuleDesc", "Создать новое правило автоматизации")}</DialogDescription>
            </DialogHeader>
            <RuleForm
              onSubmit={(data) => createMutation.mutate(data)}
              isLoading={createMutation.isPending}
              onCancel={() => setIsAddDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* 规则列表 */}
      <Card>
        <CardHeader>
          <CardTitle>{t("admin.marketing.rules")}</CardTitle>
          <CardDescription>{t("admin.marketing.rulesDesc", "Управление правилами автоматизации")}</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-12 w-12 rounded-lg" />
                  <Skeleton className="h-12 flex-1" />
                  <Skeleton className="h-12 w-24" />
                </div>
              ))}
            </div>
          ) : rules && rules.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("admin.marketing.ruleName", "Название")}</TableHead>
                  <TableHead>{t("admin.marketing.trigger")}</TableHead>
                  <TableHead>{t("admin.marketing.action")}</TableHead>
                  <TableHead>{t("admin.common.status", "Статус")}</TableHead>
                  <TableHead className="text-right">{t("admin.common.actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rules.map((rule: any) => (
                  <TableRow key={rule.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{rule.nameZh}</p>
                        <p className="text-xs text-muted-foreground">{rule.nameRu}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getTriggerIcon(rule.triggerType)}
                        <span>{getTriggerLabel(rule.triggerType)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        <Gift className="h-3 w-3 mr-1" />
                        {getActionLabel(rule.actionType)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={rule.isActive}
                        onCheckedChange={() => handleToggleActive(rule)}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setEditingRule(rule)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive"
                          onClick={() => handleDelete(rule.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Megaphone className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>{t("admin.common.noData")}</p>
              <p className="text-sm">{t("admin.marketing.addRuleHint", "Нажмите кнопку выше для добавления")}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 编辑对话框 */}
      <Dialog open={!!editingRule} onOpenChange={() => setEditingRule(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t("admin.marketing.editRule", "Редактировать правило")}</DialogTitle>
            <DialogDescription>{t("admin.marketing.editRuleDesc", "Изменить правило автоматизации")}</DialogDescription>
          </DialogHeader>
          {editingRule && (
            <RuleForm
              initialData={editingRule}
              onSubmit={(data) => updateMutation.mutate({ id: editingRule.id, ...data })}
              isLoading={updateMutation.isPending}
              onCancel={() => setEditingRule(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface RuleFormProps {
  initialData?: any;
  onSubmit: (data: any) => void;
  isLoading: boolean;
  onCancel: () => void;
}

function RuleForm({ initialData, onSubmit, isLoading, onCancel }: RuleFormProps) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    nameZh: initialData?.nameZh || "",
    nameRu: initialData?.nameRu || "",
    nameEn: initialData?.nameEn || "",
    triggerType: initialData?.triggerType || "register",
    triggerCondition: initialData?.triggerCondition || "",
    actionType: initialData?.actionType || "send_coupon",
    actionParams: initialData?.actionParams || "",
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
          <Label>规则名称（中文）</Label>
          <Input
            value={formData.nameZh}
            onChange={(e) => setFormData({ ...formData, nameZh: e.target.value })}
            placeholder="新用户注册送券"
            required
          />
        </div>
        <div className="space-y-2">
          <Label>规则名称（俄文）</Label>
          <Input
            value={formData.nameRu}
            onChange={(e) => setFormData({ ...formData, nameRu: e.target.value })}
            placeholder="Купон для новых пользователей"
            required
          />
        </div>
        <div className="space-y-2">
          <Label>规则名称（英文）</Label>
          <Input
            value={formData.nameEn}
            onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
            placeholder="New User Coupon"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>{t("admin.marketing.trigger")}</Label>
          <Select
            value={formData.triggerType}
            onValueChange={(v) => setFormData({ ...formData, triggerType: v })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="register">{t("admin.marketing.newUser")}</SelectItem>
              <SelectItem value="birthday">{t("admin.marketing.birthday")}</SelectItem>
              <SelectItem value="first_order">{t("admin.marketing.firstOrder")}</SelectItem>
              <SelectItem value="inactive">{t("admin.marketing.inactiveUser")}</SelectItem>
              <SelectItem value="order_count">订单数量达标</SelectItem>
              <SelectItem value="total_spent">消费金额达标</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>{t("admin.marketing.action")}</Label>
          <Select
            value={formData.actionType}
            onValueChange={(v) => setFormData({ ...formData, actionType: v })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="send_coupon">{t("admin.marketing.sendCoupon")}</SelectItem>
              <SelectItem value="add_points">{t("admin.marketing.sendPoints")}</SelectItem>
              <SelectItem value="upgrade_level">升级会员等级</SelectItem>
              <SelectItem value="send_notification">{t("admin.marketing.sendNotification")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label>触发条件（JSON格式）</Label>
        <Input
          value={formData.triggerCondition}
          onChange={(e) => setFormData({ ...formData, triggerCondition: e.target.value })}
          placeholder='{"days": 30}'
        />
      </div>

      <div className="space-y-2">
        <Label>执行参数（JSON格式）</Label>
        <Input
          value={formData.actionParams}
          onChange={(e) => setFormData({ ...formData, actionParams: e.target.value })}
          placeholder='{"couponTemplateId": 1}'
          required
        />
      </div>

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
