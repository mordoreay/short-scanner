import { Candle, Ticker, ExchangeAPI } from '@/types/scanner';

/**
 * Bitget Exchange API - PERPETUAL (USDT-Futures)
 * Documentation: https://www.bitget.com/api-doc/common/intro
 */
export class BitgetAPI implements ExchangeAPI {
  name = 'bitget';
  private baseUrl = 'https://api.bitget.com';

  async getTickers(): Promise<Ticker[]> {
    try {
      // USDT-FUTURES = USDT-margined perpetual
      const response = await fetch(`${this.baseUrl}/api/v2/mix/market/tickers?productType=USDT-FUTURES`, {
        next: { revalidate: 60 }
      });
      
      if (!response.ok) {
        throw new Error(`Bitget API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.code !== '00000') {
        throw new Error(`Bitget API error: ${data.msg}`);
      }

      return data.data
        .filter((item: { symbol: string }) => item.symbol.endsWith('USDT'))
        .map((item: {
          symbol: string;
          lastPr: string;
          change24h: string;
          baseVolume: string;
          high24h: string;
          low24h: string;
          quoteVolume: string;
          fundingRate?: string;
          openInterest?: string;
          markPrice?: string;
          indexPrice?: string;
        }) => ({
          symbol: item.symbol,
          name: item.symbol.replace('USDT', ''),
          currentPrice: parseFloat(item.lastPr),
          priceChange24h: parseFloat(item.change24h) * 100,
          volume: parseFloat(item.baseVolume),
          high24h: parseFloat(item.high24h),
          low24h: parseFloat(item.low24h),
          quoteVolume: parseFloat(item.quoteVolume),
          // Perpetual specific
          fundingRate: item.fundingRate ? parseFloat(item.fundingRate) : undefined,
          openInterest: item.openInterest ? parseFloat(item.openInterest) : undefined,
          markPrice: item.markPrice ? parseFloat(item.markPrice) : undefined,
          indexPrice: item.indexPrice ? parseFloat(item.indexPrice) : undefined,
        }));
    } catch (error) {
      console.error('Bitget getTickers error:', error);
      return [];
    }
  }

  async getKlines(symbol: string, interval: string, limit: number = 300): Promise<Candle[]> {
    try {
      const intervalMap: Record<string, string> = {
        '15m': '15m',
        '1h': '1H',
        '4h': '4H',
        '1d': '1D',
      };

      const bitgetInterval = intervalMap[interval] || '4H';
      const endTime = Date.now();
      const startTime = endTime - (limit * this.getIntervalMs(interval));
      
      const response = await fetch(
        `${this.baseUrl}/api/v2/mix/market/candles?productType=USDT-FUTURES&symbol=${symbol}&interval=${bitgetInterval}&limit=${limit}`,
        { next: { revalidate: 30 } }
      );

      if (!response.ok) {
        throw new Error(`Bitget klines error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.code !== '00000') {
        throw new Error(`Bitget klines error: ${data.msg}`);
      }

      return data.data
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
      console.error('Bitget getKlines error:', error);
      return [];
    }
  }

  private getIntervalMs(interval: string): number {
    const ms: Record<string, number> = {
      '15m': 15 * 60 * 1000,
      '1h': 60 * 60 * 1000,
      '4h': 4 * 60 * 60 * 1000,
      '1d': 24 * 60 * 60 * 1000,
    };
    return ms[interval] || ms['4h'];
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
        `${this.baseUrl}/api/v2/mix/market/current-funding-rate?productType=USDT-FUTURES&symbol=${symbol}`,
        { next: { revalidate: 60 } }
      );

      const data = await response.json();
      
      if (data.code !== '00000' || !data.data) {
        return { rate: 0, nextFundingTime: 0 };
      }

      return {
        rate: parseFloat(data.data.fundingRate || '0'),
        nextFundingTime: parseInt(data.data.nextFundingTime || '0'),
      };
    } catch (error) {
      console.error('Bitget getFundingRate error:', error);
      return { rate: 0, nextFundingTime: 0 };
    }
  }

  async getOpenInterest(symbol: string): Promise<{ value: number; change24h: number }> {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/v2/mix/market/open-interest?productType=USDT-FUTURES&symbol=${symbol}`,
        { next: { revalidate: 60 } }
      );

      const data = await response.json();
      
      if (data.code !== '00000' || !data.data) {
        return { value: 0, change24h: 0 };
      }

      return {
        value: parseFloat(data.data.openInterest || '0'),
        change24h: parseFloat(data.data.openInterestChange24h || '0'),
      };
    } catch (error) {
      console.error('Bitget getOpenInterest error:', error);
      return { value: 0, change24h: 0 };
    }
  }
}
