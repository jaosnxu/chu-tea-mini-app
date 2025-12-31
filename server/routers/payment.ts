/**
 * 支付相关的 tRPC router
 */

import { z } from 'zod';
import { protectedProcedure, publicProcedure, adminProcedure, router } from '../_core/trpc';
import { createPayment, getPaymentStatus, isYooKassaConfigured, createRefund as createYooKassaRefund } from '../payment/yookassa';
import { getDb } from '../db';
import { orders } from '../../drizzle/schema';
import { eq } from 'drizzle-orm';
import * as db from '../db';

export const paymentRouter = router({
  /**
   * 检查支付网关是否已配置
   */
  isConfigured: publicProcedure.query(() => {
    return {
      yookassa: isYooKassaConfigured(),
    };
  }),

  /**
   * 创建支付
   */
  createPayment: protectedProcedure
    .input(
      z.object({
        orderId: z.number(),
        returnUrl: z.string().url(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      // 获取订单信息
      const [order] = await db
        .select()
        .from(orders)
        .where(eq(orders.id, input.orderId))
        .limit(1);

      if (!order) {
        throw new Error('Order not found');
      }

      // 验证订单属于当前用户
      if (order.userId !== ctx.user.id) {
        throw new Error('Unauthorized');
      }

      // 验证订单状态
      if (order.status !== 'pending') {
        throw new Error('Order is not pending');
      }

      // 创建支付
      const payment = await createPayment({
        amount: parseFloat(order.totalAmount),
        orderId: order.id,
        description: `CHU TEA 订单 #${order.id}`,
        returnUrl: input.returnUrl,
        metadata: {
          user_id: ctx.user.id,
          order_id: order.id,
        },
      });

      // 更新订单的支付 ID
      await db
        .update(orders)
        .set({
          paymentId: payment.paymentId,
          paymentMethod: 'yookassa',
        })
        .where(eq(orders.id, order.id));

      return {
        paymentId: payment.paymentId,
        confirmationUrl: payment.confirmationUrl,
      };
    }),

  /**
   * 检查支付状态
   */
  checkPaymentStatus: protectedProcedure
    .input(
      z.object({
        orderId: z.number(),
      })
    )
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      // 获取订单信息
      const [order] = await db
        .select()
        .from(orders)
        .where(eq(orders.id, input.orderId))
        .limit(1);

      if (!order) {
        throw new Error('Order not found');
      }

      // 验证订单属于当前用户
      if (order.userId !== ctx.user.id) {
        throw new Error('Unauthorized');
      }

      // 如果没有支付 ID，返回未支付状态
      if (!order.paymentId) {
        return {
          paid: false,
          status: 'pending',
        };
      }

      // 查询支付状态
      const paymentStatus = await getPaymentStatus(order.paymentId);

      // 如果支付成功，更新订单状态
      if (paymentStatus.paid && order.status === 'pending') {
        await db
          .update(orders)
          .set({
            status: 'paid',
            paidAmount: paymentStatus.amount.toFixed(2),
            paidAt: new Date(),
          })
          .where(eq(orders.id, order.id));
      }

      return {
        paid: paymentStatus.paid,
        status: paymentStatus.status,
      };
    }),

  /**
   * 根据订单ID获取支付记录
   */
  getByOrderId: protectedProcedure
    .input(z.object({ orderId: z.number() }))
    .query(async ({ input, ctx }) => {
      const payment = await db.getPaymentByOrderId(input.orderId);
      
      // 验证权限：用户只能查看自己的订单支付
      if (payment) {
        const database = await getDb();
        if (!database) throw new Error('Database not available');
        
        const [order] = await database
          .select()
          .from(orders)
          .where(eq(orders.id, payment.orderId))
          .limit(1);
        
        if (order && order.userId !== ctx.user.id && ctx.user.role !== 'admin') {
          throw new Error('Unauthorized');
        }
      }
      
      return payment;
    }),

  /**
   * 创建退款（仅管理员）
   */
  createRefund: adminProcedure
    .input(
      z.object({
        paymentId: z.number(),
        amount: z.number(),
        reason: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      // 获取支付记录
      const payment = await db.getPaymentById(input.paymentId);
      if (!payment) {
        throw new Error('Payment not found');
      }

      // 检查支付网关 ID
      if (!payment.gatewayPaymentId) {
        throw new Error('Payment gateway ID not found');
      }

      // 调用 YooKassa 退款 API
      const refund = await createYooKassaRefund({
        paymentId: payment.gatewayPaymentId,
        amount: input.amount,
        reason: input.reason,
      });

      // 保存退款记录
      await db.createRefund({
        paymentId: input.paymentId,
        refundNo: refund.id,
        gatewayRefundId: refund.id,
        amount: input.amount.toFixed(2),
        currency: 'RUB',
        reason: input.reason,
        status: refund.status === 'succeeded' ? 'succeeded' : 'pending',
      });

      // 如果退款成功，更新支付状态
      if (refund.status === 'succeeded') {
        await db.updatePaymentStatus(input.paymentId, 'refunded');
      }

      return { success: true, refund };
    }),

  /**
   * 获取支付列表（仅管理员）
   */
  list: adminProcedure
    .input(
      z.object({
        status: z.string().optional(),
        search: z.string().optional(),
      }).optional()
    )
    .query(async ({ input }) => {
      return await db.getAllPayments(input?.status, input?.search);
    }),

  /**
   * 获取退款记录
   */
  getRefundsByPaymentId: adminProcedure
    .input(z.object({ paymentId: z.number() }))
    .query(async ({ input }) => {
      return await db.getRefundsByPaymentId(input.paymentId);
    }),

  /**
   * 获取支付统计数据
   */
  getStatistics: adminProcedure
    .input(z.object({ period: z.enum(['today', 'week', 'month']) }))
    .query(async ({ input }) => {
      return await db.getPaymentStatistics(input.period);
    }),
});
