import { getDb } from "../db";
import { sql } from "drizzle-orm";

/**
 * 达人等级升级规则
 */
export const LEVEL_UPGRADE_RULES = {
  bronze: {
    minRevenue: 0,
    minOrders: 0,
    commissionMultiplier: 1.0, // 基础佣金比例
  },
  silver: {
    minRevenue: 10000, // 累计销售额 ₽10,000
    minOrders: 50, // 累计订单数 50 单
    commissionMultiplier: 1.1, // 佣金提升 10%
  },
  gold: {
    minRevenue: 50000, // 累计销售额 ₽50,000
    minOrders: 200, // 累计订单数 200 单
    commissionMultiplier: 1.2, // 佣金提升 20%
  },
  diamond: {
    minRevenue: 200000, // 累计销售额 ₽200,000
    minOrders: 1000, // 累计订单数 1000 单
    commissionMultiplier: 1.3, // 佣金提升 30%
  },
};

export type InfluencerLevel = keyof typeof LEVEL_UPGRADE_RULES;

/**
 * 检查达人是否应该升级
 */
export async function checkInfluencerLevelUpgrade(userId: number): Promise<{
  shouldUpgrade: boolean;
  newLevel?: InfluencerLevel;
  currentLevel: InfluencerLevel;
  stats: {
    totalRevenue: number;
    totalOrders: number;
  };
}> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // 获取达人当前等级
  const userResult = await db.execute(sql`
    SELECT influencer_level, total_earnings
    FROM users
    WHERE id = ${userId} AND is_influencer = 1
  `);

  const user = ((userResult as any).rows || userResult)[0] as any;
  if (!user) {
    throw new Error("User is not an influencer");
  }

  const currentLevel = (user.influencer_level || "bronze") as InfluencerLevel;

  // 获取达人的累计销售数据
  const statsResult = await db.execute(sql`
    SELECT 
      COUNT(DISTINCT order_id) as total_orders,
      SUM(order_amount) as total_revenue
    FROM order_attribution
    WHERE influencer_user_id = ${userId}
      AND status = 'confirmed'
  `);

  const stats = ((statsResult as any).rows || statsResult)[0] as any;
  const totalRevenue = parseFloat(stats.total_revenue || "0");
  const totalOrders = parseInt(stats.total_orders || "0");

  // 确定应该升级到的等级
  let newLevel: InfluencerLevel | undefined;

  if (
    totalRevenue >= LEVEL_UPGRADE_RULES.diamond.minRevenue &&
    totalOrders >= LEVEL_UPGRADE_RULES.diamond.minOrders &&
    currentLevel !== "diamond"
  ) {
    newLevel = "diamond";
  } else if (
    totalRevenue >= LEVEL_UPGRADE_RULES.gold.minRevenue &&
    totalOrders >= LEVEL_UPGRADE_RULES.gold.minOrders &&
    (currentLevel === "bronze" || currentLevel === "silver")
  ) {
    newLevel = "gold";
  } else if (
    totalRevenue >= LEVEL_UPGRADE_RULES.silver.minRevenue &&
    totalOrders >= LEVEL_UPGRADE_RULES.silver.minOrders &&
    currentLevel === "bronze"
  ) {
    newLevel = "silver";
  }

  return {
    shouldUpgrade: !!newLevel,
    newLevel,
    currentLevel,
    stats: {
      totalRevenue,
      totalOrders,
    },
  };
}

/**
 * 执行达人等级升级
 */
export async function upgradeInfluencerLevel(
  userId: number,
  newLevel: InfluencerLevel
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.execute(sql`
    UPDATE users
    SET influencer_level = ${newLevel}
    WHERE id = ${userId}
  `);
}

/**
 * 获取达人的升级进度
 */
export async function getInfluencerUpgradeProgress(userId: number): Promise<{
  currentLevel: InfluencerLevel;
  nextLevel?: InfluencerLevel;
  progress: {
    revenue: {
      current: number;
      required: number;
      percentage: number;
    };
    orders: {
      current: number;
      required: number;
      percentage: number;
    };
  };
}> {
  const checkResult = await checkInfluencerLevelUpgrade(userId);
  const { currentLevel, stats } = checkResult;

  // 确定下一个等级
  let nextLevel: InfluencerLevel | undefined;
  if (currentLevel === "bronze") nextLevel = "silver";
  else if (currentLevel === "silver") nextLevel = "gold";
  else if (currentLevel === "gold") nextLevel = "diamond";

  if (!nextLevel) {
    // 已经是最高等级
    return {
      currentLevel,
      progress: {
        revenue: {
          current: stats.totalRevenue,
          required: stats.totalRevenue,
          percentage: 100,
        },
        orders: {
          current: stats.totalOrders,
          required: stats.totalOrders,
          percentage: 100,
        },
      },
    };
  }

  const nextLevelRules = LEVEL_UPGRADE_RULES[nextLevel];

  return {
    currentLevel,
    nextLevel,
    progress: {
      revenue: {
        current: stats.totalRevenue,
        required: nextLevelRules.minRevenue,
        percentage: Math.min(
          100,
          (stats.totalRevenue / nextLevelRules.minRevenue) * 100
        ),
      },
      orders: {
        current: stats.totalOrders,
        required: nextLevelRules.minOrders,
        percentage: Math.min(
          100,
          (stats.totalOrders / nextLevelRules.minOrders) * 100
        ),
      },
    },
  };
}
