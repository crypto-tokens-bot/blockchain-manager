import winston from "winston";
import { MongoDB } from "winston-mongodb";

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json() // Logs in JSON format for easier parsing
  ),
  transports: [
    new winston.transports.Console(), // Log to console
    new winston.transports.File({ filename: "logs/errors.log", level: "error" }), // Store errors in a file
    new winston.transports.File({ filename: "logs/combined.log" }), // Store all logs
    new MongoDB({
      db: process.env.MONGO_URI || "mongodb://localhost:27017/logs", // Store logs in a MongoDB database
      options: { useUnifiedTopology: true },
      collection: "app_logs",
      level: "warn",
    }),
  ],
});

export default logger;
