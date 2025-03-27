import { RestClientV5 } from 'bybit-api';
import dotenv from "dotenv";
dotenv.config();

const API_KEY = process.env.API_KEY;
const API_SECRET = process.env.API_SECRET;

if (!API_KEY || !API_SECRET) {
    throw new Error('API_KEY or API_SECRET is not set in environment variables.');
}

(globalThis as any).crypto = require('crypto').webcrypto;
const client = new RestClientV5({
    key: API_KEY,
    secret: API_SECRET,
    //testnet: true, 
});

async function fetchDepositAddress(coin: string, chain: string) {
    try {
      const result = await client.getMasterDepositAddress(
        coin,
        chain,
      );
  
      console.log('Deposit address:', result.result);
    } catch (error: any) {
      console.error('Error:', error.response?.data || error.message || error);
    }
  }
  
fetchDepositAddress("USDT", "ARBI");