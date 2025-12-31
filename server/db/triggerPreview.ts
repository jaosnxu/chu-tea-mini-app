import { getDb } from "../db";
import { users, orders, couponTemplates } from "../../drizzle/schema";
import { sql, and, gte, lt, eq } from "drizzle-orm";

export async function previewTriggerExecution(params: {
  triggerType: string;
  triggerCondition: any;
  actionType: string;
  actionParams: any;
}) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  const { triggerType, triggerCondition, actionType, actionParams } = params;

  let targetUsers: any[] = [];
  let estimatedCost = 0;
  let estimatedCouponCount = 0;

  // 根据触发类型查询符合条件的用户
  if (triggerType === 'user_register') {
    // 新用户注册（最近注册的用户）
    const recentUsers = await db
      .select({ id: users.id, name: users.name })
      .from(users)
      .orderBy(sql`${users.createdAt} DESC`)
      .limit(100);
    targetUsers = recentUsers;

  } else if (triggerType === 'user_churn') {
    // 流失用户（N天未下单）
    const days = triggerCondition?.days || 7;
    const churnDate = new Date();
    churnDate.setDate(churnDate.setDate(churnDate.getDate() - days));

    const churnUsers = await db
      .select({
        id: users.id,
        name: users.name,
        lastOrderDate: sql<Date>`MAX(${orders.createdAt})`.as('lastOrderDate'),
      })
      .from(users)
      .leftJoin(orders, eq(users.id, orders.userId))
      .groupBy(users.id, users.name)
      .having(sql`MAX(${orders.createdAt}) < ${churnDate} OR MAX(${orders.createdAt}) IS NULL`)
      .limit(100);
    targetUsers = churnUsers;

  } else if (triggerType === 'user_birthday') {
    // 生日用户（今天是注册纪念日）
    const today = new Date();
    const month = today.getMonth() + 1;
    const day = today.getDate();

    const birthdayUsers = await db
      .select({ id: users.id, name: users.name })
      .from(users)
      .where(
        and(
          sql`MONTH(${users.createdAt}) = ${month}`,
          sql`DAY(${users.createdAt}) = ${day}`
        )
      )
      .limit(100);
    targetUsers = birthdayUsers;

  } else if (triggerType === 'order_completed') {
    // 订单完成（最近完成的订单用户）
    const recentOrders = await db
      .select({
        userId: orders.userId,
        userName: users.name,
      })
      .from(orders)
      .leftJoin(users, eq(orders.userId, users.id))
      .where(eq(orders.status, 'completed'))
      .orderBy(sql`${orders.createdAt} DESC`)
      .limit(100);
    targetUsers = recentOrders.map((o: any) => ({ id: o.userId, name: o.userName }));

  } else if (triggerType === 'high_value_user') {
    // 高价值用户（总消费超过阈值）
    const threshold = triggerCondition?.threshold || 1000;
    const highValueUsers = await db
      .select({
        id: users.id,
        name: users.name,
        totalSpent: sql<number>`SUM(${orders.totalAmount})`.as('totalSpent'),
      })
      .from(users)
      .leftJoin(orders, eq(users.id, orders.userId))
      .groupBy(users.id, users.name)
      .having(sql`SUM(${orders.totalAmount}) >= ${threshold}`)
      .limit(100);
    targetUsers = highValueUsers;
  }

  // 计算预估成本
  if (actionType === 'send_coupon') {
    const couponTemplateId = actionParams?.couponTemplateId;
    if (couponTemplateId) {
      const couponTemplate = await db
        .select()
        .from(couponTemplates)
        .where(eq(couponTemplates.id, couponTemplateId))
        .limit(1);

      if (couponTemplate.length > 0) {
        const couponValue = Number(couponTemplate[0].value);
        estimatedCouponCount = targetUsers.length;
        estimatedCost = couponValue * estimatedCouponCount;
      }
    }
  }

  return {
    targetUserCount: targetUsers.length,
    targetUsers: targetUsers.slice(0, 10), // 只返回前10个用户作为示例
    estimatedCouponCount,
    estimatedCost,
    summary: {
      triggerType,
      actionType,
      willAffectUsers: targetUsers.length,
      estimatedBudget: estimatedCost,
    },
  };
}
