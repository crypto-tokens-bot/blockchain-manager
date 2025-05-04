export enum OrderSide {
    Buy,
    Sell
}

export interface OrderParams {
  symbol: string; // e.g. "ETH/USDT"
  baseSize: number;
  price?: number;
  side: OrderSide,
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
