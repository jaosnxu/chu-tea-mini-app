import { eq, and } from "drizzle-orm";
import { getDb } from "./db.js";
import { iikoCategoryMapping } from "../drizzle/schema.js";

/**
 * 获取所有分类映射
 */
export async function getAllCategoryMappings(storeId?: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  if (storeId) {
    return await db
      .select()
      .from(iikoCategoryMapping)
      .where(eq(iikoCategoryMapping.storeId, storeId));
  }

  return await db.select().from(iikoCategoryMapping);
}

/**
 * 根据 IIKO 分组 ID 查找映射
 */
export async function getCategoryMappingByIikoGroupId(
  iikoGroupId: string,
  storeId?: number
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const conditions = [eq(iikoCategoryMapping.iikoGroupId, iikoGroupId)];
  if (storeId) {
    conditions.push(eq(iikoCategoryMapping.storeId, storeId));
  }

  const result = await db
    .select()
    .from(iikoCategoryMapping)
    .where(and(...conditions))
    .limit(1);

  return result[0] || null;
}

/**
 * 创建分类映射
 */
export async function createCategoryMapping(data: {
  iikoGroupId: string;
  iikoGroupName: string;
  localCategoryId: number;
  storeId?: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(iikoCategoryMapping).values({
    iikoGroupId: data.iikoGroupId,
    iikoGroupName: data.iikoGroupName,
    localCategoryId: data.localCategoryId,
    storeId: data.storeId || null,
  });

  return { success: true };
}

/**
 * 更新分类映射
 */
export async function updateCategoryMapping(
  id: number,
  data: {
    localCategoryId?: number;
    iikoGroupName?: string;
  }
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(iikoCategoryMapping)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(iikoCategoryMapping.id, id));

  return { success: true };
}

/**
 * 删除分类映射
 */
export async function deleteCategoryMapping(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(iikoCategoryMapping).where(eq(iikoCategoryMapping.id, id));

  return { success: true };
}
