import { BridgeStep } from "./steps/bridgeStep";
import { SwapStep } from "./steps/swapStep";
import { StakeStep } from "./steps/stakeStep";
import { ethers, BigNumberish } from "ethers";
import logger from "../utils/logger";
import { IExchangeAdapter, OrderParams, OrderSide } from "../blockchain/exchanges/IExchangeAdapter";
import { PositionStep } from "./steps/positionStep";
import { MetricsWriter } from "../monitoring-system/MetricsWriter";

export class StakingStrategyPipeline {
  private metricsWriter: MetricsWriter;
  
  constructor(
    public symbol: string,
    private bridge: BridgeStep,
    private swap: SwapStep,
    private stake: StakeStep,
    private positionStep: PositionStep
  ) {
    this.metricsWriter = MetricsWriter.getInstance();
  }

  /**
   * @param user       Ethereum/Ronin address
   * @param rawAmount  USDT amount as BigNumber (wei)
   */
  async run(user: string, rawAmount: ethers.BigNumberish) {
    logger.info(`🍺 Starting deposit pipeline`, {
      user,
      rawAmount: rawAmount.toString(),
    });
    const amountBn: bigint =
      typeof rawAmount === "bigint" ? rawAmount : BigInt(rawAmount);

    const halfBn = amountBn / 2n;

    const halfStr = halfBn.toString(); // wei as string

    try {
      logger.debug("BridgeStep.execute", { user, amount: halfStr });
      await this.bridge.execute(user, halfStr);

      logger.debug("SwapStep.execute", { user, amount: halfStr });
      await this.swap.execute(user, halfStr);

      logger.debug("Open position step execute", {amount: halfStr})
      await this.positionStep.execute("AXSUSDT", halfStr);

      logger.debug("StakeStep.execute", { user });
      await this.stake.execute(user);

      logger.info("✅ Pipeline completed successfully", { user });
    } catch (err) {
      logger.error("Pipeline error", { user, error: err });
      throw err;
    }
  }
}
