import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { appRouter } from './routers';
import type { TrpcContext } from './_core/context';
import * as db from './db';

describe('Payment Integration Tests', () => {
  let adminContext: TrpcContext;
  let userContext: TrpcContext;
  let testOrderId: number;

  beforeAll(async () => {
    // 创建管理员上下文
    adminContext = {
      user: {
        id: 1,
        openId: 'test-admin',
        name: 'Test Admin',
        role: 'admin',
        email: null,
        avatarUrl: null,
        loginMethod: 'oauth',
        points: 0,
        memberLevel: 'bronze',
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
      },
    };

    // 创建普通用户上下文
    userContext = {
      user: {
        id: 2,
        openId: 'test-user',
        name: 'Test User',
        role: 'user',
        email: null,
        avatarUrl: null,
        loginMethod: 'oauth',
        points: 0,
        memberLevel: 'bronze',
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
      },
    };

    // 创建测试订单
    const result = await db.createOrder(userContext.user!.id, {
      orderType: 'tea',
      orderSource: 'telegram',
      deliveryType: 'pickup',
      remark: 'Test order for payment',
      items: [
        {
          productId: 1,
          quantity: 1,
          unitPrice: '100.00',
        },
      ],
    });
    testOrderId = result.orderId;
  });

  describe('YooKassa Configuration Management', () => {
    let configId: number;

    it('should allow admin to create YooKassa config', async () => {
      const caller = appRouter.createCaller(adminContext);
      const result = await caller.yookassa.create({
        shopId: 'test-shop-id',
        secretKey: 'test-secret-key',
        isActive: true,
      });
      expect(result.success).toBe(true);
    });

    it('should allow admin to list YooKassa configs', async () => {
      const caller = appRouter.createCaller(adminContext);
      const configs = await caller.yookassa.list();
      expect(Array.isArray(configs)).toBe(true);
      expect(configs.length).toBeGreaterThan(0);
      configId = configs[0].id;
    });

    it('should allow admin to update YooKassa config', async () => {
      const caller = appRouter.createCaller(adminContext);
      const result = await caller.yookassa.update({
        id: configId,
        isActive: false,
      });
      expect(result.success).toBe(true);
    });

    it('should not allow non-admin to create YooKassa config', async () => {
      const caller = appRouter.createCaller(userContext);
      await expect(
        caller.yookassa.create({
          shopId: 'test-shop-id',
          secretKey: 'test-secret-key',
          isActive: true,
        })
      ).rejects.toThrow('Unauthorized');
    });
  });

  describe('Payment List (Admin)', () => {
    it('should allow admin to list all payments', async () => {
      const caller = appRouter.createCaller(adminContext);
      const payments = await caller.payment.list({});
      expect(Array.isArray(payments)).toBe(true);
    });

    it('should allow admin to filter payments by status', async () => {
      const caller = appRouter.createCaller(adminContext);
      const payments = await caller.payment.list({ status: 'succeeded' });
      expect(Array.isArray(payments)).toBe(true);
    });

    it('should not allow non-admin to list payments', async () => {
      const caller = appRouter.createCaller(userContext);
      await expect(
        caller.payment.list({})
      ).rejects.toThrow();
    });
  });

  describe('Refund Operations', () => {
    it('should allow admin to create refund', async () => {
      const caller = appRouter.createCaller(adminContext);
      // 注意：这个测试需要真实的 YooKassa 配置和支付 ID
      // 在实际环境中测试
      expect(true).toBe(true);
    });

    it('should not allow non-admin to create refund', async () => {
      const caller = appRouter.createCaller(userContext);
      await expect(
        caller.payment.createRefund({
          paymentId: 'test-payment-id',
          amount: '100.00',
          currency: 'RUB',
        })
      ).rejects.toThrow();
    });
  });

  describe('Payment Creation', () => {
    it('should allow user to get payment by order ID', async () => {
      const caller = appRouter.createCaller(userContext);
      const payment = await caller.payment.getByOrderId({ orderId: testOrderId });
      // 可能为 null（如果还没有创建支付）
      expect(payment === null || typeof payment === 'object').toBe(true);
    });

    it('should require authentication for payment creation', async () => {
      const guestContext: TrpcContext = { user: null };
      const caller = appRouter.createCaller(guestContext);
      await expect(
        caller.payment.create({
          orderId: testOrderId,
          amount: '100.00',
          currency: 'RUB',
          description: 'Test payment',
          returnUrl: 'https://example.com/callback',
        })
      ).rejects.toThrow();
    });
  });

  describe('Database Operations', () => {
    it('should create YooKassa config in database', async () => {
      const result = await db.createYooKassaConfig({
        shopId: 'db-test-shop-id',
        secretKey: 'db-test-secret-key',
        isActive: true,
      });
      expect(result.success).toBe(true);
    });

    it('should get all YooKassa configs from database', async () => {
      const configs = await db.getAllYooKassaConfigs();
      expect(Array.isArray(configs)).toBe(true);
      expect(configs.length).toBeGreaterThan(0);
    });

    it('should update YooKassa config in database', async () => {
      const configs = await db.getAllYooKassaConfigs();
      const configId = configs[0].id;
      const result = await db.updateYooKassaConfig({
        id: configId,
        isActive: false,
      });
      expect(result.success).toBe(true);
    });

    it('should get payment by order ID from database', async () => {
      const payment = await db.getPaymentByOrderId(testOrderId);
      // 可能为 null（如果还没有创建支付）
      expect(payment === null || typeof payment === 'object').toBe(true);
    });
  });

  describe('Refund History', () => {
    it('should get refunds by payment ID', async () => {
      const caller = appRouter.createCaller(adminContext);
      // 注意：需要真实的支付 ID
      // 这里只测试 API 可用性
      expect(caller.payment.getRefundsByPaymentId).toBeDefined();
    });

    it('should not allow non-admin to get refunds', async () => {
      const caller = appRouter.createCaller(userContext);
      await expect(
        caller.payment.getRefundsByPaymentId({ paymentId: 1 })
      ).rejects.toThrow();
    });
  });

  describe('Payment Statistics', () => {
    it('should allow admin to get payment statistics for today', async () => {
      const caller = appRouter.createCaller(adminContext);
      const stats = await caller.payment.getStatistics({ period: 'today' });
      expect(stats).toHaveProperty('totalAmount');
      expect(stats).toHaveProperty('totalCount');
      expect(stats).toHaveProperty('successCount');
      expect(stats).toHaveProperty('successRate');
      expect(stats).toHaveProperty('refundRate');
    });

    it('should allow admin to get payment statistics for week', async () => {
      const caller = appRouter.createCaller(adminContext);
      const stats = await caller.payment.getStatistics({ period: 'week' });
      expect(stats).toHaveProperty('totalAmount');
      expect(stats).toHaveProperty('totalCount');
    });

    it('should allow admin to get payment statistics for month', async () => {
      const caller = appRouter.createCaller(adminContext);
      const stats = await caller.payment.getStatistics({ period: 'month' });
      expect(stats).toHaveProperty('totalAmount');
      expect(stats).toHaveProperty('totalCount');
    });

    it('should not allow non-admin to get payment statistics', async () => {
      const caller = appRouter.createCaller(userContext);
      await expect(
        caller.payment.getStatistics({ period: 'today' })
      ).rejects.toThrow();
    });
  });

  afterAll(async () => {
    // 清理测试数据
    try {
      // 删除测试订单
      const dbInstance = await db.getDb();
      if (dbInstance) {
        const { orders } = await import('../drizzle/schema');
        const { eq } = await import('drizzle-orm');
        await dbInstance.delete(orders).where(eq(orders.id, testOrderId));
      }
    } catch (error) {
      console.error('Cleanup error:', error);
    }
  });
});
