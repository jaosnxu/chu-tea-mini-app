import { useTranslation } from 'react-i18next';
import { useLocation } from 'wouter';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { trpc } from '@/lib/trpc';
import { ChevronLeft, Crown, Gift, Star, Zap, TrendingUp, Check, Lock, Truck } from 'lucide-react';
import { BottomNav } from '@/components/BottomNav';
import { toast } from 'sonner';

const LEVEL_CONFIG = {
  normal: {
    name: { zh: '普通会员', ru: 'Обычный', en: 'Normal' },
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
    icon: '👤',
  },
  silver: {
    name: { zh: '银卡会员', ru: 'Серебряный', en: 'Silver' },
    color: 'text-gray-500',
    bgColor: 'bg-gray-200',
    icon: '🥈',
  },
  gold: {
    name: { zh: '金卡会员', ru: 'Золотой', en: 'Gold' },
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100',
    icon: '🥇',
  },
  diamond: {
    name: { zh: '钻石会员', ru: 'Бриллиантовый', en: 'Diamond' },
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    icon: '💎',
  },
};

export default function MemberCenter() {
  const { t, i18n } = useTranslation();
  const language = i18n.language as 'zh' | 'ru' | 'en';
  const [, navigate] = useLocation();
  
  const { data: member } = trpc.member.info.useQuery();
  const { data: levelProgress } = trpc.member.levelProgress.useQuery();
  const { data: benefits } = trpc.member.benefits.useQuery();
  const { data: welcomeGiftStatus } = trpc.member.getWelcomeGiftStatus.useQuery();
  const checkUpgrade = trpc.member.checkUpgrade.useMutation({
    onSuccess: (result) => {
      if (result && result.upgraded && result.newLevel) {
        toast.success(`🎉 恭喜升级到 ${LEVEL_CONFIG[result.newLevel as keyof typeof LEVEL_CONFIG].name[language]}！`);
      } else {
        toast.info('当前等级已是最新');
      }
    },
  });

  const level = (member?.memberLevel || 'normal') as keyof typeof LEVEL_CONFIG;
  const levelConfig = LEVEL_CONFIG[level];
  const totalSpent = parseFloat(member?.totalSpent || '0');
  const availablePoints = member?.availablePoints || 0;

  // 等级进度
  const progress = levelProgress && !levelProgress.isMaxLevel ? 
    ((levelProgress.spentProgress || 0) + (levelProgress.ordersProgress || 0)) / 2 : 100;
  const nextLevel = levelProgress?.nextLevel;
  const remaining = levelProgress && !levelProgress.isMaxLevel ?
    Math.max(levelProgress.spentRemaining || 0, levelProgress.ordersRemaining || 0) : 0;

  // 权益列表
  const currentBenefits = benefits || {
    pointsMultiplier: 1,
    discountRate: 0,
    freeDeliveryThreshold: 999999,
    birthdayCoupon: false,
    prioritySupport: false,
  };

  // 所有等级对比
  const allLevels = [
    {
      level: 'normal',
      requirements: { spent: 0, orders: 0 },
      benefits: { pointsMultiplier: 1, discountRate: 0, freeShipping: false, birthdayCoupon: false, prioritySupport: false },
    },
    {
      level: 'silver',
      requirements: { spent: 1000, orders: 5 },
      benefits: { pointsMultiplier: 1.2, discountRate: 0.05, freeShipping: false, birthdayCoupon: true, prioritySupport: false },
    },
    {
      level: 'gold',
      requirements: { spent: 5000, orders: 20 },
      benefits: { pointsMultiplier: 1.5, discountRate: 0.1, freeShipping: true, birthdayCoupon: true, prioritySupport: true },
    },
    {
      level: 'diamond',
      requirements: { spent: 10000, orders: 50 },
      benefits: { pointsMultiplier: 2, discountRate: 0.15, freeShipping: true, birthdayCoupon: true, prioritySupport: true },
    },
  ];

  const currentLevelIndex = allLevels.findIndex((l) => l.level === level);

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <BottomNav />
      
      {/* 顶部等级卡片 */}
      <header className={`bg-gradient-to-br from-${level === 'diamond' ? 'blue' : level === 'gold' ? 'yellow' : level === 'silver' ? 'gray' : 'slate'}-400 to-${level === 'diamond' ? 'indigo' : level === 'gold' ? 'orange' : level === 'silver' ? 'slate' : 'gray'}-600 text-white`}>
        <div className="flex items-center justify-between p-4">
          <button onClick={() => navigate('/profile')} className="p-1">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h1 className="font-bold text-lg">{t('member.memberCenter')}</h1>
          <Button
            size="sm"
            variant="ghost"
            className="text-white hover:bg-white/20"
            onClick={() => checkUpgrade.mutate()}
            disabled={checkUpgrade.isPending}
          >
            <TrendingUp className="w-4 h-4 mr-1" />
            检查升级
          </Button>
        </div>
        
        <div className="px-4 pb-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="text-5xl">{levelConfig.icon}</div>
            <div>
              <p className="font-bold text-2xl">{levelConfig.name[language]}</p>
              <p className="text-sm text-white/80">{t('member.currentLevel')}</p>
            </div>
          </div>
          
          {/* 积分余额 */}
          <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3 mb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/80 text-sm">可用积分</p>
                <p className="text-2xl font-bold">{availablePoints}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/20"
                onClick={() => navigate('/points')}
              >
                查看明细 →
              </Button>
            </div>
          </div>

          {/* 升级进度 */}
          {nextLevel && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-white/90">
                  距离 {LEVEL_CONFIG[nextLevel as keyof typeof LEVEL_CONFIG].name[language]}
                </span>
                <span className="text-white/90">
                  还需消费 ₽{remaining.toFixed(0)}
                </span>
              </div>
              <Progress value={Math.min(progress, 100)} className="h-2 bg-white/30" />
              <p className="text-xs text-white/70 text-right">{progress.toFixed(1)}%</p>
            </div>
          )}
          {!nextLevel && (
            <div className="text-center py-2">
              <Badge className="bg-white/20 text-white border-white/30">
                <Crown className="w-4 h-4 mr-1" />
                已达最高等级
              </Badge>
            </div>
          )}
        </div>
      </header>

      <div className="p-4 space-y-4">
        {/* 新人礼包卡片 */}
        {welcomeGiftStatus && (
          <Card className="p-4 bg-gradient-to-br from-pink-50 to-purple-50 border-pink-200">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-pink-500 rounded-xl flex items-center justify-center">
                  <Gift className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-gray-800">新人大礼包</h3>
                  <p className="text-xs text-gray-600">注册即送惊喜好礼</p>
                </div>
              </div>
              {welcomeGiftStatus.hasReceived ? (
                <Badge className="bg-green-500 text-white">
                  <Check className="w-3 h-3 mr-1" />
                  已领取
                </Badge>
              ) : (
                <Button
                  size="sm"
                  className="bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white"
                  onClick={() => navigate('/membership/welcome')}
                >
                  立即领取
                </Button>
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white/60 backdrop-blur-sm rounded-lg p-3 border border-orange-200">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                    <Star className="w-4 h-4 text-orange-600" />
                  </div>
                  <p className="text-sm font-medium text-gray-700">100 积分</p>
                </div>
                <p className="text-xs text-gray-600">立即到账，可用于兑换商品</p>
                {welcomeGiftStatus.hasReceived && welcomeGiftStatus.pointsReceived > 0 && (
                  <Badge variant="secondary" className="mt-2 text-xs">
                    <Check className="w-3 h-3 mr-1" />
                    已发放
                  </Badge>
                )}
              </div>
              
              <div className="bg-white/60 backdrop-blur-sm rounded-lg p-3 border border-purple-200">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <Gift className="w-4 h-4 text-purple-600" />
                  </div>
                  <p className="text-sm font-medium text-gray-700">2 张优惠券</p>
                </div>
                <p className="text-xs text-gray-600">满 300 减 50，全场通用</p>
                {welcomeGiftStatus.hasReceived && welcomeGiftStatus.couponsReceived > 0 && (
                  <Badge variant="secondary" className="mt-2 text-xs">
                    <Check className="w-3 h-3 mr-1" />
                    已发放 {welcomeGiftStatus.couponsReceived} 张
                  </Badge>
                )}
              </div>
            </div>
            
            {welcomeGiftStatus.hasReceived && (
              <div className="mt-3 text-center">
                <p className="text-xs text-gray-500">更多会员权益就在下方 ↓</p>
              </div>
            )}
          </Card>
        )}

        {/* 当前权益 */}
        <Card className="p-4">
          <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
            <Gift className="w-5 h-5 text-teal-600" />
            我的专属权益
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div className={`p-3 rounded-lg ${levelConfig.bgColor}`}>
              <Star className={`w-5 h-5 ${levelConfig.color} mb-1`} />
              <p className="text-xs text-gray-600">积分倍率</p>
              <p className={`font-bold ${levelConfig.color}`}>
                {currentBenefits.pointsMultiplier}x
              </p>
            </div>
            <div className={`p-3 rounded-lg ${levelConfig.bgColor}`}>
              <Zap className={`w-5 h-5 ${levelConfig.color} mb-1`} />
              <p className="text-xs text-gray-600">专属折扣</p>
              <p className={`font-bold ${levelConfig.color}`}>
                {(currentBenefits.discountRate * 100).toFixed(0)}% OFF
              </p>
            </div>
            <div className={`p-3 rounded-lg ${levelConfig.bgColor}`}>
              <Truck className={`w-5 h-5 ${levelConfig.color} mb-1`} />
              <p className="text-xs text-gray-600">免配送费</p>
              <p className={`font-bold ${levelConfig.color}`}>
                {'freeDeliveryThreshold' in currentBenefits && currentBenefits.freeDeliveryThreshold === 0 ? '✓ 已开通' : '✗ 未开通'}
              </p>
            </div>
            <div className={`p-3 rounded-lg ${levelConfig.bgColor}`}>
              <Gift className={`w-5 h-5 ${levelConfig.color} mb-1`} />
              <p className="text-xs text-gray-600">生日礼券</p>
              <p className={`font-bold ${levelConfig.color}`}>
                {currentBenefits.birthdayCoupon ? '✓ 已开通' : '✗ 未开通'}
              </p>
            </div>
          </div>
        </Card>

        {/* 等级对比表 */}
        <Card className="p-4">
          <h3 className="font-bold text-lg mb-4">会员等级对比</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-2">等级</th>
                  <th className="text-center py-2 px-2">升级条件</th>
                  <th className="text-center py-2 px-2">积分倍率</th>
                  <th className="text-center py-2 px-2">折扣</th>
                  <th className="text-center py-2 px-2">免配送</th>
                </tr>
              </thead>
              <tbody>
                {allLevels.map((lvl, index) => {
                  const config = LEVEL_CONFIG[lvl.level as keyof typeof LEVEL_CONFIG];
                  const isCurrentLevel = lvl.level === level;
                  const isUnlocked = index <= currentLevelIndex;
                  
                  return (
                    <tr
                      key={lvl.level}
                      className={`border-b ${isCurrentLevel ? 'bg-teal-50' : ''}`}
                    >
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{config.icon}</span>
                          <div>
                            <p className={`font-medium ${config.color}`}>
                              {config.name[language]}
                            </p>
                            {isCurrentLevel && (
                              <Badge variant="secondary" className="text-xs">
                                当前
                              </Badge>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="text-center py-3 px-2">
                        {lvl.requirements.spent > 0 ? (
                          <div className="text-xs">
                            <p>消费 ₽{lvl.requirements.spent}</p>
                            <p className="text-gray-500">{lvl.requirements.orders} 单</p>
                          </div>
                        ) : (
                          <span className="text-gray-500 text-xs">无要求</span>
                        )}
                      </td>
                      <td className="text-center py-3 px-2">
                        {isUnlocked ? (
                          <span className="font-bold text-teal-600">
                            {lvl.benefits.pointsMultiplier}x
                          </span>
                        ) : (
                          <Lock className="w-4 h-4 text-gray-400 mx-auto" />
                        )}
                      </td>
                      <td className="text-center py-3 px-2">
                        {isUnlocked ? (
                          <span className="font-bold text-orange-600">
                            {(lvl.benefits.discountRate * 100).toFixed(0)}%
                          </span>
                        ) : (
                          <Lock className="w-4 h-4 text-gray-400 mx-auto" />
                        )}
                      </td>
                      <td className="text-center py-3 px-2">
                        {isUnlocked ? (
                          lvl.benefits.freeShipping ? (
                            <Check className="w-5 h-5 text-green-600 mx-auto" />
                          ) : (
                            <span className="text-gray-400">—</span>
                          )
                        ) : (
                          <Lock className="w-4 h-4 text-gray-400 mx-auto" />
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>

        {/* 升级提示 */}
        {nextLevel && (
          <Card className="p-4 bg-gradient-to-r from-teal-50 to-blue-50 border-teal-200">
            <div className="flex items-start gap-3">
              <TrendingUp className="w-6 h-6 text-teal-600 flex-shrink-0 mt-1" />
              <div className="flex-1">
                <h4 className="font-bold text-teal-900 mb-1">升级提示</h4>
                <p className="text-sm text-teal-700">
                  再消费 <span className="font-bold">₽{remaining.toFixed(0)}</span>，
                  即可升级到 <span className="font-bold">{LEVEL_CONFIG[nextLevel as keyof typeof LEVEL_CONFIG].name[language]}</span>，
                  享受更多专属权益！
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* 消费统计 */}
        <Card className="p-4">
          <h3 className="font-bold text-lg mb-4">我的数据</h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-teal-600">₽{totalSpent.toFixed(0)}</p>
              <p className="text-xs text-gray-500 mt-1">累计消费</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-orange-600">{member?.totalPoints || 0}</p>
              <p className="text-xs text-gray-500 mt-1">累计积分</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-600">{levelConfig.icon}</p>
              <p className="text-xs text-gray-500 mt-1">当前等级</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
