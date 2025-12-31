import cron from 'node-cron';
import { getMarketingTriggers } from './db';
import { TriggerEngine } from './triggerEngine';

/**
 * 定时任务调度器
 * 负责定期检查流失用户、生日用户等，并触发相应的营销活动
 */
export class CronScheduler {
  private static instance: CronScheduler;
  private tasks: any[] = [];
  private triggerEngine: TriggerEngine;

  private constructor() {
    this.triggerEngine = TriggerEngine.getInstance();
  }

  public static getInstance(): CronScheduler {
    if (!CronScheduler.instance) {
      CronScheduler.instance = new CronScheduler();
    }
    return CronScheduler.instance;
  }

  /**
   * 启动所有定时任务
   */
  public start(): void {
    console.log('[CronScheduler] Starting cron scheduler...');

    // 每天凌晨2点检查流失用户
    this.scheduleChurnedUsersCheck();

    // 每天凌晨1点检查生日用户
    this.scheduleBirthdayUsersCheck();

    // 每小时检查定时触发器
    this.scheduleTimedTriggers();

    console.log(`[CronScheduler] ${this.tasks.length} tasks scheduled`);
  }

  /**
   * 停止所有定时任务
   */
  public stop(): void {
    console.log('[CronScheduler] Stopping all cron tasks...');
    this.tasks.forEach(task => task.stop());
    this.tasks = [];
  }

  /**
   * 检查流失用户（N天未购买）
   */
  private scheduleChurnedUsersCheck(): void {
    // 每天凌晨2点执行
    const task = cron.schedule('0 2 * * *', async () => {
      try {
        console.log('[CronScheduler] Checking churned users...');
        
        // 查找所有流失触发器
        const triggers = await getMarketingTriggers({ isActive: true });
        const churnTriggers = triggers.filter(t => 
          t.triggerType === 'user_churn' || t.triggerType === 'user_inactive'
        );

        console.log(`[CronScheduler] Found ${churnTriggers.length} churn triggers`);

        // 对每个流失触发器执行检查
        for (const trigger of churnTriggers) {
          try {
            const inactiveDays = (trigger.conditions as any)?.inactiveDays || 7;
            
            // 查询流失用户（N天未下单）
            const { getDb } = await import('./db');
            const db = await getDb();
            if (!db) continue;
            
            const { users, orders } = await import('../drizzle/schema');
            const { sql, and, lt, isNull } = await import('drizzle-orm');
            
            // 计算截止日期
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - inactiveDays);
            
            // 查找流失用户：最后一次订单时间早于截止日期
            const inactiveUsers = await db
              .select({
                userId: users.id,
                lastOrderDate: sql<Date>`MAX(${orders.createdAt})`,
              })
              .from(users)
              .leftJoin(orders, sql`${users.id} = ${orders.userId}`)
              .groupBy(users.id)
              .having(sql`MAX(${orders.createdAt}) < ${cutoffDate.toISOString()} OR MAX(${orders.createdAt}) IS NULL`);
            
            console.log(`[CronScheduler] Found ${inactiveUsers.length} inactive users for trigger ${trigger.id}`);
            
            // 为每个流失用户触发营销动作
            for (const user of inactiveUsers) {
              await this.triggerEngine.handleUserChurn(user.userId, inactiveDays);
            }
          } catch (error) {
            console.error(`[CronScheduler] Error processing churn trigger ${trigger.id}:`, error);
          }
        }
        
      } catch (error) {
        console.error('[CronScheduler] Error checking churned users:', error);
      }
    });

    this.tasks.push(task);
    console.log('[CronScheduler] Churned users check scheduled (daily at 2:00 AM)');
  }

  /**
   * 检查生日用户
   */
  private scheduleBirthdayUsersCheck(): void {
    // 每天凌晨1点执行
    const task = cron.schedule('0 1 * * *', async () => {
      try {
        console.log('[CronScheduler] Checking birthday users...');
        
        // 查找所有生日触发器
        const triggers = await getMarketingTriggers({ isActive: true });
        const birthdayTriggers = triggers.filter(t => 
          t.triggerType === 'user_birthday' || t.triggerType === 'birthday'
        );

        console.log(`[CronScheduler] Found ${birthdayTriggers.length} birthday triggers`);

        if (birthdayTriggers.length === 0) return;

        // 注意：users 表没有 birthday 字段，这里使用注册纪念日作为替代
        // 查询今天是注册纪念日的用户
        const { getDb } = await import('./db');
        const db = await getDb();
        if (!db) return;
        
        const { users } = await import('../drizzle/schema');
        const { sql } = await import('drizzle-orm');
        
        // 获取今天的月份和日期
        const today = new Date();
        const month = today.getMonth() + 1; // 0-11 -> 1-12
        const day = today.getDate();
        
        // 查找今天是注册纪念日的用户（使用 createdAt 字段）
        const anniversaryUsers = await db
          .select({
            userId: users.id,
            createdAt: users.createdAt,
          })
          .from(users)
          .where(
            sql`MONTH(${users.createdAt}) = ${month} AND DAY(${users.createdAt}) = ${day}`
          );
        
        console.log(`[CronScheduler] Found ${anniversaryUsers.length} anniversary users today (registration anniversary)`);
        
        // 为每个纪念日用户触发营销动作
        for (const user of anniversaryUsers) {
          try {
            await this.triggerEngine.handleUserBirthday(user.userId);
          } catch (error) {
            console.error(`[CronScheduler] Error processing anniversary for user ${user.userId}:`, error);
          }
        }
        
      } catch (error) {
        console.error('[CronScheduler] Error checking birthday users:', error);
      }
    });

    this.tasks.push(task);
    console.log('[CronScheduler] Birthday users check scheduled (daily at 1:00 AM)');
  }

  /**
   * 检查定时触发器（按配置的时间执行）
   */
  private scheduleTimedTriggers(): void {
    // 每小时检查一次
    const task = cron.schedule('0 * * * *', async () => {
      try {
        console.log('[CronScheduler] Checking timed triggers...');
        
        const now = new Date();
        const currentHour = now.getHours();

        // 查找所有时间触发器
        const triggers = await getMarketingTriggers({ isActive: true });
        const timedTriggers = triggers.filter(t => 
          t.triggerType === 'scheduled_time' || t.triggerType === 'time_based'
        );

        console.log(`[CronScheduler] Found ${timedTriggers.length} timed triggers`);

        // TODO: 实现定时触发器匹配和执行逻辑
        // 这里需要检查触发器的时间条件是否匹配当前时间
        // 然后为符合条件的用户执行触发器
        
      } catch (error) {
        console.error('[CronScheduler] Error checking timed triggers:', error);
      }
    });

    this.tasks.push(task);
    console.log('[CronScheduler] Timed triggers check scheduled (hourly)');
  }
}
