import { Candle, Ticker, ExchangeAPI } from '@/types/scanner';

/**
 * Binance Exchange API - PERPETUAL (USDT-M Futures)
 * Documentation: https://binance-docs.github.io/apidocs/futures/en/
 */
export class BinanceAPI implements ExchangeAPI {
  name = 'binance';
  private baseUrl = 'https://fapi.binance.com'; // Futures API endpoint

  async getTickers(): Promise<Ticker[]> {
    try {
      // Get 24hr ticker for all symbols
      const response = await fetch(`${this.baseUrl}/fapi/v1/ticker/24hr`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; SHORTScanner/2.1)',
        },
        next: { revalidate: 60 }
      });
      
      if (!response.ok) {
        throw new Error(`Binance API error: ${response.status}`);
      }

      const data = await response.json();
      
      return data
        .filter((item: { symbol: string }) => 
          // Filter for USDT perpetuals (symbol ends with USDT, no hyphen)
          item.symbol.endsWith('USDT') && 
          !item.symbol.includes('_')
        )
        .map((item: {
          symbol: string;
          lastPrice: string;
          priceChangePercent: string;
          volume: string;
          highPrice: string;
          lowPrice: string;
          quoteVolume: string;
          lastFundingRate?: string;
          openInterest?: string;
          markPrice?: string;
          indexPrice?: string;
        }) => ({
          symbol: item.symbol,
          name: item.symbol.replace('USDT', ''),
          currentPrice: parseFloat(item.lastPrice),
          priceChange24h: parseFloat(item.priceChangePercent),
          volume: parseFloat(item.volume),
          high24h: parseFloat(item.highPrice),
          low24h: parseFloat(item.lowPrice),
          quoteVolume: parseFloat(item.quoteVolume),
          // Perpetual specific
          fundingRate: item.lastFundingRate ? parseFloat(item.lastFundingRate) : undefined,
          openInterest: item.openInterest ? parseFloat(item.openInterest) : undefined,
          markPrice: item.markPrice ? parseFloat(item.markPrice) : undefined,
          indexPrice: item.indexPrice ? parseFloat(item.indexPrice) : undefined,
        }));
    } catch (error) {
      console.error('Binance getTickers error:', error);
      return [];
    }
  }

  async getKlines(symbol: string, interval: string, limit: number = 300): Promise<Candle[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/fapi/v1/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`,
        {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; SHORTScanner/2.1)',
          },
          next: { revalidate: 30 }
        }
      );

      if (!response.ok) {
        throw new Error(`Binance klines error: ${response.status}`);
      }

      const data = await response.json();
      
      return data.map((item: (string | number)[]) => ({
        timestamp: item[0] as number,
        open: parseFloat(item[1] as string),
        high: parseFloat(item[2] as string),
        low: parseFloat(item[3] as string),
        close: parseFloat(item[4] as string),
        volume: parseFloat(item[5] as string),
      }));
    } catch (error) {
      console.error('Binance getKlines error:', error);
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
        `${this.baseUrl}/fapi/v1/fundingRate?symbol=${symbol}&limit=1`,
        {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; SHORTScanner/2.1)',
          },
          next: { revalidate: 60 }
        }
      );

      const data = await response.json();
      
      if (!Array.isArray(data) || data.length === 0) {
        return { rate: 0, nextFundingTime: 0 };
      }

      const funding = data[0];
      return {
        rate: parseFloat(funding.fundingRate),
        nextFundingTime: parseInt(funding.fundingTime),
      };
    } catch (error) {
      console.error('Binance getFundingRate error:', error);
      return { rate: 0, nextFundingTime: 0 };
    }
  }

  async getOpenInterest(symbol: string): Promise<{ value: number; change24h: number }> {
    try {
      // Get current open interest
      const response = await fetch(
        `${this.baseUrl}/fapi/v1/openInterest?symbol=${symbol}`,
        {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; SHORTScanner/2.1)',
          },
          next: { revalidate: 60 }
        }
      );

      const data = await response.json();
      const currentOI = parseFloat(data.openInterest || '0');
      
      // For change calculation, we'd need historical data
      // Binance provides this via /fapi/v1/openInterestHist
      // For simplicity, returning current value with 0 change
      return {
        value: currentOI,
        change24h: 0,
      };
    } catch (error) {
      console.error('Binance getOpenInterest error:', error);
      return { value: 0, change24h: 0 };
    }
  }
}
