import { ethers } from "ethers";
import dotenv from "dotenv";
import { CONTRACTS_TO_INDEX, IndexerConfig } from "./registry";
import { eventQueue } from '../queue/eventQueue';
import logger from "../utils/logger";

dotenv.config();

// const WS_URL = process.env.WS_URL!;
// const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS!;


const provider = new ethers.JsonRpcProvider(process.env.RPC_URL!, "sepolia");

export async function runIndexer() {
  logger.info("Starting indexer", { contracts: CONTRACTS_TO_INDEX.length });
  for (const contractConfig of CONTRACTS_TO_INDEX) {
    setupContractListener(contractConfig);
  }
}

function setupContractListener(config: IndexerConfig) {
  logger.debug(`setupContractListener config:{}`, config);
  const { name, address, abi, events } = config;
  const correctAddress = ethers.getAddress(address);

  logger.info("Attaching listener", { name, address: correctAddress, events });
  const contract = new ethers.Contract(correctAddress, abi, provider);

  events.forEach((eventName) => {
    contract.on(eventName, (...args) => {
      const event = args[args.length - 1];
      logger.info("Contract event received", {
        contract: name,
        event: eventName,
        blockNumber: event.blockNumber,
        args: args.map(a => typeof a === "bigint" ? a.toString() : a)
      });
      saveToQueue({
        contract: name,
        event: eventName,
        args,
        blockNumber: event.blockNumber
      }).catch(err => {
        logger.error("Failed to enqueue event", { error: err, contract: name, event: eventName });
      });
    });
  });
  logger.info("Listening for events", { contract: name, address: correctAddress });
}

async function saveToQueue(data: any) {
  const processedData = JSON.parse(
    JSON.stringify(data, (key, value) =>
      typeof value === "bigint" ? value.toString() : value
    )
  );
  await eventQueue.add('contract-event', processedData);
  logger.debug("Event enqueued", { jobId: processedData.blockNumber, contract: processedData.contract });
}