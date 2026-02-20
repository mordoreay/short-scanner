/**
 * TIER Configuration for SHORT Scanner
 * 
 * TIER detection is now fully automatic via score-based system.
 * See volatilityTier.ts for detection logic.
 * 
 * TIER 1: Low volatility - large caps (SOL, TON, AVAX...)
 * TIER 2: Medium volatility - mid caps (DOGE, WLD, ARKM...)
 * TIER 3: High volatility - memecoins (PEPE, WIF, BONK...)
 */

import { AltConfig } from './altConfig';
import { detectTierByVolatility, VolatilityMetrics } from './volatilityTier';

// ==================== OVERRIDE LISTS (DEPRECATED) ====================
// Keeping empty for backwards compatibility
// TIER detection is now score-based, see volatilityTier.ts

export const TIER_1_OVERRIDE: string[] = [];
export const TIER_3_OVERRIDE: string[] = [];

// ==================== TIER CONFIGS ====================

/**
 * TIER 1: Large Caps (SOL, TON, AVAX...)
 * - Lower thresholds for signals
 * - More conservative scoring
 */
export const TIER_1_CONFIG: AltConfig = {
  priceChange: {
    extreme: 20,
    strong: 15,
    moderate: 10,
    normal: 5,
    minimum: 5,
  },
  rsi: {
    extreme: 78,
    strong: 72,
    overbought: 68,
    elevated: 60,
    slight: 55,
    oversold: 30,
  },
  bollingerBands: {
    extreme: 95,
    veryHigh: 90,
    high: 82,
    moderate: 70,
    low: 30,
  },
  vwap: {
    veryExtended: 8,
    extended: 5,
    moderate: 3,
    slight: 1.5,
    negative: -3,
  },
  fundingRate: {
    veryNegative: -0.0008,
    negative: -0.0005,
    slightNegative: -0.0002,
    neutral: 0.0002,
    slightPositive: 0.0005,
    positive: 0.0008,
    extremePositive: 0.0015,
  },
  longShortRatio: {
    extremeLong: 68,
    strongLong: 62,
    moderateLong: 57,
    extremeShort: 35,
    strongShort: 40,
  },
  topTraders: {
    strongShort: 58,
    moderateShort: 54,
    strongLong: 58,
    moderateLong: 54,
  },
  scoring: {
    enter: 50,
    wait: 35,
    minScore: 25,
    riskLow: 60,
    riskMedium: 45,
  },
  multiTF: {
    strongBearish: 75,
    moderateBearish: 65,
    weakBearish: 55,
    strongBullish: 30,
  },
  volume: {
    fakePumpMinConfidence: 65,
    fakePumpHighConfidence: 80,
  },
};

/**
 * TIER 2: Mid Caps (DOGE, WLD, ARKM...)
 * - Balanced thresholds
 * - Standard scoring
 */
export const TIER_2_CONFIG: AltConfig = {
  priceChange: {
    extreme: 35,
    strong: 25,
    moderate: 18,
    normal: 10,
    minimum: 8,
  },
  rsi: {
    extreme: 82,
    strong: 75,
    overbought: 70,
    elevated: 62,
    slight: 55,
    oversold: 28,
  },
  bollingerBands: {
    extreme: 96,
    veryHigh: 90,
    high: 82,
    moderate: 72,
    low: 28,
  },
  vwap: {
    veryExtended: 12,
    extended: 8,
    moderate: 5,
    slight: 2,
    negative: -5,
  },
  fundingRate: {
    veryNegative: -0.001,
    negative: -0.0005,
    slightNegative: -0.0002,
    neutral: 0.0002,
    slightPositive: 0.0005,
    positive: 0.001,
    extremePositive: 0.002,
  },
  longShortRatio: {
    extremeLong: 65,
    strongLong: 60,
    moderateLong: 55,
    extremeShort: 38,
    strongShort: 42,
  },
  topTraders: {
    strongShort: 56,
    moderateShort: 52,
    strongLong: 56,
    moderateLong: 52,
  },
  scoring: {
    enter: 45,
    wait: 30,
    minScore: 20,
    riskLow: 55,
    riskMedium: 40,
  },
  multiTF: {
    strongBearish: 72,
    moderateBearish: 62,
    weakBearish: 52,
    strongBullish: 32,
  },
  volume: {
    fakePumpMinConfidence: 55,
    fakePumpHighConfidence: 70,
  },
};

/**
 * TIER 3: Memecoins (PEPE, WIF, BONK...)
 * - Higher thresholds (need extreme signals)
 * - More aggressive scoring
 */
export const TIER_3_CONFIG: AltConfig = {
  priceChange: {
    extreme: 50,
    strong: 35,
    moderate: 25,
    normal: 15,
    minimum: 10,
  },
  rsi: {
    extreme: 88,
    strong: 82,
    overbought: 75,
    elevated: 65,
    slight: 58,
    oversold: 25,
  },
  bollingerBands: {
    extreme: 98,
    veryHigh: 94,
    high: 88,
    moderate: 78,
    low: 22,
  },
  vwap: {
    veryExtended: 18,
    extended: 12,
    moderate: 7,
    slight: 3,
    negative: -8,
  },
  fundingRate: {
    veryNegative: -0.0015,
    negative: -0.0008,
    slightNegative: -0.0003,
    neutral: 0.0003,
    slightPositive: 0.0008,
    positive: 0.0015,
    extremePositive: 0.003,
  },
  longShortRatio: {
    extremeLong: 62,
    strongLong: 57,
    moderateLong: 53,
    extremeShort: 40,
    strongShort: 45,
  },
  topTraders: {
    strongShort: 55,
    moderateShort: 52,
    strongLong: 55,
    moderateLong: 52,
  },
  scoring: {
    enter: 38,
    wait: 25,
    minScore: 18,
    riskLow: 50,
    riskMedium: 35,
  },
  multiTF: {
    strongBearish: 70,
    moderateBearish: 60,
    weakBearish: 50,
    strongBullish: 35,
  },
  volume: {
    fakePumpMinConfidence: 50,
    fakePumpHighConfidence: 65,
  },
};

// ==================== HELPER FUNCTIONS ====================

export type Tier = 1 | 2 | 3;

/**
 * Get config by TIER
 */
export function getConfigByTier(tier: Tier): AltConfig {
  switch (tier) {
    case 1: return TIER_1_CONFIG;
    case 2: return TIER_2_CONFIG;
    case 3: return TIER_3_CONFIG;
    default: return TIER_2_CONFIG;
  }
}

/**
 * Main function to get TIER and config
 * Now uses score-based detection
 */
export function getTierAndConfigWithVolatility(
  symbol: string,
  candles: { high: number; low: number; close: number; volume: number }[],
  priceChange24h: number = 0,
  currentVolume?: number
): {
  tier: Tier;
  config: AltConfig;
  overrideTier: Tier | undefined;
  volatilityMetrics: VolatilityMetrics;
  confidence: number;
  isNewCoin: boolean;
  volumeAdjusted: boolean;
  volumeReason?: string;
} {
  const result = detectTierByVolatility(symbol, candles as any, priceChange24h, undefined, currentVolume);
  
  return {
    tier: result.tier,
    config: getConfigByTier(result.tier),
    overrideTier: undefined, // No more overrides
    volatilityMetrics: result.volatility,
    confidence: result.confidence,
    isNewCoin: result.isNewCoin,
    volumeAdjusted: result.volumeAdjusted,
    volumeReason: result.volumeReason,
  };
}

// Keep for backwards compatibility
export function getTierBySymbol(symbol: string): Tier | undefined {
  return undefined;
}

export function getTierBySymbolOrDefault(symbol: string): Tier {
  return 2;
}

export function isSymbolKnown(symbol: string): boolean {
  return false;
}

export function getConfigBySymbol(symbol: string): AltConfig {
  return TIER_2_CONFIG;
}

export function getSymbolsByTier(tier: Tier): string[] {
  return [];
}

export function getSymbolInfo(symbol: string): {
  tier: Tier;
  tierName: string;
  volatility: string;
  examples: string[];
  isOverride: boolean;
} {
  return { 
    tier: 2,
    tierName: 'Mid Cap',
    volatility: 'Medium (15-40%/day)',
    examples: ['DOGE', 'WLD', 'ARKM', 'PENDLE'],
    isOverride: false,
  };
}

export const TIER_DESCRIPTIONS = {
  1: {
    name: 'Large Caps',
    description: 'Крупные альты (SOL, TON, AVAX)',
    volatility: 'Низкая',
    riskLevel: 'Низкий',
    recommended: 'Для консервативных трейдеров',
  },
  2: {
    name: 'Mid Caps',
    description: 'Средние альты (DOGE, WLD, ARKM)',
    volatility: 'Средняя',
    riskLevel: 'Средний',
    recommended: 'Баланс риска и доходности',
  },
  3: {
    name: 'Memecoins',
    description: 'Мемкоины (PEPE, WIF, BONK)',
    volatility: 'Высокая',
    riskLevel: 'Высокий',
    recommended: 'Для агрессивных трейдеров',
  },
} as const;
