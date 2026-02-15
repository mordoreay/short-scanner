import { Candle, RSIIndicator } from '@/types/scanner';

/**
 * Calculate RSI (Relative Strength Index)
 * RSI = 100 - (100 / (1 + RS))
 * RS = Average Gain / Average Loss
 */
export function calculateRSI(candles: Candle[], period: number = 14): number[] {
  if (candles.length < period + 1) {
    return [];
  }

  const rsiValues: number[] = [];
  const gains: number[] = [];
  const losses: number[] = [];

  // Calculate initial gains and losses
  for (let i = 1; i < candles.length; i++) {
    const change = candles[i].close - candles[i - 1].close;
    gains.push(change > 0 ? change : 0);
    losses.push(change < 0 ? Math.abs(change) : 0);
  }

  // Calculate first average
  let avgGain = gains.slice(0, period).reduce((a, b) => a + b, 0) / period;
  let avgLoss = losses.slice(0, period).reduce((a, b) => a + b, 0) / period;

  // Calculate first RSI
  if (avgLoss === 0) {
    rsiValues.push(100);
  } else {
    const rs = avgGain / avgLoss;
    rsiValues.push(100 - (100 / (1 + rs)));
  }

  // Calculate subsequent RSI values using smoothed method
  for (let i = period; i < gains.length; i++) {
    avgGain = ((avgGain * (period - 1)) + gains[i]) / period;
    avgLoss = ((avgLoss * (period - 1)) + losses[i]) / period;

    if (avgLoss === 0) {
      rsiValues.push(100);
    } else {
      const rs = avgGain / avgLoss;
      rsiValues.push(100 - (100 / (1 + rs)));
    }
  }

  return rsiValues;
}

/**
 * Get RSI indicator data
 */
export function getRSIIndicator(candles: Candle[]): RSIIndicator {
  const rsiValues = calculateRSI(candles);
  
  if (rsiValues.length === 0) {
    return {
      value: 50,
      trend: 'neutral',
      signal: 'neutral',
    };
  }

  const currentRSI = rsiValues[rsiValues.length - 1];
  const previousRSI = rsiValues.length > 1 ? rsiValues[rsiValues.length - 2] : currentRSI;

  let trend: 'overbought' | 'oversold' | 'neutral';
  if (currentRSI >= 70) {
    trend = 'overbought';
  } else if (currentRSI <= 30) {
    trend = 'oversold';
  } else {
    trend = 'neutral';
  }

  let signal: 'bullish' | 'bearish' | 'neutral';
  if (currentRSI > previousRSI && currentRSI < 70) {
    signal = 'bullish';
  } else if (currentRSI < previousRSI && currentRSI > 30) {
    signal = 'bearish';
  } else {
    signal = 'neutral';
  }

  return {
    value: Math.round(currentRSI * 100) / 100,
    trend,
    signal,
  };
}
