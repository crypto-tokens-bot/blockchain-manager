import { ethers } from "ethers";
import dotenv from "dotenv";
import { CONTRACTS_TO_INDEX, IndexerConfig } from "./registry";
import { eventQueue } from '../queue/eventQueue';
import logger from "../utils/logger";
import { parseArgs } from '../utils/parser'
import { saveToQueue } from "./fetchPastEvents";
import { MetricsWriter } from "../monitoring-system/MetricsWriter";
dotenv.config();

export async function runIndexer(provider: ethers.JsonRpcProvider) {
  logger.info("Starting indexer", { contracts: CONTRACTS_TO_INDEX.length });
  for (const contractConfig of CONTRACTS_TO_INDEX) {
    await setupContractListener(provider, contractConfig);
  }
}

export function setupContractListener(provider: ethers.JsonRpcProvider, config: IndexerConfig) {
  logger.debug(`setupContractListener config:{}`, config);
  const { name, address, abi, events } = config;
  const correctAddress = ethers.getAddress(address);

  logger.info("Attaching listener", { name, address: correctAddress, events });
  const contract = new ethers.Contract(correctAddress, abi, provider);
  const metricsWriter = MetricsWriter.getInstance();

  events.forEach((eventName) => {
    contract.on(eventName, async(...args) => {
      const payload = args[args.length - 1] as {
        blockNumber?: number;
        log: { blockNumber: number; transactionHash: string };
      };
      let blockNumber =
        payload.blockNumber ?? payload.log?.blockNumber;

      logger.info("Contract event received", {
        contract: name,
        event: eventName,
        blockNumber,
        args: args.map(a => typeof a === "bigint" ? a.toString() : a)
      });

      const eventData = {
        contract: name,
        event: eventName,
        args,
        blockNumber,
      };

      await metricsWriter.writeContractEvent(eventData);
      saveToQueue({
        contract: name,
        event: eventName,
        args,
        blockNumber,
      }).catch(err => {
        logger.error("Failed to enqueue event", { error: err, contract: name, event: eventName });
      });
    });
  });
  logger.info("Listening for events", { contract: name, address: correctAddress });
}