import { eq, and, desc, sql, inArray, gte, lte, or, isNull, like, ne } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { nanoid } from "nanoid";
import { 
  InsertUser, users, stores, categories, products, productOptions, productOptionItems,
  productSkus, cartItems, addresses, orders, orderItems, shipments,
  couponTemplates, userCoupons, pointsHistory, influencers, influencerLinks,
  influencerCommissions, payments, landingPages, systemConfigs,
  operationLogs, homeEntries, apiConfigs, marketingCampaigns, adMaterials,
  notifications, notificationTemplates, notificationRules,
  telegramBotConfigs, adminTelegramBindings,
  InsertNotification
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ==================== 用户相关 ====================

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = { openId: user.openId };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ==================== 门店相关 ====================

export async function getActiveStores() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(stores).where(eq(stores.status, 'active'));
}

export async function getStoreById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(stores).where(eq(stores.id, id)).limit(1);
  return result.length > 0 ? result[0] : null;
}

// ==================== 分类相关 ====================

export async function getCategories(type?: 'tea' | 'mall') {
  const db = await getDb();
  if (!db) return [];
  
  const conditions = [eq(categories.isActive, true)];
  if (type) {
    conditions.push(eq(categories.type, type));
  }
  
  return await db.select().from(categories)
    .where(and(...conditions))
    .orderBy(categories.sortOrder);
}

// ==================== 商品相关 ====================

export async function getProducts(params?: {
  categoryId?: number;
  type?: 'tea' | 'mall';
  isHot?: boolean;
  isNew?: boolean;
  limit?: number;
}) {
  const db = await getDb();
  if (!db) return [];
  
  const conditions = [eq(products.isActive, true)];
  
  if (params?.categoryId) {
    conditions.push(eq(products.categoryId, params.categoryId));
  }
  if (params?.type) {
    conditions.push(eq(products.type, params.type));
  }
  if (params?.isHot) {
    conditions.push(eq(products.isHot, true));
  }
  if (params?.isNew) {
    conditions.push(eq(products.isNew, true));
  }
  
  let query = db.select().from(products)
    .where(and(...conditions))
    .orderBy(products.sortOrder);
  
  if (params?.limit) {
    query = query.limit(params.limit) as typeof query;
  }
  
  return await query;
}

export async function getProductById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(products).where(eq(products.id, id)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function getProductOptions(productId: number) {
  const db = await getDb();
  if (!db) return [];
  
  const options = await db.select().from(productOptions)
    .where(eq(productOptions.productId, productId))
    .orderBy(productOptions.sortOrder);
  
  const optionIds = options.map(o => o.id);
  if (optionIds.length === 0) return [];
  
  const items = await db.select().from(productOptionItems)
    .where(and(
      inArray(productOptionItems.optionId, optionIds),
      eq(productOptionItems.isActive, true)
    ))
    .orderBy(productOptionItems.sortOrder);
  
  return options.map(option => ({
    ...option,
    items: items.filter(item => item.optionId === option.id),
  }));
}

export async function getProductSkus(productId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(productSkus)
    .where(and(eq(productSkus.productId, productId), eq(productSkus.isActive, true)));
}

// ==================== 购物车相关 ====================

export async function getCartItems(userId: number, cartType?: 'tea' | 'mall') {
  const db = await getDb();
  if (!db) return [];
  
  const conditions = [eq(cartItems.userId, userId)];
  if (cartType) {
    conditions.push(eq(cartItems.cartType, cartType));
  }
  
  const items = await db.select().from(cartItems).where(and(...conditions));
  
  // 获取商品信息
  const productIds = Array.from(new Set(items.map(i => i.productId)));
  if (productIds.length === 0) return [];
  
  const productList = await db.select().from(products).where(inArray(products.id, productIds));
  const productMap = new Map(productList.map(p => [p.id, p]));
  
  return items.map(item => ({
    ...item,
    product: productMap.get(item.productId) || null,
  }));
}

export async function addToCart(userId: number, data: {
  productId: number;
  skuId?: number;
  quantity: number;
  selectedOptions?: Array<{ optionId: number; itemId: number; name: string; price: string }>;
  unitPrice: string;
  cartType: 'tea' | 'mall';
  storeId?: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.insert(cartItems).values({
    userId,
    productId: data.productId,
    skuId: data.skuId,
    quantity: data.quantity,
    selectedOptions: data.selectedOptions,
    unitPrice: data.unitPrice,
    cartType: data.cartType,
    storeId: data.storeId,
  });
  
  return { success: true };
}

export async function updateCartItem(userId: number, id: number, quantity: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(cartItems)
    .set({ quantity })
    .where(and(eq(cartItems.id, id), eq(cartItems.userId, userId)));
  
  return { success: true };
}

export async function removeFromCart(userId: number, id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(cartItems).where(and(eq(cartItems.id, id), eq(cartItems.userId, userId)));
  return { success: true };
}

export async function clearCart(userId: number, cartType?: 'tea' | 'mall') {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const conditions = [eq(cartItems.userId, userId)];
  if (cartType) {
    conditions.push(eq(cartItems.cartType, cartType));
  }
  
  await db.delete(cartItems).where(and(...conditions));
  return { success: true };
}

// ==================== 地址相关 ====================

export async function getUserAddresses(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(addresses)
    .where(eq(addresses.userId, userId))
    .orderBy(desc(addresses.isDefault), desc(addresses.createdAt));
}

export async function addAddress(userId: number, data: {
  name: string;
  phone: string;
  province?: string;
  city?: string;
  district?: string;
  address: string;
  postalCode?: string;
  latitude?: string;
  longitude?: string;
  isDefault?: boolean;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // 如果是默认地址，先取消其他默认
  if (data.isDefault) {
    await db.update(addresses).set({ isDefault: false }).where(eq(addresses.userId, userId));
  }
  
  const result = await db.insert(addresses).values({
    userId,
    ...data,
    isDefault: data.isDefault || false,
  });
  
  return { success: true, id: Number(result[0].insertId) };
}

export async function updateAddress(userId: number, data: {
  id: number;
  name?: string;
  phone?: string;
  province?: string;
  city?: string;
  district?: string;
  address?: string;
  postalCode?: string;
  latitude?: string;
  longitude?: string;
  isDefault?: boolean;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const { id, ...updateData } = data;
  
  if (updateData.isDefault) {
    await db.update(addresses).set({ isDefault: false }).where(eq(addresses.userId, userId));
  }
  
  await db.update(addresses)
    .set(updateData)
    .where(and(eq(addresses.id, id), eq(addresses.userId, userId)));
  
  return { success: true };
}

export async function deleteAddress(userId: number, id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(addresses).where(and(eq(addresses.id, id), eq(addresses.userId, userId)));
  return { success: true };
}

export async function setDefaultAddress(userId: number, id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(addresses).set({ isDefault: false }).where(eq(addresses.userId, userId));
  await db.update(addresses).set({ isDefault: true }).where(and(eq(addresses.id, id), eq(addresses.userId, userId)));
  
  return { success: true };
}

// ==================== 订单相关 ====================

function generateOrderNo(): string {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
  const random = nanoid(8).toUpperCase();
  return `CHU${dateStr}${random}`;
}

export async function getUserOrders(userId: number, params?: {
  orderType?: 'tea' | 'mall';
  status?: string;
  limit?: number;
  offset?: number;
}) {
  const db = await getDb();
  if (!db) return [];
  
  const conditions = [eq(orders.userId, userId)];
  
  if (params?.orderType) {
    conditions.push(eq(orders.orderType, params.orderType));
  }
  if (params?.status) {
    conditions.push(eq(orders.status, params.status as typeof orders.status.enumValues[number]));
  }
  
  let query = db.select().from(orders)
    .where(and(...conditions))
    .orderBy(desc(orders.createdAt));
  
  if (params?.limit) {
    query = query.limit(params.limit) as typeof query;
  }
  if (params?.offset) {
    query = query.offset(params.offset) as typeof query;
  }
  
  return await query;
}

export async function getOrderById(userId: number, id: number) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.select().from(orders)
    .where(and(eq(orders.id, id), eq(orders.userId, userId)))
    .limit(1);
  
  if (result.length === 0) return null;
  
  const order = result[0];
  const items = await db.select().from(orderItems).where(eq(orderItems.orderId, id));
  
  return { ...order, items };
}

export async function getOrderByOrderNo(userId: number, orderNo: string) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.select().from(orders)
    .where(and(eq(orders.orderNo, orderNo), eq(orders.userId, userId)))
    .limit(1);
  
  if (result.length === 0) return null;
  
  const order = result[0];
  const items = await db.select().from(orderItems).where(eq(orderItems.orderId, order.id));
  
  return { ...order, items };
}

export async function createOrder(userId: number, data: {
  orderType: 'tea' | 'mall';
  deliveryType: 'delivery' | 'pickup';
  storeId?: number;
  addressId?: number;
  pickupTime?: string;
  couponId?: number;
  pointsUsed?: number;
  remark?: string;
  items: Array<{
    productId: number;
    skuId?: number;
    quantity: number;
    unitPrice: string;
    selectedOptions?: Array<{ name: string; value: string; price: string }>;
  }>;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const orderNo = generateOrderNo();
  
  // 计算订单金额
  let subtotal = 0;
  for (const item of data.items) {
    subtotal += parseFloat(item.unitPrice) * item.quantity;
  }
  
  // 获取地址快照
  let addressSnapshot = null;
  if (data.addressId) {
    const addr = await db.select().from(addresses).where(eq(addresses.id, data.addressId)).limit(1);
    if (addr.length > 0) {
      addressSnapshot = {
        name: addr[0].name,
        phone: addr[0].phone,
        address: addr[0].address,
        latitude: addr[0].latitude || undefined,
        longitude: addr[0].longitude || undefined,
      };
    }
  }
  
  // 计算优惠
  let couponDiscount = 0;
  let pointsDiscount = 0;
  
  if (data.pointsUsed && data.pointsUsed > 0) {
    pointsDiscount = data.pointsUsed / 100; // 100积分 = 1元
  }
  
  const totalAmount = Math.max(0, subtotal - couponDiscount - pointsDiscount);
  
  // 创建订单
  const result = await db.insert(orders).values({
    orderNo,
    userId,
    storeId: data.storeId,
    orderType: data.orderType,
    deliveryType: data.deliveryType,
    addressId: data.addressId,
    addressSnapshot,
    pickupTime: data.pickupTime ? new Date(data.pickupTime) : null,
    subtotal: subtotal.toFixed(2),
    couponId: data.couponId,
    couponDiscount: couponDiscount.toFixed(2),
    pointsUsed: data.pointsUsed || 0,
    pointsDiscount: pointsDiscount.toFixed(2),
    totalAmount: totalAmount.toFixed(2),
    remarkZh: data.remark,
    remarkRu: data.remark,
    remarkEn: data.remark,
  });
  
  const orderId = Number(result[0].insertId);
  
  // 创建订单项
  for (const item of data.items) {
    const product = await getProductById(item.productId);
    await db.insert(orderItems).values({
      orderId,
      productId: item.productId,
      skuId: item.skuId,
      productSnapshot: {
        name: product?.nameRu || '',
        image: product?.image || undefined,
        options: item.selectedOptions,
      },
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      totalPrice: (parseFloat(item.unitPrice) * item.quantity).toFixed(2),
    });
  }
  
  // 清空购物车
  await clearCart(userId, data.orderType);
  
  return { success: true, orderId, orderNo };
}

export async function cancelOrder(userId: number, id: number, reason?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const order = await db.select().from(orders)
    .where(and(eq(orders.id, id), eq(orders.userId, userId)))
    .limit(1);
  
  if (order.length === 0) {
    throw new Error("Order not found");
  }
  
  if (!['pending', 'paid'].includes(order[0].status)) {
    throw new Error("Order cannot be cancelled");
  }
  
  await db.update(orders)
    .set({
      status: 'cancelled',
      cancelReason: reason,
      cancelledAt: new Date(),
    })
    .where(eq(orders.id, id));
  
  return { success: true };
}

// ==================== 优惠券相关 ====================

export async function getUserCoupons(userId: number, status?: 'available' | 'used' | 'expired') {
  const db = await getDb();
  if (!db) return [];
  
  const conditions = [eq(userCoupons.userId, userId)];
  
  if (status) {
    conditions.push(eq(userCoupons.status, status));
  }
  
  const coupons = await db.select().from(userCoupons)
    .where(and(...conditions))
    .orderBy(desc(userCoupons.createdAt));
  
  // 获取优惠券模板信息
  const templateIds = Array.from(new Set(coupons.map(c => c.templateId)));
  if (templateIds.length === 0) return [];
  
  const templates = await db.select().from(couponTemplates)
    .where(inArray(couponTemplates.id, templateIds));
  const templateMap = new Map(templates.map(t => [t.id, t]));
  
  return coupons.map(coupon => ({
    ...coupon,
    template: templateMap.get(coupon.templateId) || null,
  }));
}

export async function getAvailableCoupons(userId: number, params: {
  orderAmount: string;
  storeId?: number;
  productIds?: number[];
}) {
  const db = await getDb();
  if (!db) return [];
  
  const now = new Date();
  const orderAmount = parseFloat(params.orderAmount);
  
  const coupons = await db.select().from(userCoupons)
    .innerJoin(couponTemplates, eq(userCoupons.templateId, couponTemplates.id))
    .where(and(
      eq(userCoupons.userId, userId),
      eq(userCoupons.status, 'available'),
      or(isNull(userCoupons.expireAt), gte(userCoupons.expireAt, now))
    ));
  
  // 过滤符合条件的优惠券
  return coupons.filter(({ couponTemplates: template }) => {
    // 检查最低订单金额
    if (template.minOrderAmount && parseFloat(template.minOrderAmount) > orderAmount) {
      return false;
    }
    
    // 检查门店限制
    if (template.applicableStores && params.storeId) {
      const stores = template.applicableStores as number[];
      if (stores.length > 0 && !stores.includes(params.storeId)) {
        return false;
      }
    }
    
    return true;
  }).map(({ userCoupons: coupon, couponTemplates: template }) => ({
    ...coupon,
    template,
  }));
}

export async function claimCoupon(userId: number, templateId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // 检查优惠券模板
  const template = await db.select().from(couponTemplates)
    .where(and(eq(couponTemplates.id, templateId), eq(couponTemplates.isActive, true)))
    .limit(1);
  
  if (template.length === 0) {
    throw new Error("Coupon not found");
  }
  
  const tpl = template[0];
  
  // 检查是否还有库存
  if (tpl.totalQuantity !== null && tpl.totalQuantity !== -1 && tpl.usedQuantity >= tpl.totalQuantity) {
    throw new Error("Coupon sold out");
  }
  
  // 检查用户领取限制
  const userCouponCount = await db.select({ count: sql<number>`count(*)` })
    .from(userCoupons)
    .where(and(eq(userCoupons.userId, userId), eq(userCoupons.templateId, templateId)));
  
  if (tpl.perUserLimit && userCouponCount[0].count >= tpl.perUserLimit) {
    throw new Error("Coupon claim limit reached");
  }
  
  // 计算过期时间
  let expireAt: Date | null = null;
  if (tpl.validDays) {
    expireAt = new Date();
    expireAt.setDate(expireAt.getDate() + tpl.validDays);
  } else if (tpl.endAt) {
    expireAt = tpl.endAt;
  }
  
  // 创建用户优惠券
  await db.insert(userCoupons).values({
    userId,
    templateId,
    expireAt,
  });
  
  // 更新已领取数量
  await db.update(couponTemplates)
    .set({ usedQuantity: sql`${couponTemplates.usedQuantity} + 1` })
    .where(eq(couponTemplates.id, templateId));
  
  return { success: true };
}

// ==================== 积分相关 ====================

export async function getPointsBalance(userId: number) {
  const db = await getDb();
  if (!db) return { total: 0, available: 0 };
  
  const user = await db.select({
    totalPoints: users.totalPoints,
    availablePoints: users.availablePoints,
  }).from(users).where(eq(users.id, userId)).limit(1);
  
  if (user.length === 0) return { total: 0, available: 0 };
  
  return {
    total: user[0].totalPoints,
    available: user[0].availablePoints,
  };
}

export async function getPointsHistory(userId: number, params?: { limit?: number; offset?: number }) {
  const db = await getDb();
  if (!db) return [];
  
  let query = db.select().from(pointsHistory)
    .where(eq(pointsHistory.userId, userId))
    .orderBy(desc(pointsHistory.createdAt));
  
  if (params?.limit) {
    query = query.limit(params.limit) as typeof query;
  }
  if (params?.offset) {
    query = query.offset(params.offset) as typeof query;
  }
  
  return await query;
}

// ==================== 会员相关 ====================

export async function getMemberInfo(userId: number) {
  const db = await getDb();
  if (!db) return null;
  
  const user = await db.select({
    id: users.id,
    name: users.name,
    avatar: users.avatar,
    memberLevel: users.memberLevel,
    totalPoints: users.totalPoints,
    availablePoints: users.availablePoints,
    totalSpent: users.totalSpent,
  }).from(users).where(eq(users.id, userId)).limit(1);
  
  if (user.length === 0) return null;
  
  // 计算升级进度
  const levelThresholds = {
    normal: 0,
    silver: 1000,
    gold: 5000,
    diamond: 20000,
  };
  
  const currentLevel = user[0].memberLevel;
  const totalSpent = parseFloat(user[0].totalSpent);
  
  let nextLevel: string | null = null;
  let nextLevelThreshold = 0;
  let progress = 100;
  
  if (currentLevel === 'normal') {
    nextLevel = 'silver';
    nextLevelThreshold = levelThresholds.silver;
    progress = Math.min(100, (totalSpent / nextLevelThreshold) * 100);
  } else if (currentLevel === 'silver') {
    nextLevel = 'gold';
    nextLevelThreshold = levelThresholds.gold;
    progress = Math.min(100, (totalSpent / nextLevelThreshold) * 100);
  } else if (currentLevel === 'gold') {
    nextLevel = 'diamond';
    nextLevelThreshold = levelThresholds.diamond;
    progress = Math.min(100, (totalSpent / nextLevelThreshold) * 100);
  }
  
  return {
    ...user[0],
    nextLevel,
    nextLevelThreshold,
    progress,
    amountToNextLevel: nextLevelThreshold > 0 ? Math.max(0, nextLevelThreshold - totalSpent) : 0,
  };
}

// ==================== 达人推广相关 ====================

export async function getInfluencerInfo(userId: number) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.select().from(influencers)
    .where(eq(influencers.userId, userId))
    .limit(1);
  
  return result.length > 0 ? result[0] : null;
}

export async function applyAsInfluencer(userId: number, data: {
  nameZh?: string;
  nameRu?: string;
  nameEn?: string;
  bio?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // 检查是否已申请
  const existing = await db.select().from(influencers)
    .where(eq(influencers.userId, userId))
    .limit(1);
  
  if (existing.length > 0) {
    throw new Error("Already applied");
  }
  
  const code = nanoid(8).toUpperCase();
  
  await db.insert(influencers).values({
    userId,
    code,
    nameZh: data.nameZh,
    nameRu: data.nameRu,
    nameEn: data.nameEn,
    bio: data.bio,
    status: 'pending',
  });
  
  // 更新用户角色
  await db.update(users).set({ role: 'influencer' }).where(eq(users.id, userId));
  
  return { success: true, code };
}

export async function getInfluencerLinks(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  const influencer = await getInfluencerInfo(userId);
  if (!influencer) return [];
  
  return await db.select().from(influencerLinks)
    .where(eq(influencerLinks.influencerId, influencer.id))
    .orderBy(desc(influencerLinks.createdAt));
}

export async function createInfluencerLink(userId: number, data: {
  storeId?: number;
  campaignName?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const influencer = await getInfluencerInfo(userId);
  if (!influencer) {
    throw new Error("Not an influencer");
  }
  
  if (influencer.status !== 'active') {
    throw new Error("Influencer account not active");
  }
  
  const shortCode = nanoid(10);
  
  await db.insert(influencerLinks).values({
    influencerId: influencer.id,
    storeId: data.storeId,
    campaignName: data.campaignName,
    shortCode,
  });
  
  return { success: true, shortCode };
}

export async function getInfluencerStatistics(userId: number) {
  const db = await getDb();
  if (!db) return null;
  
  const influencer = await getInfluencerInfo(userId);
  if (!influencer) return null;
  
  return {
    totalClicks: influencer.totalClicks,
    totalRegistrations: influencer.totalRegistrations,
    totalOrders: influencer.totalOrders,
    totalGmv: influencer.totalGmv,
    totalCommission: influencer.totalCommission,
    pendingCommission: influencer.pendingCommission,
    withdrawnCommission: influencer.withdrawnCommission,
  };
}

export async function getInfluencerCommissions(userId: number, params?: {
  status?: 'pending' | 'confirmed' | 'paid' | 'cancelled';
  limit?: number;
  offset?: number;
}) {
  const db = await getDb();
  if (!db) return [];
  
  const influencer = await getInfluencerInfo(userId);
  if (!influencer) return [];
  
  const conditions = [eq(influencerCommissions.influencerId, influencer.id)];
  
  if (params?.status) {
    conditions.push(eq(influencerCommissions.status, params.status));
  }
  
  let query = db.select().from(influencerCommissions)
    .where(and(...conditions))
    .orderBy(desc(influencerCommissions.createdAt));
  
  if (params?.limit) {
    query = query.limit(params.limit) as typeof query;
  }
  if (params?.offset) {
    query = query.offset(params.offset) as typeof query;
  }
  
  return await query;
}

// ==================== 落地页相关 ====================

export async function getLandingPageBySlug(slug: string) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.select().from(landingPages)
    .where(and(eq(landingPages.slug, slug), eq(landingPages.isActive, true)))
    .limit(1);
  
  return result.length > 0 ? result[0] : null;
}

export async function trackLandingPageView(slug: string) {
  const db = await getDb();
  if (!db) return { success: false };
  
  await db.update(landingPages)
    .set({ views: sql`${landingPages.views} + 1` })
    .where(eq(landingPages.slug, slug));
  
  return { success: true };
}

// ==================== Telegram 用户同步 ====================

export async function syncTelegramUser(data: {
  telegramId: string;
  username?: string;
  firstName: string;
  lastName?: string;
  languageCode?: string;
  photoUrl?: string;
  startParam?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // 查找已有用户
  const existing = await db.select().from(users)
    .where(eq(users.telegramId, data.telegramId))
    .limit(1);
  
  const name = [data.firstName, data.lastName].filter(Boolean).join(' ');
  
  if (existing.length > 0) {
    // 更新用户信息
    await db.update(users)
      .set({
        telegramUsername: data.username,
        name,
        avatar: data.photoUrl,
        language: data.languageCode?.startsWith('zh') ? 'zh' : 
                  data.languageCode?.startsWith('ru') ? 'ru' : 'en',
        lastSignedIn: new Date(),
      })
      .where(eq(users.telegramId, data.telegramId));
    
    return { success: true, userId: existing[0].id, isNew: false };
  }
  
  // 创建新用户
  const openId = `tg_${data.telegramId}`;
  const referrerCode = nanoid(8).toUpperCase();
  
  // 处理推荐人
  let referrerId: number | undefined;
  if (data.startParam) {
    // startParam 可能是推广链接的 shortCode
    const link = await db.select().from(influencerLinks)
      .where(eq(influencerLinks.shortCode, data.startParam))
      .limit(1);
    
    if (link.length > 0) {
      const influencer = await db.select().from(influencers)
        .where(eq(influencers.id, link[0].influencerId))
        .limit(1);
      
      if (influencer.length > 0) {
        referrerId = influencer[0].userId;
        
        // 更新推广链接统计
        await db.update(influencerLinks)
          .set({ registrations: sql`${influencerLinks.registrations} + 1` })
          .where(eq(influencerLinks.id, link[0].id));
        
        // 更新达人统计
        await db.update(influencers)
          .set({ totalRegistrations: sql`${influencers.totalRegistrations} + 1` })
          .where(eq(influencers.id, link[0].influencerId));
      }
    }
  }
  
  const result = await db.insert(users).values({
    openId,
    telegramId: data.telegramId,
    telegramUsername: data.username,
    name,
    avatar: data.photoUrl,
    language: data.languageCode?.startsWith('zh') ? 'zh' : 
              data.languageCode?.startsWith('ru') ? 'ru' : 'en',
    referrerId,
    referrerCode,
  });
  
  return { success: true, userId: Number(result[0].insertId), isNew: true };
}


// ==================== 后台管理 - 仪表盘 ====================

export async function getAdminDashboardStats() {
  const db = await getDb();
  if (!db) return null;
  
  // 获取今日数据
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const [
    totalUsers,
    totalOrders,
    todayOrders,
    totalRevenue,
  ] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(users),
    db.select({ count: sql<number>`count(*)` }).from(orders),
    db.select({ count: sql<number>`count(*)` }).from(orders).where(gte(orders.createdAt, today)),
    db.select({ sum: sql<string>`COALESCE(SUM(totalAmount), 0)` }).from(orders).where(eq(orders.status, 'completed')),
  ]);
  
  return {
    totalUsers: totalUsers[0]?.count || 0,
    totalOrders: totalOrders[0]?.count || 0,
    todayOrders: todayOrders[0]?.count || 0,
    totalRevenue: totalRevenue[0]?.sum || '0',
  };
}

// ==================== 后台管理 - 广告管理 ====================

export async function getAdminAds() {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(adMaterials).orderBy(adMaterials.sortOrder);
}

export async function createAd(data: any, operatorId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(adMaterials).values({
    ...data,
  });
  
  await logOperation(operatorId, 'ads', 'create', result[0].insertId.toString(), data);
  
  return { success: true, id: Number(result[0].insertId) };
}

export async function updateAd(data: { id: number; [key: string]: any }, operatorId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const { id, ...updateData } = data;
  await db.update(adMaterials).set(updateData).where(eq(adMaterials.id, id));
  
  await logOperation(operatorId, 'ads', 'update', id.toString(), updateData);
  
  return { success: true };
}

export async function deleteAd(id: number, operatorId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(adMaterials).where(eq(adMaterials.id, id));
  
  await logOperation(operatorId, 'ads', 'delete', id.toString(), {});
  
  return { success: true };
}

// ==================== 后台管理 - 首页入口配置 ====================

export async function getHomeEntries() {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(homeEntries).orderBy(homeEntries.sortOrder);
}

export async function updateHomeEntry(data: { id: number; [key: string]: any }, operatorId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const { id, ...updateData } = data;
  await db.update(homeEntries).set(updateData).where(eq(homeEntries.id, id));
  
  await logOperation(operatorId, 'home_entries', 'update', id.toString(), updateData);
  
  return { success: true };
}

// ==================== 后台管理 - 优惠券模板 ====================

export async function getAllCouponTemplates() {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(couponTemplates).orderBy(desc(couponTemplates.createdAt));
}

export async function createCouponTemplate(data: any, operatorId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(couponTemplates).values({
    ...data,
    createdBy: operatorId,
  });
  
  await logOperation(operatorId, 'coupon_templates', 'create', result[0].insertId.toString(), data);
  
  return { success: true, id: Number(result[0].insertId) };
}

export async function updateCouponTemplate(data: { id: number; [key: string]: any }, operatorId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const { id, ...updateData } = data;
  await db.update(couponTemplates).set(updateData).where(eq(couponTemplates.id, id));
  
  await logOperation(operatorId, 'coupon_templates', 'update', id.toString(), updateData);
  
  return { success: true };
}

export async function batchSendCoupons(data: {
  templateId: number;
  targetType: 'all' | 'new' | 'vip' | 'inactive' | 'specific';
  userIds?: number[];
  reason?: string;
}, operatorId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  let targetUsers: number[] = [];
  
  if (data.targetType === 'specific' && data.userIds) {
    targetUsers = data.userIds;
  } else {
    // 根据目标类型获取用户列表
    let userQuery = db.select({ id: users.id }).from(users);
    
    if (data.targetType === 'vip') {
      userQuery = userQuery.where(inArray(users.memberLevel, ['gold', 'diamond'])) as typeof userQuery;
    } else if (data.targetType === 'new') {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      userQuery = userQuery.where(gte(users.createdAt, thirtyDaysAgo)) as typeof userQuery;
    }
    
    const userResults = await userQuery;
    targetUsers = userResults.map(u => u.id);
  }
  
  // 批量发放优惠券
  const template = await db.select().from(couponTemplates).where(eq(couponTemplates.id, data.templateId)).limit(1);
  if (template.length === 0) throw new Error("Template not found");
  
  const tpl = template[0];
  const now = new Date();
  
  const expireAt = tpl.validDays 
    ? new Date(now.getTime() + tpl.validDays * 24 * 60 * 60 * 1000)
    : tpl.endAt || new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  
  for (const userId of targetUsers) {
    await db.insert(userCoupons).values({
      userId,
      templateId: data.templateId,
      expireAt,
    });
  }
  
  // 更新已发放数量
  await db.update(couponTemplates)
    .set({ usedQuantity: sql`${couponTemplates.usedQuantity} + ${targetUsers.length}` })
    .where(eq(couponTemplates.id, data.templateId));
  
  await logOperation(operatorId, 'coupons', 'batch_send', data.templateId.toString(), {
    targetType: data.targetType,
    count: targetUsers.length,
    reason: data.reason,
  });
  
  return { success: true, sentCount: targetUsers.length };
}

// ==================== 后台管理 - 营销规则 ====================

export async function getMarketingRules() {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(marketingCampaigns).orderBy(desc(marketingCampaigns.createdAt));
}

export async function createMarketingRule(data: any, operatorId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(marketingCampaigns).values({
    ...data,
    createdBy: operatorId,
  });
  
  await logOperation(operatorId, 'marketing_rules', 'create', result[0].insertId.toString(), data);
  
  return { success: true, id: Number(result[0].insertId) };
}

export async function updateMarketingRule(data: { id: number; [key: string]: any }, operatorId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const { id, ...updateData } = data;
  await db.update(marketingCampaigns).set(updateData).where(eq(marketingCampaigns.id, id));
  
  await logOperation(operatorId, 'marketing_rules', 'update', id.toString(), updateData);
  
  return { success: true };
}

export async function deleteMarketingRule(id: number, operatorId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(marketingCampaigns).where(eq(marketingCampaigns.id, id));
  
  await logOperation(operatorId, 'marketing_rules', 'delete', id.toString(), {});
  
  return { success: true };
}

// ==================== 后台管理 - API 配置 ====================

export async function getApiConfigs() {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(apiConfigs).orderBy(apiConfigs.provider);
}

export async function updateApiConfig(data: { id: number; [key: string]: any }, operatorId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const { id, ...updateData } = data;
  await db.update(apiConfigs).set(updateData).where(eq(apiConfigs.id, id));
  
  // 不记录敏感信息
  const logData = { ...updateData };
  if (logData.apiKey) logData.apiKey = '***';
  if (logData.apiSecret) logData.apiSecret = '***';
  
  await logOperation(operatorId, 'api_configs', 'update', id.toString(), logData);
  
  return { success: true };
}

export async function testApiConnection(id: number) {
  const db = await getDb();
  if (!db) return { success: false, error: 'Database not available' };
  
  const config = await db.select().from(apiConfigs).where(eq(apiConfigs.id, id)).limit(1);
  if (config.length === 0) return { success: false, error: 'Config not found' };
  
  // TODO: 实际测试 API 连接
  // 这里只是模拟
  return { success: true, message: 'Connection successful' };
}

// ==================== 后台管理 - 操作日志 ====================

export async function logOperation(
  operatorId: number,
  module: string,
  action: string,
  targetId: string,
  details: any
) {
  const db = await getDb();
  if (!db) return;
  
  try {
    await db.insert(operationLogs).values({
      adminUserId: operatorId,
      module,
      action,
      targetType: 'record',
      targetId: parseInt(targetId) || 0,
      afterData: details,
      ipAddress: '',
    });
  } catch (error) {
    console.error('Failed to log operation:', error);
  }
}

export async function getOperationLogs(params?: {
  module?: string;
  action?: string;
  userId?: number;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}) {
  const db = await getDb();
  if (!db) return [];
  
  const conditions: any[] = [];
  
  if (params?.module) conditions.push(eq(operationLogs.module, params.module));
  if (params?.action) conditions.push(eq(operationLogs.action, params.action));
  if (params?.userId) conditions.push(eq(operationLogs.adminUserId, params.userId));
  if (params?.startDate) conditions.push(gte(operationLogs.createdAt, params.startDate));
  if (params?.endDate) conditions.push(lte(operationLogs.createdAt, params.endDate));
  
  let query = db.select({
    id: operationLogs.id,
    adminUserId: operationLogs.adminUserId,
    module: operationLogs.module,
    action: operationLogs.action,
    targetId: operationLogs.targetId,
    afterData: operationLogs.afterData,
    ipAddress: operationLogs.ipAddress,
    createdAt: operationLogs.createdAt,
    operatorName: users.name,
  })
    .from(operationLogs)
    .leftJoin(users, eq(operationLogs.adminUserId, users.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(operationLogs.createdAt));
  
  if (params?.limit) query = query.limit(params.limit) as typeof query;
  if (params?.offset) query = query.offset(params.offset) as typeof query;
  
  return await query;
}

// ==================== 后台管理 - 用户管理 ====================

export async function getAdminUserList(params?: {
  role?: 'admin' | 'user';
  search?: string;
  limit?: number;
  offset?: number;
}) {
  const db = await getDb();
  if (!db) return [];
  
  const conditions: any[] = [];
  
  if (params?.role) conditions.push(eq(users.role, params.role));
  if (params?.search) {
    conditions.push(
      or(
        like(users.name, `%${params.search}%`),
        like(users.email, `%${params.search}%`),
        like(users.telegramUsername, `%${params.search}%`)
      )
    );
  }
  
  let query = db.select().from(users)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(users.createdAt));
  
  if (params?.limit) query = query.limit(params.limit) as typeof query;
  if (params?.offset) query = query.offset(params.offset) as typeof query;
  
  return await query;
}

export async function updateUserRole(data: { userId: number; role: 'admin' | 'user' }, operatorId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(users).set({ role: data.role }).where(eq(users.id, data.userId));
  
  await logOperation(operatorId, 'users', 'update_role', data.userId.toString(), { role: data.role });
  
  return { success: true };
}

// ==================== 后台管理 - 门店管理 ====================

export async function getAllStores() {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(stores).orderBy(stores.id);
}

export async function createStore(data: any, operatorId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(stores).values(data);
  
  await logOperation(operatorId, 'stores', 'create', result[0].insertId.toString(), data);
  
  return { success: true, id: Number(result[0].insertId) };
}

export async function updateStore(data: { id: number; [key: string]: any }, operatorId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const { id, ...updateData } = data;
  await db.update(stores).set(updateData).where(eq(stores.id, id));
  
  await logOperation(operatorId, 'stores', 'update', id.toString(), updateData);
  
  return { success: true };
}

// ==================== 后台管理 - 商品管理 ====================

export async function getAdminProducts(params?: {
  categoryId?: number;
  type?: 'tea' | 'mall';
  isActive?: boolean;
  search?: string;
}) {
  const db = await getDb();
  if (!db) return [];
  
  const conditions: any[] = [];
  
  if (params?.categoryId) conditions.push(eq(products.categoryId, params.categoryId));
  if (params?.type) conditions.push(eq(products.type, params.type));
  if (params?.isActive !== undefined) conditions.push(eq(products.isActive, params.isActive));
  if (params?.search) {
    conditions.push(
      or(
        like(products.nameZh, `%${params.search}%`),
        like(products.nameRu, `%${params.search}%`),
        like(products.nameEn, `%${params.search}%`),
        like(products.code, `%${params.search}%`)
      )
    );
  }
  
  return await db.select().from(products)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(products.sortOrder);
}

export async function createProduct(data: any, operatorId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(products).values(data);
  
  await logOperation(operatorId, 'products', 'create', result[0].insertId.toString(), data);
  
  return { success: true, id: Number(result[0].insertId) };
}

export async function updateProduct(data: { id: number; [key: string]: any }, operatorId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const { id, ...updateData } = data;
  await db.update(products).set(updateData).where(eq(products.id, id));
  
  await logOperation(operatorId, 'products', 'update', id.toString(), updateData);
  
  return { success: true };
}

export async function deleteProduct(id: number, operatorId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // 软删除
  await db.update(products).set({ isActive: false }).where(eq(products.id, id));
  
  await logOperation(operatorId, 'products', 'delete', id.toString(), {});
  
  return { success: true };
}

// ==================== 后台管理 - 订单管理 ====================

export async function getAdminOrders(params?: {
  status?: 'pending' | 'paid' | 'preparing' | 'ready' | 'delivering' | 'completed' | 'cancelled' | 'refunding' | 'refunded';
  storeId?: number;
  startDate?: Date;
  endDate?: Date;
  search?: string;
  limit?: number;
  offset?: number;
}) {
  const db = await getDb();
  if (!db) return [];
  
  const conditions: any[] = [];
  
  if (params?.status) conditions.push(eq(orders.status, params.status));
  if (params?.storeId) conditions.push(eq(orders.storeId, params.storeId));
  if (params?.startDate) conditions.push(gte(orders.createdAt, params.startDate));
  if (params?.endDate) conditions.push(lte(orders.createdAt, params.endDate));
  if (params?.search) {
    conditions.push(
      or(
        like(orders.orderNo, `%${params.search}%`)
      )
    );
  }
  
  let query = db.select({
    id: orders.id,
    orderNo: orders.orderNo,
    userId: orders.userId,
    storeId: orders.storeId,
    orderType: orders.orderType,
    deliveryType: orders.deliveryType,
    status: orders.status,
    totalAmount: orders.totalAmount,
    createdAt: orders.createdAt,
    userName: users.name,
  })
    .from(orders)
    .leftJoin(users, eq(orders.userId, users.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(orders.createdAt));
  
  if (params?.limit) query = query.limit(params.limit) as typeof query;
  if (params?.offset) query = query.offset(params.offset) as typeof query;
  
  return await query;
}

export async function updateOrderStatus(data: { orderId: number; status: 'pending' | 'paid' | 'preparing' | 'ready' | 'delivering' | 'completed' | 'cancelled' | 'refunding' | 'refunded'; note?: string }, operatorId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(orders).set({ status: data.status }).where(eq(orders.id, data.orderId));
  
  await logOperation(operatorId, 'orders', 'update_status', data.orderId.toString(), {
    status: data.status,
    note: data.note,
  });
  
  return { success: true };
}

// ==================== 通知系统 ====================

// 获取通知模板列表
export async function getNotificationTemplates(params?: { category?: string; isActive?: boolean }) {
  const db = await getDb();
  if (!db) return [];
  
  const conditions: any[] = [];
  if (params?.category) conditions.push(eq(notificationTemplates.category, params.category as any));
  if (params?.isActive !== undefined) conditions.push(eq(notificationTemplates.isActive, params.isActive));
  
  return await db.select().from(notificationTemplates)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(notificationTemplates.category);
}

// 创建通知模板
export async function createNotificationTemplate(data: any, operatorId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(notificationTemplates).values(data);
  await logOperation(operatorId, 'notification_templates', 'create', result[0].insertId.toString(), data);
  
  return { success: true, id: Number(result[0].insertId) };
}

// 更新通知模板
export async function updateNotificationTemplate(data: { id: number; [key: string]: any }, operatorId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const { id, ...updateData } = data;
  await db.update(notificationTemplates).set(updateData).where(eq(notificationTemplates.id, id));
  await logOperation(operatorId, 'notification_templates', 'update', id.toString(), updateData);
  
  return { success: true };
}

// 获取通知规则列表
export async function getNotificationRules(params?: { triggerEvent?: string; isActive?: boolean }) {
  const db = await getDb();
  if (!db) return [];
  
  const conditions: any[] = [];
  if (params?.triggerEvent) conditions.push(eq(notificationRules.triggerEvent, params.triggerEvent as any));
  if (params?.isActive !== undefined) conditions.push(eq(notificationRules.isActive, params.isActive));
  
  return await db.select().from(notificationRules)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(notificationRules.priority));
}

// 创建通知规则
export async function createNotificationRule(data: any, operatorId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(notificationRules).values(data);
  await logOperation(operatorId, 'notification_rules', 'create', result[0].insertId.toString(), data);
  
  return { success: true, id: Number(result[0].insertId) };
}

// 更新通知规则
export async function updateNotificationRule(data: { id: number; [key: string]: any }, operatorId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const { id, ...updateData } = data;
  await db.update(notificationRules).set(updateData).where(eq(notificationRules.id, id));
  await logOperation(operatorId, 'notification_rules', 'update', id.toString(), updateData);
  
  return { success: true };
}

// 删除通知规则
export async function deleteNotificationRule(id: number, operatorId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(notificationRules).where(eq(notificationRules.id, id));
  await logOperation(operatorId, 'notification_rules', 'delete', id.toString(), {});
  
  return { success: true };
}

// 创建通知记录
export async function createNotification(data: InsertNotification) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(notifications).values(data);
  return { success: true, id: Number(result[0].insertId) };
}

// 批量创建通知
export async function createNotifications(dataList: InsertNotification[]) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  if (dataList.length === 0) return { success: true, count: 0 };
  
  await db.insert(notifications).values(dataList);
  return { success: true, count: dataList.length };
}

// 获取用户通知列表
export async function getUserNotifications(userId: number, params?: {
  channel?: 'system' | 'telegram' | 'email' | 'sms';
  status?: 'pending' | 'sent' | 'delivered' | 'failed' | 'read';
  limit?: number;
  offset?: number;
}) {
  const db = await getDb();
  if (!db) return [];
  
  const conditions: any[] = [
    eq(notifications.recipientId, userId),
    eq(notifications.recipientType, 'admin'),
  ];
  
  if (params?.channel) conditions.push(eq(notifications.channel, params.channel));
  if (params?.status) conditions.push(eq(notifications.status, params.status));
  
  let query = db.select().from(notifications)
    .where(and(...conditions))
    .orderBy(desc(notifications.createdAt));
  
  if (params?.limit) query = query.limit(params.limit) as typeof query;
  if (params?.offset) query = query.offset(params.offset) as typeof query;
  
  return await query;
}

// 获取未读通知数量
export async function getUnreadNotificationCount(userId: number) {
  const db = await getDb();
  if (!db) return 0;
  
  const result = await db.select({ count: sql<number>`count(*)` })
    .from(notifications)
    .where(and(
      eq(notifications.recipientId, userId),
      eq(notifications.recipientType, 'admin'),
      eq(notifications.channel, 'system'),
      or(eq(notifications.status, 'sent'), eq(notifications.status, 'delivered'))
    ));
  
  return result[0]?.count || 0;
}

// 标记通知为已读
export async function markNotificationAsRead(notificationId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(notifications)
    .set({ status: 'read', readAt: new Date() })
    .where(and(
      eq(notifications.id, notificationId),
      eq(notifications.recipientId, userId)
    ));
  
  return { success: true };
}

// 标记所有通知为已读
export async function markAllNotificationsAsRead(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(notifications)
    .set({ status: 'read', readAt: new Date() })
    .where(and(
      eq(notifications.recipientId, userId),
      eq(notifications.recipientType, 'admin'),
      eq(notifications.channel, 'system'),
      or(eq(notifications.status, 'sent'), eq(notifications.status, 'delivered'))
    ));
  
  return { success: true };
}

// 更新通知状态
export async function updateNotificationStatus(notificationId: number, status: 'sent' | 'delivered' | 'failed', errorMessage?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const updateData: any = { status };
  if (status === 'sent' || status === 'delivered') {
    updateData.sentAt = new Date();
  }
  if (errorMessage) {
    updateData.errorMessage = errorMessage;
  }
  
  await db.update(notifications).set(updateData).where(eq(notifications.id, notificationId));
  return { success: true };
}

// 获取 Telegram Bot 配置
export async function getTelegramBotConfig() {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.select().from(telegramBotConfigs).limit(1);
  return result.length > 0 ? result[0] : null;
}

// 更新 Telegram Bot 配置
export async function updateTelegramBotConfig(data: any, operatorId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const existing = await getTelegramBotConfig();
  
  if (existing) {
    await db.update(telegramBotConfigs).set(data).where(eq(telegramBotConfigs.id, existing.id));
  } else {
    await db.insert(telegramBotConfigs).values(data);
  }
  
  await logOperation(operatorId, 'telegram_bot', 'update', '1', data);
  return { success: true };
}

// 获取管理员 Telegram 绑定
export async function getAdminTelegramBinding(adminUserId: number) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.select().from(adminTelegramBindings)
    .where(eq(adminTelegramBindings.adminUserId, adminUserId))
    .limit(1);
  
  return result.length > 0 ? result[0] : null;
}

// 获取所有管理员 Telegram 绑定
export async function getAllAdminTelegramBindings() {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(adminTelegramBindings)
    .where(eq(adminTelegramBindings.isVerified, true));
}

// 创建或更新管理员 Telegram 绑定
export async function upsertAdminTelegramBinding(data: {
  adminUserId: number;
  telegramChatId: string;
  telegramUsername?: string;
  notifyNewOrder?: boolean;
  notifyPaymentFailed?: boolean;
  notifyLowStock?: boolean;
  notifySystemAlert?: boolean;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const existing = await getAdminTelegramBinding(data.adminUserId);
  
  if (existing) {
    await db.update(adminTelegramBindings)
      .set({
        telegramChatId: data.telegramChatId,
        telegramUsername: data.telegramUsername,
        notifyNewOrder: data.notifyNewOrder ?? existing.notifyNewOrder,
        notifyPaymentFailed: data.notifyPaymentFailed ?? existing.notifyPaymentFailed,
        notifyLowStock: data.notifyLowStock ?? existing.notifyLowStock,
        notifySystemAlert: data.notifySystemAlert ?? existing.notifySystemAlert,
      })
      .where(eq(adminTelegramBindings.adminUserId, data.adminUserId));
  } else {
    const verificationCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    await db.insert(adminTelegramBindings).values({
      ...data,
      verificationCode,
      isVerified: false,
    });
  }
  
  return { success: true };
}

// 验证管理员 Telegram 绑定
export async function verifyAdminTelegramBinding(adminUserId: number, code: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const binding = await getAdminTelegramBinding(adminUserId);
  if (!binding) throw new Error("Binding not found");
  if (binding.verificationCode !== code) throw new Error("Invalid verification code");
  
  await db.update(adminTelegramBindings)
    .set({ isVerified: true, verifiedAt: new Date() })
    .where(eq(adminTelegramBindings.adminUserId, adminUserId));
  
  return { success: true };
}

// 获取需要接收特定通知的管理员
export async function getAdminsForNotification(notificationType: 'newOrder' | 'paymentFailed' | 'lowStock' | 'systemAlert') {
  const db = await getDb();
  if (!db) return [];
  
  const columnMap = {
    newOrder: adminTelegramBindings.notifyNewOrder,
    paymentFailed: adminTelegramBindings.notifyPaymentFailed,
    lowStock: adminTelegramBindings.notifyLowStock,
    systemAlert: adminTelegramBindings.notifySystemAlert,
  };
  
  return await db.select().from(adminTelegramBindings)
    .where(and(
      eq(adminTelegramBindings.isVerified, true),
      eq(columnMap[notificationType], true)
    ));
}

// 获取通知历史（后台管理用）
export async function getNotificationHistory(params?: {
  channel?: 'system' | 'telegram' | 'email' | 'sms';
  status?: 'pending' | 'sent' | 'delivered' | 'failed' | 'read';
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}) {
  const db = await getDb();
  if (!db) return [];
  
  const conditions: any[] = [];
  
  if (params?.channel) conditions.push(eq(notifications.channel, params.channel));
  if (params?.status) conditions.push(eq(notifications.status, params.status));
  if (params?.priority) conditions.push(eq(notifications.priority, params.priority));
  if (params?.startDate) conditions.push(gte(notifications.createdAt, params.startDate));
  if (params?.endDate) conditions.push(lte(notifications.createdAt, params.endDate));
  
  let query = db.select().from(notifications)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(notifications.createdAt));
  
  if (params?.limit) query = query.limit(params.limit) as typeof query;
  if (params?.offset) query = query.offset(params.offset) as typeof query;
  
  return await query;
}

// 获取管理员通知列表
export async function getAdminNotifications(adminUserId: number, params?: {
  limit?: number;
  unreadOnly?: boolean;
}) {
  const db = await getDb();
  if (!db) return [];
  
  const conditions: any[] = [
    eq(notifications.recipientType, 'admin'),
    eq(notifications.recipientId, adminUserId),
  ];
  
  if (params?.unreadOnly) {
    conditions.push(ne(notifications.status, 'read'));
  }
  
  let query = db.select().from(notifications)
    .where(and(...conditions))
    .orderBy(desc(notifications.createdAt));
  
  if (params?.limit) {
    query = query.limit(params.limit) as typeof query;
  }
  
  return await query;
}

// 发送新订单通知给管理员
export async function sendNewOrderNotification(orderId: number, orderNumber: string, totalAmount: string, storeName: string) {
  const db = await getDb();
  if (!db) return;
  
  // 获取需要接收新订单通知的管理员
  const admins = await getAdminsForNotification('newOrder');
  
  for (const admin of admins) {
    await createNotification({
      recipientType: 'admin',
      recipientId: admin.adminUserId,
      channel: 'system',
      titleZh: '新订单通知',
      titleRu: 'Новый заказ',
      titleEn: 'New Order',
      contentZh: `收到新订单 #${orderNumber}，金额 ₽${totalAmount}，门店：${storeName}`,
      contentRu: `Новый заказ #${orderNumber}, сумма ₽${totalAmount}, магазин: ${storeName}`,
      contentEn: `New order #${orderNumber}, amount ₽${totalAmount}, store: ${storeName}`,
      priority: 'high',
      relatedType: 'order',
      relatedId: orderId,
      status: 'sent',
    });
  }
}

// 发送库存预警通知给管理员
export async function sendLowStockNotification(productId: number, productName: string, currentStock: number) {
  const db = await getDb();
  if (!db) return;
  
  const admins = await getAdminsForNotification('lowStock');
  
  for (const admin of admins) {
    await createNotification({
      recipientType: 'admin',
      recipientId: admin.adminUserId,
      channel: 'system',
      titleZh: '库存预警',
      titleRu: 'Предупреждение о запасах',
      titleEn: 'Low Stock Alert',
      contentZh: `商品「${productName}」库存不足，当前库存：${currentStock}`,
      contentRu: `Товар «${productName}» заканчивается, текущий остаток: ${currentStock}`,
      contentEn: `Product "${productName}" is low on stock, current stock: ${currentStock}`,
      priority: 'high',
      relatedType: 'product',
      relatedId: productId,
      status: 'sent',
    });
  }
}

// 发送支付失败通知给管理员
export async function sendPaymentFailedNotification(orderId: number, orderNumber: string, errorMessage: string) {
  const db = await getDb();
  if (!db) return;
  
  const admins = await getAdminsForNotification('paymentFailed');
  
  for (const admin of admins) {
    await createNotification({
      recipientType: 'admin',
      recipientId: admin.adminUserId,
      channel: 'system',
      titleZh: '支付失败',
      titleRu: 'Ошибка оплаты',
      titleEn: 'Payment Failed',
      contentZh: `订单 #${orderNumber} 支付失败：${errorMessage}`,
      contentRu: `Заказ #${orderNumber} не оплачен: ${errorMessage}`,
      contentEn: `Order #${orderNumber} payment failed: ${errorMessage}`,
      priority: 'urgent',
      relatedType: 'order',
      relatedId: orderId,
      status: 'sent',
    });
  }
}

// 发送系统警报通知给管理员
export async function sendSystemAlertNotification(title: string, content: string, priority: 'low' | 'normal' | 'high' | 'urgent' = 'high') {
  const db = await getDb();
  if (!db) return;
  
  const admins = await getAdminsForNotification('systemAlert');
  
  for (const admin of admins) {
    await createNotification({
      recipientType: 'admin',
      recipientId: admin.adminUserId,
      channel: 'system',
      titleZh: title,
      titleRu: title,
      titleEn: title,
      contentZh: content,
      contentRu: content,
      contentEn: content,
      priority,
      status: 'sent',
    });
  }
}
