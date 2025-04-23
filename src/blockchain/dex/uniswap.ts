import { ethers } from "ethers";
import { Token, CurrencyAmount, TradeType, Percent } from "@uniswap/sdk-core";
import { Pool, Route, SwapRouter } from "@uniswap/v3-sdk";

export async function getQuote(
  provider: ethers.JsonRpcProvider,
  tokenIn: Token, tokenOut: Token,
  amountIn: CurrencyAmount<Token>,
  slippageTolerance: Percent
) {
  // amountOutMin = trade.minimumAmountOut(slippageTolerance)
  // return { route, trade, amountOutMin };
}

export async function executeSwap(
  signer: ethers.Signer,
  route: Route<Token, Token>,
  amountOutMin: CurrencyAmount<Token>,
  deadline: number,
  value?: bigint
) {
//   const { calldata } = SwapRouter.swapCallParameters(route, {
//     //slippageTolerance,
//     deadline,
//     recipient: await signer.getAddress(),
//     amountOutMinimum: amountOutMin.quotient.toString(),
//     sqrtPriceLimitX96: 0n,
//   });
//   return signer.sendTransaction({ to: SwapRouter.ADDRESS, data: calldata, value });
}
