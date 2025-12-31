import { getDb } from "../db";
import { marketingTriggers, orders, userCoupons } from "../../drizzle/schema";
import { eq, sql, isNotNull } from "drizzle-orm";

export async function getGroupComparison(groupTag: string) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  const triggers = await db
    .select()
    .from(marketingTriggers)
    .where(eq(marketingTriggers.groupTag, groupTag));

  if (triggers.length === 0) return [];

  const results = await Promise.all(
    triggers.map(async (trigger) => {
      const campaignPattern = `trigger_${trigger.id}_%`;

      const orderStats = await db
        .select({
          totalOrders: sql<number>`COUNT(*)`,
          completedOrders: sql<number>`SUM(CASE WHEN ${orders.status} = 'completed' THEN 1 ELSE 0 END)`,
          totalRevenue: sql<number>`SUM(${orders.totalAmount})`,
        })
        .from(orders)
        .where(sql`${orders.campaignId} LIKE ${campaignPattern}`)
        .then(rows => rows[0]);

      const couponStats = await db
        .select({
          totalIssued: sql<number>`COUNT(*)`,
          totalUsed: sql<number>`SUM(CASE WHEN ${userCoupons.usedAt} IS NOT NULL THEN 1 ELSE 0 END)`,
        })
        .from(userCoupons)
        .where(sql`${userCoupons.campaignId} LIKE ${campaignPattern}`)
        .then(rows => rows[0]);

      const totalOrders = Number(orderStats?.totalOrders || 0);
      const completedOrders = Number(orderStats?.completedOrders || 0);
      const totalRevenue = Number(orderStats?.totalRevenue || 0);
      const totalIssued = Number(couponStats?.totalIssued || 0);
      const totalUsed = Number(couponStats?.totalUsed || 0);

      const conversionRate = totalIssued > 0 ? Math.round((totalOrders / totalIssued) * 100) : 0;
      const usageRate = totalIssued > 0 ? Math.round((totalUsed / totalIssued) * 100) : 0;
      const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

      return {
        triggerId: trigger.id,
        triggerName: trigger.name,
        orderStats: { totalOrders, completedOrders, totalRevenue, avgOrderValue },
        couponStats: { totalIssued, totalUsed, usageRate },
        conversionRate,
      };
    })
  );

  return results;
}

export async function getGroupTags() {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  const tags = await db
    .selectDistinct({ groupTag: marketingTriggers.groupTag })
    .from(marketingTriggers)
    .where(isNotNull(marketingTriggers.groupTag));

  return tags.map(t => t.groupTag).filter((tag): tag is string => tag !== null);
}
