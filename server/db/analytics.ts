/**
 * 数据分析相关的数据库查询
 */

import { getDb } from '../db';
import { orders, users, pointsHistory, orderItems, products } from '../../drizzle/schema';
import { sql, and, gte, lte, eq, desc } from 'drizzle-orm';

/**
 * 获取销售统计
 */
export async function getSalesStats(startDate?: Date, endDate?: Date) {
  const db = await getDb();
  if (!db) return null;

  const conditions = [];
  if (startDate) conditions.push(gte(orders.createdAt, startDate));
  if (endDate) conditions.push(lte(orders.createdAt, endDate));
  conditions.push(sql`${orders.status} IN ('paid', 'preparing', 'ready', 'delivering', 'completed')`);

  const [stats] = await db
    .select({
      totalOrders: sql<number>`COUNT(*)`,
      totalRevenue: sql<string>`SUM(${orders.totalAmount})`,
      avgOrderValue: sql<string>`AVG(${orders.totalAmount})`,
      totalPointsUsed: sql<number>`SUM(${orders.pointsUsed})`,
      totalCouponDiscount: sql<string>`SUM(${orders.couponDiscount})`,
    })
    .from(orders)
    .where(conditions.length > 0 ? and(...conditions) : undefined);

  return {
    totalOrders: stats?.totalOrders || 0,
    totalRevenue: parseFloat(stats?.totalRevenue || '0'),
    avgOrderValue: parseFloat(stats?.avgOrderValue || '0'),
    totalPointsUsed: stats?.totalPointsUsed || 0,
    totalCouponDiscount: parseFloat(stats?.totalCouponDiscount || '0'),
  };
}

/**
 * 获取销售趋势（按天）
 */
export async function getSalesTrend(days: number = 30) {
  const db = await getDb();
  if (!db) return [];

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const trend = await db
    .select({
      date: sql<string>`DATE(${orders.createdAt})`,
      orders: sql<number>`COUNT(*)`,
      revenue: sql<string>`SUM(${orders.totalAmount})`,
    })
    .from(orders)
    .where(
      and(
        gte(orders.createdAt, startDate),
        sql`${orders.status} IN ('paid', 'preparing', 'ready', 'delivering', 'completed')`
      )
    )
    .groupBy(sql`DATE(${orders.createdAt})`)
    .orderBy(sql`DATE(${orders.createdAt})`);

  return trend.map((item) => ({
    date: item.date,
    orders: item.orders,
    revenue: parseFloat(item.revenue || '0'),
  }));
}

/**
 * 获取用户统计
 */
export async function getUserStats() {
  const db = await getDb();
  if (!db) return null;

  const [stats] = await db
    .select({
      totalUsers: sql<number>`COUNT(*)`,
      activeUsers: sql<number>`COUNT(CASE WHEN ${users.lastSignedIn} >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 END)`,
      normalUsers: sql<number>`COUNT(CASE WHEN ${users.memberLevel} = 'normal' THEN 1 END)`,
      silverUsers: sql<number>`COUNT(CASE WHEN ${users.memberLevel} = 'silver' THEN 1 END)`,
      goldUsers: sql<number>`COUNT(CASE WHEN ${users.memberLevel} = 'gold' THEN 1 END)`,
      diamondUsers: sql<number>`COUNT(CASE WHEN ${users.memberLevel} = 'diamond' THEN 1 END)`,
    })
    .from(users);

  return {
    totalUsers: stats?.totalUsers || 0,
    activeUsers: stats?.activeUsers || 0,
    memberLevelDistribution: {
      normal: stats?.normalUsers || 0,
      silver: stats?.silverUsers || 0,
      gold: stats?.goldUsers || 0,
      diamond: stats?.diamondUsers || 0,
    },
  };
}

/**
 * 获取用户增长趋势（按天）
 */
export async function getUserGrowthTrend(days: number = 30) {
  const db = await getDb();
  if (!db) return [];

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const trend = await db
    .select({
      date: sql<string>`DATE(${users.createdAt})`,
      newUsers: sql<number>`COUNT(*)`,
    })
    .from(users)
    .where(gte(users.createdAt, startDate))
    .groupBy(sql`DATE(${users.createdAt})`)
    .orderBy(sql`DATE(${users.createdAt})`);

  return trend.map((item) => ({
    date: item.date,
    newUsers: item.newUsers,
  }));
}

/**
 * 获取积分统计
 */
export async function getPointsStats() {
  const db = await getDb();
  if (!db) return null;

  const [stats] = await db
    .select({
      totalPointsIssued: sql<number>`SUM(CASE WHEN ${pointsHistory.type} = 'earn' THEN ${pointsHistory.points} ELSE 0 END)`,
      totalPointsUsed: sql<number>`SUM(CASE WHEN ${pointsHistory.type} = 'redeem' THEN ${pointsHistory.points} ELSE 0 END)`,
      totalPointsExpired: sql<number>`SUM(CASE WHEN ${pointsHistory.type} = 'expire' THEN ${pointsHistory.points} ELSE 0 END)`,
    })
    .from(pointsHistory);

  const [userStats] = await db
    .select({
      totalAvailablePoints: sql<number>`SUM(${users.availablePoints})`,
      avgPointsPerUser: sql<string>`AVG(${users.availablePoints})`,
    })
    .from(users);

  return {
    totalPointsIssued: stats?.totalPointsIssued || 0,
    totalPointsUsed: stats?.totalPointsUsed || 0,
    totalPointsExpired: stats?.totalPointsExpired || 0,
    totalAvailablePoints: userStats?.totalAvailablePoints || 0,
    avgPointsPerUser: parseFloat(userStats?.avgPointsPerUser || '0'),
  };
}

/**
 * 获取热门商品
 */
export async function getTopProducts(limit: number = 10) {
  const db = await getDb();
  if (!db) return [];

  const topProducts = await db
    .select({
      productId: orderItems.productId,
      productName: sql<string>`MAX(${orderItems.productSnapshot}->>'$.name')`,
      totalQuantity: sql<number>`SUM(${orderItems.quantity})`,
      totalRevenue: sql<string>`SUM(${orderItems.totalPrice})`,
    })
    .from(orderItems)
    .innerJoin(orders, eq(orderItems.orderId, orders.id))
    .where(sql`${orders.status} IN ('paid', 'preparing', 'ready', 'delivering', 'completed')`)
    .groupBy(orderItems.productId)
    .orderBy(desc(sql`SUM(${orderItems.quantity})`))
    .limit(limit);

  return topProducts.map((item) => ({
    productId: item.productId,
    productName: item.productName,
    totalQuantity: item.totalQuantity,
    totalRevenue: parseFloat(item.totalRevenue || '0'),
  }));
}

/**
 * 获取订单状态分布
 */
export async function getOrderStatusDistribution() {
  const db = await getDb();
  if (!db) return [];

  const distribution = await db
    .select({
      status: orders.status,
      count: sql<number>`COUNT(*)`,
    })
    .from(orders)
    .groupBy(orders.status);

  return distribution.map((item) => ({
    status: item.status,
    count: item.count,
  }));
}

/**
 * 获取配送类型分布
 */
export async function getDeliveryTypeDistribution() {
  const db = await getDb();
  if (!db) return [];

  const distribution = await db
    .select({
      deliveryType: orders.deliveryType,
      count: sql<number>`COUNT(*)`,
    })
    .from(orders)
    .where(sql`${orders.status} IN ('paid', 'preparing', 'ready', 'delivering', 'completed')`)
    .groupBy(orders.deliveryType);

  return distribution.map((item) => ({
    deliveryType: item.deliveryType,
    count: item.count,
  }));
}
