import { runIndexer } from '../indexer/indexer';
import { fetchPastEvents } from '../indexer/fetchPastEvents';
import { CONTRACTS_TO_INDEX, IndexerConfig } from "../indexer/registry";
import { ethers } from 'ethers';
import dotenv from "dotenv";
import logger from '../utils/logger';

dotenv.config();

const args = process.argv.slice(2);
const withHistory = args.includes("--with-history");

async function start() {   
  logger.info("Indexer start script", { withHistory });   
  if (withHistory) {
    for (const cfg of CONTRACTS_TO_INDEX) {
      try {
      logger.info("Fetching past events", { contract: cfg.name });
      const { name, address, abi, events } = cfg;
      const correctAddress = ethers.getAddress("0xc9Cf4D74BF240B26ae1b613f85696eE8DA0aD549");
      await fetchPastEvents(correctAddress, abi);
      } catch(err) {
        logger.error("Error fetching history", { contract: cfg.name, error: err });
      };
    }
  }

  try {
  await runIndexer();
  } catch(err) {
    logger.error("Indexer crashed", { error: err });
  }
}

start().catch(err => {
  logger.error("Fatal error starting indexer", { error: err });
  process.exit(1);
});