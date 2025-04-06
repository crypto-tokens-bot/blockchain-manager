import * as hl from "@nktkas/hyperliquid";
import { HttpTransport, WebSocketTransport } from "@nktkas/hyperliquid";
import { ethers } from "ethers";
import { privateKeyToAccount } from "viem/accounts";

export interface OrderParams {
  symbol: string;           // A trading pair, for example, "AXS/USDT"
  side: "BUY" | "SELL";     // Order direction
  type: "LIMIT" | "MARKET"; // Order type
  quantity: number;         // Quantity
  price?: string;           // The price for a limit order (in string format, for example "30,000")
  leverage?: number;        // Leverage (on default 1)
}

export class HyperliquidConnector {
  private walletClient: hl.WalletClient;
  private publicClient: hl.PublicClient;

  constructor(
    private privateKey: string,
    private apiKey: string,
    private apiSecret: string,
    private baseURL: string = "https://api.hyperliquid.io",
    useWebSocket: boolean = false
  ) {
    const transport = useWebSocket ? new hl.WebSocketTransport() : new hl.HttpTransport();
    this.walletClient = new hl.WalletClient({ wallet: privateKeyToAccount("0x..."), transport }); // check later
    
    this.publicClient = new hl.PublicClient({ transport });
  }

  /**
   * Creates a limit order.
   */
  async createLimitOrder(params: OrderParams): Promise<any> {
    if (params.type !== "LIMIT" || !params.price) {
      throw new Error("Для лимитного ордера обязательно укажите цену.");
    }
    try {
      const order = await this.walletClient.order({
        orders: [{
          a: 0,
          b: params.side === "BUY",
          p: params.price,
          s: params.quantity.toString(),
          r: false,
          t: {
            limit: {
              tif: "Gtc"
            }
          },
        }],
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
      throw new Error("Для рыночного ордера тип должен быть MARKET.");
    }
    
    try {
      const order = await this.walletClient.order({
        orders: [{
          a: 0,
          b: params.side === "BUY",
          p: "0",
          s: params.quantity.toString(),
          r: false,
          t: {
            limit: {
                tif: "Ioc"
              }
          },
        }],
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
//   async getBalance(): Promise<any> {
//     try {
//       const balance = await this.publicClient.bal({ user: "0x..." });
//       return balance;
//     } catch (error) {
//       console.error("Error in getBalance:", error);
//       throw error;
//     }
//   }

}
