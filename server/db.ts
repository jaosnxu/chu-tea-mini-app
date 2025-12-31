import { eq, and, desc, sql, inArray, gte, lte, or, isNull } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { nanoid } from "nanoid";
import { 
  InsertUser, users, stores, categories, products, productOptions, productOptionItems,
  productSkus, cartItems, addresses, orders, orderItems, shipments,
  couponTemplates, userCoupons, pointsHistory, influencers, influencerLinks,
  influencerCommissions, payments, landingPages, systemConfigs
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
