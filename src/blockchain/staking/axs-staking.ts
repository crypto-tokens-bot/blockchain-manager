import "dotenv/config";
import { ethers } from "ethers";
import fs from "fs/promises";
import { formatEther, parseEther } from "ethers";
import { BigNumberish } from "ethers";
import { MetricsWriter } from "../../monitoring-system/MetricsWriter";
import path from "path";
import logger from "../../utils/logger";

interface Claims {
  previousClaim: string;
  nextClaim: string;
}

let claims: Claims = {
  previousClaim: "",
  nextClaim: "",
};
export type StakingContract = ethers.Contract & {
  stake: (
    amount: ethers.BigNumberish,
    overrides?: ethers.Overrides
  ) => Promise<ethers.TransactionResponse>;

  unstake: (
    amount: ethers.BigNumberish,
    overrides?: ethers.Overrides
  ) => Promise<ethers.TransactionResponse>;

  unstakeAll: (
    overrides?: ethers.Overrides
  ) => Promise<ethers.TransactionResponse>;

  getStakingAmount: (user: string) => Promise<ethers.BigNumberish>;
};

export type ClaimContract = ethers.Contract & {
  claimPendingRewards: (
    overrides?: ethers.Overrides
  ) => Promise<ethers.TransactionResponse>;

  getPendingRewards: (user: string) => Promise<ethers.BigNumberish>;
};

type KatanaRouter = ethers.Contract & {
  getAmountsOut(
    amountIn: ethers.BigNumberish,
    path: string[]
  ): Promise<ethers.BigNumberish[]>;
  swapExactRONForTokens(
    amountOutMin: ethers.BigNumberish,
    path: string[],
    to: string,
    deadline: ethers.BigNumberish,
    overrides?: { value: ethers.BigNumberish; gasLimit?: number }
  ): Promise<ethers.TransactionResponse>;
};

const RPC_URL: string = process.env.RONIN_RPC || ""; // https://api.roninchain.com/rpc
const WALLET_ADDRESS: string = process.env.USER_ADDRESS || "";
//const USER_AGENT: string = process.env.USER_AGENT || "";
const PRIV_KEY: string = process.env.USER_PRIVATE_KEY || "";

const provider = new ethers.JsonRpcProvider(RPC_URL);

const stakingABI = [
  "function stake(uint256) external",
  "function unstake(uint256) external",
  "function unstakeAll() external",
  "function getStakingAmount(address) view returns (uint256)",
];
const claimsABI = ["function claimPendingRewards() external", "function getPendingRewards(address) view returns (uint256)"];
const erc20ABI = ["function balanceOf(address) view returns (uint256)"];
const katanaABI = [
  "function getAmountsOut(uint256 amountIn, address[] calldata path) external view returns (uint256[] memory)",
  "function swapExactRONForTokens(uint256 amountOutMin, address[] calldata path, address to, uint256 deadline) external payable returns (uint256[] memory)",
];


const AXS = "0x97a9107c1793bc407d6f527b77e7fff4d812bece";
const WRON = "0xe514d9deb7966c8be0ca922de8a064264ea6bcd4";
const WETH = "0xc99a6a985ed2cac1ef41640596c5a5f9f4e19ef5";
const katanaAdd = "0x7d0556d55ca1a92708681e2e231733ebd922597d";
const claimsAdd = "0xd4640c26c1a31cd632d8ae1a96fe5ac135d1eb52";
const stakingAdd = "0x05b0bb3c1c320b280501b86706c3551995bc8571"; // and unstake

const wallet = new ethers.Wallet(PRIV_KEY, provider);
const axsContract = new ethers.Contract(AXS, erc20ABI, provider);
const katanaRouter = new ethers.Contract(
  katanaAdd,
  katanaABI,
  provider
).connect(wallet) as KatanaRouter;
const stakingContract = new ethers.Contract(
  stakingAdd,
  stakingABI,
  provider
).connect(wallet) as StakingContract;
const claimsContract = new ethers.Contract(
  claimsAdd,
  claimsABI,
  provider
).connect(wallet);

export async function stakeAXStokens(): Promise<boolean> {
  try {
    const balance = await axsContract.balanceOf(WALLET_ADDRESS);
    const formattedBal = parseFloat(formatEther(balance));
    logger.info("Stake: current AXS balance", { balance });

    if (formattedBal < 0.01) {
      logger.warn("Stake: balance too small to stake", { formattedBal });
      throw new Error("Staking value too small!");
    }

    const randomGas = 400000 + Math.random() * (99999 - 10000) + 10000;
    const overrideOptions = { gasLimit: Math.floor(randomGas) };
    logger.info("Stake: submitting stake tx", {
      amount: balance.toString(),
      randomGas,
    });

    let amount = balance;
    console.log("Staking AXS Tokens...");
    const stakeTx = await stakingContract.stake(amount, overrideOptions);
    const receipt = await stakeTx.wait();

    if (receipt) {
      console.log("AXS STAKE SUCCESSFUL");
      const ronBal = await provider.getBalance(WALLET_ADDRESS);
      console.log("RON Balance: " + formatEther(ronBal));
      const axsBal = await axsContract.balanceOf(WALLET_ADDRESS);
      console.log("AXS Balance: " + formatEther(axsBal));

      const stakeInfo = {
        timestamp: new Date().toISOString(),
        txHash: stakeTx.hash,
        stakedAmount: formatEther(amount),
        ronBalanceAfter: formatEther(ronBal),
        axsBalanceAfter: formatEther(axsBal),
        blockNumber: receipt.blockNumber,
      };
      await storeStakeInfo(stakeInfo);
      logger.info("Stake: completed successfully", stakeInfo);

      return true;
    }
  } catch (error) {
    console.error("stakeAXStokens error:", error);
  }
  return false;
}

export async function swapRONforAXS(amount: number): Promise<boolean> {
  try {
    if (amount < 0.04) {
      logger.warn("Swap: amount too small", { amount });
      throw new Error("Conversion value too small!");
    }

    const gasRandom = Math.floor(Math.random() * (500000 - 400001) + 400000);
    const amountIn = parseEther(amount.toString());
    const path = [WRON, WETH, AXS];

    logger.info("Swap: fetching amounts out", {
      amountIn: amountIn.toString(),
      path,
    });
    const result = await katanaRouter.getAmountsOut(amountIn, path);

    const amountOut = Number(ethers.formatEther(result[2])) * 0.99;
    const amountOutMin = ethers.parseEther(amountOut.toString());

    const deadline = Math.floor(Date.now() / 1000) + 60 * 5; // 5 min

    logger.info("Swap: submitting swap tx", {
      amountIn: amountIn.toString(),
      amountOutMin: amountOutMin.toString(),
      path,
      deadline,
      gasRandom,
    });

    const swapTx = await katanaRouter.swapExactRONForTokens(
      amountOutMin,
      path,
      WALLET_ADDRESS,
      deadline,
      { gasLimit: gasRandom, value: amountIn }
    );
    const swapReceipt = await swapTx.wait();
    if (swapReceipt) {
      console.info("RON SWAP SUCCESSFUL");

      const metricsWriter = MetricsWriter.getInstance();
      await metricsWriter.writeSwapInfo({
        timestamp: new Date().toISOString(),
        txHash: swapTx.hash,
        amountIn: amount,
        amountOut: amountOut,
        priceImpact: ((amount - amountOut) / amount) * 100,
        gasUsed: swapReceipt.gasUsed?.toString() || "0",
      });

      return true;
    }
  } catch (error) {
    logger.error("Swap: error swapping tokens", { error });
  }
  return false;
}

export async function unstakeAXS(amountOrPercent: number, isPercent: boolean = false): Promise<boolean> {
  try {
    const stakedAmount = await stakingContract.getStakingAmount(WALLET_ADDRESS);
    const formattedStaked = parseFloat(formatEther(stakedAmount));
    
    logger.info("Unstake: current staked AXS amount", { stakedAmount: formattedStaked });
    
    if (formattedStaked <= 0) {
      logger.warn("Unstake: no AXS tokens staked", { stakedAmount: formattedStaked });
      return false;
    }
    
    let amountToUnstake: bigint;
    
    if (isPercent) {
      // We check that the percentage is in the acceptable range.
      if (amountOrPercent <= 0 || amountOrPercent > 100) {
        throw new Error(`Invalid unstake percentage: ${amountOrPercent}. Must be between 1 and 100.`);
      }
      
      // If 100% or close to it is specified, we use unstakeAll to prevent rounding errors.
      if (amountOrPercent >= 99.99) {
        return await unstakeAllAXS();
      }
      const stakedBigInt = ethers.toBigInt(stakedAmount);
      const percentBigInt = ethers.toBigInt(Math.floor(amountOrPercent * 100));
      const divisorBigInt = ethers.toBigInt(10000);
      
      // Calculate the amount based on the percentage
      amountToUnstake = (stakedBigInt * percentBigInt) / divisorBigInt;
    } else {
      amountToUnstake = parseEther(amountOrPercent.toString());
      
      const stakedBigInt = ethers.toBigInt(stakedAmount);
      if (amountToUnstake > stakedBigInt) {
        logger.warn("Unstake: requested amount exceeds staked amount", { 
          requested: formatEther(amountToUnstake),
          staked: formatEther(stakedBigInt)
        });
        amountToUnstake = stakedBigInt; // We limit the amount of steak
      }
    }
    
    if (amountToUnstake < parseEther("0.001")) {
      logger.warn("Unstake: amount too small", { amount: formatEther(amountToUnstake) });
      throw new Error("Unstake amount is too small!");
    }

    const randomGas = 400000 + Math.random() * (99999 - 10000) + 10000;
    const overrideOptions = { gasLimit: Math.floor(randomGas) };
    
    logger.info("Unstake: submitting unstake tx", { 
      amount: formatEther(amountToUnstake),
      randomGas
    });

    const unstakeTx = await stakingContract.unstake(amountToUnstake, overrideOptions);
    const receipt = await unstakeTx.wait();

    if (receipt) {
      const axsBal = await axsContract.balanceOf(WALLET_ADDRESS);
      const newStakedAmount = await stakingContract.getStakingAmount(WALLET_ADDRESS);
      
      console.log("AXS UNSTAKE SUCCESSFUL");
      console.log("AXS Balance after unstake: " + formatEther(axsBal));
      console.log("AXS Still staked: " + formatEther(newStakedAmount));

      const unstakeInfo = {
        timestamp: new Date().toISOString(),
        txHash: unstakeTx.hash,
        unstakedAmount: formatEther(amountToUnstake),
        axsBalanceAfter: formatEther(axsBal),
        remainingStaked: formatEther(newStakedAmount),
        blockNumber: receipt.blockNumber,
      };
      await storeUnstakeInfo(unstakeInfo);
      logger.info("Unstake: completed successfully", unstakeInfo);

      return true;
    }
  } catch (error) {
    logger.error("unstakeAXS error:", error);
  }
  return false;
}
/**
 * An stack of all AXS tokens at once
 * @returns Promise<boolean> Operation success
 */
export async function unstakeAllAXS(): Promise<boolean> {
  try {
    const stakedAmount = await stakingContract.getStakingAmount(WALLET_ADDRESS);
    const formattedStaked = parseFloat(formatEther(stakedAmount));
    
    logger.info("UnstakeAll: current staked AXS", { stakedAmount: formattedStaked });
    
    if (formattedStaked <= 0) {
      logger.warn("UnstakeAll: no AXS tokens staked", { stakedAmount: formattedStaked });
      return false;
    }

    const randomGas = 400000 + Math.random() * (99999 - 10000) + 10000;
    const overrideOptions = { gasLimit: Math.floor(randomGas) };
    logger.info("UnstakeAll: submitting unstakeAll tx", { randomGas });

    const unstakeTx = await stakingContract.unstakeAll(overrideOptions);
    const receipt = await unstakeTx.wait();

    if (receipt) {
      const axsBal = await axsContract.balanceOf(WALLET_ADDRESS);
      
      console.log("AXS UNSTAKE ALL SUCCESSFUL");
      console.log("AXS Balance after unstake: " + formatEther(axsBal));

      const unstakeInfo = {
        timestamp: new Date().toISOString(),
        txHash: unstakeTx.hash,
        unstakedAmount: formatEther(stakedAmount),
        axsBalanceAfter: formatEther(axsBal),
        remainingStaked: "0",
        blockNumber: receipt.blockNumber,
      };
      await storeUnstakeInfo(unstakeInfo);
      logger.info("UnstakeAll: completed successfully", unstakeInfo);

      return true;
    }
  } catch (error) {
    logger.error("unstakeAllAXS error:", error);
  }
  return false;
}

async function storeStakeInfo(info: any): Promise<void> {
  const filePath = path.resolve(__dirname, "stake-info.json");
  let existingData: any[] = [];
  try {
    const content = await fs.readFile(filePath, "utf8");
    existingData = JSON.parse(content);
    if (!Array.isArray(existingData)) {
      existingData = [];
    }
  } catch (err) {
    existingData = [];
  }
  existingData.push(info);
  await fs.writeFile(filePath, JSON.stringify(existingData, null, 2));
  logger.info("Stake info saved to file.", { filePath, info });

  const metricsWriter = MetricsWriter.getInstance();
  await metricsWriter.writeStakingInfo(info);
}

async function storeUnstakeInfo(info: any): Promise<void> {
  const filePath = path.resolve(__dirname, "unstake-info.json");
  let existingData: any[] = [];
  try {
    const content = await fs.readFile(filePath, "utf8");
    existingData = JSON.parse(content);
    if (!Array.isArray(existingData)) {
      existingData = [];
    }
  } catch (err) {
    existingData = [];
  }
  existingData.push(info);
  await fs.writeFile(filePath, JSON.stringify(existingData, null, 2));
  logger.info("Unstake info saved to file.", { filePath, info });

  const metricsWriter = MetricsWriter.getInstance();
  await metricsWriter.writeUnstakingInfo(info);
}

async function storeClaimInfo(info: any): Promise<void> {
  const filePath = path.resolve(__dirname, "claim-info.json");
  let existingData: any[] = [];
  try {
    const content = await fs.readFile(filePath, "utf8");
    existingData = JSON.parse(content);
    if (!Array.isArray(existingData)) {
      existingData = [];
    }
  } catch (err) {
    existingData = [];
  }
  existingData.push(info);
  await fs.writeFile(filePath, JSON.stringify(existingData, null, 2));
  logger.info("Claim info saved to file.", { filePath, info });

  const metricsWriter = MetricsWriter.getInstance();
  await metricsWriter.writeClaimInfo(info);
}