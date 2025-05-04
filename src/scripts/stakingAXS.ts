import { ethers } from 'ethers';
import dotenv from "dotenv";

import { stakeAXStokens } from '../blockchain/staking/axs-staking'

dotenv.config();

const args = process.argv.slice(2);
const withHistory = args.includes("--with-history");

async function start() {
    try {
      const result = await stakeAXStokens();
      console.log("StakeAXStokens result:", result);
      process.exit(0);
    } catch (error) {
      console.error("Error calling stakeAXStokens:", error);
      process.exit(1);
    }
  }

start();