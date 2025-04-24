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
  const { calldata } = SwapRouter.swapCallParameters(route, {
    //slippageTolerance,
    deadline,
    recipient: await signer.getAddress(),
    amountOutMinimum: amountOutMin.quotient.toString(),
    sqrtPriceLimitX96: 0n,
  });
  return signer.sendTransaction({ to: SwapRouter.ADDRESS, data: calldata, value });
}

// src/blockchain/dex/uniswap.ts

import { ethers } from "ethers";
import {
  Token,
  CurrencyAmount,
  TradeType,
  Percent,
} from "@uniswap/sdk-core";
import {
  Pool,
  Route,
  Trade,
  SwapRouter,
  SwapOptions,
} from "@uniswap/v3-sdk";
import { abi as IUniswapV3PoolABI } from "@uniswap/v3-core/artifacts/contracts/UniswapV3Pool.sol/UniswapV3Pool.json";
import { abi as QuoterABI } from "@uniswap/v3-periphery/artifacts/contracts/lens/Quoter.sol/Quoter.json";

// Replace with real addresses for your network
const QUOTER_ADDRESS = "0x61fFE014bA17989E743c5F6cB21bF9697530B21e";
const SWAP_ROUTER_ADDRESS = SwapRouter.ADDRESS;

/**
 * Build a Pool instance from on-chain data.
 */
export async function fetchPool(
  provider: ethers.JsonRpcProvider,
  poolAddress: string,
  tokenA: Token,
  tokenB: Token,
  fee: number
): Promise<Pool> {
  const poolContract = new ethers.Contract(poolAddress, IUniswapV3PoolABI, provider);
  const [liquidity, slot0] = await Promise.all([
    poolContract.liquidity(),
    poolContract.slot0(),
  ]);
  return new Pool(
    tokenA,
    tokenB,
    fee,
    BigInt(slot0.sqrtPriceX96.toString()),
    BigInt(liquidity.toString()),
    slot0.tick
  );
}

/**
 * Quote exact-input single-hop swap via on-chain Quoter.
 */
export async function quoteExactInputSingle(
  provider: ethers.JsonRpcProvider,
  tokenIn: Token,
  tokenOut: Token,
  amountIn: CurrencyAmount<Token>,
  fee: number
): Promise<CurrencyAmount<Token>> {
  const quoter = new ethers.Contract(QUOTER_ADDRESS, QuoterABI, provider);
  const quoted: bigint = await quoter.callStatic.quoteExactInputSingle(
    tokenIn.address,
    tokenOut.address,
    fee,
    amountIn.quotient.toString(),
    0
  );
  return CurrencyAmount.fromRawAmount(tokenOut, quoted);
}

/**
 * Get a trade object and minimum output amount after slippage.
 */
export function buildTrade(
  pool: Pool,
  amountIn: CurrencyAmount<Token>,
  slippage: Percent
): { route: Route<Token, Token>; trade: Trade<Token, Token, TradeType.EXACT_INPUT>; minimumOut: CurrencyAmount<Token> } {
  const route = new Route([pool], amountIn.token, pool.token1);
  const trade = Trade.createUncheckedTrade({
    route,
    inputAmount: amountIn,
    outputAmount: CurrencyAmount.fromRawAmount(pool.token1, 0n),
    tradeType: TradeType.EXACT_INPUT,
  });
  const minimumOut = trade.minimumAmountOut(slippage);
  return { route, trade, minimumOut };
}

/**
 * Execute a single-hop exact-input swap on Uniswap V3.
 */
export async function swapExactInput(
  signer: ethers.Signer,
  route: Route<Token, Token>,
  minimumOut: CurrencyAmount<Token>,
  deadline: number,
  slippage: Percent
): Promise<ethers.providers.TransactionResponse> {
  const { calldata, value } = SwapRouter.swapCallParameters(route, {
    tradeType: TradeType.EXACT_INPUT,
    recipient: await signer.getAddress(),
    slippageTolerance: slippage,
    deadline,
    amountIn: route.input.amount.quotient.toString(),
    amountOutMinimum: minimumOut.quotient.toString(),
    sqrtPriceLimitX96: 0n,
  } as SwapOptions);

  return signer.sendTransaction({
    to: SWAP_ROUTER_ADDRESS,
    data: calldata,
    value,
  });
}
