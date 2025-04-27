import { IExchangeAdapter} from '../../blockchain/exchanges/IExchangeAdapter';
// export class ExchangeStep {
//     constructor(private stakeService: typeof IExchangeAdapter) {}
  
//     async execute(user: string): Promise<void> {
//       console.info(`Step: stake for ${user}`);
//       const ok = await this.stakeService();
//       if (!ok) throw new Error("StakeStep failed");
//     }
//   }