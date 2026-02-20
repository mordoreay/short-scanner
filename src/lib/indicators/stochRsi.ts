import { Candle, StochRSIIndicator } from '@/types/scanner';
import { calculateRSI } from './rsi';

/**
 * Calculate StochRSI
 * StochRSI = (RSI - LowestRSI) / (HighestRSI - LowestRSI) * 100
 */
export function calculateStochRSI(candles: Candle[], rsiPeriod: number = 14, stochPeriod: number = 14): {
  k: number[];
  d: number[];
} {
  const rsiValues = calculateRSI(candles, rsiPeriod);
  
  if (rsiValues.length < stochPeriod) {
    return { k: [], d: [] };
  }
  
  const kValues: number[] = [];
  
  for (let i = stochPeriod - 1; i < rsiValues.length; i++) {
    const rsiSlice = rsiValues.slice(i - stochPeriod + 1, i + 1);
    const highestRSI = Math.max(...rsiSlice);
    const lowestRSI = Math.min(...rsiSlice);
    
    if (highestRSI === lowestRSI) {
      kValues.push(100);
    } else {
      const stochRSI = ((rsiValues[i] - lowestRSI) / (highestRSI - lowestRSI)) * 100;
      kValues.push(stochRSI);
    }
  }
  
  // Calculate D (3-period SMA of K)
  const dValues: number[] = [];
  const smoothPeriod = 3;
  
  for (let i = smoothPeriod - 1; i < kValues.length; i++) {
    let sum = 0;
    for (let j = i - smoothPeriod + 1; j <= i; j++) {
      sum += kValues[j];
    }
    dValues.push(sum / smoothPeriod);
  }
  
  // Align K with D
  const kOffset = kValues.length - dValues.length;
  const alignedK = kValues.slice(kOffset);
  
  return { k: alignedK, d: dValues };
}

/**
 * Get StochRSI indicator data
 */
export function getStochRSIIndicator(candles: Candle[]): StochRSIIndicator {
  const { k, d } = calculateStochRSI(candles);
  
  if (k.length === 0) {
    return {
      k: 50,
      d: 50,
      signal: 'neutral',
      overbought: false,
      oversold: false,
    };
  }
  
  const currentK = k[k.length - 1];
  const currentD = d[d.length - 1];
  const previousK = k.length > 1 ? k[k.length - 2] : currentK;
  
  // Determine overbought/oversold
  const overbought = currentK >= 80;
  const oversold = currentK <= 20;
  
  // Determine signal
  let signal: 'bullish' | 'bearish' | 'neutral';
  
  if (oversold && currentK > previousK) {
    signal = 'bullish';
  } else if (overbought && currentK < previousK) {
    signal = 'bearish';
  } else if (currentK > currentD && currentK < 80) {
    signal = 'bullish';
  } else if (currentK < currentD && currentK > 20) {
    signal = 'bearish';
  } else {
    signal = 'neutral';
  }
  
  return {
    k: Math.round(currentK * 100) / 100,
    d: Math.round(currentD * 100) / 100,
    signal,
    overbought,
    oversold,
  };
}
