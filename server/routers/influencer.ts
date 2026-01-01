import { z } from "zod";
import { publicProcedure, protectedProcedure, adminProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import * as influencerDb from "../db/influencer";
import * as influencerAnalytics from "../db/influencerAnalytics";
import { getInfluencerUpgradeProgress, LEVEL_UPGRADE_RULES } from "../utils/influencerLevelUpgrade";

export const influencerRouter = router({
  // ==================== 达人注册和管理 ====================
  
  /**
   * 申请成为达人
   */
  applyInfluencer: protectedProcedure
    .input(
      z.object({
        influencerCode: z.string().min(3).max(32),
        followerCount: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        await influencerDb.applyInfluencer(ctx.user.id, input);
        return { success: true, message: "达人申请成功" };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "申请失败",
        });
      }
    }),

  /**
   * 获取我的达人信息
   */
  getMyInfo: protectedProcedure.query(async ({ ctx }) => {
    const info = await influencerDb.getInfluencerInfo(ctx.user.id);
    if (!info) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "您还不是达人",
      });
    }
    return info;
  }),

  /**
   * 获取我的升级进度
   */
  getMyUpgradeProgress: protectedProcedure.query(async ({ ctx }) => {
    return await getInfluencerUpgradeProgress(ctx.user.id);
  }),

  /**
   * 获取等级规则
   */
  getLevelRules: publicProcedure.query(async () => {
    return LEVEL_UPGRADE_RULES;
  }),

  /**
   * 获取所有达人列表（管理员）
   */
  list: adminProcedure.query(async () => {
    return await influencerDb.getAllInfluencers();
  }),

  /**
   * 更新达人等级（管理员）
   */
  updateLevel: adminProcedure
    .input(
      z.object({
        userId: z.number(),
        level: z.enum(["bronze", "silver", "gold", "diamond"]),
      })
    )
    .mutation(async ({ input }) => {
      await influencerDb.updateInfluencerLevel(input.userId, input.level);
      return { success: true };
    }),

  // ==================== 活动管理 ====================

  /**
   * 创建活动（管理员）
   */
  createCampaign: adminProcedure
    .input(
      z.object({
        name: z.string().min(1).max(255),
        description: z.string().optional(),
        coverImage: z.string().optional(),
        startDate: z.date(),
        endDate: z.date(),
        commissionConfig: z.object({
          type: z.enum(["percentage", "fixed"]),
          value: z.number(),
          minOrder: z.number().optional(),
          maxCommission: z.number().optional(),
        }),
        taskRequirements: z
          .object({
            minOrders: z.number().optional(),
            minRevenue: z.number().optional(),
            contentRequirements: z.array(z.string()).optional(),
            platforms: z.array(z.string()).optional(),
          })
          .optional(),
        minInfluencerLevel: z.enum(["bronze", "silver", "gold", "diamond"]).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const campaignId = await influencerDb.createCampaign({
        ...input,
        status: "draft",
      });
      return { campaignId };
    }),

  /**
   * 获取活动详情
   */
  getCampaign: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const campaign = await influencerDb.getCampaignById(input.id);
      if (!campaign) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "活动不存在",
        });
      }
      return campaign;
    }),

  /**
   * 获取所有活动列表
   */
  listCampaigns: publicProcedure
    .input(
      z
        .object({
          status: z.string().optional(),
        })
        .optional()
    )
    .query(async ({ input }) => {
      return await influencerDb.getAllCampaigns(input?.status);
    }),

  /**
   * 获取活跃的活动列表
   */
  getActiveCampaigns: publicProcedure.query(async () => {
    return await influencerDb.getActiveCampaigns();
  }),

  /**
   * 更新活动（管理员）
   */
  updateCampaign: adminProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().optional(),
        description: z.string().optional(),
        coverImage: z.string().optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        status: z.enum(["draft", "active", "paused", "ended"]).optional(),
        commissionConfig: z
          .object({
            type: z.enum(["percentage", "fixed"]),
            value: z.number(),
            minOrder: z.number().optional(),
            maxCommission: z.number().optional(),
          })
          .optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      await influencerDb.updateCampaign(id, data);
      return { success: true };
    }),

  /**
   * 删除活动（管理员）
   */
  deleteCampaign: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await influencerDb.deleteCampaign(input.id);
      return { success: true };
    }),

  // ==================== 任务管理 ====================

  /**
   * 接受任务
   */
  acceptTask: protectedProcedure
    .input(z.object({ campaignId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      // 检查是否是达人
      const influencer = await influencerDb.getInfluencerInfo(ctx.user.id);
      if (!influencer) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "您还不是达人",
        });
      }

      const taskId = await influencerDb.acceptTask(ctx.user.id, input.campaignId);
      return { taskId };
    }),

  /**
   * 获取我的任务列表
   */
  getMyTasks: protectedProcedure
    .input(
      z
        .object({
          status: z.string().optional(),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      return await influencerDb.getInfluencerTasks(ctx.user.id, input?.status);
    }),

  /**
   * 提交任务作品
   */
  submitTask: protectedProcedure
    .input(
      z.object({
        taskId: z.number(),
        content: z.string().min(1),
      })
    )
    .mutation(async ({ input }) => {
      await influencerDb.submitTask(input.taskId, input.content);
      return { success: true };
    }),

  /**
   * 审核任务（管理员）
   */
  reviewTask: adminProcedure
    .input(
      z.object({
        taskId: z.number(),
        approved: z.boolean(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await influencerDb.reviewTask(
        input.taskId,
        ctx.user.id,
        input.approved,
        input.notes
      );
      return { success: true };
    }),

  // ==================== 收益管理 ====================

  /**
   * 获取我的收益列表
   */
  getMyEarnings: protectedProcedure
    .input(
      z
        .object({
          status: z.string().optional(),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      return await influencerDb.getInfluencerEarnings(ctx.user.id, input?.status);
    }),

  /**
   * 获取我的收益统计
   */
  getMyEarningsStats: protectedProcedure.query(async ({ ctx }) => {
    return await influencerDb.getInfluencerEarningsStats(ctx.user.id);
  }),

  // ==================== 提现管理 ====================

  /**
   * 创建提现申请
   */
  createWithdrawal: protectedProcedure
    .input(
      z.object({
        amount: z.number().positive(),
        withdrawalMethod: z.enum(["bank_card", "alipay", "wechat", "paypal"]),
        accountInfo: z.object({
          bankName: z.string().optional(),
          accountNumber: z.string(),
          accountName: z.string(),
          swiftCode: z.string().optional(),
        }),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const withdrawalId = await influencerDb.createWithdrawal({
          userId: ctx.user.id,
          amount: input.amount.toString(),
          withdrawalMethod: input.withdrawalMethod,
          accountInfo: input.accountInfo,
        });
        return { withdrawalId };
      } catch (error: any) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: error.message || "提现申请失败",
        });
      }
    }),

  /**
   * 获取我的提现申请列表
   */
  getMyWithdrawals: protectedProcedure
    .input(
      z
        .object({
          status: z.string().optional(),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      return await influencerDb.getWithdrawalRequests(ctx.user.id, input?.status);
    }),

  /**
   * 获取所有提现申请列表（管理员）
   */
  listWithdrawals: adminProcedure
    .input(
      z
        .object({
          status: z.string().optional(),
        })
        .optional()
    )
    .query(async ({ input }) => {
      return await influencerDb.getWithdrawalRequests(undefined, input?.status);
    }),

  /**
   * 审核提现申请（管理员）
   */
  reviewWithdrawal: adminProcedure
    .input(
      z.object({
        withdrawalId: z.number(),
        approved: z.boolean(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await influencerDb.reviewWithdrawal(
        input.withdrawalId,
        ctx.user.id,
        input.approved,
        input.notes
      );
      return { success: true };
    }),

  /**
   * 完成提现打款（管理员）
   */
  completeWithdrawal: adminProcedure
    .input(
      z.object({
        withdrawalId: z.number(),
        transactionId: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      await influencerDb.completeWithdrawal(input.withdrawalId, input.transactionId);
      return { success: true };
    }),

  // ==================== 链接追踪 ====================

  /**
   * 生成我的专属推广链接
   */
  generateLink: protectedProcedure
    .input(
      z.object({
        campaignId: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // 检查是否是达人
      const influencer = await influencerDb.getInfluencerInfo(ctx.user.id);
      if (!influencer) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "您还不是达人",
        });
      }

      const linkCode = influencerDb.generateLinkCode(ctx.user.id, input.campaignId);
      
      // 生成完整的推广链接
      const baseUrl = process.env.VITE_APP_URL || "https://chu-tea.manus.space";
      const link = `${baseUrl}?ref=${linkCode}`;

      return { linkCode, link };
    }),

  /**
   * 获取我的链接点击统计
   */
  getLinkStats: protectedProcedure.query(async ({ ctx }) => {
    return await influencerDb.getLinkClickStats(ctx.user.id);
  }),

  // ==================== 订单归因和排行榜 ====================

  /**
   * 获取我的订单归因列表
   */
  getMyOrderAttributions: protectedProcedure.query(async ({ ctx }) => {
    return await influencerDb.getInfluencerOrderAttributions(ctx.user.id);
  }),

  /**
   * 获取达人系统趋势数据
   */
  getTrends: publicProcedure
    .input(
      z
        .object({
          period: z.enum(["day", "week", "month"]).optional().default("day"),
          days: z.number().optional().default(30),
        })
        .optional()
    )
    .query(async ({ input }) => {
      return await influencerAnalytics.getInfluencerTrends({
        period: input?.period || "day",
        days: input?.days || 30,
      });
    }),

  /**
   * 获取达人系统总体统计
   */
  getOverallStats: publicProcedure.query(async () => {
    return await influencerAnalytics.getInfluencerOverallStats();
  }),

  /**
   * 获取达人排行榜
   */
  getRanking: publicProcedure
    .input(
      z
        .object({
          period: z.enum(["today", "week", "month", "all_time"]).optional(),
          limit: z.number().optional(),
        })
        .optional()
    )
    .query(async ({ input }) => {
      return await influencerDb.getInfluencerRanking(input?.limit || 10);
    }),
});
