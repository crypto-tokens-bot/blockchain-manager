import { BlockchainAccount } from "../types/account";
import { AbstractProvider } from "./AbstractProvider";

export class EthereumProvider extends AbstractProvider {
    connect(): Promise<void> {
        throw new Error("Method not implemented.");
    }
    getAccountInfo(address: string): Promise<BlockchainAccount> {
        throw new Error("Method not implemented.");
    }
    sendTransaction(txData: any): Promise<string> {
        throw new Error("Method not implemented.");
    }
    estimateGas(txData: any): Promise<bigint> {
        throw new Error("Method not implemented.");
    }
    getTransactionByHash(txHash: string): Promise<any> {
        throw new Error("Method not implemented.");
    }
    getLogs(filter: any): Promise<any[]> {
        throw new Error("Method not implemented.");
    }
    
}