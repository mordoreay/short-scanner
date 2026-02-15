import { Candle, Ticker, ExchangeAPI } from '@/types/scanner';

/**
 * MEXC Exchange API - PERPETUAL (USDT Futures)
 * Documentation: https://mexcdevelop.github.io/apidocs/
 */
export class MEXCAPI implements ExchangeAPI {
  name = 'mexc';
  private baseUrl = 'https://contract.mexc.com'; // Futures API endpoint

  async getTickers(): Promise<Ticker[]> {
    try {
      // Get all perpetual futures tickers
      const response = await fetch(`${this.baseUrl}/api/v1/contract/ticker`, {
        next: { revalidate: 60 }
      });
      
      if (!response.ok) {
        throw new Error(`MEXC API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success !== true) {
        throw new Error(`MEXC API error: ${data.message || 'Unknown error'}`);
      }

      return data.data
        .filter((item: { symbol: string; quoteCoin: string }) => 
          item.quoteCoin === 'USDT'
        )
        .map((item: {
          symbol: string;
          lastPrice: string;
          riseFallRate: string;
          volume24: string;
          high24Price: string;
          low24Price: string;
          amount24: string;
          fundingRate?: string;
          holdAmount?: string;
          markPrice?: string;
          indexPrice?: string;
        }) => ({
          symbol: item.symbol,
          name: item.symbol.replace('_USDT', '').replace('USDT', ''),
          currentPrice: parseFloat(item.lastPrice),
          priceChange24h: parseFloat(item.riseFallRate) * 100,
          volume: parseFloat(item.volume24),
          high24h: parseFloat(item.high24Price),
          low24h: parseFloat(item.low24Price),
          quoteVolume: parseFloat(item.amount24),
          // Perpetual specific
          fundingRate: item.fundingRate ? parseFloat(item.fundingRate) : undefined,
          openInterest: item.holdAmount ? parseFloat(item.holdAmount) : undefined,
          markPrice: item.markPrice ? parseFloat(item.markPrice) : undefined,
          indexPrice: item.indexPrice ? parseFloat(item.indexPrice) : undefined,
        }));
    } catch (error) {
      console.error('MEXC getTickers error:', error);
      return [];
    }
  }

  async getKlines(symbol: string, interval: string, limit: number = 300): Promise<Candle[]> {
    try {
      // MEXC uses symbol like BTCUSDT for futures
      const mexcSymbol = symbol.includes('_') ? symbol.replace('_', '') : symbol;
      
      const intervalMap: Record<string, string> = {
        '15m': 'Min15',
        '1h': 'Min60',
        '4h': 'Hour4',
        '1d': 'Day1',
      };

      const mexcInterval = intervalMap[interval] || 'Hour4';
      
      const response = await fetch(
        `${this.baseUrl}/api/v1/contract/kline/${mexcSymbol}?interval=${mexcInterval}&limit=${limit}`,
        { next: { revalidate: 30 } }
      );

      if (!response.ok) {
        throw new Error(`MEXC klines error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success !== true) {
        throw new Error(`MEXC klines error: ${data.message}`);
      }

      // MEXC returns: [time, open, high, low, close, volume]
      return data.data.map((item: number[]) => ({
        timestamp: item[0],
        open: item[1],
        high: item[2],
        low: item[3],
        close: item[4],
        volume: item[5],
      }));
    } catch (error) {
      console.error('MEXC getKlines error:', error);
      return [];
    }
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
      const mexcSymbol = symbol.includes('_') ? symbol.replace('_', '') : symbol;
      
      const response = await fetch(
        `${this.baseUrl}/api/v1/contract/funding_rate/${mexcSymbol}`,
        { next: { revalidate: 60 } }
      );

      const data = await response.json();
      
      if (data.success !== true || !data.data) {
        return { rate: 0, nextFundingTime: 0 };
      }

      return {
        rate: parseFloat(data.data.fundingRate || '0'),
        nextFundingTime: parseInt(data.data.nextSettleTime || '0'),
      };
    } catch (error) {
      console.error('MEXC getFundingRate error:', error);
      return { rate: 0, nextFundingTime: 0 };
    }
  }

  async getOpenInterest(symbol: string): Promise<{ value: number; change24h: number }> {
    try {
      const mexcSymbol = symbol.includes('_') ? symbol.replace('_', '') : symbol;
      
      const response = await fetch(
        `${this.baseUrl}/api/v1/contract/open_interest/${mexcSymbol}`,
        { next: { revalidate: 60 } }
      );

      const data = await response.json();
      
      if (data.success !== true || !data.data) {
        return { value: 0, change24h: 0 };
      }

      return {
        value: parseFloat(data.data.openInterest || '0'),
        change24h: parseFloat(data.data.change24 || '0'),
      };
    } catch (error) {
      console.error('MEXC getOpenInterest error:', error);
      return { value: 0, change24h: 0 };
    }
  }
}
