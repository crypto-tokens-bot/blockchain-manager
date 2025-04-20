import { swapRONforAXS } from "../../blockchain/staking/axs-staking";

export class SwapStep {
    constructor(private swapService: typeof swapRONforAXS) {}
  
    async execute(user: string, amountWei: string): Promise<void> {
      console.log(`Step: swap ${amountWei} wei for ${user}`);
      const ok = await this.swapService(Number.parseInt(amountWei));
      if (!ok) throw new Error("SwapStep failed");
    }
  }
  