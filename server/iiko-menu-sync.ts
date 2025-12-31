import { getIikoAccessToken } from "./iiko-auth.js";
import { getAllIikoConfigs, upsertMenuSyncRecord } from "./iiko-db.js";
import { getDb } from "./db.js";
import { products } from "../drizzle/schema.js";
import { eq } from "drizzle-orm";

/**
 * IIKO 菜单同步服务
 * 从 IIKO 系统拉取菜单数据并更新本地商品信息
 */

interface IikoProduct {
  id: string;
  name: string;
  description?: string;
  price: number;
  isDeleted: boolean;
  parentGroup?: string;
  order: number;
  code?: string;
  seoDescription?: string;
  seoText?: string;
  seoKeywords?: string;
  seoTitle?: string;
  isIncludedInMenu: boolean;
  groupId?: string;
}

interface IikoProductGroup {
  id: string;
  name: string;
  description?: string;
  order: number;
  isDeleted: boolean;
  isIncludedInMenu: boolean;
  parentGroup?: string;
}

interface IikoMenuResponse {
  revision: number;
  groups: IikoProductGroup[];
  products: IikoProduct[];
}

/**
 * 从 IIKO 拉取菜单数据
 */
async function fetchIikoMenu(
  configId: number,
  apiUrl: string,
  organizationId: string
): Promise<IikoMenuResponse | null> {
  try {
    // 获取访问令牌
    const token = await getIikoAccessToken(configId);
    if (!token) {
      throw new Error("Failed to get IIKO access token");
    }

    // 调用 IIKO Menu API
    const response = await fetch(`${apiUrl}/api/1/nomenclature`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        organizationId,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`IIKO API error: ${response.status} ${errorText}`);
    }

    const menuData: IikoMenuResponse = await response.json();

    return menuData;
  } catch (error: any) {
    console.error(
      `[IIKO Menu Sync] Failed to fetch menu from config ${configId}:`,
      error
    );
    return null;
  }
}

/**
 * 更新本地商品数据
 */
async function updateLocalProducts(
  menuData: IikoMenuResponse,
  storeId: number
): Promise<{
  updated: number;
  created: number;
  errors: number;
}> {
  const result = {
    updated: 0,
    created: 0,
    errors: 0,
  };

  const db = await getDb();
  if (!db) {
    console.error("[IIKO Menu Sync] Database connection failed");
    return result;
  }

  try {
    // 过滤出菜单中的商品（排除已删除和不在菜单中的）
    const activeProducts = menuData.products.filter(
      (p) => !p.isDeleted && p.isIncludedInMenu
    );

    console.log(
      `[IIKO Menu Sync] Processing ${activeProducts.length} active products`
    );

    for (const iikoProduct of activeProducts) {
      try {
        // 查找本地是否已存在该商品（通过 IIKO ID）
        const existingProducts = await db
          .select()
          .from(products)
          .where(eq(products.iikoId, iikoProduct.id))
          .limit(1);

        if (existingProducts.length > 0) {
          // 更新现有商品
          await db
            .update(products)
            .set({
              nameZh: iikoProduct.name,
              nameRu: iikoProduct.name,
              nameEn: iikoProduct.name,
              descriptionZh: iikoProduct.description || "",
              descriptionRu: iikoProduct.description || "",
              descriptionEn: iikoProduct.description || "",
              basePrice: iikoProduct.price.toString(),
              updatedAt: new Date(),
            })
            .where(eq(products.id, existingProducts[0].id));

          result.updated++;
        } else {
          // 创建新商品（需要 categoryId，暂时使用 1 作为默认分类）
          await db.insert(products).values({
            iikoId: iikoProduct.id,
            categoryId: 1, // TODO: 映射 IIKO 分类到本地分类
            type: "tea",
            code: iikoProduct.code || `IIKO-${iikoProduct.id}`,
            nameZh: iikoProduct.name,
            nameRu: iikoProduct.name,
            nameEn: iikoProduct.name,
            descriptionZh: iikoProduct.description || "",
            descriptionRu: iikoProduct.description || "",
            descriptionEn: iikoProduct.description || "",
            image: "/placeholder-product.jpg",
            basePrice: iikoProduct.price.toString(),
            stock: 999,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          });

          result.created++;
        }
      } catch (error: any) {
        console.error(
          `[IIKO Menu Sync] Failed to process product ${iikoProduct.id}:`,
          error
        );
        result.errors++;
      }
    }

    console.log(
      `[IIKO Menu Sync] Sync completed: ${result.created} created, ${result.updated} updated, ${result.errors} errors`
    );

    return result;
  } catch (error: any) {
    console.error("[IIKO Menu Sync] Error updating local products:", error);
    return result;
  }
}

/**
 * 同步单个 IIKO 配置的菜单
 */
export async function syncMenuForConfig(config: any): Promise<{
  success: boolean;
  updated: number;
  created: number;
  errors: number;
  errorMessage?: string;
}> {
  try {
    console.log(
      `[IIKO Menu Sync] Starting menu sync for config ${config.id} (${config.storeName})`
    );

    // 拉取菜单数据
    const menuData = await fetchIikoMenu(
      config.id,
      config.apiUrl,
      config.organizationId
    );

    if (!menuData) {
      return {
        success: false,
        updated: 0,
        created: 0,
        errors: 0,
        errorMessage: "Failed to fetch menu data from IIKO",
      };
    }

    // 更新本地商品数据
    const result = await updateLocalProducts(menuData, config.storeId);

    // 记录同步结果
    await upsertMenuSyncRecord({
      configId: config.id,
      storeId: config.storeId,
      iikoProductId: "SYNC_RECORD",
      iikoProductName: "Menu Sync",
      productData: JSON.stringify({
        revision: menuData.revision,
        productCount: menuData.products.length,
        groupCount: menuData.groups.length,
      }),

    });

    console.log(
      `[IIKO Menu Sync] Menu sync completed for config ${config.id}`
    );

    return {
      success: true,
      updated: result.updated,
      created: result.created,
      errors: result.errors,
    };
  } catch (error: any) {
    console.error(
      `[IIKO Menu Sync] Error syncing menu for config ${config.id}:`,
      error
    );

    // 记录同步失败
    await upsertMenuSyncRecord({
      configId: config.id,
      storeId: config.storeId,
      iikoProductId: "SYNC_RECORD",
      iikoProductName: "Menu Sync Failed",
      productData: JSON.stringify({
        error: error.message,
      }),

    });

    return {
      success: false,
      updated: 0,
      created: 0,
      errors: 0,
      errorMessage: error.message,
    };
  }
}

/**
 * 同步所有激活的 IIKO 配置的菜单
 */
export async function syncAllMenus(): Promise<{
  total: number;
  succeeded: number;
  failed: number;
  results: Array<{
    configId: number;
    storeName: string;
    success: boolean;
    updated: number;
    created: number;
    errorMessage?: string;
  }>;
}> {
  const summary = {
    total: 0,
    succeeded: 0,
    failed: 0,
    results: [] as Array<{
      configId: number;
      storeName: string;
      success: boolean;
      updated: number;
      created: number;
      errorMessage?: string;
    }>,
  };

  try {
    // 获取所有激活的 IIKO 配置
    const allConfigs = await getAllIikoConfigs();
    const configs = allConfigs.filter((c) => c.isActive);

    if (configs.length === 0) {
      console.log("[IIKO Menu Sync] No active IIKO configs found");
      return summary;
    }

    console.log(
      `[IIKO Menu Sync] Starting menu sync for ${configs.length} configs`
    );

    summary.total = configs.length;

    // 依次同步每个配置的菜单
    for (const config of configs) {
      const result = await syncMenuForConfig(config);

      summary.results.push({
        configId: config.id,
        storeName: config.configName,
        success: result.success,
        updated: result.updated,
        created: result.created,
        errorMessage: result.errorMessage,
      });

      if (result.success) {
        summary.succeeded++;
      } else {
        summary.failed++;
      }
    }

    console.log(
      `[IIKO Menu Sync] All menu sync completed: ${summary.succeeded} succeeded, ${summary.failed} failed`
    );

    return summary;
  } catch (error: any) {
    console.error("[IIKO Menu Sync] Error syncing all menus:", error);
    return summary;
  }
}
