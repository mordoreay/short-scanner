import { Candle, Ticker, ExchangeAPI, OrderBookIndicator, LiquidationHeatmapIndicator, LiquidationLevel } from '@/types/scanner';

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

  async getFundingRateHistory(symbol: string, limit: number = 8): Promise<number[]> {
    try {
      const okxSymbol = symbol.includes('-') ? symbol : `${symbol.replace('USDT', '')}-USDT-SWAP`;
      
      const response = await this.fetchWithTimeout(
        `${this.baseUrl}/api/v5/public/funding-rate-history?instId=${okxSymbol}&limit=${limit}`
      );

      const data = await response.json();
      
      if (data.code !== '0' || !data.data?.length) {
        return [];
      }

      return data.data.map((item: { fundingRate: string }) => parseFloat(item.fundingRate));
    } catch (error) {
      console.error('OKX getFundingRateHistory error:', error instanceof Error ? error.message : error);
      return [];
    }
  }

  async getLongShortRatio(symbol: string): Promise<{ longRatio: number; shortRatio: number; ratio: number }> {
    try {
      const okxSymbol = symbol.includes('-') ? symbol : `${symbol.replace('USDT', '')}-USDT-SWAP`;
      
      // OKX provides long/short ratio via /api/v5/rubik/stat/contracts/long-short-account-ratio
      const response = await this.fetchWithTimeout(
        `${this.baseUrl}/api/v5/rubik/stat/contracts/long-short-account-ratio?instId=${okxSymbol}&period=5m`
      );

      const data = await response.json();
      
      if (data.code !== '0' || !data.data?.length) {
        return { longRatio: 50, shortRatio: 50, ratio: 1 };
      }

      // OKX returns [timestamp, longRatio, shortRatio]
      const latest = data.data[data.data.length - 1];
      const longRatio = parseFloat(latest[1] || '0.5') * 100;
      const shortRatio = parseFloat(latest[2] || '0.5') * 100;
      const ratio = shortRatio > 0 ? longRatio / shortRatio : 1;

      return { longRatio, shortRatio, ratio };
    } catch (error) {
      console.error('OKX getLongShortRatio error:', error instanceof Error ? error.message : error);
      return { longRatio: 50, shortRatio: 50, ratio: 1 };
    }
  }

  async getTopTradersRatio(symbol: string): Promise<{ longRatio: number; shortRatio: number; ratio: number }> {
    try {
      const okxSymbol = symbol.includes('-') ? symbol : `${symbol.replace('USDT', '')}-USDT-SWAP`;
      
      // OKX provides top trader ratio via /api/v5/rubik/stat/contracts/long-short-account-ratio-contract-top-trader
      const response = await this.fetchWithTimeout(
        `${this.baseUrl}/api/v5/rubik/stat/contracts/long-short-account-ratio-contract-top-trader?instId=${okxSymbol}&period=5m`
      );

      const data = await response.json();
      
      if (data.code !== '0' || !data.data?.length) {
        return { longRatio: 50, shortRatio: 50, ratio: 1 };
      }

      // OKX returns [timestamp, longRatio, shortRatio]
      const latest = data.data[data.data.length - 1];
      const longRatio = parseFloat(latest[1] || '0.5') * 100;
      const shortRatio = parseFloat(latest[2] || '0.5') * 100;
      const ratio = shortRatio > 0 ? longRatio / shortRatio : 1;

      return { longRatio, shortRatio, ratio };
    } catch (error) {
      console.error('OKX getTopTradersRatio error:', error instanceof Error ? error.message : error);
      return { longRatio: 50, shortRatio: 50, ratio: 1 };
    }
  }

  /**
   * Get Order Book for Imbalance Analysis
   */
  async getOrderBook(symbol: string, currentPrice: number): Promise<OrderBookIndicator> {
    const defaultResult: OrderBookIndicator = {
      bidVolume: 0,
      askVolume: 0,
      imbalance: 0,
      imbalancePercent: 0,
      bidWall: null,
      askWall: null,
      bidWallVolume: 0,
      askWallVolume: 0,
      spread: 0,
      depth: 0,
      signal: 'neutral',
      score: 0,
    };

    try {
      const okxSymbol = symbol.includes('-') ? symbol : `${symbol.replace('USDT', '')}-USDT-SWAP`;

      const response = await this.fetchWithTimeout(
        `${this.baseUrl}/api/v5/market/books?instId=${okxSymbol}&sz=50`
      );

      const data = await response.json();

      if (data.code !== '0' || !data.data?.length) {
        return defaultResult;
      }

      const book = data.data[0];
      const bids = book.bids.map((b: string[]) => ({ price: parseFloat(b[0]), volume: parseFloat(b[1]) }));
      const asks = book.asks.map((a: string[]) => ({ price: parseFloat(a[0]), volume: parseFloat(a[1]) }));

      if (bids.length === 0 || asks.length === 0) {
        return defaultResult;
      }

      const bidVolume = bids.slice(0, 20).reduce((sum: number, b: { volume: number }) => sum + b.volume, 0);
      const askVolume = asks.slice(0, 20).reduce((sum: number, a: { volume: number }) => sum + a.volume, 0);

      const totalVolume = bidVolume + askVolume;
      const imbalance = totalVolume > 0 ? (bidVolume - askVolume) / totalVolume : 0;
      const imbalancePercent = imbalance * 100;

      const bestBid = bids[0].price;
      const bestAsk = asks[0].price;
      const spread = bestBid > 0 ? ((bestAsk - bestBid) / bestBid) * 100 : 0;

      const avgBidVolume = bidVolume / 20;
      const avgAskVolume = askVolume / 20;

      const bidWall = bids.slice(0, 20).find((b: { volume: number }) => b.volume > avgBidVolume * 5);
      const askWall = asks.slice(0, 20).find((a: { volume: number }) => a.volume > avgAskVolume * 5);

      const bidDepth = bids.slice(0, 20).reduce((sum: number, b: { price: number; volume: number }) => sum + (b.price * b.volume), 0);
      const askDepth = asks.slice(0, 20).reduce((sum: number, a: { price: number; volume: number }) => sum + (a.price * a.volume), 0);

      let signal: 'bullish' | 'bearish' | 'neutral' = 'neutral';
      let score = 0;

      if (imbalance < -0.2) {
        signal = 'bearish';
        score = Math.min(Math.abs(imbalancePercent) / 10, 10);
      } else if (imbalance > 0.2) {
        signal = 'bullish';
      }

      if (askWall && askWall.price < currentPrice * 1.02) {
        score = Math.min(score + 3, 10);
      }

      return {
        bidVolume,
        askVolume,
        imbalance: Math.round(imbalance * 1000) / 1000,
        imbalancePercent: Math.round(imbalancePercent * 10) / 10,
        bidWall: bidWall?.price || null,
        askWall: askWall?.price || null,
        bidWallVolume: bidWall?.volume || 0,
        askWallVolume: askWall?.volume || 0,
        spread: Math.round(spread * 10000) / 10000,
        depth: Math.round(bidDepth + askDepth),
        signal,
        score: Math.round(score),
      };
    } catch (error) {
      console.error('OKX getOrderBook error:', error instanceof Error ? error.message : error);
      return defaultResult;
    }
  }

  /**
   * Get Liquidation Heatmap - OKX provides liquidation data
   */
  async getLiquidationHeatmap(symbol: string, currentPrice: number): Promise<LiquidationHeatmapIndicator> {
    const defaultResult: LiquidationHeatmapIndicator = {
      levels: [],
      totalLongLiquidations: 0,
      totalShortLiquidations: 0,
      nearestLongLiq: null,
      nearestShortLiq: null,
      longLiqDistance: 0,
      shortLiqDistance: 0,
      signal: 'neutral',
      score: 0,
    };

    try {
      const okxSymbol = symbol.includes('-') ? symbol : `${symbol.replace('USDT', '')}-USDT-SWAP`;

      // OKX liquidation orders endpoint
      const response = await this.fetchWithTimeout(
        `${this.baseUrl}/api/v5/public/liquidation-orders?instId=${okxSymbol}&instType=SWAP&limit=100`
      );

      const data = await response.json();

      const levels: LiquidationLevel[] = [];

      if (data.code === '0' && data.data?.details?.length) {
        const liqMap = new Map<number, { long: number; short: number }>();

        for (const liq of data.data.details) {
          const price = parseFloat(liq.bkPx);
          const size = parseFloat(liq.bkLoss);
          const side = liq.side; // 'buy' = short liquidation, 'sell' = long liquidation

          const priceLevel = Math.round(price / (currentPrice * 0.005)) * (currentPrice * 0.005);

          const existing = liqMap.get(priceLevel) || { long: 0, short: 0 };
          if (side === 'sell') {
            existing.long += size;
          } else {
            existing.short += size;
          }
          liqMap.set(priceLevel, existing);
        }

        liqMap.forEach((value, price) => {
          levels.push({
            price,
            longLiquidations: value.long,
            shortLiquidations: value.short,
            totalLiquidations: value.long + value.short,
          });
        });

        levels.sort((a, b) => a.price - b.price);
      }

      const totalLongLiquidations = levels
        .filter(l => l.price < currentPrice)
        .reduce((sum, l) => sum + l.longLiquidations, 0);

      const totalShortLiquidations = levels
        .filter(l => l.price > currentPrice)
        .reduce((sum, l) => sum + l.shortLiquidations, 0);

      const longLiqLevels = levels.filter(l => l.price < currentPrice && l.longLiquidations > 0);
      const shortLiqLevels = levels.filter(l => l.price > currentPrice && l.shortLiquidations > 0);

      const nearestLongLiq = longLiqLevels.length > 0 ? longLiqLevels[longLiqLevels.length - 1].price : null;
      const nearestShortLiq = shortLiqLevels.length > 0 ? shortLiqLevels[0].price : null;

      const longLiqDistance = nearestLongLiq ? ((currentPrice - nearestLongLiq) / currentPrice) * 100 : 0;
      const shortLiqDistance = nearestShortLiq ? ((nearestShortLiq - currentPrice) / currentPrice) * 100 : 0;

      let signal: 'bullish' | 'bearish' | 'neutral' = 'neutral';
      let score = 0;

      if (totalLongLiquidations > totalShortLiquidations * 1.5) {
        signal = 'bearish';
        score = Math.min(totalLongLiquidations / 100000, 10);
      } else if (totalShortLiquidations > totalLongLiquidations * 1.5) {
        signal = 'bullish';
      }

      if (nearestLongLiq && longLiqDistance < 3) {
        score = Math.min(score + 3, 10);
      }

      return {
        levels: levels.slice(0, 20),
        totalLongLiquidations: Math.round(totalLongLiquidations),
        totalShortLiquidations: Math.round(totalShortLiquidations),
        nearestLongLiq,
        nearestShortLiq,
        longLiqDistance: Math.round(longLiqDistance * 100) / 100,
        shortLiqDistance: Math.round(shortLiqDistance * 100) / 100,
        signal,
        score: Math.round(score),
      };
    } catch (error) {
      console.error('OKX getLiquidationHeatmap error:', error instanceof Error ? error.message : error);
      return defaultResult;
    }
  }
}
