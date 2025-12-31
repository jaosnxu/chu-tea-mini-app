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
