import { Candle, BollingerBands } from '@/types/scanner';

/**
 * Calculate SMA (Simple Moving Average)
 */
function calculateSMA(data: number[], period: number): number[] {
  if (data.length < period) {
    return [];
  }

  const smaValues: number[] = [];
  
  for (let i = period - 1; i < data.length; i++) {
    let sum = 0;
    for (let j = i - period + 1; j <= i; j++) {
      sum += data[j];
    }
    smaValues.push(sum / period);
  }

  return smaValues;
}

/**
 * Calculate Standard Deviation
 */
function calculateStdDev(data: number[], period: number): number[] {
  if (data.length < period) {
    return [];
  }

  const stdDevs: number[] = [];
  
  for (let i = period - 1; i < data.length; i++) {
    const slice = data.slice(i - period + 1, i + 1);
    const mean = slice.reduce((a, b) => a + b, 0) / period;
    const squaredDiffs = slice.map(v => Math.pow(v - mean, 2));
    const avgSquaredDiff = squaredDiffs.reduce((a, b) => a + b, 0) / period;
    stdDevs.push(Math.sqrt(avgSquaredDiff));
  }

  return stdDevs;
}

/**
 * Calculate Bollinger Bands
 */
export function calculateBollingerBands(candles: Candle[], period: number = 20, stdDevMultiplier: number = 2): {
  upper: number[];
  middle: number[];
  lower: number[];
} {
  const closes = candles.map(c => c.close);
  
  if (closes.length < period) {
    return { upper: [], middle: [], lower: [] };
  }

  const middle = calculateSMA(closes, period);
  const stdDevs = calculateStdDev(closes, period);

  const upper: number[] = [];
  const lower: number[] = [];

  for (let i = 0; i < middle.length; i++) {
    upper.push(middle[i] + (stdDevs[i] * stdDevMultiplier));
    lower.push(middle[i] - (stdDevs[i] * stdDevMultiplier));
  }

  return { upper, middle, lower };
}

/**
 * Get Bollinger Bands indicator data
 */
export function getBollingerBandsIndicator(candles: Candle[]): BollingerBands {
  const { upper, middle, lower } = calculateBollingerBands(candles);
  const closes = candles.map(c => c.close);

  if (upper.length < 5) {
    return {
      upper: 0,
      middle: 0,
      lower: 0,
      position: 50,
      squeeze: false,
      signal: 'neutral',
    };
  }

  const currentUpper = upper[upper.length - 1];
  const currentMiddle = middle[middle.length - 1];
  const currentLower = lower[lower.length - 1];
  const currentPrice = closes[closes.length - 1];

  // Calculate position within bands (0-100%)
  const bandWidth = currentUpper - currentLower;
  const position = bandWidth > 0 ? ((currentPrice - currentLower) / bandWidth) * 100 : 50;

  // Detect squeeze (compare current bandwidth with historical average)
  const recentBandWidths: number[] = [];
  for (let i = Math.max(0, upper.length - 20); i < upper.length; i++) {
    recentBandWidths.push(upper[i] - lower[i]);
  }
  const avgBandWidth = recentBandWidths.reduce((a, b) => a + b, 0) / recentBandWidths.length;
  const currentBandWidth = currentUpper - currentLower;
  const squeeze = currentBandWidth < avgBandWidth * 0.7;

  // Determine signal
  let signal: 'overbought' | 'oversold' | 'neutral';
  if (position > 90) {
    signal = 'overbought';
  } else if (position < 10) {
    signal = 'oversold';
  } else {
    signal = 'neutral';
  }

  return {
    upper: Math.round(currentUpper * 100000) / 100000,
    middle: Math.round(currentMiddle * 100000) / 100000,
    lower: Math.round(currentLower * 100000) / 100000,
    position: Math.round(position * 100) / 100,
    squeeze,
    signal,
  };
}
