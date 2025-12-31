import { eq, and, desc, sql, inArray, gte, lte, or, isNull, like, ne } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { nanoid } from "nanoid";
import { 
  InsertUser, users, stores, categories, products, productOptions, productOptionItems,
  productSkus, cartItems, addresses, orders, orderItems, shipments,
  couponTemplates, userCoupons, pointsHistory, influencers, influencerLinks,
  influencerCommissions, payments, refunds, landingPages, systemConfigs,
  operationLogs, homeEntries, apiConfigs, marketingCampaigns, adMaterials,
  notifications, notificationTemplates, notificationRules,
  telegramBotConfigs, adminTelegramBindings, yookassaConfig,
  productConfig, productOptionConfig, userNotificationPreferences,
  marketingTriggers, triggerExecutions,
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

function generateOrderNo(orderSource: 'delivery' | 'store' | 'telegram' = 'telegram'): string {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
  const random = nanoid(6).toUpperCase();
  
  // 根据订单来源添加前缀
  const prefix = {
    delivery: 'D',   // 外卖订单
    store: 'S',      // 线下订单
    telegram: 'T',   // 电报订单
  }[orderSource];
  
  return `${prefix}${dateStr}${random}`;
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
  orderSource?: 'delivery' | 'store' | 'telegram';
  deliveryType: 'delivery' | 'pickup';
  storeId?: number;
  addressId?: number;
  pickupTime?: string;
  couponId?: number;
  pointsUsed?: number;
  usePoints?: boolean; // 是否使用积分支付
  remark?: string;
  campaignId?: string; // 营销活动ID
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
  
  // 默认为 telegram 订单（电报小程序订单）
  const orderSource = data.orderSource || 'telegram';
  const orderNo = generateOrderNo(orderSource);
  
  // 生成带前缀的取件码：S+4位数字（线下）、T+4位数字（电报）、A+4位数字（外卖）
  const pickupCodePrefix = {
    store: 'S',      // 线下订单
    telegram: 'T',   // 电报订单
    delivery: 'A',   // 外卖订单（App）
  }[orderSource];
  const pickupCodeNumber = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  const pickupCode = `${pickupCodePrefix}${pickupCodeNumber}`;
  
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
  
  // 处理优惠券（与积分互斥）
  if (data.couponId && !data.usePoints) {
    try {
      const discountResult = await calculateCouponDiscount({
        couponId: data.couponId,
        orderAmount: subtotal,
        items: data.items.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          price: parseFloat(item.unitPrice),
        })),
      });
      couponDiscount = discountResult.discount;
    } catch (error) {
      console.error('Failed to calculate coupon discount:', error);
      throw new Error('优惠券使用失败');
    }
  }
  
  // 处理积分支付（与优惠券互斥）
  if (data.usePoints && !data.couponId) {
    // 获取用户积分
    const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (user.length === 0) {
      throw new Error('用户不存在');
    }
    const availablePoints = user[0].availablePoints;
    const requiredPoints = Math.ceil(subtotal); // 需要的积分数（1积分 = 1元）
    
    if (availablePoints < requiredPoints) {
      throw new Error('积分不足');
    }
    
    // 使用积分支付全额
    pointsDiscount = subtotal;
    data.pointsUsed = requiredPoints;
  } else if (data.pointsUsed && data.pointsUsed > 0 && !data.couponId) {
    pointsDiscount = data.pointsUsed / 100; // 100积分 = 1元
  }
  
  const totalAmount = Math.max(0, subtotal - couponDiscount - pointsDiscount);
  
  // 创建订单
  const result = await db.insert(orders).values({
    orderNo,
    pickupCode,
    orderSource,
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
    campaignId: data.campaignId, // 记录营销活动ID
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
  
  // 标记优惠券为已使用
  if (data.couponId && couponDiscount > 0) {
    try {
      await db.update(userCoupons)
        .set({ 
          status: 'used',
          usedAt: new Date(),
        })
        .where(eq(userCoupons.id, data.couponId));
    } catch (error) {
      console.error('Failed to mark coupon as used:', error);
      // 不影响订单创建，只记录错误
    }
  }
  
  // 发送订单确认通知到用户 Telegram
  try {
    const { sendOrderConfirmationToUser } = await import('./userNotifications');
    
    // 获取门店名称
    let storeName: string | undefined;
    if (data.storeId) {
      const store = await db.select().from(stores).where(eq(stores.id, data.storeId)).limit(1);
      if (store.length > 0) {
        storeName = store[0].nameRu || undefined;
      }
    }
    
    // 获取用户语言偏好
    const [user] = await db.select({ language: users.language }).from(users).where(eq(users.id, userId)).limit(1);
    const language = (user?.language || 'ru') as 'zh' | 'ru' | 'en';
    
    // 构建商品列表
    const itemsForNotification = [];
    for (const item of data.items) {
      const product = await getProductById(item.productId);
      itemsForNotification.push({
        name: product?.nameRu || 'Unknown',
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      });
    }
    
    // 计算预计送达时间（30-60分钟）
    const estimatedMinutes = data.deliveryType === 'delivery' ? 45 : 20;
    const estimatedTime = new Date(Date.now() + estimatedMinutes * 60 * 1000);
    const estimatedDeliveryTime = estimatedTime.toLocaleTimeString(language === 'zh' ? 'zh-CN' : language === 'ru' ? 'ru-RU' : 'en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
    
    await sendOrderConfirmationToUser({
      userId,
      orderNo,
      pickupCode,
      orderType: data.orderType,
      deliveryType: data.deliveryType,
      totalAmount: totalAmount.toFixed(2),
      items: itemsForNotification,
      storeName,
      address: addressSnapshot?.address,
      estimatedDeliveryTime,
      language,
    });
  } catch (error) {
    console.error('[Order] Failed to send order confirmation:', error);
  }
  
  // 将订单添加到 IIKO 同步队列（只有指定了 storeId 的订单才同步）
  if (data.storeId) {
    try {
      const { addOrderToQueue } = await import('./iiko-db.js');
      await addOrderToQueue({
        orderId,
        orderNo,
        storeId: data.storeId,
        orderData: JSON.stringify({
          orderType: data.orderType,
          deliveryType: data.deliveryType,
          items: data.items,
          addressSnapshot,
          totalAmount,
        }),
        priority: 1, // 普通优先级
      });
      console.log(`[Order] Order ${orderNo} added to IIKO sync queue`);
    } catch (error) {
      console.error('[Order] Failed to add order to IIKO queue:', error);
      // 不影响订单创建，只记录错误
    }
  }
  
  // 触发营销自动化（异步执行，不阻塞订单创建）
  try {
    const { triggerOrderCompleted } = await import('./triggerEngine');
    
    // 获取用户订单总数
    const userOrders = await db.select({ count: sql<number>`count(*)` })
      .from(orders)
      .where(eq(orders.userId, userId));
    const userOrderCount = Number(userOrders[0]?.count || 0);
    
    // 异步触发
    triggerOrderCompleted(userId, {
      orderAmount: totalAmount,
      userOrderCount,
    }).catch(err => {
      console.error('[Order] Failed to trigger marketing automation:', err);
    });
  } catch (error) {
    console.error('[Order] Failed to load trigger engine:', error);
  }
  
  return { success: true, orderId, orderNo };
}

// ==================== 显示屏订单展示 ====================

export async function getDisplayOrders(params?: {
  storeId?: number;
  status?: Array<'paid' | 'preparing' | 'ready'>;
  limit?: number;
}) {
  const db = await getDb();
  if (!db) return [];
  
  const conditions = [];
  
  // 默认只显示已支付、制作中、待取餐的订单
  const statusFilter = params?.status || ['paid', 'preparing', 'ready'];
  conditions.push(inArray(orders.status, statusFilter));
  
  if (params?.storeId) {
    conditions.push(eq(orders.storeId, params.storeId));
  }
  
  const result = await db.select({
    id: orders.id,
    orderNo: orders.orderNo,
    pickupCode: orders.pickupCode,
    orderSource: orders.orderSource,
    orderType: orders.orderType,
    deliveryType: orders.deliveryType,
    status: orders.status,
    totalAmount: orders.totalAmount,
    createdAt: orders.createdAt,
    userName: users.name,
  })
    .from(orders)
    .leftJoin(users, eq(orders.userId, users.id))
    .where(and(...conditions))
    .orderBy(desc(orders.createdAt))
    .limit(params?.limit || 20);
  
  return result;
}

// ==================== 物流信息相关 ====================

export async function createShipment(data: {
  orderId: number;
  carrier: string;
  trackingNo?: string;
  estimatedDelivery?: Date;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // 获取订单信息
  const [order] = await db.select().from(orders).where(eq(orders.id, data.orderId)).limit(1);
  if (!order) throw new Error("Order not found");
  
  // 创建物流记录
  const result = await db.insert(shipments).values({
    orderId: data.orderId,
    carrier: data.carrier,
    trackingNo: data.trackingNo,
    status: 'pending',
    estimatedDelivery: data.estimatedDelivery,
  });
  
  const shipmentId = Number(result[0].insertId);
  
  // 更新订单状态为 "delivering"
  await db.update(orders).set({ status: 'delivering' }).where(eq(orders.id, data.orderId));
  
  // 发送物流追踪通知到用户 Telegram
  try {
    const { sendShipmentTrackingToUser } = await import('./userNotifications');
    
    // 获取用户语言偏好
    const [user] = await db.select({ language: users.language }).from(users).where(eq(users.id, order.userId)).limit(1);
    const language = (user?.language || 'ru') as 'zh' | 'ru' | 'en';
    
    // 格式化预计送达时间
    let estimatedDeliveryTime: string | undefined;
    if (data.estimatedDelivery) {
      estimatedDeliveryTime = data.estimatedDelivery.toLocaleString(language === 'zh' ? 'zh-CN' : language === 'ru' ? 'ru-RU' : 'en-US');
    }
    
    await sendShipmentTrackingToUser({
      userId: order.userId,
      orderNo: order.orderNo,
      courierCompany: data.carrier,
      trackingNumber: data.trackingNo || '待分配',
      estimatedDeliveryTime,
      language,
    });
  } catch (error) {
    console.error('[Shipment] Failed to send tracking notification:', error);
  }
  
  return { success: true, shipmentId };
}

export async function updateShipmentStatus(shipmentId: number, status: 'pending' | 'picked' | 'in_transit' | 'out_for_delivery' | 'delivered' | 'failed', trackingHistory?: Array<{ time: string; status: string; location?: string; description: string }>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(shipments).set({ 
    status,
    trackingHistory,
    deliveredAt: status === 'delivered' ? new Date() : undefined,
  }).where(eq(shipments.id, shipmentId));
  
  // 如果物流状态为 "delivered"，更新订单状态为 "completed"
  if (status === 'delivered') {
    const [shipment] = await db.select().from(shipments).where(eq(shipments.id, shipmentId)).limit(1);
    if (shipment) {
      await db.update(orders).set({ status: 'completed' }).where(eq(orders.id, shipment.orderId));
    }
  }
  
  return { success: true };
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

export async function claimCoupon(userId: number, templateId: number, campaignId?: string) {
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
  const result = await db.insert(userCoupons).values({
    userId,
    templateId,
    expireAt,
    campaignId, // 记录营销活动ID
  });
  
  const couponId = Number(result[0].insertId);
  
  // 更新已领取数量
  await db.update(couponTemplates)
    .set({ usedQuantity: sql`${couponTemplates.usedQuantity} + 1` })
    .where(eq(couponTemplates.id, templateId));
  
  return { success: true, couponId };
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

export async function deleteCouponTemplate(id: number, operatorId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // 检查是否有用户已领取
  const usedCoupons = await db.select().from(userCoupons).where(eq(userCoupons.templateId, id)).limit(1);
  if (usedCoupons.length > 0) {
    throw new Error("该优惠券模板已有用户领取，无法删除");
  }
  
  await db.delete(couponTemplates).where(eq(couponTemplates.id, id));
  await logOperation(operatorId, 'coupon_templates', 'delete', id.toString(), {});
  
  return { success: true };
}

export async function calculateCouponDiscount(params: {
  couponId: number;
  orderAmount: number;
  items: Array<{ productId: number; quantity: number; price: number }>;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // 获取用户优惠券和模板
  const userCoupon = await db.select()
    .from(userCoupons)
    .where(eq(userCoupons.id, params.couponId))
    .limit(1);
  
  if (userCoupon.length === 0) {
    throw new Error("优惠券不存在");
  }
  
  if (userCoupon[0].status !== 'available') {
    throw new Error("优惠券不可用");
  }
  
  const template = await db.select()
    .from(couponTemplates)
    .where(eq(couponTemplates.id, userCoupon[0].templateId))
    .limit(1);
  
  if (template.length === 0) {
    throw new Error("优惠券模板不存在");
  }
  
  const tpl = template[0];
  
  // 检查最低订单金额
  if (tpl.minOrderAmount && params.orderAmount < Number(tpl.minOrderAmount)) {
    throw new Error(`订单金额不足，最低需要 ${tpl.minOrderAmount} 元`);
  }
  
  let discount = 0;
  let freeItems: Array<{ productId: number; quantity: number }> = [];
  
  switch (tpl.type) {
    case 'fixed':
      // 满减券：直接减少固定金额
      discount = Number(tpl.value);
      if (tpl.maxDiscount && discount > Number(tpl.maxDiscount)) {
        discount = Number(tpl.maxDiscount);
      }
      break;
    
    case 'percent':
      // 折扣券：按百分比计算折扣
      discount = params.orderAmount * (Number(tpl.value) / 100);
      if (tpl.maxDiscount && discount > Number(tpl.maxDiscount)) {
        discount = Number(tpl.maxDiscount);
      }
      break;
    
    case 'buy_one_get_one':
      // 买一送一券：指定商品买一送一
      if (tpl.applicableProducts && tpl.applicableProducts.length > 0) {
        for (const item of params.items) {
          if (tpl.applicableProducts.includes(item.productId)) {
            // 送相同数量的商品
            freeItems.push({
              productId: item.productId,
              quantity: item.quantity,
            });
            // 折扣金额 = 商品价格 * 数量
            discount += item.price * item.quantity;
          }
        }
      }
      break;
    
    case 'free_product':
      // 免费券：指定商品免费
      if (tpl.applicableProducts && tpl.applicableProducts.length > 0) {
        for (const item of params.items) {
          if (tpl.applicableProducts.includes(item.productId)) {
            freeItems.push({
              productId: item.productId,
              quantity: Math.min(item.quantity, Number(tpl.value) || 1), // value 表示免费数量
            });
            discount += item.price * Math.min(item.quantity, Number(tpl.value) || 1);
          }
        }
      }
      break;
    
    default:
      throw new Error("不支持的优惠券类型");
  }
  
  // 确保折扣不超过订单金额
  discount = Math.min(discount, params.orderAmount);
  
  return {
    discount: Number(discount.toFixed(2)),
    freeItems,
    finalAmount: Number((params.orderAmount - discount).toFixed(2)),
  };
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
  
  // 获取订单信息
  const [order] = await db.select().from(orders).where(eq(orders.id, data.orderId)).limit(1);
  if (!order) throw new Error("Order not found");
  
  await db.update(orders).set({ status: data.status }).where(eq(orders.id, data.orderId));
  
  await logOperation(operatorId, 'orders', 'update_status', data.orderId.toString(), {
    status: data.status,
    note: data.note,
  });
  
  // 订单完成时发放积分并检查会员升级
  if (data.status === 'completed' && order.pointsUsed === 0) {
    try {
      const { calculateOrderPoints, checkAndUpgradeMemberLevel } = await import('./db/pointsRules');
      const [user] = await db.select().from(users).where(eq(users.id, order.userId)).limit(1);
      
      if (user) {
        const orderAmount = parseFloat(order.totalAmount);
        const { basePoints, bonusPoints, totalPoints } = await calculateOrderPoints(orderAmount, user.memberLevel);
        
        await db.update(users).set({
          totalPoints: user.totalPoints + totalPoints,
          availablePoints: user.availablePoints + totalPoints,
        }).where(eq(users.id, order.userId));
        
        await db.insert(pointsHistory).values({
          userId: order.userId,
          type: 'earn',
          points: totalPoints,
          balance: user.availablePoints + totalPoints,
          orderId: order.id,
          descriptionZh: `订单消费获得积分（基础${basePoints}+加成${bonusPoints}）`,
          descriptionRu: `Получено баллов за заказ (базовые ${basePoints}+бонус ${bonusPoints})`,
          descriptionEn: `Earned points from order (base ${basePoints}+bonus ${bonusPoints})`,
        });
        
        const newTotalSpent = parseFloat(user.totalSpent) + orderAmount;
        await db.update(users).set({ totalSpent: newTotalSpent.toFixed(2) }).where(eq(users.id, order.userId));
        
        const { upgraded, newLevel } = await checkAndUpgradeMemberLevel(order.userId, newTotalSpent);
        if (upgraded) {
          console.log(`[Order] User ${order.userId} upgraded to ${newLevel}`);
        }
      }
    } catch (error) {
      console.error('[Order] Failed to award points:', error);
    }
  }
  
  // 发送通知到用户 Telegram
  try {
    const { sendPaymentSuccessToUser, sendOrderStatusUpdateToUser } = await import('./userNotifications');
    
    // 获取用户语言偏好
    const [user] = await db.select({ language: users.language }).from(users).where(eq(users.id, order.userId)).limit(1);
    const language = (user?.language || 'ru') as 'zh' | 'ru' | 'en';
    
    // 如果状态更新为 "paid"，发送支付成功通知
    if (data.status === 'paid') {
      await sendPaymentSuccessToUser({
        userId: order.userId,
        orderNo: order.orderNo,
        amount: order.totalAmount,
        paymentMethod: '在线支付',
        transactionId: `TXN${order.orderNo}`,
        paymentTime: new Date(),
        language,
      });
    }
    
    // 其他状态更新通知
    const statusTexts = {
      zh: {
        pending: '待支付',
        paid: '已支付',
        preparing: '制作中',
        ready: '待取餐',
        delivering: '配送中',
        completed: '已完成',
        cancelled: '已取消',
        refunding: '退款中',
        refunded: '已退款',
      },
      ru: {
        pending: 'Ожидает оплаты',
        paid: 'Оплачено',
        preparing: 'Готовится',
        ready: 'Готов к выдаче',
        delivering: 'Доставляется',
        completed: 'Завершен',
        cancelled: 'Отменен',
        refunding: 'Возврат средств',
        refunded: 'Возвращено',
      },
      en: {
        pending: 'Pending Payment',
        paid: 'Paid',
        preparing: 'Preparing',
        ready: 'Ready for Pickup',
        delivering: 'Delivering',
        completed: 'Completed',
        cancelled: 'Cancelled',
        refunding: 'Refunding',
        refunded: 'Refunded',
      },
    };
    
    if (data.status !== 'paid') {
      await sendOrderStatusUpdateToUser({
        userId: order.userId,
        orderNo: order.orderNo,
        status: data.status,
        statusText: statusTexts[language][data.status],
        message: data.note,
        language,
      });
    }
  } catch (error) {
    console.error('[Order] Failed to send status update notification:', error);
  }
  
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
  
  // 导入 Telegram 服务
  const { sendTelegramNotification } = await import('./telegram');
  
  for (const admin of admins) {
    // 创建系统通知
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
    
    // 发送 Telegram 通知
    if (admin.isVerified && admin.telegramChatId) {
      await sendTelegramNotification(
        admin.telegramChatId,
        `📦 *Новый заказ*\n\nЗаказ: #${orderNumber}\nСумма: ₽${totalAmount}\nМагазин: ${storeName}`
      );
    }
  }
}

// 发送库存预警通知给管理员
export async function sendLowStockNotification(productId: number, productName: string, currentStock: number) {
  const db = await getDb();
  if (!db) return;
  
  const admins = await getAdminsForNotification('lowStock');
  const { sendTelegramNotification } = await import('./telegram');
  
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
    
    // 发送 Telegram 通知
    if (admin.isVerified && admin.telegramChatId) {
      await sendTelegramNotification(
        admin.telegramChatId,
        `⚠️ *Предупреждение о запасах*\n\nТовар: ${productName}\nОстаток: ${currentStock}`
      );
    }
  }
}

// 发送支付失败通知给管理员
export async function sendPaymentFailedNotification(orderId: number, orderNumber: string, errorMessage: string) {
  const db = await getDb();
  if (!db) return;
  
  const admins = await getAdminsForNotification('paymentFailed');
  const { sendTelegramNotification } = await import('./telegram');
  
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
    
    // 发送 Telegram 通知
    if (admin.isVerified && admin.telegramChatId) {
      await sendTelegramNotification(
        admin.telegramChatId,
        `❌ *Ошибка оплаты*\n\nЗаказ: #${orderNumber}\nОшибка: ${errorMessage}`
      );
    }
  }
}

// 发送系统警报通知给管理员
export async function sendSystemAlertNotification(title: string, content: string, priority: 'low' | 'normal' | 'high' | 'urgent' = 'high') {
  const db = await getDb();
  if (!db) return;
  
  const admins = await getAdminsForNotification('systemAlert');
  const { sendTelegramNotification } = await import('./telegram');
  
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
    
    // 发送 Telegram 通知
    if (admin.isVerified && admin.telegramChatId) {
      const emoji = priority === 'urgent' ? '🚨' : priority === 'high' ? '⚠️' : 'ℹ️';
      await sendTelegramNotification(
        admin.telegramChatId,
        `${emoji} *${title}*\n\n${content}`
      );
    }
  }
}

// Telegram 用户相关函数
export async function getUserByTelegramId(telegramId: string) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  const result = await db
    .select()
    .from(users)
    .where(eq(users.telegramId, telegramId))
    .limit(1);
  return result[0] || null;
}

export async function createUser(data: {
  openId: string;
  telegramId?: string;
  name: string;
  username?: string;
  languageCode?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  const now = new Date();
  const result = await db
    .insert(users)
    .values({
      openId: data.openId,
      telegramId: data.telegramId || null,
      telegramUsername: data.username || null,
      name: data.name,
      language: data.languageCode || 'zh',
      role: 'user',
      totalPoints: 0,
      availablePoints: 0,
      totalSpent: '0.00',
      createdAt: now,
      updatedAt: now,
      lastSignedIn: now,
    });
  
  // 获取新创建的用户
  const newUser = await db
    .select()
    .from(users)
    .where(eq(users.openId, data.openId))
    .limit(1);
  
  return newUser[0];
}

// ==================== 支付相关 ====================

/**
 * 根据订单 ID 获取支付记录
 */
export async function getPaymentByOrderId(orderId: number) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  
  const paymentRecords = await db
    .select()
    .from(payments)
    .where(eq(payments.orderId, orderId))
    .orderBy(desc(payments.createdAt))
    .limit(1);
  
  return paymentRecords[0] || null;
}

/**
 * 获取所有 YooKassa 配置
 */
export async function getAllYooKassaConfigs() {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  
  return await db.select().from(yookassaConfig).orderBy(desc(yookassaConfig.createdAt));
}

/**
 * 创建 YooKassa 配置
 */
export async function createYooKassaConfig(data: {
  shopId: string;
  secretKey: string;
  isActive?: boolean;
}) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  
  // 如果新配置设为活跃，先将其他配置设为非活跃
  if (data.isActive !== false) {
    await db.update(yookassaConfig).set({ isActive: false });
  }
  
  await db.insert(yookassaConfig).values({
    shopId: data.shopId,
    secretKey: data.secretKey,
    isActive: data.isActive !== false,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  
  return { success: true };
}

/**
 * 更新 YooKassa 配置
 */
export async function updateYooKassaConfig(data: {
  id: number;
  shopId?: string;
  secretKey?: string;
  isActive?: boolean;
}) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  
  // 如果设为活跃，先将其他配置设为非活跃
  if (data.isActive === true) {
    await db.update(yookassaConfig).set({ isActive: false }).where(ne(yookassaConfig.id, data.id));
  }
  
  const updateData: any = { updatedAt: new Date() };
  if (data.shopId !== undefined) updateData.shopId = data.shopId;
  if (data.secretKey !== undefined) updateData.secretKey = data.secretKey;
  if (data.isActive !== undefined) updateData.isActive = data.isActive;
  
  await db.update(yookassaConfig).set(updateData).where(eq(yookassaConfig.id, data.id));
  
  return { success: true };
}

/**
 * 删除 YooKassa 配置
 */
export async function deleteYooKassaConfig(id: number) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  
  await db.delete(yookassaConfig).where(eq(yookassaConfig.id, id));
  
  return { success: true };
}

/**
 * 获取所有支付记录（支持筛选和搜索）
 */
export async function getAllPayments(status?: string, search?: string) {
  const database = await getDb();
  if (!database) throw new Error('Database not available');

  // 构建查询条件
  const conditions = [];
  
  if (status) {
    conditions.push(eq(payments.status, status as any));
  }
  
  if (search) {
    const searchNumber = parseInt(search);
    if (!isNaN(searchNumber)) {
      conditions.push(
        or(
          eq(payments.paymentNo, search),
          eq(payments.orderId, searchNumber)
        )
      );
    } else {
      conditions.push(eq(payments.paymentNo, search));
    }
  }

  // 执行查询
  const query = conditions.length > 0
    ? database.select().from(payments).where(and(...conditions))
    : database.select().from(payments);

  const results = await query.orderBy(desc(payments.createdAt));
  return results;
}

/**
 * 创建退款记录
 */
export async function createRefund(data: {
  paymentId: number;
  refundNo: string;
  gatewayRefundId?: string;
  amount: string;
  currency: string;
  reason?: string;
  status?: 'pending' | 'succeeded' | 'failed';
}) {
  const database = await getDb();
  if (!database) throw new Error('Database not available');

  const [refund] = await database.insert(refunds).values({
    paymentId: data.paymentId,
    refundNo: data.refundNo,
    gatewayRefundId: data.gatewayRefundId,
    amount: data.amount,
    currency: data.currency,
    reason: data.reason,
    status: data.status || 'pending',
  });

  return await database.select().from(refunds).where(eq(refunds.id, refund.insertId)).limit(1).then(r => r[0]);
}

/**
 * 更新退款状态
 */
export async function updateRefundStatus(refundId: number, status: 'pending' | 'succeeded' | 'failed', errorMessage?: string) {
  const database = await getDb();
  if (!database) throw new Error('Database not available');

  await database.update(refunds)
    .set({
      status,
      errorMessage,
      refundedAt: status === 'succeeded' ? new Date() : undefined,
      updatedAt: new Date(),
    })
    .where(eq(refunds.id, refundId));

  return await database.select().from(refunds).where(eq(refunds.id, refundId)).limit(1).then(r => r[0]);
}

/**
 * 根据支付ID获取退款记录
 */
export async function getRefundsByPaymentId(paymentId: number) {
  const database = await getDb();
  if (!database) throw new Error('Database not available');

  return await database.select().from(refunds).where(eq(refunds.paymentId, paymentId)).orderBy(desc(refunds.createdAt));
}

/**
 * 获取所有退款记录（支持筛选）
 */
export async function getAllRefunds(status?: string, search?: string) {
  const database = await getDb();
  if (!database) throw new Error('Database not available');

  const conditions = [];
  
  if (status) {
    conditions.push(eq(refunds.status, status as any));
  }
  
  if (search) {
    const searchNumber = parseInt(search);
    if (!isNaN(searchNumber)) {
      conditions.push(
        or(
          eq(refunds.refundNo, search),
          eq(refunds.paymentId, searchNumber)
        )
      );
    } else {
      conditions.push(eq(refunds.refundNo, search));
    }
  }

  const query = conditions.length > 0
    ? database.select().from(refunds).where(and(...conditions))
    : database.select().from(refunds);

  return await query.orderBy(desc(refunds.createdAt));
}

/**
 * 获取支付统计数据
 */
export async function getPaymentStatistics(period: 'today' | 'week' | 'month') {
  const database = await getDb();
  if (!database) throw new Error('Database not available');

  const now = new Date();
  let startDate: Date;

  switch (period) {
    case 'today':
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      break;
    case 'week':
      const dayOfWeek = now.getDay();
      const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // 周一为起始
      startDate = new Date(now.getFullYear(), now.getMonth(), diff);
      startDate.setHours(0, 0, 0, 0);
      break;
    case 'month':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
  }

  // 获取所有支付记录
  const allPayments = await database
    .select()
    .from(payments)
    .where(gte(payments.createdAt, startDate));

  // 计算统计数据
  const totalAmount = allPayments.reduce((sum, p) => {
    if (p.status === 'succeeded') {
      return sum + parseFloat(p.amount);
    }
    return sum;
  }, 0);

  const successCount = allPayments.filter(p => p.status === 'succeeded').length;
  const failedCount = allPayments.filter(p => p.status === 'failed').length;
  const refundedCount = allPayments.filter(p => p.status === 'refunded').length;
  const totalCount = allPayments.length;

  const successRate = totalCount > 0 ? (successCount / totalCount) * 100 : 0;
  const refundRate = successCount > 0 ? (refundedCount / successCount) * 100 : 0;

  return {
    totalAmount: totalAmount.toFixed(2),
    totalCount,
    successCount,
    failedCount,
    refundedCount,
    successRate: successRate.toFixed(2),
    refundRate: refundRate.toFixed(2),
  };
}


// ==================== 商品配置管理 ====================

/**
 * 获取所有全局配置
 */
export async function getAllProductConfigs() {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  
  return await db.select().from(productConfig).orderBy(productConfig.sortOrder);
}

/**
 * 根据配置键获取配置
 */
export async function getProductConfigByKey(configKey: string) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  
  const result = await db.select().from(productConfig).where(eq(productConfig.configKey, configKey)).limit(1);
  return result[0] || null;
}

/**
 * 创建全局配置
 */
export async function createProductConfig(data: {
  configKey: string;
  nameZh: string;
  nameRu: string;
  nameEn: string;
  configType: 'sugar' | 'ice' | 'size' | 'topping' | 'other';
  configValue: any;
  isActive?: boolean;
  sortOrder?: number;
}) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  
  const result = await db.insert(productConfig).values(data);
  const insertId = result[0].insertId;
  
  // 查询并返回插入的记录
  const inserted = await db.select().from(productConfig).where(eq(productConfig.id, insertId)).limit(1);
  return inserted[0];
}

/**
 * 更新全局配置
 */
export async function updateProductConfig(id: number, data: {
  nameZh?: string;
  nameRu?: string;
  nameEn?: string;
  configValue?: any;
  isActive?: boolean;
  sortOrder?: number;
}) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  
  await db.update(productConfig).set(data).where(eq(productConfig.id, id));
}

/**
 * 删除全局配置
 */
export async function deleteProductConfig(id: number) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  
  await db.delete(productConfig).where(eq(productConfig.id, id));
}

/**
 * 获取商品的配置（合并全局配置和商品特定配置）
 */
export async function getProductConfigMerged(productId: number) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  
  // 获取所有全局配置
  const globalConfigs = await db.select().from(productConfig).where(eq(productConfig.isActive, true)).orderBy(productConfig.sortOrder);
  
  // 获取商品特定配置
  const productConfigs = await db.select().from(productOptionConfig).where(eq(productOptionConfig.productId, productId));
  
  // 合并配置
  const merged = globalConfigs.map(global => {
    const override = productConfigs.find(p => p.configKey === global.configKey);
    if (override && override.configValue) {
      return {
        ...global,
        configValue: {
          ...global.configValue,
          ...override.configValue,
        },
        isActive: override.isActive,
      };
    }
    return global;
  });
  
  return merged;
}

/**
 * 设置商品特定配置
 */
export async function setProductOptionConfig(data: {
  productId: number;
  configKey: string;
  configValue: any;
  isActive?: boolean;
}) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  
  // 检查是否已存在
  const existing = await db.select().from(productOptionConfig)
    .where(and(
      eq(productOptionConfig.productId, data.productId),
      eq(productOptionConfig.configKey, data.configKey)
    ))
    .limit(1);
  
  if (existing.length > 0) {
    // 更新
    await db.update(productOptionConfig)
      .set({
        configValue: data.configValue,
        isActive: data.isActive ?? true,
      })
      .where(eq(productOptionConfig.id, existing[0].id));
  } else {
    // 创建
    await db.insert(productOptionConfig).values(data);
  }
}

/**
 * 删除商品特定配置
 */
export async function deleteProductOptionConfig(productId: number, configKey: string) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  
  await db.delete(productOptionConfig)
    .where(and(
      eq(productOptionConfig.productId, productId),
      eq(productOptionConfig.configKey, configKey)
    ));
}

/**
 * 初始化默认配置（首次使用时调用）
 */
export async function initDefaultProductConfigs() {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  
  // 检查是否已有配置
  const existing = await db.select().from(productConfig).limit(1);
  if (existing.length > 0) {
    return; // 已有配置，不需要初始化
  }
  
  // 创建默认配置
  const defaultConfigs = [
    {
      configKey: 'sugar_level',
      nameZh: '糖度',
      nameRu: 'Уровень сахара',
      nameEn: 'Sugar Level',
      configType: 'sugar' as const,
      configValue: {
        enabled: true,
        isRequired: true,
        isMultiple: false,
        maxSelect: 1,
        options: [
          { name: '正常糖', nameZh: '正常糖', nameRu: 'Обычный', nameEn: 'Normal', value: 'normal', isDefault: true, isActive: true, sortOrder: 1 },
          { name: '少糖', nameZh: '少糖', nameRu: 'Меньше сахара', nameEn: 'Less Sugar', value: 'less', isDefault: false, isActive: true, sortOrder: 2 },
          { name: '半糖', nameZh: '半糖', nameRu: 'Половина сахара', nameEn: 'Half Sugar', value: 'half', isDefault: false, isActive: true, sortOrder: 3 },
          { name: '无糖', nameZh: '无糖', nameRu: 'Без сахара', nameEn: 'No Sugar', value: 'none', isDefault: false, isActive: true, sortOrder: 4 },
        ],
      },
      isActive: true,
      sortOrder: 1,
    },
    {
      configKey: 'ice_level',
      nameZh: '冰度',
      nameRu: 'Уровень льда',
      nameEn: 'Ice Level',
      configType: 'ice' as const,
      configValue: {
        enabled: true,
        isRequired: true,
        isMultiple: false,
        maxSelect: 1,
        options: [
          { name: '正常冰', nameZh: '正常冰', nameRu: 'Обычный лёд', nameEn: 'Normal Ice', value: 'normal', isDefault: true, isActive: true, sortOrder: 1 },
          { name: '少冰', nameZh: '少冰', nameRu: 'Меньше льда', nameEn: 'Less Ice', value: 'less', isDefault: false, isActive: true, sortOrder: 2 },
          { name: '去冰', nameZh: '去冰', nameRu: 'Без льда', nameEn: 'No Ice', value: 'none', isDefault: false, isActive: true, sortOrder: 3 },
          { name: '温', nameZh: '温', nameRu: 'Тёплый', nameEn: 'Warm', value: 'warm', isDefault: false, isActive: true, sortOrder: 4 },
          { name: '热', nameZh: '热', nameRu: 'Горячий', nameEn: 'Hot', value: 'hot', isDefault: false, isActive: true, sortOrder: 5 },
        ],
      },
      isActive: true,
      sortOrder: 2,
    },
    {
      configKey: 'drink_size',
      nameZh: '容量',
      nameRu: 'Объём',
      nameEn: 'Size',
      configType: 'size' as const,
      configValue: {
        enabled: true,
        isRequired: true,
        isMultiple: false,
        maxSelect: 1,
        options: [
          { name: '中杯 500ml', nameZh: '中杯 500ml', nameRu: 'Средний 500ml', nameEn: 'Medium 500ml', value: '500', isDefault: true, priceAdjust: 0, isActive: true, sortOrder: 1 },
          { name: '大杯 700ml', nameZh: '大杯 700ml', nameRu: 'Большой 700ml', nameEn: 'Large 700ml', value: '700', isDefault: false, priceAdjust: 50, isActive: true, sortOrder: 2 },
        ],
      },
      isActive: true,
      sortOrder: 3,
    },
    {
      configKey: 'toppings',
      nameZh: '小料',
      nameRu: 'Добавки',
      nameEn: 'Toppings',
      configType: 'topping' as const,
      configValue: {
        enabled: true,
        isRequired: false,
        isMultiple: true,
        maxSelect: 3,
        minSelect: 0,
        options: [
          { name: '珍珠', nameZh: '珍珠', nameRu: 'Жемчуг', nameEn: 'Pearl', value: 'pearl', isDefault: false, priceAdjust: 20, weight: 50, isActive: true, sortOrder: 1 },
          { name: '椰果', nameZh: '椰果', nameRu: 'Кокос', nameEn: 'Coconut Jelly', value: 'coconut', isDefault: false, priceAdjust: 20, weight: 50, isActive: true, sortOrder: 2 },
          { name: '布丁', nameZh: '布丁', nameRu: 'Пудинг', nameEn: 'Pudding', value: 'pudding', isDefault: false, priceAdjust: 25, weight: 60, isActive: true, sortOrder: 3 },
          { name: '仙草', nameZh: '仙草', nameRu: 'Трава бессмертия', nameEn: 'Grass Jelly', value: 'grass_jelly', isDefault: false, priceAdjust: 20, weight: 50, isActive: true, sortOrder: 4 },
          { name: '红豆', nameZh: '红豆', nameRu: 'Красная фасоль', nameEn: 'Red Bean', value: 'red_bean', isDefault: false, priceAdjust: 25, weight: 60, isActive: true, sortOrder: 5 },
        ],
      },
      isActive: true,
      sortOrder: 4,
    },
  ];
  
  for (const config of defaultConfigs) {
    await db.insert(productConfig).values(config);
  }
}


// ==================== 用户通知偏好管理 ====================

/**
 * 获取用户通知偏好
 */
export async function getUserNotificationPreferences(userId: number) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  
  const result = await db.select().from(userNotificationPreferences).where(eq(userNotificationPreferences.userId, userId)).limit(1);
  
  // 如果用户没有偏好设置，返回默认值
  if (result.length === 0) {
    return {
      userId,
      orderStatusEnabled: true,
      promotionEnabled: true,
      systemMessageEnabled: true,
      marketingEnabled: false,
      shippingEnabled: true,
      channelTelegram: true,
      channelEmail: false,
      channelSms: false,
      quietHoursStart: null,
      quietHoursEnd: null,
    };
  }
  
  return result[0];
}

/**
 * 更新用户通知偏好
 */
export async function updateUserNotificationPreferences(userId: number, preferences: {
  orderStatusEnabled?: boolean;
  promotionEnabled?: boolean;
  systemMessageEnabled?: boolean;
  marketingEnabled?: boolean;
  shippingEnabled?: boolean;
  channelTelegram?: boolean;
  channelEmail?: boolean;
  channelSms?: boolean;
  quietHoursStart?: string | null;
  quietHoursEnd?: string | null;
}) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  
  // 检查是否已存在
  const existing = await db.select().from(userNotificationPreferences).where(eq(userNotificationPreferences.userId, userId)).limit(1);
  
  if (existing.length > 0) {
    // 更新
    await db.update(userNotificationPreferences)
      .set(preferences)
      .where(eq(userNotificationPreferences.userId, userId));
  } else {
    // 创建
    await db.insert(userNotificationPreferences).values({
      userId,
      ...preferences,
    });
  }
  
  return await getUserNotificationPreferences(userId);
}

/**
 * 检查用户是否启用了某类通知
 */
export async function isNotificationEnabled(userId: number, notificationType: 'order' | 'promotion' | 'system' | 'marketing' | 'shipping'): Promise<boolean> {
  const preferences = await getUserNotificationPreferences(userId);
  
  switch (notificationType) {
    case 'order':
      return preferences.orderStatusEnabled;
    case 'promotion':
      return preferences.promotionEnabled;
    case 'system':
      return preferences.systemMessageEnabled;
    case 'marketing':
      return preferences.marketingEnabled;
    case 'shipping':
      return preferences.shippingEnabled;
    default:
      return false;
  }
}

/**
 * 检查当前时间是否在用户的免打扰时段
 */
export async function isInQuietHours(userId: number): Promise<boolean> {
  const preferences = await getUserNotificationPreferences(userId);
  
  if (!preferences.quietHoursStart || !preferences.quietHoursEnd) {
    return false; // 没有设置免打扰时段
  }
  
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const currentTime = currentHour * 60 + currentMinute;
  
  const [startHour, startMinute] = preferences.quietHoursStart.split(':').map(Number);
  const [endHour, endMinute] = preferences.quietHoursEnd.split(':').map(Number);
  const startTime = startHour * 60 + startMinute;
  const endTime = endHour * 60 + endMinute;
  
  // 处理跨午夜的情况（例如 22:00-08:00）
  if (startTime > endTime) {
    return currentTime >= startTime || currentTime < endTime;
  } else {
    return currentTime >= startTime && currentTime < endTime;
  }
}

// ==================== 营销触发器管理 ====================

export async function getMarketingTriggers(filters?: {
  isActive?: boolean;
  triggerType?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  let query = db.select().from(marketingTriggers);
  
  const conditions = [];
  if (filters?.isActive !== undefined) {
    conditions.push(eq(marketingTriggers.isActive, filters.isActive));
  }
  if (filters?.triggerType) {
    conditions.push(eq(marketingTriggers.triggerType, filters.triggerType as any));
  }
  
  if (conditions.length > 0) {
    query = query.where(and(...conditions)) as any;
  }
  
  return await query.orderBy(desc(marketingTriggers.createdAt));
}

export async function getMarketingTriggerById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.select().from(marketingTriggers)
    .where(eq(marketingTriggers.id, id))
    .limit(1);
  
  return result[0] || null;
}

export async function createMarketingTrigger(data: {
  name: string;
  triggerType: 'user_register' | 'first_order' | 'order_amount' | 'user_inactive' | 'birthday' | 'time_based';
  conditions: any;
  action: 'send_coupon' | 'send_notification' | 'add_points';
  actionConfig: any;
  isActive?: boolean;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(marketingTriggers).values({
    name: data.name,
    triggerType: data.triggerType,
    conditions: data.conditions,
    action: data.action,
    actionConfig: data.actionConfig,
    isActive: data.isActive ?? true,
  });
  
  return { success: true, id: Number(result[0].insertId) };
}

export async function updateMarketingTrigger(id: number, data: Partial<{
  name: string;
  triggerType: 'user_register' | 'first_order' | 'order_amount' | 'user_inactive' | 'birthday' | 'time_based';
  conditions: any;
  action: 'send_coupon' | 'send_notification' | 'add_points';
  actionConfig: any;
  isActive: boolean;
}>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(marketingTriggers)
    .set(data)
    .where(eq(marketingTriggers.id, id));
  
  return { success: true };
}

export async function incrementTriggerSpent(id: number, amount: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(marketingTriggers)
    .set({ spent: sql`${marketingTriggers.spent} + ${amount}` })
    .where(eq(marketingTriggers.id, id));
  
  return { success: true };
}

export async function deleteMarketingTrigger(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(marketingTriggers)
    .where(eq(marketingTriggers.id, id));
  
  return { success: true };
}

export async function getTriggerExecutions(params: {
  triggerId?: number;
  userId?: number;
  status?: 'success' | 'failed';
  limit?: number;
  offset?: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const { triggerId, userId, status, limit = 50, offset = 0 } = params;
  
  let query = db.select().from(triggerExecutions);
  
  const conditions = [];
  if (triggerId) {
    conditions.push(eq(triggerExecutions.triggerId, triggerId));
  }
  if (userId) {
    conditions.push(eq(triggerExecutions.userId, userId));
  }
  if (status) {
    conditions.push(eq(triggerExecutions.status, status));
  }
  
  if (conditions.length > 0) {
    query = query.where(and(...conditions)) as any;
  }
  
  return await query
    .orderBy(desc(triggerExecutions.executedAt))
    .limit(limit)
    .offset(offset);
}

export async function recordTriggerExecution(data: {
  triggerId: number;
  userId: number;
  status: 'success' | 'failed';
  result?: any;
  errorMessage?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.insert(triggerExecutions).values(data);
  
  // 更新触发器执行次数
  if (data.status === 'success') {
    await db.update(marketingTriggers)
      .set({
        executionCount: sql`${marketingTriggers.executionCount} + 1`,
        lastExecutedAt: new Date(),
      })
      .where(eq(marketingTriggers.id, data.triggerId));
  }
  
  return { success: true };
}


/**
 * 获取触发器执行统计
 */
export async function getTriggerExecutionStats(triggerId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const executions = await db
    .select()
    .from(triggerExecutions)
    .where(eq(triggerExecutions.triggerId, triggerId));

  const total = executions.length;
  const successful = executions.filter(e => e.status === 'success').length;
  const failed = executions.filter(e => e.status === 'failed').length;
  const successRate = total > 0 ? (successful / total) * 100 : 0;

  // 获取最近7天的执行趋势
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  
  const recentExecutions = executions.filter(e => 
    new Date(e.executedAt) >= sevenDaysAgo
  );

  return {
    total,
    successful,
    failed,
    successRate: Math.round(successRate * 100) / 100,
    recentExecutions: recentExecutions.length,
    lastExecutedAt: executions.length > 0 ? executions[0].executedAt : null,
  };
}
