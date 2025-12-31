import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { trpc } from '@/lib/trpc';

export default function DeliverySettings() {
  const { t } = useTranslation();
  const [enablePickup, setEnablePickup] = useState(true);
  const [enableDelivery, setEnableDelivery] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // 获取当前配置
  const { data: settings, isLoading } = trpc.system.getDeliverySettings.useQuery();
  const updateMutation = trpc.system.updateDeliverySettings.useMutation();

  useEffect(() => {
    if (settings) {
      setEnablePickup(settings.enablePickup);
      setEnableDelivery(settings.enableDelivery);
    }
  }, [settings]);

  const handleSave = async () => {
    if (!enablePickup && !enableDelivery) {
      toast.error(t('config.atLeastOneMethod'));
      return;
    }

    setIsSaving(true);
    try {
      await updateMutation.mutateAsync({
        enablePickup,
        enableDelivery,
      });
      toast.success(t('config.settingsSaved'));
    } catch (error) {
      toast.error(t('common.error'));
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="p-4">{t('common.loading')}</div>;
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('config.deliverySettings')}</h1>
      </div>

      <Card className="p-6">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="enablePickup" className="text-base font-medium">
                {t('config.enablePickup')}
              </Label>
              <p className="text-sm text-gray-500">
                {t('config.pickupDesc')}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="enablePickup"
                checked={enablePickup}
                onChange={(e) => setEnablePickup(e.target.checked)}
                className="w-5 h-5 text-teal-600 rounded focus:ring-teal-500"
              />
            </div>
          </div>

          <div className="border-t pt-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="enableDelivery" className="text-base font-medium">
                  {t('config.enableDelivery')}
                </Label>
                <p className="text-sm text-gray-500">
                  {t('config.deliveryDesc')}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="enableDelivery"
                  checked={enableDelivery}
                  onChange={(e) => setEnableDelivery(e.target.checked)}
                  className="w-5 h-5 text-teal-600 rounded focus:ring-teal-500"
                />
              </div>
            </div>
          </div>

          <div className="border-t pt-6">
            <Button
              onClick={handleSave}
              disabled={isSaving || (!enablePickup && !enableDelivery)}
              className="w-full"
            >
              {isSaving ? t('common.loading') : t('config.saveSettings')}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
