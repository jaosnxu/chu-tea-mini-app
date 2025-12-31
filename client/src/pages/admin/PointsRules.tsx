import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { trpc } from '@/lib/trpc';

export default function PointsRules() {
  const { t } = useTranslation();
  const [spendPerPoint, setSpendPerPoint] = useState(30);
  const [levelBonus, setLevelBonus] = useState({ normal: 15, silver: 17, gold: 20, diamond: 25 });
  const [upgradeThreshold, setUpgradeThreshold] = useState({ silver: 5000, gold: 20000, diamond: 50000 });
  const [isSaving, setIsSaving] = useState(false);

  const { data: rules, isLoading } = trpc.system.getPointsRules.useQuery();
  const updateMutation = trpc.system.updatePointsRules.useMutation();

  useEffect(() => {
    if (rules) {
      setSpendPerPoint(rules.spendPerPoint);
      setLevelBonus(rules.levelBonus);
      setUpgradeThreshold(rules.upgradeThreshold);
    }
  }, [rules]);

  const handleSave = async () => {
    if (spendPerPoint < 1) {
      toast.error('兑换比例必须大于0');
      return;
    }

    setIsSaving(true);
    try {
      await updateMutation.mutateAsync({ spendPerPoint, levelBonus, upgradeThreshold });
      toast.success('积分规则已保存');
    } catch (error) {
      toast.error('保存失败');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <div className="p-4">加载中...</div>;

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-bold">积分规则管理</h1>

      <Card className="p-6 space-y-6">
        {/* 消费积分兑换比例 */}
        <div>
          <Label className="text-base font-medium">消费积分兑换比例</Label>
          <p className="text-sm text-gray-500 mb-2">设置多少卢布可以兑换1积分</p>
          <div className="flex items-center gap-2">
            <Input type="number" min="1" value={spendPerPoint} onChange={(e) => setSpendPerPoint(Number(e.target.value))} className="w-32" />
            <span className="text-sm">卢布 = 1 积分</span>
          </div>
        </div>

        {/* 会员等级积分加成 */}
        <div className="border-t pt-6">
          <h3 className="text-base font-medium mb-4">会员等级积分加成</h3>
          <div className="space-y-4">
            {(['normal', 'silver', 'gold', 'diamond'] as const).map((level) => (
              <div key={level} className="flex items-center justify-between">
                <Label>{level === 'normal' ? '普通用户' : level === 'silver' ? '白银会员' : level === 'gold' ? '黄金会员' : '钻石会员'}</Label>
                <div className="flex items-center gap-2">
                  <Input type="number" min="0" max="100" value={levelBonus[level]} onChange={(e) => setLevelBonus({ ...levelBonus, [level]: Number(e.target.value) })} className="w-20" />
                  <span>%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 会员升级门槛 */}
        <div className="border-t pt-6">
          <h3 className="text-base font-medium mb-4">会员升级门槛</h3>
          <div className="space-y-4">
            {(['silver', 'gold', 'diamond'] as const).map((level) => (
              <div key={level} className="flex items-center justify-between">
                <Label>{level === 'silver' ? '白银会员' : level === 'gold' ? '黄金会员' : '钻石会员'}</Label>
                <div className="flex items-center gap-2">
                  <Input type="number" min="0" value={upgradeThreshold[level]} onChange={(e) => setUpgradeThreshold({ ...upgradeThreshold, [level]: Number(e.target.value) })} className="w-32" />
                  <span>₽</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 积分计算示例 */}
        <div className="border-t pt-6 bg-gray-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium mb-3">积分计算示例（订单金额 300₽）</h3>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between"><span>基础积分:</span><span className="font-medium">{Math.floor(300 / spendPerPoint)} 积分</span></div>
            {(['normal', 'silver', 'gold', 'diamond'] as const).map((level) => (
              <div key={level} className="flex justify-between text-xs">
                <span>{level === 'normal' ? '普通' : level === 'silver' ? '白银' : level === 'gold' ? '黄金' : '钻石'} (+{levelBonus[level]}%):</span>
                <span className="font-medium">{Math.floor(300 / spendPerPoint) + Math.floor((300 / spendPerPoint) * levelBonus[level] / 100)} 积分</span>
              </div>
            ))}
          </div>
        </div>

        <Button onClick={handleSave} disabled={isSaving} className="w-full">{isSaving ? '保存中...' : '保存设置'}</Button>
      </Card>
    </div>
  );
}
