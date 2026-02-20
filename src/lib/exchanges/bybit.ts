import { Candle, Ticker, ExchangeAPI, OrderBookIndicator, LiquidationHeatmapIndicator, LiquidationLevel } from '@/types/scanner';

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
        next: { revalidate: 60 },
        headers: {
          'Accept': 'application/json',
        }
      });
      
      if (!response.ok) {
        console.error(`Bybit API error: ${response.status}`);
        return [];
      }

      const data = await response.json();
      
      if (data.retCode !== 0) {
        console.error(`Bybit API error: ${data.retMsg}`);
        return [];
      }

      if (!data.result?.list || !Array.isArray(data.result.list)) {
        console.error('Bybit API: no tickers data');
        return [];
      }

      const tickers = data.result.list
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

      console.log(`Bybit: got ${tickers.length} tickers`);
      return tickers;
    } catch (error) {
      console.error('Bybit getTickers error:', error instanceof Error ? error.message : error);
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
      const url = `${this.baseUrl}/v5/market/kline?category=linear&symbol=${symbol}&interval=${bybitInterval}&limit=${limit}`;
      
      // Use linear category for perpetual
      const response = await fetch(url, {
        next: { revalidate: 30 },
        headers: {
          'Accept': 'application/json',
        }
      });

      if (!response.ok) {
        console.error(`Bybit klines error: ${response.status} for ${symbol}`);
        return [];
      }

      const data = await response.json();
      
      if (data.retCode !== 0) {
        console.error(`Bybit klines error: ${data.retMsg} for ${symbol}`);
        return [];
      }

      if (!data.result?.list || !Array.isArray(data.result.list)) {
        console.error(`Bybit klines: no data for ${symbol}`);
        return [];
      }

      const candles = data.result.list
        .map((item: string[]) => ({
          timestamp: parseInt(item[0]),
          open: parseFloat(item[1]),
          high: parseFloat(item[2]),
          low: parseFloat(item[3]),
          close: parseFloat(item[4]),
          volume: parseFloat(item[5]),
        }))
        .reverse();
      
      console.log(`Bybit ${symbol}: got ${candles.length} candles for ${interval}`);
      return candles;
    } catch (error) {
      console.error('Bybit getKlines error:', error instanceof Error ? error.message : error);
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

  async getFundingRateHistory(symbol: string, limit: number = 8): Promise<number[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/v5/market/funding/history?category=linear&symbol=${symbol}&limit=${limit}`,
        { next: { revalidate: 60 } }
      );

      const data = await response.json();
      
      if (data.retCode !== 0 || !data.result.list?.length) {
        return [];
      }

      return data.result.list.map((item: { fundingRate: string }) => parseFloat(item.fundingRate));
    } catch (error) {
      console.error('Bybit getFundingRateHistory error:', error);
      return [];
    }
  }

  async getLongShortRatio(symbol: string): Promise<{ longRatio: number; shortRatio: number; ratio: number }> {
    try {
      // Bybit provides this via /v5/market/account-ratio with period parameter
      const response = await fetch(
        `${this.baseUrl}/v5/market/account-ratio?category=linear&symbol=${symbol}&period=1d`,
        {
          headers: {
            'Accept': 'application/json',
          },
          next: { revalidate: 60 }
        }
      );

      const data = await response.json();
      
      if (data.retCode !== 0 || !data.result?.list?.length) {
        return { longRatio: 50, shortRatio: 50, ratio: 1 };
      }

      // Latest entry has buyRatio (longs) and sellRatio (shorts)
      const latest = data.result.list[0];
      const longRatio = parseFloat(latest.buyRatio || '0.5') * 100;
      const shortRatio = parseFloat(latest.sellRatio || '0.5') * 100;
      const ratio = shortRatio > 0 ? longRatio / shortRatio : 1;

      return { longRatio, shortRatio, ratio };
    } catch (error) {
      console.error('Bybit getLongShortRatio error:', error);
      return { longRatio: 50, shortRatio: 50, ratio: 1 };
    }
  }

  async getTopTradersRatio(symbol: string): Promise<{ longRatio: number; shortRatio: number; ratio: number }> {
    try {
      // Bybit only supports period=1d, so we use 7-day average for "smart money" sentiment
      const response = await fetch(
        `${this.baseUrl}/v5/market/account-ratio?category=linear&symbol=${symbol}&period=1d`,
        {
          headers: {
            'Accept': 'application/json',
          },
          next: { revalidate: 60 }
        }
      );

      const data = await response.json();

      if (data.retCode !== 0 || !data.result?.list?.length) {
        return { longRatio: 50, shortRatio: 50, ratio: 1 };
      }

      // Average over last 7 days for longer-term "smart money" sentiment
      const entries = data.result.list.slice(0, 7);
      const avgLong = entries.reduce((sum: number, item: { buyRatio: string }) =>
        sum + parseFloat(item.buyRatio || '0.5'), 0) / entries.length;

      const longRatio = avgLong * 100;
      const shortRatio = 100 - longRatio;
      const ratio = shortRatio > 0 ? longRatio / shortRatio : 1;

      return { longRatio, shortRatio, ratio };
    } catch (error) {
      console.error('Bybit getTopTradersRatio error:', error);
      return { longRatio: 50, shortRatio: 50, ratio: 1 };
    }
  }

  /**
   * Get Order Book for Imbalance Analysis
   * Returns top 50 levels on each side
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
      // Get 50 levels deep order book
      const response = await fetch(
        `${this.baseUrl}/v5/market/orderbook?category=linear&symbol=${symbol}&limit=50`,
        {
          headers: { 'Accept': 'application/json' },
          next: { revalidate: 5 } // Very short cache for order book
        }
      );

      const data = await response.json();

      if (data.retCode !== 0 || !data.result?.b || !data.result?.a) {
        return defaultResult;
      }

      // Parse bids and asks (Bybit uses 'b' for bids and 'a' for asks)
      const bids = data.result.b.map((b: string[]) => ({ price: parseFloat(b[0]), volume: parseFloat(b[1]) }));
      const asks = data.result.a.map((a: string[]) => ({ price: parseFloat(a[0]), volume: parseFloat(a[1]) }));

      if (bids.length === 0 || asks.length === 0) {
        return defaultResult;
      }

      // Calculate total volumes (top 20 levels)
      const bidVolume = bids.slice(0, 20).reduce((sum: number, b: { volume: number }) => sum + b.volume, 0);
      const askVolume = asks.slice(0, 20).reduce((sum: number, a: { volume: number }) => sum + a.volume, 0);

      // Calculate imbalance
      const totalVolume = bidVolume + askVolume;
      const imbalance = totalVolume > 0 ? (bidVolume - askVolume) / totalVolume : 0;
      const imbalancePercent = imbalance * 100;

      // Calculate spread
      const bestBid = bids[0].price;
      const bestAsk = asks[0].price;
      const spread = bestBid > 0 ? ((bestAsk - bestBid) / bestBid) * 100 : 0;

      // Find walls (orders x5 larger than average)
      const avgBidVolume = bidVolume / 20;
      const avgAskVolume = askVolume / 20;

      const bidWall = bids.slice(0, 20).find((b: { volume: number }) => b.volume > avgBidVolume * 5);
      const askWall = asks.slice(0, 20).find((a: { volume: number }) => a.volume > avgAskVolume * 5);

      // Calculate depth (in USDT)
      const bidDepth = bids.slice(0, 20).reduce((sum: number, b: { price: number; volume: number }) => sum + (b.price * b.volume), 0);
      const askDepth = asks.slice(0, 20).reduce((sum: number, a: { price: number; volume: number }) => sum + (a.price * a.volume), 0);

      // Determine signal for SHORT
      // imbalance < -0.2 (ask dominance) = good for SHORT
      // askWall present near price = resistance
      let signal: 'bullish' | 'bearish' | 'neutral' = 'neutral';
      let score = 0;

      if (imbalance < -0.2) {
        signal = 'bearish';  // Sellers dominate = good for SHORT
        score = Math.min(Math.abs(imbalancePercent) / 10, 10);  // Max 10 points
      } else if (imbalance > 0.2) {
        signal = 'bullish';  // Buyers dominate = bad for SHORT
        score = 0;
      }

      // Bonus for ask wall near current price
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
      console.error('Bybit getOrderBook error:', error);
      return defaultResult;
    }
  }

  /**
   * Get Liquidation Heatmap Data
   * Uses estimated liquidation levels based on open interest and price
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
      // Bybit doesn't have a direct liquidation heatmap API
      // We estimate from open interest and recent liquidation data
      
      // Get recent liquidation orders (public data)
      const response = await fetch(
        `${this.baseUrl}/v5/market/liquidation?category=linear&symbol=${symbol}&limit=50`,
        {
          headers: { 'Accept': 'application/json' },
          next: { revalidate: 30 }
        }
      );

      const data = await response.json();

      const levels: LiquidationLevel[] = [];

      if (data.retCode === 0 && data.result?.list?.length) {
        // Group liquidations by price level
        const liqMap = new Map<number, { long: number; short: number }>();

        for (const liq of data.result.list) {
          const price = parseFloat(liq.price);
          const size = parseFloat(liq.size);
          const side = liq.side; // 'Buy' = short liquidation, 'Sell' = long liquidation

          // Round price to 0.5% buckets
          const priceLevel = Math.round(price / (currentPrice * 0.005)) * (currentPrice * 0.005);

          const existing = liqMap.get(priceLevel) || { long: 0, short: 0 };
          if (side === 'Sell') {
            existing.long += size * price; // Long liquidation
          } else {
            existing.short += size * price; // Short liquidation
          }
          liqMap.set(priceLevel, existing);
        }

        // Convert to levels array
        liqMap.forEach((value, price) => {
          levels.push({
            price,
            longLiquidations: value.long,
            shortLiquidations: value.short,
            totalLiquidations: value.long + value.short,
          });
        });

        // Sort by price
        levels.sort((a, b) => a.price - b.price);
      }

      // Calculate totals
      const totalLongLiquidations = levels
        .filter(l => l.price < currentPrice)
        .reduce((sum, l) => sum + l.longLiquidations, 0);

      const totalShortLiquidations = levels
        .filter(l => l.price > currentPrice)
        .reduce((sum, l) => sum + l.shortLiquidations, 0);

      // Find nearest significant liquidations
      const longLiqLevels = levels.filter(l => l.price < currentPrice && l.longLiquidations > 0);
      const shortLiqLevels = levels.filter(l => l.price > currentPrice && l.shortLiquidations > 0);

      const nearestLongLiq = longLiqLevels.length > 0 ? longLiqLevels[longLiqLevels.length - 1].price : null;
      const nearestShortLiq = shortLiqLevels.length > 0 ? shortLiqLevels[0].price : null;

      // Calculate distances
      const longLiqDistance = nearestLongLiq ? ((currentPrice - nearestLongLiq) / currentPrice) * 100 : 0;
      const shortLiqDistance = nearestShortLiq ? ((nearestShortLiq - currentPrice) / currentPrice) * 100 : 0;

      // Determine signal for SHORT
      // Long liquidations below current price = targets for SHORT (price can fall there)
      let signal: 'bullish' | 'bearish' | 'neutral' = 'neutral';
      let score = 0;

      if (totalLongLiquidations > totalShortLiquidations * 1.5) {
        signal = 'bearish';  // More long liquidations below = targets for SHORT
        score = Math.min(totalLongLiquidations / 100000, 10);  // Scale by volume
      } else if (totalShortLiquidations > totalLongLiquidations * 1.5) {
        signal = 'bullish';  // More short liquidations above = squeeze risk
      }

      // Bonus for close liquidation targets
      if (nearestLongLiq && longLiqDistance < 3) {
        score = Math.min(score + 3, 10);
      }

      return {
        levels: levels.slice(0, 20),  // Top 20 levels
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
      console.error('Bybit getLiquidationHeatmap error:', error);
      return defaultResult;
    }
  }
}
