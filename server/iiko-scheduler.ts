import { processOrderQueue } from "./iiko-queue-processor.js";
import { syncAllMenus } from "./iiko-menu-sync.js";

/**
 * IIKO 订单和菜单同步定时任务调度器
 * - 订单同步：每分钟检查一次订单队列并处理待同步订单
 * - 菜单同步：每小时同步一次菜单数据
 */

let orderSyncInterval: NodeJS.Timeout | null = null;
let menuSyncInterval: NodeJS.Timeout | null = null;
let isProcessingOrders = false;
let isProcessingMenus = false;

const ORDER_SYNC_INTERVAL_MS = 60 * 1000; // 1 minute
const MENU_SYNC_INTERVAL_MS = 60 * 60 * 1000; // 1 hour

/**
 * 启动定时任务调度器
 */
export function startScheduler() {
  if (orderSyncInterval) {
    console.log("[IIKO Scheduler] Scheduler is already running");
    return;
  }

  console.log("[IIKO Scheduler] Starting order sync scheduler (interval: 1 minute)");
  console.log("[IIKO Scheduler] Starting menu sync scheduler (interval: 1 hour)");

  // 立即执行一次订单同步
  processQueueSafely();

  // 设置订单同步定时任务（1分钟）
  orderSyncInterval = setInterval(() => {
    processQueueSafely();
  }, ORDER_SYNC_INTERVAL_MS);

  // 立即执行一次菜单同步
  processMenuSyncSafely();

  // 设置菜单同步定时任务（1小时）
  menuSyncInterval = setInterval(() => {
    processMenuSyncSafely();
  }, MENU_SYNC_INTERVAL_MS);
}

/**
 * 停止定时任务调度器
 */
export function stopScheduler() {
  if (orderSyncInterval) {
    clearInterval(orderSyncInterval);
    orderSyncInterval = null;
    console.log("[IIKO Scheduler] Order sync scheduler stopped");
  }

  if (menuSyncInterval) {
    clearInterval(menuSyncInterval);
    menuSyncInterval = null;
    console.log("[IIKO Scheduler] Menu sync scheduler stopped");
  }
}

/**
 * 安全地处理订单队列（避免并发执行）
 */
async function processQueueSafely() {
  if (isProcessingOrders) {
    console.log("[IIKO Scheduler] Previous order processing is still running, skipping");
    return;
  }

  isProcessingOrders = true;

  try {
    const result = await processOrderQueue();

    if (result.processed > 0) {
      console.log(
        `[IIKO Scheduler] Processed ${result.processed} orders: ${result.succeeded} succeeded, ${result.failed} failed`
      );

      if (result.errors.length > 0) {
        console.error(
          `[IIKO Scheduler] Errors:`,
          result.errors.map((e) => `Order ${e.orderId}: ${e.error}`).join(", ")
        );
      }
    }
  } catch (error) {
    console.error("[IIKO Scheduler] Error processing queue:", error);
  } finally {
    isProcessingOrders = false;
  }
}

/**
 * 安全地同步菜单（避免并发执行）
 */
async function processMenuSyncSafely() {
  if (isProcessingMenus) {
    console.log("[IIKO Scheduler] Previous menu sync is still running, skipping");
    return;
  }

  isProcessingMenus = true;

  try {
    const result = await syncAllMenus();

    if (result.total > 0) {
      console.log(
        `[IIKO Scheduler] Menu sync completed: ${result.succeeded} succeeded, ${result.failed} failed`
      );

      if (result.failed > 0) {
        console.error(
          `[IIKO Scheduler] Failed configs:`,
          result.results
            .filter((r) => !r.success)
            .map((r) => `${r.storeName}: ${r.errorMessage}`)
            .join(", ")
        );
      }
    }
  } catch (error) {
    console.error("[IIKO Scheduler] Error syncing menus:", error);
  } finally {
    isProcessingMenus = false;
  }
}

/**
 * 手动触发菜单同步
 */
export async function triggerMenuSync() {
  console.log("[IIKO Scheduler] Manual menu sync triggered");
  return await syncAllMenus();
}

/**
 * 获取调度器状态
 */
export function getSchedulerStatus() {
  return {
    orderSync: {
      running: orderSyncInterval !== null,
      processing: isProcessingOrders,
      interval: ORDER_SYNC_INTERVAL_MS,
    },
    menuSync: {
      running: menuSyncInterval !== null,
      processing: isProcessingMenus,
      interval: MENU_SYNC_INTERVAL_MS,
    },
  };
}
