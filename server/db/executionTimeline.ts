import { getDb } from "../db";
import { triggerExecutions, marketingTriggers, orders } from "../../drizzle/schema";
import { eq, and, gte, sql } from "drizzle-orm";

export async function getExecutionTimeline(days: number = 30) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  // 获取每日执行统计
  const timeline = await db
    .select({
      date: sql<string>`DATE(${triggerExecutions.executedAt})`.as('date'),
      totalExecutions: sql<number>`COUNT(*)`.as('totalExecutions'),
      successCount: sql<number>`SUM(CASE WHEN ${triggerExecutions.status} = 'success' THEN 1 ELSE 0 END)`.as('successCount'),
      failCount: sql<number>`SUM(CASE WHEN ${triggerExecutions.status} = 'failed' THEN 1 ELSE 0 END)`.as('failCount'),
    })
    .from(triggerExecutions)
    .where(gte(triggerExecutions.executedAt, startDate))
    .groupBy(sql`DATE(${triggerExecutions.executedAt})`)
    .orderBy(sql`DATE(${triggerExecutions.executedAt}) DESC`);

  // 获取每日收入统计
  const revenueStats = await db
    .select({
      date: sql<string>`DATE(${orders.createdAt})`.as('date'),
      revenue: sql<number>`SUM(${orders.totalAmount})`.as('revenue'),
      orderCount: sql<number>`COUNT(*)`.as('orderCount'),
    })
    .from(orders)
    .where(and(
      gte(orders.createdAt, startDate),
      sql`${orders.campaignId} LIKE 'trigger_%'`
    ))
    .groupBy(sql`DATE(${orders.createdAt})`);

  // 合并数据
  const revenueMap = new Map(revenueStats.map(r => [r.date, r]));

  return timeline.map((t: any) => {
    const revenue = revenueMap.get(t.date);
    return {
      date: t.date,
      totalExecutions: Number(t.totalExecutions),
      successCount: Number(t.successCount),
      failCount: Number(t.failCount),
      successRate: t.totalExecutions > 0 ? Math.round((Number(t.successCount) / Number(t.totalExecutions)) * 100) : 0,
      revenue: revenue ? Number(revenue.revenue) : 0,
      orderCount: revenue ? Number(revenue.orderCount) : 0,
    };
  });
}

export async function getDateExecutionDetails(date: string) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  const startDate = new Date(date);
  const endDate = new Date(date);
  endDate.setDate(endDate.getDate() + 1);

  // 获取当天的触发器执行统计
  const executions = await db
    .select({
      triggerId: triggerExecutions.triggerId,
      triggerName: marketingTriggers.name,
      executionCount: sql<number>`COUNT(*)`.as('executionCount'),
      successCount: sql<number>`SUM(CASE WHEN ${triggerExecutions.status} = 'success' THEN 1 ELSE 0 END)`.as('successCount'),
    })
    .from(triggerExecutions)
    .leftJoin(marketingTriggers, eq(triggerExecutions.triggerId, marketingTriggers.id))
    .where(and(
      gte(triggerExecutions.executedAt, startDate),
      sql`${triggerExecutions.executedAt} < ${endDate}`
    ))
    .groupBy(triggerExecutions.triggerId, marketingTriggers.name);

  return executions.map((e: any) => ({
    triggerId: e.triggerId,
    triggerName: e.triggerName || `触发器 #${e.triggerId}`,
    executionCount: Number(e.executionCount),
    successCount: Number(e.successCount),
    successRate: e.executionCount > 0 ? Math.round((Number(e.successCount) / Number(e.executionCount)) * 100) : 0,
  }));
}
