import "dotenv/config";
import { scheduleJob } from "node-schedule";
import { ethers } from "ethers";
import figlet from "figlet";
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
    stake(amount: ethers.BigNumberish, overrides?: ethers.Overrides): Promise<ethers.ContractTransaction>;
};

const RPC_URL: string = process.env.RONIN_RPC || ""; // https://api.roninchain.com/rpc
const WALLET_ADDRESS: string = process.env.USER_ADDRESS || "";
const USER_AGENT: string = process.env.USER_AGENT || "";
const PRIV_KEY: string = process.env.USER_PRIVATE_KEY || "";

const provider = new ethers.JsonRpcProvider(RPC_URL);

const stakingABI = ["function stake(uint256) external"];
const claimsABI = ["function claimPendingRewards()"];
const erc20ABI = ["function balanceOf(address) view returns (uint256)"];
const katanaABI = [
  "function swapExactRONForTokens(uint256, address[], address, uint256) payable",
  "function getAmountsOut(uint, address[]) public view returns (uint[])",
];

const AXS = "0x97a9107c1793bc407d6f527b77e7fff4d812bece";
const WRON = "0xe514d9deb7966c8be0ca922de8a064264ea6bcd4";
const WETH = "0xc99a6a985ed2cac1ef41640596c5a5f9f4e19ef5";
const katanaAdd = "0x7d0556d55ca1a92708681e2e231733ebd922597d";
const claimsAdd = "0xd4640c26c1a31cd632d8ae1a96fe5ac135d1eb52";
const stakingAdd = "0x05b0bb3c1c320b280501b86706c3551995bc8571";

const wallet = new ethers.Wallet(PRIV_KEY, provider);
const axsContract = new ethers.Contract(AXS, erc20ABI, provider);
const katanaRouter = new ethers.Contract(katanaAdd, katanaABI, provider).connect(wallet);
const stakingContract = new ethers.Contract(stakingAdd, stakingABI, provider).connect(wallet) as StakingContract;
const claimsContract = new ethers.Contract(claimsAdd, claimsABI, provider).connect(wallet);

async function main(): Promise<void> {
  try {
    console.log(
      figlet.textSync("RONCompound", {
        font: "Standard",
        horizontalLayout: "default",
        verticalLayout: "default",
        width: 80,
        whitespaceBreak: true,
      })
    );


    const balance = await provider.getBalance(WALLET_ADDRESS);
    console.log("RON Balance: " + formatEther(balance));

    let claimsExists = false;
    try {
      const storedData = JSON.parse(await fs.readFile("./claims.json", "utf-8"));
      if ("nextClaim" in storedData) {
        const nextClaim = new Date(storedData.nextClaim);
        const currentDate = new Date();
        if (nextClaim > currentDate) {
          console.log("Restored Claim: " + nextClaim);
          scheduleJob(nextClaim, RONCompound);
          claimsExists = true;
        }
      }
    } catch (error) {
      console.error("Error reading claims data:", error);
    }

    if (!claimsExists) {
      RONCompound();
    }
  } catch (error) {
    console.error("Main function error:", error);
  }
}

async function RONCompound(): Promise<boolean> {
  try {
    const rewardBalance: number = await claimRONrewards();
    const swapped: boolean = await swapRONforAXS(rewardBalance);
    if (swapped) {
      return await stakeAXStokens();
    }
  } catch (error) {
    console.error("RONCompound error:", error);
  }
  return false;
}

async function stakeAXStokens(): Promise<boolean> {
  try {
    const balance = await axsContract.balanceOf(WALLET_ADDRESS);
    const formattedBal = parseFloat(formatEther(balance));
    console.log("AXS Balance: " + formattedBal);

    if (formattedBal < 0.01) throw new Error("Staking value too small!");

    const randomGas = 400000 + Math.random() * (99999 - 10000) + 10000;
    const overrideOptions = { gasLimit: Math.floor(randomGas) };

    console.log("Staking AXS Tokens...");
    const stakeTx = await stakingContract.stake(balance, overrideOptions);
    const receipt = await stakeTx.wait();

    if (receipt) {
      console.log("AXS STAKE SUCCESSFUL");
      const ronBal = await provider.getBalance(WALLET_ADDRESS);
      console.log("RON Balance: " + formatEther(ronBal));
      const axsBal = await axsContract.balanceOf(WALLET_ADDRESS);
      console.log("AXS Balance: " + formatEther(axsBal));
      return true;
    }
  } catch (error) {
    console.error("stakeAXStokens error:", error);
  }
  return false;
}

async function swapRONforAXS(amount: number): Promise<boolean> {
  try {
    if (amount < 0.04) throw new Error("Conversion value too small!");

    const gasRandom = Math.floor(Math.random() * (500000 - 400001) + 400000);
    const amountIn = parseEther(amount.toString());
    const path = [WRON, WETH, AXS];
    return true;

    // const result = await katanaRouter.getAmountsOut(amountIn, path);
    // const amountOut = Number(formatEther(result[2])) * 0.99;
    // const amountOutMin = parseEther(amountOut.toString());
    // const deadline = Math.floor(Date.now() / 1000) + 60 * 5; // 5 min

    // console.log(`Swapping: ${amount} RON, For: ~ ${amountOut} AXS`);
    // const swapTx = await katanaRouter.swapExactRONForTokens(
    //   amountOutMin,
    //   path,
    //   WALLET_ADDRESS,
    //   deadline,
    //   { gasLimit: gasRandom, value: amountIn }
    // );
//     const swapReceipt = await swapTx.wait();
//     if (swapReceipt) {
//       console.log("RON SWAP SUCCESSFUL");
//       return true;
//     }
//   } catch (error) {
//     console.error("swapRONforAXS error:", error);
//   }
//   return false;
//}

async function claimRONrewards(): Promise<number> {
  try {
    const gasRandom = Math.floor(400000 + Math.random() * (99999 - 10000) + 10000);
    const overrideOptions = { gasLimit: Math.floor(gasRandom) };

    const claimTx = await claimsContract.claimPendingRewards(overrideOptions);
    const claimReceipt = await claimTx.wait();

    if (claimReceipt) {
      claims.previousClaim = new Date().toString();
      console.log("RON CLAIM SUCCESSFUL");
      let balance = await provider.getBalance(WALLET_ADDRESS);
      const formatted = parseFloat(formatEther(balance));
      console.log("RON Balance: " + formatted);
      scheduleNext(new Date());
      return formatted;
    }
  } catch (error) {
    console.error("claimRONrewards error:", error);
    console.log("Claims Attempt Failed! Trying again tomorrow.");
    scheduleNext(new Date());
  }
  return 0;
}

async function scheduleNext(nextDate: Date): Promise<void> {
  nextDate.setHours(nextDate.getHours() + 24);
  nextDate.setMinutes(nextDate.getMinutes() + 1);
  nextDate.setSeconds(nextDate.getSeconds() + 30);
  claims.nextClaim = nextDate.toString();
  console.log("Next Claim: " + nextDate);
  scheduleJob(nextDate, RONCompound);
  await storeData();
}

async function storeData(): Promise<void> {
  const data = JSON.stringify(claims, null, 2);
  try {
    await fs.writeFile("./claims.json", data);
    console.log("Data stored:\n" + data);
  } catch (error) {
    console.error("storeData error:", error);
  }
}

main().catch((err) => {
  console.error("Main error:", err);
});
