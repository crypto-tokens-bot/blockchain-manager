import { ethers } from "ethers";
import { CONTRACTS_TO_INDEX } from "./registry";
import { eventQueue } from "../queue/eventQueue";
import { JsonRpcProvider, Log, Filter } from "ethers";
import logger from "../utils/logger";
import { MetricsWriter } from '../monitoring-system/MetricsWriter';

const provider = new ethers.JsonRpcProvider(process.env.RPC_URL!);

// 1 day ≈ 6500 block (in Ethereum)
const BLOCKS_PER_DAY = 6500;
const DAYS_BACK = 22;

/**
 * Pulls logs page by page to avoid getting the "Range exceeds limit" error
 */
async function fetchLogsInRange(
  provider: JsonRpcProvider,
  filter: Filter,
  fromBlock: number,
  toBlock: number,
  maxRange = 500
): Promise<Log[]> {
  let logs: Log[] = [];
  let start = fromBlock;

  while (start <= toBlock) {
    let end = Math.min(start + maxRange - 1, toBlock);

    logger.debug("Indexer: fetching logs", { from: start, to: end });

    try {
      const partial = await provider.getLogs({
        ...filter,
        fromBlock: ethers.toBeHex(start),
        toBlock: ethers.toBeHex(end),
      });
      if (partial.length) {
        logger.info("Indexer: got logs batch", { count: partial.length });
        logs.push(...partial);
      }
    } catch (err: any) {
      logger.error("Indexer: error fetching logs batch", {
        from: start,
        to: end,
        error: err.message ?? err,
      });
      throw err;
    }
    start = end + 1;
  }

  return logs;
}

/**
 * Pull out all the old Deposited events for the specified block range,
 * parse them and push them to the event queue
 */
export async function fetchPastEvents(provider: JsonRpcProvider, contractAddress: string, abi: string) {
  // const provider = new ethers.JsonRpcProvider(process.env.RPC_URL!, "sepolia");
  const contract = new ethers.Contract(contractAddress, abi, provider);

  const events = contract.getEvent("Deposited");
  const computedTopic = ethers.keccak256(
    ethers.toUtf8Bytes("Deposited(address,uint256,uint256)")
  );
  logger.debug("Indexer: Deposited topic hashes", {
    computedTopic,
    fragmentTopic: events.fragment.topicHash,
  });

  const filter = {
    address: contractAddress,
    topics: [computedTopic],
  };
  const currentBlock = await provider.getBlockNumber();
  const fromBlock = 7920355;
  const toBlock = 7921355;
  //const fromBlock = currentBlock - 160000; // Example: 20 day back (20 * 6500)

  const logs = await fetchLogsInRange(provider, filter, fromBlock, toBlock);
  console.info(
    `Fetched ${logs.length} logs from block ${fromBlock} to ${toBlock}`
  );
  logger.info("Indexer: total logs fetched", { total: logs.length });

  for (const log of logs) {
    const parsed = contract.interface.decodeEventLog(
      events.fragment,
      log.data,
      log.topics
    );
    logger.debug("Indexer: parsed past event", {
      block: log.blockNumber,
      parsed,
    });

    await saveToQueue({
      contract: contractAddress,
      event: "Deposited",
      data: parsed,
      blockNumber: log.blockNumber,
    });
  }
}
export async function saveToQueue(data: any) {
  const processedData = JSON.parse(
    JSON.stringify(data, (key, value) =>
      typeof value === "bigint" ? value.toString() : value
    )
  );
  await eventQueue.add("contract-event", processedData);
  console.info("Event saved to queue:", data);

  const metricsWriter = MetricsWriter.getInstance();
  await metricsWriter.writeContractEvent(data);
}
