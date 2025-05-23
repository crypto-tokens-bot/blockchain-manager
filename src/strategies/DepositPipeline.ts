import { BridgeStep } from "./steps/bridgeStep";
import { SwapStep } from "./steps/swapStep";
import { StakeStep } from "./steps/stakeStep";
import { ethers, BigNumberish } from "ethers";
import logger from "../utils/logger";
import { IExchangeAdapter, OrderParams, OrderSide } from "../blockchain/exchanges/IExchangeAdapter";

export class StakingStrategyPipeline {
  constructor(
    public symbol: string,
    private bridge: BridgeStep,
    private swap: SwapStep,
    private stake: StakeStep,
    private exchange_client: IExchangeAdapter
  ) {}

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

      logger.debug("StakeStep.execute", { user });
      await this.stake.execute(user);

      logger.debug("Open position execute");
      await this.exchange_client.createMarket({
        baseSize: Number.parseInt(halfStr),
        side: OrderSide.Sell,
        symbol: this.symbol
      });

      logger.info("✅ Pipeline completed successfully", { user });
    } catch (err) {
      logger.error("Pipeline error", { user, error: err });
      throw err;
    }
  }
}
