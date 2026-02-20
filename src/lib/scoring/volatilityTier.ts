/**
 * Score-Based TIER Detection System v2.0
 * Automatic TIER detection without hardcoded lists
 * 
 * Factors:
 * - Price (memecoins are cheap)
 * - ATR volatility (historical + current)
 * - Price change 24h
 * - Coin age (new coins are more volatile)
 * - Volume spikes
 */

import { Candle } from '@/types/scanner';
import { Tier } from './tierConfig';

// ==================== VOLATILITY METRICS ====================

export interface VolatilityMetrics {
  atr24h: number;
  atr7d: number;
  atr14d: number;
  priceChange24h: number;
  avgVolume: number;
  currentVolume: number;
  volumeRatio: number;
  isVolatile: boolean;
  currentPrice: number;
  candleCount: number;
}

// ==================== ATR CALCULATION ====================

export function calculateATRPercent(candles: Candle[], period: number = 14): number {
  if (candles.length < period + 1) return 5;
  
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
  
  const recentTR = trueRanges.slice(-period);
  const atr = recentTR.reduce((sum, tr) => sum + tr, 0) / recentTR.length;
  
  const currentPrice = candles[candles.length - 1].close;
  const atrPercent = (atr / currentPrice) * 100;
  
  return atrPercent;
}

export function calculateVolatilityMetrics(
  candles: Candle[],
  priceChange24h: number = 0,
  currentVolume: number = 0
): VolatilityMetrics {
  const currentPrice = candles.length > 0 ? candles[candles.length - 1].close : 0;
  const candleCount = candles.length;
  
  if (candles.length < 50) {
    let estimatedAtr = 5;
    
    if (candles.length >= 14) {
      estimatedAtr = calculateATRPercent(candles, Math.min(candles.length - 1, 14));
    } else if (candles.length >= 5) {
      const prices = candles.map(c => c.close);
      const high = Math.max(...prices);
      const low = Math.min(...prices);
      const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
      estimatedAtr = ((high - low) / avg) * 100;
    }
    
    const adjustedAtr = Math.max(estimatedAtr, Math.abs(priceChange24h) / 3);
    
    const volumes = candles.length >= 5 
      ? candles.slice(-24).map(c => c.volume) 
      : [currentVolume || 1];
    const avgVolume = volumes.reduce((sum, v) => sum + v, 0) / volumes.length;
    const volRatio = avgVolume > 0 ? (currentVolume || avgVolume) / avgVolume : 1;
    
    return {
      atr24h: adjustedAtr,
      atr7d: adjustedAtr,
      atr14d: adjustedAtr,
      priceChange24h,
      avgVolume,
      currentVolume: currentVolume || avgVolume,
      volumeRatio: volRatio,
      isVolatile: adjustedAtr > 8 || Math.abs(priceChange24h) > 25,
      currentPrice,
      candleCount,
    };
  }
  
  const atr24h = calculateATRPercent(candles.slice(-24), 14);
  const atr7d = calculateATRPercent(candles.slice(-168), 14);
  const atr14d = calculateATRPercent(candles.slice(-336), 14);
  
  const volumes = candles.slice(-168).map(c => c.volume);
  const avgVolume = volumes.reduce((sum, v) => sum + v, 0) / volumes.length;
  const lastVolume = currentVolume || candles[candles.length - 1]?.volume || avgVolume;
  const volumeRatio = avgVolume > 0 ? lastVolume / avgVolume : 1;
  
  const isVolatile = atr24h > 8 || atr14d > 12;
  
  return {
    atr24h,
    atr7d,
    atr14d,
    priceChange24h,
    avgVolume,
    currentVolume: lastVolume,
    volumeRatio,
    isVolatile,
    currentPrice,
    candleCount,
  };
}

// ==================== SCORE-BASED TIER DETECTION ====================

interface TierScoreFactors {
  priceScore: number;
  atrScore: number;
  priceChangeScore: number;
  ageScore: number;
  volumeScore: number;
  totalScore: number;
  breakdown: string[];
}

/**
 * Calculate TIER score based on multiple factors
 * 
 * Score ranges:
 * - 0-1.5: TIER 1 (Large Caps) - stable, low volatility
 * - 1.5-3.5: TIER 2 (Mid Caps) - moderate volatility  
 * - 3.5+:    TIER 3 (Memecoins) - high volatility
 */
function calculateTierScore(
  volatility: VolatilityMetrics,
  priceChange24h: number
): TierScoreFactors {
  let priceScore = 0;
  let atrScore = 0;
  let priceChangeScore = 0;
  let ageScore = 0;
  let volumeScore = 0;
  const breakdown: string[] = [];
  
  const price = volatility.currentPrice;
  
  // ========== PRICE FACTOR (0-3 points) ==========
  // Мемкоины обычно очень дешёвые, но не все!
  // DOGE = $0.4, PEPE = $0.00001, SHIB = $0.00002
  if (price > 0 && price < 0.0001) {
    priceScore = 3;  // < $0.0001 - точно мемкоин (PEPE, SHIB, BONK)
    breakdown.push(`Price: $${price.toExponential(1)} (<$0.0001) → +3`);
  } else if (price > 0 && price < 0.001) {
    priceScore = 2.5;
    breakdown.push(`Price: $${price.toFixed(6)} (<$0.001) → +2.5`);
  } else if (price > 0 && price < 0.01) {
    priceScore = 1.5;
    breakdown.push(`Price: $${price.toFixed(5)} (<$0.01) → +1.5`);
  } else if (price > 0 && price < 0.5) {
    priceScore = 1;  // $0.01 - $0.5 = mid/meme boundary (DOGE, WIF area)
    breakdown.push(`Price: $${price.toFixed(4)} (<$0.5) → +1`);
  } else if (price >= 10) {
    priceScore = 0;
    breakdown.push(`Price: $${price.toFixed(2)} (≥$10) → +0`);
  } else {
    priceScore = 0.5;  // $0.5 - $10 = mid/large cap
    breakdown.push(`Price: $${price.toFixed(3)} ($0.5-$10) → +0.5`);
  }
  
  // ========== ATR VOLATILITY (0-3 points) ==========
  // Ключевой фактор! Реальные пороги:
  // Large caps: 2-5% ATR
  // Mid caps: 5-10% ATR
  // Memecoins: 10%+ ATR
  const avgAtr = (volatility.atr24h + volatility.atr14d) / 2;
  
  if (avgAtr > 20) {
    atrScore = 3;
    breakdown.push(`ATR avg: ${avgAtr.toFixed(1)}% (>20%) → +3`);
  } else if (avgAtr > 12) {
    atrScore = 2.5;
    breakdown.push(`ATR avg: ${avgAtr.toFixed(1)}% (>12%) → +2.5`);
  } else if (avgAtr > 8) {
    atrScore = 1.5;
    breakdown.push(`ATR avg: ${avgAtr.toFixed(1)}% (>8%) → +1.5`);
  } else if (avgAtr > 5) {
    atrScore = 1;
    breakdown.push(`ATR avg: ${avgAtr.toFixed(1)}% (>5%) → +1`);
  } else {
    atrScore = 0;
    breakdown.push(`ATR avg: ${avgAtr.toFixed(1)}% (≤5%) → +0`);
  }
  
  // ========== PRICE CHANGE 24H (0-2 points) ==========
  // Large caps: <10%/day
  // Mid caps: 10-30%/day
  // Memecoins: 30%+/day
  const absChange = Math.abs(priceChange24h);
  
  if (absChange > 80) {
    priceChangeScore = 2;
    breakdown.push(`24h Change: ${absChange.toFixed(0)}% (>80%) → +2`);
  } else if (absChange > 50) {
    priceChangeScore = 1.5;
    breakdown.push(`24h Change: ${absChange.toFixed(0)}% (>50%) → +1.5`);
  } else if (absChange > 25) {
    priceChangeScore = 1;
    breakdown.push(`24h Change: ${absChange.toFixed(0)}% (>25%) → +1`);
  } else if (absChange > 10) {
    priceChangeScore = 0.5;
    breakdown.push(`24h Change: ${absChange.toFixed(0)}% (>10%) → +0.5`);
  } else {
    priceChangeScore = 0;
    breakdown.push(`24h Change: ${absChange.toFixed(0)}% (≤10%) → +0`);
  }
  
  // ========== COIN AGE (0-2 points) ==========
  // Новые монеты более волатильны
  const candleCount = volatility.candleCount;
  
  if (candleCount < 24) {
    ageScore = 2;  // < 1 день данных
    breakdown.push(`Age: ${candleCount} candles (<1 day) → +2 [NEW]`);
  } else if (candleCount < 100) {
    ageScore = 1.5;
    breakdown.push(`Age: ${candleCount} candles (<4 days) → +1.5`);
  } else if (candleCount < 336) {
    ageScore = 0.5;
    breakdown.push(`Age: ${candleCount} candles (<2 weeks) → +0.5`);
  } else {
    ageScore = 0;
    breakdown.push(`Age: ${candleCount} candles (≥2 weeks) → +0`);
  }
  
  // ========== VOLUME SPIKE (0-1 point) ==========
  // Экстремальный volume spike = возможный памп/дамп
  if (volatility.volumeRatio > 10) {
    volumeScore = 1;
    breakdown.push(`Volume: ${volatility.volumeRatio.toFixed(1)}x (>10x) → +1`);
  } else if (volatility.volumeRatio > 5) {
    volumeScore = 0.5;
    breakdown.push(`Volume: ${volatility.volumeRatio.toFixed(1)}x (>5x) → +0.5`);
  } else {
    volumeScore = 0;
    breakdown.push(`Volume: ${volatility.volumeRatio.toFixed(1)}x (normal) → +0`);
  }
  
  const totalScore = priceScore + atrScore + priceChangeScore + ageScore + volumeScore;
  
  return {
    priceScore,
    atrScore,
    priceChangeScore,
    ageScore,
    volumeScore,
    totalScore,
    breakdown,
  };
}

/**
 * Convert score to TIER
 * 
 * Score 0-1.5:   TIER 1 (Large Caps - stable, low volatility)
 * Score 1.5-3.5: TIER 2 (Mid Caps - moderate volatility)
 * Score 3.5+:    TIER 3 (Memecoins - high volatility)
 */
function scoreToTier(score: number): Tier {
  if (score < 1.5) return 1;
  if (score < 3.5) return 2;
  return 3;
}

// ==================== MAIN DETECTION FUNCTION ====================

export interface TierDetectionResult {
  tier: Tier;
  baseTier: Tier;
  currentTier: Tier;
  volatility: VolatilityMetrics;
  source: 'score' | 'list' | 'default';
  confidence: number;
  isNewCoin: boolean;
  volumeAdjusted: boolean;
  volumeReason?: string;
  scoreFactors?: TierScoreFactors;
}

export function detectTierByVolatility(
  symbol: string,
  candles: Candle[],
  priceChange24h: number = 0,
  predefinedTier?: Tier,
  currentVolume?: number
): TierDetectionResult {
  
  const volatility = calculateVolatilityMetrics(candles, priceChange24h, currentVolume);
  const isNewCoin = candles.length < 100;
  
  // Calculate score-based TIER
  const scoreFactors = calculateTierScore(volatility, priceChange24h);
  const scoreTier = scoreToTier(scoreFactors.totalScore);
  
  // If predefined tier from list, use it but adjust with score
  if (predefinedTier !== undefined) {
    // Score может переопределить list, если разница большая
    let finalTier = predefinedTier;
    
    // Если score говорит о более высоком TIER, доверяем score
    if (scoreTier > predefinedTier) {
      finalTier = scoreTier;
    }
    // Если score говорит о более низком TIER и это новая монета - доверяем score
    else if (scoreTier < predefinedTier && isNewCoin) {
      finalTier = scoreTier;
    }
    
    return {
      tier: finalTier,
      baseTier: predefinedTier,
      currentTier: scoreTier,
      volatility,
      source: 'list',
      confidence: Math.max(10, Math.min(100, 85 + (isNewCoin ? -10 : 0))),
      isNewCoin,
      volumeAdjusted: false,
      volumeReason: undefined,
      scoreFactors,
    };
  }
  
  // Pure score-based detection
  const confidence = calculateConfidence(candles.length, volatility, scoreFactors.totalScore);
  
  return {
    tier: scoreTier,
    baseTier: scoreTier,
    currentTier: scoreTier,
    volatility,
    source: 'score',
    confidence,
    isNewCoin,
    volumeAdjusted: false,
    volumeReason: undefined,
    scoreFactors,
  };
}

/**
 * Calculate confidence based on data quality and score consistency
 */
function calculateConfidence(
  candleCount: number,
  volatility: VolatilityMetrics,
  score: number
): number {
  let confidence = 50;
  
  // More data = higher confidence
  if (candleCount >= 336) confidence += 25;
  else if (candleCount >= 168) confidence += 15;
  else if (candleCount >= 100) confidence += 10;
  else if (candleCount >= 50) confidence += 5;
  else {
    confidence -= 15;
  }
  
  // Consistent volatility = higher confidence
  const volatilityDiff = Math.abs(volatility.atr24h - volatility.atr14d);
  if (volatilityDiff < 2) confidence += 10;
  else if (volatilityDiff < 5) confidence += 5;
  else if (volatilityDiff > 10) confidence -= 10;
  
  // Clear score boundaries = higher confidence
  // Score near TIER boundaries (1.5, 3.5) = lower confidence
  const scoreFromBoundary = Math.min(
    Math.abs(score - 1.5),
    Math.abs(score - 3.5)
  );
  if (scoreFromBoundary > 1.0) confidence += 10;
  else if (scoreFromBoundary < 0.3) confidence -= 15;
  
  // Normal volume = higher confidence
  if (volatility.volumeRatio >= 0.5 && volatility.volumeRatio <= 3) {
    confidence += 5;
  }
  
  return Math.max(10, Math.min(100, confidence));
}

// ==================== CACHE ====================

interface TierCacheEntry {
  symbol: string;
  result: TierDetectionResult;
  timestamp: number;
}

const tierCache = new Map<string, TierCacheEntry>();
const CACHE_TTL = 4 * 60 * 60 * 1000; // 4 hours

export function getCachedTier(
  symbol: string,
  candles: Candle[],
  priceChange24h: number = 0,
  predefinedTier?: Tier,
  currentVolume?: number
): TierDetectionResult {
  const cached = tierCache.get(symbol);
  
  const vol = currentVolume || (candles.length > 0 ? candles[candles.length - 1]?.volume : 0);
  
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    // Update volume metrics from fresh data
    const freshVolume = calculateVolatilityMetrics(candles, priceChange24h, vol);
    
    return {
      ...cached.result,
      volatility: {
        ...cached.result.volatility,
        ...freshVolume,
        priceChange24h,
      },
      volumeAdjusted: false,
    };
  }
  
  const result = detectTierByVolatility(symbol, candles, priceChange24h, predefinedTier, vol);
  
  tierCache.set(symbol, {
    symbol,
    result,
    timestamp: Date.now(),
  });
  
  return result;
}

export function clearTierCache(): void {
  tierCache.clear();
}

// ==================== DEBUG INFO ====================

export function getTierDebugInfo(result: TierDetectionResult): string {
  const { tier, volatility, source, confidence, isNewCoin, scoreFactors } = result;
  
  const lines = [
    `TIER: ${tier} (confidence: ${confidence}%)${isNewCoin ? ' [NEW COIN]' : ''}`,
    `  Source: ${source}`,
    `  Price: $${volatility.currentPrice < 0.001 ? volatility.currentPrice.toExponential(2) : volatility.currentPrice.toFixed(6)}`,
    `  ATR 24h: ${volatility.atr24h.toFixed(1)}% | 14d: ${volatility.atr14d.toFixed(1)}%`,
    `  24h Change: ${volatility.priceChange24h.toFixed(1)}%`,
    `  Volume: ${volatility.volumeRatio.toFixed(1)}x avg`,
    `  Candles: ${volatility.candleCount}`,
  ];
  
  if (scoreFactors) {
    lines.push(`  --- SCORE BREAKDOWN ---`);
    lines.push(`  Total Score: ${scoreFactors.totalScore.toFixed(1)} → TIER ${tier}`);
    scoreFactors.breakdown.forEach(b => lines.push(`  ${b}`));
  }
  
  return lines.join('\n');
}
