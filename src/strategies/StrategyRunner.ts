import { Queue, Worker, Job } from "bullmq";
import { redisConnection } from "../queue/redis";
import { handleDepositEvent } from "./stakingStrategy";
import { DepositPipeline } from "./DepositPipeline";
import { BridgeStep } from "./steps/bridgeStep";
import { SwapStep } from "./steps/swapStep";
import { StakeStep } from "./steps/stakeStep";
import { bridgeNativeTokens } from "../blockchain/bridge/EthereumToRonin";
import { stakeAXStokens, swapRONforAXS } from "../blockchain/staking/axs-staking";

interface ContractEventData {
  event: string;
  contract: string;
  data: any;
  blockNumber: number;
}

const pipeline = new DepositPipeline(
  new BridgeStep(bridgeNativeTokens),
  new SwapStep(swapRONforAXS),
  new StakeStep(stakeAXStokens)
);

const strategyWorker = new Worker(
  "event-queue",
  async (job) => {
    if (job.data.event === "Deposited") {
      await handleDepositEvent(pipeline, job.data);
    }
  },
  { connection: redisConnection }
);

strategyWorker.on("completed", (job) => {
  console.log(`Job ${job.id} processed successfully.`);
});

strategyWorker.on(
  "failed",
  (job: Job<ContractEventData> | undefined, err: Error) => {
    console.error(`Job ${job?.id} failed:`, err);
  }
);

export function runStrategyRunner() {
  console.log("StrategyRunner is running...");
}
