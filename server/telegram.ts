/**
 * Telegram Bot 服务
 * 用于发送消息到管理员的 Telegram
 */

import { getDb } from './db';
import { adminTelegramBindings, notifications } from '../drizzle/schema';
import { eq, and } from 'drizzle-orm';

// Telegram Bot API 基础 URL
const TELEGRAM_API_BASE = 'https://api.telegram.org/bot';

// 获取 Bot Token（从数据库或环境变量）
async function getBotToken(): Promise<string | null> {
  const db = await getDb();
  if (!db) return null;
  
  // 首先尝试从 API 配置表获取
  try {
    const { apiConfigs } = await import('../drizzle/schema');
    const [config] = await db.select()
      .from(apiConfigs)
      .where(and(
        eq(apiConfigs.provider, 'telegram'),
        eq(apiConfigs.isActive, true)
      ))
      .limit(1);
    
    if (config?.config?.apiKey) {
      return config.config.apiKey;
    }
  } catch (e) {
    // 表可能不存在
  }
  
  // 回退到环境变量
  return process.env.TELEGRAM_BOT_TOKEN || null;
}

/**
 * 发送 Telegram 消息
 */
export async function sendTelegramMessage(chatId: string, text: string, options?: {
  parseMode?: 'HTML' | 'Markdown' | 'MarkdownV2';
  disableNotification?: boolean;
}): Promise<boolean> {
  const botToken = await getBotToken();
  if (!botToken) {
    console.error('[Telegram] Bot token not configured');
    return false;
  }
  
  try {
    const response = await fetch(`${TELEGRAM_API_BASE}${botToken}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: options?.parseMode || 'HTML',
        disable_notification: options?.disableNotification || false,
      }),
    });
    
    const result = await response.json();
    
    if (!result.ok) {
      console.error('[Telegram] Send message failed:', result.description);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('[Telegram] Send message error:', error);
    return false;
  }
}

/**
 * 发送验证码消息
 */
export async function sendVerificationCode(chatId: string, code: string, language: 'zh' | 'ru' | 'en' = 'ru'): Promise<boolean> {
  const messages = {
    zh: `🔐 <b>CHU TEA 管理员验证</b>\n\n您的验证码是：<code>${code}</code>\n\n请在后台管理系统中输入此验证码完成绑定。\n验证码有效期为 10 分钟。`,
    ru: `🔐 <b>Верификация администратора CHU TEA</b>\n\nВаш код подтверждения: <code>${code}</code>\n\nВведите этот код в панели управления для завершения привязки.\nКод действителен 10 минут.`,
    en: `🔐 <b>CHU TEA Admin Verification</b>\n\nYour verification code is: <code>${code}</code>\n\nPlease enter this code in the admin panel to complete the binding.\nThe code is valid for 10 minutes.`,
  };
  
  return sendTelegramMessage(chatId, messages[language]);
}

/**
 * 发送新订单通知
 */
export async function sendNewOrderTelegramNotification(
  chatId: string,
  orderNumber: string,
  totalAmount: string,
  storeName: string,
  language: 'zh' | 'ru' | 'en' = 'ru'
): Promise<boolean> {
  const messages = {
    zh: `🛒 <b>新订单通知</b>\n\n订单号：<code>${orderNumber}</code>\n金额：₽${totalAmount}\n门店：${storeName}\n\n请及时处理！`,
    ru: `🛒 <b>Новый заказ</b>\n\nНомер заказа: <code>${orderNumber}</code>\nСумма: ₽${totalAmount}\nМагазин: ${storeName}\n\nПожалуйста, обработайте заказ!`,
    en: `🛒 <b>New Order</b>\n\nOrder #: <code>${orderNumber}</code>\nAmount: ₽${totalAmount}\nStore: ${storeName}\n\nPlease process the order!`,
  };
  
  return sendTelegramMessage(chatId, messages[language]);
}

/**
 * 发送库存预警通知
 */
export async function sendLowStockTelegramNotification(
  chatId: string,
  productName: string,
  currentStock: number,
  language: 'zh' | 'ru' | 'en' = 'ru'
): Promise<boolean> {
  const messages = {
    zh: `⚠️ <b>库存预警</b>\n\n商品：${productName}\n当前库存：${currentStock}\n\n请及时补货！`,
    ru: `⚠️ <b>Предупреждение о запасах</b>\n\nТовар: ${productName}\nТекущий остаток: ${currentStock}\n\nПожалуйста, пополните запасы!`,
    en: `⚠️ <b>Low Stock Alert</b>\n\nProduct: ${productName}\nCurrent stock: ${currentStock}\n\nPlease restock!`,
  };
  
  return sendTelegramMessage(chatId, messages[language]);
}

/**
 * 发送支付失败通知
 */
export async function sendPaymentFailedTelegramNotification(
  chatId: string,
  orderNumber: string,
  errorMessage: string,
  language: 'zh' | 'ru' | 'en' = 'ru'
): Promise<boolean> {
  const messages = {
    zh: `❌ <b>支付失败</b>\n\n订单号：<code>${orderNumber}</code>\n错误信息：${errorMessage}\n\n请检查支付系统！`,
    ru: `❌ <b>Ошибка оплаты</b>\n\nНомер заказа: <code>${orderNumber}</code>\nОшибка: ${errorMessage}\n\nПроверьте платежную систему!`,
    en: `❌ <b>Payment Failed</b>\n\nOrder #: <code>${orderNumber}</code>\nError: ${errorMessage}\n\nPlease check the payment system!`,
  };
  
  return sendTelegramMessage(chatId, messages[language]);
}

/**
 * 通用的 Telegram 通知发送函数
 */
export async function sendTelegramNotification(chatId: string, text: string): Promise<boolean> {
  return sendTelegramMessage(chatId, text, { parseMode: 'Markdown' });
}

/**
 * 发送系统警报通知
 */
export async function sendSystemAlertTelegramNotification(
  chatId: string,
  title: string,
  content: string,
  priority: 'low' | 'normal' | 'high' | 'urgent' = 'high'
): Promise<boolean> {
  const priorityEmoji = {
    low: 'ℹ️',
    normal: '📢',
    high: '⚠️',
    urgent: '🚨',
  };
  
  const message = `${priorityEmoji[priority]} <b>${title}</b>\n\n${content}`;
  
  return sendTelegramMessage(chatId, message);
}

/**
 * 获取已验证的管理员 Telegram 绑定列表
 */
export async function getVerifiedAdminTelegramBindings(): Promise<Array<{
  adminUserId: number;
  telegramChatId: string;
  telegramUsername: string | null;
}>> {
  const db = await getDb();
  if (!db) return [];
  
  const bindings = await db.select({
    adminUserId: adminTelegramBindings.adminUserId,
    telegramChatId: adminTelegramBindings.telegramChatId,
    telegramUsername: adminTelegramBindings.telegramUsername,
  })
    .from(adminTelegramBindings)
    .where(eq(adminTelegramBindings.isVerified, true));
  
  return bindings;
}

/**
 * 向所有已绑定的管理员发送通知
 */
export async function broadcastToAdmins(
  message: string,
  options?: {
    parseMode?: 'HTML' | 'Markdown' | 'MarkdownV2';
  }
): Promise<{ success: number; failed: number }> {
  const bindings = await getVerifiedAdminTelegramBindings();
  
  let success = 0;
  let failed = 0;
  
  for (const binding of bindings) {
    const result = await sendTelegramMessage(binding.telegramChatId, message, options);
    if (result) {
      success++;
    } else {
      failed++;
    }
  }
  
  return { success, failed };
}

/**
 * 处理 Telegram Webhook 消息
 */
export async function handleTelegramWebhook(update: any): Promise<{ success: boolean; message?: string }> {
  const db = await getDb();
  if (!db) return { success: false, message: 'Database not available' };
  
  // 处理 /start 命令
  if (update.message?.text?.startsWith('/start')) {
    const chatId = update.message.chat.id.toString();
    const username = update.message.from?.username || null;
    
    // 检查是否有待验证的绑定
    const [pendingBinding] = await db.select()
      .from(adminTelegramBindings)
      .where(and(
        eq(adminTelegramBindings.telegramChatId, chatId),
        eq(adminTelegramBindings.isVerified, false)
      ))
      .limit(1);
    
    if (pendingBinding) {
      // 发送验证码
      await sendVerificationCode(chatId, pendingBinding.verificationCode || 'ERROR');
      return { success: true, message: 'Verification code sent' };
    }
    
    // 发送欢迎消息
    const welcomeMessage = `👋 <b>Добро пожаловать в CHU TEA Bot!</b>\n\nЭтот бот отправляет уведомления администраторам CHU TEA.\n\nДля привязки аккаунта:\n1. Войдите в панель управления CHU TEA\n2. Перейдите в раздел "Уведомления"\n3. Введите ваш Chat ID: <code>${chatId}</code>\n4. Нажмите "Привязать Telegram"`;
    
    await sendTelegramMessage(chatId, welcomeMessage);
    return { success: true, message: 'Welcome message sent' };
  }
  
  // 处理验证码输入
  if (update.message?.text && /^[A-Z0-9]{6}$/.test(update.message.text.trim())) {
    const chatId = update.message.chat.id.toString();
    const code = update.message.text.trim();
    
    // 查找匹配的绑定
    const [binding] = await db.select()
      .from(adminTelegramBindings)
      .where(and(
        eq(adminTelegramBindings.telegramChatId, chatId),
        eq(adminTelegramBindings.verificationCode, code),
        eq(adminTelegramBindings.isVerified, false)
      ))
      .limit(1);
    
    if (binding) {
      // 验证成功，更新绑定状态
      await db.update(adminTelegramBindings)
        .set({
          isVerified: true,
          verifiedAt: new Date(),
          telegramUsername: update.message.from?.username || null,
        })
        .where(eq(adminTelegramBindings.id, binding.id));
      
      const successMessage = `✅ <b>Привязка успешна!</b>\n\nВаш Telegram аккаунт успешно привязан к панели управления CHU TEA.\n\nТеперь вы будете получать уведомления о:\n• Новых заказах\n• Низком остатке товаров\n• Ошибках оплаты\n• Системных событиях`;
      
      await sendTelegramMessage(chatId, successMessage);
      return { success: true, message: 'Verification successful' };
    }
    
    // 验证码不匹配
    const errorMessage = `❌ <b>Неверный код</b>\n\nПроверьте код и попробуйте снова.`;
    await sendTelegramMessage(chatId, errorMessage);
    return { success: false, message: 'Invalid verification code' };
  }
  
  return { success: true, message: 'No action needed' };
}

/**
 * 设置 Telegram Webhook
 */
export async function setTelegramWebhook(webhookUrl: string): Promise<boolean> {
  const botToken = await getBotToken();
  if (!botToken) {
    console.error('[Telegram] Bot token not configured');
    return false;
  }
  
  try {
    const response = await fetch(`${TELEGRAM_API_BASE}${botToken}/setWebhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: webhookUrl,
        allowed_updates: ['message'],
      }),
    });
    
    const result = await response.json();
    
    if (!result.ok) {
      console.error('[Telegram] Set webhook failed:', result.description);
      return false;
    }
    
    console.log('[Telegram] Webhook set successfully:', webhookUrl);
    return true;
  } catch (error) {
    console.error('[Telegram] Set webhook error:', error);
    return false;
  }
}

/**
 * 获取 Telegram Bot 信息
 */
export async function getTelegramBotInfo(): Promise<{
  ok: boolean;
  username?: string;
  firstName?: string;
  canJoinGroups?: boolean;
  canReadAllGroupMessages?: boolean;
} | null> {
  const botToken = await getBotToken();
  if (!botToken) {
    return null;
  }
  
  try {
    const response = await fetch(`${TELEGRAM_API_BASE}${botToken}/getMe`);
    const result = await response.json();
    
    if (!result.ok) {
      return null;
    }
    
    return {
      ok: true,
      username: result.result.username,
      firstName: result.result.first_name,
      canJoinGroups: result.result.can_join_groups,
      canReadAllGroupMessages: result.result.can_read_all_group_messages,
    };
  } catch (error) {
    console.error('[Telegram] Get bot info error:', error);
    return null;
  }
}
