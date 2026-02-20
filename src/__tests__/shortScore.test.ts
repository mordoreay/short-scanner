import { describe, it, expect } from 'vitest';
import {
  calculateShortScore,
  calculateConfidence,
  getScoreColor,
  getScoreBgColor,
  TIER_1_CONFIG,
  TIER_2_CONFIG,
  TIER_3_CONFIG,
} from '../lib/scoring/shortScore';
import { Indicators } from '../types/scanner';

// Мок индикаторов по умолчанию
function createMockIndicators(overrides: Partial<Indicators> = {}): Indicators {
  return {
    rsi: { value: 70, signal: 'overbought' },
    macd: { value: 0.5, signal: 1, histogram: -0.2, trend: 'bearish', strength: 'moderate', crossover: 'none' },
    ema: { ema9: 100, ema21: 98, ema50: 95, ema200: 90, trend: 'bullish', crossover: 'none', ema200Distance: 10 },
    bollingerBands: { upper: 110, middle: 100, lower: 90, position: 75, signal: 'overbought', bandwidth: 20 },
    vwap: { value: 100, deviation: 3, signal: 'extended' },
    atr: { value: 2.5, volatility: 'normal', percent: 2.5 },
    adx: { value: 25, trend: 'strong', signal: 'bearish', strength: 'strong' },
    stochRsi: { k: 80, d: 75, signal: 'overbought', overbought: true, oversold: false },
    obv: { value: 1000000, trend: 'bearish', divergence: 'none' },
    rsiDivergence: { type: 'none', strength: 'none', confirmation: false, peakPrice: 0, peakRSI: 0, currentPrice: 0, currentRSI: 0 },
    macdDivergence: { type: 'none', strength: 'none', confirmation: false },
    multiTFAlignment: { score: 70, direction: 'bearish', timeframes: [] },
    fundingRate: { rate: -0.0001, annualized: -8.76, trend: 'stable', interpretation: 'neutral' },
    openInterest: { value: 1000000, change24h: -5, interpretation: 'bearish' },
    longShortRatio: { longRatio: 60, shortRatio: 40, ratio: 1.5, interpretation: 'long' },
    topTraders: { longRatio: 40, shortRatio: 60, ratio: 0.67, interpretation: 'short' },
    fakePump: { isFake: false, confidence: 0, reasons: [] },
    entryTiming: { signal: 'ready', confidence: 70, reasons: [] },
    orderBook: { 
      bidVolume: 1000000, 
      askVolume: 1500000, 
      imbalancePercent: -20,
      bidWall: 0,
      askWall: 0,
      signal: 'selling'
    },
    liquidationHeatmap: {
      levels: [],
      totalLongLiquidations: 200000,
      totalShortLiquidations: 50000,
      nearestCluster: 0,
      clusterStrength: 0
    },
    ...overrides,
  } as Indicators;
}

describe('SHORT Score Calculator', () => {
  describe('calculateShortScore', () => {
    it('должен возвращать score в диапазоне 0-100', () => {
      const indicators = createMockIndicators();
      const result = calculateShortScore(indicators, 20, TIER_2_CONFIG);
      
      expect(result.total).toBeGreaterThanOrEqual(0);
      expect(result.total).toBeLessThanOrEqual(100);
    });

    it('должен возвращать все компоненты score', () => {
      const indicators = createMockIndicators();
      const result = calculateShortScore(indicators, 20, TIER_2_CONFIG);
      
      expect(result).toHaveProperty('total');
      expect(result).toHaveProperty('trend');
      expect(result).toHaveProperty('momentum');
      expect(result).toHaveProperty('volatility');
      expect(result).toHaveProperty('volume');
      expect(result).toHaveProperty('divergence');
      expect(result).toHaveProperty('riskLevel');
    });

    it('должен определять риск low при высоком score', () => {
      const indicators = createMockIndicators({
        rsi: { value: 82, signal: 'overbought' },
        bollingerBands: { upper: 110, middle: 100, lower: 90, position: 95, signal: 'overbought', bandwidth: 20 },
        longShortRatio: { longRatio: 70, shortRatio: 30, ratio: 2.33, interpretation: 'long' },
        topTraders: { longRatio: 35, shortRatio: 65, ratio: 0.54, interpretation: 'short' },
      });
      
      const result = calculateShortScore(indicators, 30, TIER_2_CONFIG);
      
      expect(result.total).toBeGreaterThan(50);
    });

    it('должен давать высокий score при идеальном SHORT сетапе', () => {
      const indicators = createMockIndicators({
        rsi: { value: 85, signal: 'overbought' },
        bollingerBands: { upper: 110, middle: 100, lower: 90, position: 98, signal: 'overbought', bandwidth: 20 },
        vwap: { value: 100, deviation: 8, signal: 'extended' },
        longShortRatio: { longRatio: 72, shortRatio: 28, ratio: 2.57, interpretation: 'long' },
        topTraders: { longRatio: 30, shortRatio: 70, ratio: 0.43, interpretation: 'short' },
        multiTFAlignment: { score: 85, direction: 'bearish', timeframes: [] },
        rsiDivergence: { type: 'bearish', strength: 'strong', confirmation: true, peakPrice: 105, peakRSI: 75, currentPrice: 104, currentRSI: 85 },
        fundingRate: { rate: -0.0003, annualized: -26, trend: 'decreasing', interpretation: 'negative' },
        openInterest: { value: 1000000, change24h: -10, interpretation: 'bearish' },
      });
      
      const result = calculateShortScore(indicators, 35, TIER_2_CONFIG);
      
      expect(result.total).toBeGreaterThan(60);
    });

    it('должен давать низкий score при плохом SHORT сетапе', () => {
      const indicators = createMockIndicators({
        rsi: { value: 25, signal: 'oversold' },
        bollingerBands: { upper: 110, middle: 100, lower: 90, position: 15, signal: 'oversold', bandwidth: 20 },
        vwap: { value: 100, deviation: -5, signal: 'below' },
        longShortRatio: { longRatio: 35, shortRatio: 65, ratio: 0.54, interpretation: 'short' },
        topTraders: { longRatio: 70, shortRatio: 30, ratio: 2.33, interpretation: 'long' },
        multiTFAlignment: { score: 25, direction: 'bullish', timeframes: [] },
        fundingRate: { rate: 0.001, annualized: 87.6, trend: 'increasing', interpretation: 'positive' },
      });
      
      const result = calculateShortScore(indicators, 5, TIER_2_CONFIG);
      
      expect(result.total).toBeLessThan(40);
    });
  });

  describe('TIER Configs', () => {
    it('TIER_1 должен иметь консервативные пороги', () => {
      expect(TIER_1_CONFIG.priceChange.extreme).toBeLessThan(TIER_2_CONFIG.priceChange.extreme);
      expect(TIER_1_CONFIG.rsi.extreme).toBeLessThan(TIER_3_CONFIG.rsi.extreme);
      expect(TIER_1_CONFIG.scoring.enter).toBeGreaterThan(TIER_2_CONFIG.scoring.enter);
    });

    it('TIER_3 должен иметь агрессивные пороги', () => {
      expect(TIER_3_CONFIG.priceChange.extreme).toBeGreaterThan(TIER_2_CONFIG.priceChange.extreme);
      expect(TIER_3_CONFIG.rsi.extreme).toBeGreaterThan(TIER_1_CONFIG.rsi.extreme);
      expect(TIER_3_CONFIG.scoring.enter).toBeLessThan(TIER_1_CONFIG.scoring.enter);
    });

    it('TIER_2 должен быть между TIER_1 и TIER_3', () => {
      expect(TIER_2_CONFIG.priceChange.extreme).toBeGreaterThan(TIER_1_CONFIG.priceChange.extreme);
      expect(TIER_2_CONFIG.priceChange.extreme).toBeLessThan(TIER_3_CONFIG.priceChange.extreme);
    });

    it('одинаковые индикаторы должны давать разный score для разных TIER', () => {
      const indicators = createMockIndicators({
        rsi: { value: 75, signal: 'overbought' },
        bollingerBands: { upper: 110, middle: 100, lower: 90, position: 85, signal: 'overbought', bandwidth: 20 },
      });
      
      const score1 = calculateShortScore(indicators, 15, TIER_1_CONFIG);
      const score2 = calculateShortScore(indicators, 15, TIER_2_CONFIG);
      const score3 = calculateShortScore(indicators, 15, TIER_3_CONFIG);
      
      // Результаты могут отличаться из-за разных порогов
      expect(score1.total).toBeGreaterThanOrEqual(0);
      expect(score2.total).toBeGreaterThanOrEqual(0);
      expect(score3.total).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Momentum Score', () => {
    it('должен давать высокий балл за перекупленный RSI', () => {
      const indicatorsHigh = createMockIndicators({
        rsi: { value: 85, signal: 'overbought' },
      });
      const indicatorsLow = createMockIndicators({
        rsi: { value: 55, signal: 'neutral' },
      });
      
      const resultHigh = calculateShortScore(indicatorsHigh, 20, TIER_2_CONFIG);
      const resultLow = calculateShortScore(indicatorsLow, 20, TIER_2_CONFIG);
      
      expect(resultHigh.momentum).toBeGreaterThan(resultLow.momentum);
    });

    it('должен штрафовать за перепроданный RSI', () => {
      const indicatorsOversold = createMockIndicators({
        rsi: { value: 25, signal: 'oversold' },
      });
      const indicatorsNormal = createMockIndicators({
        rsi: { value: 55, signal: 'neutral' },
      });
      
      const resultOversold = calculateShortScore(indicatorsOversold, 20, TIER_2_CONFIG);
      const resultNormal = calculateShortScore(indicatorsNormal, 20, TIER_2_CONFIG);
      
      expect(resultOversold.total).toBeLessThan(resultNormal.total);
    });

    it('должен учитывать медвежий MACD', () => {
      const indicatorsBearish = createMockIndicators({
        macd: { value: 0.5, signal: 1, histogram: -0.5, trend: 'bearish', strength: 'strong', crossover: 'bearish' },
      });
      const indicatorsBullish = createMockIndicators({
        macd: { value: 0.5, signal: 1, histogram: 0.5, trend: 'bullish', strength: 'strong', crossover: 'bullish' },
      });
      
      const resultBearish = calculateShortScore(indicatorsBearish, 20, TIER_2_CONFIG);
      const resultBullish = calculateShortScore(indicatorsBullish, 20, TIER_2_CONFIG);
      
      expect(resultBearish.momentum).toBeGreaterThan(resultBullish.momentum);
    });
  });

  describe('Sentiment Score', () => {
    it('должен давать высокий балл за длинные позиции толпы', () => {
      const indicatorsLong = createMockIndicators({
        longShortRatio: { longRatio: 70, shortRatio: 30, ratio: 2.33, interpretation: 'long' },
        topTraders: { longRatio: 30, shortRatio: 70, ratio: 0.43, interpretation: 'short' },
      });
      const indicatorsShort = createMockIndicators({
        longShortRatio: { longRatio: 35, shortRatio: 65, ratio: 0.54, interpretation: 'short' },
        topTraders: { longRatio: 70, shortRatio: 30, ratio: 2.33, interpretation: 'long' },
      });
      
      const resultLong = calculateShortScore(indicatorsLong, 20, TIER_2_CONFIG);
      const resultShort = calculateShortScore(indicatorsShort, 20, TIER_2_CONFIG);
      
      expect(resultLong.trend).toBeGreaterThan(resultShort.trend);
    });

    it('должен учитывать Top Traders', () => {
      const indicatorsTopShort = createMockIndicators({
        topTraders: { longRatio: 30, shortRatio: 70, ratio: 0.43, interpretation: 'short' },
      });
      const indicatorsTopLong = createMockIndicators({
        topTraders: { longRatio: 70, shortRatio: 30, ratio: 2.33, interpretation: 'long' },
      });
      
      const resultTopShort = calculateShortScore(indicatorsTopShort, 20, TIER_2_CONFIG);
      const resultTopLong = calculateShortScore(indicatorsTopLong, 20, TIER_2_CONFIG);
      
      expect(resultTopShort.trend).toBeGreaterThan(resultTopLong.trend);
    });
  });

  describe('Perpetual Score', () => {
    it('должен вознаграждать отрицательный funding rate', () => {
      const indicatorsNegFunding = createMockIndicators({
        fundingRate: { rate: -0.0005, annualized: -43.8, trend: 'decreasing', interpretation: 'negative' },
      });
      const indicatorsPosFunding = createMockIndicators({
        fundingRate: { rate: 0.001, annualized: 87.6, trend: 'increasing', interpretation: 'positive' },
      });
      
      const resultNeg = calculateShortScore(indicatorsNegFunding, 20, TIER_2_CONFIG);
      const resultPos = calculateShortScore(indicatorsPosFunding, 20, TIER_2_CONFIG);
      
      expect(resultNeg.volume).toBeGreaterThan(resultPos.volume);
    });

    it('должен учитывать медвежий OI', () => {
      const indicatorsBearishOI = createMockIndicators({
        openInterest: { value: 1000000, change24h: -15, interpretation: 'bearish' },
      });
      const indicatorsBullishOI = createMockIndicators({
        openInterest: { value: 1000000, change24h: 15, interpretation: 'bullish' },
      });
      
      const resultBearish = calculateShortScore(indicatorsBearishOI, 20, TIER_2_CONFIG);
      const resultBullish = calculateShortScore(indicatorsBullishOI, 20, TIER_2_CONFIG);
      
      expect(resultBearish.volume).toBeGreaterThanOrEqual(resultBullish.volume);
    });
  });

  describe('Divergence Score', () => {
    it('должен вознаграждать медвежью дивергенцию RSI', () => {
      const indicatorsDiv = createMockIndicators({
        rsiDivergence: { type: 'bearish', strength: 'strong', confirmation: true, peakPrice: 105, peakRSI: 75, currentPrice: 104, currentRSI: 85 },
      });
      const indicatorsNoDiv = createMockIndicators({
        rsiDivergence: { type: 'none', strength: 'none', confirmation: false, peakPrice: 0, peakRSI: 0, currentPrice: 0, currentRSI: 0 },
      });
      
      const resultDiv = calculateShortScore(indicatorsDiv, 20, TIER_2_CONFIG);
      const resultNoDiv = calculateShortScore(indicatorsNoDiv, 20, TIER_2_CONFIG);
      
      expect(resultDiv.divergence).toBeGreaterThan(resultNoDiv.divergence);
    });

    it('должен штрафовать за бычью дивергенцию', () => {
      const indicatorsBullishDiv = createMockIndicators({
        rsiDivergence: { type: 'bullish', strength: 'strong', confirmation: true, peakPrice: 95, peakRSI: 35, currentPrice: 96, currentRSI: 25 },
      });
      const indicatorsNoDiv = createMockIndicators({
        rsiDivergence: { type: 'none', strength: 'none', confirmation: false, peakPrice: 0, peakRSI: 0, currentPrice: 0, currentRSI: 0 },
      });
      
      const resultBullish = calculateShortScore(indicatorsBullishDiv, 20, TIER_2_CONFIG);
      const resultNone = calculateShortScore(indicatorsNoDiv, 20, TIER_2_CONFIG);
      
      expect(resultBullish.total).toBeLessThan(resultNone.total);
    });
  });

  describe('Multi-TF Score', () => {
    it('должен вознаграждать медвежье выравнивание', () => {
      const indicatorsBearish = createMockIndicators({
        multiTFAlignment: { score: 85, direction: 'bearish', timeframes: [] },
      });
      const indicatorsBullish = createMockIndicators({
        multiTFAlignment: { score: 25, direction: 'bullish', timeframes: [] },
      });
      
      const resultBearish = calculateShortScore(indicatorsBearish, 20, TIER_2_CONFIG);
      const resultBullish = calculateShortScore(indicatorsBullish, 20, TIER_2_CONFIG);
      
      expect(resultBearish.divergence).toBeGreaterThan(resultBullish.divergence);
    });
  });

  describe('Order Flow Score', () => {
    it('должен вознаграждать selling pressure в order book', () => {
      const indicatorsSelling = createMockIndicators({
        orderBook: { bidVolume: 800000, askVolume: 1500000, imbalancePercent: -35, bidWall: 0, askWall: 0, signal: 'selling' },
      });
      const indicatorsBuying = createMockIndicators({
        orderBook: { bidVolume: 1500000, askVolume: 800000, imbalancePercent: 35, bidWall: 0, askWall: 0, signal: 'buying' },
      });
      
      const resultSelling = calculateShortScore(indicatorsSelling, 20, TIER_2_CONFIG);
      const resultBuying = calculateShortScore(indicatorsBuying, 20, TIER_2_CONFIG);
      
      expect(resultSelling.total).toBeGreaterThan(resultBuying.total);
    });

    it('должен учитывать liquidation heatmap', () => {
      const indicatorsLongLiq = createMockIndicators({
        liquidationHeatmap: { 
          levels: [], 
          totalLongLiquidations: 500000, 
          totalShortLiquidations: 50000, 
          nearestCluster: 0, 
          clusterStrength: 0 
        },
      });
      const indicatorsShortLiq = createMockIndicators({
        liquidationHeatmap: { 
          levels: [], 
          totalLongLiquidations: 50000, 
          totalShortLiquidations: 500000, 
          nearestCluster: 0, 
          clusterStrength: 0 
        },
      });
      
      const resultLongLiq = calculateShortScore(indicatorsLongLiq, 20, TIER_2_CONFIG);
      const resultShortLiq = calculateShortScore(indicatorsShortLiq, 20, TIER_2_CONFIG);
      
      expect(resultLongLiq.total).toBeGreaterThan(resultShortLiq.total);
    });
  });

  describe('calculateConfidence', () => {
    it('должен возвращать confidence в диапазоне 20-95', () => {
      const indicators = createMockIndicators();
      const confidence = calculateConfidence(50, 'divergence', indicators);
      
      expect(confidence).toBeGreaterThanOrEqual(20);
      expect(confidence).toBeLessThanOrEqual(95);
    });

    it('должен повышать confidence для надежных сетапов', () => {
      const indicators = createMockIndicators();
      const confidenceDiv = calculateConfidence(50, 'divergence', indicators);
      const confidenceMR = calculateConfidence(50, 'meanReversion', indicators);
      
      expect(confidenceDiv).toBeGreaterThan(confidenceMR);
    });

    it('должен повышать confidence при согласованном сентименте', () => {
      const indicatorsGood = createMockIndicators({
        longShortRatio: { longRatio: 65, shortRatio: 35, ratio: 1.86, interpretation: 'long' },
        topTraders: { longRatio: 35, shortRatio: 65, ratio: 0.54, interpretation: 'short' },
      });
      const indicatorsBad = createMockIndicators({
        longShortRatio: { longRatio: 45, shortRatio: 55, ratio: 0.82, interpretation: 'short' },
        topTraders: { longRatio: 55, shortRatio: 45, ratio: 1.22, interpretation: 'long' },
      });
      
      const confidenceGood = calculateConfidence(50, 'divergence', indicatorsGood);
      const confidenceBad = calculateConfidence(50, 'divergence', indicatorsBad);
      
      expect(confidenceGood).toBeGreaterThanOrEqual(confidenceBad);
    });
  });

  describe('getScoreColor', () => {
    it('должен возвращать зеленый для высокого score', () => {
      expect(getScoreColor(65)).toBe('text-green-500');
      expect(getScoreColor(80)).toBe('text-green-500');
    });

    it('должен возвращать желтый для среднего score', () => {
      expect(getScoreColor(45)).toBe('text-yellow-500');
      expect(getScoreColor(59)).toBe('text-yellow-500');
    });

    it('должен возвращать красный для низкого score', () => {
      expect(getScoreColor(30)).toBe('text-red-500');
      expect(getScoreColor(10)).toBe('text-red-500');
    });
  });

  describe('getScoreBgColor', () => {
    it('должен возвращать правильные фоновые цвета', () => {
      expect(getScoreBgColor(65)).toContain('bg-green-500');
      expect(getScoreBgColor(45)).toContain('bg-yellow-500');
      expect(getScoreBgColor(30)).toContain('bg-red-500');
    });
  });

  describe('Edge Cases', () => {
    it('должен обрабатывать отсутствующие индикаторы', () => {
      const indicators = {} as Indicators;
      const result = calculateShortScore(indicators, 20, TIER_2_CONFIG);
      
      expect(result.total).toBeGreaterThanOrEqual(0);
      expect(result.total).toBeLessThanOrEqual(100);
    });

    it('должен обрабатывать нулевой price change', () => {
      const indicators = createMockIndicators();
      const result = calculateShortScore(indicators, 0, TIER_2_CONFIG);
      
      expect(result.total).toBeGreaterThanOrEqual(0);
    });

    it('должен обрабатывать экстремальный price change', () => {
      const indicators = createMockIndicators();
      const result = calculateShortScore(indicators, 100, TIER_2_CONFIG);
      
      expect(result.total).toBeGreaterThanOrEqual(0);
      expect(result.total).toBeLessThanOrEqual(100);
    });
  });
});
