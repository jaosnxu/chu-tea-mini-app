/**
 * YooKassa 支付集成模块
 * 文档：https://yookassa.ru/developers/api
 */

import { YooCheckout, ICreatePayment, IPaymentStatus } from '@a2seven/yoo-checkout';

// 从环境变量获取配置
const YOOKASSA_SHOP_ID = process.env.YOOKASSA_SHOP_ID || '';
const YOOKASSA_SECRET_KEY = process.env.YOOKASSA_SECRET_KEY || '';

// 初始化 YooKassa 客户端
let yookassa: YooCheckout | null = null;

function getYooKassaClient(): YooCheckout {
  if (!YOOKASSA_SHOP_ID || !YOOKASSA_SECRET_KEY) {
    throw new Error('YooKassa credentials not configured. Please set YOOKASSA_SHOP_ID and YOOKASSA_SECRET_KEY environment variables.');
  }

  if (!yookassa) {
    yookassa = new YooCheckout({
      shopId: YOOKASSA_SHOP_ID,
      secretKey: YOOKASSA_SECRET_KEY,
    });
  }

  return yookassa;
}

export interface CreatePaymentParams {
  amount: number; // 金额（卢布）
  orderId: number; // 订单 ID
  description: string; // 支付描述
  returnUrl: string; // 支付完成后返回的 URL
  metadata?: Record<string, any>; // 额外的元数据
}

export interface PaymentResult {
  paymentId: string; // YooKassa 支付 ID
  confirmationUrl: string; // 支付确认 URL（用户需要访问此 URL 完成支付）
  status: string; // 支付状态
}

/**
 * 创建支付
 */
export async function createPayment(params: CreatePaymentParams): Promise<PaymentResult> {
  const client = getYooKassaClient();

  const idempotenceKey = `order-${params.orderId}-${Date.now()}`; // 幂等性密钥

  const payment: ICreatePayment = {
    amount: {
      value: params.amount.toFixed(2),
      currency: 'RUB',
    },
    confirmation: {
      type: 'redirect',
      return_url: params.returnUrl,
    },
    capture: true, // 自动确认支付
    description: params.description,
    metadata: {
      order_id: params.orderId,
      ...params.metadata,
    },
  };

  try {
    const result = await client.createPayment(payment, idempotenceKey);

    if (!result.confirmation || result.confirmation.type !== 'redirect') {
      throw new Error('Invalid payment confirmation type');
    }

    return {
      paymentId: result.id,
      confirmationUrl: result.confirmation.confirmation_url || '',
      status: result.status,
    };
  } catch (error: any) {
    console.error('[YooKassa] Create payment error:', error);
    throw new Error(`Failed to create payment: ${error.message}`);
  }
}

/**
 * 获取支付状态
 */
export async function getPaymentStatus(paymentId: string): Promise<{
  status: IPaymentStatus;
  paid: boolean;
  amount: number;
  metadata?: Record<string, any>;
}> {
  const client = getYooKassaClient();

  try {
    const payment = await client.getPayment(paymentId);

    return {
      status: payment.status,
      paid: payment.paid,
      amount: parseFloat(payment.amount.value),
      metadata: payment.metadata,
    };
  } catch (error: any) {
    console.error('[YooKassa] Get payment status error:', error);
    throw new Error(`Failed to get payment status: ${error.message}`);
  }
}

/**
 * 创建退款
 */
export async function createRefund(params: {
  paymentId: string;
  amount: number;
  reason?: string;
}): Promise<{
  id: string;
  status: string;
  amount: number;
}> {
  const client = getYooKassaClient();

  try {
    const idempotenceKey = `refund-${params.paymentId}-${Date.now()}`;
    
    const refund = await client.createRefund(
      {
        payment_id: params.paymentId,
        amount: {
          value: params.amount.toFixed(2),
          currency: 'RUB',
        },
        description: params.reason || 'Refund',
      },
      idempotenceKey
    );

    return {
      id: refund.id,
      status: refund.status,
      amount: parseFloat(refund.amount.value),
    };
  } catch (error: any) {
    console.error('[YooKassa] Create refund error:', error);
    throw new Error(`Failed to create refund: ${error.message}`);
  }
}

/**
 * 取消支付
 */
export async function cancelPayment(paymentId: string, reason?: string): Promise<boolean> {
  const client = getYooKassaClient();

  try {
    const idempotenceKey = `cancel-${paymentId}-${Date.now()}`;
    await client.cancelPayment(paymentId, idempotenceKey);
    return true;
  } catch (error: any) {
    console.error('[YooKassa] Cancel payment error:', error);
    return false;
  }
}

/**
 * 验证 webhook 签名
 * 用于验证来自 YooKassa 的 webhook 通知的真实性
 */
export function verifyWebhookSignature(
  body: string,
  signature: string
): boolean {
  // YooKassa 使用 HMAC-SHA256 签名
  // 实际实现需要根据 YooKassa 文档进行
  // 这里提供基本框架
  
  // TODO: 实现签名验证逻辑
  return true;
}

/**
 * 处理 webhook 通知
 */
export interface WebhookPayload {
  type: string;
  event: string;
  object: {
    id: string;
    status: IPaymentStatus;
    paid: boolean;
    amount: {
      value: string;
      currency: string;
    };
    metadata?: Record<string, any>;
  };
}

export async function handleWebhook(payload: WebhookPayload): Promise<{
  orderId: number | null;
  status: IPaymentStatus;
  paid: boolean;
}> {
  const { object } = payload;

  return {
    orderId: object.metadata?.order_id ? parseInt(object.metadata.order_id) : null,
    status: object.status,
    paid: object.paid,
  };
}

/**
 * 检查 YooKassa 是否已配置
 */
export function isYooKassaConfigured(): boolean {
  return Boolean(YOOKASSA_SHOP_ID && YOOKASSA_SECRET_KEY);
}
