import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, boolean, json } from "drizzle-orm/mysql-core";

// ==================== 用户系统 ====================

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  telegramId: varchar("telegramId", { length: 64 }).unique(),
  telegramUsername: varchar("telegramUsername", { length: 128 }),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 32 }),
  avatar: text("avatar"),
  language: varchar("language", { length: 10 }).default("ru"),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin", "influencer"]).default("user").notNull(),
  memberLevel: mysqlEnum("memberLevel", ["normal", "silver", "gold", "diamond"]).default("normal").notNull(),
  totalPoints: int("totalPoints").default(0).notNull(),
  availablePoints: int("availablePoints").default(0).notNull(),
  totalSpent: decimal("totalSpent", { precision: 12, scale: 2 }).default("0.00").notNull(),
  referrerId: int("referrerId"),
  referrerCode: varchar("referrerCode", { length: 32 }).unique(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ==================== 门店系统 ====================

export const stores = mysqlTable("stores", {
  id: int("id").autoincrement().primaryKey(),
  iikoId: varchar("iikoId", { length: 64 }),
  code: varchar("code", { length: 32 }).notNull().unique(),
  nameZh: varchar("nameZh", { length: 128 }).notNull(),
  nameRu: varchar("nameRu", { length: 128 }).notNull(),
  nameEn: varchar("nameEn", { length: 128 }).notNull(),
  addressZh: text("addressZh"),
  addressRu: text("addressRu"),
  addressEn: text("addressEn"),
  phone: varchar("phone", { length: 32 }),
  latitude: decimal("latitude", { precision: 10, scale: 7 }),
  longitude: decimal("longitude", { precision: 10, scale: 7 }),
  openTime: varchar("openTime", { length: 16 }),
  closeTime: varchar("closeTime", { length: 16 }),
  isOpen: boolean("isOpen").default(true).notNull(),
  status: mysqlEnum("status", ["active", "inactive", "maintenance"]).default("active").notNull(),
  deliveryRadius: int("deliveryRadius").default(5000),
  minOrderAmount: decimal("minOrderAmount", { precision: 10, scale: 2 }).default("0.00"),
  deliveryFee: decimal("deliveryFee", { precision: 10, scale: 2 }).default("0.00"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Store = typeof stores.$inferSelect;
export type InsertStore = typeof stores.$inferInsert;

// ==================== 商品分类 ====================

export const categories = mysqlTable("categories", {
  id: int("id").autoincrement().primaryKey(),
  iikoId: varchar("iikoId", { length: 64 }),
  parentId: int("parentId"),
  type: mysqlEnum("type", ["tea", "mall"]).default("tea").notNull(),
  nameZh: varchar("nameZh", { length: 128 }).notNull(),
  nameRu: varchar("nameRu", { length: 128 }).notNull(),
  nameEn: varchar("nameEn", { length: 128 }).notNull(),
  image: text("image"),
  sortOrder: int("sortOrder").default(0).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Category = typeof categories.$inferSelect;
export type InsertCategory = typeof categories.$inferInsert;

// ==================== 商品表 ====================

export const products = mysqlTable("products", {
  id: int("id").autoincrement().primaryKey(),
  iikoId: varchar("iikoId", { length: 64 }),
  categoryId: int("categoryId").notNull(),
  type: mysqlEnum("type", ["tea", "mall"]).default("tea").notNull(),
  code: varchar("code", { length: 64 }).notNull().unique(),
  nameZh: varchar("nameZh", { length: 256 }).notNull(),
  nameRu: varchar("nameRu", { length: 256 }).notNull(),
  nameEn: varchar("nameEn", { length: 256 }).notNull(),
  descriptionZh: text("descriptionZh"),
  descriptionRu: text("descriptionRu"),
  descriptionEn: text("descriptionEn"),
  image: text("image"),
  images: json("images").$type<string[]>(),
  basePrice: decimal("basePrice", { precision: 10, scale: 2 }).notNull(),
  originalPrice: decimal("originalPrice", { precision: 10, scale: 2 }),
  pointsEarn: int("pointsEarn").default(0),
  pointsRedeem: int("pointsRedeem").default(0),
  stock: int("stock").default(999),
  salesCount: int("salesCount").default(0),
  isHot: boolean("isHot").default(false),
  isNew: boolean("isNew").default(false),
  isRecommended: boolean("isRecommended").default(false),
  isActive: boolean("isActive").default(true).notNull(),
  sortOrder: int("sortOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Product = typeof products.$inferSelect;
export type InsertProduct = typeof products.$inferInsert;

// ==================== 商品规格选项（糖度、冰度、配料等） ====================

export const productOptions = mysqlTable("productOptions", {
  id: int("id").autoincrement().primaryKey(),
  productId: int("productId").notNull(),
  groupNameZh: varchar("groupNameZh", { length: 64 }).notNull(),
  groupNameRu: varchar("groupNameRu", { length: 64 }).notNull(),
  groupNameEn: varchar("groupNameEn", { length: 64 }).notNull(),
  groupType: mysqlEnum("groupType", ["sugar", "ice", "size", "topping", "other"]).notNull(),
  isRequired: boolean("isRequired").default(true).notNull(),
  isMultiple: boolean("isMultiple").default(false).notNull(),
  maxSelect: int("maxSelect").default(1),
  sortOrder: int("sortOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ProductOption = typeof productOptions.$inferSelect;
export type InsertProductOption = typeof productOptions.$inferInsert;

export const productOptionItems = mysqlTable("productOptionItems", {
  id: int("id").autoincrement().primaryKey(),
  optionId: int("optionId").notNull(),
  iikoModifierId: varchar("iikoModifierId", { length: 64 }),
  nameZh: varchar("nameZh", { length: 64 }).notNull(),
  nameRu: varchar("nameRu", { length: 64 }).notNull(),
  nameEn: varchar("nameEn", { length: 64 }).notNull(),
  priceAdjust: decimal("priceAdjust", { precision: 10, scale: 2 }).default("0.00"),
  isDefault: boolean("isDefault").default(false),
  sortOrder: int("sortOrder").default(0).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
});

export type ProductOptionItem = typeof productOptionItems.$inferSelect;
export type InsertProductOptionItem = typeof productOptionItems.$inferInsert;

// ==================== 商城 SKU ====================

export const productSkus = mysqlTable("productSkus", {
  id: int("id").autoincrement().primaryKey(),
  productId: int("productId").notNull(),
  sku: varchar("sku", { length: 64 }).notNull().unique(),
  specNameZh: varchar("specNameZh", { length: 128 }),
  specNameRu: varchar("specNameRu", { length: 128 }),
  specNameEn: varchar("specNameEn", { length: 128 }),
  specValues: json("specValues").$type<Record<string, string>>(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  stock: int("stock").default(0).notNull(),
  image: text("image"),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ProductSku = typeof productSkus.$inferSelect;
export type InsertProductSku = typeof productSkus.$inferInsert;

// ==================== 购物车 ====================

export const cartItems = mysqlTable("cartItems", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  storeId: int("storeId"),
  productId: int("productId").notNull(),
  skuId: int("skuId"),
  quantity: int("quantity").default(1).notNull(),
  selectedOptions: json("selectedOptions").$type<Array<{ optionId: number; itemId: number; name: string; price: string }>>(),
  unitPrice: decimal("unitPrice", { precision: 10, scale: 2 }).notNull(),
  cartType: mysqlEnum("cartType", ["tea", "mall"]).default("tea").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CartItem = typeof cartItems.$inferSelect;
export type InsertCartItem = typeof cartItems.$inferInsert;

// ==================== 收货地址 ====================

export const addresses = mysqlTable("addresses", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 64 }).notNull(),
  phone: varchar("phone", { length: 32 }).notNull(),
  province: varchar("province", { length: 64 }),
  city: varchar("city", { length: 64 }),
  district: varchar("district", { length: 64 }),
  address: text("address").notNull(),
  postalCode: varchar("postalCode", { length: 16 }),
  latitude: decimal("latitude", { precision: 10, scale: 7 }),
  longitude: decimal("longitude", { precision: 10, scale: 7 }),
  isDefault: boolean("isDefault").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Address = typeof addresses.$inferSelect;
export type InsertAddress = typeof addresses.$inferInsert;

// ==================== 订单系统 ====================

export const orders = mysqlTable("orders", {
  id: int("id").autoincrement().primaryKey(),
  orderNo: varchar("orderNo", { length: 64 }).notNull().unique(),
  pickupCode: varchar("pickupCode", { length: 5 }),
  orderSource: mysqlEnum("orderSource", ["delivery", "store", "telegram"]).default("telegram").notNull(),
  iikoOrderId: varchar("iikoOrderId", { length: 64 }),
  userId: int("userId").notNull(),
  storeId: int("storeId"),
  orderType: mysqlEnum("orderType", ["tea", "mall"]).default("tea").notNull(),
  deliveryType: mysqlEnum("deliveryType", ["delivery", "pickup"]).default("delivery").notNull(),
  status: mysqlEnum("status", ["pending", "paid", "preparing", "ready", "delivering", "completed", "cancelled", "refunding", "refunded"]).default("pending").notNull(),
  addressId: int("addressId"),
  addressSnapshot: json("addressSnapshot").$type<{
    name: string;
    phone: string;
    address: string;
    latitude?: string;
    longitude?: string;
  }>(),
  pickupTime: timestamp("pickupTime"),
  subtotal: decimal("subtotal", { precision: 12, scale: 2 }).notNull(),
  deliveryFee: decimal("deliveryFee", { precision: 10, scale: 2 }).default("0.00"),
  discount: decimal("discount", { precision: 10, scale: 2 }).default("0.00"),
  pointsUsed: int("pointsUsed").default(0),
  pointsDiscount: decimal("pointsDiscount", { precision: 10, scale: 2 }).default("0.00"),
  couponId: int("couponId"),
  couponDiscount: decimal("couponDiscount", { precision: 10, scale: 2 }).default("0.00"),
  totalAmount: decimal("totalAmount", { precision: 12, scale: 2 }).notNull(),
  paidAmount: decimal("paidAmount", { precision: 12, scale: 2 }).default("0.00"),
  paymentMethod: varchar("paymentMethod", { length: 32 }),
  paymentId: varchar("paymentId", { length: 128 }),
  paidAt: timestamp("paidAt"),
  remarkZh: text("remarkZh"),
  remarkRu: text("remarkRu"),
  remarkEn: text("remarkEn"),
  cancelReason: text("cancelReason"),
  cancelledAt: timestamp("cancelledAt"),
  completedAt: timestamp("completedAt"),
  pointsEarned: int("pointsEarned").default(0),
  referrerId: int("referrerId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Order = typeof orders.$inferSelect;
export type InsertOrder = typeof orders.$inferInsert;

export const orderItems = mysqlTable("orderItems", {
  id: int("id").autoincrement().primaryKey(),
  orderId: int("orderId").notNull(),
  productId: int("productId").notNull(),
  skuId: int("skuId"),
  productSnapshot: json("productSnapshot").$type<{
    name: string;
    image?: string;
    options?: Array<{ name: string; value: string; price: string }>;
  }>(),
  quantity: int("quantity").notNull(),
  unitPrice: decimal("unitPrice", { precision: 10, scale: 2 }).notNull(),
  totalPrice: decimal("totalPrice", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type OrderItem = typeof orderItems.$inferSelect;
export type InsertOrderItem = typeof orderItems.$inferInsert;

// ==================== 物流信息 ====================

export const shipments = mysqlTable("shipments", {
  id: int("id").autoincrement().primaryKey(),
  orderId: int("orderId").notNull(),
  carrier: varchar("carrier", { length: 32 }).notNull(),
  trackingNo: varchar("trackingNo", { length: 64 }),
  status: mysqlEnum("status", ["pending", "picked", "in_transit", "out_for_delivery", "delivered", "failed"]).default("pending").notNull(),
  estimatedDelivery: timestamp("estimatedDelivery"),
  deliveredAt: timestamp("deliveredAt"),
  trackingHistory: json("trackingHistory").$type<Array<{
    time: string;
    status: string;
    location?: string;
    description: string;
  }>>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Shipment = typeof shipments.$inferSelect;
export type InsertShipment = typeof shipments.$inferInsert;

// ==================== 优惠券系统 ====================

export const couponTemplates = mysqlTable("couponTemplates", {
  id: int("id").autoincrement().primaryKey(),
  code: varchar("code", { length: 32 }).notNull().unique(),
  nameZh: varchar("nameZh", { length: 128 }).notNull(),
  nameRu: varchar("nameRu", { length: 128 }).notNull(),
  nameEn: varchar("nameEn", { length: 128 }).notNull(),
  descriptionZh: text("descriptionZh"),
  descriptionRu: text("descriptionRu"),
  descriptionEn: text("descriptionEn"),
  type: mysqlEnum("type", ["fixed", "percent", "product", "gift"]).notNull(),
  value: decimal("value", { precision: 10, scale: 2 }).notNull(),
  minOrderAmount: decimal("minOrderAmount", { precision: 10, scale: 2 }).default("0.00"),
  maxDiscount: decimal("maxDiscount", { precision: 10, scale: 2 }),
  applicableProducts: json("applicableProducts").$type<number[]>(),
  applicableCategories: json("applicableCategories").$type<number[]>(),
  applicableStores: json("applicableStores").$type<number[]>(),
  excludeProducts: json("excludeProducts").$type<number[]>(),
  stackable: boolean("stackable").default(false).notNull(),
  totalQuantity: int("totalQuantity").default(-1),
  usedQuantity: int("usedQuantity").default(0).notNull(),
  perUserLimit: int("perUserLimit").default(1),
  validDays: int("validDays"),
  startAt: timestamp("startAt"),
  endAt: timestamp("endAt"),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CouponTemplate = typeof couponTemplates.$inferSelect;
export type InsertCouponTemplate = typeof couponTemplates.$inferInsert;

export const userCoupons = mysqlTable("userCoupons", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  templateId: int("templateId").notNull(),
  status: mysqlEnum("status", ["available", "used", "expired"]).default("available").notNull(),
  usedOrderId: int("usedOrderId"),
  usedAt: timestamp("usedAt"),
  expireAt: timestamp("expireAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type UserCoupon = typeof userCoupons.$inferSelect;
export type InsertUserCoupon = typeof userCoupons.$inferInsert;

// ==================== 积分记录 ====================

export const pointsHistory = mysqlTable("pointsHistory", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  type: mysqlEnum("type", ["earn", "redeem", "expire", "adjust"]).notNull(),
  points: int("points").notNull(),
  balance: int("balance").notNull(),
  orderId: int("orderId"),
  descriptionZh: varchar("descriptionZh", { length: 256 }),
  descriptionRu: varchar("descriptionRu", { length: 256 }),
  descriptionEn: varchar("descriptionEn", { length: 256 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PointsHistory = typeof pointsHistory.$inferSelect;
export type InsertPointsHistory = typeof pointsHistory.$inferInsert;

// ==================== 达人推广系统 ====================

export const influencers = mysqlTable("influencers", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  code: varchar("code", { length: 32 }).notNull().unique(),
  nameZh: varchar("nameZh", { length: 128 }),
  nameRu: varchar("nameRu", { length: 128 }),
  nameEn: varchar("nameEn", { length: 128 }),
  avatar: text("avatar"),
  bio: text("bio"),
  commissionRate: decimal("commissionRate", { precision: 5, scale: 2 }).default("5.00").notNull(),
  totalClicks: int("totalClicks").default(0).notNull(),
  totalRegistrations: int("totalRegistrations").default(0).notNull(),
  totalOrders: int("totalOrders").default(0).notNull(),
  totalGmv: decimal("totalGmv", { precision: 14, scale: 2 }).default("0.00").notNull(),
  totalCommission: decimal("totalCommission", { precision: 12, scale: 2 }).default("0.00").notNull(),
  pendingCommission: decimal("pendingCommission", { precision: 12, scale: 2 }).default("0.00").notNull(),
  withdrawnCommission: decimal("withdrawnCommission", { precision: 12, scale: 2 }).default("0.00").notNull(),
  status: mysqlEnum("status", ["pending", "active", "suspended"]).default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Influencer = typeof influencers.$inferSelect;
export type InsertInfluencer = typeof influencers.$inferInsert;

export const influencerLinks = mysqlTable("influencerLinks", {
  id: int("id").autoincrement().primaryKey(),
  influencerId: int("influencerId").notNull(),
  storeId: int("storeId"),
  campaignName: varchar("campaignName", { length: 128 }),
  shortCode: varchar("shortCode", { length: 32 }).notNull().unique(),
  clicks: int("clicks").default(0).notNull(),
  registrations: int("registrations").default(0).notNull(),
  orders: int("orders").default(0).notNull(),
  gmv: decimal("gmv", { precision: 14, scale: 2 }).default("0.00").notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type InfluencerLink = typeof influencerLinks.$inferSelect;
export type InsertInfluencerLink = typeof influencerLinks.$inferInsert;

export const influencerCommissions = mysqlTable("influencerCommissions", {
  id: int("id").autoincrement().primaryKey(),
  influencerId: int("influencerId").notNull(),
  orderId: int("orderId").notNull(),
  orderAmount: decimal("orderAmount", { precision: 12, scale: 2 }).notNull(),
  commissionRate: decimal("commissionRate", { precision: 5, scale: 2 }).notNull(),
  commissionAmount: decimal("commissionAmount", { precision: 10, scale: 2 }).notNull(),
  status: mysqlEnum("status", ["pending", "confirmed", "paid", "cancelled"]).default("pending").notNull(),
  paidAt: timestamp("paidAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type InfluencerCommission = typeof influencerCommissions.$inferSelect;
export type InsertInfluencerCommission = typeof influencerCommissions.$inferInsert;

// ==================== 支付记录 ====================

export const payments = mysqlTable("payments", {
  id: int("id").autoincrement().primaryKey(),
  orderId: int("orderId").notNull(),
  paymentNo: varchar("paymentNo", { length: 64 }).notNull().unique(),
  gateway: varchar("gateway", { length: 32 }).notNull(),
  gatewayPaymentId: varchar("gatewayPaymentId", { length: 128 }),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 8 }).default("RUB").notNull(),
  status: mysqlEnum("status", ["pending", "processing", "succeeded", "failed", "refunded"]).default("pending").notNull(),
  receiptUrl: text("receiptUrl"),
  receiptData: json("receiptData"),
  errorMessage: text("errorMessage"),
  paidAt: timestamp("paidAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Payment = typeof payments.$inferSelect;
export type InsertPayment = typeof payments.$inferInsert;

// ==================== 广告落地页 ====================

export const landingPages = mysqlTable("landingPages", {
  id: int("id").autoincrement().primaryKey(),
  slug: varchar("slug", { length: 64 }).notNull().unique(),
  storeId: int("storeId"),
  titleZh: varchar("titleZh", { length: 256 }),
  titleRu: varchar("titleRu", { length: 256 }),
  titleEn: varchar("titleEn", { length: 256 }),
  contentZh: text("contentZh"),
  contentRu: text("contentRu"),
  contentEn: text("contentEn"),
  heroImage: text("heroImage"),
  welcomeCouponId: int("welcomeCouponId"),
  isActive: boolean("isActive").default(true).notNull(),
  views: int("views").default(0).notNull(),
  conversions: int("conversions").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type LandingPage = typeof landingPages.$inferSelect;
export type InsertLandingPage = typeof landingPages.$inferInsert;

// ==================== 系统配置 ====================

export const systemConfigs = mysqlTable("systemConfigs", {
  id: int("id").autoincrement().primaryKey(),
  key: varchar("key", { length: 64 }).notNull().unique(),
  value: text("value"),
  descriptionZh: varchar("descriptionZh", { length: 256 }),
  descriptionRu: varchar("descriptionRu", { length: 256 }),
  descriptionEn: varchar("descriptionEn", { length: 256 }),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SystemConfig = typeof systemConfigs.$inferSelect;
export type InsertSystemConfig = typeof systemConfigs.$inferInsert;

// ==================== 后台管理系统 ====================

// 管理员角色
export const adminRoles = mysqlTable("adminRoles", {
  id: int("id").autoincrement().primaryKey(),
  code: varchar("code", { length: 32 }).notNull().unique(),
  nameZh: varchar("nameZh", { length: 64 }).notNull(),
  nameRu: varchar("nameRu", { length: 64 }).notNull(),
  nameEn: varchar("nameEn", { length: 64 }).notNull(),
  permissions: json("permissions").$type<string[]>(),
  description: text("description"),
  isSystem: boolean("isSystem").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AdminRole = typeof adminRoles.$inferSelect;
export type InsertAdminRole = typeof adminRoles.$inferInsert;

// 管理员用户
export const adminUsers = mysqlTable("adminUsers", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  roleId: int("roleId").notNull(),
  storeIds: json("storeIds").$type<number[]>(),
  isActive: boolean("isActive").default(true).notNull(),
  lastLoginAt: timestamp("lastLoginAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AdminUser = typeof adminUsers.$inferSelect;
export type InsertAdminUser = typeof adminUsers.$inferInsert;

// 操作日志
export const operationLogs = mysqlTable("operationLogs", {
  id: int("id").autoincrement().primaryKey(),
  adminUserId: int("adminUserId").notNull(),
  module: varchar("module", { length: 32 }).notNull(),
  action: varchar("action", { length: 32 }).notNull(),
  targetType: varchar("targetType", { length: 32 }),
  targetId: int("targetId"),
  beforeData: json("beforeData"),
  afterData: json("afterData"),
  ipAddress: varchar("ipAddress", { length: 64 }),
  userAgent: text("userAgent"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type OperationLog = typeof operationLogs.$inferSelect;
export type InsertOperationLog = typeof operationLogs.$inferInsert;

// 广告位配置
export const adSlots = mysqlTable("adSlots", {
  id: int("id").autoincrement().primaryKey(),
  code: varchar("code", { length: 32 }).notNull().unique(),
  nameZh: varchar("nameZh", { length: 64 }).notNull(),
  nameRu: varchar("nameRu", { length: 64 }).notNull(),
  nameEn: varchar("nameEn", { length: 64 }).notNull(),
  position: mysqlEnum("position", ["home_top", "home_bottom", "menu_banner", "mall_banner", "popup"]).notNull(),
  width: int("width"),
  height: int("height"),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AdSlot = typeof adSlots.$inferSelect;
export type InsertAdSlot = typeof adSlots.$inferInsert;

// 广告素材
export const adMaterials = mysqlTable("adMaterials", {
  id: int("id").autoincrement().primaryKey(),
  slotId: int("slotId").notNull(),
  type: mysqlEnum("type", ["image", "video"]).default("image").notNull(),
  mediaUrl: text("mediaUrl").notNull(),
  thumbnailUrl: text("thumbnailUrl"),
  linkType: mysqlEnum("linkType", ["none", "product", "category", "page", "external"]).default("none"),
  linkValue: varchar("linkValue", { length: 256 }),
  titleZh: varchar("titleZh", { length: 128 }),
  titleRu: varchar("titleRu", { length: 128 }),
  titleEn: varchar("titleEn", { length: 128 }),
  sortOrder: int("sortOrder").default(0).notNull(),
  startAt: timestamp("startAt"),
  endAt: timestamp("endAt"),
  isActive: boolean("isActive").default(true).notNull(),
  clicks: int("clicks").default(0).notNull(),
  views: int("views").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AdMaterial = typeof adMaterials.$inferSelect;
export type InsertAdMaterial = typeof adMaterials.$inferInsert;

// 首页入口配置
export const homeEntries = mysqlTable("homeEntries", {
  id: int("id").autoincrement().primaryKey(),
  position: mysqlEnum("position", ["left", "right"]).notNull(),
  entryType: mysqlEnum("entryType", ["order", "mall", "coupons", "points", "member", "custom"]).notNull(),
  iconUrl: text("iconUrl"),
  nameZh: varchar("nameZh", { length: 32 }),
  nameRu: varchar("nameRu", { length: 32 }),
  nameEn: varchar("nameEn", { length: 32 }),
  linkPath: varchar("linkPath", { length: 128 }),
  bgColor: varchar("bgColor", { length: 32 }),
  isActive: boolean("isActive").default(true).notNull(),
  sortOrder: int("sortOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type HomeEntry = typeof homeEntries.$inferSelect;
export type InsertHomeEntry = typeof homeEntries.$inferInsert;

// 营销活动
export const marketingCampaigns = mysqlTable("marketingCampaigns", {
  id: int("id").autoincrement().primaryKey(),
  code: varchar("code", { length: 32 }).notNull().unique(),
  nameZh: varchar("nameZh", { length: 128 }).notNull(),
  nameRu: varchar("nameRu", { length: 128 }).notNull(),
  nameEn: varchar("nameEn", { length: 128 }).notNull(),
  type: mysqlEnum("type", ["auto_coupon", "points_bonus", "member_upgrade", "birthday", "recall", "custom"]).notNull(),
  triggerType: mysqlEnum("triggerType", ["event", "schedule", "manual"]).notNull(),
  triggerCondition: json("triggerCondition").$type<{
    event?: string;
    schedule?: string;
    userSegment?: string;
    conditions?: Array<{ field: string; operator: string; value: any }>;
  }>(),
  actionType: mysqlEnum("actionType", ["send_coupon", "add_points", "send_notification", "upgrade_member"]).notNull(),
  actionConfig: json("actionConfig").$type<{
    couponTemplateId?: number;
    pointsAmount?: number;
    notificationTemplate?: string;
    memberLevel?: string;
  }>(),
  priority: int("priority").default(0).notNull(),
  silencePeriod: int("silencePeriod").default(0),
  budget: decimal("budget", { precision: 12, scale: 2 }),
  usedBudget: decimal("usedBudget", { precision: 12, scale: 2 }).default("0.00"),
  maxExecutions: int("maxExecutions"),
  executionCount: int("executionCount").default(0).notNull(),
  startAt: timestamp("startAt"),
  endAt: timestamp("endAt"),
  status: mysqlEnum("status", ["draft", "pending", "active", "paused", "completed", "cancelled"]).default("draft").notNull(),
  createdBy: int("createdBy"),
  approvedBy: int("approvedBy"),
  approvedAt: timestamp("approvedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type MarketingCampaign = typeof marketingCampaigns.$inferSelect;
export type InsertMarketingCampaign = typeof marketingCampaigns.$inferInsert;

// 营销活动执行记录
export const campaignExecutions = mysqlTable("campaignExecutions", {
  id: int("id").autoincrement().primaryKey(),
  campaignId: int("campaignId").notNull(),
  userId: int("userId").notNull(),
  actionType: varchar("actionType", { length: 32 }).notNull(),
  actionResult: json("actionResult"),
  status: mysqlEnum("status", ["success", "failed", "skipped"]).notNull(),
  errorMessage: text("errorMessage"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CampaignExecution = typeof campaignExecutions.$inferSelect;
export type InsertCampaignExecution = typeof campaignExecutions.$inferInsert;

// 积分规则配置
export const pointsRules = mysqlTable("pointsRules", {
  id: int("id").autoincrement().primaryKey(),
  code: varchar("code", { length: 32 }).notNull().unique(),
  nameZh: varchar("nameZh", { length: 64 }).notNull(),
  nameRu: varchar("nameRu", { length: 64 }).notNull(),
  nameEn: varchar("nameEn", { length: 64 }).notNull(),
  ruleType: mysqlEnum("ruleType", ["earn", "redeem", "expire", "bonus"]).notNull(),
  baseRate: decimal("baseRate", { precision: 10, scale: 4 }),
  memberLevelMultiplier: json("memberLevelMultiplier").$type<{
    normal: number;
    silver: number;
    gold: number;
    diamond: number;
  }>(),
  maxPointsPerOrder: int("maxPointsPerOrder"),
  minOrderAmount: decimal("minOrderAmount", { precision: 10, scale: 2 }),
  expirationDays: int("expirationDays"),
  applicableOrderTypes: json("applicableOrderTypes").$type<string[]>(),
  excludeCategories: json("excludeCategories").$type<number[]>(),
  excludeProducts: json("excludeProducts").$type<number[]>(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PointsRule = typeof pointsRules.$inferSelect;
export type InsertPointsRule = typeof pointsRules.$inferInsert;

// 会员等级配置
export const memberLevelConfigs = mysqlTable("memberLevelConfigs", {
  id: int("id").autoincrement().primaryKey(),
  level: mysqlEnum("level", ["normal", "silver", "gold", "diamond"]).notNull().unique(),
  nameZh: varchar("nameZh", { length: 32 }).notNull(),
  nameRu: varchar("nameRu", { length: 32 }).notNull(),
  nameEn: varchar("nameEn", { length: 32 }).notNull(),
  minSpent: decimal("minSpent", { precision: 12, scale: 2 }).notNull(),
  pointsMultiplier: decimal("pointsMultiplier", { precision: 5, scale: 2 }).default("1.00").notNull(),
  discountRate: decimal("discountRate", { precision: 5, scale: 2 }).default("0.00").notNull(),
  birthdayGiftCouponId: int("birthdayGiftCouponId"),
  upgradeGiftCouponId: int("upgradeGiftCouponId"),
  benefits: json("benefits").$type<{
    freeDelivery?: boolean;
    prioritySupport?: boolean;
    exclusiveProducts?: boolean;
    earlyAccess?: boolean;
  }>(),
  iconUrl: text("iconUrl"),
  badgeColor: varchar("badgeColor", { length: 16 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type MemberLevelConfig = typeof memberLevelConfigs.$inferSelect;
export type InsertMemberLevelConfig = typeof memberLevelConfigs.$inferInsert;

// API配置
export const apiConfigs = mysqlTable("apiConfigs", {
  id: int("id").autoincrement().primaryKey(),
  provider: varchar("provider", { length: 32 }).notNull().unique(),
  nameZh: varchar("nameZh", { length: 64 }).notNull(),
  nameRu: varchar("nameRu", { length: 64 }).notNull(),
  nameEn: varchar("nameEn", { length: 64 }).notNull(),
  category: mysqlEnum("category", ["payment", "logistics", "pos", "notification", "other"]).notNull(),
  config: json("config").$type<Record<string, string>>(),
  isActive: boolean("isActive").default(false).notNull(),
  lastTestAt: timestamp("lastTestAt"),
  lastTestResult: mysqlEnum("lastTestResult", ["success", "failed"]),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ApiConfig = typeof apiConfigs.$inferSelect;
export type InsertApiConfig = typeof apiConfigs.$inferInsert;

// 异常监控记录
export const anomalyAlerts = mysqlTable("anomalyAlerts", {
  id: int("id").autoincrement().primaryKey(),
  alertType: mysqlEnum("alertType", ["fraud", "abuse", "system", "business"]).notNull(),
  severity: mysqlEnum("severity", ["info", "warning", "critical"]).notNull(),
  titleZh: varchar("titleZh", { length: 128 }).notNull(),
  titleRu: varchar("titleRu", { length: 128 }).notNull(),
  titleEn: varchar("titleEn", { length: 128 }).notNull(),
  description: text("description"),
  relatedUserId: int("relatedUserId"),
  relatedOrderId: int("relatedOrderId"),
  metadata: json("metadata"),
  status: mysqlEnum("status", ["open", "investigating", "resolved", "dismissed"]).default("open").notNull(),
  resolvedBy: int("resolvedBy"),
  resolvedAt: timestamp("resolvedAt"),
  resolution: text("resolution"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AnomalyAlert = typeof anomalyAlerts.$inferSelect;
export type InsertAnomalyAlert = typeof anomalyAlerts.$inferInsert;

// 优惠券审批流程
export const couponApprovals = mysqlTable("couponApprovals", {
  id: int("id").autoincrement().primaryKey(),
  templateId: int("templateId").notNull(),
  requestedBy: int("requestedBy").notNull(),
  requestType: mysqlEnum("requestType", ["create", "modify", "batch_issue"]).notNull(),
  requestData: json("requestData"),
  estimatedCost: decimal("estimatedCost", { precision: 12, scale: 2 }),
  status: mysqlEnum("status", ["pending", "approved", "rejected"]).default("pending").notNull(),
  approvedBy: int("approvedBy"),
  approvedAt: timestamp("approvedAt"),
  rejectReason: text("rejectReason"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CouponApproval = typeof couponApprovals.$inferSelect;
export type InsertCouponApproval = typeof couponApprovals.$inferInsert;

// 用户标签
export const userTags = mysqlTable("userTags", {
  id: int("id").autoincrement().primaryKey(),
  code: varchar("code", { length: 32 }).notNull().unique(),
  nameZh: varchar("nameZh", { length: 64 }).notNull(),
  nameRu: varchar("nameRu", { length: 64 }).notNull(),
  nameEn: varchar("nameEn", { length: 64 }).notNull(),
  color: varchar("color", { length: 16 }),
  category: mysqlEnum("category", ["behavior", "value", "lifecycle", "preference", "custom"]).notNull(),
  autoAssign: boolean("autoAssign").default(false).notNull(),
  assignCondition: json("assignCondition").$type<{
    field: string;
    operator: string;
    value: any;
  }>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type UserTag = typeof userTags.$inferSelect;
export type InsertUserTag = typeof userTags.$inferInsert;

// 用户标签关联
export const userTagAssignments = mysqlTable("userTagAssignments", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  tagId: int("tagId").notNull(),
  assignedBy: mysqlEnum("assignedBy", ["system", "manual"]).default("system").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type UserTagAssignment = typeof userTagAssignments.$inferSelect;
export type InsertUserTagAssignment = typeof userTagAssignments.$inferInsert;

// ==================== 通知系统 ====================

// 通知模板
export const notificationTemplates = mysqlTable("notificationTemplates", {
  id: int("id").autoincrement().primaryKey(),
  code: varchar("code", { length: 64 }).notNull().unique(),
  nameZh: varchar("nameZh", { length: 128 }).notNull(),
  nameRu: varchar("nameRu", { length: 128 }).notNull(),
  nameEn: varchar("nameEn", { length: 128 }).notNull(),
  category: mysqlEnum("category", ["order", "payment", "inventory", "user", "marketing", "system"]).notNull(),
  titleZh: varchar("titleZh", { length: 256 }).notNull(),
  titleRu: varchar("titleRu", { length: 256 }).notNull(),
  titleEn: varchar("titleEn", { length: 256 }).notNull(),
  contentZh: text("contentZh").notNull(),
  contentRu: text("contentRu").notNull(),
  contentEn: text("contentEn").notNull(),
  variables: json("variables").$type<string[]>(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type NotificationTemplate = typeof notificationTemplates.$inferSelect;
export type InsertNotificationTemplate = typeof notificationTemplates.$inferInsert;

// 通知规则
export const notificationRules = mysqlTable("notificationRules", {
  id: int("id").autoincrement().primaryKey(),
  templateId: int("templateId").notNull(),
  nameZh: varchar("nameZh", { length: 128 }).notNull(),
  nameRu: varchar("nameRu", { length: 128 }).notNull(),
  nameEn: varchar("nameEn", { length: 128 }).notNull(),
  triggerEvent: mysqlEnum("triggerEvent", [
    "new_order", "order_paid", "order_shipped", "order_completed", "order_cancelled",
    "payment_failed", "payment_refunded",
    "low_stock", "out_of_stock",
    "new_user", "user_birthday",
    "coupon_expiring", "points_expiring",
    "system_alert"
  ]).notNull(),
  channels: json("channels").$type<Array<"system" | "telegram" | "email" | "sms">>().notNull(),
  recipientType: mysqlEnum("recipientType", ["admin", "store_manager", "user", "custom"]).notNull(),
  recipientConfig: json("recipientConfig").$type<{
    roleIds?: number[];
    userIds?: number[];
    storeIds?: number[];
    telegramChatIds?: string[];
  }>(),
  conditions: json("conditions").$type<Array<{
    field: string;
    operator: string;
    value: any;
  }>>(),
  priority: mysqlEnum("priority", ["low", "normal", "high", "urgent"]).default("normal").notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type NotificationRule = typeof notificationRules.$inferSelect;
export type InsertNotificationRule = typeof notificationRules.$inferInsert;

// 通知记录
export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  templateId: int("templateId"),
  ruleId: int("ruleId"),
  recipientType: mysqlEnum("recipientType", ["admin", "user"]).notNull(),
  recipientId: int("recipientId").notNull(),
  channel: mysqlEnum("channel", ["system", "telegram", "email", "sms"]).notNull(),
  titleZh: varchar("titleZh", { length: 256 }).notNull(),
  titleRu: varchar("titleRu", { length: 256 }).notNull(),
  titleEn: varchar("titleEn", { length: 256 }).notNull(),
  contentZh: text("contentZh").notNull(),
  contentRu: text("contentRu").notNull(),
  contentEn: text("contentEn").notNull(),
  priority: mysqlEnum("priority", ["low", "normal", "high", "urgent"]).default("normal").notNull(),
  relatedType: varchar("relatedType", { length: 32 }),
  relatedId: int("relatedId"),
  metadata: json("metadata"),
  status: mysqlEnum("status", ["pending", "sent", "delivered", "failed", "read"]).default("pending").notNull(),
  sentAt: timestamp("sentAt"),
  readAt: timestamp("readAt"),
  errorMessage: text("errorMessage"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;

// Telegram Bot 配置
export const telegramBotConfigs = mysqlTable("telegramBotConfigs", {
  id: int("id").autoincrement().primaryKey(),
  botToken: varchar("botToken", { length: 128 }),
  botUsername: varchar("botUsername", { length: 64 }),
  webhookUrl: text("webhookUrl"),
  adminChatId: varchar("adminChatId", { length: 64 }),
  isActive: boolean("isActive").default(false).notNull(),
  lastTestAt: timestamp("lastTestAt"),
  lastTestResult: mysqlEnum("lastTestResult", ["success", "failed"]),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type TelegramBotConfig = typeof telegramBotConfigs.$inferSelect;
export type InsertTelegramBotConfig = typeof telegramBotConfigs.$inferInsert;

// 管理员 Telegram 绑定
export const adminTelegramBindings = mysqlTable("adminTelegramBindings", {
  id: int("id").autoincrement().primaryKey(),
  adminUserId: int("adminUserId").notNull().unique(),
  telegramChatId: varchar("telegramChatId", { length: 64 }).notNull(),
  telegramUsername: varchar("telegramUsername", { length: 64 }),
  notifyNewOrder: boolean("notifyNewOrder").default(true).notNull(),
  notifyPaymentFailed: boolean("notifyPaymentFailed").default(true).notNull(),
  notifyLowStock: boolean("notifyLowStock").default(true).notNull(),
  notifySystemAlert: boolean("notifySystemAlert").default(true).notNull(),
  isVerified: boolean("isVerified").default(false).notNull(),
  verificationCode: varchar("verificationCode", { length: 16 }),
  verifiedAt: timestamp("verifiedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AdminTelegramBinding = typeof adminTelegramBindings.$inferSelect;
export type InsertAdminTelegramBinding = typeof adminTelegramBindings.$inferInsert;


// ==================== IIKO 系统集成 ====================

/**
 * IIKO API 配置表
 * 存储 IIKO 系统的 API 连接配置
 * 每个门店可以有独立的 IIKO 配置（支持多个体户）
 */
export const iikoConfig = mysqlTable("iiko_config", {
  id: int("id").autoincrement().primaryKey(),
  
  // 门店关联（支持一个门店一个配置）
  storeId: int("storeId"), // 关联门店 ID（可选，null 表示全局配置）
  configName: varchar("configName", { length: 255 }).notNull(), // 配置名称（用于区分多个配置）
  
  // API 配置
  apiUrl: varchar("apiUrl", { length: 255 }).notNull().default("https://api-ru.iiko.services"),
  apiLogin: varchar("apiLogin", { length: 255 }).notNull(), // API 登录凭证
  
  // 组织配置
  organizationId: varchar("organizationId", { length: 64 }).notNull(), // 组织 ID (UUID)
  organizationName: varchar("organizationName", { length: 255 }), // 组织名称（可选，用于显示）
  
  // 终端配置
  terminalGroupId: varchar("terminalGroupId", { length: 64 }), // 终端组 ID (UUID，可选)
  terminalGroupName: varchar("terminalGroupName", { length: 255 }), // 终端组名称（可选，用于显示）
  
  // 菜单同步配置
  menuRevision: int("menuRevision").default(0), // 菜单版本号，用于增量更新
  lastMenuSyncAt: timestamp("lastMenuSyncAt"), // 最后一次菜单同步时间
  autoSyncMenu: boolean("autoSyncMenu").notNull().default(false), // 是否自动同步菜单
  syncIntervalMinutes: int("syncIntervalMinutes").default(30), // 同步间隔（分钟）
  
  // 状态和元数据
  isActive: boolean("isActive").notNull().default(true), // 是否启用
  accessToken: text("accessToken"), // 当前访问令牌（缓存）
  tokenExpiresAt: timestamp("tokenExpiresAt"), // 令牌过期时间
  
  // 限流配置
  maxRequestsPerMinute: int("maxRequestsPerMinute").default(60), // 每分钟最大请求数
  lastRequestAt: timestamp("lastRequestAt"), // 最后一次请求时间
  requestCount: int("requestCount").default(0), // 当前分钟内请求计数
  
  // 时间戳
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type IikoConfig = typeof iikoConfig.$inferSelect;
export type InsertIikoConfig = typeof iikoConfig.$inferInsert;

/**
 * IIKO 订单数据缓存表
 * 中间层暂存订单数据，批量同步到 IIKO，避免频繁调用
 */
export const iikoOrderQueue = mysqlTable("iiko_order_queue", {
  id: int("id").autoincrement().primaryKey(),
  
  // 关联本地订单
  orderId: int("orderId").notNull(), // 本地订单 ID
  orderNo: varchar("orderNo", { length: 64 }).notNull(), // 本地订单号
  storeId: int("storeId").notNull(), // 门店 ID
  
  // 订单数据快照（JSON 格式）
  orderData: text("orderData").notNull(), // 完整订单数据（JSON）
  
  // 队列状态
  queueStatus: mysqlEnum("queueStatus", ["pending", "processing", "completed", "failed"]).notNull().default("pending"),
  priority: int("priority").notNull().default(0), // 优先级（数字越大优先级越高）
  retryCount: int("retryCount").notNull().default(0), // 重试次数
  maxRetries: int("maxRetries").notNull().default(3), // 最大重试次数
  
  // 执行信息
  processedAt: timestamp("processedAt"), // 处理时间
  completedAt: timestamp("completedAt"), // 完成时间
  errorMessage: text("errorMessage"), // 错误消息
  
  // 时间戳
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type IikoOrderQueue = typeof iikoOrderQueue.$inferSelect;
export type InsertIikoOrderQueue = typeof iikoOrderQueue.$inferInsert;

/**
 * IIKO 订单同步记录表
 * 记录订单同步到 IIKO 的状态
 */
export const iikoOrderSync = mysqlTable("iiko_order_sync", {
  id: int("id").autoincrement().primaryKey(),
  
  // 关联本地订单
  orderId: int("orderId").notNull(), // 本地订单 ID
  orderNo: varchar("orderNo", { length: 64 }).notNull(), // 本地订单号
  
  // IIKO 订单信息
  iikoOrderId: varchar("iikoOrderId", { length: 64 }), // IIKO 订单 ID (UUID)
  iikoExternalNumber: varchar("iikoExternalNumber", { length: 64 }), // IIKO 外部订单号
  
  // 同步状态
  syncStatus: mysqlEnum("syncStatus", ["pending", "syncing", "success", "failed"]).notNull().default("pending"),
  syncAttempts: int("syncAttempts").notNull().default(0), // 同步尝试次数
  lastSyncAt: timestamp("lastSyncAt"), // 最后一次同步时间
  
  // 错误信息
  errorMessage: text("errorMessage"), // 错误消息
  errorCode: varchar("errorCode", { length: 64 }), // 错误代码
  
  // 时间戳
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type IikoOrderSync = typeof iikoOrderSync.$inferSelect;
export type InsertIikoOrderSync = typeof iikoOrderSync.$inferInsert;

/**
 * IIKO 菜单同步记录表
 * 记录从 IIKO 同步的菜单数据（缓存层）
 */
export const iikoMenuSync = mysqlTable("iiko_menu_sync", {
  id: int("id").autoincrement().primaryKey(),
  
  // 关联配置
  configId: int("configId").notNull(), // IIKO 配置 ID
  storeId: int("storeId"), // 门店 ID（可选）
  
  // IIKO 商品信息
  iikoProductId: varchar("iikoProductId", { length: 64 }).notNull(), // IIKO 商品 ID (UUID)
  iikoProductName: varchar("iikoProductName", { length: 255 }).notNull(), // IIKO 商品名称
  iikoCategoryId: varchar("iikoCategoryId", { length: 64 }), // IIKO 分类 ID
  iikoCategoryName: varchar("iikoCategoryName", { length: 255 }), // IIKO 分类名称
  
  // 关联本地商品
  localProductId: int("localProductId"), // 本地商品 ID
  
  // 商品数据（缓存）
  productData: text("productData"), // 完整商品数据（JSON）
  price: decimal("price", { precision: 10, scale: 2 }), // 价格
  isAvailable: boolean("isAvailable").notNull().default(true), // 是否可用
  isInStopList: boolean("isInStopList").notNull().default(false), // 是否在缺货列表中
  
  // 同步信息
  lastSyncAt: timestamp("lastSyncAt").notNull(), // 最后同步时间
  syncStatus: mysqlEnum("syncStatus", ["success", "failed", "pending"]).notNull().default("success"),
  
  // 时间戳
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type IikoMenuSync = typeof iikoMenuSync.$inferSelect;
export type InsertIikoMenuSync = typeof iikoMenuSync.$inferInsert;
