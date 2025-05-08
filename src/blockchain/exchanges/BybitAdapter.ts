// src/exchanges/BybitAdapter.ts
import {
  IExchangeAdapter,
  OrderParams,
  OrderResult,
  OrderSide,
} from "./IExchangeAdapter";
import { ethers } from "ethers";
import axios from 'axios';
import crypto from 'crypto';


export class BybitAdapter implements IExchangeAdapter {
  private readonly baseUrl = 'https://api.bybit.com';
  private readonly futuresEndpoint = '/v5/order/create';

  constructor(private apiKey: string, private apiSecret: string) {}
  public async createLimit(params: OrderParams): Promise<OrderResult> {
    if (!params.price) {
      throw new Error("Price is required for limit orders");
    }
    const symbol = formatSymbol(params.symbol);
    const requestParams = {
      symbol,
      side: params.side === OrderSide.Buy ? "Buy" : "Sell",
      orderType: "Limit",
      qty: params.baseSize.toString(),
      price: params.price.toString(),
      timeInForce: "GoodTillCancel", // Default GTC
      category: "linear", //Linear futures (USDT)
      positionIdx: 0, // (0: One-Way Mode)
    };

    try {
      const response = await this.sendSignedRequest(
        "POST",
        this.futuresEndpoint,
        requestParams
      );

      if (response.retCode === 0) {
        return {
          orderId: response.result.orderId,
          orderType: "limit",
          status: mapOrderStatus(response.result.orderStatus),
          filledSize: parseFloat(response.result.cumExecQty || "0"),
        };
      } else {
        throw new Error(`Bybit API error: ${response.retMsg}`);
      }
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to create limit order: ${error.message}`);
      }
      throw error;
    }
  }

  public async createMarket(params: OrderParams): Promise<OrderResult> {
    const symbol = formatSymbol(params.symbol);
    
    const requestParams = {
      symbol,
      side: params.side === OrderSide.Buy ? 'Buy' : 'Sell',
      orderType: 'Market',
      qty: params.baseSize.toString(),
      category: 'linear',
      positionIdx: 0,
    };
    
    try {
      const response = await this.sendSignedRequest('POST', this.futuresEndpoint, requestParams);
      
      if (response.retCode === 0) {
        return {
          orderId: response.result.orderId,
          orderType: 'market',
          status: mapOrderStatus(response.result.orderStatus),
          filledSize: parseFloat(response.result.cumExecQty || '0')
        };
      } else {
        throw new Error(`Bybit API error: ${response.retMsg}`);
      }
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to create market order: ${error.message}`);
      }
      throw error;
    }
  }

  public async sendSignedRequest(
    method: string,
    endpoint: string,
    params: Record<string, any>
  ): Promise<any> {
    const timestamp = Date.now().toString();
    
    const queryString = buildQueryString(params);
    
    const signString = timestamp + this.apiKey + queryString;
    
    const signature = crypto
      .createHmac('sha256', this.apiSecret)
      .update(signString)
      .digest('hex');
    
    const headers = {
      'X-BAPI-API-KEY': this.apiKey,
      'X-BAPI-TIMESTAMP': timestamp,
      'X-BAPI-SIGN': signature,
      'Content-Type': 'application/json'
    };
    
    try {
      let response;
      if (method === 'GET') {
        response = await axios.get(
          `${this.baseUrl}${endpoint}?${queryString}`,
          { headers }
        );
      } else {
        response = await axios.post(
          `${this.baseUrl}${endpoint}`,
          params,
          { headers }
        );
      }
      
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(`Bybit API error: ${JSON.stringify(error.response.data)}`);
      }
      throw error;
    }
  }
  
}


function formatSymbol(symbol: string): string {
  return symbol.replace('/', '');
}

function extractAdditionalParams(params: OrderParams): Record<string, any> {
  const additionalParams: Record<string, any> = {};
  
  const handledKeys = ['symbol', 'baseSize', 'price', 'side'];
  
  Object.keys(params)
    .filter(key => !handledKeys.includes(key))
    .forEach(key => {
      additionalParams[key] = params[key];
    });
  
  return additionalParams;
}

function mapOrderStatus(bybitStatus: string): "open" | "filled" | "rejected" {
  const statusMap: Record<string, "open" | "filled" | "rejected"> = {
    'New': 'open',
    'Created': 'open',
    'Untriggered': 'open',
    'Rejected': 'rejected',
    'PartiallyFilled': 'open',
    'Filled': 'filled',
    'Cancelled': 'rejected',
    'PendingCancel': 'open'
  };
  
  return statusMap[bybitStatus] || 'rejected';
}

function buildQueryString(params: Record<string, any>): string {
  const sortedParams = Object.keys(params)
    .sort()
    .reduce<Record<string, any>>((result, key) => {
      result[key] = params[key];
      return result;
    }, {});
  
  return Object.entries(sortedParams)
    .map(([key, value]) => `${key}=${value}`)
    .join('&');
}