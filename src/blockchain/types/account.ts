export interface BlockchainAccount {
    address: string;
    balance: bigint;  // Using BigInt for precision
    nonce?: number;   // Optional: some blockchains require a nonce
    transactionCount?: number;  // Optional: number of transactions
}
