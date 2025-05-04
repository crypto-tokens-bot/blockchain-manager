import logger from './src/utils/logger';
import winston from "winston";
import { MongoDB } from "winston-mongodb";
import { runIndexer } from './src/indexer/indexer';

import dotenv from "dotenv";
import { runStrategyRunner } from './src/strategies/StrategyRunner';
import { ethers } from 'ethers';

dotenv.config();

const { MONGO_URI } = process.env;

if (!MONGO_URI) {
  throw new Error("❌ Missing MONGO_URI in environment variables!");
}

if (process.env.LOG_TO_CONSOLE === "true") {
  logger.add(new winston.transports.Console());
}

if (process.env.LOG_TO_FILE === "true") {
  logger.add(new winston.transports.File({ filename: "logs/app.log" }));
}

if (process.env.LOG_TO_DB === "true") {
  logger.add(
    new MongoDB({
      db: MONGO_URI,
      collection: "logs",
      options: { useUnifiedTopology: true }
    })
  );
}
const isTest = process.env.NODE_ENV === "test";

const RPC_URL = isTest
  ? process.env.TEST_RPC_URL!
  : process.env.RPC_URL! 

if (!RPC_URL) {
    throw new Error("TEST_RPC_URL or RPC_URL not found in .env");
}

async function main() {
  const provider = new ethers.JsonRpcProvider(
    RPC_URL
  );
  runIndexer(provider);
  runStrategyRunner();
}

main().catch(console.error);