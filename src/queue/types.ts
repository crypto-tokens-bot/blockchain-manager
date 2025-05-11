// src/queue/types.ts
export interface ContractEventData {
    contract: string;    // contract name
    event:    string;    // event name, for example "Deposited"
    args:     any[];     // args events (from, to, value…)
    blockNumber: number; // block number
  }
  