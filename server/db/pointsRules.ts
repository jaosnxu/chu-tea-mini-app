/**
 * 积分规则配置模块
 * 管理消费积分兑换比例、会员等级加成和升级门槛
 */

import { getDb } from '../db';
import { systemConfigs, users } from '../../drizzle/schema';
import { eq } from 'drizzle-orm';

export interface PointsRules {
  // 消费积分兑换比例（多少卢布 = 1积分）
  spendPerPoint: number;
  // 会员等级积分加成比例
  levelBonus: {
    normal: number;
    silver: number;
    gold: number;
    diamond: number;
  };
  // 会员升级门槛（累计消费金额）
  upgradeThreshold: {
    silver: number;
    gold: number;
    diamond: number;
  };
}

const DEFAULT_RULES: PointsRules = {
  spendPerPoint: 30, // 30卢布 = 1积分
  levelBonus: {
    normal: 15,
    silver: 17,
    gold: 20,
    diamond: 25,
  },
  upgradeThreshold: {
    silver: 1000,  // 1000卢布升级白银
    gold: 5000,    // 5000卢布升级黄金
    diamond: 10000, // 10000卢布升级钻石
  },
};

/**
 * 获取积分规则配置
 */
export async function getPointsRules(): Promise<PointsRules> {
  const db = await getDb();
  if (!db) return DEFAULT_RULES;

  const [config] = await db
    .select()
    .from(systemConfigs)
    .where(eq(systemConfigs.key, 'pointsRules'))
    .limit(1);

  if (!config || !config.value) {
    return DEFAULT_RULES;
  }

  try {
    return JSON.parse(config.value as string);
  } catch {
    return DEFAULT_RULES;
  }
}

/**
 * 更新积分规则配置
 */
export async function updatePointsRules(rules: PointsRules): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  // 验证规则
  if (rules.spendPerPoint <= 0) {
    throw new Error('spendPerPoint must be greater than 0');
  }

  for (const level of ['normal', 'silver', 'gold', 'diamond'] as const) {
    if (rules.levelBonus[level] < 0 || rules.levelBonus[level] > 100) {
      throw new Error(`levelBonus.${level} must be between 0 and 100`);
    }
  }

  if (rules.upgradeThreshold.silver <= 0 || 
      rules.upgradeThreshold.gold <= rules.upgradeThreshold.silver ||
      rules.upgradeThreshold.diamond <= rules.upgradeThreshold.gold) {
    throw new Error('upgradeThreshold must be in ascending order');
  }

  const [existing] = await db
    .select()
    .from(systemConfigs)
    .where(eq(systemConfigs.key, 'pointsRules'))
    .limit(1);

  if (existing) {
    await db
      .update(systemConfigs)
      .set({ value: JSON.stringify(rules) })
      .where(eq(systemConfigs.key, 'pointsRules'));
  } else {
    await db.insert(systemConfigs).values({
      key: 'pointsRules',
      value: JSON.stringify(rules),
    });
  }

  return true;
}

/**
 * 检查并升级会员等级
 */
export async function checkAndUpgradeMemberLevel(
  userId: number,
  totalSpent: number
): Promise<{ upgraded: boolean; newLevel: 'normal' | 'silver' | 'gold' | 'diamond' }> {
  const db = await getDb();
  if (!db) return { upgraded: false, newLevel: 'normal' };

  const rules = await getPointsRules();
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) return { upgraded: false, newLevel: 'normal' };

  let newLevel: 'normal' | 'silver' | 'gold' | 'diamond' = user.memberLevel;

  // 检查是否达到升级门槛
  if (totalSpent >= rules.upgradeThreshold.diamond && user.memberLevel !== 'diamond') {
    newLevel = 'diamond';
  } else if (totalSpent >= rules.upgradeThreshold.gold && user.memberLevel !== 'gold' && user.memberLevel !== 'diamond') {
    newLevel = 'gold';
  } else if (totalSpent >= rules.upgradeThreshold.silver && user.memberLevel === 'normal') {
    newLevel = 'silver';
  }

  if (newLevel !== user.memberLevel) {
    await db.update(users).set({ memberLevel: newLevel }).where(eq(users.id, userId));
    return { upgraded: true, newLevel };
  }

  return { upgraded: false, newLevel: user.memberLevel };
}


/**
 * 计算订单积分
 */
export async function calculateOrderPoints(
  orderAmount: number,
  memberLevel: 'normal' | 'silver' | 'gold' | 'diamond'
): Promise<{ basePoints: number; bonusPoints: number; totalPoints: number }> {
  const rules = await getPointsRules();
  
  // 计算基础积分
  const basePoints = Math.floor(orderAmount / rules.spendPerPoint);
  
  // 计算等级加成积分
  const bonusPercentage = rules.levelBonus[memberLevel];
  const bonusPoints = Math.floor(basePoints * bonusPercentage / 100);
  
  return {
    basePoints,
    bonusPoints,
    totalPoints: basePoints + bonusPoints,
  };
}
