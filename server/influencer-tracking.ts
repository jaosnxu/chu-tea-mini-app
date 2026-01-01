/**
 * 达人链接追踪系统
 * 负责生成专属推广链接、追踪点击和订单归因
 */

import { Request, Response, NextFunction } from "express";
import * as db from "./db.js";
import {
  users,
  influencerCampaigns,
  linkClicks,
  orderAttribution,
  influencerEarnings,
} from "../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";

/**
 * 生成达人专属推广链接
 */
export async function generateInfluencerLink(
  userId: number,
  campaignId?: number
): Promise<string> {
  const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  
  if (!user[0]) {
    throw new Error("User not found");
  }

  let influencerCode = user[0].influencerCode;
  
  if (!influencerCode) {
    influencerCode = `INF${userId}${Date.now().toString(36).toUpperCase()}`;
    await db.update(users)
      .set({ influencerCode, isInfluencer: true })
      .where(eq(users.id, userId));
  }

  const baseUrl = process.env.VITE_APP_URL || "https://chu-tea.com";
  const params = new URLSearchParams({
    ref: influencerCode,
    ...(campaignId && { campaign: campaignId.toString() }),
  });

  return `${baseUrl}?${params.toString()}`;
}

/**
 * 订单归因
 */
export async function attributeOrder(
  orderId: number,
  orderAmount: number,
  refCode?: string,
  campaignId?: string
): Promise<void> {
  if (!refCode) return;

  const influencer = await db
    .select()
    .from(users)
    .where(eq(users.influencerCode, refCode))
    .limit(1);

  if (!influencer[0]) return;

  let commissionAmount = 0;
  
  if (campaignId) {
    const campaign = await db
      .select()
      .from(influencerCampaigns)
      .where(eq(influencerCampaigns.id, parseInt(campaignId)))
      .limit(1);

    if (campaign[0] && campaign[0].commissionConfig) {
      const config = campaign[0].commissionConfig as any;
      
      if (config.minOrder && orderAmount < config.minOrder) {
        return;
      }

      if (config.type === "percentage") {
        commissionAmount = (orderAmount * config.value) / 100;
      } else if (config.type === "fixed") {
        commissionAmount = config.value;
      }

      if (config.maxCommission && commissionAmount > config.maxCommission) {
        commissionAmount = config.maxCommission;
      }
    }
  }

  await db.insert(orderAttribution).values({
    orderId,
    influencerId: influencer[0].id,
    campaignId: campaignId ? parseInt(campaignId) : null,
    linkCode: refCode,
    orderAmount: orderAmount.toString(),
    commissionAmount: commissionAmount.toString(),
    attributionModel: "last_click",
  });

  if (commissionAmount > 0) {
    await db.insert(influencerEarnings).values({
      userId: influencer[0].id,
      campaignId: campaignId ? parseInt(campaignId) : null,
      orderId,
      earningType: "commission",
      amount: commissionAmount.toString(),
      orderAmount: orderAmount.toString(),
      commissionRate: campaignId ? ((commissionAmount / orderAmount) * 100).toString() : null,
      status: "pending",
    });

    await db
      .update(users)
      .set({
        totalEarnings: (parseFloat(influencer[0].totalEarnings || "0") + commissionAmount).toFixed(2),
        availableBalance: (parseFloat(influencer[0].availableBalance || "0") + commissionAmount).toFixed(2),
      })
      .where(eq(users.id, influencer[0].id));
  }
}
