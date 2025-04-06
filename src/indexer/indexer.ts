import { ethers } from "ethers";
import dotenv from "dotenv";
import { CONTRACTS_TO_INDEX, IndexerConfig } from "./registry";
import { eventQueue } from '../queue/eventQueue';

dotenv.config();

// const WS_URL = process.env.WS_URL!;
// const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS!;


const provider = new ethers.JsonRpcProvider(process.env.RPC_URL!, "sepolia");

export async function runIndexer() {
  for (const contractConfig of CONTRACTS_TO_INDEX) {
    setupContractListener(contractConfig);
  }
}

function setupContractListener(config: IndexerConfig) {
  const { name, address, abi, events } = config;
  const correctAddress = ethers.getAddress(address);
  const contract = new ethers.Contract(correctAddress, abi, provider);

  events.forEach((eventName) => {
    contract.on(eventName, (...args) => {
      const event = args[args.length - 1];
      console.log(`[${name}] Event ${eventName}:`, args);

      saveToQueue({
        contract: name,
        event: eventName,
        args,
        blockNumber: event.blockNumber
      });
    });
  });

  console.log(`[+] Listening to ${name} at ${address}`);
}

async function saveToQueue(data: any) {
  await eventQueue.add('contract-event', data);
}