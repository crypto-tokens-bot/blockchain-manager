import "dotenv/config";
import { BigNumberish, ethers } from "ethers";

const bridgeABI = [
    "function ccipSend(uint64 destinationChainSelector, (bytes receiver, address feeToken, (uint256 amount)[] tokenAmounts, bytes extraArgs) message) external payable returns (uint256)"
];


const ETH_RPC_URL: string = process.env.ETH_RPC_URL!;
const PRIVATE_KEY: string = process.env.PRIVATE_KEY!;
const CCIP_BRIDGE_ADDRESS: string = process.env.CCIP_BRIDGE_ADDRESS!;
const RONIN_RECIPIENT: string = process.env.RONIN_RECIPIENT!;

const provider = new ethers.JsonRpcProvider(ETH_RPC_URL); // 
const wallet = new ethers.Wallet(PRIVATE_KEY as `0x${string}`, provider);

const bridgeContract = new ethers.Contract(CCIP_BRIDGE_ADDRESS, bridgeABI, wallet);

export async function bridgeNativeTokens(amount: number): Promise<boolean> {
    try {
        const destinationChainSelector: BigNumberish = "6916147374840168000";
        const feeToken = "0x0000000000000000000000000000000000000000";
        const value = ethers.parseEther(amount.toString());

        const fee = ethers.parseEther("0.01");
        if (value < fee) throw new Error("Value must be greater than fee amount.");
        const tokenAmountValue = value - fee;

        const message = {
            receiver: RONIN_RECIPIENT,
            feeToken: "0x0000000000000000000000000000000000000000",
            tokenAmounts: [{
              amount: tokenAmountValue.toString() // Amount in wei as a string
            }],
            extraArgs: "0x181dcf1000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001"
        };

        console.log(`Bridging ${amount} native tokens with msg.value = ${value.toString()}`);
        console.log("Destination Chain Selector:", destinationChainSelector.toString());
        console.log("Message:", message);

        const tx = await bridgeContract.ccipSend(destinationChainSelector, message, { value });
        console.log("Bridge transaction sent, hash:", tx.hash);

        const receipt = await tx.wait();
        console.log("Bridge transaction receipt:", receipt);
        return receipt.status === 1;
    } catch (error) {
        console.error("Error bridging tokens:", error);
    return false;
    }
}