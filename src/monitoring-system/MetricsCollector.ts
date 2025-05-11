import { ContractService } from "../blockchain/staking/ContractService";
import { BybitAdapter }     from "../blockchain/exchanges/BybitAdapter";
import { MetricsWriter }    from "./MetricsWriter";

export class MetricsCollector {
  constructor(
    private contractService: ContractService,
    private bybit: BybitAdapter
  ) {}

  async collectAllMetrics() {
    const mw = MetricsWriter.getInstance();

    // 1) on-chain stats
    const c = await this.contractService.getContractStats();
    await mw.writeContractEvent({ 
      contract: "Token1", event: "Snapshot", args: [], blockNumber: 0, 
      ...c 
    });

    // 2) position from exchange
    //const pos = await this.bybit.fetchPosition("AXSUSDT");
    //await mw.writeBybitPosition(pos);

    // 3) funding rate
    //const funding = await this.bybit.fetchFundingRate("AXSUSDT");
    //await mw.writeFundingRate(funding);

    // 4) можно дописать стейкинг, swap etc.
  }
}