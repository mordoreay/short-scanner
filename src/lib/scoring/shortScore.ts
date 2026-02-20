import { Indicators, ShortScoreBreakdown } from '@/types/scanner';
import { AltConfig, ALT_CONFIG } from './altConfig';
import { TIER_1_CONFIG, TIER_2_CONFIG, TIER_3_CONFIG, getConfigBySymbol, getTierBySymbol, getTierBySymbolOrDefault } from './tierConfig';

// Экспортируем все конфиги и хелперы
export { 
  ALT_CONFIG,
  TIER_1_CONFIG, 
  TIER_2_CONFIG, 
  TIER_3_CONFIG,
  getConfigBySymbol,
  getTierBySymbol,
  getTierBySymbolOrDefault,
};
export type { AltConfig };

/**
 * SHORT Score Calculator v3.3 - TIER-Aware with Order Flow
 * Calculates a weighted score (0-100) for SHORT setup quality
 */

export function calculateShortScore(
  indicators: Indicators,
  priceChange24h: number = 20,
  config: AltConfig = ALT_CONFIG
): ShortScoreBreakdown {
  // ==================== MOMENTUM SCORE (0-25) ====================
  let momentumScore = 0;

  // RSI (max 12)
  const rsi = indicators.rsi?.value ?? 50;
  const C = config.rsi;
  if (rsi >= C.extreme) {
    momentumScore += 12;
  } else if (rsi >= C.strong) {
    momentumScore += 10;
  } else if (rsi >= C.overbought) {
    momentumScore += 8;
  } else if (rsi >= C.elevated) {
    momentumScore += 5;
  } else if (rsi >= C.slight) {
    momentumScore += 2;
  } else if (rsi <= C.oversold) {
    momentumScore -= 8;
  }

  // StochRSI (max 5)
  const stochK = indicators.stochRsi?.k ?? 50;
  if (indicators.stochRsi?.overbought) {
    momentumScore += 5;
  } else if (stochK > 85) {
    momentumScore += 3;
  } else if (stochK > 80) {
    momentumScore += 2;
  } else if (indicators.stochRsi?.oversold) {
    momentumScore -= 3;
  }

  // MACD (max 5)
  if (indicators.macd?.trend === 'bearish') {
    momentumScore += indicators.macd.strength === 'strong' ? 5 :
                     indicators.macd.strength === 'moderate' ? 3 : 1;
  }
  if (indicators.macd?.crossover === 'bearish') {
    momentumScore += 2;
  }

  // ADX strength (max 3)
  if ((indicators.adx?.value ?? 0) > 25) {
    momentumScore += 2;
    if (indicators.adx?.signal === 'bearish') {
      momentumScore += 1;
    }
  }

  // ==================== PRICE ACTION SCORE (0-20) ====================
  let volatilityScore = 0;

  // Price change magnitude
  const PC = config.priceChange;
  if (priceChange24h >= PC.extreme) {
    volatilityScore += 8;
  } else if (priceChange24h >= PC.strong) {
    volatilityScore += 6;
  } else if (priceChange24h >= PC.moderate) {
    volatilityScore += 4;
  } else if (priceChange24h >= PC.normal) {
    volatilityScore += 2;
  }

  // Bollinger Bands position
  const bbPosition = indicators.bollingerBands?.position ?? 50;
  const BB = config.bollingerBands;
  if (bbPosition > BB.extreme) {
    volatilityScore += 6;
  } else if (bbPosition > BB.veryHigh) {
    volatilityScore += 5;
  } else if (bbPosition > BB.high) {
    volatilityScore += 4;
  } else if (bbPosition > BB.moderate) {
    volatilityScore += 2;
  }

  // VWAP deviation
  const vwapDeviation = indicators.vwap?.deviation ?? 0;
  const VW = config.vwap;
  if (vwapDeviation > VW.veryExtended) {
    volatilityScore += 6;
  } else if (vwapDeviation > VW.extended) {
    volatilityScore += 5;
  } else if (vwapDeviation > VW.moderate) {
    volatilityScore += 3;
  } else if (vwapDeviation > VW.slight) {
    volatilityScore += 1;
  } else if (vwapDeviation < VW.negative) {
    volatilityScore -= 3;
  }

  // ==================== SENTIMENT SCORE (0-20) ====================
  let trendScore = 0;

  // Long/Short Ratio
  const lsLongRatio = indicators.longShortRatio?.longRatio ?? 50;
  const LS = config.longShortRatio;
  if (lsLongRatio >= LS.extremeLong) {
    trendScore += 10;
  } else if (lsLongRatio >= LS.strongLong) {
    trendScore += 8;
  } else if (lsLongRatio >= LS.moderateLong) {
    trendScore += 6;
  } else if (lsLongRatio >= 55) {
    trendScore += 3;
  } else if (lsLongRatio <= LS.extremeShort) {
    trendScore -= 5;
  } else if (lsLongRatio <= LS.strongShort) {
    trendScore -= 3;
  }

  // Top Traders
  const topTradersShort = indicators.topTraders?.shortRatio ?? 50;
  const topTradersLong = indicators.topTraders?.longRatio ?? 50;
  const TT = config.topTraders;
  if (topTradersShort >= TT.strongShort) {
    trendScore += 10;
  } else if (topTradersShort >= TT.moderateShort) {
    trendScore += 7;
  } else if (topTradersShort >= 50) {
    trendScore += 3;
  } else if (topTradersLong >= TT.strongLong) {
    trendScore -= 6;
  } else if (topTradersLong >= TT.moderateLong) {
    trendScore -= 3;
  }

  // ==================== PERPETUAL SCORE (0-15) ====================
  let perpetualScore = 0;

  const fundingRate = indicators.fundingRate?.rate;
  const fundingAnnualized = indicators.fundingRate?.annualized ?? 0;
  const fundingTrend = indicators.fundingRate?.trend ?? 'stable';
  const hasFundingData = fundingRate !== undefined && fundingRate !== null;

  const FR = config.fundingRate;
  if (hasFundingData) {
    if (fundingRate < FR.veryNegative) {
      perpetualScore += 7;
    } else if (fundingRate < FR.negative) {
      perpetualScore += 5;
    } else if (fundingRate < FR.slightNegative) {
      perpetualScore += 3;
    } else if (fundingRate >= FR.slightNegative && fundingRate <= FR.neutral) {
      perpetualScore += 2;
    } else if (fundingRate <= FR.slightPositive) {
      perpetualScore += 1;
    } else if (fundingRate <= FR.positive) {
      perpetualScore -= 2;
    } else {
      perpetualScore -= 5;
    }

    if (fundingTrend === 'decreasing') {
      perpetualScore += 3;
    } else if (fundingTrend === 'increasing' && fundingRate > 0) {
      perpetualScore -= 2;
    }
  }

  // Open Interest
  const oiInterpretation = indicators.openInterest?.interpretation;
  const hasOIData = oiInterpretation !== undefined && oiInterpretation !== null;

  if (hasOIData) {
    if (oiInterpretation === 'bearish') {
      perpetualScore += 5;
    } else if (oiInterpretation === 'neutral') {
      perpetualScore += 2;
    }
  }

  // ==================== TREND ALIGNMENT SCORE (0-10) ====================
  let trendAlignmentScore = 0;

  const multiTFScore = indicators.multiTFAlignment?.score ?? 50;
  const multiTFDirection = indicators.multiTFAlignment?.direction ?? 'mixed';

  const MTF = config.multiTF;
  if (multiTFDirection === 'bearish') {
    if (multiTFScore >= MTF.strongBearish) {
      trendAlignmentScore += 10;
    } else if (multiTFScore >= MTF.moderateBearish) {
      trendAlignmentScore += 8;
    } else if (multiTFScore >= MTF.weakBearish) {
      trendAlignmentScore += 5;
    }
  } else if (multiTFDirection === 'bullish') {
    if (multiTFScore <= MTF.strongBullish) {
      trendAlignmentScore -= 8;
    } else if (multiTFScore <= 35) {
      trendAlignmentScore -= 4;
    }
  }

  // ==================== DIVERGENCE + VOLUME SCORE (0-10) ====================
  let divergenceVolumeScore = 0;

  if (indicators.rsiDivergence?.type === 'bearish') {
    divergenceVolumeScore += indicators.rsiDivergence.strength === 'strong' ? 5 :
                             indicators.rsiDivergence.strength === 'moderate' ? 3 : 1;
    if (indicators.rsiDivergence.confirmation) {
      divergenceVolumeScore += 1;
    }
  }

  if (indicators.macdDivergence?.type === 'bearish') {
    divergenceVolumeScore += indicators.macdDivergence.strength === 'strong' ? 2 : 1;
  }

  if (indicators.obv?.trend === 'bearish') {
    divergenceVolumeScore += 2;
  }

  if (indicators.obv?.divergence === 'bearish') {
    divergenceVolumeScore += 1;
  }

  const fakePumpConf = indicators.fakePump?.confidence ?? 0;
  if (indicators.fakePump?.isFake && fakePumpConf >= config.volume.fakePumpMinConfidence) {
    divergenceVolumeScore += Math.min(Math.floor(fakePumpConf / 40), 2);
  }

  // ==================== CRITICAL ADJUSTMENTS ====================
  let criticalBonus = 0;
  let criticalPenalty = 0;

  // PERFECT SENTIMENT
  if (lsLongRatio >= 60 && topTradersShort >= 55) {
    criticalBonus += 8;
  }

  // Perfect SHORT setup
  if (rsi > config.rsi.strong && bbPosition > config.bollingerBands.veryHigh && priceChange24h > config.priceChange.moderate) {
    criticalBonus += 6;
  }

  // Confirmed divergence
  if (indicators.rsiDivergence?.type === 'bearish' && indicators.rsiDivergence?.confirmation) {
    criticalBonus += 4;
  }

  // Fake pump with high confidence
  if (indicators.fakePump?.isFake && (indicators.fakePump.confidence ?? 0) > 75) {
    criticalBonus += 3;
  }

  // Multi-TF perfect alignment
  if (multiTFDirection === 'bearish' && multiTFScore >= config.multiTF.moderateBearish) {
    criticalBonus += 3;
  }

  // === ORDER FLOW BONUSES ===
  const orderBookImbalance = indicators.orderBook?.imbalancePercent ?? 0;
  const hasOrderBookData = (indicators.orderBook?.bidVolume ?? 0) > 0 || 
                           (indicators.orderBook?.askVolume ?? 0) > 0;

  if (hasOrderBookData) {
    if (orderBookImbalance <= -30) {
      criticalBonus += 4;
    } else if (orderBookImbalance <= -20) {
      criticalBonus += 2;
    } else if (orderBookImbalance >= 30) {
      criticalPenalty += 3;
    } else if (orderBookImbalance >= 20) {
      criticalPenalty += 1;
    }
  }

  const longLiq = indicators.liquidationHeatmap?.totalLongLiquidations ?? 0;
  const shortLiq = indicators.liquidationHeatmap?.totalShortLiquidations ?? 0;
  const hasLiqData = longLiq > 0 || shortLiq > 0;

  if (hasLiqData) {
    if (longLiq > shortLiq * 2 && longLiq > 100000) {
      criticalBonus += 3;
    } else if (shortLiq > longLiq * 2 && shortLiq > 100000) {
      criticalPenalty += 3;
    }
  }

  // === PENALTY CONDITIONS ===
  if (rsi < 25) {
    criticalPenalty += 10;
  } else if (rsi < config.rsi.oversold) {
    criticalPenalty += 5;
  }

  if (topTradersLong >= config.topTraders.strongLong) {
    criticalPenalty += 10;
  } else if (topTradersLong >= config.topTraders.moderateLong) {
    criticalPenalty += 5;
  }

  if (fundingAnnualized > 50) {
    criticalPenalty += 8;
  } else if (fundingAnnualized > 30) {
    criticalPenalty += 4;
  }

  if (priceChange24h < config.priceChange.minimum) {
    criticalPenalty += 5;
  }

  if (indicators.rsiDivergence?.type === 'bullish' &&
      indicators.rsiDivergence?.strength === 'strong') {
    criticalPenalty += 5;
  }

  if (bbPosition < config.bollingerBands.low) {
    criticalPenalty += 4;
  }

  if (multiTFDirection === 'bullish' && multiTFScore <= config.multiTF.strongBullish) {
    criticalPenalty += 4;
  }

  // ==================== FINAL CALCULATION ====================
  const rawScore = momentumScore + volatilityScore + trendScore +
                   perpetualScore + trendAlignmentScore + divergenceVolumeScore +
                   criticalBonus - criticalPenalty;

  const total = Math.max(0, Math.min(100, Math.round(rawScore)));

  // Determine risk level
  let riskLevel: 'low' | 'medium' | 'high';
  const SC = config.scoring;
  if (total >= SC.riskLow && criticalPenalty === 0) {
    riskLevel = 'low';
  } else if (total >= SC.riskMedium || (total >= 42 && criticalPenalty < 8)) {
    riskLevel = 'medium';
  } else {
    riskLevel = 'high';
  }

  return {
    total,
    trend: Math.round(trendScore),
    momentum: Math.round(momentumScore),
    volatility: Math.round(volatilityScore),
    volume: Math.round(perpetualScore),
    divergence: Math.round(divergenceVolumeScore + trendAlignmentScore),
    riskLevel,
  };
}

export function getScoreColor(score: number): string {
  if (score >= 60) return 'text-green-500';
  if (score >= 40) return 'text-yellow-500';
  return 'text-red-500';
}

export function getScoreBgColor(score: number): string {
  if (score >= 60) return 'bg-green-500/20 border-green-500/50';
  if (score >= 40) return 'bg-yellow-500/20 border-yellow-500/50';
  return 'bg-red-500/20 border-red-500/50';
}

export function calculateConfidence(
  shortScore: number,
  setupType: string,
  indicators: Indicators
): number {
  let confidence = shortScore;

  const setupReliability: Record<string, number> = {
    'divergence': 1.05,
    'oiDivergence': 1.08,
    'fakePump': 1.00,
    'structureBreak': 1.02,
    'doubleTop': 0.98,
    'resistanceRejection': 0.95,
    'rejection': 0.95,
    'levelBreakout': 0.92,
    'breakout': 0.90,
    'meanReversion': 0.85,
  };

  const reliability = setupReliability[setupType] || 0.90;
  confidence = Math.round(confidence * reliability);

  const lsLong = indicators.longShortRatio?.longRatio ?? 50;
  const topShort = indicators.topTraders?.shortRatio ?? 50;
  if (lsLong >= 60 && topShort >= 55) {
    confidence = Math.round(confidence * 1.05);
  }

  const multiTFScore = indicators.multiTFAlignment?.score ?? 50;
  if (indicators.multiTFAlignment?.direction === 'bearish' && multiTFScore >= 70) {
    confidence = Math.round(confidence * 1.03);
  }

  if (indicators.entryTiming?.signal === 'enter_now') {
    confidence = Math.round(confidence * 1.05);
  } else if (indicators.entryTiming?.signal === 'ready') {
    confidence = Math.round(confidence * 1.02);
  }

  return Math.min(95, Math.max(20, confidence));
}
