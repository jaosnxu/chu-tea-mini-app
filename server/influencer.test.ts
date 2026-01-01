import { describe, it, expect, beforeAll } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// 模拟管理员上下文
const mockAdminContext: TrpcContext = {
  user: {
    id: 1,
    openId: "test_admin",
    name: "Test Admin",
    email: "admin@test.com",
    loginMethod: "manus" as const,
    role: "admin" as const,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  },
  req: {} as any,
  res: {} as any,
};

// 模拟普通用户上下文
const mockUserContext: TrpcContext = {
  user: {
    id: 2,
    openId: "test_user",
    name: "Test User",
    email: "user@test.com",
    loginMethod: "manus" as const,
    role: "user" as const,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  },
  req: {} as any,
  res: {} as any,
};

describe("Influencer System Tests", () => {
  let campaignId: number;

  describe("Campaign Management", () => {
    it("should create a campaign (admin only)", async () => {
      const caller = appRouter.createCaller(mockAdminContext);

      const result = await caller.influencer.createCampaign({
        name: "Test Campaign",
        description: "This is a test campaign",
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days later
        commissionConfig: {
          type: "percentage",
          value: 10,
          minOrder: 100,
        },
      });

      expect(result).toBeDefined();
      expect(result.id).toBeGreaterThan(0);
      campaignId = result.id;
    });

    it("should get active campaigns", async () => {
      const caller = appRouter.createCaller(mockUserContext);

      const campaigns = await caller.influencer.getActiveCampaigns();

      expect(Array.isArray(campaigns)).toBe(true);
      expect(campaigns.length).toBeGreaterThan(0);
    });

    it("should get campaign by id", async () => {
      const caller = appRouter.createCaller(mockUserContext);

      const campaign = await caller.influencer.getCampaign({ id: campaignId });

      expect(campaign).toBeDefined();
      expect(campaign?.id).toBe(campaignId);
      expect(campaign?.name).toBe("Test Campaign");
    });
  });

  describe("Influencer Registration", () => {
    it("should apply to become an influencer", async () => {
      const caller = appRouter.createCaller(mockUserContext);

      const result = await caller.influencer.applyInfluencer({
        influencerCode: "TEST_USER",
        followerCount: 10000,
        socialMediaLinks: ["https://instagram.com/testuser"],
      });

      expect(result.success).toBe(true);
    });

    it("should get influencer info", async () => {
      const caller = appRouter.createCaller(mockUserContext);

      const info = await caller.influencer.getMyInfo();

      expect(info).toBeDefined();
      expect(info?.isInfluencer).toBe(true);
      expect(info?.influencerCode).toBe("TEST_USER");
    });
  });

  describe("Task Management", () => {
    it("should accept a task", async () => {
      const caller = appRouter.createCaller(mockUserContext);

      const result = await caller.influencer.acceptTask({
        campaignId,
      });

      expect(result.success).toBe(true);
      expect(result.taskId).toBeGreaterThan(0);
    });

    it("should get my tasks", async () => {
      const caller = appRouter.createCaller(mockUserContext);

      const tasks = await caller.influencer.getMyTasks();

      expect(Array.isArray(tasks)).toBe(true);
      expect(tasks.length).toBeGreaterThan(0);
      expect(tasks[0].campaignId).toBe(campaignId);
    });
  });

  describe("Link Generation", () => {
    it("should generate influencer link", async () => {
      const caller = appRouter.createCaller(mockUserContext);

      const result = await caller.influencer.generateLink({
        campaignId,
        productId: 1,
      });

      expect(result.linkCode).toBeDefined();
      expect(result.fullUrl).toContain("ref=");
    });

    it("should get link stats", async () => {
      const caller = appRouter.createCaller(mockUserContext);

      const stats = await caller.influencer.getLinkStats({
        campaignId,
      });

      expect(stats).toBeDefined();
      expect(stats.totalClicks).toBeGreaterThanOrEqual(0);
      expect(stats.totalOrders).toBeGreaterThanOrEqual(0);
    });
  });

  describe("Earnings Management", () => {
    it("should get my earnings", async () => {
      const caller = appRouter.createCaller(mockUserContext);

      const earnings = await caller.influencer.getMyEarnings();

      expect(Array.isArray(earnings)).toBe(true);
    });

    it("should get earnings stats", async () => {
      const caller = appRouter.createCaller(mockUserContext);

      const stats = await caller.influencer.getMyEarningsStats();

      expect(stats).toBeDefined();
      expect(stats.totalEarnings).toBeDefined();
      expect(stats.pendingAmount).toBeDefined();
      expect(stats.confirmedAmount).toBeDefined();
      expect(stats.paidAmount).toBeDefined();
    });
  });

  describe("Withdrawal Management", () => {
    it("should create withdrawal request", async () => {
      const caller = appRouter.createCaller(mockUserContext);

      const result = await caller.influencer.createWithdrawal({
        amount: 100,
        withdrawalMethod: "bank_card",
        accountInfo: {
          bankName: "Test Bank",
          accountNumber: "1234567890",
          accountName: "Test User",
        },
      });

      expect(result.success).toBe(true);
      expect(result.withdrawalId).toBeGreaterThan(0);
    });

    it("should get my withdrawals", async () => {
      const caller = appRouter.createCaller(mockUserContext);

      const withdrawals = await caller.influencer.getMyWithdrawals();

      expect(Array.isArray(withdrawals)).toBe(true);
      expect(withdrawals.length).toBeGreaterThan(0);
    });

    it("should list all withdrawals (admin only)", async () => {
      const caller = appRouter.createCaller(mockAdminContext);

      const withdrawals = await caller.influencer.listWithdrawals({
        status: "pending",
      });

      expect(Array.isArray(withdrawals)).toBe(true);
    });
  });

  describe("Ranking", () => {
    it("should get influencer ranking", async () => {
      const caller = appRouter.createCaller(mockUserContext);

      const ranking = await caller.influencer.getRanking({
        period: "all_time",
        limit: 10,
      });

      expect(Array.isArray(ranking)).toBe(true);
    });
  });
});
