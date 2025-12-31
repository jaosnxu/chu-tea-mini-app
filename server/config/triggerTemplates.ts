/**
 * 营销触发器模板库
 * 预设常用的营销场景模板，支持一键创建
 */

export interface TriggerTemplate {
  id: string;
  name: string;
  description: string;
  category: 'user_lifecycle' | 'engagement' | 'retention' | 'promotion';
  triggerType: 'user_register' | 'first_order' | 'order_amount' | 'user_inactive' | 'birthday' | 'time_based';
  conditions: any;
  action: 'send_coupon' | 'send_notification' | 'add_points';
  actionConfig: any;
  isActive: boolean;
}

export const triggerTemplates: TriggerTemplate[] = [
  // 用户生命周期模板
  {
    id: 'new_user_welcome',
    name: '新用户欢迎礼',
    description: '用户注册后立即发放新人优惠券，提升首单转化率',
    category: 'user_lifecycle',
    triggerType: 'user_register',
    conditions: {},
    action: 'send_coupon',
    actionConfig: {
      couponTemplateId: null, // 需要管理员选择优惠券模板
      message: '欢迎加入 CHU TEA！这是您的新人专享优惠券 🎁'
    },
    isActive: true
  },
  {
    id: 'first_order_reward',
    name: '首单奖励',
    description: '用户完成首单后赠送积分，鼓励再次购买',
    category: 'user_lifecycle',
    triggerType: 'first_order',
    conditions: {},
    action: 'add_points',
    actionConfig: {
      points: 100,
      reason: '首单奖励'
    },
    isActive: true
  },
  
  // 用户互动模板
  {
    id: 'high_value_customer',
    name: '高价值客户奖励',
    description: '累计消费达到一定金额后发放专属优惠券',
    category: 'engagement',
    triggerType: 'order_amount',
    conditions: {
      totalAmount: 1000 // 累计消费 1000 卢布
    },
    action: 'send_coupon',
    actionConfig: {
      couponTemplateId: null,
      message: '感谢您的支持！您已成为我们的高价值客户，这是专属优惠券 💎'
    },
    isActive: true
  },
  {
    id: 'birthday_gift',
    name: '生日祝福',
    description: '用户生日当天发送生日祝福和专属优惠券',
    category: 'engagement',
    triggerType: 'birthday',
    conditions: {},
    action: 'send_coupon',
    actionConfig: {
      couponTemplateId: null,
      message: '生日快乐！🎂 CHU TEA 祝您生日快乐，这是您的生日专属礼物！'
    },
    isActive: true
  },
  
  // 用户留存模板
  {
    id: 'churn_prevention_7days',
    name: '7天流失召回',
    description: '用户7天未下单时发送优惠券召回',
    category: 'retention',
    triggerType: 'user_inactive',
    conditions: {
      inactiveDays: 7
    },
    action: 'send_coupon',
    actionConfig: {
      couponTemplateId: null,
      message: '好久不见！我们为您准备了专属优惠，快来看看吧 ☕'
    },
    isActive: true
  },
  {
    id: 'churn_prevention_30days',
    name: '30天流失召回',
    description: '用户30天未下单时发送高价值优惠券强力召回',
    category: 'retention',
    triggerType: 'user_inactive',
    conditions: {
      inactiveDays: 30
    },
    action: 'send_coupon',
    actionConfig: {
      couponTemplateId: null,
      message: '我们想念您了！这是我们为您准备的特别优惠，期待您的回归 💝'
    },
    isActive: true
  },
  
  // 促销活动模板
  {
    id: 'weekend_promotion',
    name: '周末促销',
    description: '每周六上午10点发送周末特惠优惠券',
    category: 'promotion',
    triggerType: 'time_based',
    conditions: {
      schedule: '0 0 10 * * 6', // 每周六上午10点
      description: '每周六上午10点执行'
    },
    action: 'send_coupon',
    actionConfig: {
      couponTemplateId: null,
      message: '周末好时光！CHU TEA 周末特惠来啦 🎉'
    },
    isActive: false // 默认不启用，需要管理员手动开启
  },
  {
    id: 'monthly_loyalty_reward',
    name: '月度忠诚奖励',
    description: '每月1号给活跃用户发放忠诚度积分',
    category: 'promotion',
    triggerType: 'time_based',
    conditions: {
      schedule: '0 0 9 1 * *', // 每月1号上午9点
      description: '每月1号上午9点执行'
    },
    action: 'add_points',
    actionConfig: {
      points: 50,
      reason: '月度忠诚奖励'
    },
    isActive: false
  }
];

/**
 * 根据分类获取模板
 */
export function getTemplatesByCategory(category: TriggerTemplate['category']) {
  return triggerTemplates.filter(t => t.category === category);
}

/**
 * 根据ID获取模板
 */
export function getTemplateById(id: string) {
  return triggerTemplates.find(t => t.id === id);
}

/**
 * 获取所有模板分类
 */
export function getTemplateCategories() {
  return [
    { id: 'user_lifecycle', name: '用户生命周期', description: '新用户欢迎、首单奖励等' },
    { id: 'engagement', name: '用户互动', description: '高价值客户、生日祝福等' },
    { id: 'retention', name: '用户留存', description: '流失召回、沉默用户激活等' },
    { id: 'promotion', name: '促销活动', description: '周末促销、节日活动等' }
  ];
}
