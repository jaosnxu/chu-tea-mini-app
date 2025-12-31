import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

/**
 * IIKO API 配置表
 * 存储 IIKO 系统的 API 连接配置
 */
export const iikoConfig = sqliteTable("iiko_config", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  
  // API 配置
  apiUrl: text("api_url").notNull().default("https://api-ru.iiko.services"),
  apiLogin: text("api_login").notNull(), // API 登录凭证
  
  // 组织配置
  organizationId: text("organization_id").notNull(), // 组织 ID (UUID)
  organizationName: text("organization_name"), // 组织名称（可选，用于显示）
  
  // 终端配置
  terminalGroupId: text("terminal_group_id"), // 终端组 ID (UUID，可选)
  terminalGroupName: text("terminal_group_name"), // 终端组名称（可选，用于显示）
  
  // 菜单同步配置
  menuRevision: integer("menu_revision").default(0), // 菜单版本号，用于增量更新
  lastMenuSyncAt: integer("last_menu_sync_at"), // 最后一次菜单同步时间（Unix timestamp）
  
  // 状态和元数据
  isActive: integer("is_active").notNull().default(1), // 是否启用（1=启用，0=禁用）
  accessToken: text("access_token"), // 当前访问令牌
  tokenExpiresAt: integer("token_expires_at"), // 令牌过期时间（Unix timestamp）
  
  // 时间戳
  createdAt: integer("created_at").notNull(),
  updatedAt: integer("updated_at").notNull(),
});

/**
 * IIKO 订单同步记录表
 * 记录订单同步到 IIKO 的状态
 */
export const iikoOrderSync = sqliteTable("iiko_order_sync", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  
  // 关联本地订单
  orderId: integer("order_id").notNull(), // 本地订单 ID
  orderNo: text("order_no").notNull(), // 本地订单号
  
  // IIKO 订单信息
  iikoOrderId: text("iiko_order_id"), // IIKO 订单 ID (UUID)
  iikoExternalNumber: text("iiko_external_number"), // IIKO 外部订单号
  
  // 同步状态
  syncStatus: text("sync_status").notNull().default("pending"), // pending, syncing, success, failed
  syncAttempts: integer("sync_attempts").notNull().default(0), // 同步尝试次数
  lastSyncAt: integer("last_sync_at"), // 最后一次同步时间
  
  // 错误信息
  errorMessage: text("error_message"), // 错误消息
  errorCode: text("error_code"), // 错误代码
  
  // 时间戳
  createdAt: integer("created_at").notNull(),
  updatedAt: integer("updated_at").notNull(),
});

/**
 * IIKO 菜单同步记录表
 * 记录从 IIKO 同步的菜单数据
 */
export const iikoMenuSync = sqliteTable("iiko_menu_sync", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  
  // IIKO 商品信息
  iikoProductId: text("iiko_product_id").notNull(), // IIKO 商品 ID (UUID)
  iikoProductName: text("iiko_product_name").notNull(), // IIKO 商品名称
  iikoCategoryId: text("iiko_category_id"), // IIKO 分类 ID
  
  // 关联本地商品
  localProductId: integer("local_product_id"), // 本地商品 ID
  
  // 商品数据
  price: integer("price"), // 价格（分）
  isAvailable: integer("is_available").notNull().default(1), // 是否可用
  isInStopList: integer("is_in_stop_list").notNull().default(0), // 是否在缺货列表中
  
  // 同步信息
  lastSyncAt: integer("last_sync_at").notNull(), // 最后同步时间
  
  // 时间戳
  createdAt: integer("created_at").notNull(),
  updatedAt: integer("updated_at").notNull(),
});
