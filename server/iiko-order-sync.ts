import { getIikoAccessToken } from "./iiko-auth.js";
import { getIikoConfigById } from "./iiko-db.js";
import { getOrderById } from "./db.js";

/**
 * IIKO 订单同步服务
 * 根据 IIKO Cloud API 文档实现订单创建
 */

interface IikoOrderItem {
  productId: string;
  type: "Product";
  amount: number;
  price?: number;
  comment?: string;
}

interface IikoDeliveryOrder {
  organizationId: string;
  terminalGroupId?: string;
  externalNumber: string;
  customer: {
    name: string;
    phone: string;
  };
  order: {
    items: IikoOrderItem[];
    comment?: string;
  };
  deliveryPoint?: {
    address: {
      street: string;
      home?: string;
      apartment?: string;
      comment?: string;
    };
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  completeBefore?: string;
}

interface IikoOrderResponse {
  orderInfo: {
    id: string;
    externalNumber: string;
    organizationId: string;
    timestamp: number;
    creationStatus: "Success" | "InProgress" | "Error";
    errorInfo?: {
      code: string;
      message: string;
      description?: string;
    };
  };
}

/**
 * 将本地订单转换为 IIKO 订单格式
 */
function convertOrderToIikoFormat(
  order: any,
  config: any
): IikoDeliveryOrder {
  // 解析订单项
  const items: IikoOrderItem[] = order.items.map((item: any) => ({
    productId: item.iikoProductId || item.productId.toString(), // 需要 IIKO 商品 ID
    type: "Product" as const,
    amount: item.quantity,
    price: item.price,
    comment: item.customization || undefined,
  }));

  // 构建订单数据
  const iikoOrder: IikoDeliveryOrder = {
    organizationId: config.organizationId,
    terminalGroupId: config.terminalGroupId || undefined,
    externalNumber: order.orderNo,
    customer: {
      name: order.customerName || "Guest",
      phone: order.customerPhone || "",
    },
    order: {
      items,
      comment: order.notes || undefined,
    },
  };

  // 如果是外卖订单，添加配送地址
  if (order.deliveryAddress) {
    iikoOrder.deliveryPoint = {
      address: {
        street: order.deliveryAddress,
        comment: order.deliveryNotes || undefined,
      },
    };
  }

  // 添加预计完成时间
  if (order.scheduledTime) {
    iikoOrder.completeBefore = new Date(order.scheduledTime).toISOString();
  }

  return iikoOrder;
}

/**
 * 同步单个订单到 IIKO
 */
export async function syncOrderToIiko(
  orderId: number,
  configId: number
): Promise<{
  success: boolean;
  iikoOrderId?: string;
  iikoExternalNumber?: string;
  errorMessage?: string;
  errorCode?: string;
}> {
  try {
    // 获取 IIKO 配置
    const config = await getIikoConfigById(configId);
    if (!config) {
      throw new Error(`IIKO config not found: ${configId}`);
    }

    if (!config.isActive) {
      throw new Error(`IIKO config is not active: ${configId}`);
    }

    // 获取访问令牌
    const token = await getIikoAccessToken(configId);
    if (!token) {
      throw new Error("Failed to get IIKO access token");
    }

    // 获取订单数据
    // 注意：这里需要从订单队列表中获取 userId，暂时使用 0 作为占位符
    // TODO: 传入正确的 userId
    const order = await getOrderById(0, orderId);
    if (!order) {
      throw new Error(`Order not found: ${orderId}`);
    }

    // 转换订单格式
    const iikoOrder = convertOrderToIikoFormat(order, config);

    // 发送订单到 IIKO
    const response = await fetch(
      `${config.apiUrl}/api/1/deliveries/create`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(iikoOrder),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`IIKO API error: ${response.status} ${errorText}`);
    }

    const result: IikoOrderResponse = await response.json();

    // 检查创建状态
    if (result.orderInfo.creationStatus === "Error") {
      return {
        success: false,
        errorMessage: result.orderInfo.errorInfo?.message || "Unknown error",
        errorCode: result.orderInfo.errorInfo?.code,
      };
    }

    return {
      success: true,
      iikoOrderId: result.orderInfo.id,
      iikoExternalNumber: result.orderInfo.externalNumber,
    };
  } catch (error: any) {
    console.error(`[IIKO Sync] Failed to sync order ${orderId}:`, error);
    return {
      success: false,
      errorMessage: error.message,
    };
  }
}

/**
 * 批量同步订单
 */
export async function syncOrdersBatch(
  orders: Array<{ orderId: number; configId: number }>,
  concurrency: number = 3
): Promise<
  Array<{
    orderId: number;
    success: boolean;
    iikoOrderId?: string;
    errorMessage?: string;
  }>
> {
  const results: Array<{
    orderId: number;
    success: boolean;
    iikoOrderId?: string;
    errorMessage?: string;
  }> = [];

  // 分批处理，控制并发
  for (let i = 0; i < orders.length; i += concurrency) {
    const batch = orders.slice(i, i + concurrency);
    const batchResults = await Promise.all(
      batch.map(async ({ orderId, configId }) => {
        const result = await syncOrderToIiko(orderId, configId);
        return {
          orderId,
          success: result.success,
          iikoOrderId: result.iikoOrderId,
          errorMessage: result.errorMessage,
        };
      })
    );
    results.push(...batchResults);
  }

  return results;
}
