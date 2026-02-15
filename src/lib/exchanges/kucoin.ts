import { Candle, Ticker, ExchangeAPI } from '@/types/scanner';

/**
 * KuCoin Exchange API - PERPETUAL (USDT Futures)
 * Documentation: https://www.kucoin.com/docs/
 */
export class KuCoinAPI implements ExchangeAPI {
  name = 'kucoin';
  private baseUrl = 'https://api-futures.kucoin.com'; // Futures API endpoint

  async getTickers(): Promise<Ticker[]> {
    try {
      // Get all USDT-M futures tickers
      const response = await fetch(`${this.baseUrl}/api/v1/contracts/active`, {
        next: { revalidate: 60 }
      });
      
      if (!response.ok) {
        throw new Error(`KuCoin API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.code !== '200000') {
        throw new Error(`KuCoin API error: ${data.msg}`);
      }

      return data.data
        .filter((item: { symbol: string; settlementCurrency: string }) => 
          item.settlementCurrency === 'USDT' && item.symbol.endsWith('USDT')
        )
        .map((item: {
          symbol: string;
          markPrice: string;
          priceChangePercent: string;
          volumeOfDay: string;
          highOfDay: string;
          lowOfDay: string;
          turnoverOfDay: string;
          fundingFeeRate?: string;
          openInterest?: string;
          indexPrice?: string;
        }) => ({
          symbol: item.symbol,
          name: item.symbol.replace('USDT', '').replace('USDTM', ''),
          currentPrice: parseFloat(item.markPrice),
          priceChange24h: parseFloat(item.priceChangePercent) * 100,
          volume: parseFloat(item.volumeOfDay),
          high24h: parseFloat(item.highOfDay),
          low24h: parseFloat(item.lowOfDay),
          quoteVolume: parseFloat(item.turnoverOfDay),
          // Perpetual specific
          fundingRate: item.fundingFeeRate ? parseFloat(item.fundingFeeRate) : undefined,
          openInterest: item.openInterest ? parseFloat(item.openInterest) : undefined,
          markPrice: parseFloat(item.markPrice),
          indexPrice: item.indexPrice ? parseFloat(item.indexPrice) : undefined,
        }));
    } catch (error) {
      console.error('KuCoin getTickers error:', error);
      return [];
    }
  }

  async getKlines(symbol: string, interval: string, limit: number = 300): Promise<Candle[]> {
    try {
      const intervalMap: Record<string, string> = {
        '15m': '15min',
        '1h': '1hour',
        '4h': '4hour',
        '1d': '1day',
      };

      const kucoinInterval = intervalMap[interval] || '4hour';
      const endTime = Date.now();
      const startTime = endTime - (limit * this.getIntervalMs(interval));
      
      const response = await fetch(
        `${this.baseUrl}/api/v1/kline/query?symbol=${symbol}&granularity=${kucoinInterval}&from=${Math.floor(startTime / 1000)}&to=${Math.floor(endTime / 1000)}`,
        { next: { revalidate: 30 } }
      );

      if (!response.ok) {
        throw new Error(`KuCoin klines error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.code !== '200000') {
        throw new Error(`KuCoin klines error: ${data.msg}`);
      }

      // KuCoin returns [time, open, high, low, close, volume]
      return data.data.map((item: number[]) => ({
        timestamp: item[0] * 1000,
        open: item[1],
        high: item[2],
        low: item[3],
        close: item[4],
        volume: item[5],
      }));
    } catch (error) {
      console.error('KuCoin getKlines error:', error);
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
        `${this.baseUrl}/api/v1/funding-history/${symbol}`,
        { next: { revalidate: 60 } }
      );

      const data = await response.json();
      
      if (data.code !== '200000' || !data.data?.length) {
        return { rate: 0, nextFundingTime: 0 };
      }

      const funding = data.data[0];
      return {
        rate: parseFloat(funding.fundingRate || '0'),
        nextFundingTime: parseInt(funding.timepoint || '0'),
      };
    } catch (error) {
      console.error('KuCoin getFundingRate error:', error);
      return { rate: 0, nextFundingTime: 0 };
    }
  }

  async getOpenInterest(symbol: string): Promise<{ value: number; change24h: number }> {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/v1/open-interest?symbol=${symbol}`,
        { next: { revalidate: 60 } }
      );

      const data = await response.json();
      
      if (data.code !== '200000' || !data.data) {
        return { value: 0, change24h: 0 };
      }

      return {
        value: parseFloat(data.data.openInterest || '0'),
        change24h: parseFloat(data.data.changeRateOfDay || '0'),
      };
    } catch (error) {
      console.error('KuCoin getOpenInterest error:', error);
      return { value: 0, change24h: 0 };
    }
  }
}
