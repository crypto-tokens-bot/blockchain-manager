import { JsonRpcProvider, Contract } from "ethers";
import MMM_ABI from "../../abi/MMM.json";

export class ContractService {
  private token: Contract;

  constructor(rpcUrl: string) {
    const provider = new JsonRpcProvider(rpcUrl);
    this.token = new Contract(
      process.env.CONTRACT_ADDRESS!,
      MMM_ABI,
      provider
    );
  }

  async getContractStats() {
    const [ totalSupply, totalStable, price, /*accProfitPerShare*/ ] =
      await Promise.all([
        this.token.totalSupply(),
        this.token.totalStable(),
        this.token.getPrice(),
       //this.token.accProfitPerShare(),
      ]);

    return {
      totalSupply: Number(totalSupply),
      totalStable: Number(totalStable),
      price:        Number(price) / 1e18,
     // accProfitPerShare: Number(accProfitPerShare) / 1e18,
    };
  }
}
