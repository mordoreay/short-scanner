import { Candle, EMAIndicator } from '@/types/scanner';
import { calculateEMA } from './macd';

/**
 * Calculate all EMAs and get indicator data
 */
export function getEMAIndicator(candles: Candle[]): EMAIndicator {
  const closes = candles.map(c => c.close);

  if (closes.length < 200) {
    // Return default values if not enough data
    const ema9 = closes.length >= 9 ? calculateEMA(closes, 9) : [closes[closes.length - 1] || 0];
    const ema21 = closes.length >= 21 ? calculateEMA(closes, 21) : [closes[closes.length - 1] || 0];
    
    return {
      ema9: ema9[ema9.length - 1] || 0,
      ema21: ema21[ema21.length - 1] || 0,
      ema50: closes[closes.length - 1] || 0,
      ema100: closes[closes.length - 1] || 0,
      ema200: closes[closes.length - 1] || 0,
      trend: 'neutral',
      crossover: 'none',
      ema200Distance: 0,
    };
  }

  const ema9 = calculateEMA(closes, 9);
  const ema21 = calculateEMA(closes, 21);
  const ema50 = calculateEMA(closes, 50);
  const ema100 = calculateEMA(closes, 100);
  const ema200 = calculateEMA(closes, 200);

  const currentPrice = closes[closes.length - 1];
  const currentEMA9 = ema9[ema9.length - 1];
  const currentEMA21 = ema21[ema21.length - 1];
  const currentEMA50 = ema50[ema50.length - 1];
  const currentEMA100 = ema100[ema100.length - 1];
  const currentEMA200 = ema200[ema200.length - 1];

  // Determine trend based on EMA alignment
  let trend: 'bullish' | 'bearish' | 'neutral';
  if (currentEMA9 > currentEMA21 && currentEMA21 > currentEMA50 && currentPrice > currentEMA200) {
    trend = 'bullish';
  } else if (currentEMA9 < currentEMA21 && currentEMA21 < currentEMA50 && currentPrice < currentEMA200) {
    trend = 'bearish';
  } else {
    trend = 'neutral';
  }

  // Detect crossover between EMA9 and EMA21
  let crossover: 'bullish' | 'bearish' | 'none';
  if (ema9.length >= 2 && ema21.length >= 2) {
    const prevEMA9 = ema9[ema9.length - 2];
    const prevEMA21 = ema21[ema21.length - 2];
    
    if (prevEMA9 <= prevEMA21 && currentEMA9 > currentEMA21) {
      crossover = 'bullish';
    } else if (prevEMA9 >= prevEMA21 && currentEMA9 < currentEMA21) {
      crossover = 'bearish';
    } else {
      crossover = 'none';
    }
  } else {
    crossover = 'none';
  }

  // Calculate distance from EMA200
  const ema200Distance = ((currentPrice - currentEMA200) / currentEMA200) * 100;

  return {
    ema9: Math.round(currentEMA9 * 100000) / 100000,
    ema21: Math.round(currentEMA21 * 100000) / 100000,
    ema50: Math.round(currentEMA50 * 100000) / 100000,
    ema100: Math.round(currentEMA100 * 100000) / 100000,
    ema200: Math.round(currentEMA200 * 100000) / 100000,
    trend,
    crossover,
    ema200Distance: Math.round(ema200Distance * 100) / 100,
  };
}
