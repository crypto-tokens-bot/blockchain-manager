A collection of scripts, services and strategy runners for interacting with smart contracts, DEXs, bridges, staking services, futures exchanges and more. This repository powers:

📥 Indexer: Listens to on-chain events and pushes them into a Redis queue

🤖 Strategy Runner: Consumes events (e.g. Deposited) and executes a pipeline of steps—cross-chain bridge → swap → staking

🔄 DEX Connector: Swap scripts for Katana/Uniswap, plus helpers to estimate and execute trades

🌉 Bridge Module: Send native tokens cross-chain (Ethereum ↔ Ronin) via CCIP

💰 Staking Module: Stake AXS tokens in an external contract

⚙️ Futures Demo: Example of opening a futures position on a CEX

🔍 Helpers & Utilities: CoinGecko client, Bybit deposit address fetcher, logger, etc.


### Install dependecies:
```
npm install
```

### For update nvm:
```
nvm use 22.4.0
```

## Scripts
All scripts live under src/scripts/. You can run them via npm run:


Command	Description
```
npm run start:indexer
```
Start live indexer (listens for on-chain events & enqueues jobs)
```
npm run start:indexer:history
```	
Replay historical events (with --with-history)
```
npm run demo:futures
```	
Demo: open a futures position on a CEX (Bybit)
```
npm run staking:axs
```
Stake all AXS balance into staking contract
```
npm run swap:axs
```	
Swap RON → AXS via Katana
```
npm run bridge:tokens
```	
Bridge native ETH → Ronin via CCIP
```
npm run test:hyperliquid
```	
Quick test of Hyperliquid connector



## Adding Your Own Steps
The core Strategy Runner is powered by a Pipeline pattern. You can add your own:

Create a new Step class under src/strategies/steps/<YourStep>.ts

Implement an execute(user: string, amount?: string): Promise<boolean> method

Wire it into a new pipeline in src/runner/StrategyRunner.ts

## Logging
We use Winston with:

Console (all levels)

logs/errors.log (errors only)

logs/combined.log (everything)

MongoDB (warn+ goes into app_logs collection)

#### Example:
```ts
import logger from "../utils/logger";

logger.info("Starting bridge", { user, amount });
logger.error("Bridge failed", err);
```


## Strategy Staking + Hedging
Briefly about the strategy with AXS stacking

#### Deposit Event:
- When a user deposits USDT/USDC into the pool (Deposited event), our "Runner" processes this event.

#### We divide the funds in half
- Half of the deposit goes to the inter—network bridge (Ethereum → Ronin)

- the other half remains on Ronin for exchange.

#### Bridge and swap
- We transfer the required amount of ETH/USDT → Ronin via CCIP-bridge,
- Change the received RON → AXS to Ronin DEX (Katana/Uniswap).

#### AXS staking
- Automatically calling the stake(amount) function in the AXS staking contract,
- We record the transaction and save the data (TxHash, final balance) for the report.

#### Result
- The user receives income in the form of AXS rewards (APY ~28-35%),
- Everything is done without manual intervention, taking into account the gas reserve and kickbacks.

You can check staking AXS hear:
https://stake.axieinfinity.com/


### Indexer run:
```
ts-node src/scripts/startIndexer.ts --with-history true > logs/log.log
```