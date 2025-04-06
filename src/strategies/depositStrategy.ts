export async function handleDepositEvent(data: {
    args: any[];
    contract: string;
    blockNumber: number;
  }) {
    const [user, mmmAmount, usdtAmount] = data.args;
  
    console.log(`💡 Strategy: Received deposit of ${usdtAmount} USDT by ${user}`);
  
    const half = BigInt(usdtAmount) / 2n;
  
    //await sendToStaking(user, half);
    //await sendToHyperliquid(user, half);
  }