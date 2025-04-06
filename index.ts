import logger from './src/utils/logger';
import winston from "winston";
import { MongoDB } from "winston-mongodb";
import { runIndexer } from './src/indexer/indexer';

import dotenv from "dotenv";

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


runIndexer();