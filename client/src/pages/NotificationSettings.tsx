import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { trpc } from '@/lib/trpc';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Bell, Clock, Mail, MessageCircle, Package, ShoppingBag, Tag, TrendingUp } from 'lucide-react';

export default function NotificationSettings() {
  const { t } = useTranslation();
  const utils = trpc.useUtils();

  // 获取当前通知偏好
  const { data: preferences, isLoading } = trpc.notificationPreferences.get.useQuery();

  // 更新通知偏好
  const updateMutation = trpc.notificationPreferences.update.useMutation({
    onSuccess: () => {
      utils.notificationPreferences.get.invalidate();
      toast.success(t('notifications.settings.saved'));
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  // 本地状态
  const [localPreferences, setLocalPreferences] = useState(preferences);

  // 更新本地状态
  const handleToggle = (key: string, value: boolean) => {
    setLocalPreferences((prev: any) => ({
      ...prev,
      [key]: value,
    }));
  };

  // 保存设置
  const handleSave = () => {
    if (!localPreferences) return;
    
    updateMutation.mutate({
      orderStatusEnabled: localPreferences.orderStatusEnabled,
      promotionEnabled: localPreferences.promotionEnabled,
      systemMessageEnabled: localPreferences.systemMessageEnabled,
      marketingEnabled: localPreferences.marketingEnabled,
      shippingEnabled: localPreferences.shippingEnabled,
      channelTelegram: localPreferences.channelTelegram,
      channelEmail: localPreferences.channelEmail,
      channelSms: localPreferences.channelSms,
      quietHoursStart: localPreferences.quietHoursStart,
      quietHoursEnd: localPreferences.quietHoursEnd,
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black p-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-white text-center py-8">{t('common.loading')}</div>
        </div>
      </div>
    );
  }

  // 使用本地状态或服务器数据
  const currentPreferences = localPreferences || preferences;

  return (
    <div className="min-h-screen bg-black pb-24">
      {/* 头部 */}
      <div className="bg-gradient-to-r from-teal-600 to-teal-700 text-white p-6">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <Bell className="w-6 h-6" />
            <h1 className="text-2xl font-bold">{t('notifications.settings.title')}</h1>
          </div>
          <p className="text-teal-100 text-sm">
            {t('notifications.settings.description')}
          </p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-4">
        {/* 通知类型设置 */}
        <Card className="bg-zinc-900 border-zinc-800 p-4">
          <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
            <Bell className="w-5 h-5 text-teal-500" />
            {t('notifications.settings.types')}
          </h2>
          
          <div className="space-y-4">
            {/* 订单状态通知 */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Package className="w-5 h-5 text-blue-500" />
                <div>
                  <Label className="text-white font-medium">
                    {t('notifications.settings.orderStatus')}
                  </Label>
                  <p className="text-zinc-400 text-xs">
                    {t('notifications.settings.orderStatusDesc')}
                  </p>
                </div>
              </div>
              <Switch
                checked={currentPreferences?.orderStatusEnabled ?? true}
                onCheckedChange={(checked) => handleToggle('orderStatusEnabled', checked)}
              />
            </div>

            {/* 优惠活动通知 */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Tag className="w-5 h-5 text-orange-500" />
                <div>
                  <Label className="text-white font-medium">
                    {t('notifications.settings.promotion')}
                  </Label>
                  <p className="text-zinc-400 text-xs">
                    {t('notifications.settings.promotionDesc')}
                  </p>
                </div>
              </div>
              <Switch
                checked={currentPreferences?.promotionEnabled ?? true}
                onCheckedChange={(checked) => handleToggle('promotionEnabled', checked)}
              />
            </div>

            {/* 系统消息通知 */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bell className="w-5 h-5 text-purple-500" />
                <div>
                  <Label className="text-white font-medium">
                    {t('notifications.settings.systemMessage')}
                  </Label>
                  <p className="text-zinc-400 text-xs">
                    {t('notifications.settings.systemMessageDesc')}
                  </p>
                </div>
              </div>
              <Switch
                checked={currentPreferences?.systemMessageEnabled ?? true}
                onCheckedChange={(checked) => handleToggle('systemMessageEnabled', checked)}
              />
            </div>

            {/* 营销推送通知 */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <TrendingUp className="w-5 h-5 text-pink-500" />
                <div>
                  <Label className="text-white font-medium">
                    {t('notifications.settings.marketing')}
                  </Label>
                  <p className="text-zinc-400 text-xs">
                    {t('notifications.settings.marketingDesc')}
                  </p>
                </div>
              </div>
              <Switch
                checked={currentPreferences?.marketingEnabled ?? false}
                onCheckedChange={(checked) => handleToggle('marketingEnabled', checked)}
              />
            </div>

            {/* 物流更新通知 */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ShoppingBag className="w-5 h-5 text-green-500" />
                <div>
                  <Label className="text-white font-medium">
                    {t('notifications.settings.shipping')}
                  </Label>
                  <p className="text-zinc-400 text-xs">
                    {t('notifications.settings.shippingDesc')}
                  </p>
                </div>
              </div>
              <Switch
                checked={currentPreferences?.shippingEnabled ?? true}
                onCheckedChange={(checked) => handleToggle('shippingEnabled', checked)}
              />
            </div>
          </div>
        </Card>

        {/* 通知渠道设置 */}
        <Card className="bg-zinc-900 border-zinc-800 p-4">
          <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-teal-500" />
            {t('notifications.settings.channels')}
          </h2>
          
          <div className="space-y-4">
            {/* Telegram */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <MessageCircle className="w-5 h-5 text-blue-500" />
                <Label className="text-white font-medium">Telegram</Label>
              </div>
              <Switch
                checked={currentPreferences?.channelTelegram ?? true}
                onCheckedChange={(checked) => handleToggle('channelTelegram', checked)}
              />
            </div>

            {/* Email */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-red-500" />
                <Label className="text-white font-medium">Email</Label>
              </div>
              <Switch
                checked={currentPreferences?.channelEmail ?? false}
                onCheckedChange={(checked) => handleToggle('channelEmail', checked)}
              />
            </div>
          </div>
        </Card>

        {/* 免打扰时段 */}
        <Card className="bg-zinc-900 border-zinc-800 p-4">
          <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-teal-500" />
            {t('notifications.settings.quietHours')}
          </h2>
          
          <p className="text-zinc-400 text-sm mb-4">
            {t('notifications.settings.quietHoursDesc')}
          </p>

          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Label className="text-white text-sm mb-2 block">
                {t('notifications.settings.startTime')}
              </Label>
              <Input
                type="time"
                value={currentPreferences?.quietHoursStart || ''}
                onChange={(e) => setLocalPreferences((prev: any) => ({ ...prev, quietHoursStart: e.target.value }))}
                className="bg-zinc-800 border-zinc-700 text-white"
              />
            </div>
            <div className="flex-1">
              <Label className="text-white text-sm mb-2 block">
                {t('notifications.settings.endTime')}
              </Label>
              <Input
                type="time"
                value={currentPreferences?.quietHoursEnd || ''}
                onChange={(e) => setLocalPreferences((prev: any) => ({ ...prev, quietHoursEnd: e.target.value }))}
                className="bg-zinc-800 border-zinc-700 text-white"
              />
            </div>
          </div>
        </Card>

        {/* 保存按钮 */}
        <Button
          onClick={handleSave}
          disabled={updateMutation.isPending}
          className="w-full bg-teal-600 hover:bg-teal-700 text-white"
        >
          {updateMutation.isPending ? t('common.saving') : t('common.save')}
        </Button>
      </div>
    </div>
  );
}
