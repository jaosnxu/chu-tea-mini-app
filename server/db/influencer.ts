import { eq, and, desc, sql, gte, lte } from "drizzle-orm";
import { getDb } from "../db";
import {
  influencerCampaigns,
  influencerTasks,
  influencerEarnings,
  withdrawalRequests,
  linkClicks,
  orderAttribution,
  users,
  type InsertInfluencerCampaign,
  type InsertInfluencerTask,
  type InsertInfluencerEarning,
  type InsertWithdrawalRequest,
  type InsertLinkClick,
  type InsertOrderAttribution,
} from "../../drizzle/schema";

// ==================== 达人管理 ====================

/**
 * 申请成为达人
 */
export async function applyInfluencer(userId: number, data: {
  influencerCode: string;
  followerCount?: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const [result] = await db
    .update(users)
    .set({
      isInfluencer: true,
      influencerCode: data.influencerCode,
      followerCount: data.followerCount || 0,
      influencerLevel: "bronze",
    })
    .where(eq(users.id, userId));
  
  return result;
}

/**
 * 获取达人信息
 */
export async function getInfluencerInfo(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const [user] = await db
    .select()
    .from(users)
    .where(and(eq(users.id, userId), eq(users.isInfluencer, true)));
  
  return user;
}

/**
 * 更新达人等级
 */
export async function updateInfluencerLevel(
  userId: number,
  level: "bronze" | "silver" | "gold" | "diamond"
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const [result] = await db
    .update(users)
    .set({ influencerLevel: level })
    .where(eq(users.id, userId));
  
  return result;
}

/**
 * 获取所有达人列表（管理员）
 */
export async function getAllInfluencers() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db
    .select()
    .from(users)
    .where(eq(users.isInfluencer, true))
    .orderBy(desc(users.totalEarnings));
  
  return result;
}

// ==================== 活动管理 ====================

/**
 * 创建达人活动
 */
export async function createCampaign(data: InsertInfluencerCampaign) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const [result] = await db.insert(influencerCampaigns).values(data);
  return result.insertId;
}

/**
 * 获取活动详情
 */
export async function getCampaignById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const [campaign] = await db
    .select()
    .from(influencerCampaigns)
    .where(eq(influencerCampaigns.id, id));
  
  return campaign;
}

/**
 * 获取所有活动列表
 */
export async function getAllCampaigns(status?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  if (status) {
    const result = await db
      .select()
      .from(influencerCampaigns)
      .where(eq(influencerCampaigns.status, status as any))
      .orderBy(desc(influencerCampaigns.createdAt));
    return result;
  }
  
  const result = await db
    .select()
    .from(influencerCampaigns)
    .orderBy(desc(influencerCampaigns.createdAt));
  return result;
}

/**
 * 获取活跃的活动列表
 */
export async function getActiveCampaigns() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const now = new Date();
  const campaigns = await db
    .select()
    .from(influencerCampaigns)
    .where(
      and(
        eq(influencerCampaigns.status, "active"),
        lte(influencerCampaigns.startDate, now),
        gte(influencerCampaigns.endDate, now)
      )
    )
    .orderBy(desc(influencerCampaigns.startDate));
  
  return campaigns;
}

/**
 * 更新活动
 */
export async function updateCampaign(id: number, data: Partial<InsertInfluencerCampaign>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const [result] = await db
    .update(influencerCampaigns)
    .set(data)
    .where(eq(influencerCampaigns.id, id));
  
  return result;
}

/**
 * 删除活动
 */
export async function deleteCampaign(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const [result] = await db
    .delete(influencerCampaigns)
    .where(eq(influencerCampaigns.id, id));
  
  return result;
}

// ==================== 任务管理 ====================

/**
 * 达人接受任务
 */
export async function acceptTask(userId: number, campaignId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const [result] = await db.insert(influencerTasks).values({
    userId,
    campaignId,
    status: "in_progress",
  });
  
  // 更新活动参与人数
  await db
    .update(influencerCampaigns)
    .set({
      totalParticipants: sql`${influencerCampaigns.totalParticipants} + 1`,
    })
    .where(eq(influencerCampaigns.id, campaignId));
  
  return result.insertId;
}

/**
 * 获取达人的任务列表
 */
export async function getInfluencerTasks(userId: number, status?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  if (status) {
    const result = await db
      .select()
      .from(influencerTasks)
      .where(
        and(
          eq(influencerTasks.userId, userId),
          eq(influencerTasks.status, status as any)
        )
      )
      .orderBy(desc(influencerTasks.createdAt));
    return result;
  }
  
  const result = await db
    .select()
    .from(influencerTasks)
    .where(eq(influencerTasks.userId, userId))
    .orderBy(desc(influencerTasks.createdAt));
  return result;
}

/**
 * 提交任务作品
 */
export async function submitTask(taskId: number, content: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const [result] = await db
    .update(influencerTasks)
    .set({
      status: "submitted",
      submittedContent: content,
      submittedAt: new Date(),
    })
    .where(eq(influencerTasks.id, taskId));
  
  return result;
}

/**
 * 审核任务（管理员）
 */
export async function reviewTask(
  taskId: number,
  reviewedBy: number,
  approved: boolean,
  notes?: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const status = approved ? "approved" : "rejected";
  
  const [result] = await db
    .update(influencerTasks)
    .set({
      status,
      reviewedBy,
      reviewedAt: new Date(),
      reviewNotes: notes,
    })
    .where(eq(influencerTasks.id, taskId));
  
  return result;
}

// ==================== 收益管理 ====================

/**
 * 创建收益记录
 */
export async function createEarning(data: InsertInfluencerEarning) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const [result] = await db.insert(influencerEarnings).values(data);
  
  // 更新用户总收益和可用余额
  await db
    .update(users)
    .set({
      totalEarnings: sql`${users.totalEarnings} + ${data.amount}`,
      availableBalance: sql`${users.availableBalance} + ${data.amount}`,
    })
    .where(eq(users.id, data.userId));
  
  return result.insertId;
}

/**
 * 获取达人收益列表
 */
export async function getInfluencerEarnings(userId: number, status?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  if (status) {
    const result = await db
      .select()
      .from(influencerEarnings)
      .where(
        and(
          eq(influencerEarnings.userId, userId),
          eq(influencerEarnings.status, status as any)
        )
      )
      .orderBy(desc(influencerEarnings.createdAt));
    return result;
  }
  
  const result = await db
    .select()
    .from(influencerEarnings)
    .where(eq(influencerEarnings.userId, userId))
    .orderBy(desc(influencerEarnings.createdAt));
  return result;
}

/**
 * 获取达人收益统计
 */
export async function getInfluencerEarningsStats(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const [stats] = await db
    .select({
      totalEarnings: sql<number>`COALESCE(SUM(${influencerEarnings.amount}), 0)`,
      totalOrders: sql<number>`COUNT(DISTINCT ${influencerEarnings.orderId})`,
      pendingAmount: sql<number>`COALESCE(SUM(CASE WHEN ${influencerEarnings.status} = 'pending' THEN ${influencerEarnings.amount} ELSE 0 END), 0)`,
      confirmedAmount: sql<number>`COALESCE(SUM(CASE WHEN ${influencerEarnings.status} = 'confirmed' THEN ${influencerEarnings.amount} ELSE 0 END), 0)`,
      paidAmount: sql<number>`COALESCE(SUM(CASE WHEN ${influencerEarnings.status} = 'paid' THEN ${influencerEarnings.amount} ELSE 0 END), 0)`,
    })
    .from(influencerEarnings)
    .where(eq(influencerEarnings.userId, userId));
  
  return stats;
}

// ==================== 提现管理 ====================

/**
 * 创建提现申请
 */
export async function createWithdrawal(data: InsertWithdrawalRequest) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // 检查余额是否足够
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, data.userId));
  
  if (!user || parseFloat(user.availableBalance || "0") < parseFloat(data.amount.toString())) {
    throw new Error("余额不足");
  }
  
  // 创建提现申请
  const [result] = await db.insert(withdrawalRequests).values(data);
  
  // 扣除可用余额
  await db
    .update(users)
    .set({
      availableBalance: sql`${users.availableBalance} - ${data.amount}`,
    })
    .where(eq(users.id, data.userId));
  
  return result.insertId;
}

/**
 * 获取提现申请列表
 */
export async function getWithdrawalRequests(userId?: number, status?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  if (userId && status) {
    const result = await db
      .select()
      .from(withdrawalRequests)
      .where(
        and(
          eq(withdrawalRequests.userId, userId),
          eq(withdrawalRequests.status, status as any)
        )
      )
      .orderBy(desc(withdrawalRequests.createdAt));
    return result;
  } else if (userId) {
    const result = await db
      .select()
      .from(withdrawalRequests)
      .where(eq(withdrawalRequests.userId, userId))
      .orderBy(desc(withdrawalRequests.createdAt));
    return result;
  } else if (status) {
    const result = await db
      .select()
      .from(withdrawalRequests)
      .where(eq(withdrawalRequests.status, status as any))
      .orderBy(desc(withdrawalRequests.createdAt));
    return result;
  }
  
  const result = await db
    .select()
    .from(withdrawalRequests)
    .orderBy(desc(withdrawalRequests.createdAt));
  return result;
}

/**
 * 审核提现申请（管理员）
 */
export async function reviewWithdrawal(
  withdrawalId: number,
  reviewedBy: number,
  approved: boolean,
  notes?: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const status = approved ? "processing" : "rejected";
  
  // 如果拒绝，退回余额
  if (!approved) {
    const [withdrawal] = await db
      .select()
      .from(withdrawalRequests)
      .where(eq(withdrawalRequests.id, withdrawalId));
    
    if (withdrawal) {
      await db
        .update(users)
        .set({
          availableBalance: sql`${users.availableBalance} + ${withdrawal.amount}`,
        })
        .where(eq(users.id, withdrawal.userId));
    }
  }
  
  const [result] = await db
    .update(withdrawalRequests)
    .set({
      status,
      reviewedBy,
      reviewedAt: new Date(),
      reviewNotes: notes,
    })
    .where(eq(withdrawalRequests.id, withdrawalId));
  
  return result;
}

/**
 * 完成提现打款（管理员）
 */
export async function completeWithdrawal(
  withdrawalId: number,
  transactionId: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const [withdrawal] = await db
    .select()
    .from(withdrawalRequests)
    .where(eq(withdrawalRequests.id, withdrawalId));
  
  if (!withdrawal) {
    throw new Error("提现申请不存在");
  }
  
  // 更新提现状态
  const [result] = await db
    .update(withdrawalRequests)
    .set({
      status: "completed",
      transactionId,
      paidAt: new Date(),
    })
    .where(eq(withdrawalRequests.id, withdrawalId));
  
  // 更新用户已提现金额
  await db
    .update(users)
    .set({
      totalWithdrawn: sql`${users.totalWithdrawn} + ${withdrawal.amount}`,
    })
    .where(eq(users.id, withdrawal.userId));
  
  return result;
}

// ==================== 链接追踪 ====================

/**
 * 生成达人专属链接代码
 */
export function generateLinkCode(userId: number, campaignId?: number): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `${userId}-${timestamp}-${random}`;
}

/**
 * 记录链接点击
 */
export async function recordLinkClick(data: InsertLinkClick) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const [result] = await db.insert(linkClicks).values(data);
  return result.insertId;
}

/**
 * 获取链接点击统计
 */
export async function getLinkClickStats(influencerId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const [stats] = await db
    .select({
      totalClicks: sql<number>`COUNT(*)`,
      uniqueClicks: sql<number>`COUNT(DISTINCT ${linkClicks.ipAddress})`,
      conversions: sql<number>`SUM(CASE WHEN ${linkClicks.isConverted} = 1 THEN 1 ELSE 0 END)`,
      conversionRate: sql<number>`(COALESCE(SUM(CASE WHEN ${linkClicks.isConverted} = 1 THEN 1 ELSE 0 END), 0) * 100.0 / NULLIF(COUNT(*), 0))`,
    })
    .from(linkClicks)
    .where(eq(linkClicks.influencerId, influencerId));
  
  return stats;
}

// ==================== 订单归因 ====================

/**
 * 创建订单归因记录
 */
export async function createOrderAttribution(data: InsertOrderAttribution) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const [result] = await db.insert(orderAttribution).values(data);
  return result.insertId;
}

/**
 * 获取订单归因信息
 */
export async function getOrderAttribution(orderId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const [attribution] = await db
    .select()
    .from(orderAttribution)
    .where(eq(orderAttribution.orderId, orderId));
  
  return attribution;
}

/**
 * 获取达人的订单归因列表
 */
export async function getInfluencerOrderAttributions(influencerId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db
    .select()
    .from(orderAttribution)
    .where(eq(orderAttribution.influencerId, influencerId))
    .orderBy(desc(orderAttribution.createdAt));
  
  return result;
}

/**
 * 获取达人排行榜
 */
export async function getInfluencerRanking(limit: number = 10) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db
    .select({
      userId: users.id,
      name: users.name,
      avatar: users.avatar,
      influencerLevel: users.influencerLevel,
      totalOrders: sql<number>`COUNT(DISTINCT ${orderAttribution.orderId})`,
      totalRevenue: sql<number>`COALESCE(SUM(${orderAttribution.orderAmount}), 0)`,
      totalCommission: sql<number>`COALESCE(SUM(${orderAttribution.commissionAmount}), 0)`,
      conversionRate: users.conversionRate,
    })
    .from(users)
    .leftJoin(orderAttribution, eq(users.id, orderAttribution.influencerId))
    .where(eq(users.isInfluencer, true))
    .groupBy(users.id)
    .orderBy(desc(sql`totalRevenue`))
    .limit(limit);
  
  return result;
}
