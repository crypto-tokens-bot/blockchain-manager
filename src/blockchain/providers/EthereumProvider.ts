import { BlockchainAccount } from "../types/account";
import { AbstractProvider } from "./AbstractProvider";
import { ethers } from "ethers";

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
  sendTransaction(txData: any): Promise<string> {
    throw new Error("Method not implemented.");
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
