import "dotenv/config";
import { ethers } from "ethers";
import { bridgeNativeTokens } from "../blockchain/bridge/EthereumToRonin";

async function main() {
  const amountToBridge = 0.0013;
  console.log(`Attempting to bridge ${amountToBridge} native tokens...`);

  const success = await bridgeNativeTokens(amountToBridge);
  console.log("Bridge operation result:", success ? "Success" : "Failure");

  process.exit(success ? 0 : 1);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
