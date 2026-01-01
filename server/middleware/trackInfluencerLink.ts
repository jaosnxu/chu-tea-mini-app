import { Request, Response, NextFunction } from "express";
import * as influencerDb from "../db/influencer";

/**
 * 链接追踪中间件
 * 记录达人推广链接的点击
 */
export async function trackInfluencerLink(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    // 从查询参数中获取推广链接代码
    const linkCode = req.query.ref as string;

    if (linkCode) {
      // 解析链接代码获取达人 ID
      const parts = linkCode.split("-");
      if (parts.length >= 3) {
        const influencerId = parseInt(parts[0]);

        if (!isNaN(influencerId)) {
          // 记录链接点击
          await influencerDb.recordLinkClick({
            influencerId,
            linkCode,
            ipAddress: req.ip || req.connection.remoteAddress || "",
            userAgent: req.get("user-agent") || "",
            referer: req.get("referer") || "",
          });

          // 将链接代码存储到 session 或 cookie 中，用于后续订单归因
          // 这里使用 cookie，有效期 7 天
          res.cookie("influencer_ref", linkCode, {
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
            httpOnly: true,
            sameSite: "lax",
          });
        }
      }
    }
  } catch (error) {
    // 追踪失败不影响正常流程
    console.error("[Influencer Tracking] Error:", error);
  }

  next();
}

/**
 * 从请求中获取达人推广链接代码
 */
export function getInfluencerRefFromRequest(req: Request): string | null {
  // 优先从 cookie 中获取
  const refFromCookie = req.cookies?.influencer_ref;
  if (refFromCookie) {
    return refFromCookie;
  }

  // 其次从查询参数中获取
  const refFromQuery = req.query.ref as string;
  if (refFromQuery) {
    return refFromQuery;
  }

  return null;
}
