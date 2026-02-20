import { Candle, OBVIndicator } from '@/types/scanner';

/**
 * Calculate OBV (On-Balance Volume)
 * OBV = Previous OBV + Volume (if close > prev close)
 * OBV = Previous OBV - Volume (if close < prev close)
 * OBV = Previous OBV (if close = prev close)
 */
export function calculateOBV(candles: Candle[]): number[] {
  if (candles.length < 2) {
    return [0];
  }

  const obvValues: number[] = [0];

  for (let i = 1; i < candles.length; i++) {
    const prevOBV = obvValues[i - 1];
    const currentClose = candles[i].close;
    const prevClose = candles[i - 1].close;
    const volume = candles[i].volume;

    if (currentClose > prevClose) {
      obvValues.push(prevOBV + volume);
    } else if (currentClose < prevClose) {
      obvValues.push(prevOBV - volume);
    } else {
      obvValues.push(prevOBV);
    }
  }

  return obvValues;
}

/**
 * Detect OBV divergence
 */
function detectOBVDivergence(candles: Candle[], obvValues: number[]): {
  type: 'bullish' | 'bearish' | 'none';
  strength: 'strong' | 'moderate' | 'weak';
} {
  const lookback = 14;
  
  if (candles.length < lookback || obvValues.length < lookback) {
    return { type: 'none', strength: 'weak' };
  }

  const recentPrices = candles.slice(-lookback).map(c => c.low);
  const recentOBV = obvValues.slice(-lookback);

  // Find price lows
  const priceMin = Math.min(...recentPrices);
  const priceMinIndex = recentPrices.indexOf(priceMin);
  
  // Find OBV lows in the same period
  const obvMin = Math.min(...recentOBV);
  const obvMinIndex = recentOBV.indexOf(obvMin);

  // Bullish divergence: price makes lower low, OBV makes higher low
  if (priceMinIndex === lookback - 1) {
    // Price is at recent low
    const prevPriceMin = Math.min(...recentPrices.slice(0, -3));
    const prevObvMin = Math.min(...recentOBV.slice(0, -3));
    
    if (priceMin < prevPriceMin && obvMin > prevObvMin) {
      return { type: 'bullish', strength: 'moderate' };
    }
  }

  // Bearish divergence: price makes higher high, OBV makes lower high
  const recentHighs = candles.slice(-lookback).map(c => c.high);
  const priceMax = Math.max(...recentHighs);
  const priceMaxIndex = recentHighs.indexOf(priceMax);
  
  const obvMax = Math.max(...recentOBV);
  const obvMaxIndex = recentOBV.indexOf(obvMax);

  if (priceMaxIndex === lookback - 1) {
    const prevPriceMax = Math.max(...recentHighs.slice(0, -3));
    const prevObvMax = Math.max(...recentOBV.slice(0, -3));
    
    if (priceMax > prevPriceMax && obvMax < prevObvMax) {
      return { type: 'bearish', strength: 'moderate' };
    }
  }

  return { type: 'none', strength: 'weak' };
}

/**
 * Get OBV indicator data
 */
export function getOBVIndicator(candles: Candle[]): OBVIndicator {
  const obvValues = calculateOBV(candles);

  if (obvValues.length < 20) {
    return {
      value: 0,
      trend: 'neutral',
      divergence: 'none',
      divergenceStrength: 'weak',
    };
  }

  const currentOBV = obvValues[obvValues.length - 1];
  const previousOBV = obvValues[obvValues.length - 2];

  // Determine trend
  let trend: 'bullish' | 'bearish' | 'neutral';
  const obvChange = currentOBV - previousOBV;
  
  if (obvChange > 0) {
    trend = 'bullish';
  } else if (obvChange < 0) {
    trend = 'bearish';
  } else {
    trend = 'neutral';
  }

  // Detect divergence
  const divergenceResult = detectOBVDivergence(candles, obvValues);

  return {
    value: currentOBV,
    trend,
    divergence: divergenceResult.type,
    divergenceStrength: divergenceResult.strength,
  };
}
