import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { iikoRouter } from "./routers/iiko.js";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";

export const appRouter = router({
  system: systemRouter,
  iiko: iikoRouter,
  
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

  // 支付路由
  payment: router({
    create: protectedProcedure
      .input(z.object({
        orderId: z.number(),
        amount: z.string(),
        currency: z.string().optional().default('RUB'),
        description: z.string(),
        returnUrl: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        const yookassa = await import('./yookassa');
        return await yookassa.createPayment({
          orderId: input.orderId,
          amount: input.amount,
          currency: input.currency,
          description: input.description,
          returnUrl: input.returnUrl,
          metadata: {
            userId: ctx.user.id,
            orderId: input.orderId,
          },
        });
      }),
    getStatus: protectedProcedure
      .input(z.object({ paymentId: z.string() }))
      .query(async ({ input }) => {
        const yookassa = await import('./yookassa');
        return await yookassa.getPaymentStatus(input.paymentId);
      }),
    getByOrderId: protectedProcedure
      .input(z.object({ orderId: z.number() }))
      .query(async ({ input }) => {
        return await db.getPaymentByOrderId(input.orderId);
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
        return await db.createProduct(input, ctx.user.id);
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
        return await db.updateProduct(input, ctx.user.id);
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin') throw new Error('Unauthorized');
        return await db.deleteProduct(input.id, ctx.user.id);
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
});

export type AppRouter = typeof appRouter;
