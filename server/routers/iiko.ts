import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc.js";
import {
  getAllIikoConfigs,
  getIikoConfigById,
  createIikoConfig,
  updateIikoConfig,
  deleteIikoConfig,
} from "../iiko-db.js";
import { testIikoConnection, getIikoOrganizations, getIikoTerminalGroups } from "../iiko-auth.js";
import { triggerQueueProcessing } from "../iiko-queue-processor.js";
import { getSchedulerStatus, triggerMenuSync } from "../iiko-scheduler.js";
import { TRPCError } from "@trpc/server";

export const iikoRouter = router({
  /**
   * 获取所有 IIKO 配置
   */
  list: protectedProcedure.query(async ({ ctx }) => {
    // 只有管理员可以查看 IIKO 配置
    if (ctx.user.role !== "admin") {
      throw new TRPCError({ code: "FORBIDDEN", message: "Only admins can access IIKO configs" });
    }

    return await getAllIikoConfigs();
  }),

  /**
   * 根据 ID 获取 IIKO 配置
   */
  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input, ctx }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only admins can access IIKO configs" });
      }

      const config = await getIikoConfigById(input.id);
      if (!config) {
        throw new TRPCError({ code: "NOT_FOUND", message: "IIKO config not found" });
      }

      return config;
    }),

  /**
   * 创建 IIKO 配置
   */
  create: protectedProcedure
    .input(
      z.object({
        configName: z.string().min(1),
        storeId: z.number().optional().nullable(),
        apiUrl: z.string().url(),
        apiLogin: z.string().min(1),
        organizationId: z.string().min(1),
        organizationName: z.string().optional().nullable(),
        terminalGroupId: z.string().optional().nullable(),
        terminalGroupName: z.string().optional().nullable(),
        autoSyncMenu: z.boolean().optional(),
        syncIntervalMinutes: z.number().optional(),
        isActive: z.boolean().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only admins can create IIKO configs" });
      }

      await createIikoConfig(input);

      return { success: true };
    }),

  /**
   * 更新 IIKO 配置
   */
  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        configName: z.string().min(1).optional(),
        storeId: z.number().optional().nullable(),
        apiUrl: z.string().url().optional(),
        apiLogin: z.string().min(1).optional(),
        organizationId: z.string().min(1).optional(),
        organizationName: z.string().optional().nullable(),
        terminalGroupId: z.string().optional().nullable(),
        terminalGroupName: z.string().optional().nullable(),
        autoSyncMenu: z.boolean().optional(),
        syncIntervalMinutes: z.number().optional(),
        isActive: z.boolean().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only admins can update IIKO configs" });
      }

      const { id, ...data } = input;
      await updateIikoConfig(id, data);

      return { success: true };
    }),

  /**
   * 删除 IIKO 配置
   */
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only admins can delete IIKO configs" });
      }

      await deleteIikoConfig(input.id);

      return { success: true };
    }),

  /**
   * 测试 IIKO 连接
   */
  testConnection: protectedProcedure
    .input(
      z.object({
        apiUrl: z.string().url(),
        apiLogin: z.string().min(1),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only admins can test IIKO connection" });
      }

      const result = await testIikoConnection(input.apiUrl, input.apiLogin);

      return result;
    }),

  /**
   * 获取组织列表
   */
  getOrganizations: protectedProcedure
    .input(z.object({ configId: z.number() }))
    .query(async ({ input, ctx }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only admins can access IIKO organizations" });
      }

      const organizations = await getIikoOrganizations(input.configId);

      return organizations;
    }),

  /**
   * 获取终端组列表
   */
  getTerminalGroups: protectedProcedure
    .input(z.object({ configId: z.number() }))
    .query(async ({ input, ctx }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only admins can access IIKO terminal groups" });
      }

      const terminalGroups = await getIikoTerminalGroups(input.configId);

      return terminalGroups;
    }),

  /**
   * 手动触发订单队列同步
   */
  triggerOrderSync: protectedProcedure.mutation(async ({ ctx }) => {
    if (ctx.user.role !== "admin") {
      throw new TRPCError({ code: "FORBIDDEN", message: "Only admins can trigger sync" });
    }

    const result = await triggerQueueProcessing();

    return result;
  }),

  /**
   * 手动触发菜单同步
   */
  triggerMenuSync: protectedProcedure.mutation(async ({ ctx }) => {
    if (ctx.user.role !== "admin") {
      throw new TRPCError({ code: "FORBIDDEN", message: "Only admins can trigger menu sync" });
    }

    const result = await triggerMenuSync();

    return result;
  }),

  /**
   * 获取调度器状态
   */
  getSchedulerStatus: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "admin") {
      throw new TRPCError({ code: "FORBIDDEN", message: "Only admins can view scheduler status" });
    }

    return getSchedulerStatus();
  }),

  // ==================== 分类映射管理 ====================

  /**
   * 获取所有分类映射
   */
  getCategoryMappings: protectedProcedure
    .input(z.object({ storeId: z.number().optional() }).optional())
    .query(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only admins can access category mappings" });
      }

      const { getAllCategoryMappings } = await import("../iiko-category-mapping-db.js");
      return await getAllCategoryMappings(input?.storeId);
    }),

  /**
   * 创建分类映射
   */
  createCategoryMapping: protectedProcedure
    .input(
      z.object({
        iikoGroupId: z.string(),
        iikoGroupName: z.string(),
        localCategoryId: z.number(),
        storeId: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only admins can create category mappings" });
      }

      const { createCategoryMapping } = await import("../iiko-category-mapping-db.js");
      return await createCategoryMapping(input);
    }),

  /**
   * 更新分类映射
   */
  updateCategoryMapping: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        localCategoryId: z.number().optional(),
        iikoGroupName: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only admins can update category mappings" });
      }

      const { id, ...data } = input;
      const { updateCategoryMapping } = await import("../iiko-category-mapping-db.js");
      return await updateCategoryMapping(id, data);
    }),

  /**
   * 删除分类映射
   */
  deleteCategoryMapping: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only admins can delete category mappings" });
      }

      const { deleteCategoryMapping } = await import("../iiko-category-mapping-db.js");
      return await deleteCategoryMapping(input.id);
    }),
});
