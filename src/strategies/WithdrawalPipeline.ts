import { MetricsWriter } from "../monitoring-system/MetricsWriter";
import logger from "../utils/logger";
import { BridgeBackStep } from "./steps/bridgeBackStep";
import { CompleteWithdrawStep } from "./steps/completeWithdrawStep";
import { PositionAction, PositionStep } from "./steps/positionStep";
import { SwapBackStep } from "./steps/swapBackStep";
import { UnstakeStep } from "./steps/unstakeStep";

export class WithdrawalPipeline {
  private metricsWriter: MetricsWriter;

  constructor(
    private unstakeStep: UnstakeStep,
    private positionStep: PositionStep,
    private swapBackStep: SwapBackStep,
    private bridgeBackStep: BridgeBackStep,
    private completeWithdrawStep: CompleteWithdrawStep
  ) {
    this.metricsWriter = MetricsWriter.getInstance();
  }

  /**
   * Performs the withdrawal process from the strategy
   * @param user User's address
   * @param m Amount Number of MMM tokens to be withdrawn
   * @param withdrawal Id ID of withdrawal request
   */
  async run(
    user: string,
    mmmAmount: bigint,
    withdrawalId: string
  ): Promise<void> {
    logger.info(`🔄 Starting withdrawal pipeline`, {
      user,
      mmmAmount: mmmAmount.toString(),
      withdrawalId,
    });

    try {
      // 1. Calculate proportions - we receive amounts for unstaking and closing positions
      const { stakeAmount, positionAmount } = await this.calculateProportions(
        user,
        mmmAmount
      );

      logger.info(`Pipeline: calculated withdrawal proportions`, {
        user,
        totalWithdraw: mmmAmount.toString(),
        fromStaking: stakeAmount.toString(),
        fromPosition: positionAmount.toString(),
        withdrawalId,
      });

      // 2. Execute unstaking (AXS unstaking is immediate)
      if (stakeAmount > 0n) {
        // We convert the steak to a percentage, if necessary
        // Otherwise, you can use the direct sum
        const stakedTotal = await this.getStakedTotal(user);
        const unstakePercent = Number((stakeAmount * 100n) / stakedTotal);

        await this.unstakeStep.execute(
          user,
          unstakePercent > 0 ? unstakePercent : Number(stakeAmount), // We use either the percentage or the amount directly
          unstakePercent > 0, // isPercent = true if we use a percentage
          withdrawalId
        );

        logger.info(`Pipeline: unstaking completed`, {
          user,
          amount: stakeAmount.toString(),
          percent: unstakePercent.toString(),
          withdrawalId,
        });
      }

      // 3. Close position on exchange
      if (positionAmount > 0n) {
        const symbol = "AXSUSDT";

        // If we returned the total ratio of funds in calculate Proportions,
        // it is necessary to calculate the percentage of the total position that needs to be closed
        const totalPositionValue = await this.positionStep.getPositionValue(
          symbol
        );
        const closePercent = Number(
          (positionAmount * 100n) / BigInt(Math.floor(totalPositionValue))
        );

        if (closePercent >= 99) {
          await this.positionStep.execute(
            symbol,
            "",
            PositionAction.CLOSE
          );
        } else {
          await this.positionStep.execute(
            symbol,
            "",
            PositionAction.PARTIAL_CLOSE,
            closePercent
          );
        }

        logger.info(`Pipeline: position closing completed`, {
          user,
          symbol,
          amount: positionAmount.toString(),
          closePercent,
          withdrawalId,
        });
      }

      // 4. Swap any non-USDT tokens back to USDT
      await this.swapBackStep.execute(user, withdrawalId);
      logger.info(`Pipeline: swap back to USDT completed`, {
        user,
        withdrawalId,
      });

      // 5. Bridge funds back to Ethereum (from Ronin to Ethereum)
      await this.bridgeBackStep.execute(user, withdrawalId);
      logger.info(`Pipeline: bridging funds back completed`, {
        user,
        withdrawalId,
      });

      // 6. Complete the withdrawal in the smart contract
      await this.completeWithdrawStep.execute(user, mmmAmount, withdrawalId);
      logger.info(`Pipeline: withdrawal completed in smart contract`, {
        user,
        withdrawalId,
      });

      await this.metricsWriter.writeWithdrawalMetrics({
        user,
        mmmAmount: mmmAmount.toString(),
        withdrawalId,
        status: "completed",
        timestamp: new Date().toISOString(),
      });

      logger.info("✅ Withdrawal pipeline completed successfully", {
        user,
        withdrawalId,
      });
    } catch (err) {
      logger.error("❌ Withdrawal pipeline failed", {
        user,
        withdrawalId,
        error: err instanceof Error ? err.message : String(err),
      });

      await this.metricsWriter.writeWithdrawalMetrics({
        user,
        mmmAmount: mmmAmount.toString(),
        withdrawalId,
        status: "failed",
        error: err instanceof Error ? err.message : String(err),
        timestamp: new Date().toISOString(),
      });

      await this.handleFailure(user, mmmAmount, withdrawalId, err);

      throw err;
    }
  }

   /**
   * Calculates the proportions for unstaking and closing a position
   * @param user User's address
   * @param m Amount Number of MMM tokens
   * @returns Amounts for unstaking and closing positions
   */
  private async calculateProportions(
    user: string,
    mmmAmount: bigint
  ): Promise<{
    stakeAmount: bigint;
    positionAmount: bigint;
  }> {

    return {
      stakeAmount: mmmAmount / 2n,
      positionAmount: mmmAmount / 2n,
    };
  }

  private async getStakedTotal(user: string): Promise<bigint> {

    return BigInt(1000) * BigInt(10 ** 18);
  }

   /**
   * Error handling during withdrawal of funds
   * @param user User's address
   * @param m Amount Number of MMM tokens
   * @param withdrawal Id ID of withdrawal request
   * @param error Error object
   */
  private async handleFailure(
    user: string,
    mmmAmount: bigint,
    withdrawalId: string,
    error: any
  ): Promise<void> {
    logger.error("Withdrawal failure handler triggered", {
      user,
      mmmAmount: mmmAmount.toString(),
      withdrawalId,
      errorMessage: error instanceof Error ? error.message : String(error),
      errorStack: error instanceof Error ? error.stack : undefined,
    });

    await this.sendAdminAlert(
      `Withdrawal failure for user ${user}, amount ${mmmAmount.toString()}, id ${withdrawalId}. Error: ${
        error instanceof Error ? error.message : String(error)
      }`
    );

    await this.createRecoveryTask(user, mmmAmount, withdrawalId, error);
  }

  // Later
  private async sendAdminAlert(message: string): Promise<void> {
    logger.info(`ADMIN ALERT: ${message}`);
  }

  // Later
  private async createRecoveryTask(
    user: string,
    mmmAmount: bigint,
    withdrawalId: string,
    error: any
  ): Promise<void> {
    logger.info(
      `RECOVERY TASK CREATED: Withdrawal recovery for user ${user}, id ${withdrawalId}`
    );
  }
}
