import { describe, it, expect, beforeEach, vi } from 'vitest';
import { appRouter } from './routers';
import * as db from './db';

// Mock db module
vi.mock('./db', () => ({
  getAllCouponTemplates: vi.fn(),
  createCouponTemplate: vi.fn(),
  updateCouponTemplate: vi.fn(),
  deleteCouponTemplate: vi.fn(),
  batchSendCoupons: vi.fn(),
  calculateCouponDiscount: vi.fn(),
}));

describe('Coupon Management System', () => {
  const adminCaller = appRouter.createCaller({
    user: { id: 1, role: 'admin' as const },
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Coupon Template Management', () => {
    it('should list all coupon templates', async () => {
      const mockTemplates = [
        {
          id: 1,
          code: 'SUMMER2024',
          nameZh: '夏季满减券',
          nameRu: 'Летняя скидка',
          nameEn: 'Summer Discount',
          type: 'fixed' as const,
          value: '20.00',
          minOrderAmount: '100.00',
          isActive: true,
          usedQuantity: 0,
          stackable: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      vi.mocked(db.getAllCouponTemplates).mockResolvedValue(mockTemplates as any);

      const result = await adminCaller.adminCoupon.listTemplates();
      expect(result).toEqual(mockTemplates);
      expect(db.getAllCouponTemplates).toHaveBeenCalled();
    });

    it('should create a fixed amount coupon', async () => {
      const mockResult = { success: true, id: 1 };
      vi.mocked(db.createCouponTemplate).mockResolvedValue(mockResult);

      const input = {
        code: 'FIXED20',
        nameZh: '满100减20',
        nameRu: 'Скидка 20',
        nameEn: 'Save 20',
        type: 'fixed' as const,
        value: '20',
        minOrderAmount: '100',
      };

      const result = await adminCaller.adminCoupon.createTemplate(input);
      expect(result).toEqual(mockResult);
      expect(db.createCouponTemplate).toHaveBeenCalledWith(input, 1);
    });

    it('should create a buy-one-get-one coupon', async () => {
      const mockResult = { success: true, id: 3 };
      vi.mocked(db.createCouponTemplate).mockResolvedValue(mockResult);

      const input = {
        code: 'BOGO2024',
        nameZh: '买一送一',
        nameRu: 'Купи один получи один',
        nameEn: 'Buy One Get One',
        type: 'buy_one_get_one' as const,
        value: '1',
        applicableProducts: [1, 2, 3],
      };

      const result = await adminCaller.adminCoupon.createTemplate(input);
      expect(result).toEqual(mockResult);
    });

    it('should update a coupon template', async () => {
      const mockResult = { success: true };
      vi.mocked(db.updateCouponTemplate).mockResolvedValue(mockResult);

      const input = {
        id: 1,
        nameZh: '更新后的名称',
        value: '30',
        isActive: false,
      };

      const result = await adminCaller.adminCoupon.updateTemplate(input);
      expect(result).toEqual(mockResult);
    });

    it('should delete a coupon template', async () => {
      const mockResult = { success: true };
      vi.mocked(db.deleteCouponTemplate).mockResolvedValue(mockResult);

      const result = await adminCaller.adminCoupon.deleteTemplate({ id: 1 });
      expect(result).toEqual(mockResult);
    });
  });

  describe('Batch Send Coupons', () => {
    it('should send coupons to all users', async () => {
      const mockResult = { success: true, sentCount: 100 };
      vi.mocked(db.batchSendCoupons).mockResolvedValue(mockResult);

      const input = {
        templateId: 1,
        targetType: 'all' as const,
        reason: '新年活动',
      };

      const result = await adminCaller.adminCoupon.batchSend(input);
      expect(result).toEqual(mockResult);
    });

    it('should send coupons to VIP users', async () => {
      const mockResult = { success: true, sentCount: 15 };
      vi.mocked(db.batchSendCoupons).mockResolvedValue(mockResult);

      const input = {
        templateId: 1,
        targetType: 'vip' as const,
        reason: 'VIP 专属福利',
      };

      const result = await adminCaller.adminCoupon.batchSend(input);
      expect(result).toEqual(mockResult);
    });
  });
});
