/**
 * 营销触发器执行引擎
 * 
 * 架构设计：
 * 1. 事件驱动：用户行为触发事件 → 引擎匹配触发器 → 执行动作
 * 2. 策略模式：不同触发器类型使用独立的匹配策略
 * 3. 异步执行：不阻塞主流程
 * 4. 防重复：同一用户同一触发器在短时间内只执行一次
 */

import * as db from './db';

// 触发器匹配策略接口
interface TriggerStrategy {
  match(trigger: any, context: TriggerContext): boolean;
}

// 触发上下文
interface TriggerContext {
  userId: number;
  eventType: 'user_register' | 'order_created' | 'order_completed';
  eventData?: any;
}

// 用户注册触发器策略
class UserRegisterStrategy implements TriggerStrategy {
  match(trigger: any, context: TriggerContext): boolean {
    if (trigger.triggerType !== 'user_register') return false;
    return context.eventType === 'user_register';
  }
}

// 首单完成触发器策略
class FirstOrderStrategy implements TriggerStrategy {
  match(trigger: any, context: TriggerContext): boolean {
    if (trigger.triggerType !== 'first_order') return false;
    if (context.eventType !== 'order_completed') return false;
    
    // 检查是否是首单
    const orderCount = context.eventData?.userOrderCount || 0;
    return orderCount === 1;
  }
}

// 消费金额达标触发器策略
class OrderAmountStrategy implements TriggerStrategy {
  match(trigger: any, context: TriggerContext): boolean {
    if (trigger.triggerType !== 'order_amount') return false;
    if (context.eventType !== 'order_completed') return false;
    
    const minAmount = parseFloat(trigger.conditions?.minAmount || '0');
    const orderAmount = parseFloat(context.eventData?.orderAmount || '0');
    
    return orderAmount >= minAmount;
  }
}

// 策略工厂
class StrategyFactory {
  private static strategies: Map<string, TriggerStrategy> = new Map([
    ['user_register', new UserRegisterStrategy()],
    ['first_order', new FirstOrderStrategy()],
    ['order_amount', new OrderAmountStrategy()],
  ]);
  
  static getStrategy(triggerType: string): TriggerStrategy | null {
    return this.strategies.get(triggerType) || null;
  }
}

// 触发器执行引擎
export class TriggerEngine {
  private static instance: TriggerEngine;
  private static executionCache: Map<string, number> = new Map();
  private static CACHE_TTL = 60 * 60 * 1000; // 1小时防重复
  
  /**
   * 获取单例实例
   */
  public static getInstance(): TriggerEngine {
    if (!TriggerEngine.instance) {
      TriggerEngine.instance = new TriggerEngine();
    }
    return TriggerEngine.instance;
  }
  
  /**
   * 处理事件并执行匹配的触发器
   */
  static async handleEvent(context: TriggerContext): Promise<void> {
    try {
      // 获取所有激活的触发器
      const triggers = await db.getMarketingTriggers({ isActive: true });
      
      // 匹配并执行触发器
      for (const trigger of triggers) {
        // 检查是否已经执行过（防重复）
        if (this.isRecentlyExecuted(trigger.id, context.userId)) {
          continue;
        }
        
        // 获取匹配策略
        const strategy = StrategyFactory.getStrategy(trigger.triggerType);
        if (!strategy) continue;
        
        // 检查是否匹配
        if (strategy.match(trigger, context)) {
          // 异步执行动作
          this.executeAction(trigger, context.userId).catch(err => {
            console.error(`[TriggerEngine] Failed to execute trigger ${trigger.id}:`, err);
          });
        }
      }
    } catch (error) {
      console.error('[TriggerEngine] Error handling event:', error);
    }
  }
  
  /**
   * 执行触发器动作
   */
  private static async executeAction(trigger: any, userId: number, campaignId?: string): Promise<void> {
    try {
      // 检查预算
      if (trigger.budget !== null && trigger.budget !== undefined) {
        const spent = Number(trigger.spent || 0);
        const budget = Number(trigger.budget);
        if (spent >= budget) {
          console.log(`[TriggerEngine] Trigger ${trigger.id} budget exceeded`);
          await db.updateMarketingTrigger(trigger.id, { isActive: false });
          throw new Error(`Budget exceeded for trigger ${trigger.id}`);
        }
      }
      
      // 执行动作
      let result: any;
      // 生成 campaignId（如果没有提供）
      const finalCampaignId = campaignId || `trigger_${trigger.id}_${Date.now()}`;
      
      switch (trigger.action) {
        case 'send_coupon':
          result = await this.sendCoupon(userId, trigger.actionConfig, finalCampaignId);
          break;
        case 'send_notification':
          result = await this.sendNotification(userId, trigger.actionConfig);
          break;
        case 'add_points':
          result = await this.addPoints(userId, trigger.actionConfig);
          break;
        default:
          throw new Error(`Unknown action: ${trigger.action}`);
      }
      
      // 记录执行成功
      await db.recordTriggerExecution({
        triggerId: trigger.id,
        userId,
        status: 'success',
        result,
      });
      
      // 更新预算消耗
      if (trigger.action === 'send_coupon' && trigger.budget !== null) {
        await this.updateBudgetSpent(trigger.id, trigger.actionConfig);
      }
      
      // 标记为已执行
      this.markAsExecuted(trigger.id, userId);
      
      console.log(`[TriggerEngine] Executed trigger ${trigger.id} for user ${userId}`);
    } catch (error: any) {
      // 记录执行失败
      await db.recordTriggerExecution({
        triggerId: trigger.id,
        userId,
        status: 'failed',
        errorMessage: error.message,
      });
      
      throw error;
    }
  }
  
  /**
   * 发放优惠券
   */
  private static async sendCoupon(userId: number, config: any, campaignId: string): Promise<any> {
    const couponTemplateId = config.couponTemplateId;
    if (!couponTemplateId) {
      throw new Error('Missing couponTemplateId in actionConfig');
    }
    
    const result = await db.claimCoupon(userId, couponTemplateId, campaignId);
    return { couponId: result.couponId };
  }
  
  /**
   * 发送通知
   */
  private static async sendNotification(userId: number, config: any): Promise<any> {
    // TODO: 实现通知发送逻辑
    console.log(`[TriggerEngine] Send notification to user ${userId}:`, config.message);
    return { sent: true };
  }
  
  /**
   * 赠送积分
   */
  private static async addPoints(userId: number, config: any): Promise<any> {
    const points = config.points || 0;
    if (points <= 0) {
      throw new Error('Invalid points value');
    }
    
    // TODO: 实现积分增加逻辑
    console.log(`[TriggerEngine] Add ${points} points to user ${userId}`);
    return { points };
  }
  
  /**
   * 检查是否最近已执行
   */
  private static isRecentlyExecuted(triggerId: number, userId: number): boolean {
    const key = `${triggerId}-${userId}`;
    const lastExecution = this.executionCache.get(key);
    
    if (!lastExecution) return false;
    
    const now = Date.now();
    return (now - lastExecution) < this.CACHE_TTL;
  }
  
  /**
   * 标记为已执行
   */
  private static markAsExecuted(triggerId: number, userId: number): void {
    const key = `${triggerId}-${userId}`;
    this.executionCache.set(key, Date.now());
    
    // 定期清理过期缓存
    if (this.executionCache.size > 10000) {
      this.cleanupCache();
    }
  }
  
  /**
   * 更新预算消耗
   */
  private static async updateBudgetSpent(triggerId: number, actionConfig: any): Promise<void> {
    try {
      const couponTemplateId = actionConfig.couponTemplateId;
      if (!couponTemplateId) return;
      
      const templates = await db.getAllCouponTemplates();
      const template = templates.find((t: any) => t.id === couponTemplateId);
      if (!template) return;
      
      const cost = Number(template.value || 0);
      await db.incrementTriggerSpent(triggerId, cost);
      
      console.log(`[TriggerEngine] Updated budget spent for trigger ${triggerId}: +${cost}`);
    } catch (error) {
      console.error('[TriggerEngine] Error updating budget spent:', error);
    }
  }
  
  /**
   * 清理过期缓存
   */
  private static cleanupCache(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];
    
    this.executionCache.forEach((timestamp, key) => {
      if ((now - timestamp) > this.CACHE_TTL) {
        keysToDelete.push(key);
      }
    });
    
    keysToDelete.forEach(key => this.executionCache.delete(key));
  }
  
  /**
   * 处理用户流失事件
   */
  public async handleUserChurn(userId: number, daysInactive: number): Promise<void> {
    try {
      const triggers = await db.getMarketingTriggers({ isActive: true });
      
      for (const trigger of triggers) {
        if (trigger.triggerType !== 'user_churn') continue;
        
        const triggerDays = (trigger.conditions as any)?.daysInactive || 30;
        if (daysInactive < triggerDays) continue;
        
        if (TriggerEngine.isRecentlyExecuted(trigger.id, userId)) continue;
        
        await TriggerEngine.executeAction(trigger, userId);
      }
    } catch (error) {
      console.error('[TriggerEngine] Error handling user churn:', error);
    }
  }
  
  /**
   * 处理用户生日事件
   */
  public async handleUserBirthday(userId: number): Promise<void> {
    try {
      const triggers = await db.getMarketingTriggers({ isActive: true });
      
      for (const trigger of triggers) {
        if (trigger.triggerType !== 'user_birthday') continue;
        
        if (TriggerEngine.isRecentlyExecuted(trigger.id, userId)) continue;
        
        await TriggerEngine.executeAction(trigger, userId);
      }
    } catch (error) {
      console.error('[TriggerEngine] Error handling user birthday:', error);
    }
  }
  
  /**
   * 执行触发器（通用方法）
   */
  public async executeTrigger(trigger: any, userId: number, context: any): Promise<void> {
    try {
      if (TriggerEngine.isRecentlyExecuted(trigger.id, userId)) {
        console.log(`[TriggerEngine] Trigger ${trigger.id} recently executed for user ${userId}, skipping`);
        return;
      }
      
      await TriggerEngine.executeAction(trigger, userId);
    } catch (error) {
      console.error('[TriggerEngine] Error executing trigger:', error);
    }
  }
}

// 导出便捷方法
export async function triggerUserRegister(userId: number): Promise<void> {
  await TriggerEngine.handleEvent({
    userId,
    eventType: 'user_register',
  });
}

export async function triggerOrderCompleted(userId: number, orderData: {
  orderAmount: number;
  userOrderCount: number;
}): Promise<void> {
  await TriggerEngine.handleEvent({
    userId,
    eventType: 'order_completed',
    eventData: orderData,
  });
}
