import { useState } from 'react';
import { useLocation } from 'wouter';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Sparkles, Users, Heart, TrendingUp, Gift } from 'lucide-react';

export default function TriggerTemplates() {
  const [, setLocation] = useLocation();
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [customName, setCustomName] = useState('');
  const [selectedCouponId, setSelectedCouponId] = useState<string>('');

  const { data: templates } = trpc.marketingTrigger.getTemplates.useQuery();
  const { data: categories } = trpc.marketingTrigger.getTemplateCategories.useQuery();
  const { data: coupons } = trpc.coupon.list.useQuery();
  const createFromTemplateMutation = trpc.marketingTrigger.createFromTemplate.useMutation();

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'user_lifecycle':
        return <Users className="h-5 w-5" />;
      case 'engagement':
        return <Heart className="h-5 w-5" />;
      case 'retention':
        return <TrendingUp className="h-5 w-5" />;
      case 'promotion':
        return <Gift className="h-5 w-5" />;
      default:
        return <Sparkles className="h-5 w-5" />;
    }
  };

  const getTriggerTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      user_register: '用户注册',
      first_order: '首单完成',
      order_amount: '消费达标',
      user_inactive: '用户流失',
      birthday: '生日',
      time_based: '定时触发'
    };
    return labels[type] || type;
  };

  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      send_coupon: '发放优惠券',
      send_notification: '发送通知',
      add_points: '赠送积分'
    };
    return labels[action] || action;
  };

  const handleUseTemplate = (template: any) => {
    setSelectedTemplate(template);
    setCustomName(template.name);
    setSelectedCouponId('');
    setShowCreateDialog(true);
  };

  const handleCreate = async () => {
    if (!selectedTemplate) return;

    try {
      const actionConfig = { ...selectedTemplate.actionConfig };
      
      // 如果是发放优惠券动作，需要选择优惠券模板
      if (selectedTemplate.action === 'send_coupon' && selectedCouponId) {
        actionConfig.couponTemplateId = parseInt(selectedCouponId);
      }

      await createFromTemplateMutation.mutateAsync({
        templateId: selectedTemplate.id,
        name: customName,
        actionConfig,
      });

      toast.success('触发器创建成功');
      setShowCreateDialog(false);
      setLocation('/admin/marketing-triggers');
    } catch (error: any) {
      toast.error(error.message || '创建失败');
    }
  };

  const templatesByCategory = categories?.reduce((acc: any, category: any) => {
    acc[category.id] = templates?.filter((t: any) => t.category === category.id) || [];
    return acc;
  }, {});

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* 标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">触发器模板库</h1>
          <p className="text-muted-foreground mt-1">
            选择预设模板快速创建营销触发器
          </p>
        </div>
        <Button variant="outline" onClick={() => setLocation('/admin/marketing-triggers')}>
          返回触发器列表
        </Button>
      </div>

      {/* 分类标签页 */}
      <Tabs defaultValue={categories?.[0]?.id} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          {categories?.map((category: any) => (
            <TabsTrigger key={category.id} value={category.id} className="flex items-center gap-2">
              {getCategoryIcon(category.id)}
              {category.name}
            </TabsTrigger>
          ))}
        </TabsList>

        {categories?.map((category: any) => (
          <TabsContent key={category.id} value={category.id} className="space-y-4">
            <div className="text-sm text-muted-foreground mb-4">
              {category.description}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {templatesByCategory?.[category.id]?.map((template: any) => (
                <Card key={template.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="flex items-center gap-2">
                          {template.name}
                          {template.isActive && (
                            <Badge variant="default" className="text-xs">推荐</Badge>
                          )}
                        </CardTitle>
                        <CardDescription className="mt-2">
                          {template.description}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Badge variant="outline">
                        {getTriggerTypeLabel(template.triggerType)}
                      </Badge>
                      <span className="text-muted-foreground">→</span>
                      <Badge variant="secondary">
                        {getActionLabel(template.action)}
                      </Badge>
                    </div>

                    {/* 显示条件 */}
                    {template.conditions && Object.keys(template.conditions).length > 0 && (
                      <div className="text-sm text-muted-foreground">
                        <span className="font-medium">触发条件：</span>
                        {template.conditions.inactiveDays && (
                          <span>{template.conditions.inactiveDays}天未下单</span>
                        )}
                        {template.conditions.totalAmount && (
                          <span>累计消费≥₽{template.conditions.totalAmount}</span>
                        )}
                        {template.conditions.schedule && (
                          <span>{template.conditions.description}</span>
                        )}
                        {Object.keys(template.conditions).length === 0 && (
                          <span>无特殊条件</span>
                        )}
                      </div>
                    )}

                    <Button
                      className="w-full"
                      onClick={() => handleUseTemplate(template)}
                    >
                      使用此模板
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            {(!templatesByCategory?.[category.id] || templatesByCategory[category.id].length === 0) && (
              <Card className="p-8 text-center text-muted-foreground">
                该分类暂无模板
              </Card>
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* 创建对话框 */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>从模板创建触发器</DialogTitle>
            <DialogDescription>
              {selectedTemplate?.description}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="name">触发器名称</Label>
              <Input
                id="name"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="输入触发器名称"
              />
            </div>

            {selectedTemplate?.action === 'send_coupon' && (
              <div>
                <Label htmlFor="coupon">选择优惠券模板</Label>
                <Select value={selectedCouponId} onValueChange={setSelectedCouponId}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择优惠券模板" />
                  </SelectTrigger>
                  <SelectContent>
                    {coupons?.map((coupon: any) => (
                      <SelectItem key={coupon.id} value={coupon.id.toString()}>
                        {coupon.nameZh} ({coupon.type})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  触发器执行时将发放此优惠券
                </p>
              </div>
            )}

            {selectedTemplate?.action === 'add_points' && (
              <div className="p-3 bg-muted rounded-lg text-sm">
                <span className="font-medium">积分奖励：</span>
                {selectedTemplate.actionConfig.points} 积分
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              取消
            </Button>
            <Button
              onClick={handleCreate}
              disabled={
                !customName ||
                (selectedTemplate?.action === 'send_coupon' && !selectedCouponId)
              }
            >
              创建触发器
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
