import { Queue, Worker, Job } from "bullmq";
import { redisConnection } from "../queue/redis";
import { handleDepositEvent } from "./handleDeposit";
import { StakingStrategyPipeline } from "./DepositPipeline";
import { BridgeStep } from "./steps/bridgeStep";
import { SwapStep } from "./steps/swapStep";
import { StakeStep } from "./steps/stakeStep";
import { bridgeNativeTokens } from "../blockchain/bridge/EthereumToRonin";
import {
  stakeAXStokens,
  swapRONforAXS,
} from "../blockchain/staking/axs-staking";
import logger from "../utils/logger";

interface ContractEventData {
  event: string;
  contract: string;
  data: any;
  blockNumber: number;
}

const pipeline = new StakingStrategyPipeline(
  new BridgeStep(bridgeNativeTokens),
  new SwapStep(swapRONforAXS),
  new StakeStep(stakeAXStokens)
);

export function runStrategyRunner() {
  logger.info("StrategyRunner is running");

  const strategyWorker = new Worker(
    "event-queue",
    async (job) => {
      const { id, data } = job;
      logger.debug("Job received");

      if (job.data.event === "Deposited") {
        try {
          await handleDepositEvent(pipeline, data);
          await job.updateProgress(100);
        } catch (err) {
          logger.error("Error in handleDepositEvent", {
            jobId: id,
            error: err,
          });
          throw err; // so that BullMQ marks the task as failed
        }
      } else {
        logger.warn("No strategy for event", { jobId: id, event: data.event });
      }
    },
    { connection: redisConnection }
  );

  strategyWorker.on("completed", (job) => {
    logger.info("Job processed successfully", { jobId: job.id });
  });

  strategyWorker.on(
    "failed",
    (job: Job<ContractEventData> | undefined, err: Error) => {
      logger.error("Job failed", { jobId: job?.id, error: err });
    }
  );
}
