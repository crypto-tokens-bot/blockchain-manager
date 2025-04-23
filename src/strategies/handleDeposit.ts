import { bridgeNativeTokens } from "../blockchain/bridge/EthereumToRonin";
import {
  stakeAXStokens,
  swapRONforAXS,
} from "../blockchain/staking/axs-staking";
import logger from "../utils/logger";
import { DepositPipeline } from "./DepositPipeline";


export async function handleDepositEvent(
  pipeline: DepositPipeline,
  data: {
  args: any[];
  contract: string;
  blockNumber: number;
}) {
  const [user, mmmAmountRaw, usdtAmountRaw] = data.args;
  logger.info("Strategy: Received deposit event", {
    contract: data.contract,
    blockNumber: data.blockNumber,
    user,
    usdtAmountRaw: usdtAmountRaw.toString(),
  });
  const usdtAmount = BigInt(usdtAmountRaw.toString());

  //const halfAmount = usdtAmount / 2n;

  try {
    await pipeline.run(user, usdtAmount);
    logger.info("✅ DepositPipeline succeeded", { user, usdtAmount: usdtAmount.toString() });
  } catch (err) {
    logger.error("❌ DepositPipeline failed:", { user, error: err });
    throw err;
  }
}
