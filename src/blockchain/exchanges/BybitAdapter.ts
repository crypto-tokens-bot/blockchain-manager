// src/exchanges/BybitAdapter.ts
import { IExchangeAdapter, OrderParams, OrderResult } from "./IExchangeAdapter";
import { ethers } from "ethers";
// (здесь ваш SDK или RPC для Bybit)

export class BybitAdapter implements IExchangeAdapter {
  constructor(private apiKey: string, private apiSecret: string) {}
  public async createLimit(params: OrderParams): Promise<OrderResult> {
        throw new Error("Method not implemented.");
    }

  public async createMarket(params: OrderParams): Promise<OrderResult> {
    throw new Error("Method not implemented.");
  }
}
