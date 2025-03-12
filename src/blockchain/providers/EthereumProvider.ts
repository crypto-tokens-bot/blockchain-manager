import { TransactionResponse } from "ethers";
import { BlockchainAccount } from "../types/account";
import { AbstractProvider } from "./AbstractProvider";
import { ethers } from "ethers";
import dotenv from "dotenv";

import logger from "../../utils/logger";

dotenv.config();

const provider = new ethers.JsonRpcProvider(process.env.ETH_RPC_URL);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY!, provider);

export class EthereumProvider extends AbstractProvider {
  private provider: ethers.JsonRpcProvider;
  private signer: ethers.Wallet;

  constructor(rpcUrl: string, privateKey: string) {
    super(rpcUrl);
    this.provider = new ethers.JsonRpcProvider(rpcUrl);
    this.signer = new ethers.Wallet(privateKey, this.provider);
  }

  connect(): Promise<void> {
    throw new Error("Method not implemented.");
  }
  async getBalance(address: string, tokenAddress?: string): Promise<bigint> {
    if (!tokenAddress) {
      // native ETH balance
      let response = await this.provider.getBalance(address);
      return BigInt(response.toString());
    }
    const abi = ""; // later fix

    const tokenContract = new ethers.Contract(tokenAddress, abi, this.provider);
    const balance = await tokenContract.balanceOf(address);

    return BigInt(balance.toString());
  }
  getAccountInfo(address: string): Promise<BlockchainAccount> {
    throw new Error("Method not implemented.");
  }
  async sendTransaction(
    tx: ethers.TransactionRequest
  ): Promise<TransactionResponse | null> {
    try {
      logger.info(`Sending transaction: ${JSON.stringify(tx, null, 2)}`);

      const signedTx = await wallet.sendTransaction(tx);
      await signedTx.wait(); // Wait for confirmation

      logger.info(`Transaction sent: ${signedTx.hash}`);
      return signedTx;
    } catch (error) {
      logger.error("Transaction failed", error);
      return null;
    }
  }
  estimateGas(txData: any): Promise<bigint> {
    //let estimateData = this.provider.estimateGas(tx);
    throw new Error("Method not implemented.");
  }
  getTransactionByHash(txHash: string): Promise<any> {
    throw new Error("Method not implemented.");
  }
  getLogs(filter: any): Promise<any[]> {
    throw new Error("Method not implemented.");
  }
}
