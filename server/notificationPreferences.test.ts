import { describe, it, expect, vi, beforeEach } from 'vitest';
import { appRouter } from './routers';
import type { TrpcContext } from './_core/context';
import * as db from './db';

// Mock database functions
vi.mock('./db', () => ({
  getUserNotificationPreferences: vi.fn(),
  updateUserNotificationPreferences: vi.fn(),
}));

type AuthenticatedUser = NonNullable<TrpcContext['user']>;

function createAuthContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: 'test-user-123',
    email: 'test@example.com',
    name: 'Test User',
    loginMethod: 'telegram',
    role: 'user',
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {} as any,
    res: {} as any,
  };
}

describe('Notification Preferences', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('get', () => {
    it('should return user notification preferences', async () => {
      const mockPreferences = {
        id: 1,
        userId: 1,
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
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(db.getUserNotificationPreferences).mockResolvedValue(mockPreferences);

      const caller = appRouter.createCaller(createAuthContext());
      const result = await caller.notificationPreferences.get();

      expect(result).toEqual(mockPreferences);
      expect(db.getUserNotificationPreferences).toHaveBeenCalledWith(1);
    });

    it('should return default preferences if user has no preferences', async () => {
      const defaultPreferences = {
        userId: 1,
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

      vi.mocked(db.getUserNotificationPreferences).mockResolvedValue(defaultPreferences);

      const caller = appRouter.createCaller(createAuthContext());
      const result = await caller.notificationPreferences.get();

      expect(result).toEqual(defaultPreferences);
    });
  });

  describe('update', () => {
    it('should update notification preferences', async () => {
      const updatedPreferences = {
        id: 1,
        userId: 1,
        orderStatusEnabled: false,
        promotionEnabled: true,
        systemMessageEnabled: true,
        marketingEnabled: true,
        shippingEnabled: false,
        channelTelegram: true,
        channelEmail: true,
        channelSms: false,
        quietHoursStart: '22:00',
        quietHoursEnd: '08:00',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(db.updateUserNotificationPreferences).mockResolvedValue(updatedPreferences);

      const caller = appRouter.createCaller(createAuthContext());
      const result = await caller.notificationPreferences.update({
        orderStatusEnabled: false,
        marketingEnabled: true,
        shippingEnabled: false,
        channelEmail: true,
        quietHoursStart: '22:00',
        quietHoursEnd: '08:00',
      });

      expect(result).toEqual(updatedPreferences);
      expect(db.updateUserNotificationPreferences).toHaveBeenCalledWith(1, {
        orderStatusEnabled: false,
        marketingEnabled: true,
        shippingEnabled: false,
        channelEmail: true,
        quietHoursStart: '22:00',
        quietHoursEnd: '08:00',
      });
    });

    it('should update only specified fields', async () => {
      const updatedPreferences = {
        id: 1,
        userId: 1,
        orderStatusEnabled: true,
        promotionEnabled: false,
        systemMessageEnabled: true,
        marketingEnabled: false,
        shippingEnabled: true,
        channelTelegram: true,
        channelEmail: false,
        channelSms: false,
        quietHoursStart: null,
        quietHoursEnd: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(db.updateUserNotificationPreferences).mockResolvedValue(updatedPreferences);

      const caller = appRouter.createCaller(createAuthContext());
      const result = await caller.notificationPreferences.update({
        promotionEnabled: false,
      });

      expect(result).toEqual(updatedPreferences);
      expect(db.updateUserNotificationPreferences).toHaveBeenCalledWith(1, {
        promotionEnabled: false,
      });
    });

    it('should handle quiet hours settings', async () => {
      const updatedPreferences = {
        id: 1,
        userId: 1,
        orderStatusEnabled: true,
        promotionEnabled: true,
        systemMessageEnabled: true,
        marketingEnabled: false,
        shippingEnabled: true,
        channelTelegram: true,
        channelEmail: false,
        channelSms: false,
        quietHoursStart: '23:00',
        quietHoursEnd: '07:00',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(db.updateUserNotificationPreferences).mockResolvedValue(updatedPreferences);

      const caller = appRouter.createCaller(createAuthContext());
      const result = await caller.notificationPreferences.update({
        quietHoursStart: '23:00',
        quietHoursEnd: '07:00',
      });

      expect(result.quietHoursStart).toBe('23:00');
      expect(result.quietHoursEnd).toBe('07:00');
    });

    it('should handle clearing quiet hours', async () => {
      const updatedPreferences = {
        id: 1,
        userId: 1,
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
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(db.updateUserNotificationPreferences).mockResolvedValue(updatedPreferences);

      const caller = appRouter.createCaller(createAuthContext());
      const result = await caller.notificationPreferences.update({
        quietHoursStart: null,
        quietHoursEnd: null,
      });

      expect(result.quietHoursStart).toBeNull();
      expect(result.quietHoursEnd).toBeNull();
    });

    it('should update notification channels', async () => {
      const updatedPreferences = {
        id: 1,
        userId: 1,
        orderStatusEnabled: true,
        promotionEnabled: true,
        systemMessageEnabled: true,
        marketingEnabled: false,
        shippingEnabled: true,
        channelTelegram: false,
        channelEmail: true,
        channelSms: true,
        quietHoursStart: null,
        quietHoursEnd: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(db.updateUserNotificationPreferences).mockResolvedValue(updatedPreferences);

      const caller = appRouter.createCaller(createAuthContext());
      const result = await caller.notificationPreferences.update({
        channelTelegram: false,
        channelEmail: true,
        channelSms: true,
      });

      expect(result.channelTelegram).toBe(false);
      expect(result.channelEmail).toBe(true);
      expect(result.channelSms).toBe(true);
    });
  });
});
