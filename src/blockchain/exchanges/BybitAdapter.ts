// src/exchanges/BybitAdapter.ts
import { IExchangeAdapter, OrderParams, OrderResult } from "./IExchangeAdapter";
import { ethers } from "ethers";
// (здесь ваш SDK или RPC для Bybit)

export class BybitAdapter implements IExchangeAdapter {
  constructor(private apiKey: string, private apiSecret: string) {}
  async createLimit(params: OrderParams): Promise<OrderResult> {
        throw new Error("Method not implemented.");
    }

  async createMarket(params: OrderParams): Promise<OrderResult> {
    throw new Error("Method not implemented.");
  }
}
