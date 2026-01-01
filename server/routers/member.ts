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

  // ==================== 会员注册（简化版，不需要手机验证）====================

  /**
   * 会员注册（简化版）
   * 注册成功后自动发放新人礼包：100 积分 + 2 张满 300 减 50 优惠券
   */
  register: protectedProcedure
    .input(z.object({
      name: z.string().min(1),
      birthday: z.string(), // YYYY-MM-DD
      city: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { name, birthday, city } = input;
      const userId = ctx.user.id;

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

      const { users, couponTemplates } = await import('../../drizzle/schema');

      // 更新用户信息
      await database
        .update(users)
        .set({
          memberId,
          name,
          birthday: new Date(birthday),
          city,
          profileCompleted: true,
          availablePoints: 100, // 赠送 100 积分
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId));

      // 发放 2 张满 300 减 50 优惠券
      const couponExpiresAt = new Date();
      couponExpiresAt.setDate(couponExpiresAt.getDate() + 30); // 30 天有效期

      await database.insert(couponTemplates).values([
        {
          code: `NEW${Date.now()}01`,
          nameZh: '新人专享优惠券',
          nameRu: 'Купон для новых пользователей',
          nameEn: 'New User Coupon',
          descriptionZh: '满 300 减 50',
          descriptionRu: 'Скидка 50 при покупке от 300',
          descriptionEn: '50 off on orders over 300',
          type: 'fixed' as const,
          value: '50',
          minOrderAmount: '300',
          stackable: false,
          totalQuantity: 1,
          usedQuantity: 0,
          perUserLimit: 1,
          startAt: new Date(),
          endAt: couponExpiresAt,
          isActive: true,
        },
        {
          code: `NEW${Date.now()}02`,
          nameZh: '新人专享优惠券',
          nameRu: 'Купон для новых пользователей',
          nameEn: 'New User Coupon',
          descriptionZh: '满 300 减 50',
          descriptionRu: 'Скидка 50 при покупке от 300',
          descriptionEn: '50 off on orders over 300',
          type: 'fixed' as const,
          value: '50',
          minOrderAmount: '300',
          stackable: false,
          totalQuantity: 1,
          usedQuantity: 0,
          perUserLimit: 1,
          startAt: new Date(),
          endAt: couponExpiresAt,
          isActive: true,
        },
      ]);

      return {
        success: true,
        memberId,
        rewards: {
          points: 100,
          coupons: 2,
        },
      };
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
   * 获取新人礼包领取状态
   */
  getWelcomeGiftStatus: protectedProcedure.query(async ({ ctx }) => {
    const database = await getDb();
    if (!database) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Database not available',
      });
    }

    const { users, userCoupons } = await import('../../drizzle/schema');
    
    // 获取用户信息
    const user = await database
      .select()
      .from(users)
      .where(eq(users.id, ctx.user.id))
      .limit(1);

    if (!user || user.length === 0) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'User not found',
      });
    }

    const userData = user[0];

    // 检查是否已完成注册（已领取礼包）
    const hasCompletedRegistration = userData.profileCompleted;

    // 如果已完成注册，检查积分和优惠券
    let pointsReceived = 0;
    let couponsReceived = 0;

    if (hasCompletedRegistration) {
      // 检查积分（假设注册时赠送 100 积分）
      pointsReceived = userData.availablePoints >= 100 ? 100 : 0;

      // 检查优惠券（查询用户是否有新人优惠券）
      // 注册时发放的优惠券有 campaignId 或者创建时间接近注册时间
      const coupons = await database
        .select()
        .from(userCoupons)
        .where(eq(userCoupons.userId, ctx.user.id));

      // 统计新人优惠券数量（根据 campaignId 或创建时间判断）
      const registrationTime = userData.createdAt.getTime();
      couponsReceived = coupons.filter(c => {
        const couponTime = c.createdAt.getTime();
        // 如果优惠券创建时间在注册后 5 分钟内，认为是新人优惠券
        return Math.abs(couponTime - registrationTime) < 5 * 60 * 1000;
      }).length;
    }

    return {
      hasReceived: hasCompletedRegistration,
      pointsReceived,
      couponsReceived,
      expectedPoints: 100,
      expectedCoupons: 2,
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
