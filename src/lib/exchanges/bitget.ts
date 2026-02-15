import { Candle, Ticker, ExchangeAPI } from '@/types/scanner';

/**
 * Bitget Exchange API - PERPETUAL (USDT-Futures)
 * Documentation: https://www.bitget.com/api-doc/contract/market/Get-All-Symbol-Ticker
 * 
 * Endpoints:
 * - Tickers: GET /api/v2/mix/market/tickers?productType=USDT-FUTURES
 * - Candles: GET /api/v2/mix/market/candles?productType=USDT-FUTURES&symbol={symbol}&interval={interval}
 * - Funding Rate: GET /api/v2/mix/market/current-funding-rate?productType=USDT-FUTURES&symbol={symbol}
 * - Open Interest: GET /api/v2/mix/market/open-interest?productType=USDT-FUTURES&symbol={symbol}
 * 
 * Note: Bitget API may have rate limits (20 req/s per IP)
 */
export class BitgetAPI implements ExchangeAPI {
  name = 'bitget';
  private baseUrl = 'https://api.bitget.com';
  private requestTimeout = 15000; // 15 seconds
  
  // Cache for tickers to avoid repeated calls
  private tickersCache: Ticker[] = [];
  private tickersCacheTime: number = 0;
  private cacheDuration: number = 60000; // 1 minute cache

  private async fetchWithTimeout(url: string): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.requestTimeout);
    
    try {
      const response = await fetch(url, {
        next: { revalidate: 60 },
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        }
      });
      return response;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  async getTickers(): Promise<Ticker[]> {
    // Return cached data if still valid
    if (this.tickersCache.length > 0 && Date.now() - this.tickersCacheTime < this.cacheDuration) {
      return this.tickersCache;
    }

    try {
      const response = await this.fetchWithTimeout(
        `${this.baseUrl}/api/v2/mix/market/tickers?productType=USDT-FUTURES`
      );
      
      if (!response.ok) {
        console.error(`Bitget API error: ${response.status}`);
        return this.tickersCache; // Return cached data on error
      }

      const data = await response.json();
      
      if (data.code !== '00000') {
        console.error(`Bitget API error: ${data.msg}`);
        return this.tickersCache;
      }

      if (!Array.isArray(data.data)) {
        console.error('Bitget API: Invalid data format');
        return this.tickersCache;
      }

      const tickers = data.data
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
          holdingAmount?: string;
          indexPrice?: string;
        }) => {
          // Bitget change24h is already a decimal (0.05 = 5%)
          const changePercent = parseFloat(item.change24h) * 100;
          
          return {
            symbol: item.symbol,
            name: item.symbol.replace('USDT', ''),
            currentPrice: parseFloat(item.lastPr),
            priceChange24h: changePercent,
            volume: parseFloat(item.baseVolume),
            high24h: parseFloat(item.high24h),
            low24h: parseFloat(item.low24h),
            quoteVolume: parseFloat(item.quoteVolume),
          };
        });

      // Update cache
      this.tickersCache = tickers;
      this.tickersCacheTime = Date.now();
      
      return tickers;
    } catch (error) {
      console.error('Bitget getTickers error:', error instanceof Error ? error.message : error);
      return this.tickersCache; // Return cached data on error
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
      
      const response = await this.fetchWithTimeout(
        `${this.baseUrl}/api/v2/mix/market/candles?productType=USDT-FUTURES&symbol=${symbol}&interval=${bitgetInterval}&limit=${limit}`
      );

      if (!response.ok) {
        console.error(`Bitget klines error: ${response.status}`);
        return [];
      }

      const data = await response.json();
      
      if (data.code !== '00000') {
        console.error(`Bitget klines error: ${data.msg}`);
        return [];
      }

      if (!Array.isArray(data.data)) {
        return [];
      }

      // Bitget format: [ts, open, high, low, close, volume, quoteVolume]
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
      console.error('Bitget getKlines error:', error instanceof Error ? error.message : error);
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
      const response = await this.fetchWithTimeout(
        `${this.baseUrl}/api/v2/mix/market/current-funding-rate?productType=USDT-FUTURES&symbol=${symbol}`
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
      console.error('Bitget getFundingRate error:', error instanceof Error ? error.message : error);
      return { rate: 0, nextFundingTime: 0 };
    }
  }

  async getOpenInterest(symbol: string): Promise<{ value: number; change24h: number }> {
    try {
      const response = await this.fetchWithTimeout(
        `${this.baseUrl}/api/v2/mix/market/open-interest?productType=USDT-FUTURES&symbol=${symbol}`
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
      console.error('Bitget getOpenInterest error:', error instanceof Error ? error.message : error);
      return { value: 0, change24h: 0 };
    }
  }
}
