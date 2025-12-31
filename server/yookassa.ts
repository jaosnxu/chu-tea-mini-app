import { YooCheckout, ICreatePayment } from '@a2seven/yoo-checkout';
import { getDb } from './db';
import { yookassaConfig, payments } from '../drizzle/schema';
import { eq } from 'drizzle-orm';

/**
 * 获取活跃的 YooKassa 配置
 */
export async function getActiveYooKassaConfig() {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  const configs = await db
    .select()
    .from(yookassaConfig)
    .where(eq(yookassaConfig.isActive, true))
    .limit(1);
  
  return configs[0] || null;
}

/**
 * 创建 YooKassa 客户端实例
 */
export async function createYooKassaClient() {
  const config = await getActiveYooKassaConfig();
  if (!config) {
    throw new Error('YooKassa configuration not found');
  }

  return new YooCheckout({
    shopId: config.shopId,
    secretKey: config.secretKey,
  });
}

/**
 * 创建支付
 */
export async function createPayment(params: {
  orderId: number;
  amount: string;
  currency?: string;
  description: string;
  returnUrl: string;
  metadata?: Record<string, any>;
}) {
  const client = await createYooKassaClient();
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  // 生成幂等性密钥
  const idempotenceKey = `order-${params.orderId}-${Date.now()}`;

  // 创建支付请求
  const createPaymentPayload: ICreatePayment = {
    amount: {
      value: params.amount,
      currency: (params.currency || 'RUB') as 'RUB',
    },
    capture: true, // 自动确认支付
    confirmation: {
      type: 'redirect',
      return_url: params.returnUrl,
    },
    description: params.description,
    metadata: params.metadata,
  };

  try {
    const payment = await client.createPayment(createPaymentPayload, idempotenceKey);

    // 保存支付记录到数据库
    const result = await db.insert(payments).values({
      orderId: params.orderId,
      paymentNo: `PAY${Date.now()}${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      gateway: 'yookassa',
      gatewayPaymentId: payment.id,
      amount: params.amount,
      currency: params.currency || 'RUB',
      status: 'pending',
      receiptUrl: payment.confirmation?.confirmation_url || null,
      receiptData: payment as any,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return {
      paymentId: payment.id,
      confirmationUrl: payment.confirmation?.confirmation_url,
      status: payment.status,
    };
  } catch (error: any) {
    console.error('[YooKassa] Payment creation failed:', error);
    throw new Error(`Failed to create payment: ${error.message}`);
  }
}

/**
 * 查询支付状态
 */
export async function getPaymentStatus(paymentId: string) {
  const client = await createYooKassaClient();

  try {
    const payment = await client.getPayment(paymentId);
    return {
      id: payment.id,
      status: payment.status,
      paid: payment.paid,
      amount: payment.amount,
      paymentMethod: payment.payment_method?.type,
      createdAt: payment.created_at,
    };
  } catch (error: any) {
    console.error('[YooKassa] Failed to get payment status:', error);
    throw new Error(`Failed to get payment status: ${error.message}`);
  }
}

/**
 * 处理 Webhook 通知
 */
export async function handleWebhookNotification(notification: any) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  const paymentData = notification.object;

  if (!paymentData || !paymentData.id) {
    throw new Error('Invalid webhook notification');
  }

  // 查找支付记录
  const paymentRecords = await db
    .select()
    .from(payments)
    .where(eq(payments.gatewayPaymentId, paymentData.id))
    .limit(1);

  if (paymentRecords.length === 0) {
    console.warn(`[YooKassa] Payment record not found for ID: ${paymentData.id}`);
    return;
  }

  const paymentRecord = paymentRecords[0];

  // 更新支付状态
  let newStatus: 'pending' | 'processing' | 'succeeded' | 'failed' | 'refunded' = 'pending';
  if (paymentData.status === 'succeeded') {
    newStatus = 'succeeded';
  } else if (paymentData.status === 'canceled') {
    newStatus = 'failed';
  } else if (paymentData.status === 'waiting_for_capture') {
    newStatus = 'processing';
  }

  await db
    .update(payments)
    .set({
      status: newStatus,
      receiptData: paymentData,
      paidAt: paymentData.status === 'succeeded' ? new Date() : null,
      updatedAt: new Date(),
    })
    .where(eq(payments.id, paymentRecord.id));

  // 如果支付成功，更新订单状态
  if (newStatus === 'succeeded') {
    const { updateOrderStatus } = await import('./db');
    await updateOrderStatus({ orderId: paymentRecord.orderId, status: 'paid' }, 0); // operatorId=0 for system operation
  }

  // 如果支付失败，发送通知给管理员
  if (newStatus === 'failed') {
    try {
      const { notifyOwner } = await import('./_core/notification');
      await notifyOwner({
        title: '支付失败通知',
        content: `订单 #${paymentRecord.orderId} 的支付失败。\n支付编号: ${paymentRecord.paymentNo}\n金额: ₽${paymentRecord.amount}\n错误原因: ${paymentData.cancellation_details?.reason || '未知'}`,
      });
    } catch (error) {
      console.error('[YooKassa] Failed to send payment failure notification:', error);
    }
  }

  return {
    paymentId: paymentData.id,
    status: newStatus,
    orderId: paymentRecord.orderId,
  };
}

/**
 * 创建退款
 */
export async function createRefund(params: {
  paymentId: string;
  amount: string;
  currency?: string;
  description?: string;
}) {
  const client = await createYooKassaClient();
  const dbModule = await import('./db');
  const db = await dbModule.getDb();
  if (!db) throw new Error('Database not available');

  try {
    // 查找支付记录
    const paymentRecords = await db
      .select()
      .from(payments)
      .where(eq(payments.gatewayPaymentId, params.paymentId))
      .limit(1);

    if (paymentRecords.length === 0) {
      throw new Error('Payment not found');
    }

    const paymentRecord = paymentRecords[0];

    // 创建退款
    const refund = await client.createRefund({
      payment_id: params.paymentId,
      amount: {
        value: params.amount,
        currency: params.currency || 'RUB',
      },
      description: params.description,
    });

    // 创建退款记录
    await dbModule.createRefund({
      paymentId: paymentRecord.id,
      refundNo: `REF-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      gatewayRefundId: refund.id,
      amount: refund.amount.value,
      currency: refund.amount.currency,
      reason: params.description,
      status: refund.status === 'succeeded' ? 'succeeded' : 'pending',
    });

    // 更新支付记录状态
    await db
      .update(payments)
      .set({
        status: 'refunded',
        updatedAt: new Date(),
      })
      .where(eq(payments.gatewayPaymentId, params.paymentId));

    return {
      success: true,
      refundId: refund.id,
      status: refund.status,
      amount: refund.amount.value,
      currency: refund.amount.currency,
    };
  } catch (error: any) {
    console.error('[YooKassa Refund Error]', error);
    throw new Error(`Failed to create refund: ${error.message}`);
  }
}

/**
 * 查询退款状态
 */
export async function getRefundStatus(refundId: string) {
  const client = await createYooKassaClient();

  try {
    const refund = await client.getRefund(refundId);
    return {
      id: refund.id,
      status: refund.status,
      amount: refund.amount.value,
      currency: refund.amount.currency,
      paymentId: refund.payment_id,
      createdAt: refund.created_at,
    };
  } catch (error: any) {
    console.error('[YooKassa Get Refund Error]', error);
    throw new Error(`Failed to get refund status: ${error.message}`);
  }
}
