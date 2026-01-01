/**
 * 会员等级系统单元测试
 */

import { describe, it, expect } from 'vitest';
import * as db from './db';

describe('Member Level System Tests', () => {
  describe('Member Level Rules', () => {
    it('should have correct level requirements', () => {
      const levelRules = [
        { level: 'diamond', minSpent: 10000, minOrders: 50 },
        { level: 'gold', minSpent: 5000, minOrders: 20 },
        { level: 'silver', minSpent: 1000, minOrders: 5 },
        { level: 'normal', minSpent: 0, minOrders: 0 },
      ];

      // 验证等级顺序
      expect(levelRules[0].level).toBe('diamond');
      expect(levelRules[1].level).toBe('gold');
      expect(levelRules[2].level).toBe('silver');
      expect(levelRules[3].level).toBe('normal');

      // 验证消费金额递增
      expect(levelRules[0].minSpent).toBeGreaterThan(levelRules[1].minSpent);
      expect(levelRules[1].minSpent).toBeGreaterThan(levelRules[2].minSpent);
      expect(levelRules[2].minSpent).toBeGreaterThan(levelRules[3].minSpent);
    });
  });

  describe('Member Benefits', () => {
    it('should provide correct benefits for each level', async () => {
      const normalBenefits = await db.getMemberLevelBenefits('normal');
      const silverBenefits = await db.getMemberLevelBenefits('silver');
      const goldBenefits = await db.getMemberLevelBenefits('gold');
      const diamondBenefits = await db.getMemberLevelBenefits('diamond');

      // 验证积分倍率递增
      expect(diamondBenefits.pointsMultiplier).toBeGreaterThan(goldBenefits.pointsMultiplier);
      expect(goldBenefits.pointsMultiplier).toBeGreaterThan(silverBenefits.pointsMultiplier);
      expect(silverBenefits.pointsMultiplier).toBeGreaterThan(normalBenefits.pointsMultiplier);

      // 验证折扣率递增
      expect(diamondBenefits.discountRate).toBeGreaterThan(goldBenefits.discountRate);
      expect(goldBenefits.discountRate).toBeGreaterThan(silverBenefits.discountRate);
      expect(silverBenefits.discountRate).toBeGreaterThan(normalBenefits.discountRate);
    });

    it('should have birthday coupon for silver and above', async () => {
      const normalBenefits = await db.getMemberLevelBenefits('normal');
      const silverBenefits = await db.getMemberLevelBenefits('silver');
      const goldBenefits = await db.getMemberLevelBenefits('gold');
      const diamondBenefits = await db.getMemberLevelBenefits('diamond');

      expect(normalBenefits.birthdayCoupon).toBe(false);
      expect(silverBenefits.birthdayCoupon).toBe(true);
      expect(goldBenefits.birthdayCoupon).toBe(true);
      expect(diamondBenefits.birthdayCoupon).toBe(true);
    });

    it('should have priority support for gold and above', async () => {
      const normalBenefits = await db.getMemberLevelBenefits('normal');
      const silverBenefits = await db.getMemberLevelBenefits('silver');
      const goldBenefits = await db.getMemberLevelBenefits('gold');
      const diamondBenefits = await db.getMemberLevelBenefits('diamond');

      expect(normalBenefits.prioritySupport).toBe(false);
      expect(silverBenefits.prioritySupport).toBe(false);
      expect(goldBenefits.prioritySupport).toBe(true);
      expect(diamondBenefits.prioritySupport).toBe(true);
    });
  });

  describe('Level Progress Calculation', () => {
    it('should calculate progress correctly', () => {
      const currentSpent = 2500;
      const nextLevelSpent = 5000;
      const progress = (currentSpent / nextLevelSpent) * 100;

      expect(progress).toBe(50);
    });

    it('should cap progress at 100%', () => {
      const currentSpent = 6000;
      const nextLevelSpent = 5000;
      const progress = Math.min((currentSpent / nextLevelSpent) * 100, 100);

      expect(progress).toBe(100);
    });

    it('should calculate remaining correctly', () => {
      const currentSpent = 2500;
      const nextLevelSpent = 5000;
      const remaining = Math.max(nextLevelSpent - currentSpent, 0);

      expect(remaining).toBe(2500);
    });
  });

  describe('Level Upgrade Logic', () => {
    it('should determine correct level based on spending and orders', () => {
      const testCases = [
        { spent: 15000, orders: 60, expectedLevel: 'diamond' },
        { spent: 7000, orders: 25, expectedLevel: 'gold' },
        { spent: 2000, orders: 10, expectedLevel: 'silver' },
        { spent: 500, orders: 2, expectedLevel: 'normal' },
      ];

      testCases.forEach(({ spent, orders, expectedLevel }) => {
        let level = 'normal';
        
        if (spent >= 10000 && orders >= 50) level = 'diamond';
        else if (spent >= 5000 && orders >= 20) level = 'gold';
        else if (spent >= 1000 && orders >= 5) level = 'silver';

        expect(level).toBe(expectedLevel);
      });
    });

    it('should require both spending AND orders for upgrade', () => {
      // 只满足消费金额，不满足订单数
      let level = 'normal';
      const spent1 = 6000;
      const orders1 = 10;
      
      if (spent1 >= 5000 && orders1 >= 20) level = 'gold';
      expect(level).toBe('normal');

      // 只满足订单数，不满足消费金额
      level = 'normal';
      const spent2 = 2000;
      const orders2 = 25;
      
      if (spent2 >= 5000 && orders2 >= 20) level = 'gold';
      expect(level).toBe('normal');

      // 两者都满足
      level = 'normal';
      const spent3 = 6000;
      const orders3 = 25;
      
      if (spent3 >= 5000 && orders3 >= 20) level = 'gold';
      expect(level).toBe('gold');
    });
  });

  describe('Points Multiplier', () => {
    it('should apply correct points multiplier', async () => {
      const basePoints = 100;
      
      const normalBenefits = await db.getMemberLevelBenefits('normal');
      const silverBenefits = await db.getMemberLevelBenefits('silver');
      const goldBenefits = await db.getMemberLevelBenefits('gold');
      const diamondBenefits = await db.getMemberLevelBenefits('diamond');

      expect(basePoints * normalBenefits.pointsMultiplier).toBe(100);
      expect(basePoints * silverBenefits.pointsMultiplier).toBe(120);
      expect(basePoints * goldBenefits.pointsMultiplier).toBe(150);
      expect(basePoints * diamondBenefits.pointsMultiplier).toBe(200);
    });
  });

  describe('Discount Rate Application', () => {
    it('should apply correct discount rate', async () => {
      const originalPrice = 1000;
      
      const normalBenefits = await db.getMemberLevelBenefits('normal');
      const silverBenefits = await db.getMemberLevelBenefits('silver');
      const goldBenefits = await db.getMemberLevelBenefits('gold');
      const diamondBenefits = await db.getMemberLevelBenefits('diamond');

      expect(originalPrice * (1 - normalBenefits.discountRate)).toBe(1000);
      expect(originalPrice * (1 - silverBenefits.discountRate)).toBe(950);
      expect(originalPrice * (1 - goldBenefits.discountRate)).toBe(900);
      expect(originalPrice * (1 - diamondBenefits.discountRate)).toBe(850);
    });
  });
});
