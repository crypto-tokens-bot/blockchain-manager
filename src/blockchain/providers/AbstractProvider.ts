import { BlockchainAccount } from "../types/account";

export abstract class AbstractProvider {
  protected rpcUrl: string;

  constructor(rpcUrl: string) {
    this.rpcUrl = rpcUrl;
  }
  abstract getBalance(address: string, tokenAddress?: string): Promise<bigint>;
  abstract connect(): Promise<void>;
  abstract getAccountInfo(address: string): Promise<BlockchainAccount>;
  abstract sendTransaction(txData: any): Promise<string>;
  abstract estimateGas(txData: any): Promise<bigint>;
  abstract getTransactionByHash(txHash: string): Promise<any>;
  abstract getLogs(filter: any): Promise<any[]>;
}
