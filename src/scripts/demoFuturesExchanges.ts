// src/scripts/demoFuturesExchanges.ts
import { CoinGeckoClient } from '../blockchain/coinGeckoClient';

async function main() {
  const cg = new CoinGeckoClient();
  const futuresExs = await cg.getFuturesExchangesForToken('ethereum');
  console.log('Ethereum Futures are traded on:', Array.from(futuresExs));
}

main().catch(console.error);
