import { stakeAXStokens } from "../../blockchain/staking/axs-staking";

export class StakeStep {
  constructor(private stakeService: typeof stakeAXStokens) {}

  async execute(user: string): Promise<void> {
    console.info(`Step: stake for ${user}`);
    const ok = await this.stakeService();
    if (!ok) throw new Error("StakeStep failed");
  }
}