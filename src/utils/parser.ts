import { ethers } from "ethers";
import dotenv from "dotenv";
dotenv.config();

interface CLIArgs {
  network?: string;
  "rpc-url"?: string;
}

export function parseArgs(): CLIArgs {
    const args = process.argv.slice(2);
    const res: CLIArgs = {};
    for (let i = 0; i < args.length; i++) {
      if (args[i] === "--network" && args[i+1]) {
        res.network = args[i+1];
        i++;
      }
      if (args[i] === "--rpc-url" && args[i+1]) {
        res["rpc-url"] = args[i+1];
        i++;
      }
    }
    return res;
}