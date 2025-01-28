class ActionProcessor {
    async handleDeposit(user: string, amountMMM: number, amountUSDT: number) {
      console.log(`Processing deposit: User=${user}, MMM=${amountMMM}, USDT=${amountUSDT}`);

      // await stakingService.stake(amountUSDT);
    }
  
    async handleProfit(amountUSDT: number) {
      console.log(`Processing profit: USDT=${amountUSDT}`);

      // await stakingService.allocateProfit(amountUSDT);
    }
  }
  
  export default new ActionProcessor();
  