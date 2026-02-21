import { Candle, Indicators, ShortScoreBreakdown, FundingRateIndicator, OpenInterestIndicator, EntryTimingIndicator, LongShortRatioIndicator, TopTradersIndicator, OrderBookIndicator, LiquidationHeatmapIndicator, EntryTimingBreakdown } from '@/types/scanner';
import { getRSIIndicator } from './rsi';
import { getMACDIndicator, calculateMACD, calculateEMA } from './macd';
import { getBollingerBandsIndicator } from './bollinger';
import { getEMAIndicator } from './ema';
import { getOBVIndicator } from './obv';
import { getADXIndicator } from './adx';
import { detectRSIDivergence, detectMACDDivergence } from './divergence';
import { detectFakePump } from './fakePump';
import { getStochRSIIndicator } from './stochRsi';
import { detectBearishPatterns, detectBullishPatterns } from './candlePatterns';

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
 * 
 * КОНТРАРИАНСКАЯ ЛОГИКА ДЛЯ SHORT:
 * - Положительный фандинг = шортисты платят лонгистам = ТОЛПА В ШОРТАХ
 *   → ПЛОХО для SHORT (мы хотим шортить ПРОТИВ толпы)
 *   → Высокий риск SHORT SQUEEZE
 * 
 * - Отрицательный фандинг = лонгисты платят шортистам = ТОЛПА В ЛОНГАХ
 *   → ХОРОШО для SHORT (контрарианский подход)
 *   → Мы шортим против эйфоричной толпы
 */
export function calculateFundingRateIndicator(
  fundingRate?: number,
  previousRate?: number,
  history?: number[]
): FundingRateIndicator {
  const rate = fundingRate || 0;
  const prevRate = previousRate || rate;
  
  // Annualized rate (funding is paid every 8 hours)
  const annualized = rate * 3 * 365 * 100; // in percentage
  
  // Signal для SHORT (контрарианский):
  // 'short' = хорошо для SHORT, 'long' = плохо для SHORT (бычий сигнал)
  let signal: 'long' | 'short' | 'neutral';
  if (rate < -0.0005) { 
    // Отрицательный фандинг = толпа в лонгах = ХОРОШО для SHORT
    signal = 'short';
  } else if (rate > 0.0005) { 
    // Положительный фандинг = толпа в шортах = ПЛОХО для SHORT (squeeze risk)
    signal = 'long';
  } else {
    signal = 'neutral';
  }
  
  // Trend from history
  let trend: 'increasing' | 'decreasing' | 'stable';
  
  if (history && history.length >= 2) {
    const recentAvg = history.slice(0, 4).reduce((a, b) => a + b, 0) / Math.min(4, history.length);
    const olderAvg = history.slice(4).reduce((a, b) => a + b, 0) / Math.max(1, history.length - 4);
    const change = recentAvg - olderAvg;
    
    if (Math.abs(change) < 0.0001) {
      trend = 'stable';
    } else if (change > 0) {
      trend = 'increasing';
    } else {
      trend = 'decreasing';
    }
  } else {
    const change = rate - prevRate;
    if (Math.abs(change) < 0.0001) {
      trend = 'stable';
    } else if (change > 0) {
      trend = 'increasing';
    } else {
      trend = 'decreasing';
    }
  }
  
  return {
    rate,
    annualized: Math.round(annualized * 100) / 100,
    signal,
    trend,
    history,
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
 * Calculate Long/Short Ratio indicator
 * High ratio = crowd is long = contrarian SHORT opportunity
 * Low ratio = crowd is short = avoid SHORT
 */
export function calculateLongShortRatioIndicator(
  data?: { longRatio: number; shortRatio: number; ratio: number }
): LongShortRatioIndicator {
  const longRatio = data?.longRatio ?? 50;
  const shortRatio = data?.shortRatio ?? 50;
  const ratio = data?.ratio ?? 1;
  
  // Signal: High long ratio = crowd is long = good for SHORT
  let signal: 'bullish' | 'bearish' | 'neutral';
  
  if (longRatio >= 60) {
    // Crowd heavily long (>60%) = good for SHORT
    signal = 'bearish';
  } else if (longRatio <= 40) {
    // Crowd heavily short (<40% long) = bad for SHORT
    signal = 'bullish';
  } else {
    signal = 'neutral';
  }
  
  return {
    longRatio: Math.round(longRatio * 10) / 10,
    shortRatio: Math.round(shortRatio * 10) / 10,
    ratio: Math.round(ratio * 100) / 100,
    signal,
  };
}

/**
 * Calculate Top Traders indicator
 * Top traders shorting = smart money short = good for SHORT
 * Top traders longing = smart money long = bad for SHORT
 */
export function calculateTopTradersIndicator(
  data?: { longRatio: number; shortRatio: number; ratio: number }
): TopTradersIndicator {
  const longRatio = data?.longRatio ?? 50;
  const shortRatio = data?.shortRatio ?? 50;
  const ratio = data?.ratio ?? 1;
  
  // Signal: Top traders shorting = good for SHORT
  let signal: 'bullish' | 'bearish' | 'neutral';
  
  if (shortRatio >= 55) {
    // Top traders short (>55%) = good for SHORT
    signal = 'bearish';
  } else if (longRatio >= 55) {
    // Top traders long (>55%) = bad for SHORT
    signal = 'bullish';
  } else {
    signal = 'neutral';
  }
  
  return {
    longRatio: Math.round(longRatio * 10) / 10,
    shortRatio: Math.round(shortRatio * 10) / 10,
    ratio: Math.round(ratio * 100) / 100,
    signal,
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
    fundingRateHistory?: number[];
    longShortRatio?: { longRatio: number; shortRatio: number; ratio: number };
    topTradersRatio?: { longRatio: number; shortRatio: number; ratio: number };
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
    signal: (vwapData.deviation > 3 ? 'overbought' : vwapData.deviation < -3 ? 'oversold' : 'neutral') as 'overbought' | 'oversold' | 'neutral',
  };

  // ATR
  const atrData = calculateATR(candles);
  const atr = {
    value: atrData.value,
    percentage: Math.round(atrData.percentage * 100) / 100,
    volatility: (atrData.percentage > 5 ? 'high' : atrData.percentage < 2 ? 'low' : 'normal') as 'low' | 'high' | 'normal',
  };

  // 4H Trend (simplified - using EMA alignment)
  const fourHTrend = {
    trend: ema.trend,
    strength: (adx.trend === 'strong' ? 'strong' : adx.trend === 'moderate' ? 'moderate' : 'weak') as 'strong' | 'moderate' | 'weak',
  };

  // MACD Divergence - need raw arrays from calculateMACD
  const macdArrays = calculateMACD(candles);
  const macdDivergence = detectMACDDivergence(
    macdArrays.macd,
    macdArrays.signal,
    macdArrays.histogram,
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
    signal: 'ready',
    breakdown: {
      candlePatterns: {
        score: 0,
        maxScore: 20,
        detected: [],
        bullishWarning: [],
        summary: 'Недостаточно данных',
      },
      indicators: {
        score: 0,
        maxScore: 35,
        rsi5m: { value: rsi.value, score: 0, signal: 'neutral' },
        stochRsi: { k: 50, d: 50, cross: 'none', score: 0 },
        macd: { trend: 'neutral', histogramDeclining: false, score: 0 },
        divergence: { type: 'none', score: 0 },
      },
      volume: {
        score: 0,
        maxScore: 25,
        currentVsAvg: 1,
        sellingPressure: 50,
        spike: false,
      },
      pricePosition: {
        score: 0,
        maxScore: 20,
        atResistance: false,
        resistanceStrength: 'none',
        pullbackDepth: 50,
        rejectionWick: 0,
      },
    },
    recommendation: 'Используйте Multi-TF режим для анализа тайминга',
    reason: 'Single-TF mode - use Multi-TF for entry timing',
  };

  // Perpetual indicators
  const fundingRate = calculateFundingRateIndicator(
    perpetualData?.fundingRate,
    undefined,
    perpetualData?.fundingRateHistory
  );
  const openInterest = calculateOpenInterestIndicator(
    perpetualData?.openInterest,
    perpetualData?.oiChange24h,
    perpetualData?.priceChange24h
  );

  // Market sentiment indicators
  const longShortRatio = calculateLongShortRatioIndicator(perpetualData?.longShortRatio);
  const topTraders = calculateTopTradersIndicator(perpetualData?.topTradersRatio);

  // Order flow data (from exchange APIs)
  const orderBook: OrderBookIndicator = perpetualData?.orderBook || {
    bidVolume: 0,
    askVolume: 0,
    imbalance: 0,
    imbalancePercent: 0,
    bidWall: null,
    askWall: null,
    bidWallVolume: 0,
    askWallVolume: 0,
    spread: 0,
    depth: 0,
    signal: 'neutral',
    score: 0,
  };

  const liquidationHeatmap: LiquidationHeatmapIndicator = perpetualData?.liquidationHeatmap || {
    levels: [],
    totalLongLiquidations: 0,
    totalShortLiquidations: 0,
    nearestLongLiq: null,
    nearestShortLiq: null,
    longLiqDistance: 0,
    shortLiqDistance: 0,
    signal: 'neutral',
    score: 0,
  };

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
    longShortRatio,
    topTraders,
    orderBook,
    liquidationHeatmap,
  };
}

/**
 * Calculate Entry Timing v2.0 from 5m candles
 * DOES NOT affect main signal - only refines entry point
 * 
 * Scoring breakdown (0-100):
 * - Candle Patterns: 0-20 pts
 * - Indicators 5m: 0-35 pts (RSI, StochRSI, MACD, Divergence)
 * - Volume: 0-25 pts
 * - Price Position: 0-20 pts
 */
function calculateEntryTiming(
  candles5m: Candle[],
  candles15m: Candle[],
  currentPrice: number,
  entryZone: [number, number] | null
): EntryTimingIndicator {
  // Default fallback for insufficient data
  const defaultBreakdown: EntryTimingBreakdown = {
    candlePatterns: {
      score: 0,
      maxScore: 20,
      detected: [],
      bullishWarning: [],
      summary: 'Недостаточно данных',
    },
    indicators: {
      score: 0,
      maxScore: 35,
      rsi5m: { value: 50, score: 0, signal: 'neutral' },
      stochRsi: { k: 50, d: 50, cross: 'none', score: 0 },
      macd: { trend: 'neutral', histogramDeclining: false, score: 0 },
      divergence: { type: 'none', score: 0 },
    },
    volume: {
      score: 0,
      maxScore: 25,
      currentVsAvg: 1,
      sellingPressure: 50,
      spike: false,
    },
    pricePosition: {
      score: 0,
      maxScore: 20,
      atResistance: false,
      resistanceStrength: 'none',
      pullbackDepth: 50,
      rejectionWick: 0,
    },
  };

  // Need at least 20 candles for 5m analysis
  if (candles5m.length < 20) {
    return {
      quality: 'good',
      score: 50,
      signal: 'ready',
      breakdown: defaultBreakdown,
      recommendation: 'Недостаточно данных для анализа тайминга',
      reason: 'Insufficient 5m data',
    };
  }

  // ==================== 1. CANDLE PATTERNS (0-20 pts) ====================
  const bearishPatterns = detectBearishPatterns(candles5m);
  const bullishPatterns = detectBullishPatterns(candles5m);

  const candlePatternsScore = bearishPatterns.totalScore;
  const hasBullishWarning = bullishPatterns.hasHighReliability;

  // ==================== 2. INDICATORS 5m (0-35 pts) ====================
  // RSI 5m (0-15 pts)
  const rsi5m = getRSIIndicator(candles5m);
  const rsiValue = rsi5m.value;
  let rsiScore = 0;
  let rsiSignal: 'overbought' | 'elevated' | 'neutral' | 'oversold' = 'neutral';

  if (rsiValue >= 80) {
    rsiScore = 15;
    rsiSignal = 'overbought';
  } else if (rsiValue >= 70) {
    rsiScore = 12;
    rsiSignal = 'overbought';
  } else if (rsiValue >= 65) {
    rsiScore = 8;
    rsiSignal = 'elevated';
  } else if (rsiValue >= 55) {
    rsiScore = 3;
    rsiSignal = 'neutral';
  } else if (rsiValue <= 30) {
    rsiScore = -5;
    rsiSignal = 'oversold';
  } else if (rsiValue <= 40) {
    rsiScore = -2;
    rsiSignal = 'oversold';
  }

  // StochRSI 5m (0-10 pts)
  const stochRsi = getStochRSIIndicator(candles5m);
  let stochRsiScore = 0;
  let stochCross: 'bearish' | 'bullish' | 'none' = 'none';

  if (stochRsi.k > stochRsi.d && stochRsi.overbought) {
    // K above D in overbought = potential bearish cross soon
    stochRsiScore = 5;
  } else if (stochRsi.k < stochRsi.d && stochRsi.overbought) {
    // Bearish cross in overbought
    stochRsiScore = 10;
    stochCross = 'bearish';
  } else if (stochRsi.k < stochRsi.d && stochRsi.k > 80) {
    // Bearish cross forming
    stochRsiScore = 7;
    stochCross = 'bearish';
  } else if (stochRsi.k > stochRsi.d && stochRsi.oversold) {
    // Bullish cross in oversold (bad for short)
    stochRsiScore = -5;
    stochCross = 'bullish';
  }

  // MACD 5m (0-10 pts)
  const macd5m = getMACDIndicator(candles5m);
  let macdScore = 0;
  const histogramDeclining = (macd5m.histogram ?? 0) < 0;

  if (macd5m.trend === 'bearish') {
    macdScore = macd5m.strength === 'strong' ? 10 : 6;
  } else if (macd5m.crossover === 'bearish') {
    macdScore = 8;
  } else if (macd5m.trend === 'bullish' && histogramDeclining) {
    macdScore = 3; // Momentum weakening
  }

  // Divergence 5m (0-10 pts)
  const divergence5m = detectRSIDivergence(candles5m);
  let divScore = 0;

  if (divergence5m.type === 'bearish') {
    divScore = divergence5m.strength === 'strong' ? 10 : 6;
    if (divergence5m.confirmation) divScore += 2;
  }

  const indicatorsScore = Math.max(0, rsiScore) + stochRsiScore + macdScore + divScore;

  // ==================== 3. VOLUME (0-25 pts) ====================
  // Calculate average volume
  const volumes = candles5m.slice(-20).map(c => c.volume);
  const avgVolume = volumes.reduce((a, b) => a + b, 0) / volumes.length;
  const lastVolume = candles5m[candles5m.length - 1]?.volume || 0;
  const volumeRatio = avgVolume > 0 ? lastVolume / avgVolume : 1;

  // Calculate selling pressure (approximate from candle direction)
  const lastCandles = candles5m.slice(-5);
  let sellVolume = 0;
  let totalVol = 0;
  for (const c of lastCandles) {
    const vol = c.volume || 0;
    totalVol += vol;
    if (c.close < c.open) {
      sellVolume += vol; // Bearish candle = selling
    } else if (c.close > c.open) {
      sellVolume += vol * 0.3; // Partial selling in bullish
    }
  }
  const sellingPressure = totalVol > 0 ? (sellVolume / totalVol) * 100 : 50;

  let volumeScore = 0;
  const isVolumeSpike = volumeRatio > 1.5;

  if (isVolumeSpike) {
    volumeScore += Math.min(10, Math.round((volumeRatio - 1) * 10));
  }
  if (sellingPressure >= 70) {
    volumeScore += 10;
  } else if (sellingPressure >= 60) {
    volumeScore += 7;
  } else if (sellingPressure >= 55) {
    volumeScore += 4;
  } else if (sellingPressure < 40) {
    volumeScore -= 3; // Buying pressure dominant
  }

  volumeScore = Math.max(0, Math.min(25, volumeScore));

  // ==================== 4. PRICE POSITION (0-20 pts) ====================
  const bb = getBollingerBandsIndicator(candles5m);
  const ema = getEMAIndicator(candles5m);

  // Check if at resistance (upper BB, EMA resistance)
  const bbPosition = bb.position;
  const atResistance = bbPosition >= 85 || (currentPrice >= ema.ema200 && ema.ema200Distance > 5);
  const resistanceStrength: 'strong' | 'moderate' | 'weak' | 'none' = 
    bbPosition >= 95 ? 'strong' :
    bbPosition >= 90 ? 'moderate' :
    atResistance ? 'weak' : 'none';

  // Rejection wick analysis
  const lastCandle = candles5m[candles5m.length - 1];
  const bodySize = Math.abs(lastCandle.close - lastCandle.open);
  const upperWick = lastCandle.high - Math.max(lastCandle.open, lastCandle.close);
  const rejectionWick = bodySize > 0 ? Math.round((upperWick / bodySize) * 100) : 0;

  let pricePositionScore = 0;

  // At resistance bonus
  if (resistanceStrength === 'strong') {
    pricePositionScore += 10;
  } else if (resistanceStrength === 'moderate') {
    pricePositionScore += 7;
  } else if (resistanceStrength === 'weak') {
    pricePositionScore += 4;
  }

  // Rejection wick bonus
  if (rejectionWick >= 150) {
    pricePositionScore += 10;
  } else if (rejectionWick >= 100) {
    pricePositionScore += 7;
  } else if (rejectionWick >= 50) {
    pricePositionScore += 4;
  }

  // Pullback depth (if entry zone provided)
  let pullbackDepth = 50;
  if (entryZone && entryZone[1] > entryZone[0]) {
    const range = entryZone[1] - entryZone[0];
    if (range > 0) {
      pullbackDepth = Math.min(100, Math.max(0,
        ((currentPrice - entryZone[0]) / range) * 100
      ));
    }
  }

  pricePositionScore = Math.min(20, pricePositionScore);

  // ==================== CALCULATE TOTAL SCORE ====================
  const totalScore = candlePatternsScore + indicatorsScore + volumeScore + pricePositionScore;

  // ==================== DETERMINE SIGNAL ====================
  let quality: 'optimal' | 'good' | 'early' | 'late';
  let signal: 'wait' | 'ready' | 'enter_now';
  let recommendation = '';
  let waitTime: string | undefined;

  // Bullish pattern warning reduces quality
  const adjustedScore = hasBullishWarning ? totalScore - 15 : totalScore;

  if (adjustedScore >= 75 && bearishPatterns.hasHighReliability) {
    quality = 'optimal';
    signal = 'enter_now';
    recommendation = 'Отличный момент для входа — надёжный паттерн подтверждён';
  } else if (adjustedScore >= 70) {
    quality = 'optimal';
    signal = 'enter_now';
    recommendation = 'Оптимальный момент для входа';
  } else if (adjustedScore >= 55) {
    quality = 'good';
    signal = 'ready';
    recommendation = 'Хороший момент, можно входить';
  } else if (adjustedScore >= 40) {
    quality = 'early';
    signal = 'wait';
    recommendation = 'Рановато, подождите подтверждения';
    waitTime = '5-15 мин';
  } else {
    quality = 'late';
    signal = 'wait';
    recommendation = 'Неблагоприятный момент — подождите';
    waitTime = '15-30 мин';
  }

  // Additional warnings
  if (rsiSignal === 'oversold') {
    recommendation += ' (RSI перепродан)';
  }
  if (hasBullishWarning) {
    recommendation = '⚠️ ' + recommendation + ' — есть бычьи паттерны';
  }

  // Build breakdown
  const breakdown: EntryTimingBreakdown = {
    candlePatterns: {
      score: candlePatternsScore,
      maxScore: 20,
      detected: bearishPatterns.patterns.map(p => ({
        name: p.name,
        nameRu: p.nameRu,
        reliability: p.reliability,
        score: p.score,
      })),
      bullishWarning: bullishPatterns.patterns.map(p => ({
        name: p.name,
        nameRu: p.nameRu,
        reliability: p.reliability,
        score: p.score,
      })),
      summary: bearishPatterns.summary,
    },
    indicators: {
      score: Math.min(35, indicatorsScore),
      maxScore: 35,
      rsi5m: {
        value: Math.round(rsiValue * 10) / 10,
        score: Math.max(0, rsiScore),
        signal: rsiSignal,
      },
      stochRsi: {
        k: Math.round(stochRsi.k),
        d: Math.round(stochRsi.d),
        cross: stochCross,
        score: Math.max(0, stochRsiScore),
      },
      macd: {
        trend: macd5m.trend,
        histogramDeclining,
        score: macdScore,
      },
      divergence: {
        type: divergence5m.type,
        score: divScore,
      },
    },
    volume: {
      score: volumeScore,
      maxScore: 25,
      currentVsAvg: Math.round(volumeRatio * 100) / 100,
      sellingPressure: Math.round(sellingPressure),
      spike: isVolumeSpike,
    },
    pricePosition: {
      score: pricePositionScore,
      maxScore: 20,
      atResistance,
      resistanceStrength,
      pullbackDepth: Math.round(pullbackDepth),
      rejectionWick,
    },
  };

  return {
    quality,
    score: Math.min(100, Math.max(0, Math.round(totalScore))),
    signal,
    breakdown,
    recommendation,
    waitTime,
    reason: `${bearishPatterns.summary || 'Нет паттернов'} | RSI: ${Math.round(rsiValue)} | Vol: ${(volumeRatio * 100).toFixed(0)}%`,
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
    fundingRateHistory?: number[];
    longShortRatio?: { longRatio: number; shortRatio: number; ratio: number };
    topTradersRatio?: { longRatio: number; shortRatio: number; ratio: number };
    orderBook?: OrderBookIndicator | null;
    liquidationHeatmap?: LiquidationHeatmapIndicator | null;
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
    signal: (vwapData.deviation > 3 ? 'overbought' : vwapData.deviation < -3 ? 'oversold' : 'neutral') as 'overbought' | 'oversold' | 'neutral',
  };

  // ATR
  const atrData = calculateATR(mainCandles);
  const atr = {
    value: atrData.value,
    percentage: Math.round(atrData.percentage * 100) / 100,
    volatility: (atrData.percentage > 5 ? 'high' : atrData.percentage < 2 ? 'low' : 'normal') as 'low' | 'high' | 'normal',
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
    strength: (adx4h.trend === 'strong' ? 'strong' : adx4h.trend === 'moderate' ? 'moderate' : 'weak') as 'strong' | 'moderate' | 'weak',
  };

  // MACD Divergence - need raw arrays from calculateMACD
  const macdArrays = calculateMACD(mainCandles);
  const macdDivergence = detectMACDDivergence(
    macdArrays.macd,
    macdArrays.signal,
    macdArrays.histogram,
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
  const fundingRate = calculateFundingRateIndicator(
    perpetualData?.fundingRate,
    undefined,
    perpetualData?.fundingRateHistory
  );
  const openInterest = calculateOpenInterestIndicator(
    perpetualData?.openInterest,
    perpetualData?.oiChange24h,
    perpetualData?.priceChange24h
  );

  // Market sentiment indicators
  const longShortRatio = calculateLongShortRatioIndicator(perpetualData?.longShortRatio);
  const topTraders = calculateTopTradersIndicator(perpetualData?.topTradersRatio);

  // Order flow data (from exchange APIs)
  const orderBook: OrderBookIndicator = perpetualData?.orderBook || {
    bidVolume: 0,
    askVolume: 0,
    imbalance: 0,
    imbalancePercent: 0,
    bidWall: null,
    askWall: null,
    bidWallVolume: 0,
    askWallVolume: 0,
    spread: 0,
    depth: 0,
    signal: 'neutral',
    score: 0,
  };

  const liquidationHeatmap: LiquidationHeatmapIndicator = perpetualData?.liquidationHeatmap || {
    levels: [],
    totalLongLiquidations: 0,
    totalShortLiquidations: 0,
    nearestLongLiq: null,
    nearestShortLiq: null,
    longLiqDistance: 0,
    shortLiqDistance: 0,
    signal: 'neutral',
    score: 0,
  };

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
    longShortRatio,
    topTraders,
    orderBook,
    liquidationHeatmap,
  };
}
