import { Candle, ADXIndicator } from '@/types/scanner';

/**
 * Calculate True Range
 */
function calculateTrueRange(candles: Candle[]): number[] {
  const trValues: number[] = [];
  
  for (let i = 0; i < candles.length; i++) {
    if (i === 0) {
      trValues.push(candles[i].high - candles[i].low);
    } else {
      const high = candles[i].high;
      const low = candles[i].low;
      const prevClose = candles[i - 1].close;
      
      const tr = Math.max(
        high - low,
        Math.abs(high - prevClose),
        Math.abs(low - prevClose)
      );
      trValues.push(tr);
    }
  }
  
  return trValues;
}

/**
 * Calculate Directional Movement
 */
function calculateDM(candles: Candle[]): { plusDM: number[]; minusDM: number[] } {
  const plusDM: number[] = [0];
  const minusDM: number[] = [0];
  
  for (let i = 1; i < candles.length; i++) {
    const upMove = candles[i].high - candles[i - 1].high;
    const downMove = candles[i - 1].low - candles[i].low;
    
    if (upMove > downMove && upMove > 0) {
      plusDM.push(upMove);
    } else {
      plusDM.push(0);
    }
    
    if (downMove > upMove && downMove > 0) {
      minusDM.push(downMove);
    } else {
      minusDM.push(0);
    }
  }
  
  return { plusDM, minusDM };
}

/**
 * Smooth values using Wilder's smoothing
 */
function smoothValues(values: number[], period: number): number[] {
  if (values.length < period) {
    return [];
  }
  
  const smoothed: number[] = [];
  
  // First value is sum of first 'period' values
  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += values[i];
  }
  smoothed.push(sum);
  
  // Subsequent values use Wilder's smoothing
  for (let i = period; i < values.length; i++) {
    const newSmoothed = smoothed[smoothed.length - 1] - (smoothed[smoothed.length - 1] / period) + values[i];
    smoothed.push(newSmoothed);
  }
  
  return smoothed;
}

/**
 * Calculate ADX (Average Directional Index)
 */
export function calculateADX(candles: Candle[], period: number = 14): {
  adx: number[];
  plusDI: number[];
  minusDI: number[];
} {
  if (candles.length < period * 2) {
    return { adx: [], plusDI: [], minusDI: [] };
  }
  
  const tr = calculateTrueRange(candles);
  const { plusDM, minusDM } = calculateDM(candles);
  
  // Smooth the values
  const smoothedTR = smoothValues(tr, period);
  const smoothedPlusDM = smoothValues(plusDM, period);
  const smoothedMinusDM = smoothValues(minusDM, period);
  
  // Calculate DI
  const plusDI: number[] = [];
  const minusDI: number[] = [];
  const dx: number[] = [];
  
  for (let i = 0; i < smoothedTR.length; i++) {
    const pdi = (smoothedPlusDM[i] / smoothedTR[i]) * 100;
    const mdi = (smoothedMinusDM[i] / smoothedTR[i]) * 100;
    
    plusDI.push(pdi);
    minusDI.push(mdi);
    
    // Calculate DX
    const diSum = pdi + mdi;
    if (diSum > 0) {
      dx.push((Math.abs(pdi - mdi) / diSum) * 100);
    } else {
      dx.push(0);
    }
  }
  
  // Smooth DX to get ADX
  const adx: number[] = [];
  
  // First ADX is average of first 'period' DX values
  if (dx.length >= period) {
    let sum = 0;
    for (let i = 0; i < period; i++) {
      sum += dx[i];
    }
    adx.push(sum / period);
    
    // Subsequent ADX values are smoothed
    for (let i = period; i < dx.length; i++) {
      const newADX = (adx[adx.length - 1] * (period - 1) + dx[i]) / period;
      adx.push(newADX);
    }
  }
  
  return { adx, plusDI, minusDI };
}

/**
 * Get ADX indicator data
 */
export function getADXIndicator(candles: Candle[]): ADXIndicator {
  const { adx, plusDI, minusDI } = calculateADX(candles);
  
  if (adx.length === 0) {
    return {
      value: 0,
      trend: 'none',
      plusDI: 0,
      minusDI: 0,
      signal: 'neutral',
    };
  }
  
  const currentADX = adx[adx.length - 1];
  const currentPlusDI = plusDI[plusDI.length - 1];
  const currentMinusDI = minusDI[minusDI.length - 1];
  
  // Determine trend strength
  let trend: 'strong' | 'moderate' | 'weak' | 'none';
  if (currentADX >= 25) {
    trend = 'strong';
  } else if (currentADX >= 20) {
    trend = 'moderate';
  } else if (currentADX >= 15) {
    trend = 'weak';
  } else {
    trend = 'none';
  }
  
  // Determine signal based on DI crossover
  let signal: 'bullish' | 'bearish' | 'neutral';
  if (currentPlusDI > currentMinusDI) {
    signal = 'bullish';
  } else if (currentMinusDI > currentPlusDI) {
    signal = 'bearish';
  } else {
    signal = 'neutral';
  }
  
  return {
    value: Math.round(currentADX * 100) / 100,
    trend,
    plusDI: Math.round(currentPlusDI * 100) / 100,
    minusDI: Math.round(currentMinusDI * 100) / 100,
    signal,
  };
}
