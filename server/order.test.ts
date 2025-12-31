import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import * as db from "./db";

// Mock database functions
vi.mock("./db", () => ({
  getUserOrders: vi.fn(),
  getOrderById: vi.fn(),
  getOrderByOrderNo: vi.fn(),
  createOrder: vi.fn(),
  cancelOrder: vi.fn(),
  getCartItems: vi.fn(),
  addToCart: vi.fn(),
  updateCartItem: vi.fn(),
  removeFromCart: vi.fn(),
  clearCart: vi.fn(),
  getPaymentByOrderId: vi.fn(),
}));

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user-123",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "telegram",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

describe("order.list", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns user orders", async () => {
    const mockOrders = [
      {
        id: 1,
        orderNo: "TEA20231231001",
        orderType: "tea",
        status: "pending",
        totalAmount: "150.00",
        createdAt: new Date(),
      },
      {
        id: 2,
        orderNo: "TEA20231231002",
        orderType: "tea",
        status: "completed",
        totalAmount: "200.00",
        createdAt: new Date(),
      },
    ];

    vi.mocked(db.getUserOrders).mockResolvedValue(mockOrders);

    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.order.list();

    expect(result).toEqual(mockOrders);
    expect(db.getUserOrders).toHaveBeenCalledWith(1, undefined);
  });

  it("filters orders by type", async () => {
    const mockOrders = [
      {
        id: 1,
        orderNo: "MALL20231231001",
        orderType: "mall",
        status: "pending",
        totalAmount: "500.00",
        createdAt: new Date(),
      },
    ];

    vi.mocked(db.getUserOrders).mockResolvedValue(mockOrders);

    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.order.list({ orderType: "mall" });

    expect(result).toEqual(mockOrders);
    expect(db.getUserOrders).toHaveBeenCalledWith(1, { orderType: "mall" });
  });
});

describe("order.create", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates a new tea order", async () => {
    const mockResult = {
      orderId: 1,
      orderNo: "TEA20231231001",
    };

    vi.mocked(db.createOrder).mockResolvedValue(mockResult);

    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const orderInput = {
      orderType: "tea" as const,
      deliveryType: "pickup" as const,
      storeId: 1,
      items: [
        {
          productId: 1,
          quantity: 2,
          unitPrice: "35.00",
        },
      ],
    };

    const result = await caller.order.create(orderInput);

    expect(result).toEqual(mockResult);
    expect(db.createOrder).toHaveBeenCalledWith(1, orderInput);
  });

  it("creates a mall order with delivery", async () => {
    const mockResult = {
      orderId: 2,
      orderNo: "MALL20231231001",
    };

    vi.mocked(db.createOrder).mockResolvedValue(mockResult);

    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const orderInput = {
      orderType: "mall" as const,
      deliveryType: "delivery" as const,
      addressId: 1,
      items: [
        {
          productId: 10,
          quantity: 1,
          unitPrice: "299.00",
        },
      ],
    };

    const result = await caller.order.create(orderInput);

    expect(result).toEqual(mockResult);
    expect(db.createOrder).toHaveBeenCalledWith(1, orderInput);
  });
});

describe("order.cancel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("cancels an order with reason", async () => {
    vi.mocked(db.cancelOrder).mockResolvedValue({ success: true });

    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.order.cancel({
      id: 1,
      reason: "Changed my mind",
    });

    expect(result).toEqual({ success: true });
    expect(db.cancelOrder).toHaveBeenCalledWith(1, 1, "Changed my mind");
  });
});

describe("cart.list", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns user cart items", async () => {
    const mockCartItems = [
      {
        id: 1,
        productId: 1,
        quantity: 2,
        unitPrice: "35.00",
        cartType: "tea",
      },
    ];

    vi.mocked(db.getCartItems).mockResolvedValue(mockCartItems);

    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.cart.list();

    expect(result).toEqual(mockCartItems);
    expect(db.getCartItems).toHaveBeenCalledWith(1, undefined);
  });

  it("filters cart by type", async () => {
    const mockCartItems = [
      {
        id: 2,
        productId: 10,
        quantity: 1,
        unitPrice: "299.00",
        cartType: "mall",
      },
    ];

    vi.mocked(db.getCartItems).mockResolvedValue(mockCartItems);

    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.cart.list({ cartType: "mall" });

    expect(result).toEqual(mockCartItems);
    expect(db.getCartItems).toHaveBeenCalledWith(1, "mall");
  });
});

describe("cart.add", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("adds item to cart", async () => {
    vi.mocked(db.addToCart).mockResolvedValue({ id: 1 });

    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const cartInput = {
      productId: 1,
      quantity: 2,
      unitPrice: "35.00",
      cartType: "tea" as const,
      selectedOptions: [
        {
          optionId: 1,
          itemId: 2,
          name: "半糖",
          price: "0",
        },
      ],
    };

    const result = await caller.cart.add(cartInput);

    expect(result).toEqual({ id: 1 });
    expect(db.addToCart).toHaveBeenCalledWith(1, cartInput);
  });
});

describe("cart.update", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("updates cart item quantity", async () => {
    vi.mocked(db.updateCartItem).mockResolvedValue({ success: true });

    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.cart.update({ id: 1, quantity: 3 });

    expect(result).toEqual({ success: true });
    expect(db.updateCartItem).toHaveBeenCalledWith(1, 1, 3);
  });

  it("removes item when quantity is 0", async () => {
    vi.mocked(db.removeFromCart).mockResolvedValue({ success: true });

    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.cart.update({ id: 1, quantity: 0 });

    expect(result).toEqual({ success: true });
    expect(db.removeFromCart).toHaveBeenCalledWith(1, 1);
  });
});

describe("cart.clear", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("clears all cart items", async () => {
    vi.mocked(db.clearCart).mockResolvedValue({ success: true });

    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.cart.clear();

    expect(result).toEqual({ success: true });
    expect(db.clearCart).toHaveBeenCalledWith(1, undefined);
  });

  it("clears cart by type", async () => {
    vi.mocked(db.clearCart).mockResolvedValue({ success: true });

    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.cart.clear({ cartType: "tea" });

    expect(result).toEqual({ success: true });
    expect(db.clearCart).toHaveBeenCalledWith(1, "tea");
  });
});
