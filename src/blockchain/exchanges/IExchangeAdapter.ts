export enum OrderSide {
  Buy,
  Sell,
}

export interface OrderParams {
  symbol: string; // e.g. "ETH/USDT"
  baseSize: number;
  price?: number;
  side: OrderSide;
  [key: string]: any;
}

export interface OrderResult {
  orderId: string;
  orderType: string;
  status: "open" | "filled" | "rejected";
  filledSize?: number;
}

export interface IExchangeAdapter {
  createMarket(params: OrderParams): Promise<OrderResult>;
  createLimit(params: OrderParams): Promise<OrderResult>;
}

export interface PositionInfo {
  symbol: string;
  side: "Buy" | "Sell";
  size: number;
  entryPrice: number;
  leverage: number;
  markPrice: number;
  liquidationPrice: number;
  unrealisedPnl: number;
  marginType: string;
  positionValue: number;
  positionIdx: number;
  createdTime: string;
  updatedTime: string;
}

export interface FundingInfo {
  symbol: string;
  fundingRate: number;
  fundingRateTimestamp: number;
  predictedFundingRate: number;
  nextFundingTime: number;
}

export interface FundingHistory {
  symbol: string;
  fundingRate: number;
  fundingRateTimestamp: number;
  paymentAmount: number;
}

