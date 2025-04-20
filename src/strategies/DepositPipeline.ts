import { BridgeStep } from "./steps/bridgeStep";
import { SwapStep } from "./steps/swapStep";
import { StakeStep } from "./steps/stakeStep";
import { ethers, BigNumberish } from "ethers";

export class DepositPipeline {
  constructor(
    private bridge: BridgeStep,
    private swap: SwapStep,
    private stake: StakeStep
  ) {}

  /**
   * @param user       Ethereum/Ronin address
   * @param rawAmount  USDT amount as BigNumber (wei)
   */
  async run(user: string, rawAmount: ethers.BigNumberish) {
    console.log(`🍺 Starting deposit pipeline for ${user}`);
    const amountBn: bigint =
      typeof rawAmount === "bigint" ? rawAmount : BigInt(rawAmount);

    const halfBn = amountBn / 2n;

    const halfStr = halfBn.toString(); // wei as string

    await this.bridge.execute(user, halfStr);
    await this.swap.execute(user, halfStr);
    await this.stake.execute(user);
    console.log(`✅ Pipeline completed for ${user}`);
  }
}
