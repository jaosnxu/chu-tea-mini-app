import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock the database module with correct function names
vi.mock("./db", async (importOriginal) => {
  const actual = await importOriginal() as Record<string, unknown>;
  return {
    ...actual,
    getActiveStores: vi.fn().mockResolvedValue([
      {
        id: 1,
        iikoId: "store-001",
        code: "MSK001",
        nameZh: "莫斯科中心店",
        nameRu: "Центральный магазин Москвы",
        nameEn: "Moscow Central Store",
        addressZh: "莫斯科市中心",
        addressRu: "Центр Москвы",
        addressEn: "Moscow City Center",
        phone: "+7-495-123-4567",
        latitude: "55.7558",
        longitude: "37.6173",
        openTime: "09:00",
        closeTime: "22:00",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 2,
        iikoId: "store-002",
        code: "SPB001",
        nameZh: "圣彼得堡店",
        nameRu: "Магазин Санкт-Петербурга",
        nameEn: "St. Petersburg Store",
        addressZh: "圣彼得堡涅瓦大街",
        addressRu: "Невский проспект",
        addressEn: "Nevsky Prospect",
        phone: "+7-812-123-4567",
        latitude: "59.9343",
        longitude: "30.3351",
        openTime: "10:00",
        closeTime: "21:00",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]),
    getStoreById: vi.fn().mockImplementation((id: number) => {
      if (id === 1) {
        return Promise.resolve({
          id: 1,
          iikoId: "store-001",
          code: "MSK001",
          nameZh: "莫斯科中心店",
          nameRu: "Центральный магазин Москвы",
          nameEn: "Moscow Central Store",
          addressZh: "莫斯科市中心",
          addressRu: "Центр Москвы",
          addressEn: "Moscow City Center",
          phone: "+7-495-123-4567",
          latitude: "55.7558",
          longitude: "37.6173",
          openTime: "09:00",
          closeTime: "22:00",
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
      return Promise.resolve(null);
    }),
  };
});

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

describe("store router", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return list of stores", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.store.list();

    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({
      id: 1,
      code: "MSK001",
      nameZh: "莫斯科中心店",
    });
    expect(result[1]).toMatchObject({
      id: 2,
      code: "SPB001",
      nameZh: "圣彼得堡店",
    });
  });

  it("should return store by id", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.store.getById({ id: 1 });

    expect(result).toMatchObject({
      id: 1,
      code: "MSK001",
      nameZh: "莫斯科中心店",
      nameRu: "Центральный магазин Москвы",
      nameEn: "Moscow Central Store",
    });
  });

  it("should return null for non-existent store", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.store.getById({ id: 999 });

    expect(result).toBeNull();
  });
});
