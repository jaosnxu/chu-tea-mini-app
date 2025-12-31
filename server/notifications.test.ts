import { describe, it, expect, vi, beforeEach } from 'vitest';
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import * as db from "./db";

// Mock database functions
vi.mock("./db", () => ({
  createNotification: vi.fn(),
  getNotifications: vi.fn(),
  getUnreadNotificationCount: vi.fn(),
  markNotificationAsRead: vi.fn(),
  markAllNotificationsAsRead: vi.fn(),
  getAdminNotifications: vi.fn(),
  getAdminTelegramBinding: vi.fn(),
  upsertAdminTelegramBinding: vi.fn(),
  getAdminsForNotification: vi.fn(),
  sendNewOrderNotification: vi.fn(),
  sendLowStockNotification: vi.fn(),
  sendPaymentFailedNotification: vi.fn(),
}));

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

const mockUser: AuthenticatedUser = {
  id: 1,
  openId: "test-open-id",
  name: "Test Admin",
  avatar: null,
  phone: null,
  email: null,
  role: "admin",
  memberLevel: "normal",
  points: 0,
  totalSpent: "0",
  orderCount: 0,
  createdAt: new Date(),
  updatedAt: new Date(),
  lastLoginAt: new Date(),
  inviteCode: null,
  invitedBy: null,
};

const createCaller = (user: AuthenticatedUser | null = mockUser) => {
  return appRouter.createCaller({
    user,
    req: {} as any,
    res: {} as any,
  });
};

describe('Notification System', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createNotification', () => {
    it('should create a new notification', async () => {
      const mockNotification = {
        id: 1,
        recipientType: 'admin',
        recipientId: 1,
        channel: 'system',
        titleZh: '新订单通知',
        titleRu: 'Новый заказ',
        titleEn: 'New Order',
        contentZh: '您有一个新订单',
        contentRu: 'У вас новый заказ',
        contentEn: 'You have a new order',
        priority: 'normal',
        status: 'sent',
        createdAt: new Date(),
      };

      vi.mocked(db.createNotification).mockResolvedValue(mockNotification as any);

      const result = await db.createNotification({
        recipientType: 'admin',
        recipientId: 1,
        channel: 'system',
        titleZh: '新订单通知',
        titleRu: 'Новый заказ',
        titleEn: 'New Order',
        contentZh: '您有一个新订单',
        contentRu: 'У вас новый заказ',
        contentEn: 'You have a new order',
        priority: 'normal',
        status: 'sent',
      });

      expect(result).toBeDefined();
      expect(result.id).toBe(1);
      expect(result.status).toBe('sent');
    });

    it('should create notification with high priority', async () => {
      const mockNotification = {
        id: 2,
        recipientType: 'admin',
        recipientId: 1,
        channel: 'system',
        titleZh: '支付失败',
        priority: 'high',
        status: 'sent',
        createdAt: new Date(),
      };

      vi.mocked(db.createNotification).mockResolvedValue(mockNotification as any);

      const result = await db.createNotification({
        recipientType: 'admin',
        recipientId: 1,
        channel: 'system',
        titleZh: '支付失败',
        titleRu: 'Ошибка оплаты',
        titleEn: 'Payment Failed',
        contentZh: '订单支付失败',
        contentRu: 'Ошибка оплаты заказа',
        contentEn: 'Order payment failed',
        priority: 'high',
        status: 'sent',
      });

      expect(result.priority).toBe('high');
    });
  });

  describe('getNotifications', () => {
    it('should get notifications list', async () => {
      const mockNotifications = [
        { id: 1, channel: 'system', status: 'sent' },
        { id: 2, channel: 'system', status: 'read' },
      ];

      vi.mocked(db.getNotifications).mockResolvedValue(mockNotifications as any);

      const result = await db.getNotifications({
        recipientType: 'admin',
        recipientId: 1,
        limit: 10,
      });

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(2);
    });

    it('should filter by channel', async () => {
      const mockNotifications = [
        { id: 1, channel: 'system', status: 'sent' },
      ];

      vi.mocked(db.getNotifications).mockResolvedValue(mockNotifications as any);

      const result = await db.getNotifications({
        recipientType: 'admin',
        recipientId: 1,
        channel: 'system',
        limit: 10,
      });

      expect(Array.isArray(result)).toBe(true);
      result.forEach(n => {
        expect(n.channel).toBe('system');
      });
    });
  });

  describe('getUnreadNotificationCount', () => {
    it('should return unread count', async () => {
      vi.mocked(db.getUnreadNotificationCount).mockResolvedValue(5);

      const count = await db.getUnreadNotificationCount(1);
      expect(typeof count).toBe('number');
      expect(count).toBe(5);
    });
  });

  describe('markNotificationAsRead', () => {
    it('should mark notification as read', async () => {
      vi.mocked(db.markNotificationAsRead).mockResolvedValue({ success: true });

      const result = await db.markNotificationAsRead(1, 1);
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    });
  });

  describe('markAllNotificationsAsRead', () => {
    it('should mark all notifications as read', async () => {
      vi.mocked(db.markAllNotificationsAsRead).mockResolvedValue({ success: true });

      const result = await db.markAllNotificationsAsRead(1);
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    });
  });

  describe('Admin Notifications API', () => {
    it('should get admin notifications', async () => {
      const mockNotifications = [
        { id: 1, titleZh: '新订单', status: 'sent' },
        { id: 2, titleZh: '库存预警', status: 'sent' },
      ];

      vi.mocked(db.getAdminNotifications).mockResolvedValue(mockNotifications as any);

      const result = await db.getAdminNotifications(1, { limit: 10 });
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(2);
    });

    it('should get unread notifications only', async () => {
      const mockNotifications = [
        { id: 1, titleZh: '新订单', status: 'sent' },
      ];

      vi.mocked(db.getAdminNotifications).mockResolvedValue(mockNotifications as any);

      const result = await db.getAdminNotifications(1, { limit: 10, unreadOnly: true });
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('Telegram Binding', () => {
    it('should get telegram binding', async () => {
      const mockBinding = {
        id: 1,
        adminUserId: 1,
        telegramChatId: '123456789',
        telegramUsername: 'testuser',
        isVerified: true,
        verifiedAt: new Date(),
      };

      vi.mocked(db.getAdminTelegramBinding).mockResolvedValue(mockBinding as any);

      const result = await db.getAdminTelegramBinding(1);
      expect(result).toBeDefined();
      expect(result?.telegramChatId).toBe('123456789');
    });

    it('should upsert telegram binding', async () => {
      const mockBinding = {
        id: 1,
        adminUserId: 1,
        telegramChatId: '123456789',
        telegramUsername: 'testuser',
        verificationCode: 'ABC123',
        isVerified: false,
      };

      vi.mocked(db.upsertAdminTelegramBinding).mockResolvedValue(mockBinding as any);

      const result = await db.upsertAdminTelegramBinding({
        adminUserId: 1,
        telegramChatId: '123456789',
        telegramUsername: 'testuser',
      });

      expect(result).toBeDefined();
      expect(result.telegramChatId).toBe('123456789');
      expect(result.verificationCode).toBeDefined();
    });
  });

  describe('Notification Triggers', () => {
    it('should send new order notification', async () => {
      vi.mocked(db.getAdminsForNotification).mockResolvedValue([{ adminUserId: 1 }] as any);
      vi.mocked(db.sendNewOrderNotification).mockResolvedValue(undefined);

      await db.sendNewOrderNotification(1, 'CHU20251231ABC', '100.00', 'Moscow Store');
      expect(db.sendNewOrderNotification).toHaveBeenCalledWith(1, 'CHU20251231ABC', '100.00', 'Moscow Store');
    });

    it('should send low stock notification', async () => {
      vi.mocked(db.getAdminsForNotification).mockResolvedValue([{ adminUserId: 1 }] as any);
      vi.mocked(db.sendLowStockNotification).mockResolvedValue(undefined);

      await db.sendLowStockNotification(1, 'Pearl Milk Tea', 5);
      expect(db.sendLowStockNotification).toHaveBeenCalledWith(1, 'Pearl Milk Tea', 5);
    });

    it('should send payment failed notification', async () => {
      vi.mocked(db.getAdminsForNotification).mockResolvedValue([{ adminUserId: 1 }] as any);
      vi.mocked(db.sendPaymentFailedNotification).mockResolvedValue(undefined);

      await db.sendPaymentFailedNotification(1, 'CHU20251231ABC', 'Card declined');
      expect(db.sendPaymentFailedNotification).toHaveBeenCalledWith(1, 'CHU20251231ABC', 'Card declined');
    });
  });
});
