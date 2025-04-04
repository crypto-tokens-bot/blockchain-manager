import MMM_ABI from "../abi/MMM.json";

export type IndexerConfig = {
    name: string;
    address: string;
    abi: any;
    events: string[]; // ["Deposited", "Withdrawn", "ProfitAdded"]
  };

  
export const CONTRACTS_TO_INDEX: IndexerConfig[] = [
  {
    name: "Token1",
    address: "0xc9Cf4D74BF240B26ae1b613f85696eE8DA0aD549",
    abi: MMM_ABI,
    events: ["Deposited", "Withdrawn", "ProfitAdded"]
  }
];
