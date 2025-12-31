import { getDb } from "./db.js";
import { iikoConfig, iikoOrderQueue, iikoOrderSync, iikoMenuSync } from "../drizzle/schema.js";
import { eq, and, desc } from "drizzle-orm";

/**
 * 获取所有 IIKO 配置
 */
export async function getAllIikoConfigs() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(iikoConfig).orderBy(desc(iikoConfig.createdAt));
}

/**
 * 根据 ID 获取 IIKO 配置
 */
export async function getIikoConfigById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const [config] = await db.select().from(iikoConfig).where(eq(iikoConfig.id, id));
  return config;
}

/**
 * 根据门店 ID 获取 IIKO 配置
 */
export async function getIikoConfigByStoreId(storeId: number) {
  const db = await getDb();
  if (!db) return null;
  const [config] = await db
    .select()
    .from(iikoConfig)
    .where(and(eq(iikoConfig.storeId, storeId), eq(iikoConfig.isActive, true)));
  return config;
}

/**
 * 创建 IIKO 配置
 */
export async function createIikoConfig(data: {
  configName: string;
  storeId?: number | null;
  apiUrl: string;
  apiLogin: string;
  organizationId: string;
  organizationName?: string | null;
  terminalGroupId?: string | null;
  terminalGroupName?: string | null;
  autoSyncMenu?: boolean;
  syncIntervalMinutes?: number;
  isActive?: boolean;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(iikoConfig).values({
    configName: data.configName,
    storeId: data.storeId || null,
    apiUrl: data.apiUrl,
    apiLogin: data.apiLogin,
    organizationId: data.organizationId,
    organizationName: data.organizationName || null,
    terminalGroupId: data.terminalGroupId || null,
    terminalGroupName: data.terminalGroupName || null,
    autoSyncMenu: data.autoSyncMenu || false,
    syncIntervalMinutes: data.syncIntervalMinutes || 30,
    isActive: data.isActive !== undefined ? data.isActive : true,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

/**
 * 更新 IIKO 配置
 */
export async function updateIikoConfig(
  id: number,
  data: Partial<{
    configName: string;
    storeId: number | null;
    apiUrl: string;
    apiLogin: string;
    organizationId: string;
    organizationName: string | null;
    terminalGroupId: string | null;
    terminalGroupName: string | null;
    autoSyncMenu: boolean;
    syncIntervalMinutes: number;
    isActive: boolean;
    accessToken: string | null;
    tokenExpiresAt: Date | null;
  }>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db
    .update(iikoConfig)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(iikoConfig.id, id));
}

/**
 * 删除 IIKO 配置
 */
export async function deleteIikoConfig(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(iikoConfig).where(eq(iikoConfig.id, id));
}

/**
 * 添加订单到同步队列
 */
export async function addOrderToQueue(data: {
  orderId: number;
  orderNo: string;
  storeId: number;
  orderData: string; // JSON string
  priority?: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(iikoOrderQueue).values({
    orderId: data.orderId,
    orderNo: data.orderNo,
    storeId: data.storeId,
    orderData: data.orderData,
    queueStatus: "pending",
    priority: data.priority || 0,
    retryCount: 0,
    maxRetries: 3,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

/**
 * 获取待处理的订单队列
 */
export async function getPendingOrderQueue(limit: number = 10) {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select()
    .from(iikoOrderQueue)
    .where(eq(iikoOrderQueue.queueStatus, "pending"))
    .orderBy(desc(iikoOrderQueue.priority), iikoOrderQueue.createdAt)
    .limit(limit);
}

/**
 * 更新订单队列状态
 */
export async function updateOrderQueueStatus(
  id: number,
  status: "pending" | "processing" | "completed" | "failed",
  errorMessage?: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const updateData: any = {
    queueStatus: status,
    updatedAt: new Date(),
  };

  if (status === "processing") {
    updateData.processedAt = new Date();
  } else if (status === "completed") {
    updateData.completedAt = new Date();
  } else if (status === "failed" && errorMessage) {
    updateData.errorMessage = errorMessage;
  }

  await db
    .update(iikoOrderQueue)
    .set(updateData)
    .where(eq(iikoOrderQueue.id, id));
}

/**
 * 创建订单同步记录
 */
export async function createOrderSyncRecord(data: {
  orderId: number;
  orderNo: string;
  iikoOrderId?: string;
  iikoExternalNumber?: string;
  syncStatus: "pending" | "syncing" | "success" | "failed";
  errorMessage?: string;
  errorCode?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(iikoOrderSync).values({
    orderId: data.orderId,
    orderNo: data.orderNo,
    iikoOrderId: data.iikoOrderId || null,
    iikoExternalNumber: data.iikoExternalNumber || null,
    syncStatus: data.syncStatus,
    syncAttempts: 0,
    errorMessage: data.errorMessage || null,
    errorCode: data.errorCode || null,
    lastSyncAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

/**
 * 更新菜单同步记录
 */
export async function upsertMenuSyncRecord(data: {
  configId: number;
  storeId?: number;
  iikoProductId: string;
  iikoProductName: string;
  iikoCategoryId?: string;
  iikoCategoryName?: string;
  localProductId?: number;
  productData?: string;
  price?: number;
  isAvailable?: boolean;
  isInStopList?: boolean;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  // 先查询是否存在
  const [existing] = await db
    .select()
    .from(iikoMenuSync)
    .where(
      and(
        eq(iikoMenuSync.configId, data.configId),
        eq(iikoMenuSync.iikoProductId, data.iikoProductId)
      )
    );

  if (existing) {
    // 更新
    await db
      .update(iikoMenuSync)
      .set({
        iikoProductName: data.iikoProductName,
        iikoCategoryId: data.iikoCategoryId || null,
        iikoCategoryName: data.iikoCategoryName || null,
        localProductId: data.localProductId || null,
        productData: data.productData || null,
        price: data.price?.toString() || null,
        isAvailable: data.isAvailable !== undefined ? data.isAvailable : true,
        isInStopList: data.isInStopList !== undefined ? data.isInStopList : false,
        lastSyncAt: new Date(),
        syncStatus: "success",
        updatedAt: new Date(),
      })
      .where(eq(iikoMenuSync.id, existing.id));
  } else {
    // 插入
    await db.insert(iikoMenuSync).values({
      configId: data.configId,
      storeId: data.storeId || null,
      iikoProductId: data.iikoProductId,
      iikoProductName: data.iikoProductName,
      iikoCategoryId: data.iikoCategoryId || null,
      iikoCategoryName: data.iikoCategoryName || null,
      localProductId: data.localProductId || null,
      productData: data.productData || null,
      price: data.price?.toString() || null,
      isAvailable: data.isAvailable !== undefined ? data.isAvailable : true,
      isInStopList: data.isInStopList !== undefined ? data.isInStopList : false,
      lastSyncAt: new Date(),
      syncStatus: "success",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }
}
