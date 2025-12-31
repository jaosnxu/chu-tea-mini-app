import { z } from "zod";
import { notifyOwner } from "./notification";
import { adminProcedure, publicProcedure, router } from "./trpc";
import { getDeliverySettings, updateDeliverySettings } from "../db/deliverySettings";
import { getPointsRules, updatePointsRules } from "../db/pointsRules";

export const systemRouter = router({
  health: publicProcedure
    .input(
      z.object({
        timestamp: z.number().min(0, "timestamp cannot be negative"),
      })
    )
    .query(() => ({
      ok: true,
    })),

  notifyOwner: adminProcedure
    .input(
      z.object({
        title: z.string().min(1, "title is required"),
        content: z.string().min(1, "content is required"),
      })
    )
    .mutation(async ({ input }) => {
      const delivered = await notifyOwner(input);
      return {
        success: delivered,
      } as const;
    }),

  // 配送方式设置
  getDeliverySettings: publicProcedure.query(async () => {
    return await getDeliverySettings();
  }),

  updateDeliverySettings: adminProcedure
    .input(
      z.object({
        enablePickup: z.boolean(),
        enableDelivery: z.boolean(),
      })
    )
    .mutation(async ({ input }) => {
      await updateDeliverySettings(input);
      return { success: true };
    }),

  // 积分规则设置
  getPointsRules: publicProcedure.query(async () => {
    return await getPointsRules();
  }),

  updatePointsRules: adminProcedure
    .input(
      z.object({
        spendPerPoint: z.number().min(1),
        levelBonus: z.object({
          normal: z.number().min(0).max(100),
          silver: z.number().min(0).max(100),
          gold: z.number().min(0).max(100),
          diamond: z.number().min(0).max(100),
        }),
        upgradeThreshold: z.object({
          silver: z.number().min(0),
          gold: z.number().min(0),
          diamond: z.number().min(0),
        }),
      })
    )
    .mutation(async ({ input }) => {
      await updatePointsRules(input);
      return { success: true };
    }),
});
