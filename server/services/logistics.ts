/**
 * Russian Logistics API Integration Service
 * 
 * Supports:
 * - СДЭК (CDEK) - Major courier delivery service
 * - Почта России (Russian Post) - National postal service
 * - СберЛогистика (SberLogistics) - Sberbank's logistics service
 */

import axios, { AxiosInstance } from 'axios';

// Common types
interface ShippingRate {
  provider: string;
  serviceName: string;
  price: number;
  currency: string;
  deliveryDays: {
    min: number;
    max: number;
  };
  serviceCode?: string;
}

interface TrackingEvent {
  date: string;
  status: string;
  location?: string;
  description?: string;
}

interface TrackingResult {
  trackingNumber: string;
  status: string;
  events: TrackingEvent[];
  estimatedDelivery?: string;
}

interface CreateShipmentResult {
  success: boolean;
  trackingNumber?: string;
  orderId?: string;
  error?: string;
}

// ============================================
// CDEK (СДЭК) Integration
// ============================================

interface CdekConfig {
  clientId: string;
  clientSecret: string;
  isTest?: boolean;
}

interface CdekAuthResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
  jti: string;
}

interface CdekTariffRequest {
  type: 1 | 2; // 1 = door-to-door, 2 = door-to-warehouse
  from_location: {
    code?: number;
    postal_code?: string;
    country_code?: string;
    city?: string;
    address?: string;
  };
  to_location: {
    code?: number;
    postal_code?: string;
    country_code?: string;
    city?: string;
    address?: string;
  };
  packages: Array<{
    weight: number; // grams
    length?: number; // cm
    width?: number; // cm
    height?: number; // cm
  }>;
}

interface CdekOrderRequest {
  type: 1 | 2;
  number: string;
  tariff_code: number;
  comment?: string;
  sender: {
    company?: string;
    name: string;
    email?: string;
    phones: Array<{ number: string }>;
  };
  recipient: {
    company?: string;
    name: string;
    email?: string;
    phones: Array<{ number: string }>;
  };
  from_location: {
    code?: number;
    postal_code?: string;
    country_code?: string;
    city?: string;
    address: string;
  };
  to_location: {
    code?: number;
    postal_code?: string;
    country_code?: string;
    city?: string;
    address: string;
  };
  packages: Array<{
    number: string;
    weight: number;
    length?: number;
    width?: number;
    height?: number;
    comment?: string;
    items?: Array<{
      name: string;
      ware_key: string;
      payment: { value: number };
      cost: number;
      weight: number;
      amount: number;
    }>;
  }>;
}

export class CdekService {
  private client: AxiosInstance;
  private config: CdekConfig;
  private token: string | null = null;
  private tokenExpiry: Date | null = null;

  constructor(config: CdekConfig) {
    this.config = config;
    const baseURL = config.isTest
      ? 'https://api.edu.cdek.ru/v2'
      : 'https://api.cdek.ru/v2';

    this.client = axios.create({
      baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Authenticate and get access token
   */
  private async authenticate(): Promise<string> {
    if (this.token && this.tokenExpiry && this.tokenExpiry > new Date()) {
      return this.token;
    }

    try {
      const authUrl = this.config.isTest
        ? 'https://api.edu.cdek.ru/v2/oauth/token'
        : 'https://api.cdek.ru/v2/oauth/token';

      const params = new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
      });

      const response = await axios.post<CdekAuthResponse>(authUrl, params, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      this.token = response.data.access_token;
      this.tokenExpiry = new Date(Date.now() + (response.data.expires_in - 60) * 1000);

      return this.token;
    } catch (error) {
      console.error('[CDEK] Authentication failed:', error);
      throw new Error('CDEK authentication failed');
    }
  }

  /**
   * Make authenticated request
   */
  private async request<T>(method: 'GET' | 'POST', endpoint: string, data?: any): Promise<T> {
    const token = await this.authenticate();

    const response = await this.client.request<T>({
      method,
      url: endpoint,
      data,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return response.data;
  }

  /**
   * Calculate shipping rates
   */
  async calculateRates(request: CdekTariffRequest): Promise<ShippingRate[]> {
    try {
      const response = await this.request<{
        tariff_codes: Array<{
          tariff_code: number;
          tariff_name: string;
          tariff_description: string;
          delivery_mode: number;
          delivery_sum: number;
          period_min: number;
          period_max: number;
        }>;
      }>('POST', '/calculator/tarifflist', request);

      return response.tariff_codes.map((tariff) => ({
        provider: 'cdek',
        serviceName: tariff.tariff_name,
        price: tariff.delivery_sum,
        currency: 'RUB',
        deliveryDays: {
          min: tariff.period_min,
          max: tariff.period_max,
        },
        serviceCode: tariff.tariff_code.toString(),
      }));
    } catch (error: any) {
      console.error('[CDEK] Calculate rates failed:', error.response?.data || error.message);
      return [];
    }
  }

  /**
   * Create shipment order
   */
  async createOrder(request: CdekOrderRequest): Promise<CreateShipmentResult> {
    try {
      const response = await this.request<{
        entity: {
          uuid: string;
          cdek_number?: string;
        };
        requests: Array<{
          request_uuid: string;
          type: string;
          state: string;
          errors?: Array<{ code: string; message: string }>;
        }>;
      }>('POST', '/orders', request);

      const errors = response.requests.flatMap((r) => r.errors || []);
      if (errors.length > 0) {
        return {
          success: false,
          error: errors.map((e) => e.message).join(', '),
        };
      }

      return {
        success: true,
        orderId: response.entity.uuid,
        trackingNumber: response.entity.cdek_number,
      };
    } catch (error: any) {
      console.error('[CDEK] Create order failed:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.errors?.[0]?.message || error.message,
      };
    }
  }

  /**
   * Track shipment
   */
  async trackShipment(trackingNumber: string): Promise<TrackingResult | null> {
    try {
      const response = await this.request<{
        entity: {
          uuid: string;
          cdek_number: string;
          statuses: Array<{
            code: string;
            name: string;
            date_time: string;
            city: string;
          }>;
          delivery_date?: string;
        };
      }>('GET', `/orders?cdek_number=${trackingNumber}`);

      return {
        trackingNumber: response.entity.cdek_number,
        status: response.entity.statuses[0]?.name || 'Unknown',
        events: response.entity.statuses.map((s) => ({
          date: s.date_time,
          status: s.name,
          location: s.city,
        })),
        estimatedDelivery: response.entity.delivery_date,
      };
    } catch (error) {
      console.error('[CDEK] Track shipment failed:', error);
      return null;
    }
  }

  /**
   * Get delivery points (pickup locations)
   */
  async getDeliveryPoints(cityCode: number): Promise<any[]> {
    try {
      const response = await this.request<Array<{
        code: string;
        name: string;
        location: {
          country_code: string;
          region_code: number;
          region: string;
          city_code: number;
          city: string;
          postal_code: string;
          longitude: number;
          latitude: number;
          address: string;
          address_full: string;
        };
        work_time: string;
        phones: Array<{ number: string }>;
        type: string;
      }>>('GET', `/deliverypoints?city_code=${cityCode}`);

      return response;
    } catch (error) {
      console.error('[CDEK] Get delivery points failed:', error);
      return [];
    }
  }
}

// ============================================
// Russian Post (Почта России) Integration
// ============================================

interface RussianPostConfig {
  login: string;
  password: string;
  token: string;
}

export class RussianPostService {
  private client: AxiosInstance;
  private config: RussianPostConfig;

  constructor(config: RussianPostConfig) {
    this.config = config;
    this.client = axios.create({
      baseURL: 'https://otpravka-api.pochta.ru',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `AccessToken ${config.token}`,
        'X-User-Authorization': `Basic ${Buffer.from(`${config.login}:${config.password}`).toString('base64')}`,
      },
    });
  }

  /**
   * Calculate shipping rate
   */
  async calculateRate(
    fromPostcode: string,
    toPostcode: string,
    weight: number, // grams
    declaredValue?: number
  ): Promise<ShippingRate[]> {
    try {
      const response = await this.client.post('/1.0/tariff', {
        'index-from': fromPostcode,
        'index-to': toPostcode,
        'mail-category': 'ORDINARY',
        'mail-type': 'POSTAL_PARCEL',
        mass: weight,
        'declared-value': declaredValue ? declaredValue * 100 : 0, // kopecks
      });

      const rates: ShippingRate[] = [];

      if (response.data['total-rate']) {
        rates.push({
          provider: 'russian_post',
          serviceName: 'Посылка',
          price: response.data['total-rate'] / 100, // convert from kopecks
          currency: 'RUB',
          deliveryDays: {
            min: response.data['delivery-time']?.['min-days'] || 3,
            max: response.data['delivery-time']?.['max-days'] || 14,
          },
        });
      }

      return rates;
    } catch (error: any) {
      console.error('[Russian Post] Calculate rate failed:', error.response?.data || error.message);
      return [];
    }
  }

  /**
   * Create shipment
   */
  async createShipment(
    sender: {
      name: string;
      phone: string;
      address: string;
      postcode: string;
    },
    recipient: {
      name: string;
      phone: string;
      address: string;
      postcode: string;
    },
    weight: number,
    declaredValue?: number,
    orderNumber?: string
  ): Promise<CreateShipmentResult> {
    try {
      const response = await this.client.put('/1.0/user/backlog', [
        {
          'address-type-to': 'DEFAULT',
          'given-name': recipient.name.split(' ')[0],
          'house-to': '',
          'index-to': recipient.postcode,
          'mail-category': 'ORDINARY',
          'mail-direct': 643, // Russia
          'mail-type': 'POSTAL_PARCEL',
          mass: weight,
          'middle-name': '',
          'order-num': orderNumber,
          'place-to': '',
          'postoffice-code': sender.postcode,
          'recipient-name': recipient.name,
          'region-to': '',
          'room-to': '',
          'slash-to': '',
          'str-index-to': recipient.postcode,
          'street-to': recipient.address,
          surname: recipient.name.split(' ').slice(1).join(' '),
          'tel-address': recipient.phone,
          'insr-value': declaredValue ? declaredValue * 100 : 0,
        },
      ]);

      if (response.data.errors && response.data.errors.length > 0) {
        return {
          success: false,
          error: response.data.errors.map((e: any) => e.description).join(', '),
        };
      }

      return {
        success: true,
        orderId: response.data['result-ids']?.[0],
        trackingNumber: response.data.barcode,
      };
    } catch (error: any) {
      console.error('[Russian Post] Create shipment failed:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message,
      };
    }
  }

  /**
   * Track shipment
   */
  async trackShipment(trackingNumber: string): Promise<TrackingResult | null> {
    try {
      const response = await this.client.get(`/1.0/tracking/${trackingNumber}`);

      return {
        trackingNumber,
        status: response.data['operation-history']?.[0]?.['operation-attr']?.['oper-name'] || 'Unknown',
        events: (response.data['operation-history'] || []).map((event: any) => ({
          date: event['operation-parameters']?.['oper-date'],
          status: event['operation-attr']?.['oper-name'],
          location: event['address-parameters']?.['dest-index'],
          description: event['operation-attr']?.['oper-type'],
        })),
      };
    } catch (error) {
      console.error('[Russian Post] Track shipment failed:', error);
      return null;
    }
  }
}

// ============================================
// SberLogistics (СберЛогистика) Integration
// ============================================

interface SberLogisticsConfig {
  apiKey: string;
  isTest?: boolean;
}

export class SberLogisticsService {
  private client: AxiosInstance;
  private config: SberLogisticsConfig;

  constructor(config: SberLogisticsConfig) {
    this.config = config;
    const baseURL = config.isTest
      ? 'https://api-test.sberlogistics.ru'
      : 'https://api.sberlogistics.ru';

    this.client = axios.create({
      baseURL,
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': config.apiKey,
      },
    });
  }

  /**
   * Calculate shipping rates
   */
  async calculateRates(
    fromCity: string,
    toCity: string,
    weight: number, // kg
    dimensions?: { length: number; width: number; height: number }
  ): Promise<ShippingRate[]> {
    try {
      const response = await this.client.post('/v1/calculate', {
        from: { city: fromCity },
        to: { city: toCity },
        cargo: {
          weight,
          ...dimensions,
        },
      });

      return (response.data.services || []).map((service: any) => ({
        provider: 'sberlogistics',
        serviceName: service.name,
        price: service.price,
        currency: 'RUB',
        deliveryDays: {
          min: service.delivery_days_min,
          max: service.delivery_days_max,
        },
        serviceCode: service.code,
      }));
    } catch (error: any) {
      console.error('[SberLogistics] Calculate rates failed:', error.response?.data || error.message);
      return [];
    }
  }

  /**
   * Create shipment order
   */
  async createOrder(
    sender: {
      name: string;
      phone: string;
      address: string;
      city: string;
    },
    recipient: {
      name: string;
      phone: string;
      address: string;
      city: string;
    },
    cargo: {
      weight: number;
      length?: number;
      width?: number;
      height?: number;
      description?: string;
    },
    serviceCode: string,
    orderNumber?: string
  ): Promise<CreateShipmentResult> {
    try {
      const response = await this.client.post('/v1/orders', {
        external_id: orderNumber,
        service_code: serviceCode,
        sender: {
          name: sender.name,
          phone: sender.phone,
          address: {
            city: sender.city,
            street: sender.address,
          },
        },
        recipient: {
          name: recipient.name,
          phone: recipient.phone,
          address: {
            city: recipient.city,
            street: recipient.address,
          },
        },
        cargo,
      });

      return {
        success: true,
        orderId: response.data.id,
        trackingNumber: response.data.tracking_number,
      };
    } catch (error: any) {
      console.error('[SberLogistics] Create order failed:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message,
      };
    }
  }

  /**
   * Track shipment
   */
  async trackShipment(trackingNumber: string): Promise<TrackingResult | null> {
    try {
      const response = await this.client.get(`/v1/tracking/${trackingNumber}`);

      return {
        trackingNumber,
        status: response.data.status,
        events: (response.data.history || []).map((event: any) => ({
          date: event.timestamp,
          status: event.status,
          location: event.location,
          description: event.description,
        })),
        estimatedDelivery: response.data.estimated_delivery,
      };
    } catch (error) {
      console.error('[SberLogistics] Track shipment failed:', error);
      return null;
    }
  }
}

// ============================================
// Logistics Service Factory
// ============================================

export type LogisticsProvider = 'cdek' | 'russian_post' | 'sberlogistics';

let cdekService: CdekService | null = null;
let russianPostService: RussianPostService | null = null;
let sberLogisticsService: SberLogisticsService | null = null;

export function getLogisticsService(
  provider: LogisticsProvider
): CdekService | RussianPostService | SberLogisticsService | null {
  switch (provider) {
    case 'cdek':
      if (!cdekService && process.env.CDEK_CLIENT_ID && process.env.CDEK_CLIENT_SECRET) {
        cdekService = new CdekService({
          clientId: process.env.CDEK_CLIENT_ID,
          clientSecret: process.env.CDEK_CLIENT_SECRET,
          isTest: process.env.CDEK_TEST_MODE === 'true',
        });
      }
      return cdekService;

    case 'russian_post':
      if (
        !russianPostService &&
        process.env.RUSSIAN_POST_LOGIN &&
        process.env.RUSSIAN_POST_PASSWORD &&
        process.env.RUSSIAN_POST_TOKEN
      ) {
        russianPostService = new RussianPostService({
          login: process.env.RUSSIAN_POST_LOGIN,
          password: process.env.RUSSIAN_POST_PASSWORD,
          token: process.env.RUSSIAN_POST_TOKEN,
        });
      }
      return russianPostService;

    case 'sberlogistics':
      if (!sberLogisticsService && process.env.SBERLOGISTICS_API_KEY) {
        sberLogisticsService = new SberLogisticsService({
          apiKey: process.env.SBERLOGISTICS_API_KEY,
          isTest: process.env.SBERLOGISTICS_TEST_MODE === 'true',
        });
      }
      return sberLogisticsService;

    default:
      return null;
  }
}

/**
 * Get shipping rates from all configured providers
 */
export async function getAllShippingRates(
  fromCity: string,
  toCity: string,
  weight: number, // grams
  dimensions?: { length: number; width: number; height: number }
): Promise<ShippingRate[]> {
  const rates: ShippingRate[] = [];

  // CDEK
  const cdek = getLogisticsService('cdek');
  if (cdek instanceof CdekService) {
    const cdekRates = await cdek.calculateRates({
      type: 1,
      from_location: { city: fromCity },
      to_location: { city: toCity },
      packages: [{ weight, ...dimensions }],
    });
    rates.push(...cdekRates);
  }

  // SberLogistics
  const sber = getLogisticsService('sberlogistics');
  if (sber instanceof SberLogisticsService) {
    const sberRates = await sber.calculateRates(
      fromCity,
      toCity,
      weight / 1000, // convert to kg
      dimensions
    );
    rates.push(...sberRates);
  }

  // Sort by price
  return rates.sort((a, b) => a.price - b.price);
}

/**
 * Track shipment across all providers
 */
export async function trackShipment(
  trackingNumber: string,
  provider?: LogisticsProvider
): Promise<TrackingResult | null> {
  if (provider) {
    const service = getLogisticsService(provider);
    if (service) {
      return service.trackShipment(trackingNumber);
    }
    return null;
  }

  // Try all providers
  const providers: LogisticsProvider[] = ['cdek', 'russian_post', 'sberlogistics'];
  
  for (const p of providers) {
    const service = getLogisticsService(p);
    if (service) {
      const result = await service.trackShipment(trackingNumber);
      if (result) {
        return result;
      }
    }
  }

  return null;
}
