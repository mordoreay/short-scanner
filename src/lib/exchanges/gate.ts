import { Candle, Ticker, ExchangeAPI } from '@/types/scanner';

/**
 * Gate Exchange API - PERPETUAL (USDT Futures)
 * Documentation: https://www.gate.io/docs/developers/apiv4/en/
 */
export class GateAPI implements ExchangeAPI {
  name = 'gate';
  private baseUrl = 'https://api.gateio.ws/api/v4';

  async getTickers(): Promise<Ticker[]> {
    try {
      // Get all perpetual futures tickers
      const response = await fetch(`${this.baseUrl}/futures/usdt/contracts`, {
        next: { revalidate: 60 }
      });
      
      if (!response.ok) {
        throw new Error(`Gate API error: ${response.status}`);
      }

      const data = await response.json();
      
      return data
        .filter((item: { name: string; in_delisting: boolean }) => 
          item.name.endsWith('_USDT') && !item.in_delisting
        )
        .map((item: {
          name: string;
          last_price: string;
          change_percentage: string;
          volume_24h: string;
          volume_24h_usd: string;
          high_24h: string;
          low_24h: string;
          funding_rate?: string;
          open_interest?: string;
          mark_price?: string;
          index_price?: string;
        }) => ({
          symbol: item.name,
          name: item.name.replace('_USDT', ''),
          currentPrice: parseFloat(item.last_price),
          priceChange24h: parseFloat(item.change_percentage),
          volume: parseFloat(item.volume_24h),
          high24h: parseFloat(item.high_24h),
          low24h: parseFloat(item.low_24h),
          quoteVolume: parseFloat(item.volume_24h_usd),
          // Perpetual specific
          fundingRate: item.funding_rate ? parseFloat(item.funding_rate) : undefined,
          openInterest: item.open_interest ? parseFloat(item.open_interest) : undefined,
          markPrice: item.mark_price ? parseFloat(item.mark_price) : undefined,
          indexPrice: item.index_price ? parseFloat(item.index_price) : undefined,
        }));
    } catch (error) {
      console.error('Gate getTickers error:', error);
      return [];
    }
  }

  async getKlines(symbol: string, interval: string, limit: number = 300): Promise<Candle[]> {
    try {
      // Convert symbol format (BTCUSDT -> BTC_USDT)
      const gateSymbol = symbol.includes('_') ? symbol : `${symbol.replace('USDT', '_USDT')}`;
      
      const intervalMap: Record<string, string> = {
        '15m': '15m',
        '1h': '1h',
        '4h': '4h',
        '1d': '1d',
      };

      const gateInterval = intervalMap[interval] || '4h';
      const now = Math.floor(Date.now() / 1000);
      const from = now - (limit * this.getIntervalSeconds(interval));
      
      const response = await fetch(
        `${this.baseUrl}/futures/usdt/candlesticks?contract=${gateSymbol}&interval=${gateInterval}&from=${from}&to=${now}`,
        { next: { revalidate: 30 } }
      );

      if (!response.ok) {
        throw new Error(`Gate klines error: ${response.status}`);
      }

      const data = await response.json();
      
      return data.map((item: {
        t: number;
        o: string;
        h: string;
        l: string;
        c: string;
        v: string;
      }) => ({
        timestamp: item.t * 1000,
        open: parseFloat(item.o),
        high: parseFloat(item.h),
        low: parseFloat(item.l),
        close: parseFloat(item.c),
        volume: parseFloat(item.v),
      }));
    } catch (error) {
      console.error('Gate getKlines error:', error);
      return [];
    }
  }

  private getIntervalSeconds(interval: string): number {
    const seconds: Record<string, number> = {
      '15m': 15 * 60,
      '1h': 60 * 60,
      '4h': 4 * 60 * 60,
      '1d': 24 * 60 * 60,
    };
    return seconds[interval] || seconds['4h'];
  }

  async getTopGainers(minChange: number = 15, limit: number = 50): Promise<Ticker[]> {
    const tickers = await this.getTickers();
    
    return tickers
      .filter(t => t.priceChange24h >= minChange)
      .sort((a, b) => b.priceChange24h - a.priceChange24h)
      .slice(0, limit);
  }

  async getFundingRate(symbol: string): Promise<{ rate: number; nextFundingTime: number }> {
    try {
      const gateSymbol = symbol.includes('_') ? symbol : `${symbol.replace('USDT', '_USDT')}`;
      
      const response = await fetch(
        `${this.baseUrl}/futures/usdt/funding_rate?contract=${gateSymbol}`,
        { next: { revalidate: 60 } }
      );

      const data = await response.json();
      
      if (!Array.isArray(data) || data.length === 0) {
        return { rate: 0, nextFundingTime: 0 };
      }

      const funding = data[0];
      return {
        rate: parseFloat(funding.r || '0'),
        nextFundingTime: parseInt(funding.t || '0') * 1000,
      };
    } catch (error) {
      console.error('Gate getFundingRate error:', error);
      return { rate: 0, nextFundingTime: 0 };
    }
  }

  async getOpenInterest(symbol: string): Promise<{ value: number; change24h: number }> {
    try {
      const gateSymbol = symbol.includes('_') ? symbol : `${symbol.replace('USDT', '_USDT')}`;
      
      const response = await fetch(
        `${this.baseUrl}/futures/usdt/open_interest?contract=${gateSymbol}`,
        { next: { revalidate: 60 } }
      );

      const data = await response.json();
      
      return {
        value: parseFloat(data.open_interest || '0'),
        change24h: parseFloat(data.open_interest_change_24h || '0'),
      };
    } catch (error) {
      console.error('Gate getOpenInterest error:', error);
      return { value: 0, change24h: 0 };
    }
  }
}
