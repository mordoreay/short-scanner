import { Candle, Ticker, ExchangeAPI } from '@/types/scanner';

/**
 * Bybit Exchange API - PERPETUAL (Linear Futures)
 * Documentation: https://bybit-exchange.github.io/docs/v5/intro
 */
export class BybitAPI implements ExchangeAPI {
  name = 'bybit';
  private baseUrl = 'https://api.bybit.com';

  async getTickers(): Promise<Ticker[]> {
    try {
      // Use linear (USDT perpetual) category
      const response = await fetch(`${this.baseUrl}/v5/market/tickers?category=linear`, {
        next: { revalidate: 60 }
      });
      
      if (!response.ok) {
        throw new Error(`Bybit API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.retCode !== 0) {
        throw new Error(`Bybit API error: ${data.retMsg}`);
      }

      return data.result.list
        .filter((item: { symbol: string }) => item.symbol.endsWith('USDT'))
        .map((item: {
          symbol: string;
          lastPrice: string;
          price24hPcnt: string;
          volume24h: string;
          highPrice24h: string;
          lowPrice24h: string;
          turnover24h: string;
          fundingRate?: string;
          openInterest?: string;
          markPrice?: string;
          indexPrice?: string;
        }) => ({
          symbol: item.symbol,
          name: item.symbol.replace('USDT', ''),
          currentPrice: parseFloat(item.lastPrice),
          priceChange24h: parseFloat(item.price24hPcnt) * 100,
          volume: parseFloat(item.volume24h),
          high24h: parseFloat(item.highPrice24h),
          low24h: parseFloat(item.lowPrice24h),
          quoteVolume: parseFloat(item.turnover24h),
          // Perpetual specific
          fundingRate: item.fundingRate ? parseFloat(item.fundingRate) : undefined,
          openInterest: item.openInterest ? parseFloat(item.openInterest) : undefined,
          markPrice: item.markPrice ? parseFloat(item.markPrice) : undefined,
          indexPrice: item.indexPrice ? parseFloat(item.indexPrice) : undefined,
        }));
    } catch (error) {
      console.error('Bybit getTickers error:', error);
      return [];
    }
  }

  async getKlines(symbol: string, interval: string, limit: number = 300): Promise<Candle[]> {
    try {
      const intervalMap: Record<string, string> = {
        '15m': '15',
        '1h': '60',
        '4h': '240',
        '1d': 'D',
      };

      const bybitInterval = intervalMap[interval] || '240';
      
      // Use linear category for perpetual
      const response = await fetch(
        `${this.baseUrl}/v5/market/kline?category=linear&symbol=${symbol}&interval=${bybitInterval}&limit=${limit}`,
        { next: { revalidate: 30 } }
      );

      if (!response.ok) {
        throw new Error(`Bybit klines error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.retCode !== 0) {
        throw new Error(`Bybit klines error: ${data.retMsg}`);
      }

      return data.result.list
        .map((item: string[]) => ({
          timestamp: parseInt(item[0]),
          open: parseFloat(item[1]),
          high: parseFloat(item[2]),
          low: parseFloat(item[3]),
          close: parseFloat(item[4]),
          volume: parseFloat(item[5]),
        }))
        .reverse();
    } catch (error) {
      console.error('Bybit getKlines error:', error);
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
      const response = await fetch(
        `${this.baseUrl}/v5/market/funding/history?category=linear&symbol=${symbol}&limit=1`,
        { next: { revalidate: 60 } }
      );

      const data = await response.json();
      
      if (data.retCode !== 0 || !data.result.list?.length) {
        return { rate: 0, nextFundingTime: 0 };
      }

      const funding = data.result.list[0];
      return {
        rate: parseFloat(funding.fundingRate),
        nextFundingTime: parseInt(funding.fundingRateTimestamp) * 1000,
      };
    } catch (error) {
      console.error('Bybit getFundingRate error:', error);
      return { rate: 0, nextFundingTime: 0 };
    }
  }

  async getOpenInterest(symbol: string): Promise<{ value: number; change24h: number }> {
    try {
      const response = await fetch(
        `${this.baseUrl}/v5/market/open-interest?category=linear&symbol=${symbol}&intervalTime=1d`,
        { next: { revalidate: 60 } }
      );

      const data = await response.json();
      
      if (data.retCode !== 0 || !data.result.list?.length) {
        return { value: 0, change24h: 0 };
      }

      const oiList = data.result.list;
      const currentOI = parseFloat(oiList[0]?.openInterest || '0');
      const prevOI = parseFloat(oiList[1]?.openInterest || '0');
      const change24h = prevOI > 0 ? ((currentOI - prevOI) / prevOI) * 100 : 0;

      return {
        value: currentOI,
        change24h,
      };
    } catch (error) {
      console.error('Bybit getOpenInterest error:', error);
      return { value: 0, change24h: 0 };
    }
  }
}
