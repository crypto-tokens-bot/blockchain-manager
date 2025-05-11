import { InfluxDB, Point } from '@influxdata/influxdb-client';
import logger from '../utils/logger';

export class MetricsWriter {
  private static instance: MetricsWriter;
  private influxClient: InfluxDB;
  private writeApi: any;

  constructor(url: string, token: string) {
    this.influxClient = new InfluxDB({ url, token });
    this.writeApi = this.influxClient.getWriteApi('mmm-fund', 'strategy-monitoring');
  }

  static getInstance(): MetricsWriter {
    if (!MetricsWriter.instance) {
      MetricsWriter.instance = new MetricsWriter(
        process.env.INFLUXDB_URL!,
        process.env.INFLUXDB_TOKEN!
      );
    }
    return MetricsWriter.instance;
  }

  async writeContractEvent(event: any) {
    try {
      const point = new Point('blockchain_events')
        .tag('contract', event.contract)
        .tag('event_type', event.event)
        .tag('tx_hash', event.args[event.args.length - 1]?.transactionHash || 'unknown')
        .intField('block_number', event.blockNumber)
        .timestamp(new Date());

      // Добавляем специфичные поля для разных событий
      switch (event.event) {
        case 'Deposited':
          point.floatField('amount', parseFloat(event.args[1].toString()) / 1e18);
          point.floatField('minted_mmm', parseFloat(event.args[2].toString()) / 1e18);
          point.stringField('user_address', event.args[0]);
          break;
          
        case 'Withdrawn':
          point.floatField('amount', parseFloat(event.args[1].toString()) / 1e18);
          point.floatField('burned_mmm', parseFloat(event.args[2].toString()) / 1e18);
          point.stringField('user_address', event.args[0]);
          break;
          
        case 'ProfitAdded':
          point.floatField('profit_amount', parseFloat(event.args[0].toString()) / 1e18);
          break;
          
        case 'LossAdded':
          point.floatField('loss_amount', parseFloat(event.args[0].toString()) / 1e18);
          break;
      }

      this.writeApi.writePoint(point);
      await this.writeApi.flush();
      
      logger.info('Metrics: event written to InfluxDB', { 
        event: event.event, 
        contract: event.contract 
      });
    } catch (error) {
      logger.error('Metrics: failed to write event', { error, event });
    }
  }

  async writeStakingInfo(stakeInfo: any) {
    try {
      const point = new Point('staking_events')
        .tag('operation', 'stake')
        .tag('tx_hash', stakeInfo.txHash)
        .floatField('staked_amount', parseFloat(stakeInfo.stakedAmount))
        .floatField('ron_balance_after', parseFloat(stakeInfo.ronBalanceAfter))
        .floatField('axs_balance_after', parseFloat(stakeInfo.axsBalanceAfter))
        .intField('block_number', stakeInfo.blockNumber)
        .timestamp(new Date(stakeInfo.timestamp));

      this.writeApi.writePoint(point);
      await this.writeApi.flush();
      
      logger.info('Metrics: staking info written to InfluxDB', { 
        txHash: stakeInfo.txHash,
        amount: stakeInfo.stakedAmount 
      });
    } catch (error) {
      logger.error('Metrics: failed to write staking info', { error, stakeInfo });
    }
  }

  async writeSwapInfo(swapInfo: any) {
    try {
      const point = new Point('swap_events')
        .tag('operation', 'swap')
        .tag('from_token', 'RON')
        .tag('to_token', 'AXS')
        .tag('tx_hash', swapInfo.txHash)
        .floatField('amount_in', swapInfo.amountIn)
        .floatField('amount_out', swapInfo.amountOut)
        .floatField('price_impact', swapInfo.priceImpact || 0)
        .intField('gas_used', swapInfo.gasUsed || 0)
        .timestamp(new Date(swapInfo.timestamp));

      this.writeApi.writePoint(point);
      await this.writeApi.flush();
      
      logger.info('Metrics: swap info written to InfluxDB', { 
        txHash: swapInfo.txHash,
        amountIn: swapInfo.amountIn,
        amountOut: swapInfo.amountOut 
      });
    } catch (error) {
      logger.error('Metrics: failed to write swap info', { error, swapInfo });
    }
  }

  async writeBybitPosition(positionInfo: any) {
    try {
      const point = new Point('bybit_positions')
        .tag('symbol', positionInfo.symbol)
        .tag('side', positionInfo.side)
        .floatField('size', positionInfo.size)
        .floatField('entry_price', positionInfo.entryPrice)
        .floatField('mark_price', positionInfo.markPrice)
        .floatField('unrealized_pnl', positionInfo.unrealisedPnl)
        .floatField('leverage', positionInfo.leverage)
        .floatField('position_value', positionInfo.positionValue)
        .floatField('liquidation_price', positionInfo.liquidationPrice)
        .timestamp(new Date());

      this.writeApi.writePoint(point);
      await this.writeApi.flush();
      
      logger.info('Metrics: Bybit position written to InfluxDB', { 
        symbol: positionInfo.symbol,
        side: positionInfo.side,
        pnl: positionInfo.unrealisedPnl 
      });
    } catch (error) {
      logger.error('Metrics: failed to write Bybit position', { error, positionInfo });
    }
  }

  async writeFundingRate(fundingInfo: any) {
    try {
      const point = new Point('funding_rates')
        .tag('symbol', fundingInfo.symbol)
        .floatField('funding_rate', fundingInfo.fundingRate)
        .floatField('predicted_rate', fundingInfo.predictedFundingRate)
        .intField('next_funding_time', fundingInfo.nextFundingTime)
        .timestamp(new Date());

      this.writeApi.writePoint(point);
      await this.writeApi.flush();
      
      logger.info('Metrics: funding rate written to InfluxDB', { 
        symbol: fundingInfo.symbol,
        rate: fundingInfo.fundingRate 
      });
    } catch (error) {
      logger.error('Metrics: failed to write funding rate', { error, fundingInfo });
    }
  }

  async writeStrategyPerformance(performance: any) {
    try {
      const point = new Point('strategy_performance')
        .tag('strategy_name', performance.strategyName)
        .floatField('total_pnl', performance.totalPnl)
        .floatField('staking_rewards', performance.stakingRewards)
        .floatField('shorting_pnl', performance.shortingPnl)
        .floatField('fees', performance.fees)
        .floatField('net_profit', performance.netProfit)
        .floatField('roi_percentage', performance.roiPercentage)
        .timestamp(new Date());

      this.writeApi.writePoint(point);
      await this.writeApi.flush();
      
      logger.info('Metrics: strategy performance written to InfluxDB', { 
        strategy: performance.strategyName,
        pnl: performance.totalPnl 
      });
    } catch (error) {
      logger.error('Metrics: failed to write strategy performance', { error, performance });
    }
  }
}