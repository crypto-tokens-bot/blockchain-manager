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

  await pipeline.run(user, usdtBN);
}
