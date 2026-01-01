/**
 * 会员系统 Router
 * 包括手机验证、信息完善、标签管理
 */

import { z } from 'zod';
import { publicProcedure, protectedProcedure, router } from '../_core/trpc';
import { TRPCError } from '@trpc/server';
import { 
  sendSMS, 
  generateVerificationCode, 
  isValidRussianPhone,
  formatRussianPhone 
} from '../sms';
import {
  createVerificationCode,
  verifyVerificationCode,
  checkVerificationCodeRateLimit,
  generateUniqueMemberId,
  createMemberTag,
  getAllMemberTags,
  assignTagToUser,
  getUserTags,
  removeTagFromUser,
  getDb,
} from '../db';
import { eq } from 'drizzle-orm';

export const memberRouter = router({
  // ==================== 手机验证码 ====================
  
  /**
   * 发送验证码
   */
  sendVerificationCode: publicProcedure
    .input(z.object({
      phone: z.string(),
      purpose: z.enum(['register', 'login', 'change_phone', 'bind_phone']),
    }))
    .mutation(async ({ input }) => {
      const { phone, purpose } = input;

      // 验证手机号格式
      if (!isValidRussianPhone(phone)) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Invalid Russian phone number format',
        });
      }

      // 格式化手机号
      const formattedPhone = formatRussianPhone(phone);

      // 检查发送频率限制
      const canSend = await checkVerificationCodeRateLimit(formattedPhone);
      if (!canSend) {
        throw new TRPCError({
          code: 'TOO_MANY_REQUESTS',
          message: 'Please wait 1 minute before requesting another code',
        });
      }

      // 生成验证码
      const code = generateVerificationCode();
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 分钟后过期

      // 保存验证码到数据库
      await createVerificationCode({
        phone: formattedPhone,
        code,
        purpose,
        expiresAt,
      });

      // 发送短信
      const success = await sendSMS(formattedPhone, code);
      
      if (!success) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to send SMS',
        });
      }

      return { success: true };
    }),

  /**
   * 验证验证码
   */
  verifyCode: publicProcedure
    .input(z.object({
      phone: z.string(),
      code: z.string(),
      purpose: z.enum(['register', 'login', 'change_phone', 'bind_phone']),
    }))
    .mutation(async ({ input }) => {
      const { phone, code, purpose } = input;

      const formattedPhone = formatRussianPhone(phone);
      const isValid = await verifyVerificationCode(formattedPhone, code, purpose);

      if (!isValid) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Invalid or expired verification code',
        });
      }

      return { success: true };
    }),

  // ==================== 会员信息完善 ====================

  /**
   * 完善会员信息
   */
  completeProfile: protectedProcedure
    .input(z.object({
      name: z.string().min(1),
      phone: z.string(),
      phoneCode: z.string(),
      birthday: z.string(), // YYYY-MM-DD
      city: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { name, phone, phoneCode, birthday, city } = input;
      const userId = ctx.user.id;

      // 验证手机号格式
      if (!isValidRussianPhone(phone)) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Invalid phone number format',
        });
      }

      const formattedPhone = formatRussianPhone(phone);

      // 验证验证码
      const isCodeValid = await verifyVerificationCode(
        formattedPhone,
        phoneCode,
        'bind_phone'
      );

      if (!isCodeValid) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Invalid verification code',
        });
      }

      // 生成唯一会员 ID
      const memberId = await generateUniqueMemberId();

      // 更新用户信息
      const database = await getDb();
      if (!database) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Database not available',
        });
      }

      const { users } = await import('../../drizzle/schema');

      await database
        .update(users)
        .set({
          memberId,
          name,
          phone: formattedPhone,
          phoneVerified: true,
          birthday: new Date(birthday),
          city,
          profileCompleted: true,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId));

      return {
        success: true,
        memberId,
      };
    }),

  /**
   * 更换手机号
   */
  changePhone: protectedProcedure
    .input(z.object({
      newPhone: z.string(),
      code: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { newPhone, code } = input;
      const userId = ctx.user.id;

      const formattedPhone = formatRussianPhone(newPhone);

      // 验证验证码
      const isValid = await verifyVerificationCode(formattedPhone, code, 'change_phone');
      if (!isValid) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Invalid verification code',
        });
      }

      // 更新手机号
      const database = await getDb();
      if (!database) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Database not available',
        });
      }

      const { users } = await import('../../drizzle/schema');

      await database
        .update(users)
        .set({
          phone: formattedPhone,
          phoneVerified: true,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId));

      return { success: true };
    }),

  /**
   * 更新城市
   */
  updateCity: protectedProcedure
    .input(z.object({
      city: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { city } = input;
      const userId = ctx.user.id;

      const database = await getDb();
      if (!database) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Database not available',
        });
      }

      const { users } = await import('../../drizzle/schema');

      await database
        .update(users)
        .set({
          city,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId));

      return { success: true };
    }),

  // ==================== 会员标签 ====================

  /**
   * 获取所有标签
   */
  getTags: publicProcedure
    .input(z.object({
      type: z.enum(['user', 'store', 'system']).optional(),
    }))
    .query(async ({ input }) => {
      const { type } = input;
      return await getAllMemberTags(type);
    }),

  /**
   * 创建标签
   */
  createTag: protectedProcedure
    .input(z.object({
      name: z.string(),
      color: z.string().optional(),
      type: z.enum(['user', 'store', 'system']),
      storeId: z.number().optional(),
      description: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      return await createMemberTag(input);
    }),

  /**
   * 给用户添加标签
   */
  assignTag: protectedProcedure
    .input(z.object({
      userId: z.number(),
      tagId: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { userId, tagId } = input;
      const assignedBy = ctx.user.id;

      return await assignTagToUser(userId, tagId, assignedBy);
    }),

  /**
   * 获取用户标签
   */
  getUserTags: protectedProcedure
    .input(z.object({
      userId: z.number().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const userId = input.userId || ctx.user.id;
      return await getUserTags(userId);
    }),

  /**
   * 移除用户标签
   */
  removeTag: protectedProcedure
    .input(z.object({
      userId: z.number(),
      tagId: z.number(),
    }))
    .mutation(async ({ input }) => {
      const { userId, tagId } = input;
      return await removeTagFromUser(userId, tagId);
    }),

  // ==================== 会员等级系统（兼容旧 API） ====================

  /**
   * 获取会员信息
   */
  info: protectedProcedure.query(async ({ ctx }) => {
    const database = await getDb();
    if (!database) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Database not available',
      });
    }

    const { users } = await import('../../drizzle/schema');
    const result = await database
      .select()
      .from(users)
      .where(eq(users.id, ctx.user.id))
      .limit(1);

    return result[0] || null;
  }),

  /**
   * 获取会员等级进度
   */
  levelProgress: protectedProcedure.query(async ({ ctx }) => {
    // TODO: 实现会员等级进度逻辑
    return {
      currentLevel: ctx.user.memberLevel,
      currentPoints: ctx.user.totalPoints,
      nextLevel: 'silver',
      pointsToNextLevel: 1000,
      progress: 0.5,
      isMaxLevel: false,
      spentProgress: 0.5,
      ordersProgress: 0.5,
      spentRemaining: 500,
      ordersRemaining: 5,
    };
  }),

  /**
   * 获取会员等级权益
   */
  benefits: protectedProcedure
    .input(z.object({
      level: z.enum(['normal', 'silver', 'gold', 'diamond']).optional(),
    }).optional())
    .query(async ({ ctx, input }) => {
      const level = input?.level || ctx.user.memberLevel;
      // TODO: 实现会员权益查询
      return {
        pointsMultiplier: 1.0,
        discountRate: 0,
        freeDeliveryThreshold: 0,
        birthdayCoupon: false,
        prioritySupport: false,
      };
    }),

  /**
   * 手动检查并升级等级
   */
  checkUpgrade: protectedProcedure.mutation(async ({ ctx }) => {
    // TODO: 实现等级升级检查
    return {
      upgraded: false,
      currentLevel: ctx.user.memberLevel,
      newLevel: ctx.user.memberLevel,
    };
  }),
});
