// src/scripts/demoFuturesExchanges.ts
import { CoinGeckoClient } from '../blockchain/coinGeckoClient';

import dotenv from "dotenv";
dotenv.config();

async function main() {
  // https://api.coingecko.com/api/v3/ping?x_cg_demo_api_key=YOUR_API_KEY
  const key = process.env.COIN_GECKO_KEY;
  const api = `https://api.coingecko.com/api/v3/ping?x_cg_demo_api_key=${key}`
  const cg = new CoinGeckoClient();
  const futuresExs = await cg.getFuturesExchangesForToken('bitcoin');
  console.log('Futures are traded on:', Array.from(futuresExs));
}

main().catch(console.error);
