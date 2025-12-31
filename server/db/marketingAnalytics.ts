/**
 * 营销效果分析模块
 * 用于追踪和分析营销活动（触发器）的效果
 */

import { getDb } from '../db';
import { orders, userCoupons } from '../../drizzle/schema';
import { eq, and, sql, gte, lte } from 'drizzle-orm';

/**
 * 获取营销活动效果统计
 */
export async function getCampaignStats(params: {
  campaignId?: string;
  triggerId?: number;
  startDate?: Date;
  endDate?: Date;
}) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  const conditions: any[] = [];

  // 如果提供了 campaignId，直接使用
  if (params.campaignId) {
    conditions.push(eq(orders.campaignId, params.campaignId));
  }
  
  // 如果提供了 triggerId，匹配 campaignId 格式（trigger_{id}_*）
  if (params.triggerId) {
    conditions.push(sql`${orders.campaignId} LIKE ${`trigger_${params.triggerId}_%`}`);
  }

  if (params.startDate) {
    conditions.push(gte(orders.createdAt, params.startDate));
  }

  if (params.endDate) {
    conditions.push(lte(orders.createdAt, params.endDate));
  }

  // 统计订单数据
  const orderStats = await db
    .select({
      totalOrders: sql<number>`COUNT(*)`,
      totalRevenue: sql<number>`SUM(${orders.totalAmount})`,
      avgOrderValue: sql<number>`AVG(${orders.totalAmount})`,
      completedOrders: sql<number>`SUM(CASE WHEN ${orders.status} = 'completed' THEN 1 ELSE 0 END)`,
    })
    .from(orders)
    .where(conditions.length > 0 ? and(...conditions) : undefined);

  const stats = orderStats[0] || {
    totalOrders: 0,
    totalRevenue: 0,
    avgOrderValue: 0,
    completedOrders: 0,
  };

  return {
    totalOrders: Number(stats.totalOrders) || 0,
    totalRevenue: Number(stats.totalRevenue) || 0,
    avgOrderValue: Number(stats.avgOrderValue) || 0,
    completedOrders: Number(stats.completedOrders) || 0,
    completionRate: stats.totalOrders > 0 
      ? ((Number(stats.completedOrders) / Number(stats.totalOrders)) * 100).toFixed(2)
      : '0.00',
  };
}

/**
 * 获取优惠券发放和使用统计
 */
export async function getCouponCampaignStats(params: {
  campaignId?: string;
  triggerId?: number;
  startDate?: Date;
  endDate?: Date;
}) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  const conditions: any[] = [];

  if (params.campaignId) {
    conditions.push(eq(userCoupons.campaignId, params.campaignId));
  }
  
  if (params.triggerId) {
    conditions.push(sql`${userCoupons.campaignId} LIKE ${`trigger_${params.triggerId}_%`}`);
  }

  if (params.startDate) {
    conditions.push(gte(userCoupons.createdAt, params.startDate));
  }

  if (params.endDate) {
    conditions.push(lte(userCoupons.createdAt, params.endDate));
  }

  const couponStats = await db
    .select({
      totalIssued: sql<number>`COUNT(*)`,
      totalUsed: sql<number>`SUM(CASE WHEN ${userCoupons.status} = 'used' THEN 1 ELSE 0 END)`,
      totalExpired: sql<number>`SUM(CASE WHEN ${userCoupons.status} = 'expired' THEN 1 ELSE 0 END)`,
    })
    .from(userCoupons)
    .where(conditions.length > 0 ? and(...conditions) : undefined);

  const stats = couponStats[0] || {
    totalIssued: 0,
    totalUsed: 0,
    totalExpired: 0,
  };

  return {
    totalIssued: Number(stats.totalIssued) || 0,
    totalUsed: Number(stats.totalUsed) || 0,
    totalExpired: Number(stats.totalExpired) || 0,
    usageRate: stats.totalIssued > 0
      ? ((Number(stats.totalUsed) / Number(stats.totalIssued)) * 100).toFixed(2)
      : '0.00',
  };
}

/**
 * 获取触发器综合效果统计
 */
export async function getTriggerPerformance(triggerId: number, params?: {
  startDate?: Date;
  endDate?: Date;
}) {
  // 获取订单统计
  const orderStats = await getCampaignStats({
    triggerId,
    startDate: params?.startDate,
    endDate: params?.endDate,
  });

  // 获取优惠券统计
  const couponStats = await getCouponCampaignStats({
    triggerId,
    startDate: params?.startDate,
    endDate: params?.endDate,
  });

  // 计算 ROI（假设优惠券成本为折扣金额）
  const roi = couponStats.totalIssued > 0
    ? (orderStats.totalRevenue / couponStats.totalIssued).toFixed(2)
    : '0.00';

  return {
    triggerId,
    orderStats,
    couponStats,
    roi, // 每张优惠券带来的收入
    conversionRate: couponStats.totalIssued > 0
      ? ((orderStats.totalOrders / couponStats.totalIssued) * 100).toFixed(2)
      : '0.00', // 优惠券转化为订单的比例
  };
}

/**
 * 获取所有触发器的效果排名
 */
export async function getTriggerPerformanceRanking(params?: {
  startDate?: Date;
  endDate?: Date;
  limit?: number;
}) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  const conditions: any[] = [
    sql`${orders.campaignId} IS NOT NULL`,
    sql`${orders.campaignId} LIKE 'trigger_%'`,
  ];

  if (params?.startDate) {
    conditions.push(gte(orders.createdAt, params.startDate));
  }

  if (params?.endDate) {
    conditions.push(lte(orders.createdAt, params.endDate));
  }

  // 按 campaignId 分组统计
  let query = db
    .select({
      campaignId: orders.campaignId,
      totalOrders: sql<number>`COUNT(*)`,
      totalRevenue: sql<number>`SUM(${orders.totalAmount})`,
      avgOrderValue: sql<number>`AVG(${orders.totalAmount})`,
    })
    .from(orders)
    .where(and(...conditions))
    .groupBy(orders.campaignId)
    .orderBy(sql`SUM(${orders.totalAmount}) DESC`);

  if (params?.limit) {
    query = query.limit(params.limit) as typeof query;
  }

  return await query;
}
