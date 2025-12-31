/**
 * 用户订单通知服务
 * 用于发送订单相关通知到用户的 Telegram
 */

import { sendTelegramMessage } from './telegram';
import { getDb } from './db';
import { users } from '../drizzle/schema';
import { eq } from 'drizzle-orm';

/**
 * 获取用户的 Telegram Chat ID
 */
async function getUserTelegramChatId(userId: number): Promise<string | null> {
  const db = await getDb();
  if (!db) return null;
  
  const [user] = await db.select({ telegramId: users.telegramId })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  
  return user?.telegramId || null;
}

/**
 * 发送订单确认通知到用户
 */
export async function sendOrderConfirmationToUser(params: {
  userId: number;
  orderNo: string;
  pickupCode: string;
  orderType: 'tea' | 'mall';
  deliveryType: 'delivery' | 'pickup';
  totalAmount: string;
  items: Array<{
    name: string;
    quantity: number;
    unitPrice: string;
  }>;
  storeName?: string;
  address?: string;
  estimatedDeliveryTime?: string;
  language?: 'zh' | 'ru' | 'en';
}): Promise<boolean> {
  const chatId = await getUserTelegramChatId(params.userId);
  if (!chatId) {
    console.log('[UserNotification] User has no Telegram chat ID');
    return false;
  }
  
  const lang = params.language || 'ru';
  
  // 构建商品清单
  let itemsList = '';
  for (const item of params.items) {
    const totalPrice = (parseFloat(item.unitPrice) * item.quantity).toFixed(2);
    itemsList += `  • ${item.name} × ${item.quantity} = ₽${totalPrice}\n`;
  }
  
  // 构建消息
  const messages = {
    zh: `✅ <b>订单确认</b>

订单号：<code>${params.orderNo}</code>
🎫 <b>取件码：${params.pickupCode}</b>
订单类型：${params.orderType === 'tea' ? '茶饮' : '商城'}
配送方式：${params.deliveryType === 'delivery' ? '配送' : '自提'}

<b>商品清单：</b>
${itemsList}
<b>订单总额：₽${params.totalAmount}</b>

${params.storeName ? `📍 门店：${params.storeName}\n` : ''}${params.address ? `📍 配送地址：${params.address}\n` : ''}${params.estimatedDeliveryTime ? `⏰ 预计送达：${params.estimatedDeliveryTime}\n` : ''}
${params.deliveryType === 'pickup' ? '\n<b>请凭取件码到店取餐</b>' : ''}
感谢您的订单！我们会尽快为您处理。`,
    
    ru: `✅ <b>Подтверждение заказа</b>

Номер заказа: <code>${params.orderNo}</code>
🎫 <b>Код получения: ${params.pickupCode}</b>
Тип заказа: ${params.orderType === 'tea' ? 'Напитки' : 'Магазин'}
Способ доставки: ${params.deliveryType === 'delivery' ? 'Доставка' : 'Самовывоз'}

<b>Список товаров:</b>
${itemsList}
<b>Сумма заказа: ₽${params.totalAmount}</b>

${params.storeName ? `📍 Магазин: ${params.storeName}\n` : ''}${params.address ? `📍 Адрес доставки: ${params.address}\n` : ''}${params.estimatedDeliveryTime ? `⏰ Ожидаемое время: ${params.estimatedDeliveryTime}\n` : ''}
${params.deliveryType === 'pickup' ? '\n<b>Покажите код получения в магазине</b>' : ''}
Спасибо за ваш заказ! Мы обработаем его как можно скорее.`,
    
    en: `✅ <b>Order Confirmation</b>

Order #: <code>${params.orderNo}</code>
🎫 <b>Pickup Code: ${params.pickupCode}</b>
Order Type: ${params.orderType === 'tea' ? 'Beverages' : 'Mall'}
Delivery Method: ${params.deliveryType === 'delivery' ? 'Delivery' : 'Pickup'}

<b>Items:</b>
${itemsList}
<b>Total Amount: ₽${params.totalAmount}</b>

${params.storeName ? `📍 Store: ${params.storeName}\n` : ''}${params.address ? `📍 Delivery Address: ${params.address}\n` : ''}${params.estimatedDeliveryTime ? `⏰ Estimated Time: ${params.estimatedDeliveryTime}\n` : ''}
${params.deliveryType === 'pickup' ? '\n<b>Show pickup code at the store</b>' : ''}
Thank you for your order! We will process it as soon as possible.`,
  };
  
  return sendTelegramMessage(chatId, messages[lang]);
}

/**
 * 发送支付成功通知到用户
 */
export async function sendPaymentSuccessToUser(params: {
  userId: number;
  orderNo: string;
  amount: string;
  paymentMethod: string;
  transactionId: string;
  paymentTime: Date;
  language?: 'zh' | 'ru' | 'en';
}): Promise<boolean> {
  const chatId = await getUserTelegramChatId(params.userId);
  if (!chatId) {
    console.log('[UserNotification] User has no Telegram chat ID');
    return false;
  }
  
  const lang = params.language || 'ru';
  const formattedTime = params.paymentTime.toLocaleString(lang === 'zh' ? 'zh-CN' : lang === 'ru' ? 'ru-RU' : 'en-US');
  
  const messages = {
    zh: `💳 <b>支付成功</b>

订单号：<code>${params.orderNo}</code>
支付金额：₽${params.amount}
支付方式：${params.paymentMethod}
交易单号：<code>${params.transactionId}</code>
支付时间：${formattedTime}

您的订单已支付成功，我们正在为您准备商品。`,
    
    ru: `💳 <b>Оплата успешна</b>

Номер заказа: <code>${params.orderNo}</code>
Сумма платежа: ₽${params.amount}
Способ оплаты: ${params.paymentMethod}
ID транзакции: <code>${params.transactionId}</code>
Время оплаты: ${formattedTime}

Ваш заказ успешно оплачен, мы готовим ваши товары.`,
    
    en: `💳 <b>Payment Successful</b>

Order #: <code>${params.orderNo}</code>
Payment Amount: ₽${params.amount}
Payment Method: ${params.paymentMethod}
Transaction ID: <code>${params.transactionId}</code>
Payment Time: ${formattedTime}

Your order has been paid successfully, we are preparing your items.`,
  };
  
  return sendTelegramMessage(chatId, messages[lang]);
}

/**
 * 发送物流追踪通知到用户
 */
export async function sendShipmentTrackingToUser(params: {
  userId: number;
  orderNo: string;
  courierCompany: string;
  trackingNumber: string;
  trackingUrl?: string;
  estimatedDeliveryTime?: string;
  language?: 'zh' | 'ru' | 'en';
}): Promise<boolean> {
  const chatId = await getUserTelegramChatId(params.userId);
  if (!chatId) {
    console.log('[UserNotification] User has no Telegram chat ID');
    return false;
  }
  
  const lang = params.language || 'ru';
  
  const messages = {
    zh: `📦 <b>订单已发货</b>

订单号：<code>${params.orderNo}</code>
物流公司：${params.courierCompany}
运单号：<code>${params.trackingNumber}</code>
${params.trackingUrl ? `\n🔗 追踪链接：${params.trackingUrl}` : ''}${params.estimatedDeliveryTime ? `\n⏰ 预计送达：${params.estimatedDeliveryTime}` : ''}

您的订单已发货，请注意查收！`,
    
    ru: `📦 <b>Заказ отправлен</b>

Номер заказа: <code>${params.orderNo}</code>
Курьерская служба: ${params.courierCompany}
Трек-номер: <code>${params.trackingNumber}</code>
${params.trackingUrl ? `\n🔗 Ссылка для отслеживания: ${params.trackingUrl}` : ''}${params.estimatedDeliveryTime ? `\n⏰ Ожидаемое время доставки: ${params.estimatedDeliveryTime}` : ''}

Ваш заказ отправлен, пожалуйста, ожидайте получение!`,
    
    en: `📦 <b>Order Shipped</b>

Order #: <code>${params.orderNo}</code>
Courier Company: ${params.courierCompany}
Tracking Number: <code>${params.trackingNumber}</code>
${params.trackingUrl ? `\n🔗 Tracking Link: ${params.trackingUrl}` : ''}${params.estimatedDeliveryTime ? `\n⏰ Estimated Delivery: ${params.estimatedDeliveryTime}` : ''}

Your order has been shipped, please wait for delivery!`,
  };
  
  return sendTelegramMessage(chatId, messages[lang]);
}

/**
 * 发送订单状态更新通知到用户
 */
export async function sendOrderStatusUpdateToUser(params: {
  userId: number;
  orderNo: string;
  status: string;
  statusText: string;
  message?: string;
  language?: 'zh' | 'ru' | 'en';
}): Promise<boolean> {
  const chatId = await getUserTelegramChatId(params.userId);
  if (!chatId) {
    console.log('[UserNotification] User has no Telegram chat ID');
    return false;
  }
  
  const lang = params.language || 'ru';
  
  const statusEmoji = {
    pending: '⏳',
    paid: '💰',
    preparing: '👨‍🍳',
    ready: '✅',
    delivering: '🚚',
    completed: '🎉',
    cancelled: '❌',
  };
  
  const emoji = statusEmoji[params.status as keyof typeof statusEmoji] || '📢';
  
  const messages = {
    zh: `${emoji} <b>订单状态更新</b>

订单号：<code>${params.orderNo}</code>
状态：${params.statusText}
${params.message ? `\n${params.message}` : ''}`,
    
    ru: `${emoji} <b>Обновление статуса заказа</b>

Номер заказа: <code>${params.orderNo}</code>
Статус: ${params.statusText}
${params.message ? `\n${params.message}` : ''}`,
    
    en: `${emoji} <b>Order Status Update</b>

Order #: <code>${params.orderNo}</code>
Status: ${params.statusText}
${params.message ? `\n${params.message}` : ''}`,
  };
  
  return sendTelegramMessage(chatId, messages[lang]);
}
