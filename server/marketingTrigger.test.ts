import { describe, it, expect, beforeAll } from 'vitest';
import * as db from './db';

describe('Marketing Trigger System', () => {
  let testTriggerId: number;
  let testCouponTemplateId: number;

  beforeAll(async () => {
    // 创建测试用的优惠券模板
    const couponResult = await db.createCouponTemplate({
      code: `TRIGGER-TEST-${Date.now()}`,
      nameZh: '触发器测试优惠券',
      nameRu: 'Тестовый купон триггера',
      nameEn: 'Trigger Test Coupon',
      type: 'fixed',
      value: '10.00',
      minOrderAmount: '0',
      totalQuantity: 1000,
      perUserLimit: 10,
      validDays: 30,
      isActive: true,
    });
    testCouponTemplateId = couponResult.id;
  });

  describe('Trigger Management', () => {
    it('should create a user register trigger', async () => {
      const result = await db.createMarketingTrigger({
        name: '新用户注册奖励',
        triggerType: 'user_register',
        conditions: {},
        action: 'send_coupon',
        actionConfig: {
          couponTemplateId: testCouponTemplateId,
        },
        isActive: true,
      });

      expect(result.success).toBe(true);
      expect(result.id).toBeTypeOf('number');
      testTriggerId = result.id;
    });

    it('should list all triggers', async () => {
      const triggers = await db.getMarketingTriggers();
      expect(Array.isArray(triggers)).toBe(true);
      expect(triggers.length).toBeGreaterThan(0);
    });

    it('should get trigger by id', async () => {
      const trigger = await db.getMarketingTriggerById(testTriggerId);
      expect(trigger).toBeDefined();
      expect(trigger?.name).toBe('新用户注册奖励');
    });

    it('should update a trigger', async () => {
      const result = await db.updateMarketingTrigger(testTriggerId, {
        name: '新用户注册奖励（已更新）',
        isActive: false,
      });

      expect(result.success).toBe(true);

      const updated = await db.getMarketingTriggerById(testTriggerId);
      expect(updated?.name).toBe('新用户注册奖励（已更新）');
      expect(updated?.isActive).toBe(false);
    });

    it('should create a first order trigger', async () => {
      const result = await db.createMarketingTrigger({
        name: '首单完成奖励',
        triggerType: 'first_order',
        conditions: {},
        action: 'send_coupon',
        actionConfig: {
          couponTemplateId: testCouponTemplateId,
        },
        isActive: true,
      });

      expect(result.success).toBe(true);
    });

    it('should create an order amount trigger', async () => {
      const result = await db.createMarketingTrigger({
        name: '消费满100奖励',
        triggerType: 'order_amount',
        conditions: {
          minAmount: 100,
        },
        action: 'send_coupon',
        actionConfig: {
          couponTemplateId: testCouponTemplateId,
        },
        isActive: true,
      });

      expect(result.success).toBe(true);
    });

    it('should delete a trigger', async () => {
      const result = await db.deleteMarketingTrigger(testTriggerId);
      expect(result.success).toBe(true);

      const deleted = await db.getMarketingTriggerById(testTriggerId);
      expect(deleted).toBeNull();
    });
  });

  describe('Trigger Execution', () => {
    it('should record trigger execution', async () => {
      const result = await db.recordTriggerExecution({
        triggerId: 1,
        userId: 1,
        status: 'success',
        result: { couponId: 123 },
      });

      expect(result.success).toBe(true);
    });

    it('should get trigger executions', async () => {
      const executions = await db.getTriggerExecutions({ limit: 10 });
      expect(Array.isArray(executions)).toBe(true);
    });
  });
});
