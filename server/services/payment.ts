/**
 * Russian Payment Gateway Integration Service
 * 
 * Supports:
 * - ЮKassa (YooKassa) - Most popular payment gateway in Russia
 * - QIWI - Popular e-wallet and payment system
 * - СберPay (SberPay) - Sberbank's payment system
 * 
 * All gateways support 54-ФЗ electronic receipt generation
 */

import axios, { AxiosInstance } from 'axios';
import crypto from 'crypto';

// Common types
interface PaymentResult {
  success: boolean;
  paymentId?: string;
  confirmationUrl?: string;
  error?: string;
}

interface RefundResult {
  success: boolean;
  refundId?: string;
  error?: string;
}

// 54-ФЗ Receipt types
interface ReceiptItem {
  description: string;
  quantity: number;
  amount: {
    value: string;
    currency: string;
  };
  vatCode: 1 | 2 | 3 | 4 | 5 | 6; // 1=20%, 2=10%, 3=20/120, 4=10/110, 5=0%, 6=no VAT
  paymentSubject: 'commodity' | 'excise' | 'job' | 'service' | 'gambling_bet' | 'gambling_prize' | 'lottery' | 'lottery_prize' | 'intellectual_activity' | 'payment' | 'agent_commission' | 'composite' | 'another';
  paymentMode: 'full_prepayment' | 'prepayment' | 'advance' | 'full_payment' | 'partial_payment' | 'credit' | 'credit_payment';
}

interface Receipt {
  customer: {
    email?: string;
    phone?: string;
  };
  items: ReceiptItem[];
  taxSystemCode?: 1 | 2 | 3 | 4 | 5 | 6; // 1=OSN, 2=USN income, 3=USN income-expense, 4=ENVD, 5=ESN, 6=Patent
}

// ============================================
// YooKassa (ЮKassa) Integration
// ============================================

interface YooKassaConfig {
  shopId: string;
  secretKey: string;
  returnUrl: string;
}

interface YooKassaPaymentRequest {
  amount: {
    value: string;
    currency: string;
  };
  capture?: boolean;
  confirmation: {
    type: 'redirect' | 'embedded' | 'external' | 'qr' | 'mobile_application';
    return_url?: string;
    confirmation_url?: string;
    locale?: string;
  };
  description?: string;
  metadata?: Record<string, string>;
  receipt?: {
    customer: {
      email?: string;
      phone?: string;
    };
    items: Array<{
      description: string;
      quantity: string;
      amount: {
        value: string;
        currency: string;
      };
      vat_code: number;
      payment_subject?: string;
      payment_mode?: string;
    }>;
    tax_system_code?: number;
  };
  payment_method_data?: {
    type: 'bank_card' | 'yoo_money' | 'qiwi' | 'sberbank' | 'alfabank' | 'tinkoff_bank' | 'mobile_balance' | 'cash' | 'installments' | 'sbp';
  };
  save_payment_method?: boolean;
  payment_method_id?: string;
}

interface YooKassaPaymentResponse {
  id: string;
  status: 'pending' | 'waiting_for_capture' | 'succeeded' | 'canceled';
  paid: boolean;
  amount: {
    value: string;
    currency: string;
  };
  confirmation?: {
    type: string;
    confirmation_url?: string;
    return_url?: string;
  };
  created_at: string;
  description?: string;
  metadata?: Record<string, string>;
  payment_method?: {
    type: string;
    id: string;
    saved: boolean;
    card?: {
      first6: string;
      last4: string;
      expiry_month: string;
      expiry_year: string;
      card_type: string;
    };
  };
  receipt_registration?: 'pending' | 'succeeded' | 'canceled';
  refundable: boolean;
  refunded_amount?: {
    value: string;
    currency: string;
  };
}

export class YooKassaService {
  private client: AxiosInstance;
  private config: YooKassaConfig;

  constructor(config: YooKassaConfig) {
    this.config = config;
    this.client = axios.create({
      baseURL: 'https://api.yookassa.ru/v3',
      auth: {
        username: config.shopId,
        password: config.secretKey,
      },
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Create a payment
   */
  async createPayment(
    amount: number,
    currency: string = 'RUB',
    description: string,
    orderId: string,
    receipt?: Receipt,
    paymentMethod?: string
  ): Promise<PaymentResult> {
    try {
      const idempotenceKey = crypto.randomUUID();

      const request: YooKassaPaymentRequest = {
        amount: {
          value: amount.toFixed(2),
          currency,
        },
        capture: true,
        confirmation: {
          type: 'redirect',
          return_url: this.config.returnUrl,
        },
        description,
        metadata: {
          order_id: orderId,
        },
      };

      // Add receipt for 54-ФЗ compliance
      if (receipt) {
        request.receipt = {
          customer: receipt.customer,
          items: receipt.items.map((item) => ({
            description: item.description,
            quantity: item.quantity.toString(),
            amount: item.amount,
            vat_code: item.vatCode,
            payment_subject: item.paymentSubject,
            payment_mode: item.paymentMode,
          })),
          tax_system_code: receipt.taxSystemCode,
        };
      }

      // Add payment method if specified
      if (paymentMethod) {
        request.payment_method_data = {
          type: paymentMethod as any,
        };
      }

      const response = await this.client.post<YooKassaPaymentResponse>('/payments', request, {
        headers: {
          'Idempotence-Key': idempotenceKey,
        },
      });

      return {
        success: true,
        paymentId: response.data.id,
        confirmationUrl: response.data.confirmation?.confirmation_url,
      };
    } catch (error: any) {
      console.error('[YooKassa] Payment creation failed:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.description || error.message,
      };
    }
  }

  /**
   * Get payment status
   */
  async getPayment(paymentId: string): Promise<YooKassaPaymentResponse | null> {
    try {
      const response = await this.client.get<YooKassaPaymentResponse>(`/payments/${paymentId}`);
      return response.data;
    } catch (error) {
      console.error('[YooKassa] Get payment failed:', error);
      return null;
    }
  }

  /**
   * Create a refund
   */
  async createRefund(
    paymentId: string,
    amount: number,
    currency: string = 'RUB',
    receipt?: Receipt
  ): Promise<RefundResult> {
    try {
      const idempotenceKey = crypto.randomUUID();

      const request: any = {
        payment_id: paymentId,
        amount: {
          value: amount.toFixed(2),
          currency,
        },
      };

      // Add receipt for 54-ФЗ compliance (refund receipt)
      if (receipt) {
        request.receipt = {
          customer: receipt.customer,
          items: receipt.items.map((item) => ({
            description: item.description,
            quantity: item.quantity.toString(),
            amount: item.amount,
            vat_code: item.vatCode,
            payment_subject: item.paymentSubject,
            payment_mode: item.paymentMode,
          })),
          tax_system_code: receipt.taxSystemCode,
        };
      }

      const response = await this.client.post('/refunds', request, {
        headers: {
          'Idempotence-Key': idempotenceKey,
        },
      });

      return {
        success: true,
        refundId: response.data.id,
      };
    } catch (error: any) {
      console.error('[YooKassa] Refund creation failed:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.description || error.message,
      };
    }
  }

  /**
   * Verify webhook signature
   */
  verifyWebhook(body: string, signature: string): boolean {
    const hmac = crypto.createHmac('sha256', this.config.secretKey);
    hmac.update(body);
    const expectedSignature = hmac.digest('hex');
    return signature === expectedSignature;
  }
}

// ============================================
// QIWI Integration
// ============================================

interface QiwiConfig {
  secretKey: string;
  siteId: string;
  returnUrl: string;
}

export class QiwiService {
  private client: AxiosInstance;
  private config: QiwiConfig;

  constructor(config: QiwiConfig) {
    this.config = config;
    this.client = axios.create({
      baseURL: 'https://api.qiwi.com/partner/bill/v1/bills',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.secretKey}`,
      },
    });
  }

  /**
   * Create a bill (payment request)
   */
  async createBill(
    amount: number,
    currency: string = 'RUB',
    orderId: string,
    comment?: string,
    expirationDateTime?: string
  ): Promise<PaymentResult> {
    try {
      const billId = crypto.randomUUID();

      const response = await this.client.put(`/${billId}`, {
        amount: {
          value: amount.toFixed(2),
          currency,
        },
        comment: comment || `Order ${orderId}`,
        expirationDateTime: expirationDateTime || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        customer: {},
        customFields: {
          orderId,
        },
      });

      return {
        success: true,
        paymentId: billId,
        confirmationUrl: response.data.payUrl,
      };
    } catch (error: any) {
      console.error('[QIWI] Bill creation failed:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.description || error.message,
      };
    }
  }

  /**
   * Get bill status
   */
  async getBill(billId: string): Promise<any> {
    try {
      const response = await this.client.get(`/${billId}`);
      return response.data;
    } catch (error) {
      console.error('[QIWI] Get bill failed:', error);
      return null;
    }
  }

  /**
   * Cancel bill
   */
  async cancelBill(billId: string): Promise<boolean> {
    try {
      await this.client.post(`/${billId}/reject`);
      return true;
    } catch (error) {
      console.error('[QIWI] Cancel bill failed:', error);
      return false;
    }
  }

  /**
   * Verify webhook signature
   */
  verifyWebhook(body: string, signature: string): boolean {
    const hmac = crypto.createHmac('sha256', this.config.secretKey);
    hmac.update(body);
    const expectedSignature = hmac.digest('base64');
    return signature === expectedSignature;
  }
}

// ============================================
// SberPay Integration
// ============================================

interface SberPayConfig {
  userName: string;
  password: string;
  returnUrl: string;
  failUrl: string;
  isTest?: boolean;
}

export class SberPayService {
  private client: AxiosInstance;
  private config: SberPayConfig;

  constructor(config: SberPayConfig) {
    this.config = config;
    const baseURL = config.isTest
      ? 'https://3dsec.sberbank.ru/payment/rest'
      : 'https://securepayments.sberbank.ru/payment/rest';

    this.client = axios.create({
      baseURL,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
  }

  /**
   * Register order and get payment URL
   */
  async registerOrder(
    amount: number,
    orderId: string,
    description?: string,
    receipt?: Receipt
  ): Promise<PaymentResult> {
    try {
      const params = new URLSearchParams({
        userName: this.config.userName,
        password: this.config.password,
        orderNumber: orderId,
        amount: Math.round(amount * 100).toString(), // Amount in kopecks
        returnUrl: this.config.returnUrl,
        failUrl: this.config.failUrl,
      });

      if (description) {
        params.append('description', description);
      }

      // Add receipt for 54-ФЗ compliance
      if (receipt) {
        const orderBundle = {
          customerDetails: {
            email: receipt.customer.email,
            phone: receipt.customer.phone,
          },
          cartItems: {
            items: receipt.items.map((item, index) => ({
              positionId: index + 1,
              name: item.description,
              quantity: {
                value: item.quantity,
                measure: 'шт',
              },
              itemAmount: Math.round(parseFloat(item.amount.value) * 100),
              itemCode: `item_${index + 1}`,
              tax: {
                taxType: item.vatCode,
              },
              itemPrice: Math.round(parseFloat(item.amount.value) * 100 / item.quantity),
            })),
          },
        };
        params.append('orderBundle', JSON.stringify(orderBundle));
      }

      const response = await this.client.post('/register.do', params);

      if (response.data.errorCode) {
        return {
          success: false,
          error: response.data.errorMessage,
        };
      }

      return {
        success: true,
        paymentId: response.data.orderId,
        confirmationUrl: response.data.formUrl,
      };
    } catch (error: any) {
      console.error('[SberPay] Order registration failed:', error.response?.data || error.message);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Get order status
   */
  async getOrderStatus(orderId: string): Promise<any> {
    try {
      const params = new URLSearchParams({
        userName: this.config.userName,
        password: this.config.password,
        orderId,
      });

      const response = await this.client.post('/getOrderStatusExtended.do', params);
      return response.data;
    } catch (error) {
      console.error('[SberPay] Get order status failed:', error);
      return null;
    }
  }

  /**
   * Refund payment
   */
  async refund(orderId: string, amount: number): Promise<RefundResult> {
    try {
      const params = new URLSearchParams({
        userName: this.config.userName,
        password: this.config.password,
        orderId,
        amount: Math.round(amount * 100).toString(),
      });

      const response = await this.client.post('/refund.do', params);

      if (response.data.errorCode && response.data.errorCode !== '0') {
        return {
          success: false,
          error: response.data.errorMessage,
        };
      }

      return {
        success: true,
        refundId: orderId,
      };
    } catch (error: any) {
      console.error('[SberPay] Refund failed:', error.response?.data || error.message);
      return {
        success: false,
        error: error.message,
      };
    }
  }
}

// ============================================
// Payment Service Factory
// ============================================

export type PaymentProvider = 'yookassa' | 'qiwi' | 'sberpay';

let yooKassaService: YooKassaService | null = null;
let qiwiService: QiwiService | null = null;
let sberPayService: SberPayService | null = null;

export function getPaymentService(provider: PaymentProvider): YooKassaService | QiwiService | SberPayService | null {
  switch (provider) {
    case 'yookassa':
      if (!yooKassaService && process.env.YOOKASSA_SHOP_ID && process.env.YOOKASSA_SECRET_KEY) {
        yooKassaService = new YooKassaService({
          shopId: process.env.YOOKASSA_SHOP_ID,
          secretKey: process.env.YOOKASSA_SECRET_KEY,
          returnUrl: process.env.PAYMENT_RETURN_URL || '',
        });
      }
      return yooKassaService;

    case 'qiwi':
      if (!qiwiService && process.env.QIWI_SECRET_KEY && process.env.QIWI_SITE_ID) {
        qiwiService = new QiwiService({
          secretKey: process.env.QIWI_SECRET_KEY,
          siteId: process.env.QIWI_SITE_ID,
          returnUrl: process.env.PAYMENT_RETURN_URL || '',
        });
      }
      return qiwiService;

    case 'sberpay':
      if (!sberPayService && process.env.SBERPAY_USERNAME && process.env.SBERPAY_PASSWORD) {
        sberPayService = new SberPayService({
          userName: process.env.SBERPAY_USERNAME,
          password: process.env.SBERPAY_PASSWORD,
          returnUrl: process.env.PAYMENT_RETURN_URL || '',
          failUrl: process.env.PAYMENT_FAIL_URL || '',
          isTest: process.env.SBERPAY_TEST_MODE === 'true',
        });
      }
      return sberPayService;

    default:
      return null;
  }
}

/**
 * Create payment with automatic provider selection
 */
export async function createPayment(
  provider: PaymentProvider,
  amount: number,
  orderId: string,
  description: string,
  receipt?: Receipt
): Promise<PaymentResult> {
  const service = getPaymentService(provider);

  if (!service) {
    return {
      success: false,
      error: `Payment provider ${provider} not configured`,
    };
  }

  if (service instanceof YooKassaService) {
    return service.createPayment(amount, 'RUB', description, orderId, receipt);
  } else if (service instanceof QiwiService) {
    return service.createBill(amount, 'RUB', orderId, description);
  } else if (service instanceof SberPayService) {
    return service.registerOrder(amount, orderId, description, receipt);
  }

  return {
    success: false,
    error: 'Unknown payment provider',
  };
}

/**
 * Generate 54-ФЗ compliant receipt
 */
export function generateReceipt(
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    vatRate?: number;
  }>,
  customerEmail?: string,
  customerPhone?: string,
  taxSystem: 1 | 2 | 3 | 4 | 5 | 6 = 2 // Default: USN income
): Receipt {
  return {
    customer: {
      email: customerEmail,
      phone: customerPhone,
    },
    items: items.map((item) => ({
      description: item.name.substring(0, 128), // Max 128 chars
      quantity: item.quantity,
      amount: {
        value: (item.price * item.quantity).toFixed(2),
        currency: 'RUB',
      },
      vatCode: (item.vatRate === 20 ? 1 : item.vatRate === 10 ? 2 : 6) as 1 | 2 | 3 | 4 | 5 | 6,
      paymentSubject: 'commodity',
      paymentMode: 'full_payment',
    })),
    taxSystemCode: taxSystem,
  };
}
