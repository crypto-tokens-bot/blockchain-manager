import { ethers } from "ethers";
import { CONTRACTS_TO_INDEX } from "./registry";
import { eventQueue } from "../queue/eventQueue";
//import { parseEventArgs } from "./utils/parseEventArgs";
import { JsonRpcProvider, Log, Filter } from "ethers";
import { JsonRpcApiPollingProvider, JsonRpcApiProvider } from "ethers/lib.commonjs/providers/provider-jsonrpc";

const provider = new ethers.JsonRpcProvider(process.env.RPC_URL!);

// 1 day ≈ 6500 block (in Ethereum)
const BLOCKS_PER_DAY = 6500;
const DAYS_BACK = 22;

async function fetchLogsInRange(
    provider: JsonRpcProvider,
    filter: Filter,
    fromBlock: number,
    toBlock: number,
    maxRange = 500
  ): Promise<Log[]> {
    let logs: Log[] = [];
    let start = fromBlock;
  
    while (start <= toBlock) {
      let end = Math.min(start + maxRange - 1, toBlock);
  
      console.log(`Fetching logs from block ${start} to ${end}`);
  
      const partialLogs = await provider.getLogs({
        ...filter,
        fromBlock: ethers.toBeHex(start),
        toBlock: ethers.toBeHex(end),
      });
      if (partialLogs.length > 0) {
        console.log(`partialLogs:${partialLogs.length}`);
      }
  
      logs = logs.concat(partialLogs);
      start = end + 1;
    }
  
    return logs;
  }

export async function fetchPastEvents(contractAddress: string, abi: string) {
    const provider = new ethers.JsonRpcProvider(process.env.RPC_URL!, "sepolia");

    //const contractAddress = "0xc9Cf4D74BF240B26ae1b613f85696ee8da0ad549";
    //const abi = [ "event Deposited(address indexed user, uint256 amountMMM, uint256 amountUSDT)" ];
    const contract = new ethers.Contract(contractAddress, abi, provider);
  
    const events = contract.getEvent("Deposited");
    const computedTopic = ethers.keccak256(ethers.toUtf8Bytes("Deposited(address,uint256,uint256)"));

    console.log("Computed topic:", computedTopic);
    console.log("Event topic from fragment:", events.fragment.topicHash);

    const filter = {
        address: contractAddress,
        topics: [computedTopic]
  };
  const currentBlock = await provider.getBlockNumber();
  const fromBlock = 7920355;
  const toBlock = 7921355;
  //const fromBlock = currentBlock - 160000; // Example: 20 day back (20 * 6500)

  const logs = await fetchLogsInRange(provider, filter, fromBlock, toBlock);
  console.log(`Fetched ${logs.length} logs from block ${fromBlock} to ${toBlock}`);
  console.log(`logs len:${logs.length}`);
  for (const log of logs) {
    const parsed = contract.interface.decodeEventLog(events.fragment, log.data, log.topics);
    console.log("Parsed event:", parsed);
  }
}
