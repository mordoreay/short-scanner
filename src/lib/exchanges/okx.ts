import { Candle, Ticker, ExchangeAPI } from '@/types/scanner';

/**
 * OKX Exchange API - PERPETUAL (USDT-Swap Futures)
 * Documentation: https://www.okx.com/docs-v5/en/
 * 
 * Endpoints:
 * - Tickers: GET /api/v5/market/tickers?instType=SWAP
 * - Candles: GET /api/v5/market/candles?instId={symbol}&bar={interval}&limit={limit}
 * - Funding Rate: GET /api/v5/public/funding-rate?instId={symbol}
 * - Open Interest: GET /api/v5/public/open-interest?instId={symbol}
 */
export class OKXAPI implements ExchangeAPI {
  name = 'okx';
  private baseUrl = 'https://www.okx.com';
  private requestTimeout = 15000; // 15 seconds

  private async fetchWithTimeout(url: string): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.requestTimeout);
    
    try {
      const response = await fetch(url, {
        next: { revalidate: 60 },
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
        }
      });
      return response;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  async getTickers(): Promise<Ticker[]> {
    try {
      // Correct endpoint: /api/v5/market/tickers (not /api/v5/public/tickers)
      const response = await this.fetchWithTimeout(
        `${this.baseUrl}/api/v5/market/tickers?instType=SWAP`
      );
      
      if (!response.ok) {
        console.error(`OKX API error: ${response.status}`);
        return [];
      }

      const data = await response.json();
      
      if (data.code !== '0') {
        console.error(`OKX API error: ${data.msg}`);
        return [];
      }

      if (!Array.isArray(data.data)) {
        console.error('OKX API: Invalid data format');
        return [];
      }

      return data.data
        .filter((item: { instId: string; instType: string }) => {
          // Filter only USDT-SWAP (USDT-margined perpetuals)
          return item.instId.endsWith('-USDT-SWAP');
        })
        .map((item: {
          instId: string;
          instType: string;
          last: string;
          open24h: string;
          high24h: string;
          low24h: string;
          vol24h: string;
          volCcy24h: string;
          ts: string;
          sodUtc0?: string;
          sodUtc8?: string;
        }) => {
          // Extract coin name from instId (BTC-USDT-SWAP -> BTC)
          const name = item.instId.replace('-USDT-SWAP', '');
          
          // Calculate 24h change percentage
          const last = parseFloat(item.last);
          const open24h = parseFloat(item.open24h);
          const priceChange24h = open24h > 0 ? ((last - open24h) / open24h) * 100 : 0;
          
          return {
            symbol: item.instId,
            name,
            currentPrice: last,
            priceChange24h: priceChange24h,
            volume: parseFloat(item.vol24h),
            high24h: parseFloat(item.high24h),
            low24h: parseFloat(item.low24h),
            quoteVolume: parseFloat(item.volCcy24h),
          };
        });
    } catch (error) {
      console.error('OKX getTickers error:', error instanceof Error ? error.message : error);
      return [];
    }
  }

  async getKlines(symbol: string, interval: string, limit: number = 300): Promise<Candle[]> {
    try {
      // Ensure symbol is in OKX format (BTC-USDT-SWAP)
      const okxSymbol = symbol.includes('-') ? symbol : `${symbol.replace('USDT', '')}-USDT-SWAP`;
      
      // OKX interval format
      const intervalMap: Record<string, string> = {
        '15m': '15m',
        '1h': '1H',
        '4h': '4H',
        '1d': '1Dutc',
      };

      const okxInterval = intervalMap[interval] || '4H';
      
      const response = await this.fetchWithTimeout(
        `${this.baseUrl}/api/v5/market/candles?instId=${okxSymbol}&bar=${okxInterval}&limit=${limit}`
      );

      if (!response.ok) {
        console.error(`OKX klines error: ${response.status}`);
        return [];
      }

      const data = await response.json();
      
      if (data.code !== '0') {
        console.error(`OKX klines error: ${data.msg}`);
        return [];
      }

      if (!Array.isArray(data.data)) {
        return [];
      }

      // OKX returns candles in reverse order (newest first)
      // Format: [ts, o, h, l, c, vol, volCcy, volCcyQuote, confirm]
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
      console.error('OKX getKlines error:', error instanceof Error ? error.message : error);
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
      const okxSymbol = symbol.includes('-') ? symbol : `${symbol.replace('USDT', '')}-USDT-SWAP`;
      
      const response = await this.fetchWithTimeout(
        `${this.baseUrl}/api/v5/public/funding-rate?instId=${okxSymbol}`
      );

      const data = await response.json();
      
      if (data.code !== '0' || !data.data?.length) {
        return { rate: 0, nextFundingTime: 0 };
      }

      const funding = data.data[0];
      return {
        rate: parseFloat(funding.fundingRate || '0'),
        nextFundingTime: parseInt(funding.nextFundingRateTime || '0'),
      };
    } catch (error) {
      console.error('OKX getFundingRate error:', error instanceof Error ? error.message : error);
      return { rate: 0, nextFundingTime: 0 };
    }
  }

  async getOpenInterest(symbol: string): Promise<{ value: number; change24h: number }> {
    try {
      const okxSymbol = symbol.includes('-') ? symbol : `${symbol.replace('USDT', '')}-USDT-SWAP`;
      
      const response = await this.fetchWithTimeout(
        `${this.baseUrl}/api/v5/public/open-interest?instId=${okxSymbol}`
      );

      const data = await response.json();
      
      if (data.code !== '0' || !data.data?.length) {
        return { value: 0, change24h: 0 };
      }

      const oi = data.data[0];
      return {
        value: parseFloat(oi.oi || '0'),
        change24h: parseFloat(oi.oi24h || '0'),
      };
    } catch (error) {
      console.error('OKX getOpenInterest error:', error instanceof Error ? error.message : error);
      return { value: 0, change24h: 0 };
    }
  }
}
