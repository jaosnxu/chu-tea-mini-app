import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Ticket, Plus, Edit, Trash2, Send } from 'lucide-react';
import { toast } from 'sonner';

type CouponType = 'fixed' | 'percent' | 'product' | 'gift' | 'buy_one_get_one' | 'free_product';

interface CouponTemplate {
  id: number;
  code: string;
  nameZh: string;
  nameRu: string;
  nameEn: string;
  descriptionZh?: string | null;
  descriptionRu?: string | null;
  descriptionEn?: string | null;
  type: CouponType;
  value: string;
  minOrderAmount?: string | null;
  maxDiscount?: string | null;
  applicableProducts?: number[] | null;
  applicableCategories?: number[] | null;
  applicableStores?: number[] | null;
  excludeProducts?: number[] | null;
  stackable: boolean;
  totalQuantity?: number | null;
  usedQuantity: number;
  perUserLimit?: number | null;
  validDays?: number | null;
  startAt?: Date | null;
  endAt?: Date | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface CouponFormData {
  code: string;
  nameZh: string;
  nameRu: string;
  nameEn: string;
  descriptionZh: string;
  descriptionRu: string;
  descriptionEn: string;
  type: CouponType;
  value: string;
  minOrderAmount: string;
  maxDiscount: string;
  stackable: boolean;
  totalQuantity: string;
  perUserLimit: string;
  validDays: string;
  isActive: boolean;
}

export default function AdminCouponManagement() {
  const { t } = useTranslation();
  // toast 已从 sonner 导入
  const utils = trpc.useUtils();

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showBatchSendDialog, setShowBatchSendDialog] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<CouponTemplate | null>(null);

  const [formData, setFormData] = useState<CouponFormData>({
    code: '',
    nameZh: '',
    nameRu: '',
    nameEn: '',
    descriptionZh: '',
    descriptionRu: '',
    descriptionEn: '',
    type: 'fixed',
    value: '',
    minOrderAmount: '0',
    maxDiscount: '',
    stackable: false,
    totalQuantity: '-1',
    perUserLimit: '1',
    validDays: '30',
    isActive: true,
  });

  const [batchSendData, setBatchSendData] = useState({
    templateId: 0,
    targetType: 'all' as 'all' | 'new' | 'vip' | 'inactive' | 'specific',
    reason: '',
  });

  // 查询优惠券模板列表
  const { data: templates, isLoading } = trpc.adminCoupon.listTemplates.useQuery();

  // 创建优惠券模板
  const createMutation = trpc.adminCoupon.createTemplate.useMutation({
    onSuccess: () => {
      toast.success(t('admin.coupon.createSuccess'));
      setShowCreateDialog(false);
      resetForm();
      utils.adminCoupon.listTemplates.invalidate();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  // 更新优惠券模板
  const updateMutation = trpc.adminCoupon.updateTemplate.useMutation({
    onSuccess: () => {
      toast.success(t('admin.coupon.updateSuccess'));
      setShowEditDialog(false);
      setSelectedTemplate(null);
      resetForm();
      utils.adminCoupon.listTemplates.invalidate();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  // 删除优惠券模板
  const deleteMutation = trpc.adminCoupon.deleteTemplate.useMutation({
    onSuccess: () => {
      toast.success(t('admin.coupon.deleteSuccess'));
      utils.adminCoupon.listTemplates.invalidate();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  // 批量发放优惠券
  const batchSendMutation = trpc.adminCoupon.batchSend.useMutation({
    onSuccess: (data) => {
      toast.success(t('admin.coupon.batchSendSuccess', { count: data.sentCount }));
      setShowBatchSendDialog(false);
      utils.adminCoupon.listTemplates.invalidate();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const resetForm = () => {
    setFormData({
      code: '',
      nameZh: '',
      nameRu: '',
      nameEn: '',
      descriptionZh: '',
      descriptionRu: '',
      descriptionEn: '',
      type: 'fixed',
      value: '',
      minOrderAmount: '0',
      maxDiscount: '',
      stackable: false,
      totalQuantity: '-1',
      perUserLimit: '1',
      validDays: '30',
      isActive: true,
    });
  };

  const handleCreate = () => {
    createMutation.mutate({
      ...formData,
      totalQuantity: parseInt(formData.totalQuantity),
      perUserLimit: parseInt(formData.perUserLimit),
      validDays: parseInt(formData.validDays),
    });
  };

  const handleUpdate = () => {
    if (!selectedTemplate) return;
    updateMutation.mutate({
      id: selectedTemplate.id,
      ...formData,
      totalQuantity: parseInt(formData.totalQuantity),
      perUserLimit: parseInt(formData.perUserLimit),
      validDays: parseInt(formData.validDays),
    });
  };

  const handleDelete = (id: number) => {
    if (confirm(t('admin.coupon.deleteConfirm'))) {
      deleteMutation.mutate({ id });
    }
  };

  const handleEdit = (template: CouponTemplate) => {
    setSelectedTemplate(template);
    setFormData({
      code: template.code,
      nameZh: template.nameZh,
      nameRu: template.nameRu,
      nameEn: template.nameEn,
      descriptionZh: template.descriptionZh || '',
      descriptionRu: template.descriptionRu || '',
      descriptionEn: template.descriptionEn || '',
      type: template.type,
      value: template.value,
      minOrderAmount: template.minOrderAmount || '0',
      maxDiscount: template.maxDiscount || '',
      stackable: template.stackable,
      totalQuantity: template.totalQuantity?.toString() || '-1',
      perUserLimit: template.perUserLimit?.toString() || '1',
      validDays: template.validDays?.toString() || '30',
      isActive: template.isActive,
    });
    setShowEditDialog(true);
  };

  const handleBatchSend = (templateId: number) => {
    setBatchSendData({ ...batchSendData, templateId });
    setShowBatchSendDialog(true);
  };

  const handleBatchSendSubmit = () => {
    batchSendMutation.mutate(batchSendData);
  };

  const getCouponTypeLabel = (type: CouponType) => {
    const labels = {
      fixed: t('admin.coupon.type.fixed'),
      percent: t('admin.coupon.type.percent'),
      product: t('admin.coupon.type.product'),
      gift: t('admin.coupon.type.gift'),
      buy_one_get_one: t('admin.coupon.type.buyOneGetOne'),
      free_product: t('admin.coupon.type.freeProduct'),
    };
    return labels[type] || type;
  };

  const getCouponValueDisplay = (template: CouponTemplate) => {
    switch (template.type) {
      case 'fixed':
        return `¥${template.value}`;
      case 'percent':
        return `${template.value}%`;
      case 'buy_one_get_one':
        return t('admin.coupon.buyOneGetOne');
      case 'free_product':
        return t('admin.coupon.freeProduct');
      default:
        return template.value;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-muted-foreground">{t('common.loading')}</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Ticket className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold">{t('admin.coupon.title')}</h1>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          {t('admin.coupon.create')}
        </Button>
      </div>

      <div className="grid gap-4">
        {templates?.map((template) => (
          <Card key={template.id} className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-xl font-bold">{template.nameZh}</h3>
                  <span className={`px-2 py-1 rounded text-xs ${
                    template.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                  }`}>
                    {template.isActive ? t('common.active') : t('common.inactive')}
                  </span>
                  <span className="px-2 py-1 rounded text-xs bg-blue-100 text-blue-700">
                    {getCouponTypeLabel(template.type)}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mb-3">{template.descriptionZh}</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">{t('admin.coupon.code')}:</span>
                    <span className="ml-2 font-mono">{template.code}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">{t('admin.coupon.value')}:</span>
                    <span className="ml-2 font-bold text-primary">{getCouponValueDisplay(template)}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">{t('admin.coupon.minOrder')}:</span>
                    <span className="ml-2">¥{template.minOrderAmount || '0'}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">{t('admin.coupon.usage')}:</span>
                    <span className="ml-2">
                      {template.usedQuantity} / {template.totalQuantity === -1 ? '∞' : template.totalQuantity}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2 ml-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBatchSend(template.id)}
                >
                  <Send className="w-4 h-4 mr-1" />
                  {t('admin.coupon.batchSend')}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(template)}
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(template.id)}
                  disabled={deleteMutation.isPending}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}

        {templates?.length === 0 && (
          <Card className="p-12 text-center">
            <Ticket className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground mb-4">{t('admin.coupon.empty')}</p>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              {t('admin.coupon.createFirst')}
            </Button>
          </Card>
        )}
      </div>

      {/* 创建优惠券对话框 */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('admin.coupon.create')}</DialogTitle>
            <DialogDescription>{t('admin.coupon.createDescription')}</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="code">{t('admin.coupon.code')}</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder="SUMMER2024"
                />
              </div>
              <div>
                <Label htmlFor="type">{t('admin.coupon.type.label')}</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value: CouponType) => setFormData({ ...formData, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fixed">{t('admin.coupon.type.fixed')}</SelectItem>
                    <SelectItem value="percent">{t('admin.coupon.type.percent')}</SelectItem>
                    <SelectItem value="buy_one_get_one">{t('admin.coupon.type.buyOneGetOne')}</SelectItem>
                    <SelectItem value="free_product">{t('admin.coupon.type.freeProduct')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="nameZh">{t('admin.coupon.nameZh')}</Label>
              <Input
                id="nameZh"
                value={formData.nameZh}
                onChange={(e) => setFormData({ ...formData, nameZh: e.target.value })}
                placeholder="夏季满减券"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="nameRu">{t('admin.coupon.nameRu')}</Label>
                <Input
                  id="nameRu"
                  value={formData.nameRu}
                  onChange={(e) => setFormData({ ...formData, nameRu: e.target.value })}
                  placeholder="Летняя скидка"
                />
              </div>
              <div>
                <Label htmlFor="nameEn">{t('admin.coupon.nameEn')}</Label>
                <Input
                  id="nameEn"
                  value={formData.nameEn}
                  onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
                  placeholder="Summer Discount"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="descriptionZh">{t('admin.coupon.descriptionZh')}</Label>
              <Textarea
                id="descriptionZh"
                value={formData.descriptionZh}
                onChange={(e) => setFormData({ ...formData, descriptionZh: e.target.value })}
                placeholder="满100元减20元"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="value">{t('admin.coupon.value')}</Label>
                <Input
                  id="value"
                  type="number"
                  value={formData.value}
                  onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                  placeholder="20"
                />
              </div>
              <div>
                <Label htmlFor="minOrderAmount">{t('admin.coupon.minOrder')}</Label>
                <Input
                  id="minOrderAmount"
                  type="number"
                  value={formData.minOrderAmount}
                  onChange={(e) => setFormData({ ...formData, minOrderAmount: e.target.value })}
                  placeholder="0"
                />
              </div>
              <div>
                <Label htmlFor="maxDiscount">{t('admin.coupon.maxDiscount')}</Label>
                <Input
                  id="maxDiscount"
                  type="number"
                  value={formData.maxDiscount}
                  onChange={(e) => setFormData({ ...formData, maxDiscount: e.target.value })}
                  placeholder="100"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="totalQuantity">{t('admin.coupon.totalQuantity')}</Label>
                <Input
                  id="totalQuantity"
                  type="number"
                  value={formData.totalQuantity}
                  onChange={(e) => setFormData({ ...formData, totalQuantity: e.target.value })}
                  placeholder="-1 (无限制)"
                />
              </div>
              <div>
                <Label htmlFor="perUserLimit">{t('admin.coupon.perUserLimit')}</Label>
                <Input
                  id="perUserLimit"
                  type="number"
                  value={formData.perUserLimit}
                  onChange={(e) => setFormData({ ...formData, perUserLimit: e.target.value })}
                  placeholder="1"
                />
              </div>
              <div>
                <Label htmlFor="validDays">{t('admin.coupon.validDays')}</Label>
                <Input
                  id="validDays"
                  type="number"
                  value={formData.validDays}
                  onChange={(e) => setFormData({ ...formData, validDays: e.target.value })}
                  placeholder="30"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="stackable"
                checked={formData.stackable}
                onCheckedChange={(checked) => setFormData({ ...formData, stackable: checked })}
              />
              <Label htmlFor="stackable">{t('admin.coupon.stackable')}</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
              />
              <Label htmlFor="isActive">{t('admin.coupon.isActive')}</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleCreate} disabled={createMutation.isPending}>
              {createMutation.isPending ? t('common.creating') : t('common.create')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 编辑优惠券对话框 */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('admin.coupon.edit')}</DialogTitle>
            <DialogDescription>{t('admin.coupon.editDescription')}</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* 与创建表单相同的字段 */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-code">{t('admin.coupon.code')}</Label>
                <Input
                  id="edit-code"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-type">{t('admin.coupon.type.label')}</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value: CouponType) => setFormData({ ...formData, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fixed">{t('admin.coupon.type.fixed')}</SelectItem>
                    <SelectItem value="percent">{t('admin.coupon.type.percent')}</SelectItem>
                    <SelectItem value="buy_one_get_one">{t('admin.coupon.type.buyOneGetOne')}</SelectItem>
                    <SelectItem value="free_product">{t('admin.coupon.type.freeProduct')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="edit-nameZh">{t('admin.coupon.nameZh')}</Label>
              <Input
                id="edit-nameZh"
                value={formData.nameZh}
                onChange={(e) => setFormData({ ...formData, nameZh: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="edit-value">{t('admin.coupon.value')}</Label>
                <Input
                  id="edit-value"
                  type="number"
                  value={formData.value}
                  onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-minOrderAmount">{t('admin.coupon.minOrder')}</Label>
                <Input
                  id="edit-minOrderAmount"
                  type="number"
                  value={formData.minOrderAmount}
                  onChange={(e) => setFormData({ ...formData, minOrderAmount: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-validDays">{t('admin.coupon.validDays')}</Label>
                <Input
                  id="edit-validDays"
                  type="number"
                  value={formData.validDays}
                  onChange={(e) => setFormData({ ...formData, validDays: e.target.value })}
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="edit-isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
              />
              <Label htmlFor="edit-isActive">{t('admin.coupon.isActive')}</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleUpdate} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? t('common.updating') : t('common.update')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 批量发放对话框 */}
      <Dialog open={showBatchSendDialog} onOpenChange={setShowBatchSendDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('admin.coupon.batchSend')}</DialogTitle>
            <DialogDescription>{t('admin.coupon.batchSendDescription')}</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div>
              <Label htmlFor="targetType">{t('admin.coupon.targetType')}</Label>
              <Select
                value={batchSendData.targetType}
                onValueChange={(value: any) => setBatchSendData({ ...batchSendData, targetType: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('admin.coupon.target.all')}</SelectItem>
                  <SelectItem value="new">{t('admin.coupon.target.new')}</SelectItem>
                  <SelectItem value="vip">{t('admin.coupon.target.vip')}</SelectItem>
                  <SelectItem value="inactive">{t('admin.coupon.target.inactive')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="reason">{t('admin.coupon.reason')}</Label>
              <Textarea
                id="reason"
                value={batchSendData.reason}
                onChange={(e) => setBatchSendData({ ...batchSendData, reason: e.target.value })}
                placeholder={t('admin.coupon.reasonPlaceholder')}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBatchSendDialog(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleBatchSendSubmit} disabled={batchSendMutation.isPending}>
              {batchSendMutation.isPending ? t('common.sending') : t('common.send')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
