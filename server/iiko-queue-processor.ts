import { syncOrderToIiko } from "./iiko-order-sync.js";
import {
  getPendingOrderQueue,
  updateOrderQueueStatus,
  createOrderSyncRecord,
} from "./iiko-db.js";

/**
 * IIKO 订单队列处理器
 * 处理订单队列中的待同步订单，包含重试机制和错误处理
 */

const MAX_RETRY_COUNT = 3;
const BATCH_SIZE = 10;
const CONCURRENT_LIMIT = 3;

interface QueueProcessResult {
  processed: number;
  succeeded: number;
  failed: number;
  errors: Array<{
    orderId: number;
    error: string;
  }>;
}

/**
 * 处理单个订单队列项
 */
async function processQueueItem(queueItem: any): Promise<{
  success: boolean;
  errorMessage?: string;
}> {
  try {
    // 更新队列状态为处理中
    await updateOrderQueueStatus(queueItem.id, "processing");

    // 同步订单到 IIKO
    const result = await syncOrderToIiko(
      queueItem.orderId,
      queueItem.configId
    );

    if (result.success) {
      // 同步成功
      await updateOrderQueueStatus(queueItem.id, "completed");

      // 创建或更新同步记录
      await createOrderSyncRecord({
        orderId: queueItem.orderId,
        orderNo: queueItem.orderNo,
        iikoOrderId: result.iikoOrderId,
        iikoExternalNumber: result.iikoExternalNumber,
        syncStatus: "success",
      });

      console.log(
        `[IIKO Queue] Successfully synced order ${queueItem.orderNo} (ID: ${queueItem.orderId})`
      );

      return { success: true };
    } else {
      // 同步失败，检查重试次数
      const retryCount = queueItem.retryCount || 0;

      if (retryCount < MAX_RETRY_COUNT) {
        // 还可以重试，更新重试次数并保持 pending 状态
        await updateOrderQueueStatus(
          queueItem.id,
          "pending",
          result.errorMessage
        );

        console.warn(
          `[IIKO Queue] Failed to sync order ${queueItem.orderNo}, will retry (${retryCount + 1}/${MAX_RETRY_COUNT}): ${result.errorMessage}`
        );
      } else {
        // 达到最大重试次数，标记为失败
        await updateOrderQueueStatus(
          queueItem.id,
          "failed",
          result.errorMessage
        );

        // 创建或更新同步记录
        await createOrderSyncRecord({
          orderId: queueItem.orderId,
          orderNo: queueItem.orderNo,
          syncStatus: "failed",
          errorMessage: result.errorMessage,
          errorCode: result.errorCode,
        });

        console.error(
          `[IIKO Queue] Failed to sync order ${queueItem.orderNo} after ${MAX_RETRY_COUNT} retries: ${result.errorMessage}`
        );
      }

      return {
        success: false,
        errorMessage: result.errorMessage,
      };
    }
  } catch (error: any) {
    console.error(
      `[IIKO Queue] Error processing queue item ${queueItem.id}:`,
      error
    );

    // 更新队列状态为失败
    await updateOrderQueueStatus(queueItem.id, "failed", error.message);

    return {
      success: false,
      errorMessage: error.message,
    };
  }
}

/**
 * 处理订单队列
 */
export async function processOrderQueue(): Promise<QueueProcessResult> {
  const result: QueueProcessResult = {
    processed: 0,
    succeeded: 0,
    failed: 0,
    errors: [],
  };

  try {
    // 获取待处理的订单队列
    const queueItems = await getPendingOrderQueue(BATCH_SIZE);

    if (queueItems.length === 0) {
      console.log("[IIKO Queue] No pending orders in queue");
      return result;
    }

    console.log(
      `[IIKO Queue] Processing ${queueItems.length} orders from queue`
    );

    // 分批处理，控制并发
    for (let i = 0; i < queueItems.length; i += CONCURRENT_LIMIT) {
      const batch = queueItems.slice(i, i + CONCURRENT_LIMIT);

      const batchResults = await Promise.all(
        batch.map(async (item) => {
          const processResult = await processQueueItem(item);
          return {
            orderId: item.orderId,
            success: processResult.success,
            errorMessage: processResult.errorMessage,
          };
        })
      );

      // 统计结果
      for (const batchResult of batchResults) {
        result.processed++;

        if (batchResult.success) {
          result.succeeded++;
        } else {
          result.failed++;
          result.errors.push({
            orderId: batchResult.orderId,
            error: batchResult.errorMessage || "Unknown error",
          });
        }
      }
    }

    console.log(
      `[IIKO Queue] Processed ${result.processed} orders: ${result.succeeded} succeeded, ${result.failed} failed`
    );

    return result;
  } catch (error: any) {
    console.error("[IIKO Queue] Error processing order queue:", error);
    throw error;
  }
}

/**
 * 手动触发队列处理（用于管理后台）
 */
export async function triggerQueueProcessing(): Promise<QueueProcessResult> {
  console.log("[IIKO Queue] Manual queue processing triggered");
  return await processOrderQueue();
}
