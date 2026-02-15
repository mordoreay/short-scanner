import { Candle, DivergenceIndicator } from '@/types/scanner';
import { calculateRSI } from './rsi';

/**
 * Find local extremes (peaks and troughs)
 */
function findExtremes(data: number[], lookback: number = 5): { peaks: number[]; troughs: number[] } {
  const peaks: number[] = [];
  const troughs: number[] = [];
  
  for (let i = lookback; i < data.length - lookback; i++) {
    let isPeak = true;
    let isTrough = true;
    
    for (let j = i - lookback; j <= i + lookback; j++) {
      if (j !== i) {
        if (data[j] >= data[i]) isPeak = false;
        if (data[j] <= data[i]) isTrough = false;
      }
    }
    
    if (isPeak) peaks.push(i);
    if (isTrough) troughs.push(i);
  }
  
  return { peaks, troughs };
}

/**
 * Detect RSI divergence
 */
export function detectRSIDivergence(candles: Candle[]): DivergenceIndicator {
  const rsiValues = calculateRSI(candles);
  const closes = candles.map(c => c.close);
  
  if (rsiValues.length < 30) {
    return {
      type: 'none',
      strength: 'weak',
      confirmation: false,
    };
  }
  
  // Find peaks and troughs in price and RSI
  const { peaks: pricePeaks, troughs: priceTroughs } = findExtremes(closes.slice(-50));
  const { peaks: rsiPeaks, troughs: rsiTroughs } = findExtremes(rsiValues.slice(-50));
  
  // Check for bearish divergence (higher high in price, lower high in RSI)
  if (pricePeaks.length >= 2 && rsiPeaks.length >= 2) {
    const lastTwoPricePeaks = pricePeaks.slice(-2);
    const lastTwoRSIPeaks = rsiPeaks.slice(-2);
    
    const pricePeak1 = closes.slice(-50)[lastTwoPricePeaks[0]];
    const pricePeak2 = closes.slice(-50)[lastTwoPricePeaks[1]];
    const rsiPeak1 = rsiValues.slice(-50)[lastTwoRSIPeaks[0]];
    const rsiPeak2 = rsiValues.slice(-50)[lastTwoRSIPeaks[1]];
    
    if (pricePeak2 > pricePeak1 && rsiPeak2 < rsiPeak1) {
      // Determine strength based on RSI level
      let strength: 'strong' | 'moderate' | 'weak';
      if (rsiPeak2 > 70) {
        strength = 'strong';
      } else if (rsiPeak2 > 60) {
        strength = 'moderate';
      } else {
        strength = 'weak';
      }
      
      return {
        type: 'bearish',
        strength,
        confirmation: rsiPeak2 < 70 && rsiPeak1 > 70,
      };
    }
  }
  
  // Check for bullish divergence (lower low in price, higher low in RSI)
  if (priceTroughs.length >= 2 && rsiTroughs.length >= 2) {
    const lastTwoPriceTroughs = priceTroughs.slice(-2);
    const lastTwoRSITroughs = rsiTroughs.slice(-2);
    
    const priceTrough1 = closes.slice(-50)[lastTwoPriceTroughs[0]];
    const priceTrough2 = closes.slice(-50)[lastTwoPriceTroughs[1]];
    const rsiTrough1 = rsiValues.slice(-50)[lastTwoRSITroughs[0]];
    const rsiTrough2 = rsiValues.slice(-50)[lastTwoRSITroughs[1]];
    
    if (priceTrough2 < priceTrough1 && rsiTrough2 > rsiTrough1) {
      let strength: 'strong' | 'moderate' | 'weak';
      if (rsiTrough2 < 30) {
        strength = 'strong';
      } else if (rsiTrough2 < 40) {
        strength = 'moderate';
      } else {
        strength = 'weak';
      }
      
      return {
        type: 'bullish',
        strength,
        confirmation: rsiTrough2 > 30 && rsiTrough1 < 30,
      };
    }
  }
  
  return {
    type: 'none',
    strength: 'weak',
    confirmation: false,
  };
}

/**
 * Detect MACD divergence
 */
export function detectMACDDivergence(
  macdLine: number[],
  signalLine: number[],
  histogram: number[],
  candles: Candle[]
): DivergenceIndicator {
  const closes = candles.map(c => c.close);
  
  if (histogram.length < 30) {
    return {
      type: 'none',
      strength: 'weak',
      confirmation: false,
    };
  }
  
  // Find peaks and troughs
  const { peaks: pricePeaks, troughs: priceTroughs } = findExtremes(closes.slice(-50));
  const { peaks: histPeaks, troughs: histTroughs } = findExtremes(histogram.slice(-50));
  
  // Check for bearish divergence
  if (pricePeaks.length >= 2 && histPeaks.length >= 2) {
    const lastTwoPricePeaks = pricePeaks.slice(-2);
    const lastTwoHistPeaks = histPeaks.slice(-2);
    
    const pricePeak1 = closes.slice(-50)[lastTwoPricePeaks[0]];
    const pricePeak2 = closes.slice(-50)[lastTwoPricePeaks[1]];
    const histPeak1 = histogram.slice(-50)[lastTwoHistPeaks[0]];
    const histPeak2 = histogram.slice(-50)[lastTwoHistPeaks[1]];
    
    if (pricePeak2 > pricePeak1 && histPeak2 < histPeak1 && histPeak2 > 0) {
      return {
        type: 'bearish',
        strength: histPeak2 < histPeak1 * 0.7 ? 'strong' : 'moderate',
        confirmation: histogram[histogram.length - 1] < 0,
      };
    }
  }
  
  // Check for bullish divergence
  if (priceTroughs.length >= 2 && histTroughs.length >= 2) {
    const lastTwoPriceTroughs = priceTroughs.slice(-2);
    const lastTwoHistTroughs = histTroughs.slice(-2);
    
    const priceTrough1 = closes.slice(-50)[lastTwoPriceTroughs[0]];
    const priceTrough2 = closes.slice(-50)[lastTwoPriceTroughs[1]];
    const histTrough1 = histogram.slice(-50)[lastTwoHistTroughs[0]];
    const histTrough2 = histogram.slice(-50)[lastTwoHistTroughs[1]];
    
    if (priceTrough2 < priceTrough1 && histTrough2 > histTrough1 && histTrough2 < 0) {
      return {
        type: 'bullish',
        strength: histTrough2 > histTrough1 * 0.7 ? 'strong' : 'moderate',
        confirmation: histogram[histogram.length - 1] > 0,
      };
    }
  }
  
  return {
    type: 'none',
    strength: 'weak',
    confirmation: false,
  };
}
