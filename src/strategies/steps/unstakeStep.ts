import {
  unstakeAllAXS,
  unstakeAXS,
} from "../../blockchain/staking/axs-staking";
import logger from "../../utils/logger";
export class UnstakeStep {
  /**
   * Performs anstaking of AXS tokens
   * @param user User's address (for logging)
   * @param amount Or Percentage Number of AVS for unstaking or percentage of the total amount
   * @param isPercent If true, then amount Or Percent is considered a percentage (0-100)
   * @param EventID is the unique identifier of the event to track
   */
  async execute(
    user: string,
    amountOrPercent: number,
    isPercent: boolean = false,
    eventId: string
  ): Promise<void> {
    logger.info(`Step: unstaking for ${user}`, {
      amountOrPercent,
      isPercent,
      eventId,
    });

    let success: boolean;

    if (isPercent) {
      // If 100% unstake is requested, we use the unstakeAll function for optimization.
      if (amountOrPercent >= 99.9) {
        logger.info(`Using unstakeAll for ${user} (${amountOrPercent}%)`, {
          eventId,
        });
        success = await unstakeAllAXS();
      } else {
        // Otherwise, unstake the specified percentage
        logger.info(`Unstaking ${amountOrPercent}% for ${user}`, { eventId });
        success = await unstakeAXS(amountOrPercent, true);
      }
    } else {
      // Unstake a specific amount
      logger.info(`Unstaking ${amountOrPercent} AXS for ${user}`, { eventId });
      success = await unstakeAXS(amountOrPercent, false);
    }

    if (!success) {
      const errorMessage = `Failed to unstake for ${user}`;
      logger.error(errorMessage, { amountOrPercent, isPercent, eventId });
      throw new Error(errorMessage);
    }

    logger.info(`Unstaking completed successfully for ${user}`, {
      amountOrPercent,
      isPercent,
      eventId,
    });
  }
}
