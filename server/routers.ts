import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { iikoRouter } from "./routers/iiko.js";
import { paymentRouter } from "./routers/payment.js";
import { analyticsRouter } from "./routers/analytics.js";
import { reviewRouter } from './routers/review';
import { memberRouter } from "./routers/member";
import { influencerRouter } from "./routers/influencer";
import { publicProcedure, protectedProcedure, adminProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";

export const appRouter = router({
  system: systemRouter,
  iiko: iikoRouter,
  payment: paymentRouter,
  analytics: analyticsRouter,
  review: reviewRouter,
  member: memberRouter,
  influencer: influencerRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
    telegramLogin: publicProcedure
      .input(z.object({ initData: z.string() }))
      .mutation(async ({ ctx, input }) => {
        // TODO: 验证 Telegram initData 的签名
        // 解析 initData
        const params = new URLSearchParams(input.initData);
        const userStr = params.get('user');
        if (!userStr) {
          throw new Error('Invalid Telegram data');
        }
        
        const telegramUser = JSON.parse(userStr);
        const telegramId = telegramUser.id.toString();
        
        // 查找或创建用户
        let user = await db.getUserByTelegramId(telegramId);
        if (!user) {
          // 创建新用户
          const openId = `telegram_${telegramId}`;
          user = await db.createUser({
            openId,
            telegramId,
            name: telegramUser.first_name + (telegramUser.last_name ? ' ' + telegramUser.last_name : ''),
            username: telegramUser.username || undefined,
            languageCode: telegramUser.language_code || 'zh',
          });
        }
        
        // 设置 session cookie
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, user.openId, cookieOptions);
        
        return { success: true, user };
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

  // 商品管理路由（管理员）
  products: router({
    list: adminProcedure.query(async () => {
      return await db.getAllProducts();
    }),
    create: adminProcedure
      .input(z.object({
        categoryId: z.number(),
        type: z.enum(['tea', 'mall']),
        code: z.string(),
        nameZh: z.string(),
        nameRu: z.string(),
        nameEn: z.string(),
        descriptionZh: z.string().optional(),
        descriptionRu: z.string().optional(),
        descriptionEn: z.string().optional(),
        image: z.string().optional(),
        basePrice: z.number(),
        originalPrice: z.number().optional(),
        pointsEarn: z.number().optional(),
        pointsRedeem: z.number().optional(),
        stock: z.number().optional(),
        iikoId: z.string().optional(),
        isActive: z.boolean(),
      }))
      .mutation(async ({ input }) => {
        return await db.createProduct(input);
      }),
    update: adminProcedure
      .input(z.object({
        id: z.number(),
        categoryId: z.number().optional(),
        type: z.enum(['tea', 'mall']).optional(),
        code: z.string().optional(),
        nameZh: z.string().optional(),
        nameRu: z.string().optional(),
        nameEn: z.string().optional(),
        descriptionZh: z.string().optional(),
        descriptionRu: z.string().optional(),
        descriptionEn: z.string().optional(),
        image: z.string().optional(),
        basePrice: z.number().optional(),
        originalPrice: z.number().optional(),
        pointsEarn: z.number().optional(),
        pointsRedeem: z.number().optional(),
        stock: z.number().optional(),
        iikoId: z.string().optional(),
        isActive: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        return await db.updateProduct(input);
      }),
    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return await db.deleteProduct(input.id);
      }),
  }),

  // 分类管理路由（管理员）
  categories: router({
    list: publicProcedure.query(async () => {
      return await db.getAllCategories();
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
        orderSource: z.enum(['delivery', 'store', 'telegram']).optional(),
        deliveryType: z.enum(['delivery', 'pickup']),
        storeId: z.number().optional(),
        addressId: z.number().optional(),
        pickupTime: z.string().optional(),
        couponId: z.number().optional(),
        pointsUsed: z.number().optional(),
        usePoints: z.boolean().optional(),
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
        const order = await db.createOrder(ctx.user.id, input);
        
        // 达人链接归因
        const { getInfluencerRefFromRequest } = await import('./middleware/trackInfluencerLink');
        const linkCode = getInfluencerRefFromRequest(ctx.req);
        if (linkCode && order.orderId) {
          const { attributeOrderToInfluencer } = await import('./utils/influencerAttribution');
          await attributeOrderToInfluencer(order.orderId, linkCode);
        }
        
        return order;
      }),
    
    // 立即购买（直接创建订单，不经过购物车）
    buyNow: protectedProcedure
      .input(z.object({
        productId: z.number(),
        quantity: z.number(),
        selectedOptions: z.array(z.object({
          optionId: z.number(),
          itemId: z.number(),
          name: z.string(),
          price: z.string(),
        })).optional(),
        orderType: z.enum(['tea', 'mall']).optional(),
        deliveryType: z.enum(['delivery', 'pickup']).optional(),
        addressId: z.number().optional(),
        couponId: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        // 获取商品信息
        const product = await db.getProductById(input.productId);
        if (!product) {
          throw new Error('Product not found');
        }
        
        // 计算单价
        const basePrice = parseFloat(product.basePrice);
        const optionsPrice = (input.selectedOptions || []).reduce((sum, opt) => sum + parseFloat(opt.price || '0'), 0);
        const unitPrice = (basePrice + optionsPrice).toFixed(2);
        
        // 转换选项格式
        const selectedOptions = (input.selectedOptions || []).map(opt => ({
          name: opt.name,
          value: opt.name,
          price: opt.price,
        }));
        
        // 创建订单
        const order = await db.createOrder(ctx.user.id, {
          orderType: input.orderType || 'tea',
          orderSource: 'telegram',
          deliveryType: input.deliveryType || 'delivery',
          addressId: input.addressId,
          couponId: input.couponId,
          items: [{
            productId: input.productId,
            quantity: input.quantity,
            unitPrice,
            selectedOptions,
          }],
        });
        
        // 达人链接归因
        const { getInfluencerRefFromRequest } = await import('./middleware/trackInfluencerLink');
        const linkCode = getInfluencerRefFromRequest(ctx.req);
        if (linkCode && order.orderId) {
          const { attributeOrderToInfluencer } = await import('./utils/influencerAttribution');
          await attributeOrderToInfluencer(order.orderId, linkCode);
        }
        
        return order;
      }),
    cancel: protectedProcedure
      .input(z.object({
        id: z.number(),
        reason: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        // 取消订单
        const result = await db.cancelOrder(ctx.user.id, input.id, input.reason);
        
        // 检查是否需要退款
        const payment = await db.getPaymentByOrderId(input.id);
        if (payment && payment.status === 'succeeded' && payment.gatewayPaymentId) {
          try {
            // 自动发起退款
            const { createRefund } = await import('./payment/yookassa.js');
            const refund = await createRefund({
              paymentId: payment.gatewayPaymentId,
              amount: parseFloat(payment.amount),
              reason: `Auto refund for cancelled order ${input.id}`,
            });
            
            // 保存退款记录
            await db.createRefund({
              paymentId: payment.id,
              refundNo: refund.id,
              gatewayRefundId: refund.id,
              amount: payment.amount,
              currency: 'RUB',
              reason: input.reason || 'Order cancelled',
              status: refund.status === 'succeeded' ? 'succeeded' : 'pending',
            });
            
            // 更新支付状态
            if (refund.status === 'succeeded') {
              await db.updatePaymentStatus(payment.id, 'refunded');
            }
          } catch (error) {
            console.error('[Auto Refund Error]', error);
            // 退款失败不影响订单取消
          }
        }
        
        // 取消达人收益
        const { cancelOrderEarning } = await import('./utils/influencerAttribution');
        await cancelOrderEarning(input.id);
        
        return result;
      }),
  }),

  // 显示屏订单展示接口（公开访问）
  display: router({
    orders: publicProcedure
      .input(z.object({
        storeId: z.number().optional(),
        status: z.array(z.enum(['paid', 'preparing', 'ready'])).optional(),
        limit: z.number().optional().default(20),
      }).optional())
      .query(async ({ input }) => {
        const db = await import('./db');
        return await db.getDisplayOrders(input);
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
    calculateDiscount: protectedProcedure
      .input(z.object({
        couponId: z.number(),
        orderAmount: z.number(),
        items: z.array(z.object({
          productId: z.number(),
          quantity: z.number(),
          price: z.number(),
        })),
      }))
      .mutation(async ({ ctx, input }) => {
        const discount = await db.calculateCouponDiscount({
          couponId: input.couponId,
          orderAmount: input.orderAmount,
          items: input.items,
        });
        return { discount };
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

  // 会员路由（已移至 memberRouter）

  // 达人推广路由已移至 influencerRouter

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

  // YooKassa 配置管理路由
  yookassa: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== 'admin') throw new Error('Unauthorized');
      const db = await import('./db');
      return await db.getAllYooKassaConfigs();
    }),
    create: protectedProcedure
      .input(z.object({
        shopId: z.string(),
        secretKey: z.string(),
        isActive: z.boolean().optional().default(true),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin') throw new Error('Unauthorized');
        const db = await import('./db');
        return await db.createYooKassaConfig(input);
      }),
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        shopId: z.string().optional(),
        secretKey: z.string().optional(),
        isActive: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin') throw new Error('Unauthorized');
        const db = await import('./db');
        return await db.updateYooKassaConfig(input);
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin') throw new Error('Unauthorized');
        const db = await import('./db');
        return await db.deleteYooKassaConfig(input.id);
      }),
    testConnection: protectedProcedure
      .input(z.object({
        shopId: z.string(),
        secretKey: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin') throw new Error('Unauthorized');
        try {
          const { YooCheckout } = await import('@a2seven/yoo-checkout');
          const client = new YooCheckout({ shopId: input.shopId, secretKey: input.secretKey });
          // 尝试获取商店信息来验证连接
          await client.getPayment('test');
          return { success: true, message: 'YooKassa 连接成功' };
        } catch (error: any) {
          // 如果是 404 错误，说明连接成功但支付 ID 不存在
          if (error.message?.includes('404') || error.message?.includes('not found')) {
            return { success: true, message: 'YooKassa 连接成功' };
          }
          return { success: false, message: `连接失败: ${error.message}` };
        }
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

  // ============ 后台管理 API ============
  
  // 后台仪表盘
  adminDashboard: router({
    getStats: protectedProcedure.query(async ({ ctx }) => {
      // 检查管理员权限
      if (ctx.user.role !== 'admin') {
        throw new Error('Unauthorized');
      }
      return await db.getAdminDashboardStats();
    }),
  }),

  // 后台广告管理
  adminAds: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== 'admin') throw new Error('Unauthorized');
      return await db.getAdminAds();
    }),
    create: protectedProcedure
      .input(z.object({
        position: z.enum(['top', 'bottom', 'popup']),
        mediaType: z.enum(['image', 'video']),
        mediaUrl: z.string(),
        linkType: z.enum(['none', 'internal', 'external']).optional(),
        linkUrl: z.string().optional(),
        titleZh: z.string().optional(),
        titleRu: z.string().optional(),
        titleEn: z.string().optional(),
        sortOrder: z.number().optional(),
        startTime: z.date().optional(),
        endTime: z.date().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin') throw new Error('Unauthorized');
        return await db.createAd(input, ctx.user.id);
      }),
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        position: z.enum(['top', 'bottom', 'popup']).optional(),
        mediaType: z.enum(['image', 'video']).optional(),
        mediaUrl: z.string().optional(),
        linkType: z.enum(['none', 'internal', 'external']).optional(),
        linkUrl: z.string().optional(),
        titleZh: z.string().optional(),
        titleRu: z.string().optional(),
        titleEn: z.string().optional(),
        sortOrder: z.number().optional(),
        isActive: z.boolean().optional(),
        startTime: z.date().optional(),
        endTime: z.date().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin') throw new Error('Unauthorized');
        return await db.updateAd(input, ctx.user.id);
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin') throw new Error('Unauthorized');
        return await db.deleteAd(input.id, ctx.user.id);
      }),
  }),

  // 后台首页入口配置
  adminHomeEntries: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== 'admin') throw new Error('Unauthorized');
      return await db.getHomeEntries();
    }),
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        isEnabled: z.boolean().optional(),
        entryType: z.enum(['order', 'mall', 'coupons', 'points']).optional(),
        sortOrder: z.number().optional(),
        iconUrl: z.string().optional(),
        titleZh: z.string().optional(),
        titleRu: z.string().optional(),
        titleEn: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin') throw new Error('Unauthorized');
        return await db.updateHomeEntry(input, ctx.user.id);
      }),
  }),

  // 后台优惠券模板管理
  adminCoupons: router({
    listTemplates: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== 'admin') throw new Error('Unauthorized');
      return await db.getAllCouponTemplates();
    }),
    createTemplate: protectedProcedure
      .input(z.object({
        nameZh: z.string(),
        nameRu: z.string(),
        nameEn: z.string(),
        type: z.enum(['discount', 'fixed', 'gift', 'shipping']),
        discountValue: z.string(),
        minOrderAmount: z.string().optional(),
        maxDiscountAmount: z.string().optional(),
        validFrom: z.date().optional(),
        validTo: z.date().optional(),
        totalLimit: z.number().optional(),
        perUserLimit: z.number().optional(),
        dailyLimit: z.number().optional(),
        applicableScope: z.enum(['all', 'teabot', 'mall', 'category', 'product']).optional(),
        applicableIds: z.string().optional(),
        storeIds: z.string().optional(),
        isStackable: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin') throw new Error('Unauthorized');
        return await db.createCouponTemplate(input, ctx.user.id);
      }),
    updateTemplate: protectedProcedure
      .input(z.object({
        id: z.number(),
        nameZh: z.string().optional(),
        nameRu: z.string().optional(),
        nameEn: z.string().optional(),
        discountValue: z.string().optional(),
        minOrderAmount: z.string().optional(),
        maxDiscountAmount: z.string().optional(),
        validFrom: z.date().optional(),
        validTo: z.date().optional(),
        totalLimit: z.number().optional(),
        perUserLimit: z.number().optional(),
        dailyLimit: z.number().optional(),
        isActive: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin') throw new Error('Unauthorized');
        return await db.updateCouponTemplate(input, ctx.user.id);
      }),
    batchSend: protectedProcedure
      .input(z.object({
        templateId: z.number(),
        targetType: z.enum(['all', 'new', 'vip', 'inactive', 'specific']),
        userIds: z.array(z.number()).optional(),
        reason: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin') throw new Error('Unauthorized');
        return await db.batchSendCoupons(input, ctx.user.id);
      }),
  }),

  // 后台营销自动化规则
  adminMarketing: router({
    listRules: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== 'admin') throw new Error('Unauthorized');
      return await db.getMarketingRules();
    }),
    createRule: protectedProcedure
      .input(z.object({
        nameZh: z.string(),
        nameRu: z.string(),
        nameEn: z.string(),
        triggerType: z.enum(['register', 'birthday', 'inactive', 'first_order', 'order_count', 'total_spent']),
        triggerCondition: z.string().optional(),
        actionType: z.enum(['send_coupon', 'add_points', 'upgrade_level', 'send_notification']),
        actionParams: z.string(),
        isActive: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin') throw new Error('Unauthorized');
        return await db.createMarketingRule(input, ctx.user.id);
      }),
    updateRule: protectedProcedure
      .input(z.object({
        id: z.number(),
        nameZh: z.string().optional(),
        nameRu: z.string().optional(),
        nameEn: z.string().optional(),
        triggerCondition: z.string().optional(),
        actionParams: z.string().optional(),
        isActive: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin') throw new Error('Unauthorized');
        return await db.updateMarketingRule(input, ctx.user.id);
      }),
    deleteRule: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin') throw new Error('Unauthorized');
        return await db.deleteMarketingRule(input.id, ctx.user.id);
      }),
  }),

  // 后台 API 配置管理
  adminApiConfig: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== 'admin') throw new Error('Unauthorized');
      return await db.getApiConfigs();
    }),
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        apiKey: z.string().optional(),
        apiSecret: z.string().optional(),
        endpoint: z.string().optional(),
        isEnabled: z.boolean().optional(),
        settings: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin') throw new Error('Unauthorized');
        return await db.updateApiConfig(input, ctx.user.id);
      }),
    test: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin') throw new Error('Unauthorized');
        return await db.testApiConnection(input.id);
      }),
    setWebhook: protectedProcedure
      .input(z.object({ webhookUrl: z.string() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin') throw new Error('Unauthorized');
        const { setTelegramWebhook } = await import('./telegram');
        const success = await setTelegramWebhook(input.webhookUrl);
        return { success, message: success ? 'Webhook set successfully' : 'Failed to set webhook' };
      }),
    sendTestMessage: protectedProcedure
      .input(z.object({ chatId: z.string(), message: z.string() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin') throw new Error('Unauthorized');
        const { sendTelegramMessage } = await import('./telegram');
        return await sendTelegramMessage(input.chatId, input.message);
      }),
  }),

  // 后台操作日志
  adminLogs: router({
    list: protectedProcedure
      .input(z.object({
        module: z.string().optional(),
        action: z.string().optional(),
        userId: z.number().optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        limit: z.number().optional(),
        offset: z.number().optional(),
      }).optional())
      .query(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin') throw new Error('Unauthorized');
        return await db.getOperationLogs(input);
      }),
  }),

  // 后台人员管理
  adminUsers: router({
    list: protectedProcedure
      .input(z.object({
        role: z.enum(['admin', 'user']).optional(),
        search: z.string().optional(),
        limit: z.number().optional(),
        offset: z.number().optional(),
      }).optional())
      .query(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin') throw new Error('Unauthorized');
        return await db.getAdminUserList(input);
      }),
    updateRole: protectedProcedure
      .input(z.object({
        userId: z.number(),
        role: z.enum(['admin', 'user']),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin') throw new Error('Unauthorized');
        return await db.updateUserRole(input, ctx.user.id);
      }),
  }),

  // 后台门店管理
  adminStores: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== 'admin') throw new Error('Unauthorized');
      return await db.getAllStores();
    }),
    create: protectedProcedure
      .input(z.object({
        nameZh: z.string(),
        nameRu: z.string(),
        nameEn: z.string(),
        address: z.string(),
        city: z.string(),
        phone: z.string().optional(),
        latitude: z.string().optional(),
        longitude: z.string().optional(),
        openTime: z.string().optional(),
        closeTime: z.string().optional(),
        deliveryFee: z.string().optional(),
        minOrderAmount: z.string().optional(),
        iikoTerminalId: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin') throw new Error('Unauthorized');
        return await db.createStore(input, ctx.user.id);
      }),
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        nameZh: z.string().optional(),
        nameRu: z.string().optional(),
        nameEn: z.string().optional(),
        address: z.string().optional(),
        city: z.string().optional(),
        phone: z.string().optional(),
        latitude: z.string().optional(),
        longitude: z.string().optional(),
        openTime: z.string().optional(),
        closeTime: z.string().optional(),
        deliveryFee: z.string().optional(),
        minOrderAmount: z.string().optional(),
        isActive: z.boolean().optional(),
        iikoTerminalId: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin') throw new Error('Unauthorized');
        return await db.updateStore(input, ctx.user.id);
      }),
  }),

  // 后台商品管理
  adminProducts: router({
    list: protectedProcedure
      .input(z.object({
        categoryId: z.number().optional(),
        type: z.enum(['tea', 'mall']).optional(),
        isActive: z.boolean().optional(),
        search: z.string().optional(),
      }).optional())
      .query(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin') throw new Error('Unauthorized');
        return await db.getAdminProducts(input);
      }),
    create: protectedProcedure
      .input(z.object({
        sku: z.string(),
        nameZh: z.string(),
        nameRu: z.string(),
        nameEn: z.string(),
        descriptionZh: z.string().optional(),
        descriptionRu: z.string().optional(),
        descriptionEn: z.string().optional(),
        categoryId: z.number(),
        basePrice: z.string(),
        imageUrl: z.string().optional(),
        type: z.enum(['tea', 'mall']),
        isHot: z.boolean().optional(),
        isNew: z.boolean().optional(),
        pointsEarn: z.number().optional(),
        pointsRedeem: z.number().optional(),
        iikoProductId: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin') throw new Error('Unauthorized');
        return await db.createProduct(input);
      }),
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        sku: z.string().optional(),
        nameZh: z.string().optional(),
        nameRu: z.string().optional(),
        nameEn: z.string().optional(),
        descriptionZh: z.string().optional(),
        descriptionRu: z.string().optional(),
        descriptionEn: z.string().optional(),
        categoryId: z.number().optional(),
        basePrice: z.string().optional(),
        imageUrl: z.string().optional(),
        isActive: z.boolean().optional(),
        isHot: z.boolean().optional(),
        isNew: z.boolean().optional(),
        stock: z.number().optional(),
        pointsEarn: z.number().optional(),
        pointsRedeem: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin') throw new Error('Unauthorized');
        return await db.updateProduct(input);
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin') throw new Error('Unauthorized');
        return await db.deleteProduct(input.id);
      }),
  }),

  // 后台订单管理
  adminOrders: router({
    list: protectedProcedure
      .input(z.object({
        status: z.enum(['pending', 'paid', 'preparing', 'ready', 'delivering', 'completed', 'cancelled', 'refunding', 'refunded']).optional(),
        storeId: z.number().optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        search: z.string().optional(),
        limit: z.number().optional(),
        offset: z.number().optional(),
      }).optional())
      .query(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin') throw new Error('Unauthorized');
        return await db.getAdminOrders(input);
      }),
    updateStatus: protectedProcedure
      .input(z.object({
        orderId: z.number(),
        status: z.enum(['pending', 'paid', 'preparing', 'ready', 'delivering', 'completed', 'cancelled', 'refunding', 'refunded']),
        note: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin') throw new Error('Unauthorized');
        return await db.updateOrderStatus(input, ctx.user.id);
      }),
  }),

  // 后台通知管理
  adminNotifications: router({
    // 获取通知列表
    list: protectedProcedure
      .input(z.object({
        channel: z.enum(['system', 'telegram', 'email', 'sms']).optional(),
        status: z.enum(['pending', 'sent', 'delivered', 'failed', 'read']).optional(),
        priority: z.enum(['low', 'normal', 'high', 'urgent']).optional(),
        recipientType: z.enum(['admin', 'user']).optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        limit: z.number().optional(),
        offset: z.number().optional(),
      }).optional())
      .query(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin') throw new Error('Unauthorized');
        return await db.getNotificationHistory(input);
      }),
    
    // 获取未读通知数量
    unreadCount: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== 'admin') throw new Error('Unauthorized');
      return await db.getUnreadNotificationCount(ctx.user.id);
    }),
    
    // 获取管理员通知（用于铃铛组件）
    myNotifications: protectedProcedure
      .input(z.object({
        limit: z.number().optional(),
        unreadOnly: z.boolean().optional(),
      }).optional())
      .query(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin') throw new Error('Unauthorized');
        return await db.getAdminNotifications(ctx.user.id, input);
      }),
    
    // 标记通知为已读
    markAsRead: protectedProcedure
      .input(z.object({ notificationId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin') throw new Error('Unauthorized');
        return await db.markNotificationAsRead(input.notificationId, ctx.user.id);
      }),
    
    // 标记所有通知为已读
    markAllAsRead: protectedProcedure.mutation(async ({ ctx }) => {
      if (ctx.user.role !== 'admin') throw new Error('Unauthorized');
      return await db.markAllNotificationsAsRead(ctx.user.id);
    }),
    
    // 发送测试通知
    sendTest: protectedProcedure
      .input(z.object({
        channel: z.enum(['system', 'telegram']),
        title: z.string(),
        content: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin') throw new Error('Unauthorized');
        return await db.createNotification({
          recipientType: 'admin',
          recipientId: ctx.user.id,
          channel: input.channel,
          titleZh: input.title,
          titleRu: input.title,
          titleEn: input.title,
          contentZh: input.content,
          contentRu: input.content,
          contentEn: input.content,
          priority: 'normal',
          status: 'sent',
        });
      }),
    
    // 获取 Telegram 绑定状态
    getTelegramBinding: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== 'admin') throw new Error('Unauthorized');
      return await db.getAdminTelegramBinding(ctx.user.id);
    }),
    
    // 绑定/更新 Telegram
    bindTelegram: protectedProcedure
      .input(z.object({
        telegramChatId: z.string(),
        telegramUsername: z.string().optional(),
        notifyNewOrder: z.boolean().optional(),
        notifyPaymentFailed: z.boolean().optional(),
        notifyLowStock: z.boolean().optional(),
        notifySystemAlert: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin') throw new Error('Unauthorized');
        return await db.upsertAdminTelegramBinding({
          adminUserId: ctx.user.id,
          ...input,
        });
      }),
    
    // 验证 Telegram 绑定
    verifyTelegram: protectedProcedure
      .input(z.object({ code: z.string() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin') throw new Error('Unauthorized');
        return await db.verifyAdminTelegramBinding(ctx.user.id, input.code);
      }),
    
    // 更新通知设置
    updateSettings: protectedProcedure
      .input(z.object({
        notifyNewOrder: z.boolean().optional(),
        notifyPaymentFailed: z.boolean().optional(),
        notifyLowStock: z.boolean().optional(),
        notifySystemAlert: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin') throw new Error('Unauthorized');
        const binding = await db.getAdminTelegramBinding(ctx.user.id);
        if (!binding) throw new Error('Telegram not bound');
        return await db.upsertAdminTelegramBinding({
          adminUserId: ctx.user.id,
          telegramChatId: binding.telegramChatId,
          ...input,
        });
      }),
  }),

  // ==================== 商品配置管理 ====================
  productConfig: router({
    // 获取所有全局配置
    list: adminProcedure.query(async () => {
      return await db.getAllProductConfigs();
    }),

    // 根据配置键获取配置
    getByKey: publicProcedure
      .input(z.object({ configKey: z.string() }))
      .query(async ({ input }) => {
        return await db.getProductConfigByKey(input.configKey);
      }),

    // 创建全局配置
    create: adminProcedure
      .input(z.object({
        configKey: z.string(),
        nameZh: z.string(),
        nameRu: z.string(),
        nameEn: z.string(),
        configType: z.enum(['sugar', 'ice', 'size', 'topping', 'other']),
        configValue: z.any(),
        isActive: z.boolean().optional(),
        sortOrder: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        return await db.createProductConfig(input);
      }),

    // 更新全局配置
    update: adminProcedure
      .input(z.object({
        id: z.number(),
        nameZh: z.string().optional(),
        nameRu: z.string().optional(),
        nameEn: z.string().optional(),
        configValue: z.any().optional(),
        isActive: z.boolean().optional(),
        sortOrder: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateProductConfig(id, data);
        return { success: true };
      }),

    // 删除全局配置
    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteProductConfig(input.id);
        return { success: true };
      }),

    // 获取商品的配置（合并全局配置和商品特定配置）
    getMerged: publicProcedure
      .input(z.object({ productId: z.number() }))
      .query(async ({ input }) => {
        return await db.getProductConfigMerged(input.productId);
      }),

    // 设置商品特定配置
    setProductConfig: adminProcedure
      .input(z.object({
        productId: z.number(),
        configKey: z.string(),
        configValue: z.any(),
        isActive: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        await db.setProductOptionConfig(input);
        return { success: true };
      }),

    // 删除商品特定配置
    deleteProductConfig: adminProcedure
      .input(z.object({
        productId: z.number(),
        configKey: z.string(),
      }))
      .mutation(async ({ input }) => {
        await db.deleteProductOptionConfig(input.productId, input.configKey);
        return { success: true };
      }),

    // 初始化默认配置
    initDefaults: adminProcedure.mutation(async () => {
      await db.initDefaultProductConfigs();
      return { success: true };
    }),
  }),

  // ==================== 用户通知偏好管理 ====================
  notificationPreferences: router({
    // 获取当前用户的通知偏好
    get: protectedProcedure
      .query(async ({ ctx }) => {
        return await db.getUserNotificationPreferences(ctx.user.id);
      }),

    // 更新当前用户的通知偏好
    update: protectedProcedure
      .input(z.object({
        orderStatusEnabled: z.boolean().optional(),
        promotionEnabled: z.boolean().optional(),
        systemMessageEnabled: z.boolean().optional(),
        marketingEnabled: z.boolean().optional(),
        shippingEnabled: z.boolean().optional(),
        channelTelegram: z.boolean().optional(),
        channelEmail: z.boolean().optional(),
        channelSms: z.boolean().optional(),
        quietHoursStart: z.string().nullable().optional(),
        quietHoursEnd: z.string().nullable().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return await db.updateUserNotificationPreferences(ctx.user.id, input);
      }),
  }),

  // ==================== 管理员 - 优惠券管理 ====================
  adminCoupon: router({
    // 获取所有优惠券模板
    listTemplates: adminProcedure
      .query(async () => {
        return await db.getAllCouponTemplates();
      }),

    // 创建优惠券模板
    createTemplate: adminProcedure
      .input(z.object({
        code: z.string(),
        nameZh: z.string(),
        nameRu: z.string(),
        nameEn: z.string(),
        descriptionZh: z.string().optional(),
        descriptionRu: z.string().optional(),
        descriptionEn: z.string().optional(),
        type: z.enum(['fixed', 'percent', 'product', 'gift', 'buy_one_get_one', 'free_product']),
        value: z.string(),
        minOrderAmount: z.string().optional(),
        maxDiscount: z.string().optional(),
        applicableProducts: z.array(z.number()).optional(),
        applicableCategories: z.array(z.number()).optional(),
        applicableStores: z.array(z.number()).optional(),
        excludeProducts: z.array(z.number()).optional(),
        stackable: z.boolean().optional(),
        totalQuantity: z.number().optional(),
        perUserLimit: z.number().optional(),
        validDays: z.number().optional(),
        startAt: z.string().optional(),
        endAt: z.string().optional(),
        isActive: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return await db.createCouponTemplate(input, ctx.user.id);
      }),

    // 更新优惠券模板
    updateTemplate: adminProcedure
      .input(z.object({
        id: z.number(),
        code: z.string().optional(),
        nameZh: z.string().optional(),
        nameRu: z.string().optional(),
        nameEn: z.string().optional(),
        descriptionZh: z.string().optional(),
        descriptionRu: z.string().optional(),
        descriptionEn: z.string().optional(),
        type: z.enum(['fixed', 'percent', 'product', 'gift', 'buy_one_get_one', 'free_product']).optional(),
        value: z.string().optional(),
        minOrderAmount: z.string().optional(),
        maxDiscount: z.string().optional(),
        applicableProducts: z.array(z.number()).optional(),
        applicableCategories: z.array(z.number()).optional(),
        applicableStores: z.array(z.number()).optional(),
        excludeProducts: z.array(z.number()).optional(),
        stackable: z.boolean().optional(),
        totalQuantity: z.number().optional(),
        perUserLimit: z.number().optional(),
        validDays: z.number().optional(),
        startAt: z.string().optional(),
        endAt: z.string().optional(),
        isActive: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return await db.updateCouponTemplate(input, ctx.user.id);
      }),

    // 删除优惠券模板
    deleteTemplate: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        return await db.deleteCouponTemplate(input.id, ctx.user.id);
      }),

    // 批量发放优惠券
    batchSend: adminProcedure
      .input(z.object({
        templateId: z.number(),
        targetType: z.enum(['all', 'new', 'vip', 'inactive', 'specific']),
        userIds: z.array(z.number()).optional(),
        reason: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return await db.batchSendCoupons(input, ctx.user.id);
      }),
  }),

  // ==================== 营销触发器管理 ====================
  marketingTrigger: router({
    // 获取触发器列表
    list: adminProcedure
      .input(z.object({
        isActive: z.boolean().optional(),
        triggerType: z.string().optional(),
      }).optional())
      .query(async ({ input }) => {
        return await db.getMarketingTriggers(input);
      }),

    // 获取触发器详情
    getById: adminProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getMarketingTriggerById(input.id);
      }),

    // 创建触发器
    create: adminProcedure
      .input(z.object({
        name: z.string(),
        triggerType: z.enum(['user_register', 'first_order', 'order_amount', 'user_inactive', 'birthday', 'time_based']),
        conditions: z.any(),
        action: z.enum(['send_coupon', 'send_notification', 'add_points']),
        actionConfig: z.any(),
        isActive: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        return await db.createMarketingTrigger(input);
      }),

    // 更新触发器
    update: adminProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        triggerType: z.enum(['user_register', 'first_order', 'order_amount', 'user_inactive', 'birthday', 'time_based']).optional(),
        conditions: z.any().optional(),
        action: z.enum(['send_coupon', 'send_notification', 'add_points']).optional(),
        actionConfig: z.any().optional(),
        isActive: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        return await db.updateMarketingTrigger(id, data);
      }),

    // 删除触发器
    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return await db.deleteMarketingTrigger(input.id);
      }),

    // 获取执行历史
    getExecutions: adminProcedure
      .input(z.object({
        triggerId: z.number().optional(),
        userId: z.number().optional(),
        status: z.enum(['success', 'failed']).optional(),
        limit: z.number().optional(),
        offset: z.number().optional(),
      }).optional())
      .query(async ({ input }) => {
        return await db.getTriggerExecutions(input || {});
      }),
    
    getExecutionStats: adminProcedure
      .input(z.object({
        triggerId: z.number(),
      }))
      .query(async ({ input }) => {
        return await db.getTriggerExecutionStats(input.triggerId);
      }),
    
    // 获取模板列表
    getTemplates: adminProcedure
      .input(z.object({
        category: z.enum(['user_lifecycle', 'engagement', 'retention', 'promotion']).optional(),
      }).optional())
      .query(async ({ input }) => {
        const { triggerTemplates, getTemplatesByCategory } = await import('./config/triggerTemplates');
        if (input?.category) {
          return getTemplatesByCategory(input.category);
        }
        return triggerTemplates;
      }),
    
    // 获取模板分类
    getTemplateCategories: adminProcedure
      .query(async () => {
        const { getTemplateCategories } = await import('./config/triggerTemplates');
        return getTemplateCategories();
      }),
    
    // 从模板创建触发器
    createFromTemplate: adminProcedure
      .input(z.object({
        templateId: z.string(),
        name: z.string().optional(), // 可选：覆盖模板名称
        actionConfig: z.any().optional(), // 可选：覆盖动作配置（如选择优惠券模板ID）
      }))
      .mutation(async ({ input }) => {
        const { getTemplateById } = await import('./config/triggerTemplates');
        const template = getTemplateById(input.templateId);
        
        if (!template) {
          throw new Error('模板不存在');
        }
        
        // 合并配置
        const triggerData = {
          name: input.name || template.name,
          triggerType: template.triggerType,
          conditions: template.conditions,
          action: template.action,
          actionConfig: input.actionConfig || template.actionConfig,
          isActive: template.isActive,
        };
        
        return await db.createMarketingTrigger(triggerData);
      }),
    
    // 获取触发器效果统计
    getPerformance: adminProcedure
      .input(z.object({
        triggerId: z.number(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      }))
      .query(async ({ input }) => {
        const { getTriggerPerformance } = await import('./db/marketingAnalytics');
        return await getTriggerPerformance(input.triggerId, {
          startDate: input.startDate ? new Date(input.startDate) : undefined,
          endDate: input.endDate ? new Date(input.endDate) : undefined,
        });
      }),
    
    // 获取所有触发器效果排名
    getPerformanceRanking: adminProcedure
      .input(z.object({
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        limit: z.number().optional(),
      }).optional())
      .query(async ({ input }) => {
        const { getTriggerPerformanceRanking } = await import('./db/marketingAnalytics');
        return await getTriggerPerformanceRanking({
          startDate: input?.startDate ? new Date(input.startDate) : undefined,
          endDate: input?.endDate ? new Date(input.endDate) : undefined,
          limit: input?.limit,
        });
      }),
    
    // 获取触发器效果趋势数据
    getTrends: adminProcedure
      .input(z.object({
        triggerId: z.number().optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      }).optional())
      .query(async ({ input }) => {
        const { getTriggerTrends } = await import('./db/marketingTrends');
        return await getTriggerTrends({
          triggerId: input?.triggerId,
          startDate: input?.startDate,
          endDate: input?.endDate,
        });
      }),
    
    // 获取触发器执行趋势数据
    getExecutionTrends: adminProcedure
      .input(z.object({
        triggerId: z.number().optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      }).optional())
      .query(async ({ input }) => {
        const { getTriggerExecutionTrends } = await import('./db/marketingTrends');
        return await getTriggerExecutionTrends({
          triggerId: input?.triggerId,
          startDate: input?.startDate,
          endDate: input?.endDate,
        });
      }),
    
    // 获取分组对比数据
    getGroupComparison: adminProcedure
      .input(z.object({
        groupTag: z.string(),
      }))
      .query(async ({ input }) => {
        const { getGroupComparison } = await import('./db/abTesting');
        return await getGroupComparison(input.groupTag);
      }),
    
    // 获取所有分组标签
    getGroupTags: adminProcedure
      .query(async () => {
        const { getGroupTags } = await import('./db/abTesting');
        return await getGroupTags();
      }),
    
    // 获取执行时间线
    getExecutionTimeline: adminProcedure
      .input(z.object({
        days: z.number().optional(),
      }).optional())
      .query(async ({ input }) => {
        const { getExecutionTimeline } = await import('./db/executionTimeline');
        return await getExecutionTimeline(input?.days);
      }),
    
    // 获取指定日期的执行详情
    getDateExecutionDetails: adminProcedure
      .input(z.object({
        date: z.string(),
      }))
      .query(async ({ input }) => {
        const { getDateExecutionDetails } = await import('./db/executionTimeline');
        return await getDateExecutionDetails(input.date);
      }),
    
    // 预览触发器执行
    previewExecution: adminProcedure
      .input(z.object({
        triggerType: z.string(),
        triggerCondition: z.any(),
        actionType: z.string(),
        actionParams: z.any(),
      }))
      .query(async ({ input }) => {
        const { previewTriggerExecution } = await import('./db/triggerPreview');
        return await previewTriggerExecution(input);
      }),
    
    // 导出营销报告
    exportReport: adminProcedure
      .input(z.object({
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        limit: z.number().optional(),
      }).optional())
      .mutation(async ({ input }) => {
        const { exportMarketingReport } = await import('./db/marketingExport');
        const buffer = await exportMarketingReport(input || {});
        return {
          data: Buffer.from(buffer).toString('base64'),
          filename: `marketing-report-${new Date().toISOString().split('T')[0]}.xlsx`,
        };
      }),
    
    // 导出A/B测试报告
    exportABTest: adminProcedure
      .input(z.object({
        groupTag: z.string(),
      }))
      .mutation(async ({ input }) => {
        const { exportABTestReport } = await import('./db/marketingExport');
        const buffer = await exportABTestReport(input.groupTag);
        return {
          data: Buffer.from(buffer).toString('base64'),
          filename: `ab-test-${input.groupTag}-${new Date().toISOString().split('T')[0]}.xlsx`,
        };
      }),
  }),
});

export type AppRouter = typeof appRouter;
