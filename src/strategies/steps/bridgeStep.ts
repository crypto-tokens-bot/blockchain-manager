import { bridgeNativeTokens } from "../../blockchain/bridge/EthereumToRonin";

export class BridgeStep {
    constructor(private bridgeService: typeof bridgeNativeTokens) {}
  
    async execute(user: string, amountWei: string): Promise<void> {
      console.info(`Step: bridge ${amountWei} wei for ${user}`);
      const ok = await this.bridgeService(Number.parseInt(amountWei));
      if (!ok) throw new Error("BridgeStep failed");
    }
  }
  