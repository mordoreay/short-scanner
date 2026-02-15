import { Candle, Ticker, ExchangeAPI } from '@/types/scanner';

/**
 * OKX Exchange API - PERPETUAL (USDT-Swap Futures)
 * Documentation: https://www.okx.com/docs-v5/en/
 */
export class OKXAPI implements ExchangeAPI {
  name = 'okx';
  private baseUrl = 'https://www.okx.com';

  async getTickers(): Promise<Ticker[]> {
    try {
      // USDT-SWAP = USDT-margined perpetual futures
      const response = await fetch(`${this.baseUrl}/api/v5/public/tickers?instType=SWAP`, {
        next: { revalidate: 60 },
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) {
        throw new Error(`OKX API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.code !== '0') {
        throw new Error(`OKX API error: ${data.msg}`);
      }

      return data.data
        .filter((item: { instId: string; settleCcy?: string }) => 
          item.instId.endsWith('-USDT-SWAP') || 
          (item.settleCcy === 'USDT' && item.instId.includes('USDT'))
        )
        .map((item: {
          instId: string;
          last: string;
          changeUtc24h?: string;
          change24h: string;
          vol24h: string;
          high24h: string;
          low24h: string;
          volCcy24h: string;
          fundingRate?: string;
          openInterest?: string;
          markPx?: string;
          idxPx?: string;
        }) => {
          // Extract coin name from instId (BTC-USDT-SWAP -> BTC)
          const name = item.instId.replace('-USDT-SWAP', '').split('-')[0];
          
          return {
            symbol: item.instId,
            name,
            currentPrice: parseFloat(item.last),
            priceChange24h: parseFloat(item.change24h) * 100,
            volume: parseFloat(item.vol24h),
            high24h: parseFloat(item.high24h),
            low24h: parseFloat(item.low24h),
            quoteVolume: parseFloat(item.volCcy24h),
            // Perpetual specific
            fundingRate: item.fundingRate ? parseFloat(item.fundingRate) : undefined,
            openInterest: item.openInterest ? parseFloat(item.openInterest) : undefined,
            markPrice: item.markPx ? parseFloat(item.markPx) : undefined,
            indexPrice: item.idxPx ? parseFloat(item.idxPx) : undefined,
          };
        });
    } catch (error) {
      console.error('OKX getTickers error:', error);
      return [];
    }
  }

  async getKlines(symbol: string, interval: string, limit: number = 300): Promise<Candle[]> {
    try {
      // Convert symbol format if needed (BTCUSDT -> BTC-USDT-SWAP)
      const okxSymbol = symbol.includes('-') ? symbol : `${symbol.replace('USDT', '')}-USDT-SWAP`;
      
      const intervalMap: Record<string, string> = {
        '15m': '15m',
        '1h': '1H',
        '4h': '4H',
        '1d': '1D',
      };

      const okxInterval = intervalMap[interval] || '4H';
      
      const response = await fetch(
        `${this.baseUrl}/api/v5/market/candles?instId=${okxSymbol}&bar=${okxInterval}&limit=${limit}`,
        { next: { revalidate: 30 } }
      );

      if (!response.ok) {
        throw new Error(`OKX klines error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.code !== '0') {
        throw new Error(`OKX klines error: ${data.msg}`);
      }

      // OKX returns candles in reverse order (newest first)
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
      console.error('OKX getKlines error:', error);
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
      
      const response = await fetch(
        `${this.baseUrl}/api/v5/public/funding-rate?instId=${okxSymbol}`,
        { next: { revalidate: 60 } }
      );

      const data = await response.json();
      
      if (data.code !== '0' || !data.data?.length) {
        return { rate: 0, nextFundingTime: 0 };
      }

      const funding = data.data[0];
      return {
        rate: parseFloat(funding.fundingRate),
        nextFundingTime: parseInt(funding.nextFundingRateTime),
      };
    } catch (error) {
      console.error('OKX getFundingRate error:', error);
      return { rate: 0, nextFundingTime: 0 };
    }
  }

  async getOpenInterest(symbol: string): Promise<{ value: number; change24h: number }> {
    try {
      const okxSymbol = symbol.includes('-') ? symbol : `${symbol.replace('USDT', '')}-USDT-SWAP`;
      
      const response = await fetch(
        `${this.baseUrl}/api/v5/public/open-interest?instId=${okxSymbol}`,
        { next: { revalidate: 60 } }
      );

      const data = await response.json();
      
      if (data.code !== '0' || !data.data?.length) {
        return { value: 0, change24h: 0 };
      }

      const oi = data.data[0];
      return {
        value: parseFloat(oi.oi) * parseFloat(oi.oiCcy || '1'),
        change24h: parseFloat(oi.oi24h || '0'),
      };
    } catch (error) {
      console.error('OKX getOpenInterest error:', error);
      return { value: 0, change24h: 0 };
    }
  }
}
