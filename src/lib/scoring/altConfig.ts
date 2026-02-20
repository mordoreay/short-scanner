/**
 * AltConfig - Configuration interface for altcoin SHORT scoring
 * Different cryptocurrencies have different volatility profiles
 */

export interface AltConfig {
  priceChange: {
    extreme: number;      // Extreme pump threshold
    strong: number;       // Strong pump
    moderate: number;     // Moderate pump
    normal: number;       // Normal movement
    minimum: number;      // Minimum change to consider
  };

  rsi: {
    extreme: number;      // Extreme overbought
    strong: number;       // Strong overbought
    overbought: number;   // Overbought threshold
    elevated: number;     // Elevated level
    slight: number;       // Slightly elevated
    oversold: number;     // Oversold penalty threshold
  };

  bollingerBands: {
    extreme: number;      // At extreme upper
    veryHigh: number;     // Very high position
    high: number;         // High position
    moderate: number;     // Moderate position
    low: number;          // Low position (penalty)
  };

  vwap: {
    veryExtended: number; // Very extended from VWAP
    extended: number;     // Extended
    moderate: number;     // Moderate deviation
    slight: number;       // Slight deviation
    negative: number;     // Negative deviation (penalty)
  };

  fundingRate: {
    veryNegative: number;    // Very negative funding
    negative: number;        // Negative funding
    slightNegative: number;  // Slightly negative
    neutral: number;         // Neutral range
    slightPositive: number;  // Slightly positive
    positive: number;        // Positive funding
    extremePositive: number; // Extreme positive (squeeze risk)
  };

  longShortRatio: {
    extremeLong: number;  // Extreme long bias
    strongLong: number;   // Strong long bias
    moderateLong: number; // Moderate long bias
    extremeShort: number; // Extreme short bias
    strongShort: number;  // Strong short bias
  };

  topTraders: {
    strongShort: number;  // Strong short from smart money
    moderateShort: number;
    strongLong: number;   // Strong long from smart money
    moderateLong: number;
  };

  scoring: {
    enter: number;        // Score threshold for "enter"
    wait: number;         // Score threshold for "wait"
    minScore: number;     // Minimum score to show
    riskLow: number;      // Score for low risk
    riskMedium: number;   // Score for medium risk
  };

  multiTF: {
    strongBearish: number;
    moderateBearish: number;
    weakBearish: number;
    strongBullish: number;
  };

  volume: {
    fakePumpMinConfidence: number;
    fakePumpHighConfidence: number;
  };
}

/**
 * Default ALT config - balanced for mid-cap alts
 */
export const ALT_CONFIG: AltConfig = {
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
