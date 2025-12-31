import { processOrderQueue } from "./iiko-queue-processor.js";

/**
 * IIKO 订单同步定时任务调度器
 * 每分钟检查一次订单队列并处理待同步订单
 */

let schedulerInterval: NodeJS.Timeout | null = null;
let isProcessing = false;

const INTERVAL_MS = 60 * 1000; // 1 minute

/**
 * 启动定时任务调度器
 */
export function startScheduler() {
  if (schedulerInterval) {
    console.log("[IIKO Scheduler] Scheduler is already running");
    return;
  }

  console.log("[IIKO Scheduler] Starting scheduler (interval: 1 minute)");

  // 立即执行一次
  processQueueSafely();

  // 设置定时任务
  schedulerInterval = setInterval(() => {
    processQueueSafely();
  }, INTERVAL_MS);
}

/**
 * 停止定时任务调度器
 */
export function stopScheduler() {
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
    schedulerInterval = null;
    console.log("[IIKO Scheduler] Scheduler stopped");
  }
}

/**
 * 安全地处理队列（避免并发执行）
 */
async function processQueueSafely() {
  if (isProcessing) {
    console.log("[IIKO Scheduler] Previous processing is still running, skipping");
    return;
  }

  isProcessing = true;

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
    isProcessing = false;
  }
}

/**
 * 获取调度器状态
 */
export function getSchedulerStatus() {
  return {
    running: schedulerInterval !== null,
    processing: isProcessing,
    interval: INTERVAL_MS,
  };
}
