import "dotenv/config";
import { swapRONforAXS } from "../blockchain/staking/axs-staking";


async function main() {
    const amountArg = process.argv[2];
    const amount = amountArg ? parseFloat(amountArg) : 0.05;
    console.log(`Attempting to swap ${amount} RON to AXS...`);
    
    const result = await swapRONforAXS(amount);
    console.log("Swap result:", result ? "Success" : "Failure");
    
    process.exit(result ? 0 : 1);
  }
  
  main().catch((error) => {
    console.error("Error in runSwapRONforAXS:", error);
    process.exit(1);
  });