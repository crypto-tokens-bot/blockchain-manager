import "dotenv/config";
import { ethers } from "ethers";
import fs from "fs/promises";
import { formatEther, parseEther } from "ethers";

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
};
type KatanaRouter = ethers.Contract & {
  getAmountsOut(amountIn: ethers.BigNumberish, path: string[]): Promise<ethers.BigNumberish[]>;
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

const stakingABI = ["function stake(uint256) external"];
const claimsABI = ["function claimPendingRewards()"];
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
const stakingAdd = "0x05b0bb3c1c320b280501b86706c3551995bc8571";

const wallet = new ethers.Wallet(PRIV_KEY, provider);
const axsContract = new ethers.Contract(AXS, erc20ABI, provider);
const katanaRouter = new ethers.Contract(katanaAdd, katanaABI, provider).connect(wallet) as KatanaRouter;
const stakingContract = new ethers.Contract(stakingAdd, stakingABI, provider).connect(wallet) as StakingContract;
const claimsContract = new ethers.Contract(claimsAdd, claimsABI, provider).connect(wallet);

export async function stakeAXStokens(): Promise<boolean> {
  try {
    const balance = await axsContract.balanceOf(WALLET_ADDRESS);
    const formattedBal = parseFloat(formatEther(balance));
    console.log("AXS Balance: " + formattedBal);

    if (formattedBal < 0.01) throw new Error("Staking value too small!");

    const randomGas = 400000 + Math.random() * (99999 - 10000) + 10000;
    const overrideOptions = { gasLimit: Math.floor(randomGas) };

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

      return true;
    }
  } catch (error) {
    console.error("stakeAXStokens error:", error);
  }
  return false;
}

export async function swapRONforAXS(amount: number): Promise<boolean> {
  try {
    if (amount < 0.04) throw new Error("Conversion value too small!");

    const gasRandom = Math.floor(Math.random() * (500000 - 400001) + 400000);
    const amountIn = parseEther(amount.toString());
    const path = [WRON, WETH, AXS];

    const result = await katanaRouter.getAmountsOut(amountIn, path);

    const amountOut = Number(ethers.formatEther(result[2])) * 0.99;
    const amountOutMin = ethers.parseEther(amountOut.toString());

    const deadline = Math.floor(Date.now() / 1000) + 60 * 5; // 5 min

    console.log(`Swapping: ${amount} RON, For: ~ ${amountOut} AXS`);
    const swapTx = await katanaRouter.swapExactRONForTokens(
      amountOutMin,
      path,
      WALLET_ADDRESS,
      deadline,
      { gasLimit: gasRandom, value: amountIn }
    );
    const swapReceipt = await swapTx.wait();
    if (swapReceipt) {
      console.log("RON SWAP SUCCESSFUL");
      return true;
    }
  } catch (error) {
    console.error("swapRONforAXS error:", error);
  }
  return false;
}

import path from "path";

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
  console.log("Stake info saved to file.");
}
