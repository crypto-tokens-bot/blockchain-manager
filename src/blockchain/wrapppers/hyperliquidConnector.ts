import * as hl from "@nktkas/hyperliquid";
import { HttpTransport, WebSocketTransport } from "@nktkas/hyperliquid";
import { ethers } from "ethers";
import { privateKeyToAccount } from "viem/accounts";

import type {
  Hex,
  PerpsAssetCtx,
  PerpsUniverse,
  PublicClient,
} from "@nktkas/hyperliquid/esm/mod";
import {
  formatPrice,
  formatSize,
  getAssetData,
  randomCloid,
} from "../utils/hyperliquidUtils";

export interface OrderParams {
  symbol: string; // A trading pair, for example, "AXS/USDT"
  side: "BUY" | "SELL"; // Order direction
  type: "LIMIT" | "MARKET"; // Order type
  quantity: number; // Quantity
  price?: string; // The price for a limit order (in string format, for example "30,000")
  leverage?: number; // Leverage (on default 1)
}

export class HyperliquidConnector {
  private walletClient: hl.WalletClient;
  private publicClient: hl.PublicClient;

  constructor(
    private privateKey: `0x${string}`,
    private apiKey: string,
    private apiSecret: string,
    private baseURL: string = "https://api.hyperliquid.io",
    isTestnet: boolean = true
  ) {
    const transport = new hl.HttpTransport({ isTestnet });
    const account = privateKeyToAccount(privateKey);
    this.walletClient = new hl.WalletClient({
      wallet: account,
      transport,
    }); // check later

    this.publicClient = new hl.PublicClient({ transport });
    this.apiKey = account.address;
    this.apiSecret = privateKey;
  }

  /**
   * Creates a limit order.
   */
  async createLimitOrder(params: OrderParams): Promise<any> {
    if (params.type !== "LIMIT" || !params.price) {
      throw new Error("Please specify the price for the limit order.");
    }
    try {
      const order = await this.walletClient.order({
        orders: [
          {
            a: 0,
            b: params.side === "BUY",
            p: params.price,
            s: params.quantity.toString(),
            r: false,
            t: {
              limit: {
                tif: "Gtc",
              },
            },
          },
        ],
        grouping: "na",
      });
      return order;
    } catch (error) {
      console.error("Error in createLimitOrder:", error);
      throw error;
    }
  }

  /**
   * Creates a market order.
   */
  async createMarketOrder(params: OrderParams): Promise<any> {
    if (params.type !== "MARKET") {
      throw new Error("For a market order, the type must be MARKET.");
    }

    try {
      const order = await this.walletClient.order({
        orders: [
          {
            a: 0,
            b: params.side === "BUY",
            p: "0",
            s: params.quantity.toString(),
            r: false,
            t: {
              limit: {
                tif: "Ioc",
              },
            },
          },
        ],
        grouping: "na",
      });
      return order;
    } catch (error) {
      console.error("Error in createMarketOrder:", error);
      throw error;
    }
  }

  /**
   * Gets the position for the specified character.
   */
  async getPosition(symbol: string): Promise<any> {
    try {
      const position = await this.publicClient.openOrders({ user: "0x..." });
      return position;
    } catch (error) {
      console.error("Error in getPosition:", error);
      throw error;
    }
  }

  /**
   * Get balance
   */
  async getBalance(): Promise<any> {
    try {
      const balance = await this.publicClient.portfolio({ user: "0x..." });
      return balance;
    } catch (error) {
      console.error("Error in getBalance:", error);
      throw error;
    }
  }

  /**
   * Cancellation of the order by its ID.
   */
  async cancelOrder(assetIndex: number, orderId: number): Promise<any> {
    try {
      const result = await this.walletClient.cancel({
        cancels: [
          {
            a: assetIndex,
            o: orderId,
          },
        ],
      });
      return result;
    } catch (error) {
      console.error("Error in cancelOrder:", error);
      throw error;
    }
  }

  async cancelAllOrders(symbol: string): Promise<any> {
    const account = privateKeyToAccount(this.privateKey);

    const { id, universe, ctx } = await getAssetData(this.publicClient, symbol);
    const pxUp = formatPrice(
      new BigNumber(ctx.markPx).times(1.01),
      universe.szDecimals
    );
    const pxDown = formatPrice(
      new BigNumber(ctx.markPx).times(0.99),
      universe.szDecimals
    );
    const sz = formatSize(
      new BigNumber(15).div(ctx.markPx),
      universe.szDecimals
    );

    const openOrders = await this.publicClient.openOrders({
      user: account.address,
    });
    const cancels = openOrders.map((o) => ({ a: id, o: o.oid }));
    await this.walletClient.cancel({ cancels });

    await this.walletClient
      .order({
        orders: [
          {
            a: id,
            b: false,
            p: pxDown,
            s: "0", // Full position size
            r: true,
            t: { limit: { tif: "Gtc" } },
          },
        ],
        grouping: "na",
      })
      .catch(() => undefined);
  }

  async updateLeverage(): Promise<any> {
    try {
      const response = this.walletClient.updateLeverage({
        asset: 1,
        leverage: 5,
        isCross: true,
      });
      return response;
    } catch (error) {
      console.error("Error in cancelOrder:", error);
      throw error;
    }
  }
}
