/**
 * Candlestick Pattern Detector for Entry Timing
 * Analyzes last 3 closed candles for bearish reversal patterns
 */

export interface CandlePattern {
  name: string;
  nameRu: string;
  type: 'bearish' | 'bullish' | 'neutral';
  reliability: 'high' | 'medium' | 'low';
  score: number;
  description: string;
}

export interface PatternAnalysis {
  patterns: CandlePattern[];
  totalScore: number;       // 0-20
  hasHighReliability: boolean;
  summary: string;
}

interface Candle {
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

/**
 * Detect bearish candlestick patterns from last 3 closed candles
 * IMPORTANT: Only analyzes closed candles (not the forming one)
 */
export function detectBearishPatterns(candles: Candle[]): PatternAnalysis {
  const patterns: CandlePattern[] = [];

  if (candles.length < 3) {
    return {
      patterns: [],
      totalScore: 0,
      hasHighReliability: false,
      summary: 'Недостаточно данных',
    };
  }

  // Get last 3 closed candles (exclude current forming candle)
  const c1 = candles[candles.length - 1]; // Most recent closed
  const c2 = candles[candles.length - 2]; // Previous
  const c3 = candles[candles.length - 3]; // Before previous

  // === HELPER FUNCTIONS ===
  const isBullish = (c: Candle) => c.close > c.open;
  const isBearish = (c: Candle) => c.close < c.open;
  const bodySize = (c: Candle) => Math.abs(c.close - c.open);
  const upperWick = (c: Candle) => c.high - Math.max(c.open, c.close);
  const lowerWick = (c: Candle) => Math.min(c.open, c.close) - c.low;
  const totalRange = (c: Candle) => c.high - c.low;
  const bodyPercent = (c: Candle) => {
    const range = totalRange(c);
    return range > 0 ? (bodySize(c) / range) * 100 : 0;
  };

  // ========================================
  // 1. BEARISH ENGULFING (High Reliability)
  // Красная свеча полностью поглощает зелёную
  // ========================================
  if (isBearish(c1) && isBullish(c2)) {
    const c1Body = bodySize(c1);
    const c2Body = bodySize(c2);

    // Current bearish engulfs previous bullish
    if (c1.open >= c2.close && c1.close <= c2.open && c1Body > c2Body) {
      patterns.push({
        name: 'Bearish Engulfing',
        nameRu: 'Медвежье поглощение',
        type: 'bearish',
        reliability: 'high',
        score: 15,
        description: 'Красная свеча полностью поглощает зелёную — сильный разворот',
      });
    }
  }

  // ========================================
  // 2. SHOOTING STAR (High Reliability)
  // Малое тело, длинная верхняя тень (2x+ тела), маленькая нижняя тень
  // ========================================
  if (isBullish(c1) || isBearish(c1)) {
    const body = bodySize(c1);
    const upper = upperWick(c1);
    const lower = lowerWick(c1);
    const range = totalRange(c1);

    // Shooting star: small body at bottom, long upper wick
    if (
      body > 0 &&
      upper >= body * 2 &&
      lower < body * 0.5 &&
      body < range * 0.3
    ) {
      patterns.push({
        name: 'Shooting Star',
        nameRu: 'Падающая звезда',
        type: 'bearish',
        reliability: 'high',
        score: 12,
        description: 'Длинная верхняя тень с малым телом — отказ от роста',
      });
    }
  }

  // ========================================
  // 3. EVENING STAR (High Reliability)
  // 3 свечи: большая зелёная → маленькая (doji/spinning) → большая красная
  // ========================================
  if (isBearish(c1) && isBullish(c3)) {
    const c1Body = bodySize(c1);
    const c3Body = bodySize(c3);
    const c2Body = bodySize(c2);
    const c2Range = totalRange(c2);

    // c2 is small (doji or spinning top), c1 closes below c3's midpoint
    const c3Midpoint = c3.open + (c3.close - c3.open) / 2;
    const c2IsSmall = c2Body < c3Body * 0.4 && bodyPercent(c2) < 40;

    if (c2IsSmall && c1.close < c3Midpoint && c1Body > c2Body * 2) {
      patterns.push({
        name: 'Evening Star',
        nameRu: 'Вечерняя звезда',
        type: 'bearish',
        reliability: 'high',
        score: 14,
        description: 'Трёхсвечная формация разворота на вершине',
      });
    }
  }

  // ========================================
  // 4. DARK CLOUD COVER (Medium Reliability)
  // Красная закрывает больше 50% тела зелёной
  // ========================================
  if (isBearish(c1) && isBullish(c2)) {
    const c2Midpoint = c2.open + (c2.close - c2.open) / 2;

    // Current opens above previous close, closes below midpoint
    if (c1.open > c2.close && c1.close < c2Midpoint && c1.close > c2.open) {
      patterns.push({
        name: 'Dark Cloud Cover',
        nameRu: 'Завеса из тёмных облаков',
        type: 'bearish',
        reliability: 'medium',
        score: 10,
        description: 'Красная перекрывает >50% зелёной — давление продавцов',
      });
    }
  }

  // ========================================
  // 5. UPPER WICK REJECTION (Medium Reliability)
  // Длинная верхняя тень — отказ от уровня
  // ========================================
  if (upperWick(c1) >= bodySize(c1) * 1.5 && bodySize(c1) > 0) {
    const wickPercent = totalRange(c1) > 0
      ? (upperWick(c1) / totalRange(c1)) * 100
      : 0;

    patterns.push({
      name: 'Upper Wick Rejection',
      nameRu: 'Отказ сверху',
      type: 'bearish',
      reliability: 'medium',
      score: Math.min(8, Math.round(wickPercent / 5)), // 5-8 points based on wick size
      description: `Длинная верхняя тень (${wickPercent.toFixed(1)}%) — отказ от уровня`,
    });
  }

  // ========================================
  // 6. BEARISH HARAMI (Low Reliability)
  // Маленькая красная внутри большой зелёной
  // ========================================
  if (isBearish(c1) && isBullish(c2)) {
    const c1Body = bodySize(c1);
    const c2Body = bodySize(c2);

    // Current bearish is inside previous bullish
    if (
      c1.open < c2.close &&
      c1.close > c2.open &&
      c1Body < c2Body * 0.5
    ) {
      patterns.push({
        name: 'Bearish Harami',
        nameRu: 'Медвежий харами',
        type: 'bearish',
        reliability: 'low',
        score: 6,
        description: 'Малая красная внутри зелёной — возможный разворот',
      });
    }
  }

  // ========================================
  // 7. GRAVESTONE DOJI (Medium Reliability)
  // Открытие = Закрытие = Минимум, длинная верхняя тень
  // ========================================
  const c1Body = bodySize(c1);
  const c1Range = totalRange(c1);

  if (c1Range > 0 && c1Body < c1Range * 0.1) {
    const upper = upperWick(c1);
    const lower = lowerWick(c1);

    if (upper >= c1Range * 0.6 && lower < c1Range * 0.1) {
      patterns.push({
        name: 'Gravestone Doji',
        nameRu: 'Надгробный доджи',
        type: 'bearish',
        reliability: 'medium',
        score: 8,
        description: 'Доджи с длинной верхней тенью — сильный отказ',
      });
    }
  }

  // ========================================
  // 8. THREE BLACK CROWS (High Reliability)
  // 3 подряд красные свечи с понижающимися минимумами
  // ========================================
  if (isBearish(c1) && isBearish(c2) && isBearish(c3)) {
    const allHaveBodies =
      bodySize(c1) > totalRange(c1) * 0.4 &&
      bodySize(c2) > totalRange(c2) * 0.4 &&
      bodySize(c3) > totalRange(c3) * 0.4;

    const lowerLows = c1.close < c2.close && c2.close < c3.close;

    if (allHaveBodies && lowerLows) {
      patterns.push({
        name: 'Three Black Crows',
        nameRu: 'Три чёрные вороны',
        type: 'bearish',
        reliability: 'high',
        score: 12,
        description: 'Три красные подряд с понижением — сильное давление',
      });
    }
  }

  // ========================================
  // 9. BEARISH BELT HOLD (Medium Reliability)
  // Красная без верхней тени, открывается на максимуме
  // ========================================
  if (isBearish(c1)) {
    const upper = upperWick(c1);
    const body = bodySize(c1);
    const range = totalRange(c1);

    // Opens at high, minimal upper wick, significant body
    if (upper < range * 0.05 && body > range * 0.6) {
      patterns.push({
        name: 'Bearish Belt Hold',
        nameRu: 'Медвежий пояс',
        type: 'bearish',
        reliability: 'medium',
        score: 9,
        description: 'Открытие на максимуме, сильное движение вниз',
      });
    }
  }

  // ========================================
  // 10. TWEETER TOP (Low-Medium Reliability)
  // Две свечи с похожими максимумами, вторая не может пробить
  // ========================================
  if (Math.abs(c1.high - c2.high) < totalRange(c1) * 0.1) {
    const c1FailedBreak = c1.close < c1.high * 0.98; // Failed to close near high
    const c2FailedBreak = c2.close < c2.high * 0.98;

    if (c1FailedBreak && c2FailedBreak && isBearish(c1)) {
      patterns.push({
        name: 'Tweezer Top',
        nameRu: 'Вершина пинцета',
        type: 'bearish',
        reliability: 'low',
        score: 6,
        description: 'Двойная неудача на уровне — сопротивление',
      });
    }
  }

  // ========================================
  // CALCULATE TOTAL SCORE
  // ========================================
  // Cap at 20 points, prioritize high reliability patterns
  const highReliabilityPatterns = patterns.filter(p => p.reliability === 'high');
  let totalScore = patterns.reduce((sum, p) => sum + p.score, 0);

  // Bonus for multiple patterns
  if (patterns.length >= 3) {
    totalScore += 3;
  } else if (patterns.length === 2 && highReliabilityPatterns.length >= 1) {
    totalScore += 2;
  }

  // Cap at 20
  totalScore = Math.min(20, totalScore);

  // Generate summary
  let summary = 'Нет паттернов';
  if (patterns.length > 0) {
    const names = patterns.map(p => p.nameRu).join(', ');
    summary = names;

    if (highReliabilityPatterns.length > 0) {
      summary += ` (${highReliabilityPatterns.length} надёжных)`;
    }
  }

  return {
    patterns,
    totalScore,
    hasHighReliability: highReliabilityPatterns.length > 0,
    summary,
  };
}

/**
 * Detect bullish patterns (for comparison / warning)
 */
export function detectBullishPatterns(candles: Candle[]): PatternAnalysis {
  const patterns: CandlePattern[] = [];

  if (candles.length < 3) {
    return {
      patterns: [],
      totalScore: 0,
      hasHighReliability: false,
      summary: 'Недостаточно данных',
    };
  }

  const c1 = candles[candles.length - 1];
  const c2 = candles[candles.length - 2];
  const c3 = candles[candles.length - 3];

  const isBullish = (c: Candle) => c.close > c.open;
  const isBearish = (c: Candle) => c.close < c.open;
  const bodySize = (c: Candle) => Math.abs(c.close - c.open);
  const upperWick = (c: Candle) => c.high - Math.max(c.open, c.close);
  const lowerWick = (c: Candle) => Math.min(c.open, c.close) - c.low;
  const totalRange = (c: Candle) => c.high - c.low;

  // Bullish Engulfing
  if (isBullish(c1) && isBearish(c2)) {
    if (c1.open <= c2.close && c1.close >= c2.open && bodySize(c1) > bodySize(c2)) {
      patterns.push({
        name: 'Bullish Engulfing',
        nameRu: 'Бычье поглощение',
        type: 'bullish',
        reliability: 'high',
        score: 15,
        description: '⚠️ Бычье поглощение — возможен разворот вверх',
      });
    }
  }

  // Hammer
  const body = bodySize(c1);
  const lower = lowerWick(c1);
  const upper = upperWick(c1);
  const range = totalRange(c1);

  if (body > 0 && lower >= body * 2 && upper < body * 0.3 && body < range * 0.35) {
    patterns.push({
      name: 'Hammer',
      nameRu: 'Молот',
      type: 'bullish',
      reliability: 'high',
      score: 12,
      description: '⚠️ Молот — возможен отскок от поддержки',
    });
  }

  // Morning Star
  if (isBullish(c1) && isBearish(c3)) {
    const c2IsSmall = bodySize(c2) < bodySize(c3) * 0.4;
    const c3Midpoint = c3.open + (c3.close - c3.open) / 2;

    if (c2IsSmall && c1.close > c3Midpoint) {
      patterns.push({
        name: 'Morning Star',
        nameRu: 'Утренняя звезда',
        type: 'bullish',
        reliability: 'high',
        score: 14,
        description: '⚠️ Утренняя звезда — бычий разворот',
      });
    }
  }

  const totalScore = Math.min(20, patterns.reduce((sum, p) => sum + p.score, 0));
  const highReliabilityPatterns = patterns.filter(p => p.reliability === 'high');

  return {
    patterns,
    totalScore,
    hasHighReliability: highReliabilityPatterns.length > 0,
    summary: patterns.length > 0 ? patterns.map(p => p.nameRu).join(', ') : 'Нет паттернов',
  };
}
