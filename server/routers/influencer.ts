import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc.js";
import * as db from "../db.js";
import { users, influencerCampaigns, influencerTasks, influencerEarnings, withdrawalRequests, linkClicks, orderAttribution } from "../../drizzle/schema";
import { eq, and, desc, sql, gte, lte } from "drizzle-orm";
import { generateInfluencerLink } from "../influencer-tracking.js";

export const influencerRouter = router({
  // 生成专属推广链接
  generateLink: protectedProcedure
    .input(z.object({ campaignId: z.number().optional() }))
    .mutation(async ({ ctx, input }) => {
      const link = await generateInfluencerLink(ctx.user.id, input.campaignId);
      return { link };
    }),

  // 获取可接任务列表
  getAvailableTasks: protectedProcedure.query(async ({ ctx }) => {
    const campaigns = await db
      .select()
      .from(influencerCampaigns)
      .where(eq(influencerCampaigns.status, "active"));
    return campaigns;
  }),

  // 接受任务
  acceptTask: protectedProcedure
    .input(z.object({ campaignId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const [task] = await db
        .insert(influencerTasks)
        .values({
          campaignId: input.campaignId,
          userId: ctx.user.id,
          status: "in_progress",
        })
        .$returningId();
      return { taskId: task.id };
    }),

  // 获取我的任务
  getMyTasks: protectedProcedure.query(async ({ ctx }) => {
    return await db
      .select()
      .from(influencerTasks)
      .where(eq(influencerTasks.userId, ctx.user.id))
      .orderBy(desc(influencerTasks.createdAt));
  }),

  // 获取收益统计
  getEarningsStats: protectedProcedure.query(async ({ ctx }) => {
    const earnings = await db
      .select()
      .from(influencerEarnings)
      .where(eq(influencerEarnings.userId, ctx.user.id));

    const total = earnings.reduce((sum: number, e: any) => sum + parseFloat(e.amount), 0);
    const pending = earnings
      .filter((e) => e.status === "pending")
      .reduce((sum, e) => sum + parseFloat(e.amount), 0);
    const confirmed = earnings
      .filter((e) => e.status === "confirmed")
      .reduce((sum, e) => sum + parseFloat(e.amount), 0);

    return {
      totalEarnings: total.toFixed(2),
      pendingEarnings: pending.toFixed(2),
      confirmedEarnings: confirmed.toFixed(2),
      availableBalance: ctx.user.availableBalance,
      recentEarnings: earnings.slice(0, 10),
    };
  }),

  // 申请提现
  requestWithdrawal: protectedProcedure
    .input(
      z.object({
        amount: z.number().positive(),
        withdrawalMethod: z.enum(["bank_card", "alipay", "wechat", "paypal"]),
        accountInfo: z.object({
          accountNumber: z.string(),
          accountName: z.string(),
          bankName: z.string().optional(),
          swiftCode: z.string().optional(),
        }),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const available = parseFloat(ctx.user.availableBalance || "0");
      if (input.amount > available) {
        throw new Error("Insufficient balance");
      }

      const [request] = await db
        .insert(withdrawalRequests)
        .values({
          userId: ctx.user.id,
          amount: input.amount.toString(),
          withdrawalMethod: input.withdrawalMethod,
          accountInfo: input.accountInfo,
          status: "pending",
        })
        .$returningId();

      await db
        .update(users)
        .set({
          availableBalance: (available - input.amount).toFixed(2),
        })
        .where(eq(users.id, ctx.user.id));

      return { requestId: request.id };
    }),

  // 获取提现记录
  getWithdrawalHistory: protectedProcedure.query(async ({ ctx }) => {
    return await db
      .select()
      .from(withdrawalRequests)
      .where(eq(withdrawalRequests.userId, ctx.user.id))
      .orderBy(desc(withdrawalRequests.createdAt));
  }),

  // 获取推广数据统计
  getPromotionStats: protectedProcedure.query(async ({ ctx }) => {
    const clicks = await db
      .select()
      .from(linkClicks)
      .where(eq(linkClicks.influencerId, ctx.user.id));

    const orders = await db
      .select()
      .from(orderAttribution)
      .where(eq(orderAttribution.influencerId, ctx.user.id));

    const totalClicks = clicks.length;
    const totalOrders = orders.length;
    const conversionRate = totalClicks > 0 ? (totalOrders / totalClicks) * 100 : 0;
    const totalRevenue = orders.reduce((sum: number, o: any) => sum + parseFloat(o.orderAmount), 0);

    return {
      totalClicks,
      totalOrders,
      conversionRate: conversionRate.toFixed(2),
      totalRevenue: totalRevenue.toFixed(2),
      recentClicks: clicks.slice(0, 10),
      recentOrders: orders.slice(0, 10),
    };
  }),
});
