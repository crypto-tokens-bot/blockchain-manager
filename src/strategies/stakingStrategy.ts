import { bridgeNativeTokens } from "../blockchain/bridge/EthereumToRonin";
import {
  stakeAXStokens,
  swapRONforAXS,
} from "../blockchain/staking/axs-staking";
import { DepositPipeline } from "./DepositPipeline";


export async function handleDepositEvent(
  pipeline: DepositPipeline,
  data: {
  args: any[];
  contract: string;
  blockNumber: number;
}) {
  const [user, mmmAmountRaw, usdtAmountRaw] = data.args;
  console.log(`Strategy: Received deposit of ${usdtAmountRaw} USDT by ${user}`);

  const usdtAmount = BigInt(usdtAmountRaw.toString());

  //const halfAmount = usdtAmount / 2n;

  try {
    await pipeline.run(user, usdtAmount);
    console.log("✅ DepositPipeline succeeded");
  } catch (err) {
    console.error("❌ DepositPipeline failed:", err);
  }
}
