/**
 * 评价提醒定时任务
 * 每天检查已完成但未评价的订单，发送 Telegram 提醒
 */

import { CronJob } from 'cron';
import * as db from './db';
import { sendOrderReviewReminder } from './telegram';

// 记录已发送提醒的订单，防止重复发送
const sentReminders = new Set<number>();

/**
 * 检查并发送评价提醒
 */
async function checkAndSendReviewReminders() {
  try {
    console.log('[Review Reminder] Checking for orders needing review reminders...');

    // 获取 24 小时前完成的订单
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    // 获取所有已完成但未评价的订单
    const ordersNeedingReview = await db.getOrdersNeedingReview(twentyFourHoursAgo);

    console.log(`[Review Reminder] Found ${ordersNeedingReview.length} orders needing review`);

    for (const order of ordersNeedingReview) {
      // 跳过已发送提醒的订单
      if (sentReminders.has(order.id)) {
        continue;
      }

      try {
        // 发送 Telegram 提醒
        const success = await sendOrderReviewReminder(
          order.userId,
          order.id,
          order.storeId || 0
        );

        if (success) {
          sentReminders.add(order.id);
          console.log(`[Review Reminder] Sent reminder for order ${order.id}`);
        }
      } catch (error) {
        console.error(`[Review Reminder] Failed to send reminder for order ${order.id}:`, error);
      }
    }

    console.log('[Review Reminder] Review reminder check completed');
  } catch (error) {
    console.error('[Review Reminder] Error checking review reminders:', error);
  }
}

/**
 * 启动评价提醒定时任务
 * 每天上午 10:00 执行一次
 */
export function startReviewReminderScheduler() {
  // 每天上午 10:00 执行（秒 分 时 日 月 周）
  const job = new CronJob('0 0 10 * * *', checkAndSendReviewReminders, null, true, 'Europe/Moscow');
  
  console.log('[Review Reminder] Scheduler started - will run daily at 10:00 AM');
  
  return job;
}

/**
 * 手动触发评价提醒检查（用于测试）
 */
export async function triggerReviewReminderCheck() {
  console.log('[Review Reminder] Manual trigger initiated');
  await checkAndSendReviewReminders();
  return { success: true, message: 'Review reminder check completed' };
}
