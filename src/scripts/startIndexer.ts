import { runIndexer } from "../indexer/indexer";
import { fetchPastEvents } from "../indexer/fetchPastEvents";
import { CONTRACTS_TO_INDEX, IndexerConfig } from "../indexer/registry";
import { ethers } from "ethers";
import dotenv from "dotenv";
import logger from "../utils/logger";

dotenv.config();

const args = process.argv.slice(2);
const withHistory = args.includes("--with-history");

const isTest = process.env.NODE_ENV === "test";

const RPC_URL = isTest ? process.env.TEST_RPC_URL! : process.env.RPC_URL!;

if (!RPC_URL) {
  throw new Error("TEST_RPC_URL or RPC_URL not found in .env");
}

const provider = new ethers.JsonRpcProvider(RPC_URL);

logger.info("Provider created with url:", { url: RPC_URL });

async function start() {
  logger.info("Indexer start script", { withHistory });
  if (withHistory) {
    for (const cfg of CONTRACTS_TO_INDEX) {
      try {
        logger.info("Fetching past events", { contract: cfg.name });
        const { name, address, abi, events } = cfg;
        const correctAddress = ethers.getAddress(
          "0xc9Cf4D74BF240B26ae1b613f85696eE8DA0aD549" // need to get rid of the hardcore
        );
        await fetchPastEvents(provider, correctAddress, abi);
      } catch (err) {
        logger.error("Error fetching history", {
          contract: cfg.name,
          error: err,
        });
      }
    }
  }

  try {
    await runIndexer(provider);
  } catch (err) {
    logger.error("Indexer crashed", { error: err });
  }
}

start().catch((err) => {
  logger.error("Fatal error starting indexer", { error: err });
  process.exit(1);
});
