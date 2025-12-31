/**
 * IIKO Cloud API Integration Service
 * 
 * IIKO is a Russian restaurant management system that provides:
 * - Order management (create, update, cancel orders)
 * - Menu synchronization (products, prices, availability)
 * - Loyalty program integration (points, discounts, member levels)
 * - Real-time inventory management
 * 
 * API Documentation: https://api-ru.iiko.services/
 */

import axios, { AxiosInstance } from 'axios';

// IIKO API Configuration
interface IikoConfig {
  apiLogin: string;
  organizationId?: string;
  terminalGroupId?: string;
}

// IIKO API Response Types
interface IikoAuthResponse {
  token: string;
  correlationId: string;
}

interface IikoOrganization {
  id: string;
  name: string;
  country: string;
  restaurantAddress: string;
  latitude: number;
  longitude: number;
  useUaeAddressingSystem: boolean;
  version: string;
  currencyIsoName: string;
  currencyMinimumDenomination: number;
  countryPhoneCode: string;
  marketingSourceRequiredInDelivery: boolean;
  defaultDeliveryCityId: string | null;
  deliveryCityIds: string[];
  deliveryServiceType: string;
  defaultCallCenterPaymentTypeId: string | null;
  orderItemCommentEnabled: boolean;
  inn: string;
  addressFormatType: string;
  isConfirmationEnabled: boolean;
  confirmAllowedIntervalInMinutes: number;
  isCloud: boolean;
}

interface IikoTerminalGroup {
  id: string;
  organizationId: string;
  name: string;
  address: string;
  timeZone: string;
  items: Array<{
    id: string;
    name: string;
    address: string;
  }>;
}

interface IikoProduct {
  id: string;
  parentGroup: string | null;
  order: number;
  code: string | null;
  name: string;
  description: string | null;
  additionalInfo: string | null;
  tags: string[];
  isDeleted: boolean;
  seoDescription: string | null;
  seoText: string | null;
  seoKeywords: string | null;
  seoTitle: string | null;
  fullNameEnglish: string | null;
  isIncludedInMenu: boolean;
  weight: number;
  fatAmount: number | null;
  proteinsAmount: number | null;
  carbohydratesAmount: number | null;
  energyAmount: number | null;
  fatFullAmount: number | null;
  proteinsFullAmount: number | null;
  carbohydratesFullAmount: number | null;
  energyFullAmount: number | null;
  groupId: string | null;
  productCategoryId: string | null;
  type: string;
  orderItemType: string;
  modifierSchemaId: string | null;
  modifierSchemaName: string | null;
  splittable: boolean;
  measureUnit: string;
  sizePrices: Array<{
    sizeId: string | null;
    price: {
      currentPrice: number;
      isIncludedInMenu: boolean;
      nextPrice: number | null;
      nextIncludedInMenu: boolean;
      nextDatePrice: string | null;
    };
  }>;
  modifiers: Array<{
    id: string;
    defaultAmount: number;
    minAmount: number;
    maxAmount: number;
    required: boolean;
    hideIfDefaultAmount: boolean;
    splittable: boolean;
    freeOfChargeAmount: number;
  }>;
  groupModifiers: Array<{
    id: string;
    minAmount: number;
    maxAmount: number;
    required: boolean;
    childModifiersHaveMinMaxRestrictions: boolean;
    childModifiers: Array<{
      id: string;
      defaultAmount: number;
      minAmount: number;
      maxAmount: number;
      hideIfDefaultAmount: boolean;
      freeOfChargeAmount: number;
    }>;
    hideIfDefaultAmount: boolean;
    splittable: boolean;
    freeOfChargeAmount: number;
  }>;
  imageLinks: string[];
  doNotPrintInCheque: boolean;
  useBalanceForSell: boolean;
  canSetOpenPrice: boolean;
}

interface IikoOrderItem {
  productId: string;
  type: 'Product' | 'Compound';
  amount: number;
  productSizeId?: string;
  comboInformation?: {
    comboId: string;
    comboSourceId: string;
    comboGroupId: string;
  };
  comment?: string;
  modifiers?: Array<{
    productId: string;
    productGroupId?: string;
    amount: number;
  }>;
}

interface IikoCreateOrderRequest {
  organizationId: string;
  terminalGroupId: string;
  order: {
    id?: string;
    externalNumber?: string;
    tableIds?: string[];
    customer?: {
      id?: string;
      name?: string;
      surname?: string;
      comment?: string;
      birthdate?: string;
      email?: string;
      shouldReceiveOrderStatusNotifications?: boolean;
      shouldReceiveLoyaltyInfo?: boolean;
      shouldReceivePromoActionsInfo?: boolean;
      gender?: 'NotSpecified' | 'Male' | 'Female';
      type?: 'regular' | 'one-time';
    };
    phone?: string;
    guests?: {
      count: number;
      splitBetweenPersons?: boolean;
    };
    tabName?: string;
    items: IikoOrderItem[];
    combos?: Array<{
      id: string;
      name: string;
      amount: number;
      price: number;
      sourceId: string;
    }>;
    payments?: Array<{
      paymentTypeKind: 'Cash' | 'Card' | 'IikoCard' | 'External';
      sum: number;
      paymentTypeId: string;
      isProcessedExternally?: boolean;
      paymentAdditionalData?: {
        credential?: string;
        searchScope?: string;
        type?: string;
      };
      isFiscalizedExternally?: boolean;
    }>;
    tips?: Array<{
      paymentTypeKind: 'Cash' | 'Card' | 'IikoCard' | 'External';
      sum: number;
      paymentTypeId: string;
      isProcessedExternally?: boolean;
      paymentAdditionalData?: {
        credential?: string;
        searchScope?: string;
        type?: string;
      };
      isFiscalizedExternally?: boolean;
    }>;
    sourceKey?: string;
    discountsInfo?: {
      card?: {
        track: string;
      };
      discounts?: Array<{
        discountTypeId: string;
        sum?: number;
        selectivePositions?: string[];
      }>;
    };
    iikoCard5Info?: {
      coupon?: string;
      applicableManualConditions?: string[];
    };
    orderTypeId?: string;
    comment?: string;
    deliveryPoint?: {
      coordinates?: {
        latitude: number;
        longitude: number;
      };
      address?: {
        street?: {
          classifierId?: string;
          id?: string;
          name?: string;
          city?: string;
        };
        index?: string;
        house?: string;
        building?: string;
        flat?: string;
        entrance?: string;
        floor?: string;
        doorphone?: string;
        regionId?: string;
        externalCartographyId?: string;
        comment?: string;
      };
      externalCartographyId?: string;
      comment?: string;
    };
    completeBefore?: string;
    marketingSourceId?: string;
    operatorId?: string;
    deliveryZoneId?: string;
  };
  createOrderSettings?: {
    transportToFrontTimeout?: number;
  };
}

interface IikoOrderResponse {
  correlationId: string;
  orderInfo: {
    id: string;
    posId: string | null;
    externalNumber: string | null;
    organizationId: string;
    timestamp: number;
    creationStatus: string;
    errorInfo: {
      code: string;
      message: string;
      description: string;
      additionalData: string | null;
    } | null;
    order: {
      parentDeliveryId: string | null;
      customer: {
        id: string;
        name: string;
        surname: string | null;
        comment: string | null;
        birthdate: string | null;
        email: string | null;
        shouldReceiveOrderStatusNotifications: boolean;
        shouldReceiveLoyaltyInfo: boolean;
        shouldReceivePromoActionsInfo: boolean;
        gender: string;
        type: string;
      } | null;
      phone: string | null;
      deliveryPoint: object | null;
      status: string;
      cancelInfo: object | null;
      courierInfo: object | null;
      completeBefore: string | null;
      whenCreated: string;
      whenConfirmed: string | null;
      whenPrinted: string | null;
      whenSended: string | null;
      whenDelivered: string | null;
      comment: string | null;
      problem: object | null;
      operator: object | null;
      marketingSource: object | null;
      deliveryDuration: number | null;
      indexInCourierRoute: number | null;
      cookingStartTime: string | null;
      isDeleted: boolean;
      whenReceivedByApi: string;
      whenReceivedFromFront: string | null;
      movedFromDeliveryId: string | null;
      movedFromTerminalGroupId: string | null;
      movedFromOrganizationId: string | null;
      externalCourierService: object | null;
      sum: number;
      number: number;
      sourceKey: string | null;
      whenBillPrinted: string | null;
      whenClosed: string | null;
      conception: object | null;
      guestsInfo: object;
      items: Array<{
        product: {
          id: string;
          name: string;
          code: string | null;
        };
        modifiers: Array<{
          product: {
            id: string;
            name: string;
            code: string | null;
          };
          amount: number;
          amountIndependentOfParentAmount: boolean;
          productGroup: object | null;
          price: number;
          pricePredefined: boolean;
          positionId: string | null;
          resultSum: number;
          deleted: boolean;
          deletionComment: string | null;
        }>;
        price: number;
        cost: number;
        pricePredefined: boolean;
        positionId: string | null;
        taxPercent: number | null;
        type: string;
        status: string;
        deleted: boolean;
        amount: number;
        comment: string | null;
        whenPrinted: string | null;
        size: object | null;
        comboInformation: object | null;
        deletionComment: string | null;
      }>;
      combos: object[];
      payments: object[];
      tips: object[];
      discounts: object[];
      orderType: object | null;
      terminalGroupId: string;
      processedPaymentsSum: number;
    } | null;
  };
}

interface IikoLoyaltyBalance {
  balance: number;
  wallets: Array<{
    id: number;
    name: string;
    type: number;
    balance: number;
  }>;
}

interface IikoCustomerInfo {
  id: string;
  referrerId: string | null;
  name: string;
  surname: string | null;
  middleName: string | null;
  comment: string | null;
  phone: string;
  cultureName: string | null;
  birthday: string | null;
  email: string | null;
  sex: number;
  consentStatus: number;
  anonymized: boolean;
  cards: Array<{
    id: string;
    track: string;
    number: string;
    validToDate: string | null;
  }>;
  categories: Array<{
    id: string;
    name: string;
    isActive: boolean;
    isDefaultForNewGuests: boolean;
  }>;
  walletBalances: Array<{
    id: number;
    name: string;
    type: number;
    balance: number;
  }>;
  userData: string | null;
  shouldReceivePromoActionsInfo: boolean;
  shouldReceiveLoyaltyInfo: boolean;
  shouldReceiveOrderStatusInfo: boolean;
  personalDataConsentFrom: string | null;
  personalDataConsentTo: string | null;
  personalDataProcessingFrom: string | null;
  personalDataProcessingTo: string | null;
  isDeleted: boolean;
}

/**
 * IIKO Cloud API Client
 */
export class IikoService {
  private client: AxiosInstance;
  private token: string | null = null;
  private tokenExpiry: Date | null = null;
  private config: IikoConfig;

  constructor(config: IikoConfig) {
    this.config = config;
    this.client = axios.create({
      baseURL: 'https://api-ru.iiko.services/api/1',
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });
  }

  /**
   * Authenticate with IIKO API and get access token
   * Token is valid for 1 hour
   */
  async authenticate(): Promise<string> {
    // Check if we have a valid token
    if (this.token && this.tokenExpiry && this.tokenExpiry > new Date()) {
      return this.token;
    }

    try {
      const response = await this.client.post<IikoAuthResponse>('/access_token', {
        apiLogin: this.config.apiLogin,
      });

      this.token = response.data.token;
      // Token expires in 1 hour, refresh 5 minutes before
      this.tokenExpiry = new Date(Date.now() + 55 * 60 * 1000);

      return this.token;
    } catch (error) {
      console.error('[IIKO] Authentication failed:', error);
      throw new Error('IIKO authentication failed');
    }
  }

  /**
   * Make authenticated API request
   */
  private async request<T>(method: 'GET' | 'POST', endpoint: string, data?: any): Promise<T> {
    const token = await this.authenticate();

    try {
      const response = await this.client.request<T>({
        method,
        url: endpoint,
        data,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return response.data;
    } catch (error: any) {
      console.error(`[IIKO] API request failed: ${endpoint}`, error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Get list of organizations
   */
  async getOrganizations(): Promise<IikoOrganization[]> {
    const response = await this.request<{ organizations: IikoOrganization[] }>('POST', '/organizations', {
      organizationIds: null,
      returnAdditionalInfo: true,
      includeDisabled: false,
    });
    return response.organizations;
  }

  /**
   * Get terminal groups (stores/locations)
   */
  async getTerminalGroups(organizationIds: string[]): Promise<IikoTerminalGroup[]> {
    const response = await this.request<{ terminalGroups: IikoTerminalGroup[] }>('POST', '/terminal_groups', {
      organizationIds,
      includeDisabled: false,
    });
    return response.terminalGroups;
  }

  /**
   * Get menu (products and categories)
   */
  async getMenu(organizationId: string): Promise<{ products: IikoProduct[]; groups: any[] }> {
    const response = await this.request<{
      correlationId: string;
      groups: any[];
      productCategories: any[];
      products: IikoProduct[];
      sizes: any[];
      revision: number;
    }>('POST', '/nomenclature', {
      organizationId,
    });

    return {
      products: response.products,
      groups: response.groups,
    };
  }

  /**
   * Get stop list (out of stock items)
   */
  async getStopList(organizationIds: string[]): Promise<any> {
    return await this.request('POST', '/stop_lists', {
      organizationIds,
    });
  }

  /**
   * Create delivery order
   */
  async createDeliveryOrder(request: IikoCreateOrderRequest): Promise<IikoOrderResponse> {
    return await this.request<IikoOrderResponse>('POST', '/deliveries/create', request);
  }

  /**
   * Get order status by ID
   */
  async getOrderById(organizationId: string, orderId: string): Promise<any> {
    return await this.request('POST', '/deliveries/by_id', {
      organizationId,
      orderIds: [orderId],
    });
  }

  /**
   * Cancel order
   */
  async cancelOrder(organizationId: string, orderId: string, cancelCauseId?: string): Promise<any> {
    return await this.request('POST', '/deliveries/cancel', {
      organizationId,
      orderId,
      cancelCauseId,
    });
  }

  /**
   * Get customer info by phone
   */
  async getCustomerByPhone(organizationId: string, phone: string): Promise<IikoCustomerInfo | null> {
    try {
      const response = await this.request<IikoCustomerInfo>('POST', '/loyalty/iiko/customer/info', {
        organizationId,
        type: 'phone',
        phone,
      });
      return response;
    } catch (error) {
      return null;
    }
  }

  /**
   * Create or update customer
   */
  async createOrUpdateCustomer(
    organizationId: string,
    customer: {
      phone: string;
      name?: string;
      surname?: string;
      email?: string;
      birthday?: string;
      sex?: 'NotSpecified' | 'Male' | 'Female';
    }
  ): Promise<{ id: string }> {
    return await this.request('POST', '/loyalty/iiko/customer/create_or_update', {
      organizationId,
      ...customer,
    });
  }

  /**
   * Get customer loyalty balance
   */
  async getCustomerBalance(organizationId: string, customerId: string): Promise<IikoLoyaltyBalance> {
    return await this.request('POST', '/loyalty/iiko/customer/wallet/balance', {
      organizationId,
      customerId,
    });
  }

  /**
   * Add points to customer wallet
   */
  async addPoints(
    organizationId: string,
    customerId: string,
    walletId: number,
    sum: number,
    comment?: string
  ): Promise<any> {
    return await this.request('POST', '/loyalty/iiko/customer/wallet/topup', {
      organizationId,
      customerId,
      walletId,
      sum,
      comment,
    });
  }

  /**
   * Withdraw points from customer wallet
   */
  async withdrawPoints(
    organizationId: string,
    customerId: string,
    walletId: number,
    sum: number,
    comment?: string
  ): Promise<any> {
    return await this.request('POST', '/loyalty/iiko/customer/wallet/chargeoff', {
      organizationId,
      customerId,
      walletId,
      sum,
      comment,
    });
  }

  /**
   * Get payment types
   */
  async getPaymentTypes(organizationIds: string[]): Promise<any> {
    return await this.request('POST', '/payment_types', {
      organizationIds,
    });
  }

  /**
   * Get order types (delivery, pickup, etc.)
   */
  async getOrderTypes(organizationIds: string[]): Promise<any> {
    return await this.request('POST', '/deliveries/order_types', {
      organizationIds,
    });
  }

  /**
   * Get discounts and promotions
   */
  async getDiscounts(organizationIds: string[]): Promise<any> {
    return await this.request('POST', '/discounts', {
      organizationIds,
    });
  }

  /**
   * Calculate order with discounts
   */
  async calculateOrder(
    organizationId: string,
    terminalGroupId: string,
    items: IikoOrderItem[],
    customerId?: string,
    coupon?: string
  ): Promise<any> {
    return await this.request('POST', '/deliveries/calculate', {
      organizationId,
      terminalGroupId,
      order: {
        items,
        discountsInfo: customerId
          ? {
              card: { track: customerId },
            }
          : undefined,
        iikoCard5Info: coupon ? { coupon } : undefined,
      },
    });
  }
}

// Singleton instance
let iikoService: IikoService | null = null;

/**
 * Get IIKO service instance
 * Requires IIKO_API_LOGIN environment variable
 */
export function getIikoService(): IikoService | null {
  const apiLogin = process.env.IIKO_API_LOGIN;
  
  if (!apiLogin) {
    console.warn('[IIKO] IIKO_API_LOGIN not configured');
    return null;
  }

  if (!iikoService) {
    iikoService = new IikoService({
      apiLogin,
      organizationId: process.env.IIKO_ORGANIZATION_ID,
      terminalGroupId: process.env.IIKO_TERMINAL_GROUP_ID,
    });
  }

  return iikoService;
}

/**
 * Sync menu from IIKO to local database
 */
export async function syncMenuFromIiko(organizationId: string): Promise<{
  synced: number;
  errors: string[];
}> {
  const iiko = getIikoService();
  if (!iiko) {
    return { synced: 0, errors: ['IIKO service not configured'] };
  }

  try {
    const menu = await iiko.getMenu(organizationId);
    // TODO: Implement menu sync logic
    // This would update products table with IIKO data
    
    return {
      synced: menu.products.length,
      errors: [],
    };
  } catch (error: any) {
    return {
      synced: 0,
      errors: [error.message],
    };
  }
}

/**
 * Sync order to IIKO
 */
export async function syncOrderToIiko(
  order: {
    id: number;
    orderNo: string;
    items: Array<{
      productId: number;
      quantity: number;
      iikoProductId?: string;
    }>;
    customer?: {
      name: string;
      phone: string;
    };
    deliveryType: 'delivery' | 'pickup';
    address?: string;
    comment?: string;
  },
  organizationId: string,
  terminalGroupId: string
): Promise<{ success: boolean; iikoOrderId?: string; error?: string }> {
  const iiko = getIikoService();
  if (!iiko) {
    return { success: false, error: 'IIKO service not configured' };
  }

  try {
    const iikoItems: IikoOrderItem[] = order.items
      .filter((item) => item.iikoProductId)
      .map((item) => ({
        productId: item.iikoProductId!,
        type: 'Product' as const,
        amount: item.quantity,
      }));

    if (iikoItems.length === 0) {
      return { success: false, error: 'No IIKO products found in order' };
    }

    const response = await iiko.createDeliveryOrder({
      organizationId,
      terminalGroupId,
      order: {
        externalNumber: order.orderNo,
        customer: order.customer
          ? {
              name: order.customer.name,
              type: 'one-time',
            }
          : undefined,
        phone: order.customer?.phone,
        items: iikoItems,
        comment: order.comment,
      },
    });

    if (response.orderInfo.creationStatus === 'Success') {
      return {
        success: true,
        iikoOrderId: response.orderInfo.id,
      };
    } else {
      return {
        success: false,
        error: response.orderInfo.errorInfo?.message || 'Order creation failed',
      };
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}
