import dotenv from "dotenv";
import { runStrategyRunner } from "../strategies/StrategyRunner";
dotenv.config();

process.on("uncaughtException", (err) => {
  console.error("Uncaught exception in strategy runner:", err);
  process.exit(1);
});
process.on("unhandledRejection", (reason) => {
  console.error("Unhandled promise rejection in strategy runner:", reason);
  process.exit(1);
});

try {
  runStrategyRunner();
  console.log("Strategy runner started");
} catch (err) {
  console.error("Failed to start strategy runner:", err);
  process.exit(1);
}
