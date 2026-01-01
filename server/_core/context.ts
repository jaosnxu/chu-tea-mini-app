import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { sdk } from "./sdk";
import * as db from "../db";
import { COOKIE_NAME } from "@shared/const";
import { parse as parseCookieHeader } from "cookie";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  try {
    // 首先尝试 Manus OAuth 认证
    user = await sdk.authenticateRequest(opts.req);
  } catch (error) {
    // OAuth 认证失败，尝试 Telegram 认证
    try {
      const cookieHeader = opts.req.headers.cookie;
      if (cookieHeader) {
        const cookies = parseCookieHeader(cookieHeader);
        const sessionValue = cookies[COOKIE_NAME];
        
        if (sessionValue) {
          // 尝试作为 openId 查询用户(Telegram 登录方式)
          const telegramUser = await db.getUserByOpenId(sessionValue);
          if (telegramUser) {
            user = telegramUser;
          }
        }
      }
    } catch (telegramError) {
      // Telegram 认证也失败，保持 user 为 null
      console.log('[Auth] Both OAuth and Telegram auth failed');
    }
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
