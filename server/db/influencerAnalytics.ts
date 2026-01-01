import { getDb } from "../db";
import { sql } from "drizzle-orm";

/**
 * 获取达人系统的时间趋势数据
 */
export async function getInfluencerTrends(params: {
  period: "day" | "week" | "month";
  days: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const { period, days } = params;

  // 根据时间范围确定分组格式
  let dateFormat: string;
  switch (period) {
    case "day":
      dateFormat = "%Y-%m-%d";
      break;
    case "week":
      dateFormat = "%Y-%u"; // 年-周数
      break;
    case "month":
      dateFormat = "%Y-%m";
      break;
    default:
      dateFormat = "%Y-%m-%d";
  }

  // 计算起始日期
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  // 查询订单趋势数据
  const orderTrends = await db.execute(sql`
    SELECT 
      DATE_FORMAT(oa.created_at, ${dateFormat}) as date,
      COUNT(DISTINCT oa.order_id) as order_count,
      SUM(oa.order_amount) as total_revenue,
      SUM(oa.commission_amount) as total_commission
    FROM order_attribution oa
    WHERE oa.created_at >= ${startDate.toISOString()}
    GROUP BY DATE_FORMAT(oa.created_at, ${dateFormat})
    ORDER BY date ASC
  `);

  // 查询新增达人趋势
  const influencerTrends = await db.execute(sql`
    SELECT 
      DATE_FORMAT(u.created_at, ${dateFormat}) as date,
      COUNT(DISTINCT u.id) as new_influencers
    FROM users u
    WHERE u.is_influencer = 1 
      AND u.created_at >= ${startDate.toISOString()}
    GROUP BY DATE_FORMAT(u.created_at, ${dateFormat})
    ORDER BY date ASC
  `);

  // 查询链接点击趋势
  const clickTrends = await db.execute(sql`
    SELECT 
      DATE_FORMAT(lc.created_at, ${dateFormat}) as date,
      COUNT(*) as click_count,
      COUNT(DISTINCT lc.link_code) as unique_links
    FROM link_clicks lc
    WHERE lc.created_at >= ${startDate.toISOString()}
    GROUP BY DATE_FORMAT(lc.created_at, ${dateFormat})
    ORDER BY date ASC
  `);

  return {
    orderTrends: ((orderTrends as any).rows || orderTrends) as Array<{
      date: string;
      order_count: number;
      total_revenue: string;
      total_commission: string;
    }>,
    influencerTrends: ((influencerTrends as any).rows || influencerTrends) as Array<{
      date: string;
      new_influencers: number;
    }>,
    clickTrends: ((clickTrends as any).rows || clickTrends) as Array<{
      date: string;
      click_count: number;
      unique_links: number;
    }>,
  };
}

/**
 * 获取达人系统的总体统计数据
 */
export async function getInfluencerOverallStats() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const stats = await db.execute(sql`
    SELECT 
      COUNT(DISTINCT oa.influencer_user_id) as total_influencers,
      COUNT(DISTINCT oa.order_id) as total_orders,
      SUM(oa.order_amount) as total_revenue,
      SUM(oa.commission_amount) as total_commission,
      AVG(oa.order_amount) as avg_order_value
    FROM order_attribution oa
  `);

  const result = ((stats as any).rows || stats)[0] as any;

  return {
    totalInfluencers: result.total_influencers || 0,
    totalOrders: result.total_orders || 0,
    totalRevenue: result.total_revenue || "0.00",
    totalCommission: result.total_commission || "0.00",
    avgOrderValue: result.avg_order_value || "0.00",
  };
}
