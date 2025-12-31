import { getDb } from "../db";
import { orders, triggerExecutions } from "../../drizzle/schema";
import { eq, and, gte, lte, sql } from "drizzle-orm";

export async function getTriggerTrends(params: {
  triggerId?: number;
  startDate?: string;
  endDate?: string;
}) {
  const { triggerId, startDate, endDate } = params;
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  const campaignPattern = triggerId ? `trigger_${triggerId}_%` : 'trigger_%';
  const conditions = [sql`${orders.campaignId} LIKE ${campaignPattern}`];

  if (startDate) conditions.push(gte(orders.createdAt, new Date(startDate)));
  if (endDate) conditions.push(lte(orders.createdAt, new Date(endDate)));

  const trends = await db
    .select({
      date: sql<string>`DATE(${orders.createdAt})`.as('date'),
      orderCount: sql<number>`COUNT(*)`.as('orderCount'),
      revenue: sql<number>`SUM(${orders.totalAmount})`.as('revenue'),
      completedOrders: sql<number>`SUM(CASE WHEN ${orders.status} = 'completed' THEN 1 ELSE 0 END)`.as('completedOrders'),
    })
    .from(orders)
    .where(and(...conditions))
    .groupBy(sql`DATE(${orders.createdAt})`)
    .orderBy(sql`DATE(${orders.createdAt})`);

  return trends.map((t: any) => ({
    date: t.date,
    orderCount: Number(t.orderCount),
    revenue: Number(t.revenue),
    completedOrders: Number(t.completedOrders),
  }));
}

export async function getTriggerExecutionTrends(params: {
  triggerId?: number;
  startDate?: string;
  endDate?: string;
}) {
  const { triggerId, startDate, endDate } = params;
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  const conditions = [];
  if (triggerId) conditions.push(eq(triggerExecutions.triggerId, triggerId));
  if (startDate) conditions.push(gte(triggerExecutions.executedAt, new Date(startDate)));
  if (endDate) conditions.push(lte(triggerExecutions.executedAt, new Date(endDate)));

  const trends = await db
    .select({
      date: sql<string>`DATE(${triggerExecutions.executedAt})`.as('date'),
      executionCount: sql<number>`COUNT(*)`.as('executionCount'),
      successCount: sql<number>`SUM(CASE WHEN ${triggerExecutions.status} = 'success' THEN 1 ELSE 0 END)`.as('successCount'),
      failCount: sql<number>`SUM(CASE WHEN ${triggerExecutions.status} = 'failed' THEN 1 ELSE 0 END)`.as('failCount'),
    })
    .from(triggerExecutions)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .groupBy(sql`DATE(${triggerExecutions.executedAt})`)
    .orderBy(sql`DATE(${triggerExecutions.executedAt})`);

  return trends.map((t: any) => ({
    date: t.date,
    executionCount: Number(t.executionCount),
    successCount: Number(t.successCount),
    failCount: Number(t.failCount),
    successRate: t.executionCount > 0 ? Math.round((Number(t.successCount) / Number(t.executionCount)) * 100) : 0,
  }));
}
