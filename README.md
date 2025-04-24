```
nvm use 22.4.0
```

A collection of scripts, services and strategy runners for interacting with smart contracts, DEXs, bridges, staking services, futures exchanges and more. This repository powers:

📥 Indexer: Listens to on-chain events and pushes them into a Redis queue

🤖 Strategy Runner: Consumes events (e.g. Deposited) and executes a pipeline of steps—cross-chain bridge → swap → staking

🔄 DEX Connector: Swap scripts for Katana/Uniswap, plus helpers to estimate and execute trades

🌉 Bridge Module: Send native tokens cross-chain (Ethereum ↔ Ronin) via CCIP

💰 Staking Module: Stake AXS tokens in an external contract

⚙️ Futures Demo: Example of opening a futures position on a CEX

🔍 Helpers & Utilities: CoinGecko client, Bybit deposit address fetcher, logger, etc.