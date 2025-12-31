/**
 * 数据分析相关的 tRPC router
 */

import { z } from 'zod';
import { adminProcedure, router } from '../_core/trpc';
import * as analytics from '../db/analytics';

export const analyticsRouter = router({
  /**
   * 获取销售统计
   */
  getSalesStats: adminProcedure
    .input(
      z.object({
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      const startDate = input.startDate ? new Date(input.startDate) : undefined;
      const endDate = input.endDate ? new Date(input.endDate) : undefined;
      return await analytics.getSalesStats(startDate, endDate);
    }),

  /**
   * 获取销售趋势
   */
  getSalesTrend: adminProcedure
    .input(
      z.object({
        days: z.number().min(1).max(365).default(30),
      })
    )
    .query(async ({ input }) => {
      return await analytics.getSalesTrend(input.days);
    }),

  /**
   * 获取用户统计
   */
  getUserStats: adminProcedure.query(async () => {
    return await analytics.getUserStats();
  }),

  /**
   * 获取用户增长趋势
   */
  getUserGrowthTrend: adminProcedure
    .input(
      z.object({
        days: z.number().min(1).max(365).default(30),
      })
    )
    .query(async ({ input }) => {
      return await analytics.getUserGrowthTrend(input.days);
    }),

  /**
   * 获取积分统计
   */
  getPointsStats: adminProcedure.query(async () => {
    return await analytics.getPointsStats();
  }),

  /**
   * 获取热门商品
   */
  getTopProducts: adminProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(50).default(10),
      })
    )
    .query(async ({ input }) => {
      return await analytics.getTopProducts(input.limit);
    }),

  /**
   * 获取订单状态分布
   */
  getOrderStatusDistribution: adminProcedure.query(async () => {
    return await analytics.getOrderStatusDistribution();
  }),

  /**
   * 获取配送类型分布
   */
  getDeliveryTypeDistribution: adminProcedure.query(async () => {
    return await analytics.getDeliveryTypeDistribution();
  }),
});
