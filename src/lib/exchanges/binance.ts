import { Candle, Ticker, ExchangeAPI, OrderBookIndicator, LiquidationHeatmapIndicator, LiquidationLevel } from '@/types/scanner';

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

  async getFundingRateHistory(symbol: string, limit: number = 8): Promise<number[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/fapi/v1/fundingRate?symbol=${symbol}&limit=${limit}`,
        {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; SHORTScanner/2.1)',
          },
          next: { revalidate: 60 }
        }
      );

      const data = await response.json();
      
      if (!Array.isArray(data)) {
        return [];
      }

      return data.map((item: { fundingRate: string }) => parseFloat(item.fundingRate));
    } catch (error) {
      console.error('Binance getFundingRateHistory error:', error);
      return [];
    }
  }

  async getLongShortRatio(symbol: string): Promise<{ longRatio: number; shortRatio: number; ratio: number }> {
    try {
      // Binance provides this via /futures/data/topLongShortPositionRatio
      const response = await fetch(
        `${this.baseUrl}/futures/data/topLongShortPositionRatio?symbol=${symbol}&period=5m&limit=1`,
        {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; SHORTScanner/2.1)',
          },
          next: { revalidate: 60 }
        }
      );

      const data = await response.json();
      
      if (!Array.isArray(data) || data.length === 0) {
        return { longRatio: 50, shortRatio: 50, ratio: 1 };
      }

      const ratio = parseFloat(data[0].longShortRatio || '1');
      const longRatio = (ratio / (1 + ratio)) * 100;
      const shortRatio = 100 - longRatio;

      return { longRatio, shortRatio, ratio };
    } catch (error) {
      console.error('Binance getLongShortRatio error:', error);
      return { longRatio: 50, shortRatio: 50, ratio: 1 };
    }
  }

  async getTopTradersRatio(symbol: string): Promise<{ longRatio: number; shortRatio: number; ratio: number }> {
    try {
      // Binance provides top trader ratio via /futures/data/topLongShortAccountRatio
      const response = await fetch(
        `${this.baseUrl}/futures/data/topLongShortAccountRatio?symbol=${symbol}&period=5m&limit=1`,
        {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; SHORTScanner/2.1)',
          },
          next: { revalidate: 60 }
        }
      );

      const data = await response.json();
      
      if (!Array.isArray(data) || data.length === 0) {
        return { longRatio: 50, shortRatio: 50, ratio: 1 };
      }

      const ratio = parseFloat(data[0].longShortRatio || '1');
      const longRatio = (ratio / (1 + ratio)) * 100;
      const shortRatio = 100 - longRatio;

      return { longRatio, shortRatio, ratio };
    } catch (error) {
      console.error('Binance getTopTradersRatio error:', error);
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
      const response = await fetch(
        `${this.baseUrl}/fapi/v1/depth?symbol=${symbol}&limit=100`,
        {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; SHORTScanner/3.0)',
          },
          next: { revalidate: 5 }
        }
      );

      const data = await response.json();

      if (!data.bids || !data.asks) {
        return defaultResult;
      }

      const bids = data.bids.map((b: string[]) => ({ price: parseFloat(b[0]), volume: parseFloat(b[1]) }));
      const asks = data.asks.map((a: string[]) => ({ price: parseFloat(a[0]), volume: parseFloat(a[1]) }));

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
      console.error('Binance getOrderBook error:', error);
      return defaultResult;
    }
  }

  /**
   * Get Liquidation Heatmap - Binance provides liquidation orders
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
      // Binance public liquidation endpoint
      const response = await fetch(
        `${this.baseUrl}/fapi/v1/allForceOrders?symbol=${symbol}&limit=100`,
        {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; SHORTScanner/3.0)',
          },
          next: { revalidate: 30 }
        }
      );

      const data = await response.json();

      const levels: LiquidationLevel[] = [];

      if (Array.isArray(data) && data.length > 0) {
        const liqMap = new Map<number, { long: number; short: number }>();

        for (const liq of data) {
          const price = parseFloat(liq.price);
          const size = parseFloat(liq.origQty);
          const side = liq.side; // 'BUY' = short liquidation, 'SELL' = long liquidation

          const priceLevel = Math.round(price / (currentPrice * 0.005)) * (currentPrice * 0.005);

          const existing = liqMap.get(priceLevel) || { long: 0, short: 0 };
          if (side === 'SELL') {
            existing.long += size * price;
          } else {
            existing.short += size * price;
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
      console.error('Binance getLiquidationHeatmap error:', error);
      return defaultResult;
    }
  }
}
