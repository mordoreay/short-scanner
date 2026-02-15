import { Candle, Indicators, ShortScoreBreakdown, FundingRateIndicator, OpenInterestIndicator } from '@/types/scanner';
import { getRSIIndicator } from './rsi';
import { getMACDIndicator, calculateEMA } from './macd';
import { getBollingerBandsIndicator } from './bollinger';
import { getEMAIndicator } from './ema';
import { getOBVIndicator } from './obv';
import { getADXIndicator } from './adx';
import { detectRSIDivergence, detectMACDDivergence } from './divergence';
import { detectFakePump } from './fakePump';
import { getStochRSIIndicator } from './stochRsi';

/**
 * Calculate VWAP
 */
function calculateVWAP(candles: Candle[]): { value: number; deviation: number } {
  if (candles.length < 20) {
    return { value: 0, deviation: 0 };
  }

  let sumPV = 0;
  let sumVolume = 0;

  for (const candle of candles) {
    const typicalPrice = (candle.high + candle.low + candle.close) / 3;
    sumPV += typicalPrice * candle.volume;
    sumVolume += candle.volume;
  }

  const vwap = sumVolume > 0 ? sumPV / sumVolume : 0;
  const currentPrice = candles[candles.length - 1].close;
  const deviation = vwap > 0 ? ((currentPrice - vwap) / vwap) * 100 : 0;

  return { value: vwap, deviation };
}

/**
 * Calculate ATR
 */
function calculateATR(candles: Candle[], period: number = 14): { value: number; percentage: number } {
  if (candles.length < period + 1) {
    return { value: 0, percentage: 0 };
  }

  const trueRanges: number[] = [];

  for (let i = 1; i < candles.length; i++) {
    const high = candles[i].high;
    const low = candles[i].low;
    const prevClose = candles[i - 1].close;

    const tr = Math.max(
      high - low,
      Math.abs(high - prevClose),
      Math.abs(low - prevClose)
    );
    trueRanges.push(tr);
  }

  // Calculate ATR using EMA
  const atr = trueRanges.slice(-period).reduce((a, b) => a + b, 0) / period;
  const currentPrice = candles[candles.length - 1].close;
  const percentage = currentPrice > 0 ? (atr / currentPrice) * 100 : 0;

  return { value: atr, percentage };
}

/**
 * Determine trend direction from EMA
 */
function getTrendFromEMA(candles: Candle[]): 'bullish' | 'bearish' | 'neutral' {
  if (candles.length < 50) return 'neutral';
  
  const ema = getEMAIndicator(candles);
  return ema.trend;
}

/**
 * Calculate Funding Rate indicator
 * Positive funding = shorts pay longs = good for SHORT (crowd is short)
 * Negative funding = longs pay shorts = bad for SHORT (crowd is long)
 */
export function calculateFundingRateIndicator(
  fundingRate?: number,
  previousRate?: number
): FundingRateIndicator {
  const rate = fundingRate || 0;
  const prevRate = previousRate || rate;
  
  // Annualized rate (funding is paid every 8 hours)
  const annualized = rate * 3 * 365 * 100; // in percentage
  
  // Signal: positive funding is good for SHORT
  let signal: 'long' | 'short' | 'neutral';
  if (rate > 0.0005) { // > 0.05%
    signal = 'short'; // Good for short - shorts are paying, market may be overleveraged short
  } else if (rate < -0.0005) { // < -0.05%
    signal = 'long'; // Bad for short - longs are paying, market is bullish
  } else {
    signal = 'neutral';
  }
  
  // Trend
  let trend: 'increasing' | 'decreasing' | 'stable';
  const change = rate - prevRate;
  if (Math.abs(change) < 0.0001) {
    trend = 'stable';
  } else if (change > 0) {
    trend = 'increasing';
  } else {
    trend = 'decreasing';
  }
  
  return {
    rate,
    annualized: Math.round(annualized * 100) / 100,
    signal,
    trend,
  };
}

/**
 * Calculate Open Interest indicator
 * Rising OI + falling price = strong SHORT signal (new shorts entering)
 * Falling OI + falling price = weak SHORT signal (shorts covering)
 */
export function calculateOpenInterestIndicator(
  openInterest?: number,
  oiChange24h?: number,
  priceChange24h?: number
): OpenInterestIndicator {
  const value = openInterest || 0;
  const change = oiChange24h || 0;
  const priceChange = priceChange24h || 0;
  
  let signal: 'increasing' | 'decreasing' | 'stable';
  if (Math.abs(change) < 5) {
    signal = 'stable';
  } else if (change > 0) {
    signal = 'increasing';
  } else {
    signal = 'decreasing';
  }
  
  // Interpretation based on OI and price relationship
  let interpretation: 'bullish' | 'bearish' | 'neutral';
  
  if (change > 5 && priceChange > 0) {
    // OI up, Price up = New longs entering = Bullish
    interpretation = 'bullish';
  } else if (change > 5 && priceChange < 0) {
    // OI up, Price down = New shorts entering = Bearish (good for SHORT)
    interpretation = 'bearish';
  } else if (change < -5 && priceChange < 0) {
    // OI down, Price down = Shorts covering = Bullish
    interpretation = 'bullish';
  } else if (change < -5 && priceChange > 0) {
    // OI down, Price up = Longs closing = Bearish
    interpretation = 'bearish';
  } else {
    interpretation = 'neutral';
  }
  
  return {
    value,
    change24h: Math.round(change * 100) / 100,
    signal,
    interpretation,
  };
}

/**
 * Get all indicators for a symbol
 */
export function getAllIndicators(
  candles: Candle[],
  perpetualData?: {
    fundingRate?: number;
    openInterest?: number;
    oiChange24h?: number;
    priceChange24h?: number;
  }
): Indicators {
  const rsi = getRSIIndicator(candles);
  const macd = getMACDIndicator(candles);
  const bollingerBands = getBollingerBandsIndicator(candles);
  const ema = getEMAIndicator(candles);
  const obv = getOBVIndicator(candles);
  const adx = getADXIndicator(candles);
  const rsiDivergence = detectRSIDivergence(candles);
  const stochRsi = getStochRSIIndicator(candles);
  const fakePump = detectFakePump(candles);

  // VWAP
  const vwapData = calculateVWAP(candles);
  const vwap = {
    value: vwapData.value,
    deviation: Math.round(vwapData.deviation * 100) / 100,
    signal: vwapData.deviation > 3 ? 'overbought' : vwapData.deviation < -3 ? 'oversold' : 'neutral' as const,
  };

  // ATR
  const atrData = calculateATR(candles);
  const atr = {
    value: atrData.value,
    percentage: Math.round(atrData.percentage * 100) / 100,
    volatility: atrData.percentage > 5 ? 'high' : atrData.percentage < 2 ? 'low' : 'normal' as const,
  };

  // 4H Trend (simplified - using EMA alignment)
  const fourHTrend = {
    trend: ema.trend,
    strength: adx.trend === 'strong' ? 'strong' : adx.trend === 'moderate' ? 'moderate' : 'weak' as const,
  };

  // MACD Divergence
  const { macd: macdLine, signal, histogram } = getMACDIndicator(candles);
  const macdDivergence = detectMACDDivergence(
    [macd],
    [signal],
    [histogram],
    candles
  );

  // Multi-TF Alignment (simplified - using current TF)
  const multiTFAlignment = {
    direction: ema.trend === 'bearish' ? 'bearish' as const : ema.trend === 'bullish' ? 'bullish' as const : 'mixed' as const,
    timeframes: {
      '15m': 'neutral' as const,
      '1h': 'neutral' as const,
      '4h': ema.trend,
      '1d': 'neutral' as const,
    },
    score: ema.trend === 'bearish' ? 75 : ema.trend === 'bullish' ? 25 : 50,
  };

  // Perpetual indicators
  const fundingRate = calculateFundingRateIndicator(perpetualData?.fundingRate);
  const openInterest = calculateOpenInterestIndicator(
    perpetualData?.openInterest,
    perpetualData?.oiChange24h,
    perpetualData?.priceChange24h
  );

  return {
    rsi,
    macd,
    bollingerBands,
    ema,
    fourHTrend,
    obv,
    adx,
    rsiDivergence,
    macdDivergence,
    fakePump,
    vwap,
    stochRsi,
    multiTFAlignment,
    atr,
    fundingRate,
    openInterest,
  };
}

/**
 * Get all indicators with multi-timeframe analysis
 */
export function getAllIndicatorsMultiTF(
  candles15m: Candle[],
  candles1h: Candle[],
  candles4h: Candle[],
  perpetualData?: {
    fundingRate?: number;
    openInterest?: number;
    oiChange24h?: number;
    priceChange24h?: number;
  }
): Indicators {
  // Get indicators for main timeframe (1h as base)
  const mainCandles = candles1h.length >= 100 ? candles1h : candles4h;
  const rsi = getRSIIndicator(mainCandles);
  const macd = getMACDIndicator(mainCandles);
  const bollingerBands = getBollingerBandsIndicator(mainCandles);
  const ema = getEMAIndicator(mainCandles);
  const obv = getOBVIndicator(mainCandles);
  const adx = getADXIndicator(mainCandles);
  const rsiDivergence = detectRSIDivergence(mainCandles);
  const stochRsi = getStochRSIIndicator(mainCandles);
  const fakePump = detectFakePump(mainCandles);

  // VWAP
  const vwapData = calculateVWAP(mainCandles);
  const vwap = {
    value: vwapData.value,
    deviation: Math.round(vwapData.deviation * 100) / 100,
    signal: vwapData.deviation > 3 ? 'overbought' : vwapData.deviation < -3 ? 'oversold' : 'neutral' as const,
  };

  // ATR
  const atrData = calculateATR(mainCandles);
  const atr = {
    value: atrData.value,
    percentage: Math.round(atrData.percentage * 100) / 100,
    volatility: atrData.percentage > 5 ? 'high' : atrData.percentage < 2 ? 'low' : 'normal' as const,
  };

  // Get trends for each timeframe
  const trend15m = getTrendFromEMA(candles15m);
  const trend1h = getTrendFromEMA(candles1h);
  const trend4h = getTrendFromEMA(candles4h);

  // 4H Trend - use actual 4h candles
  const ema4h = getEMAIndicator(candles4h);
  const adx4h = getADXIndicator(candles4h);
  const fourHTrend = {
    trend: ema4h.trend,
    strength: adx4h.trend === 'strong' ? 'strong' : adx4h.trend === 'moderate' ? 'moderate' : 'weak' as const,
  };

  // MACD Divergence
  const { macd: macdLine, signal: sig, histogram } = getMACDIndicator(mainCandles);
  const macdDivergence = detectMACDDivergence(
    [macd],
    [sig],
    [histogram],
    mainCandles
  );

  // Calculate Multi-TF Alignment score
  // Bearish = good for short, Bullish = bad for short
  let bearishCount = 0;
  let bullishCount = 0;
  
  if (trend15m === 'bearish') bearishCount++;
  if (trend1h === 'bearish') bearishCount++;
  if (trend4h === 'bearish') bearishCount++;
  
  if (trend15m === 'bullish') bullishCount++;
  if (trend1h === 'bullish') bullishCount++;
  if (trend4h === 'bullish') bullishCount++;

  let direction: 'bullish' | 'bearish' | 'mixed';
  let score: number;

  if (bearishCount >= 2) {
    direction = 'bearish';
    score = 70 + (bearishCount === 3 ? 20 : 0); // 70-90
  } else if (bullishCount >= 2) {
    direction = 'bullish';
    score = 10 + (bullishCount === 3 ? 15 : 0); // 10-25
  } else {
    direction = 'mixed';
    score = 40;
  }

  const multiTFAlignment = {
    direction,
    timeframes: {
      '15m': trend15m,
      '1h': trend1h,
      '4h': trend4h,
      '1d': 'neutral' as const,
    },
    score,
  };

  // Perpetual indicators
  const fundingRate = calculateFundingRateIndicator(perpetualData?.fundingRate);
  const openInterest = calculateOpenInterestIndicator(
    perpetualData?.openInterest,
    perpetualData?.oiChange24h,
    perpetualData?.priceChange24h
  );

  return {
    rsi,
    macd,
    bollingerBands,
    ema,
    fourHTrend,
    obv,
    adx,
    rsiDivergence,
    macdDivergence,
    fakePump,
    vwap,
    stochRsi,
    multiTFAlignment,
    atr,
    fundingRate,
    openInterest,
  };
}
