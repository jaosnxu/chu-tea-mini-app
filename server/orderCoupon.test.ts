import { describe, it, expect, beforeAll } from 'vitest';
import * as db from './db';

describe('Order Coupon Integration', { timeout: 10000 }, () => {
  let testUserId: number;
  let testProductId: number;
  let testCouponTemplateId: number;
  let testUserCouponId: number;

  beforeAll(async () => {
    // 使用系统中已存在的用户 ID
    testUserId = 1; // 假设系统中已有用户

    // 创建测试商品（使用现有商品）
    const existingProducts = await db.getProducts({ type: 'tea', limit: 1 });
    if (existingProducts.length > 0) {
      testProductId = existingProducts[0].id;
    } else {
      throw new Error('No tea products found for testing');
    }

    // 创建优惠券模板（满40减10）
    const templateResult = await db.createCouponTemplate({
      code: `TEST-ORDER-${Date.now()}`,
      nameZh: '满40减10',
      nameRu: 'Скидка 10 при заказе от 40',
      nameEn: '$10 off $40',
      type: 'fixed',
      value: '10.00',
      minOrderAmount: '40.00',
      totalQuantity: 100,
      perUserLimit: 10, // 允许每个用户领取多次
      validDays: 30,
      isActive: true,
    });
    testCouponTemplateId = templateResult.id;

    // 给用户发放优惠券
    const couponResult = await db.claimCoupon(testUserId, testCouponTemplateId);
    testUserCouponId = couponResult.couponId;
  });

  it('should apply coupon discount when creating order', async () => {
    // 创建订单（使用优惠券）
    const result = await db.createOrder(testUserId, {
      orderType: 'tea',
      orderSource: 'telegram',
      deliveryType: 'pickup',
      couponId: testUserCouponId,
      items: [{
        productId: testProductId,
        quantity: 1,
        unitPrice: '50.00',
      }],
    });

    expect(result.success).toBe(true);
    expect(result.orderId).toBeDefined();

    // 验证订单金额（50 - 10 = 40）
    const order = await db.getOrderById(testUserId, result.orderId);
    expect(order).toBeDefined();
    expect(parseFloat(order!.subtotal)).toBe(50);
    expect(parseFloat(order!.couponDiscount)).toBe(10);
    expect(parseFloat(order!.totalAmount)).toBe(40);
  });

  it('should mark coupon as used after order creation', async () => {
    // 创建新的优惠券
    const couponResult = await db.claimCoupon(testUserId, testCouponTemplateId);
    const newCouponId = couponResult.couponId;

    // 创建订单
    await db.createOrder(testUserId, {
      orderType: 'tea',
      orderSource: 'telegram',
      deliveryType: 'pickup',
      couponId: newCouponId,
      items: [{
        productId: testProductId,
        quantity: 1,
        unitPrice: '50.00',
      }],
    });

    // 验证优惠券状态
    const coupons = await db.getUserCoupons(testUserId, 'used');
    const usedCoupon = coupons.find(c => c.id === newCouponId);
    expect(usedCoupon).toBeDefined();
    expect(usedCoupon!.status).toBe('used');
    expect(usedCoupon!.usedAt).toBeDefined();
  });

  it('should fail when coupon does not meet minimum order amount', async () => {
    // 创建新的优惠券
    const couponResult = await db.claimCoupon(testUserId, testCouponTemplateId);
    const newCouponId = couponResult.couponId;

    // 尝试创建订单（金额不足）
    await expect(
      db.createOrder(testUserId, {
        orderType: 'tea',
        orderSource: 'telegram',
        deliveryType: 'pickup',
        couponId: newCouponId,
        items: [{
          productId: testProductId,
          quantity: 1,
          unitPrice: '30.00', // 低于最低订单金额40
        }],
      })
    ).rejects.toThrow();
  });

  it('should create order without coupon when couponId is not provided', async () => {
    // 创建订单（不使用优惠券）
    const result = await db.createOrder(testUserId, {
      orderType: 'tea',
      orderSource: 'telegram',
      deliveryType: 'pickup',
      items: [{
        productId: testProductId,
        quantity: 1,
        unitPrice: '50.00',
      }],
    });

    expect(result.success).toBe(true);

    // 验证订单金额（无优惠）
    const order = await db.getOrderById(testUserId, result.orderId);
    expect(order).toBeDefined();
    expect(parseFloat(order!.subtotal)).toBe(50);
    expect(parseFloat(order!.couponDiscount)).toBe(0);
    expect(parseFloat(order!.totalAmount)).toBe(50);
  });
});
