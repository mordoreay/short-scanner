import { Candle, MACDIndicator } from '@/types/scanner';

/**
 * Calculate EMA for a given data array
 */
export function calculateEMA(data: number[], period: number): number[] {
  if (data.length < period) {
    return [];
  }

  const multiplier = 2 / (period + 1);
  const emaValues: number[] = [];

  // First EMA is SMA
  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += data[i];
  }
  emaValues.push(sum / period);

  // Calculate subsequent EMA values
  for (let i = period; i < data.length; i++) {
    const ema = (data[i] - emaValues[emaValues.length - 1]) * multiplier + emaValues[emaValues.length - 1];
    emaValues.push(ema);
  }

  return emaValues;
}

/**
 * Calculate MACD (Moving Average Convergence Divergence)
 * MACD = EMA(12) - EMA(26)
 * Signal = EMA(MACD, 9)
 * Histogram = MACD - Signal
 */
export function calculateMACD(candles: Candle[]): {
  macd: number[];
  signal: number[];
  histogram: number[];
} {
  const closes = candles.map(c => c.close);
  
  if (closes.length < 26) {
    return { macd: [], signal: [], histogram: [] };
  }

  const ema12 = calculateEMA(closes, 12);
  const ema26 = calculateEMA(closes, 26);

  // Align arrays (EMA26 starts later)
  const offset = 26 - 12;
  const macdLine: number[] = [];
  
  for (let i = 0; i < ema26.length; i++) {
    macdLine.push(ema12[i + offset] - ema26[i]);
  }

  const signalLine = calculateEMA(macdLine, 9);
  
  // Align histogram with signal
  const histogram: number[] = [];
  const signalOffset = macdLine.length - signalLine.length;
  
  for (let i = 0; i < signalLine.length; i++) {
    histogram.push(macdLine[i + signalOffset] - signalLine[i]);
  }

  return {
    macd: macdLine.slice(signalOffset),
    signal: signalLine,
    histogram,
  };
}

/**
 * Get MACD indicator data
 */
export function getMACDIndicator(candles: Candle[]): MACDIndicator {
  const { macd, signal, histogram } = calculateMACD(candles);

  if (macd.length < 2) {
    return {
      macd: 0,
      signal: 0,
      histogram: 0,
      trend: 'neutral',
      strength: 'weak',
      crossover: 'none',
    };
  }

  const currentMACD = macd[macd.length - 1];
  const currentSignal = signal[signal.length - 1];
  const currentHistogram = histogram[histogram.length - 1];
  const previousHistogram = histogram.length > 1 ? histogram[histogram.length - 2] : 0;

  // Determine trend
  let trend: 'bullish' | 'bearish' | 'neutral';
  if (currentMACD > currentSignal && currentMACD > 0) {
    trend = 'bullish';
  } else if (currentMACD < currentSignal && currentMACD < 0) {
    trend = 'bearish';
  } else {
    trend = 'neutral';
  }

  // Determine strength based on histogram magnitude
  let strength: 'strong' | 'moderate' | 'weak';
  const histogramAbs = Math.abs(currentHistogram);
  const avgHistogram = histogram.reduce((a, b) => a + Math.abs(b), 0) / histogram.length;
  
  if (histogramAbs > avgHistogram * 1.5) {
    strength = 'strong';
  } else if (histogramAbs > avgHistogram * 0.5) {
    strength = 'moderate';
  } else {
    strength = 'weak';
  }

  // Detect crossover
  let crossover: 'bullish' | 'bearish' | 'none';
  if (previousHistogram <= 0 && currentHistogram > 0) {
    crossover = 'bullish';
  } else if (previousHistogram >= 0 && currentHistogram < 0) {
    crossover = 'bearish';
  } else {
    crossover = 'none';
  }

  return {
    macd: Math.round(currentMACD * 10000) / 10000,
    signal: Math.round(currentSignal * 10000) / 10000,
    histogram: Math.round(currentHistogram * 10000) / 10000,
    trend,
    strength,
    crossover,
  };
}
