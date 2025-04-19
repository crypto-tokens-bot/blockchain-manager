import { Queue, Worker, Job } from "bullmq";
import { redisConnection } from "../queue/redis";
import { handleDepositEvent } from "./stakingStrategy";

interface ContractEventData {
    event: string;
    contract: string;
    data: any;
    blockNumber: number;
  }

const strategyWorker = new Worker<ContractEventData>(
  "event-queue",
  async (job: Job<ContractEventData>) => {
    if (!job) return;
    const data = job!.data;
    const { args } = data.data;
    const { event, contract, blockNumber } = job.data;
    console.log(`StrategyRunner: Received event ${event} from contract ${contract} at block ${blockNumber}`);
    
    switch (event) {
      case "Deposited":
        await handleDepositEvent({ args, contract, blockNumber });
        break;
      default:
        console.warn(`StrategyRunner: No strategy defined for event ${event}`);
    }
  },
  { connection: redisConnection }
);


strategyWorker.on("completed", (job) => {
  console.log(`Job ${job.id} processed successfully.`);
});

strategyWorker.on("failed", (job: Job<ContractEventData> | undefined, err: Error) => {
  console.error(`Job ${job?.id} failed:`, err);
});;

export function runStrategyRunner() {
  console.log("StrategyRunner is running...");
}
