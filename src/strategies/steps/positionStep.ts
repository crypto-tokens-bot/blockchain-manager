import {
  IExchangeAdapter,
  OrderParams,
  OrderResult,
  OrderSide,
} from "../../blockchain/exchanges/IExchangeAdapter";
import logger from "../../utils/logger";

export enum PositionAction {
  OPEN,
  CLOSE,
  PARTIAL_CLOSE,
}

export class PositionStep {
  constructor(private exchangeService: IExchangeAdapter) {}

  public async execute(
    symbol: string,
    amount: string,
    action: PositionAction = PositionAction.OPEN,
    closePercent?: number
  ): Promise<OrderResult> {
    if (action === PositionAction.OPEN) {
      return this.openPosition(symbol, amount);
    } else if (
      action === PositionAction.CLOSE ||
      action === PositionAction.PARTIAL_CLOSE
    ) {
      if (action === PositionAction.PARTIAL_CLOSE && !closePercent) {
        throw new Error(
          "closePercent must be provided for PARTIAL_CLOSE action"
        );
      }
      return this.closePosition(
        symbol,
        action === PositionAction.PARTIAL_CLOSE ? closePercent! : 100
      );
    } else {
      throw new Error(`Unsupported position action: ${action}`);
    }
  }

  /**
   * Open a new position
   *
   * @param symbol Trading pair symbol
   * @param amount Amount in quote currency (e.g. USDT)
   * @returns Order result
   */
  private async openPosition(
    symbol: string,
    amount: string
  ): Promise<OrderResult> {
    logger.info(`Opening short position`, { symbol, amount });

    const params: OrderParams = {
      symbol,
      baseSize: Number(amount),
      side: OrderSide.Sell, // Open short
    };

    const result = await this.exchangeService.createMarket(params);

    if (result.status === "rejected") {
      throw new Error(
        `PositionStep failed: order was rejected (id=${result.orderId})`
      );
    }

    logger.info(`Position opened successfully`, {
      orderId: result.orderId,
      status: result.status,
    });
    return result;
  }

  /**
   * Close a position completely or partially
   *
   * @param symbol Trading pair symbol
   * @param percentage Percentage to close (0-100)
   * @returns Order result
   */
  private async closePosition(
    symbol: string,
    percentage: number
  ): Promise<OrderResult> {
    logger.info(`Closing position`, { symbol, percentage });

    // Get current position info
    const position = await this.exchangeService.getPosition(symbol);
    if (!position) {
      throw new Error(`No open position found for symbol ${symbol}`);
    }

    const closeSize = position.size * (percentage / 100);
    logger.info(`Calculated closing size`, {
      totalSize: position.size,
      percentage,
      closeSize,
    });

    // Create a market order to close the position (buy to close a short)
    const params: OrderParams = {
      symbol,
      baseSize: closeSize,
      side: OrderSide.Buy, // Close short by buying
    };

    const result = await this.exchangeService.createMarket(params);

    if (result.status === "rejected") {
      throw new Error(
        `Failed to close position: order was rejected (id=${result.orderId})`
      );
    }

    logger.info(
      `Position ${
        percentage === 100 ? "closed" : "partially closed"
      } successfully`,
      {
        orderId: result.orderId,
        status: result.status,
        closedSize: closeSize,
      }
    );

    return result;
  }

  public async getPositionValue(symbol: string): Promise<number> {
    const position = await this.exchangeService.getPosition(symbol);
    if (!position) return 0;

    return position.positionValue;
  }
}
