/**
 * 支付相关的 tRPC router
 */

import { z } from 'zod';
import { protectedProcedure, publicProcedure, router } from '../_core/trpc';
import { createPayment, getPaymentStatus, isYooKassaConfigured } from '../payment/yookassa';
import { getDb } from '../db';
import { orders } from '../../drizzle/schema';
import { eq } from 'drizzle-orm';

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
});
