import { Candle, FakePumpIndicator } from '@/types/scanner';
import { calculateRSI } from './rsi';
import { calculateBollingerBands } from './bollinger';
import { calculateEMA } from './macd';

/**
 * Detect Fake Pump patterns
 * A fake pump is characterized by:
 * 1. Rapid price increase without volume support
 * 2. Price hitting upper Bollinger Band and reversing
 * 3. RSI overbought with decreasing momentum
 * 4. Price far above EMA200
 */
export function detectFakePump(candles: Candle[]): FakePumpIndicator {
  const signals: string[] = [];
  let confidence = 0;
  
  if (candles.length < 50) {
    return {
      isFake: false,
      confidence: 0,
      reason: 'Insufficient data',
      signals: [],
    };
  }
  
  const closes = candles.map(c => c.close);
  const volumes = candles.map(c => c.volume);
  const currentPrice = closes[closes.length - 1];
  
  // Calculate RSI
  const rsiValues = calculateRSI(candles);
  const currentRSI = rsiValues[rsiValues.length - 1];
  const previousRSI = rsiValues.length > 1 ? rsiValues[rsiValues.length - 2] : currentRSI;
  
  // Calculate Bollinger Bands
  const { upper, middle, lower } = calculateBollingerBands(candles);
  const currentUpper = upper[upper.length - 1];
  const currentMiddle = middle[middle.length - 1];
  
  // Calculate EMAs
  const ema9 = calculateEMA(closes, 9);
  const ema21 = calculateEMA(closes, 21);
  const ema50 = calculateEMA(closes, 50);
  const ema200 = calculateEMA(closes, 200);
  
  const currentEMA9 = ema9[ema9.length - 1];
  const currentEMA21 = ema21[ema21.length - 1];
  const currentEMA50 = ema50[ema50.length - 1];
  const currentEMA200 = ema200.length > 0 ? ema200[ema200.length - 1] : currentPrice;
  
  // Check 1: Price far from EMA200 (more than 30%)
  const ema200Distance = ((currentPrice - currentEMA200) / currentEMA200) * 100;
  if (ema200Distance > 30) {
    signals.push(`Price ${ema200Distance.toFixed(1)}% above EMA200`);
    confidence += 25;
  } else if (ema200Distance > 20) {
    signals.push(`Price ${ema200Distance.toFixed(1)}% above EMA200`);
    confidence += 15;
  }
  
  // Check 2: RSI overbought with decreasing momentum
  if (currentRSI > 75 && currentRSI < previousRSI) {
    signals.push(`RSI overbought (${currentRSI.toFixed(1)}) with declining momentum`);
    confidence += 30;
  } else if (currentRSI > 70) {
    signals.push(`RSI overbought (${currentRSI.toFixed(1)})`);
    confidence += 15;
  }
  
  // Check 3: Price at or above upper Bollinger Band
  if (currentPrice >= currentUpper * 0.99) {
    signals.push('Price at upper Bollinger Band');
    confidence += 20;
    
    // Check for rejection from upper band
    const prevHigh = candles[candles.length - 2].high;
    if (prevHigh > currentUpper && currentPrice < prevHigh) {
      signals.push('Rejection from upper Bollinger Band');
      confidence += 15;
    }
  }
  
  // Check 4: Volume analysis - declining volume on pump
  const recentVolumes = volumes.slice(-10);
  const olderVolumes = volumes.slice(-20, -10);
  const avgRecentVolume = recentVolumes.reduce((a, b) => a + b, 0) / recentVolumes.length;
  const avgOlderVolume = olderVolumes.reduce((a, b) => a + b, 0) / olderVolumes.length;
  
  if (avgRecentVolume < avgOlderVolume * 0.7) {
    signals.push('Declining volume during price increase');
    confidence += 20;
  }
  
  // Check 5: Large green candle followed by hesitation
  const last3Candles = candles.slice(-3);
  const greenCandles = last3Candles.filter(c => c.close > c.open);
  const avgBodySize = last3Candles.reduce((sum, c) => sum + Math.abs(c.close - c.open), 0) / 3;
  const lastBodySize = Math.abs(candles[candles.length - 1].close - candles[candles.length - 1].open);
  
  if (greenCandles.length === 3 && lastBodySize < avgBodySize * 0.5) {
    signals.push('Hesitation after strong move');
    confidence += 15;
  }
  
  // Check 6: Wick analysis - long upper wicks
  const lastCandle = candles[candles.length - 1];
  const upperWick = lastCandle.high - Math.max(lastCandle.open, lastCandle.close);
  const body = Math.abs(lastCandle.close - lastCandle.open);
  
  if (upperWick > body * 2 && lastCandle.close < lastCandle.open) {
    signals.push('Long upper wick with rejection');
    confidence += 20;
  }
  
  // Check 7: EMA spread - too wide
  const emaSpread = ((currentEMA9 - currentEMA50) / currentEMA50) * 100;
  if (emaSpread > 10) {
    signals.push(`EMA spread too wide (${emaSpread.toFixed(1)}%)`);
    confidence += 10;
  }
  
  // Determine if it's a fake pump
  const isFake = confidence >= 50;
  
  // Generate reason
  let reason = '';
  if (isFake) {
    if (ema200Distance > 30 && currentRSI > 70) {
      reason = 'Overextended from EMA200 with overbought RSI - likely mean reversion';
    } else if (signals.some(s => s.includes('Rejection'))) {
      reason = 'Price rejected from key level with exhaustion signals';
    } else if (signals.some(s => s.includes('Declining volume'))) {
      reason = 'Price increase lacks volume support - weak hands';
    } else {
      reason = 'Multiple indicators suggest unsustainable price action';
    }
  } else {
    reason = 'No significant fake pump signals detected';
  }
  
  return {
    isFake,
    confidence: Math.min(confidence, 100),
    reason,
    signals,
  };
}
