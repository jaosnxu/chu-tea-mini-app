/**
 * Telegram Bot 服务单元测试
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock getDb
vi.mock('./db', () => ({
  getDb: vi.fn().mockResolvedValue(null),
}));

describe('Telegram Bot Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockReset();
  });

  describe('sendTelegramMessage', () => {
    it('should return false when bot token is not configured', async () => {
      // 动态导入以便 mock 生效
      const { sendTelegramMessage } = await import('./telegram');
      
      const result = await sendTelegramMessage('123456', 'Test message');
      
      expect(result).toBe(false);
    });
  });

  describe('sendVerificationCode', () => {
    it('should return false when bot token is not configured', async () => {
      const { sendVerificationCode } = await import('./telegram');
      
      const result = await sendVerificationCode('123456', 'ABC123', 'ru');
      
      expect(result).toBe(false);
    });
  });

  describe('sendNewOrderTelegramNotification', () => {
    it('should return false when bot token is not configured', async () => {
      const { sendNewOrderTelegramNotification } = await import('./telegram');
      
      const result = await sendNewOrderTelegramNotification(
        '123456',
        'CHU20251231ABC',
        '1500',
        'Moscow Store',
        'ru'
      );
      
      expect(result).toBe(false);
    });
  });

  describe('sendLowStockTelegramNotification', () => {
    it('should return false when bot token is not configured', async () => {
      const { sendLowStockTelegramNotification } = await import('./telegram');
      
      const result = await sendLowStockTelegramNotification(
        '123456',
        'Pearl Milk Tea',
        5,
        'ru'
      );
      
      expect(result).toBe(false);
    });
  });

  describe('sendPaymentFailedTelegramNotification', () => {
    it('should return false when bot token is not configured', async () => {
      const { sendPaymentFailedTelegramNotification } = await import('./telegram');
      
      const result = await sendPaymentFailedTelegramNotification(
        '123456',
        'CHU20251231ABC',
        'Card declined',
        'ru'
      );
      
      expect(result).toBe(false);
    });
  });

  describe('sendSystemAlertTelegramNotification', () => {
    it('should return false when bot token is not configured', async () => {
      const { sendSystemAlertTelegramNotification } = await import('./telegram');
      
      const result = await sendSystemAlertTelegramNotification(
        '123456',
        'System Alert',
        'Database connection failed',
        'high'
      );
      
      expect(result).toBe(false);
    });
  });

  describe('sendTelegramNotification', () => {
    it('should return false when bot token is not configured', async () => {
      const { sendTelegramNotification } = await import('./telegram');
      
      const result = await sendTelegramNotification('123456', 'Test notification');
      
      expect(result).toBe(false);
    });
  });

  describe('handleTelegramWebhook', () => {
    it('should return error when database is not available', async () => {
      const { handleTelegramWebhook } = await import('./telegram');
      
      const result = await handleTelegramWebhook({});
      
      // 当数据库不可用时，应返回数据库不可用错误
      expect(result.success).toBe(false);
      expect(result.message).toBe('Database not available');
    });

    it('should return error for /start command when db unavailable', async () => {
      const { handleTelegramWebhook } = await import('./telegram');
      
      const result = await handleTelegramWebhook({
        message: {
          chat: { id: 123456 },
          from: { username: 'testuser' },
          text: '/start',
        },
      });
      
      // 当数据库不可用时，应返回 false
      expect(result.success).toBe(false);
    });

    it('should return error for /help command when db unavailable', async () => {
      const { handleTelegramWebhook } = await import('./telegram');
      
      const result = await handleTelegramWebhook({
        message: {
          chat: { id: 123456 },
          from: { username: 'testuser' },
          text: '/help',
        },
      });
      
      // 当数据库不可用时，应返回 false
      expect(result.success).toBe(false);
    });

    it('should return error for verification code when db unavailable', async () => {
      const { handleTelegramWebhook } = await import('./telegram');
      
      const result = await handleTelegramWebhook({
        message: {
          chat: { id: 123456 },
          from: { username: 'testuser' },
          text: 'ABC123',
        },
      });
      
      // 当数据库不可用时，应返回 false
      expect(result.success).toBe(false);
    });
  });

  describe('getVerifiedAdminTelegramBindings', () => {
    it('should return empty array when db is not available', async () => {
      const { getVerifiedAdminTelegramBindings } = await import('./telegram');
      
      const result = await getVerifiedAdminTelegramBindings();
      
      expect(result).toEqual([]);
    });
  });
});
