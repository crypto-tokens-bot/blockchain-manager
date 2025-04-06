import { runIndexer } from '../indexer/indexer';
import { fetchPastEvents } from '../indexer/fetchPastEvents';
import { CONTRACTS_TO_INDEX, IndexerConfig } from "../indexer/registry";
import { ethers } from 'ethers';
import dotenv from "dotenv";

dotenv.config();

const args = process.argv.slice(2);
const withHistory = args.includes("--with-history");

async function start() {      
  if (withHistory) {
    for (const contractConfig of CONTRACTS_TO_INDEX) {
      const { name, address, abi, events } = contractConfig;
      const correctAddress = ethers.getAddress("0xc9Cf4D74BF240B26ae1b613f85696eE8DA0aD549");
      await fetchPastEvents(correctAddress, abi);
    }
  }

  await runIndexer();
}

start();