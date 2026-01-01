/**
 * 订单评价相关的 tRPC router
 */

import { z } from 'zod';
import { protectedProcedure, publicProcedure, adminProcedure, router } from '../_core/trpc';
import * as db from '../db';

export const reviewRouter = router({
  /**
   * 创建订单评价
   */
  create: protectedProcedure
    .input(
      z.object({
        orderId: z.number(),
        storeId: z.number(),
        overallRating: z.number().min(1).max(5),
        tasteRating: z.number().min(1).max(5).optional(),
        serviceRating: z.number().min(1).max(5).optional(),
        speedRating: z.number().min(1).max(5).optional(),
        packagingRating: z.number().min(1).max(5).optional(),
        content: z.string().optional(),
        images: z.array(z.string()).optional(),
        tags: z.array(z.string()).optional(),
        isAnonymous: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // 验证订单是否属于当前用户
      const order = await db.getOrderById(ctx.user.id, input.orderId);
      if (!order || order.userId !== ctx.user.id) {
        throw new Error('Order not found or unauthorized');
      }

      // 检查订单状态（只有已完成的订单才能评价）
      if (order.status !== 'completed') {
        throw new Error('Only completed orders can be reviewed');
      }

      // 检查是否已经评价过
      const existingReview = await db.getOrderReview(input.orderId);
      if (existingReview) {
        throw new Error('Order already reviewed');
      }

      return await db.createOrderReview({
        ...input,
        userId: ctx.user.id,
      });
    }),

  /**
   * 获取订单的评价
   */
  getByOrderId: protectedProcedure
    .input(z.object({ orderId: z.number() }))
    .query(async ({ input }) => {
      return await db.getOrderReview(input.orderId);
    }),

  /**
   * 获取商品的评价列表
   */
  getByProductId: publicProcedure
    .input(
      z.object({
        productId: z.number(),
        limit: z.number().optional(),
        offset: z.number().optional(),
        minRating: z.number().min(1).max(5).optional(),
      })
    )
    .query(async ({ input }) => {
      return await db.getProductReviews(input.productId, {
        limit: input.limit,
        offset: input.offset,
        minRating: input.minRating,
      });
    }),

  /**
   * 获取门店的评价列表
   */
  getByStoreId: publicProcedure
    .input(
      z.object({
        storeId: z.number(),
        limit: z.number().optional(),
        offset: z.number().optional(),
        minRating: z.number().min(1).max(5).optional(),
      })
    )
    .query(async ({ input }) => {
      return await db.getStoreReviews(input.storeId, {
        limit: input.limit,
        offset: input.offset,
        minRating: input.minRating,
      });
    }),

  /**
   * 获取用户的评价列表
   */
  getMyReviews: protectedProcedure
    .input(
      z.object({
        limit: z.number().optional(),
        offset: z.number().optional(),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      return await db.getUserReviews(ctx.user.id, {
        limit: input?.limit,
        offset: input?.offset,
      });
    }),

  /**
   * 商家回复评价（仅管理员）
   */
  reply: adminProcedure
    .input(
      z.object({
        reviewId: z.number(),
        reply: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return await db.replyToReview(input.reviewId, input.reply, ctx.user.id);
    }),

  /**
   * 点赞/点踩评价
   */
  like: protectedProcedure
    .input(
      z.object({
        reviewId: z.number(),
        type: z.enum(['like', 'dislike']),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return await db.likeReview(input.reviewId, ctx.user.id, input.type);
    }),

  /**
   * 取消点赞/点踩
   */
  unlike: protectedProcedure
    .input(z.object({ reviewId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      return await db.unlikeReview(input.reviewId, ctx.user.id);
    }),

  /**
   * 获取评价统计
   */
  getStatistics: publicProcedure
    .input(
      z.object({
        storeId: z.number().optional(),
        productId: z.number().optional(),
      })
    )
    .query(async ({ input }) => {
      return await db.getReviewStatistics(input.storeId, input.productId);
    }),

  /**
   * 获取商品评价统计
   */
  getProductStats: publicProcedure
    .input(z.object({ productId: z.number() }))
    .query(async ({ input }) => {
      return await db.getProductReviewStats(input.productId);
    }),

  /**
   * 获取商品评价列表（分页）
   */
  getProductReviews: publicProcedure
    .input(
      z.object({
        productId: z.number(),
        minRating: z.number().min(1).max(5).optional(),
        withImages: z.boolean().optional(),
        sortBy: z.enum(['latest', 'helpful', 'highest']).optional(),
        limit: z.number().min(1).max(50).default(10),
        cursor: z.number().optional(),
      })
    )
    .query(async ({ input }) => {
      const { productId, minRating, withImages, sortBy = 'latest', limit, cursor } = input;
      
      const reviews = await db.getProductReviews(productId, {
        minRating,
        withImages,
        sortBy,
        limit: limit + 1,
        offset: cursor || 0,
      });

      let nextCursor: number | undefined = undefined;
      if (reviews.length > limit) {
        reviews.pop();
        nextCursor = (cursor || 0) + limit;
      }

      return {
        reviews,
        nextCursor,
      };
    }),
});
