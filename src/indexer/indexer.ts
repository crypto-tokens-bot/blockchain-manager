import { ethers } from "ethers";
import dotenv from "dotenv";

dotenv.config();

const WS_URL = process.env.WS_URL!;
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS!;

const provider = new ethers.WebSocketProvider(WS_URL);

const ABI = [
  "event Deposited(address indexed user, uint256 amountMMM, uint256 amountUSDT)",
  "event Withdrawn(address indexed user, uint256 amountMMM, uint256 amountUSDT)",
  "event ProfitAdded(uint256 amountUSDT)"
];

const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider);

const taskQueue: { type: string; data: any }[] = [];

console.log("🔍 Indexer started, listening for events...");

const processQueue = async () => {
  while (taskQueue.length > 0) {
    const task = taskQueue.shift();
    if (!task) continue;

    console.log(`⚡ Processing task: ${task.type}`, task.data);

    // Simulate execution (replace with staking or trading logic)
    await new Promise((res) => setTimeout(res, 500));

    console.log(`✅ Task completed: ${task.type}`);
  }
};

// Event listener for `Deposited`
contract.on("Deposited", (user, amountMMM, amountUSDT) => {
  console.log(`Deposit: ${user} deposited ${ethers.formatEther(amountUSDT)} USDT and received ${ethers.formatEther(amountMMM)} MMM`);
  
  taskQueue.push({
    type: "deposit",
    data: { user, amountMMM: amountMMM.toString(), amountUSDT: amountUSDT.toString(), timestamp: Date.now() }
  });

  processQueue();
});

// Event listener for `Withdrawn`
contract.on("Withdrawn", (user, amountMMM, amountUSDT) => {
  console.log(`Withdrawal: ${user} withdrew ${ethers.formatEther(amountMMM)} MMM and received ${ethers.formatEther(amountUSDT)} USDT`);

  taskQueue.push({
    type: "withdraw",
    data: { user, amountMMM: amountMMM.toString(), amountUSDT: amountUSDT.toString(), timestamp: Date.now() }
  });

  processQueue();
});

// Event listener for `ProfitAdded`
contract.on("ProfitAdded", (amountUSDT) => {
  console.log(`Profit added: ${ethers.formatEther(amountUSDT)} USDT`);

  taskQueue.push({
    type: "profit",
    data: { amountUSDT: amountUSDT.toString(), timestamp: Date.now() }
  });

  processQueue();
});
