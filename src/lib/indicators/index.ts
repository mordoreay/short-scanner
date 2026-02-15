import { Candle, Indicators, ShortScoreBreakdown, FundingRateIndicator, OpenInterestIndicator, EntryTimingIndicator } from '@/types/scanner';
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
      '5m': 'neutral' as const,
      '15m': 'neutral' as const,
      '1h': 'neutral' as const,
      '2h': 'neutral' as const,
      '4h': ema.trend,
      '1d': 'neutral' as const,
    },
    score: ema.trend === 'bearish' ? 75 : ema.trend === 'bullish' ? 25 : 50,
    weights: {
      '4h': 0.40,
      '2h': 0.30,
      '1h': 0.20,
      '15m': 0.10,
    },
  };

  // Entry Timing (placeholder for single-TF mode)
  const entryTiming: EntryTimingIndicator = {
    quality: 'good',
    score: 50,
    rsi5m: rsi.value,
    divergence5m: 'none',
    pullbackDepth: 50,
    signal: 'ready',
    reason: 'Single-TF mode - use Multi-TF for entry timing',
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
    entryTiming,
    atr,
    fundingRate,
    openInterest,
  };
}

/**
 * Calculate Entry Timing from 5m candles
 * DOES NOT affect main signal - only refines entry point
 */
function calculateEntryTiming(
  candles5m: Candle[],
  candles15m: Candle[],
  currentPrice: number,
  entryZone: [number, number] | null
): EntryTimingIndicator {
  // Need at least 50 candles for 5m analysis
  if (candles5m.length < 50) {
    return {
      quality: 'good',
      score: 50,
      rsi5m: 50,
      divergence5m: 'none',
      pullbackDepth: 50,
      signal: 'ready',
      reason: 'Insufficient 5m data',
    };
  }

  // Get 5m RSI
  const rsi5m = getRSIIndicator(candles5m);
  const rsiValue = rsi5m.value;

  // Check for 5m divergence (micro divergence)
  const divergence5m = detectRSIDivergence(candles5m);
  const microDiv = divergence5m.type;

  // Get 5m trend for context
  const trend5m = getTrendFromEMA(candles5m);

  // Calculate pullback depth into entry zone
  let pullbackDepth = 50;
  if (entryZone && entryZone[1] > entryZone[0]) {
    const range = entryZone[1] - entryZone[0];
    if (range > 0) {
      pullbackDepth = Math.min(100, Math.max(0, 
        ((currentPrice - entryZone[0]) / range) * 100
      ));
    }
  }

  // Calculate quality score
  // Optimal conditions for SHORT entry:
  // 1. RSI 5m overbought (>70) or showing bearish divergence
  // 2. Price in upper part of entry zone (pullbackDepth > 60%)
  // 3. 5m trend not strongly bullish (avoid chasing)

  let qualityScore = 50;
  let signal: 'wait' | 'ready' | 'enter_now' = 'ready';
  let reason = '';

  // RSI contribution
  if (rsiValue > 75) {
    qualityScore += 20;
    reason = '5m RSI overbought';
  } else if (rsiValue > 65) {
    qualityScore += 10;
    reason = '5m RSI elevated';
  } else if (rsiValue < 40) {
    qualityScore -= 15;
    reason = '5m RSI too low for short';
  }

  // Divergence contribution
  if (microDiv === 'bearish') {
    qualityScore += 15;
    reason += reason ? ', bearish micro-div' : 'Bearish micro-divergence';
  }

  // Pullback depth contribution
  if (pullbackDepth > 70) {
    qualityScore += 15;
    reason += ', good pullback';
  } else if (pullbackDepth < 30) {
    qualityScore -= 10;
    reason += ', deep in zone';
  }

  // Trend context
  if (trend5m === 'bearish') {
    qualityScore += 10;
    reason += ', 5m bearish';
  } else if (trend5m === 'bullish') {
    qualityScore -= 10;
    reason += ', 5m bullish (caution)';
  }

  // Determine quality and signal
  qualityScore = Math.min(100, Math.max(0, qualityScore));

  let quality: 'optimal' | 'good' | 'early' | 'late';
  if (qualityScore >= 80) {
    quality = 'optimal';
    signal = 'enter_now';
  } else if (qualityScore >= 60) {
    quality = 'good';
    signal = 'ready';
  } else if (qualityScore >= 40) {
    quality = 'early';
    signal = 'wait';
  } else {
    quality = 'late';
    signal = 'wait';
  }

  return {
    quality,
    score: qualityScore,
    rsi5m: Math.round(rsiValue * 10) / 10,
    divergence5m: microDiv,
    pullbackDepth: Math.round(pullbackDepth),
    signal,
    reason: reason.trim() || 'Standard entry conditions',
  };
}

/**
 * Get all indicators with multi-timeframe analysis
 * v2.1 - Extended TF pool: 5m, 15m, 1h, 2h, 4h
 * 
 * IMPORTANT: 5m is used ONLY for Entry Timing, NOT for signal generation
 * This prevents noise while improving entry precision
 */
export function getAllIndicatorsMultiTF(
  candles5m: Candle[],
  candles15m: Candle[],
  candles1h: Candle[],
  candles2h: Candle[],
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

  // Get trends for each timeframe (EXCLUDING 5m from signal)
  const trend15m = getTrendFromEMA(candles15m);
  const trend1h = getTrendFromEMA(candles1h);
  const trend2h = getTrendFromEMA(candles2h);
  const trend4h = getTrendFromEMA(candles4h);

  // 5m trend for entry timing only (NOT for signal)
  const trend5m = getTrendFromEMA(candles5m);

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

  // ==================== WEIGHTED Multi-TF Alignment ====================
  // Weights: 4h=40%, 2h=30%, 1h=20%, 15m=10%
  // 5m is EXCLUDED from scoring to avoid noise
  const weights = {
    '4h': 0.40,
    '2h': 0.30,
    '1h': 0.20,
    '15m': 0.10,
  };

  // Calculate weighted score (0-100 scale)
  // Bearish = +score (good for short), Bullish = -score (bad for short)
  // Each TF can contribute up to 25 points * its weight
  let weightedScore = 50; // Start neutral

  // 4h contribution (40% weight = max 10 points)
  if (trend4h === 'bearish') weightedScore += 25 * weights['4h'];
  else if (trend4h === 'bullish') weightedScore -= 25 * weights['4h'];

  // 2h contribution (30% weight = max 7.5 points)
  if (trend2h === 'bearish') weightedScore += 25 * weights['2h'];
  else if (trend2h === 'bullish') weightedScore -= 25 * weights['2h'];

  // 1h contribution (20% weight = max 5 points)
  if (trend1h === 'bearish') weightedScore += 25 * weights['1h'];
  else if (trend1h === 'bullish') weightedScore -= 25 * weights['1h'];

  // 15m contribution (10% weight = max 2.5 points)
  if (trend15m === 'bearish') weightedScore += 25 * weights['15m'];
  else if (trend15m === 'bullish') weightedScore -= 25 * weights['15m'];

  // Determine direction
  let direction: 'bullish' | 'bearish' | 'mixed';
  if (weightedScore >= 65) {
    direction = 'bearish';
  } else if (weightedScore <= 35) {
    direction = 'bullish';
  } else {
    direction = 'mixed';
  }

  const multiTFAlignment = {
    direction,
    timeframes: {
      '5m': trend5m,        // Included for display, NOT for scoring
      '15m': trend15m,
      '1h': trend1h,
      '2h': trend2h,
      '4h': trend4h,
      '1d': 'neutral' as const,
    },
    score: Math.round(weightedScore),
    weights,
  };

  // Entry Timing from 5m (separate from signal)
  const currentPrice = mainCandles[mainCandles.length - 1]?.close || 0;
  const entryTiming = calculateEntryTiming(candles5m, candles15m, currentPrice, null);

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
    entryTiming,
    atr,
    fundingRate,
    openInterest,
  };
}
