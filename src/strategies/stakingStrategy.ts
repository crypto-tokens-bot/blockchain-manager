import { bridgeNativeTokens } from "../blockchain/bridge/EthereumToRonin";
import { stakeAXStokens, swapRONforAXS } from "../blockchain/staking/axs-staking";

export async function handleDepositEvent(data: {
  args: any[];
  contract: string;
  blockNumber: number;
}) {
  const [user, mmmAmountRaw, usdtAmountRaw] = data.args;
  console.log(`Strategy: Received deposit of ${usdtAmountRaw} USDT by ${user}`);

  const usdtAmount = BigInt(usdtAmountRaw.toString());

  const halfAmount = usdtAmount / 2n;

  try {
    const bridged = await bridgeNativeTokens(Number(halfAmount) / 1e18);
    if (!bridged) {
      throw new Error("Bridge failed");
    }
    console.log("Bridged successfully");

    console.log("🔄 Swapping RON for AXS...");
    const swapped = await swapRONforAXS(Number(halfAmount) / 1e18);
    if (!swapped) {
      throw new Error("Swap failed");
    }
    console.log("Swap succeeded");

    // here, we need to open short position

    console.log("📥 Staking AXS tokens...");
    const staked = await stakeAXStokens();
    if (!staked) {
      throw new Error("Staking failed");
    }
    console.log("Staking succeeded");
  } catch (error) {}
}
