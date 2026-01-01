import * as influencerDb from "../db/influencer";
import { getDb } from "../db";
import { orders } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

/**
 * 处理订单归因和佣金计算
 * 在订单创建时调用
 */
export async function attributeOrderToInfluencer(
  orderId: number,
  linkCode: string
) {
  try {
    // 解析链接代码获取达人 ID
    const parts = linkCode.split("-");
    if (parts.length < 3) {
      console.warn("[Attribution] Invalid link code format:", linkCode);
      return;
    }

    const influencerId = parseInt(parts[0]);
    if (isNaN(influencerId)) {
      console.warn("[Attribution] Invalid influencer ID:", parts[0]);
      return;
    }

    // 获取订单信息
    const db = await getDb();
    if (!db) {
      console.error("[Attribution] Database not available");
      return;
    }

    const [order] = await db
      .select()
      .from(orders)
      .where(eq(orders.id, orderId));

    if (!order) {
      console.error("[Attribution] Order not found:", orderId);
      return;
    }

    // 获取达人信息
    const influencer = await influencerDb.getInfluencerInfo(influencerId);
    if (!influencer) {
      console.warn("[Attribution] Influencer not found:", influencerId);
      return;
    }

    // 查找达人参与的活动（这里简化处理，实际应该根据活动时间和状态筛选）
    const campaigns = await influencerDb.getAllCampaigns("active");
    if (!campaigns || campaigns.length === 0) {
      console.warn("[Attribution] No active campaigns found");
      return;
    }

    // 使用第一个活跃的活动（实际应该根据商品、时间等条件匹配）
    const campaign = campaigns[0];

    // 计算佣金
    const orderAmount = parseFloat(order.totalAmount);
    let commissionAmount = 0;

    if (campaign.commissionConfig.type === "percentage") {
      commissionAmount = (orderAmount * campaign.commissionConfig.value) / 100;
    } else {
      commissionAmount = campaign.commissionConfig.value;
    }

    // 检查最低订单金额要求
    if (
      campaign.commissionConfig.minOrder &&
      orderAmount < campaign.commissionConfig.minOrder
    ) {
      console.warn(
        "[Attribution] Order amount below minimum:",
        orderAmount,
        campaign.commissionConfig.minOrder
      );
      return;
    }

    // 检查最大佣金限制
    if (
      campaign.commissionConfig.maxCommission &&
      commissionAmount > campaign.commissionConfig.maxCommission
    ) {
      commissionAmount = campaign.commissionConfig.maxCommission;
    }

    // 创建订单归因记录
    await influencerDb.createOrderAttribution({
      orderId,
      influencerId,
      campaignId: campaign.id,
      linkCode,
      orderAmount: orderAmount.toString(),
      commissionAmount: commissionAmount.toString(),
      attributionModel: "last_click",
    });

    // 创建收益记录
    await influencerDb.createEarning({
      userId: influencerId,
      campaignId: campaign.id,
      orderId,
      earningType: "commission",
      amount: commissionAmount.toString(),
      orderAmount: orderAmount.toString(),
      commissionRate: campaign.commissionConfig.value.toString(),
      status: "pending", // 待确认状态，订单完成后才确认
    });

    console.log(
      `[Attribution] Order ${orderId} attributed to influencer ${influencerId}, commission: ${commissionAmount}`
    );
  } catch (error) {
    console.error("[Attribution] Error:", error);
  }
}

/**
 * 确认订单收益
 * 在订单完成时调用
 */
export async function confirmOrderEarning(orderId: number) {
  try {
    // 获取订单归因信息
    const attribution = await influencerDb.getOrderAttribution(orderId);
    if (!attribution) {
      return; // 不是达人推广的订单
    }

    // 获取收益记录并确认
    const db = await getDb();
    if (!db) {
      console.error("[Attribution] Database not available");
      return;
    }

    const { influencerEarnings } = await import("../../drizzle/schema");
    const { eq, and } = await import("drizzle-orm");

    await db
      .update(influencerEarnings)
      .set({ status: "confirmed" })
      .where(
        and(
          eq(influencerEarnings.orderId, orderId),
          eq(influencerEarnings.status, "pending")
        )
      );

    console.log(`[Attribution] Order ${orderId} earning confirmed`);
  } catch (error) {
    console.error("[Attribution] Error confirming earning:", error);
  }
}

/**
 * 取消订单收益
 * 在订单取消或退款时调用
 */
export async function cancelOrderEarning(orderId: number) {
  try {
    // 获取订单归因信息
    const attribution = await influencerDb.getOrderAttribution(orderId);
    if (!attribution) {
      return; // 不是达人推广的订单
    }

    // 删除收益记录并退回余额
    const db = await getDb();
    if (!db) {
      console.error("[Attribution] Database not available");
      return;
    }

    const { influencerEarnings, users } = await import("../../drizzle/schema");
    const { eq, and, sql } = await import("drizzle-orm");

    // 获取收益记录
    const [earning] = await db
      .select()
      .from(influencerEarnings)
      .where(eq(influencerEarnings.orderId, orderId));

    if (earning && earning.status === "confirmed") {
      // 扣除已确认的收益
      await db
        .update(users)
        .set({
          totalEarnings: sql`${users.totalEarnings} - ${earning.amount}`,
          availableBalance: sql`${users.availableBalance} - ${earning.amount}`,
        })
        .where(eq(users.id, earning.userId));
    }

    // 删除收益记录
    await db
      .delete(influencerEarnings)
      .where(eq(influencerEarnings.orderId, orderId));

    console.log(`[Attribution] Order ${orderId} earning cancelled`);
  } catch (error) {
    console.error("[Attribution] Error cancelling earning:", error);
  }
}
