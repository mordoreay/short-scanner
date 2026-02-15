import { Indicators, ShortScoreBreakdown } from '@/types/scanner';

/**
 * SHORT Score Calculator v2.0 - PERPETUAL Edition
 * Calculates a weighted score (0-100) for SHORT setup quality
 * 
 * Categories:
 * - Trend (25%): EMA alignment, 4H trend, Multi-TF alignment
 * - Momentum (20%): RSI, MACD, StochRSI, Bollinger Bands
 * - Perpetual (15%): Funding Rate, Open Interest
 * - Divergence (15%): RSI divergence, MACD divergence
 * - Volume (10%): OBV, Fake Pump detection
 * - Position (10%): VWAP deviation, BB position
 * - Risk Adjustments: Critical factors that can boost/penalize
 */

export function calculateShortScore(indicators: Indicators): ShortScoreBreakdown {
  // ==================== TREND SCORE (0-25) ====================
  let trendScore = 0;
  
  // EMA trend (max 8)
  if (indicators.ema.trend === 'bearish') {
    trendScore += 8;
  } else if (indicators.ema.trend === 'neutral') {
    trendScore += 4;
  }
  
  // EMA crossover (max 4)
  if (indicators.ema.crossover === 'bearish') {
    trendScore += 4;
  }
  
  // 4H trend (max 5)
  if (indicators.fourHTrend.trend === 'bearish') {
    trendScore += indicators.fourHTrend.strength === 'strong' ? 5 : 
                  indicators.fourHTrend.strength === 'moderate' ? 3 : 1;
  }
  
  // Multi-TF alignment (max 8) - CRITICAL for trend confirmation
  if (indicators.multiTFAlignment.direction === 'bearish') {
    trendScore += indicators.multiTFAlignment.score >= 80 ? 8 :
                  indicators.multiTFAlignment.score >= 60 ? 5 : 2;
  } else if (indicators.multiTFAlignment.direction === 'mixed') {
    trendScore += 2;
  }

  // ==================== MOMENTUM SCORE (0-20) ====================
  let momentumScore = 0;
  
  // RSI (max 6)
  if (indicators.rsi.value >= 75) {
    momentumScore += 6;
  } else if (indicators.rsi.value >= 70) {
    momentumScore += 5;
  } else if (indicators.rsi.value >= 60) {
    momentumScore += 3;
  } else if (indicators.rsi.value <= 30) {
    momentumScore -= 4; // Penalty: oversold = bad for short
  }
  
  // MACD (max 5)
  if (indicators.macd.trend === 'bearish') {
    momentumScore += indicators.macd.strength === 'strong' ? 5 :
                     indicators.macd.strength === 'moderate' ? 3 : 1;
  }
  if (indicators.macd.crossover === 'bearish') {
    momentumScore += 2;
  }
  
  // StochRSI (max 4)
  if (indicators.stochRsi.overbought) {
    momentumScore += 4;
  } else if (indicators.stochRsi.k > 80) {
    momentumScore += 2;
  } else if (indicators.stochRsi.oversold) {
    momentumScore -= 2;
  }
  
  // ADX strength (max 3)
  if (indicators.adx.value > 25 && indicators.adx.signal === 'bearish') {
    momentumScore += 3;
  }

  // ==================== PERPETUAL SCORE (0-15) ====================
  let perpetualScore = 0;
  
  // Funding Rate (max 8)
  // Positive funding = shorts pay longs = crowd is short = potential squeeze up
  // BUT for SHORT: we want NEUTRAL or SLIGHTLY positive funding (not extreme)
  const fundingRate = indicators.fundingRate.rate;
  const fundingAnnualized = indicators.fundingRate.annualized;
  
  if (fundingRate > 0.001) {
    // Very high positive funding (>0.1%) = DANGER - short squeeze risk
    perpetualScore -= 3;
  } else if (fundingRate > 0.0005) {
    // Moderate positive funding = shorts paying, but acceptable
    perpetualScore += 5;
  } else if (fundingRate > 0.0001) {
    // Slight positive = ideal for SHORT
    perpetualScore += 8;
  } else if (fundingRate > -0.0001) {
    // Neutral = good
    perpetualScore += 6;
  } else if (fundingRate > -0.0005) {
    // Slight negative = longs paying = bullish sentiment
    perpetualScore += 2;
  } else {
    // Very negative funding = extreme long bias = counter-intuitive good for SHORT
    perpetualScore += 4;
  }
  
  // Open Interest (max 7)
  // Rising OI + Price pumping = New longs = BAD for SHORT
  // Rising OI + Price flat/dropping = New shorts = GOOD for SHORT
  const oiChange = indicators.openInterest.change24h;
  const oiInterpretation = indicators.openInterest.interpretation;
  
  if (oiInterpretation === 'bearish') {
    // OI up + Price down = new shorts entering
    perpetualScore += 7;
  } else if (oiInterpretation === 'neutral') {
    perpetualScore += 3;
  } else {
    // OI up + Price up = new longs = bad for short
    perpetualScore -= 2;
  }

  // ==================== DIVERGENCE SCORE (0-15) ====================
  let divergenceScore = 0;
  
  // RSI divergence (max 10)
  if (indicators.rsiDivergence.type === 'bearish') {
    divergenceScore += indicators.rsiDivergence.strength === 'strong' ? 10 :
                       indicators.rsiDivergence.strength === 'moderate' ? 6 : 3;
    if (indicators.rsiDivergence.confirmation) {
      divergenceScore += 2;
    }
  }
  
  // MACD divergence (max 5)
  if (indicators.macdDivergence.type === 'bearish') {
    divergenceScore += indicators.macdDivergence.strength === 'strong' ? 5 :
                       indicators.macdDivergence.strength === 'moderate' ? 3 : 1;
  }

  // ==================== VOLUME SCORE (0-10) ====================
  let volumeScore = 0;
  
  // OBV trend (max 4)
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

  // ==================== POSITION SCORE (0-10) ====================
  let positionScore = 0;
  
  // VWAP deviation (max 5) - price above VWAP = good for short
  if (indicators.vwap.deviation > 5) {
    positionScore += 5;
  } else if (indicators.vwap.deviation > 3) {
    positionScore += 4;
  } else if (indicators.vwap.deviation > 1) {
    positionScore += 2;
  } else if (indicators.vwap.deviation < -3) {
    positionScore -= 2; // Price well below VWAP = bad for short
  }
  
  // Bollinger Bands position (max 5)
  if (indicators.bollingerBands.position > 90) {
    positionScore += 5;
  } else if (indicators.bollingerBands.position > 80) {
    positionScore += 4;
  } else if (indicators.bollingerBands.position > 70) {
    positionScore += 2;
  } else if (indicators.bollingerBands.position < 20) {
    positionScore -= 2;
  }

  // ==================== CRITICAL ADJUSTMENTS ====================
  let criticalBonus = 0;
  let criticalPenalty = 0;
  
  // BONUS CONDITIONS (stackable, max +15)
  
  // Perfect setup: RSI > 70 + BB > 80 + bearish EMA
  if (indicators.rsi.value > 70 && 
      indicators.bollingerBands.position > 80 && 
      indicators.ema.trend === 'bearish') {
    criticalBonus += 5;
  }
  
  // Multi-TF perfect alignment (3/3 bearish)
  if (indicators.multiTFAlignment.score >= 85) {
    criticalBonus += 5;
  }
  
  // Confirmed divergence + fake pump
  if (indicators.rsiDivergence.type === 'bearish' && 
      indicators.rsiDivergence.confirmation && 
      indicators.fakePump.isFake) {
    criticalBonus += 5;
  }
  
  // Funding sweet spot
  if (fundingRate > 0 && fundingRate < 0.0003) {
    criticalBonus += 3;
  }
  
  // PENALTY CONDITIONS (stackable, max -20)
  
  // RSI oversold = terrible for short
  if (indicators.rsi.value < 25) {
    criticalPenalty += 10;
  } else if (indicators.rsi.value < 30) {
    criticalPenalty += 5;
  }
  
  // Extreme funding = short squeeze risk
  if (fundingAnnualized > 50) {
    criticalPenalty += 8;
  } else if (fundingAnnualized > 30) {
    criticalPenalty += 4;
  }
  
  // Bullish multi-TF = wrong direction
  if (indicators.multiTFAlignment.direction === 'bullish' && 
      indicators.multiTFAlignment.score <= 25) {
    criticalPenalty += 8;
  }
  
  // EMA200 far below = already in downtrend, late entry
  if (indicators.ema.ema200Distance < -20) {
    criticalPenalty += 3;
  }
  
  // Strong bullish divergence = counter signal
  if (indicators.rsiDivergence.type === 'bullish' && 
      indicators.rsiDivergence.strength === 'strong') {
    criticalPenalty += 5;
  }

  // ==================== FINAL CALCULATION ====================
  const rawScore = trendScore + momentumScore + perpetualScore + 
                   divergenceScore + volumeScore + positionScore + 
                   criticalBonus - criticalPenalty;
  
  const total = Math.max(0, Math.min(100, Math.round(rawScore)));
  
  // Determine risk level
  let riskLevel: 'low' | 'medium' | 'high';
  if (total >= 65 && criticalPenalty === 0) {
    riskLevel = 'low';
  } else if (total >= 45 || (total >= 50 && criticalPenalty < 10)) {
    riskLevel = 'medium';
  } else {
    riskLevel = 'high';
  }

  return {
    total,
    trend: Math.round(trendScore),
    momentum: Math.round(momentumScore),
    volatility: Math.round(positionScore), // renamed for UI
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
