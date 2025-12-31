import { useState } from 'react';
import { useLocation } from 'wouter';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';

export default function MarketingTriggers() {
  const [, setLocation] = useLocation();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const { data: triggers, refetch } = trpc.marketingTrigger.list.useQuery();
  const createMutation = trpc.marketingTrigger.create.useMutation();
  const updateMutation = trpc.marketingTrigger.update.useMutation();
  const deleteMutation = trpc.marketingTrigger.delete.useMutation();

  const [formData, setFormData] = useState({
    name: '',
    triggerType: 'user_register' as any,
    conditions: '{}',
    action: 'send_coupon' as any,
    actionConfig: '{}',
    isActive: true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const data = {
        ...formData,
        conditions: JSON.parse(formData.conditions),
        actionConfig: JSON.parse(formData.actionConfig),
      };

      if (editingId) {
        await updateMutation.mutateAsync({ id: editingId, ...data });
        toast.success('触发器已更新');
      } else {
        await createMutation.mutateAsync(data);
        toast.success('触发器已创建');
      }

      setShowForm(false);
      setEditingId(null);
      refetch();
      resetForm();
    } catch (error: any) {
      toast.error(error.message || '操作失败');
    }
  };

  const handleEdit = (trigger: any) => {
    setFormData({
      name: trigger.name,
      triggerType: trigger.triggerType,
      conditions: JSON.stringify(trigger.conditions, null, 2),
      action: trigger.action,
      actionConfig: JSON.stringify(trigger.actionConfig, null, 2),
      isActive: trigger.isActive,
    });
    setEditingId(trigger.id);
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除这个触发器吗？')) return;
    
    try {
      await deleteMutation.mutateAsync({ id });
      toast.success('触发器已删除');
      refetch();
    } catch (error: any) {
      toast.error(error.message || '删除失败');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      triggerType: 'user_register',
      conditions: '{}',
      action: 'send_coupon',
      actionConfig: '{}',
      isActive: true,
    });
  };

  const getTriggerTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      user_register: '用户注册',
      first_order: '首单完成',
      order_amount: '消费达标',
      user_inactive: '用户流失',
      birthday: '用户生日',
      time_based: '时间触发',
    };
    return labels[type] || type;
  };

  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      send_coupon: '发放优惠券',
      send_notification: '发送通知',
      add_points: '赠送积分',
    };
    return labels[action] || action;
  };

  if (showForm) {
    return (
      <div className="container py-8">
        <Card className="p-6">
          <h2 className="text-2xl font-bold mb-6">
            {editingId ? '编辑触发器' : '创建触发器'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>触发器名称</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div>
              <Label>触发类型</Label>
              <Select
                value={formData.triggerType}
                onValueChange={(value) => setFormData({ ...formData, triggerType: value as any })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user_register">用户注册</SelectItem>
                  <SelectItem value="first_order">首单完成</SelectItem>
                  <SelectItem value="order_amount">消费达标</SelectItem>
                  <SelectItem value="user_inactive">用户流失</SelectItem>
                  <SelectItem value="birthday">用户生日</SelectItem>
                  <SelectItem value="time_based">时间触发</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>触发条件 (JSON)</Label>
              <Textarea
                value={formData.conditions}
                onChange={(e) => setFormData({ ...formData, conditions: e.target.value })}
                rows={4}
                placeholder='{"minAmount": 100}'
              />
              <p className="text-sm text-muted-foreground mt-1">
                示例: {'{'}minAmount: 100, daysInactive: 30{'}'}
              </p>
            </div>

            <div>
              <Label>执行动作</Label>
              <Select
                value={formData.action}
                onValueChange={(value) => setFormData({ ...formData, action: value as any })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="send_coupon">发放优惠券</SelectItem>
                  <SelectItem value="send_notification">发送通知</SelectItem>
                  <SelectItem value="add_points">赠送积分</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>动作配置 (JSON)</Label>
              <Textarea
                value={formData.actionConfig}
                onChange={(e) => setFormData({ ...formData, actionConfig: e.target.value })}
                rows={4}
                placeholder='{"couponTemplateId": 123}'
              />
              <p className="text-sm text-muted-foreground mt-1">
                示例: {'{'}couponTemplateId: 123, points: 100{'}'}
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
              />
              <Label>启用触发器</Label>
            </div>

            <div className="flex gap-2">
              <Button type="submit">保存</Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowForm(false);
                  setEditingId(null);
                  resetForm();
                }}
              >
                取消
              </Button>
            </div>
          </form>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">营销触发器</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setLocation('/admin/trigger-templates')}>
            模板库
          </Button>
          <Button onClick={() => setShowForm(true)}>创建触发器</Button>
        </div>
      </div>

      <div className="space-y-4">
        {triggers?.map((trigger: any) => (
          <Card key={trigger.id} className="p-4">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-lg font-semibold">{trigger.name}</h3>
                  {trigger.isActive ? (
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">启用</span>
                  ) : (
                    <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded">禁用</span>
                  )}
                </div>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>触发类型: {getTriggerTypeLabel(trigger.triggerType)}</p>
                  <p>执行动作: {getActionLabel(trigger.action)}</p>
                  <p>执行次数: {trigger.executionCount}</p>
                  {trigger.lastExecutedAt && (
                    <p>最后执行: {new Date(trigger.lastExecutedAt).toLocaleString()}</p>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => setLocation(`/admin/trigger-executions/${trigger.id}`)}
                >
                  查看执行历史
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleEdit(trigger)}>
                  编辑
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleDelete(trigger.id)}
                >
                  删除
                </Button>
              </div>
            </div>
          </Card>
        ))}

        {!triggers || triggers.length === 0 && (
          <Card className="p-8 text-center text-muted-foreground">
            暂无触发器，点击"创建触发器"开始配置
          </Card>
        )}
      </div>
    </div>
  );
}
