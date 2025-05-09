// src/exchanges/BybitAdapter.ts
import {
  FundingHistory,
  FundingInfo,
  IExchangeAdapter,
  OrderParams,
  OrderResult,
  OrderSide,
  PositionInfo,
} from "./IExchangeAdapter";
import { ethers } from "ethers";
import axios from "axios";
import crypto from "crypto";

export class BybitAdapter implements IExchangeAdapter {
  private readonly baseUrl = "https://api.bybit.com";
  private readonly futuresEndpoint = "/v5/order/create";
  private readonly cancelOrderEndpoint = "/v5/order/cancel";
  private readonly positionEndpoint = "/v5/position/list";
  private readonly fundingEndpoint = "/v5/market/funding/history";
  private readonly fundingRateEndpoint = "/v5/market/funding/prev-funding-rate";

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
      side: params.side === OrderSide.Buy ? "Buy" : "Sell",
      orderType: "Market",
      qty: params.baseSize.toString(),
      category: "linear",
      positionIdx: 0,
      ...extractAdditionalParams(params),
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
          orderType: "market",
          status: mapOrderStatus(response.result.orderStatus),
          filledSize: parseFloat(response.result.cumExecQty || "0"),
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
    const recvWindow = "5000";

    //const queryString = buildQueryString(params);
    const requestParams = { ...params };
    let signString;
    let postBody;

    //const signString = timestamp + this.apiKey + recvWindow + queryString;

    if (method === "GET") {
      const queryString = Object.keys(requestParams)
        .sort()
        .map((key) => `${key}=${encodeURIComponent(requestParams[key])}`)
        .join("&");

      signString = timestamp + this.apiKey + recvWindow + queryString;
      postBody = null;
    } else {
      const sortedParams: Record<string, any> = {};
      Object.keys(requestParams)
        .sort()
        .forEach((key) => {
          sortedParams[key] = requestParams[key];
        });

      const jsonParams = JSON.stringify(sortedParams);
      signString = timestamp + this.apiKey + recvWindow + jsonParams;
      postBody = sortedParams;
    }
    const signature = crypto
      .createHmac("sha256", this.apiSecret)
      .update(signString)
      .digest("hex");

    const headers = {
      "X-BAPI-API-KEY": this.apiKey,
      "X-BAPI-TIMESTAMP": timestamp,
      "X-BAPI-SIGN": signature,
      "X-BAPI-RECV-WINDOW": recvWindow,
      "Content-Type": "application/json",
    };
    console.log("Request details:");
    console.log("- Method:", method);
    console.log("- Endpoint:", endpoint);
    console.log("- Params:", JSON.stringify(requestParams));
    console.log("- Sign string:", signString);

    try {
      let response;
      if (method === "GET") {
        const queryParams = Object.keys(requestParams)
          .map((key) => `${key}=${encodeURIComponent(requestParams[key])}`)
          .join("&");

        response = await axios.get(
          `${this.baseUrl}${endpoint}?${queryParams}`,
          { headers }
        );
      } else {
        response = await axios.post(`${this.baseUrl}${endpoint}`, postBody, {
          headers,
        });
      }

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        console.error("API Response Error:", error.response.data);
        throw new Error(
          `Bybit API error: ${JSON.stringify(error.response.data)}`
        );
      }
      throw error;
    }
  }

  public async cancelOrder(
    orderId: string,
    symbol: string
  ): Promise<OrderResult> {
    const formattedSymbol = formatSymbol(symbol);

    const requestParams = {
      symbol: formattedSymbol,
      orderId,
      category: "linear",
    };

    try {
      const response = await this.sendSignedRequest(
        "POST",
        this.cancelOrderEndpoint,
        requestParams
      );

      if (response.retCode === 0) {
        return {
          orderId: response.result.orderId,
          orderType: response.result.orderType.toLowerCase(),
          status:
            response.result.orderStatus === "Cancelled" ? "rejected" : "open",
          filledSize: parseFloat(response.result.cumExecQty || "0"),
        };
      } else {
        throw new Error(`Bybit API error: ${response.retMsg}`);
      }
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to cancel order: ${error.message}`);
      }
      throw error;
    }
  }

  public async getPosition(symbol: string): Promise<PositionInfo | null> {
    const formattedSymbol = formatSymbol(symbol);

    const requestParams = {
      symbol: formattedSymbol,
      category: "linear",
    };

    try {
      const response = await this.sendSignedRequest(
        "GET",
        this.positionEndpoint,
        requestParams
      );

      if (response.retCode === 0) {
        if (response.result.list && response.result.list.length > 0) {
          const position = response.result.list[0];

          return {
            symbol: position.symbol,
            side: position.side,
            size: parseFloat(position.size),
            entryPrice: parseFloat(position.entryPrice),
            leverage: parseFloat(position.leverage),
            markPrice: parseFloat(position.markPrice),
            liquidationPrice: parseFloat(position.liqPrice),
            unrealisedPnl: parseFloat(position.unrealisedPnl),
            marginType: position.marginType,
            positionValue: parseFloat(position.positionValue),
            positionIdx: position.positionIdx,
            createdTime: position.createdTime,
            updatedTime: position.updatedTime,
          };
        } else {
          return null;
        }
      } else {
        throw new Error(`Bybit API error: ${response.retMsg}`);
      }
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to get position: ${error.message}`);
      }
      throw error;
    }
  }

  public async closePosition(symbol: string): Promise<OrderResult> {
    const position = await this.getPosition(symbol);

    if (!position || position.size === 0) {
      throw new Error(`No open position for ${symbol}`);
    }

    const closeSide = position.side === "Buy" ? OrderSide.Sell : OrderSide.Buy;

    return this.createMarket({
      symbol,
      baseSize: Math.abs(position.size),
      side: closeSide,
      reduceOnly: true, // Important: only close a position, not open a new one
    });
  }

  public async setLeverage(symbol: string, leverage: number): Promise<boolean> {
    const formattedSymbol = formatSymbol(symbol);

    const requestParams = {
      symbol: formattedSymbol,
      category: "linear",
      buyLeverage: leverage.toString(),
      sellLeverage: leverage.toString(),
    };

    try {
      const response = await this.sendSignedRequest(
        "POST",
        "/v5/position/set-leverage",
        requestParams
      );

      if (response.retCode === 0) {
        return true;
      } else {
        throw new Error(`Bybit API error: ${response.retMsg}`);
      }
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to set leverage: ${error.message}`);
      }
      throw error;
    }
  }

  public async getFundingRate(symbol: string): Promise<FundingInfo> {
    const formattedSymbol = formatSymbol(symbol);

    const requestParams = {
      symbol: formattedSymbol,
      category: "linear",
    };

    try {
      const response = await this.sendSignedRequest(
        "GET",
        this.fundingRateEndpoint,
        requestParams
      );

      if (
        response.retCode === 0 &&
        response.result.list &&
        response.result.list.length > 0
      ) {
        const fundingData = response.result.list[0];

        // Получаем информацию о следующем фондировании
        const symbolInfoResponse = await axios.get(
          `${this.baseUrl}/v5/market/tickers`,
          {
            params: {
              category: "linear",
              symbol: formattedSymbol,
            },
          }
        );

        let nextFundingTime = 0;
        let predictedRate = 0;

        if (
          symbolInfoResponse.data.retCode === 0 &&
          symbolInfoResponse.data.result.list &&
          symbolInfoResponse.data.result.list.length > 0
        ) {
          const symbolInfo = symbolInfoResponse.data.result.list[0];
          nextFundingTime = parseInt(symbolInfo.nextFundingTime || "0");
          predictedRate = parseFloat(symbolInfo.predictedFundingRate || "0");
        }

        return {
          symbol: fundingData.symbol,
          fundingRate: parseFloat(fundingData.fundingRate),
          fundingRateTimestamp: parseInt(fundingData.fundingRateTimestamp),
          predictedFundingRate: predictedRate,
          nextFundingTime: nextFundingTime,
        };
      } else {
        throw new Error(`Bybit API error: ${response.retMsg}`);
      }
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to get funding rate: ${error.message}`);
      }
      throw error;
    }
  }

  public async getFundingHistory(
    symbol: string,
    limit: number = 20
  ): Promise<FundingHistory[]> {
    const formattedSymbol = formatSymbol(symbol);

    const requestParams = {
      symbol: formattedSymbol,
      category: "linear",
      limit: limit.toString(),
    };

    try {
      const response = await this.sendSignedRequest(
        "GET",
        this.fundingEndpoint,
        requestParams
      );

      if (response.retCode === 0) {
        if (response.result.list && response.result.list.length > 0) {
          return response.result.list.map(
            (item: {
              symbol: any;
              fundingRate: string;
              fundingRateTimestamp: string;
              payment: string;
            }) => ({
              symbol: item.symbol,
              fundingRate: parseFloat(item.fundingRate),
              fundingRateTimestamp: parseInt(item.fundingRateTimestamp),
              paymentAmount: parseFloat(item.payment),
            })
          );
        } else {
          return [];
        }
      } else {
        throw new Error(`Bybit API error: ${response.retMsg}`);
      }
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to get funding history: ${error.message}`);
      }
      throw error;
    }
  }

  public async calculateAccumulatedFunding(
    symbol: string,
    openPositionTime: number
  ): Promise<number> {
    const history = await this.getFundingHistory(symbol, 100);
    const relevantHistory = history.filter(
      (item) => item.fundingRateTimestamp >= openPositionTime
    );

    return relevantHistory.reduce((sum, item) => sum + item.paymentAmount, 0);
  }

  public async adjustPosition(
    params: OrderParams & { targetSize: number }
  ): Promise<OrderResult> {
    const position = await this.getPosition(params.symbol);

    if (!position) {
      return this.createMarket({
        symbol: params.symbol,
        baseSize: params.targetSize,
        side: params.side,
      });
    }

    const currentSize = position.size;
    const currentSide =
      position.side === "Buy" ? OrderSide.Buy : OrderSide.Sell;

    // Determining whether to increase or decrease the position
    if (params.side === currentSide) {
      // Same side, change the position size
      const sizeDifference = Math.abs(params.targetSize - currentSize);

      if (sizeDifference < 0.00001) {
        //The size already matches the target size
        return {
          orderId: "no_order_needed",
          orderType: "none",
          status: "filled",
          filledSize: 0,
        };
      }

      if (params.targetSize > currentSize) {
        return this.createMarket({
          symbol: params.symbol,
          baseSize: sizeDifference,
          side: params.side,
        });
      } else {
        return this.createMarket({
          symbol: params.symbol,
          baseSize: sizeDifference,
          side: params.side === OrderSide.Buy ? OrderSide.Sell : OrderSide.Buy,
          reduceOnly: true,
        });
      }
    } else {
      // The opposite side, first we close the current position, then we open a new one
      await this.closePosition(params.symbol);

      // Opening a new position
      return this.createMarket({
        symbol: params.symbol,
        baseSize: params.targetSize,
        side: params.side,
      });
    }
  }

  public async setStopLoss(
    symbol: string,
    stopPrice: number
  ): Promise<OrderResult> {
    const position = await this.getPosition(symbol);

    if (!position || position.size === 0) {
      throw new Error(`No open position for ${symbol}`);
    }

    const formattedSymbol = formatSymbol(symbol);
    const side = position.side === "Buy" ? OrderSide.Sell : OrderSide.Buy;

    const requestParams = {
      symbol: formattedSymbol,
      side: side === OrderSide.Buy ? "Buy" : "Sell",
      orderType: "Market",
      qty: position.size.toString(),
      category: "linear",
      positionIdx: position.positionIdx,
      stopPrice: stopPrice.toString(),
      triggerBy: "MarkPrice",
      timeInForce: "GoodTillCancel",
      closeOnTrigger: true,
      reduceOnly: true,
    };

    try {
      const response = await this.sendSignedRequest(
        "POST",
        "/v5/order/create-stop",
        requestParams
      );

      if (response.retCode === 0) {
        return {
          orderId: response.result.orderId,
          orderType: "stop_market",
          status: "open",
          filledSize: 0,
        };
      } else {
        throw new Error(`Bybit API error: ${response.retMsg}`);
      }
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to set stop loss: ${error.message}`);
      }
      throw error;
    }
  }

  public async getPositionPnL(
    symbol: string
  ): Promise<{ pnlAmount: number; pnlPercentage: number }> {
    const position = await this.getPosition(symbol);

    if (!position || position.size === 0) {
      return { pnlAmount: 0, pnlPercentage: 0 };
    }

    const unrealisedPnl = position.unrealisedPnl;
    const positionValue = position.positionValue;

    // Calculating the percentage of profit/loss
    const pnlPercentage =
      positionValue !== 0 ? (unrealisedPnl / positionValue) * 100 : 0;

    return {
      pnlAmount: unrealisedPnl,
      pnlPercentage,
    };
  }
}

function formatSymbol(symbol: string): string {
  return symbol.replace("/", "");
}

function extractAdditionalParams(params: OrderParams): Record<string, any> {
  const additionalParams: Record<string, any> = {};

  const handledKeys = ["symbol", "baseSize", "price", "side"];

  Object.keys(params)
    .filter((key) => !handledKeys.includes(key))
    .forEach((key) => {
      additionalParams[key] = params[key];
    });

  return additionalParams;
}

function mapOrderStatus(bybitStatus: string): "open" | "filled" | "rejected" {
  const statusMap: Record<string, "open" | "filled" | "rejected"> = {
    New: "open",
    Created: "open",
    Untriggered: "open",
    Rejected: "rejected",
    PartiallyFilled: "open",
    Filled: "filled",
    Cancelled: "rejected",
    PendingCancel: "open",
  };

  return statusMap[bybitStatus] || "rejected";
}
