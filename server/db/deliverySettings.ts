import { getDb } from "../db";
import { systemConfigs } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

// 配送方式配置的键名
const DELIVERY_SETTINGS_KEY = "delivery_settings";

export interface DeliverySettings {
  enablePickup: boolean; // 是否启用自提
  enableDelivery: boolean; // 是否启用外卖
}

// 获取配送方式配置
export async function getDeliverySettings(): Promise<DeliverySettings> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const config = await db
    .select()
    .from(systemConfigs)
    .where(eq(systemConfigs.key, DELIVERY_SETTINGS_KEY))
    .limit(1);

  if (config.length === 0 || !config[0].value) {
    // 默认两种方式都启用
    return {
      enablePickup: true,
      enableDelivery: true,
    };
  }

  try {
    return JSON.parse(config[0].value) as DeliverySettings;
  } catch {
    return {
      enablePickup: true,
      enableDelivery: true,
    };
  }
}

// 更新配送方式配置
export async function updateDeliverySettings(settings: DeliverySettings): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const existing = await db
    .select()
    .from(systemConfigs)
    .where(eq(systemConfigs.key, DELIVERY_SETTINGS_KEY))
    .limit(1);

  const value = JSON.stringify(settings);

  if (existing.length === 0) {
    await db.insert(systemConfigs).values({
      key: DELIVERY_SETTINGS_KEY,
      value,
      descriptionZh: "配送方式设置",
      descriptionRu: "Настройки доставки",
      descriptionEn: "Delivery Settings",
    });
  } else {
    await db
      .update(systemConfigs)
      .set({ value })
      .where(eq(systemConfigs.key, DELIVERY_SETTINGS_KEY));
  }
}
