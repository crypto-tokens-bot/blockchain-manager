import axios, { AxiosInstance } from "axios";

export interface Ticker {
  base: string;
  target: string;
  market: {
    name: string;
    identifier: string;
    has_trading_incentive: boolean;
  };
  last: number;
  volume: number;
  converted_last: { [currency: string]: number };
  converted_volume: { [currency: string]: number };
  trust_score: string;
  bid_ask_spread_percentage: number;
  timestamp: string;
  last_traded_at: string;
  last_fetch_at: string;
  is_anomaly: boolean;
  is_stale: boolean;
  trade_url: string | null;
  token_info_url: string | null;
}

export class coinGeckoClient {
  private readonly api: AxiosInstance;

  constructor(baseUrl = "https://api.coingecko.com/api/v3") {
    this.api = axios.create({ baseURL: baseUrl, timeout: 10_000 });
  }

  /**
   * Fetch raw tickers for a given coin ID (e.g. 'ethereum', 'axie-infinity')
   */
  async getTickers(coinId: string): Promise<Ticker[]> {
    const resp = await this.api.get<{ tickers: Ticker[] }>(
      `/coins/${coinId}/tickers`
    );
    return resp.data.tickers;
  }

  /**
   * Returns a set of unique exchange names where the token is traded.
   */
  async getExchangesForToken(coinId: string): Promise<Set<string>> {
    const tickers = await this.getTickers(coinId);
    return new Set(tickers.map(t => t.market.name));
  }

  /**
   * Optionally: fetch simple price (in vs currencies) for a given coin ID
   */
  async getSimplePrice(
    coinIds: string[],
    vsCurrencies: string[] = ['usd']
  ): Promise<Record<string, Record<string, number>>> {
    const resp = await this.api.get('/simple/price', {
      params: {
        ids: coinIds.join(','),
        vs_currencies: vsCurrencies.join(','),
      }
    });
    return resp.data;
  }
}
