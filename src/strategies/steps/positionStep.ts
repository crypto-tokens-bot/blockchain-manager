import {
  IExchangeAdapter,
  OrderParams,
  OrderResult,
  OrderSide,
} from "../../blockchain/exchanges/IExchangeAdapter";

export class PositionStep {
  constructor(private exchangeService: IExchangeAdapter) {}

  public async execute(symbol: string, amount: string): Promise<OrderResult> {
    console.info(
      `Step: open short position  symbol=${symbol}  amount=${amount}`
    );

    const params: OrderParams = {
      symbol,
      baseSize: Number(amount),
      side: OrderSide.Sell,
    };

    const result = await this.exchangeService.createMarket(params);

    if (result.status === "rejected") {
      throw new Error(
        `PositionStep failed: order was rejected (id=${result.orderId})`
      );
    }

    console.info(
      `Position opened successfully  orderId=${result.orderId}  status=${result.status}`
    );
    return result;
  }
}
