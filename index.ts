import { ethers } from "ethers";
import dotenv from "dotenv";

dotenv.config();

if (!process.env.WS_URL) {
  throw new Error("WS_URL is not defined in .env file");
}

const provider = new ethers.WebSocketProvider(process.env.WS_URL);
const CONTRACT_ADDRESS = "0xYourContractAddress";
const ABI = [
  "event Deposited(address indexed user, uint256 amountMMM, uint256 amountUSDT)",
  "event Withdrawn(address indexed user, uint256 amountMMM, uint256 amountUSDT)",
  "event ProfitAdded(uint256 amountUSDT)"
];

const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider);

// subscribe on event "Deposited"
contract.on("Deposited", (user, amountMMM, amountUSDT) => {
  console.log(`Deposit: ${user} deposited ${amountUSDT.toString()} USDT for ${amountMMM.toString()} MMM`);
  // actionProcessor.handleDeposit(user, amountMMM, amountUSDT);
});

// subscribe on event "Deposited"
contract.on("ProfitAdded", (amountUSDT) => {
  console.log(`Profit added: ${amountUSDT.toString()} USDT`);
  // actionProcessor.handleProfit(amountUSDT);
});
