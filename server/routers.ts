import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";

export const appRouter = router({
  system: systemRouter,
  
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // 门店路由
  store: router({
    list: publicProcedure.query(async () => {
      return await db.getActiveStores();
    }),
    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getStoreById(input.id);
      }),
  }),

  // 分类路由
  category: router({
    list: publicProcedure
      .input(z.object({ type: z.enum(['tea', 'mall']).optional() }).optional())
      .query(async ({ input }) => {
        return await db.getCategories(input?.type);
      }),
  }),

  // 商品路由
  product: router({
    list: publicProcedure
      .input(z.object({
        categoryId: z.number().optional(),
        type: z.enum(['tea', 'mall']).optional(),
        isHot: z.boolean().optional(),
        isNew: z.boolean().optional(),
        limit: z.number().optional(),
      }).optional())
      .query(async ({ input }) => {
        return await db.getProducts(input);
      }),
    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getProductById(input.id);
      }),
    getOptions: publicProcedure
      .input(z.object({ productId: z.number() }))
      .query(async ({ input }) => {
        return await db.getProductOptions(input.productId);
      }),
  }),

  // 购物车路由
  cart: router({
    list: protectedProcedure
      .input(z.object({ cartType: z.enum(['tea', 'mall']).optional() }).optional())
      .query(async ({ ctx, input }) => {
        return await db.getCartItems(ctx.user.id, input?.cartType);
      }),
    add: protectedProcedure
      .input(z.object({
        productId: z.number(),
        skuId: z.number().optional(),
        quantity: z.number().min(1),
        selectedOptions: z.array(z.object({
          optionId: z.number(),
          itemId: z.number(),
          name: z.string(),
          price: z.string(),
        })).optional(),
        unitPrice: z.string(),
        cartType: z.enum(['tea', 'mall']),
        storeId: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return await db.addToCart(ctx.user.id, input);
      }),
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        quantity: z.number().min(0),
      }))
      .mutation(async ({ ctx, input }) => {
        if (input.quantity === 0) {
          return await db.removeFromCart(ctx.user.id, input.id);
        }
        return await db.updateCartItem(ctx.user.id, input.id, input.quantity);
      }),
    remove: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        return await db.removeFromCart(ctx.user.id, input.id);
      }),
    clear: protectedProcedure
      .input(z.object({ cartType: z.enum(['tea', 'mall']).optional() }).optional())
      .mutation(async ({ ctx, input }) => {
        return await db.clearCart(ctx.user.id, input?.cartType);
      }),
  }),

  // 地址路由
  address: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return await db.getUserAddresses(ctx.user.id);
    }),
    add: protectedProcedure
      .input(z.object({
        name: z.string(),
        phone: z.string(),
        province: z.string().optional(),
        city: z.string().optional(),
        district: z.string().optional(),
        address: z.string(),
        postalCode: z.string().optional(),
        latitude: z.string().optional(),
        longitude: z.string().optional(),
        isDefault: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return await db.addAddress(ctx.user.id, input);
      }),
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        phone: z.string().optional(),
        province: z.string().optional(),
        city: z.string().optional(),
        district: z.string().optional(),
        address: z.string().optional(),
        postalCode: z.string().optional(),
        latitude: z.string().optional(),
        longitude: z.string().optional(),
        isDefault: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return await db.updateAddress(ctx.user.id, input);
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        return await db.deleteAddress(ctx.user.id, input.id);
      }),
    setDefault: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        return await db.setDefaultAddress(ctx.user.id, input.id);
      }),
  }),

  // 订单路由
  order: router({
    list: protectedProcedure
      .input(z.object({
        orderType: z.enum(['tea', 'mall']).optional(),
        status: z.string().optional(),
        limit: z.number().optional(),
        offset: z.number().optional(),
      }).optional())
      .query(async ({ ctx, input }) => {
        return await db.getUserOrders(ctx.user.id, input);
      }),
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        return await db.getOrderById(ctx.user.id, input.id);
      }),
    getByOrderNo: protectedProcedure
      .input(z.object({ orderNo: z.string() }))
      .query(async ({ ctx, input }) => {
        return await db.getOrderByOrderNo(ctx.user.id, input.orderNo);
      }),
    create: protectedProcedure
      .input(z.object({
        orderType: z.enum(['tea', 'mall']),
        deliveryType: z.enum(['delivery', 'pickup']),
        storeId: z.number().optional(),
        addressId: z.number().optional(),
        pickupTime: z.string().optional(),
        couponId: z.number().optional(),
        pointsUsed: z.number().optional(),
        remark: z.string().optional(),
        items: z.array(z.object({
          productId: z.number(),
          skuId: z.number().optional(),
          quantity: z.number(),
          unitPrice: z.string(),
          selectedOptions: z.array(z.object({
            name: z.string(),
            value: z.string(),
            price: z.string(),
          })).optional(),
        })),
      }))
      .mutation(async ({ ctx, input }) => {
        return await db.createOrder(ctx.user.id, input);
      }),
    cancel: protectedProcedure
      .input(z.object({
        id: z.number(),
        reason: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return await db.cancelOrder(ctx.user.id, input.id, input.reason);
      }),
  }),

  // 优惠券路由
  coupon: router({
    list: protectedProcedure
      .input(z.object({
        status: z.enum(['available', 'used', 'expired']).optional(),
      }).optional())
      .query(async ({ ctx, input }) => {
        return await db.getUserCoupons(ctx.user.id, input?.status);
      }),
    available: protectedProcedure
      .input(z.object({
        orderAmount: z.string(),
        storeId: z.number().optional(),
        productIds: z.array(z.number()).optional(),
      }))
      .query(async ({ ctx, input }) => {
        return await db.getAvailableCoupons(ctx.user.id, input);
      }),
    claim: protectedProcedure
      .input(z.object({ templateId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        return await db.claimCoupon(ctx.user.id, input.templateId);
      }),
  }),

  // 积分路由
  points: router({
    balance: protectedProcedure.query(async ({ ctx }) => {
      return await db.getPointsBalance(ctx.user.id);
    }),
    history: protectedProcedure
      .input(z.object({
        limit: z.number().optional(),
        offset: z.number().optional(),
      }).optional())
      .query(async ({ ctx, input }) => {
        return await db.getPointsHistory(ctx.user.id, input);
      }),
  }),

  // 会员路由
  member: router({
    info: protectedProcedure.query(async ({ ctx }) => {
      return await db.getMemberInfo(ctx.user.id);
    }),
  }),

  // 达人推广路由
  influencer: router({
    getProfile: protectedProcedure.query(async ({ ctx }) => {
      return await db.getInfluencerInfo(ctx.user.id);
    }),
    applyInfluencer: protectedProcedure
      .input(z.object({
        nameZh: z.string().optional(),
        nameRu: z.string().optional(),
        nameEn: z.string().optional(),
        bio: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return await db.applyAsInfluencer(ctx.user.id, input);
      }),
    links: protectedProcedure.query(async ({ ctx }) => {
      return await db.getInfluencerLinks(ctx.user.id);
    }),
    createLink: protectedProcedure
      .input(z.object({
        storeId: z.number().optional(),
        campaignName: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return await db.createInfluencerLink(ctx.user.id, input);
      }),
    statistics: protectedProcedure.query(async ({ ctx }) => {
      return await db.getInfluencerStatistics(ctx.user.id);
    }),
    commissions: protectedProcedure
      .input(z.object({
        status: z.enum(['pending', 'confirmed', 'paid', 'cancelled']).optional(),
        limit: z.number().optional(),
        offset: z.number().optional(),
      }).optional())
      .query(async ({ ctx, input }) => {
        return await db.getInfluencerCommissions(ctx.user.id, input);
      }),
  }),

  // 落地页路由
  landing: router({
    getBySlug: publicProcedure
      .input(z.object({ slug: z.string() }))
      .query(async ({ input }) => {
        return await db.getLandingPageBySlug(input.slug);
      }),
    trackView: publicProcedure
      .input(z.object({ slug: z.string() }))
      .mutation(async ({ input }) => {
        return await db.trackLandingPageView(input.slug);
      }),
  }),

  // Telegram 用户同步
  telegram: router({
    sync: publicProcedure
      .input(z.object({
        telegramId: z.string(),
        username: z.string().optional(),
        firstName: z.string(),
        lastName: z.string().optional(),
        languageCode: z.string().optional(),
        photoUrl: z.string().optional(),
        startParam: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        return await db.syncTelegramUser(input);
      }),
  }),
});

export type AppRouter = typeof appRouter;
