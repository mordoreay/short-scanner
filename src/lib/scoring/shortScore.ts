import { Indicators, ShortScoreBreakdown } from '@/types/scanner';

/**
 * SHORT Score Calculator v2.1 - PERPETUAL Edition
 * Calculates a weighted score (0-100) for SHORT setup quality
 * 
 * IMPORTANT: For SHORT setups on gainers, bullish EMA/trend is EXPECTED.
 * We score based on OVERBOUGHT conditions and REVERSAL signals.
 * 
 * Categories:
 * - Momentum (30%): RSI overbought, StochRSI, MACD bearish signals
 * - Price Action (20%): Price change magnitude, BB position, VWAP deviation
 * - Divergence (15%): RSI divergence, MACD divergence
 * - Volume (10%): OBV, Fake Pump detection
 * - Perpetual (15%): Funding Rate, Open Interest
 * - Risk Adjustments: Critical factors that can boost/penalize
 */

export function calculateShortScore(
  indicators: Indicators, 
  priceChange24h: number = 20
): ShortScoreBreakdown {
  // ==================== MOMENTUM SCORE (0-30) ====================
  // Primary indicator for SHORT - overbought conditions
  let momentumScore = 0;
  
  // RSI (max 12) - CRITICAL for SHORT
  if (indicators.rsi.value >= 80) {
    momentumScore += 12;  // Extreme overbought
  } else if (indicators.rsi.value >= 75) {
    momentumScore += 10;  // Strong overbought
  } else if (indicators.rsi.value >= 70) {
    momentumScore += 8;   // Overbought
  } else if (indicators.rsi.value >= 65) {
    momentumScore += 5;   // Elevated
  } else if (indicators.rsi.value >= 60) {
    momentumScore += 3;   // Slightly elevated
  } else if (indicators.rsi.value <= 30) {
    momentumScore -= 8;   // Penalty: oversold = bad for short
  }
  
  // StochRSI (max 6)
  if (indicators.stochRsi.overbought) {
    momentumScore += 6;
  } else if (indicators.stochRsi.k > 85) {
    momentumScore += 4;
  } else if (indicators.stochRsi.k > 80) {
    momentumScore += 2;
  } else if (indicators.stochRsi.oversold) {
    momentumScore -= 4;
  }
  
  // MACD (max 6) - bearish signal is bonus
  if (indicators.macd.trend === 'bearish') {
    momentumScore += indicators.macd.strength === 'strong' ? 6 :
                     indicators.macd.strength === 'moderate' ? 4 : 2;
  }
  if (indicators.macd.crossover === 'bearish') {
    momentumScore += 3;
  }
  
  // ADX strength (max 3) - trending market
  if (indicators.adx.value > 25) {
    momentumScore += 2;
    if (indicators.adx.signal === 'bearish') {
      momentumScore += 1;
    }
  }

  // ==================== PRICE ACTION SCORE (0-20) ====================
  // How extended is the price - key for SHORT
  let priceActionScore = 0;
  
  // Price change magnitude - BIGGER PUMP = MORE OVEREXTENDED
  if (priceChange24h >= 50) {
    priceActionScore += 8;  // Extreme pump - great short opportunity
  } else if (priceChange24h >= 35) {
    priceActionScore += 6;  // Strong pump
  } else if (priceChange24h >= 25) {
    priceActionScore += 4;  // Moderate pump
  } else if (priceChange24h >= 15) {
    priceActionScore += 2;  // Normal pump
  }
  
  // Bollinger Bands position (max 6)
  if (indicators.bollingerBands.position > 95) {
    priceActionScore += 6;  // At extreme upper
  } else if (indicators.bollingerBands.position > 90) {
    priceActionScore += 5;
  } else if (indicators.bollingerBands.position > 80) {
    priceActionScore += 4;
  } else if (indicators.bollingerBands.position > 70) {
    priceActionScore += 2;
  }
  
  // VWAP deviation (max 6) - price above VWAP = good for short
  if (indicators.vwap.deviation > 8) {
    priceActionScore += 6;  // Very extended
  } else if (indicators.vwap.deviation > 5) {
    priceActionScore += 5;
  } else if (indicators.vwap.deviation > 3) {
    priceActionScore += 3;
  } else if (indicators.vwap.deviation > 1) {
    priceActionScore += 1;
  } else if (indicators.vwap.deviation < -3) {
    priceActionScore -= 3; // Price below VWAP = bad for short
  }

  // ==================== DIVERGENCE SCORE (0-15) ====================
  let divergenceScore = 0;
  
  // RSI divergence (max 10)
  if (indicators.rsiDivergence.type === 'bearish') {
    divergenceScore += indicators.rsiDivergence.strength === 'strong' ? 10 :
                       indicators.rsiDivergence.strength === 'moderate' ? 7 : 4;
    if (indicators.rsiDivergence.confirmation) {
      divergenceScore += 3;
    }
  }
  
  // MACD divergence (max 5)
  if (indicators.macdDivergence.type === 'bearish') {
    divergenceScore += indicators.macdDivergence.strength === 'strong' ? 5 :
                       indicators.macdDivergence.strength === 'moderate' ? 3 : 1;
  }

  // ==================== VOLUME SCORE (0-10) ====================
  let volumeScore = 0;
  
  // OBV trend (max 4) - falling OBV = distribution
  if (indicators.obv.trend === 'bearish') {
    volumeScore += 4;
  }
  
  // OBV divergence (max 3)
  if (indicators.obv.divergence === 'bearish') {
    volumeScore += indicators.obv.divergenceStrength === 'strong' ? 3 :
                   indicators.obv.divergenceStrength === 'moderate' ? 2 : 1;
  }
  
  // Fake pump (max 3)
  if (indicators.fakePump.isFake) {
    volumeScore += Math.min(indicators.fakePump.confidence / 30, 3);
  }

  // ==================== PERPETUAL SCORE (0-15) ====================
  let perpetualScore = 0;
  
  // Funding Rate
  const fundingRate = indicators.fundingRate.rate;
  const fundingAnnualized = indicators.fundingRate.annualized;
  
  // For SHORT: Positive funding = shorts pay = crowd is short = good
  // But extreme funding = short squeeze risk
  if (fundingRate > 0.001) {
    // Very high positive funding (>0.1%) = DANGER - short squeeze risk
    perpetualScore -= 4;
  } else if (fundingRate > 0.0005) {
    // High positive funding - some risk
    perpetualScore -= 1;
  } else if (fundingRate > 0.0001) {
    // Slight positive = ideal for SHORT
    perpetualScore += 6;
  } else if (fundingRate > -0.0001) {
    // Neutral = good
    perpetualScore += 5;
  } else if (fundingRate > -0.0005) {
    // Slight negative = longs paying
    perpetualScore += 3;
  } else {
    // Very negative funding = extreme long bias
    perpetualScore += 4;
  }
  
  // Open Interest
  const oiInterpretation = indicators.openInterest.interpretation;
  
  if (oiInterpretation === 'bearish') {
    // OI up + Price down = new shorts entering
    perpetualScore += 6;
  } else if (oiInterpretation === 'neutral') {
    perpetualScore += 3;
  }
  // OI up + Price up = new longs (bullish) - no bonus

  // ==================== TREND CONTEXT (0-10) ====================
  // For SHORT on gainers, bullish trend is EXPECTED
  // We score based on REVERSAL signals, not trend direction
  let trendScore = 0;
  
  // Multi-TF alignment - mixed is actually good for reversal
  if (indicators.multiTFAlignment.direction === 'bearish') {
    trendScore += 8;  // Perfect - all TFs bearish
  } else if (indicators.multiTFAlignment.direction === 'mixed') {
    trendScore += 5;  // Good - divergence between TFs = potential reversal
  }
  // bullish direction = 0 points (expected for gainers)
  
  // 4H trend strength
  if (indicators.fourHTrend.trend === 'bearish') {
    trendScore += 2;
  }

  // ==================== CRITICAL ADJUSTMENTS ====================
  let criticalBonus = 0;
  let criticalPenalty = 0;
  
  // BONUS CONDITIONS (stackable, max +20)
  
  // Perfect SHORT setup: RSI > 75 + BB > 85 + Price pump > 25%
  if (indicators.rsi.value > 75 && 
      indicators.bollingerBands.position > 85 && 
      priceChange24h > 25) {
    criticalBonus += 8;
  }
  
  // Extreme overbought (RSI > 80)
  if (indicators.rsi.value > 80) {
    criticalBonus += 5;
  }
  
  // Confirmed divergence
  if (indicators.rsiDivergence.type === 'bearish' && 
      indicators.rsiDivergence.confirmation) {
    criticalBonus += 5;
  }
  
  // Fake pump with high confidence
  if (indicators.fakePump.isFake && indicators.fakePump.confidence > 70) {
    criticalBonus += 5;
  }
  
  // StochRSI extreme
  if (indicators.stochRsi.k > 90 && indicators.stochRsi.d > 90) {
    criticalBonus += 3;
  }

  // PENALTY CONDITIONS (stackable, max -20)
  
  // RSI oversold = terrible for short
  if (indicators.rsi.value < 25) {
    criticalPenalty += 12;
  } else if (indicators.rsi.value < 30) {
    criticalPenalty += 6;
  }
  
  // Extreme funding = short squeeze risk
  if (fundingAnnualized > 50) {
    criticalPenalty += 10;
  } else if (fundingAnnualized > 30) {
    criticalPenalty += 5;
  }
  
  // Price already dropped significantly
  if (priceChange24h < 5) {
    criticalPenalty += 5;
  }
  
  // Strong bullish divergence = counter signal
  if (indicators.rsiDivergence.type === 'bullish' && 
      indicators.rsiDivergence.strength === 'strong') {
    criticalPenalty += 6;
  }
  
  // BB position too low
  if (indicators.bollingerBands.position < 30) {
    criticalPenalty += 4;
  }

  // ==================== FINAL CALCULATION ====================
  const rawScore = momentumScore + priceActionScore + divergenceScore + 
                   volumeScore + perpetualScore + trendScore + 
                   criticalBonus - criticalPenalty;
  
  const total = Math.max(0, Math.min(100, Math.round(rawScore)));
  
  // Determine risk level
  let riskLevel: 'low' | 'medium' | 'high';
  if (total >= 55 && criticalPenalty === 0) {
    riskLevel = 'low';
  } else if (total >= 35 || (total >= 40 && criticalPenalty < 8)) {
    riskLevel = 'medium';
  } else {
    riskLevel = 'high';
  }

  return {
    total,
    trend: Math.round(trendScore),
    momentum: Math.round(momentumScore),
    volatility: Math.round(priceActionScore), // renamed for UI
    volume: Math.round(volumeScore),
    divergence: Math.round(divergenceScore),
    riskLevel,
  };
}

/**
 * Get color class based on score
 */
export function getScoreColor(score: number): string {
  if (score >= 60) return 'text-green-500';
  if (score >= 40) return 'text-yellow-500';
  return 'text-red-500';
}

/**
 * Get background color class based on score
 */
export function getScoreBgColor(score: number): string {
  if (score >= 60) return 'bg-green-500/20 border-green-500/50';
  if (score >= 40) return 'bg-yellow-500/20 border-yellow-500/50';
  return 'bg-red-500/20 border-red-500/50';
}

/**
 * Calculate confidence based on SHORT score and setup type
 * Confidence = SHORT Score adjusted by setup-specific factors
 */
export function calculateConfidence(
  shortScore: number,
  setupType: string,
  indicators: Indicators
): number {
  let confidence = shortScore;
  
  // Adjust based on setup type reliability
  const setupReliability: Record<string, number> = {
    'divergence': 1.05,         // Most reliable - classic signal
    'oiDivergence': 1.08,       // Very reliable - perpetual specific
    'fakePump': 1.00,           // Good if confirmed
    'structureBreak': 1.02,     // Strong signal - trend change
    'doubleTop': 0.98,          // Classic reversal pattern
    'resistanceRejection': 0.95,// Moderate - depends on level strength
    'rejection': 0.95,          // Moderate - BB+RSI
    'levelBreakout': 0.92,      // Depends on level importance
    'breakout': 0.90,           // Less reliable - can be fake
    'meanReversion': 0.85,      // Least reliable - counter trend
  };
  
  const reliability = setupReliability[setupType] || 0.90;
  confidence = Math.round(confidence * reliability);
  
  // Cap at 95 (never 100% confident)
  return Math.min(95, Math.max(20, confidence));
}
