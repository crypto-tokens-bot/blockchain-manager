export interface StrategyMonitoringData {
  // status smart-contract
  contract: {
    totalSupply: number; // Total supply MMM
    totalStable: number; // Total balance USDT in pool
    tokenPrice: number; // Current price MMM
    accProfitPerShare: number; // Accumulated profit per share
    totalUsers: number; // The number of users with a non-zero balance
  };

  // Stacking statistics
  staking: {
    totalStaked: number; // How many AXS are there in staking
    apr: number; // Annual return in %
    pendingRewards: number; // Pending rewards in AXS
    totalRewardsCollected: number; // Total rewards collected since the beginning of the lastRewardClaim strategy
    lastRewardClaim: Date; // Last collection of rewards
  };

  // Hedging position
  hedge: {
    size: number; // Position size in AXS
    entryPrice: number; // Entry price
    currentPrice: number; // Current price
    pnl: number; // Profit/Loss USD
    pnlPercent: number; // Current leverage
    liquidationPrice: number; // Price liquidation
    marginRatio: number; // Margin ratio
  };

  // Funding
  funding: {
    currentRate: number; // Current funding rate in %
    predictedRate: number; // Projected next rate in %
    nextFundingTime: Date; // Time of next funding
        accumulatedFunding: number; // Amount of funding since the beginning of the strategy
        annualizedFundingCost: number; // Annual funding costs in %
    };
// Total profitability of the strategy
performance: {
    totalPnl: number; // Total profit/loss in USD
        totalPnlPercent: number; // Total profit/loss in %
        annualizedReturn: number; // Expected annual return in %
        stakingPnl: number; // Profit from staking
        hedgePnl: number; // Profit/loss from hedging
        fundingCost: number; // Funding costs
        rebalanceCount: number; // Number of rebalances
        startDate: Date; // Start date of the strategy
        runningDays: number; // How many days does the strategy work?
      };
    
      // Strategy Parameters
      settings: {
        targetHedgeRatio: number; // Target hedging ratio
        currentHedgeRatio: number; // Current hedging ratio
        rebalanceThreshold: number; // Rebalancing threshold
        nextRebalanceCheck: Date; // Next rebalancing check
        stakingToken: string; // Staking Token (AXS)
    stakingAPR: number; // Declared annual profitability of staking
      };
    
      lastUpdated: Date; // Time of the last data update
    }

export interface AlertConfig {
  enabled: boolean;
  recipients?: string[];
  thresholds?: {
    fundingRate?: number;
    pnlPercent?: number;
    marginRatio?: number;
    hedgeRatioDifference?: number;
  };
}
