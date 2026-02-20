import { describe, it, expect, beforeEach } from 'vitest';
import {
  calculateATRPercent,
  calculateVolatilityMetrics,
  detectTierByVolatility,
  getCachedTier,
  clearTierCache,
  getTierDebugInfo,
} from '../lib/scoring/volatilityTier';
import { Tier } from '../lib/scoring/tierConfig';

// Мок данных свечей
function createMockCandles(count: number, basePrice: number = 100, atrPercent: number = 5): any[] {
  const candles: any[] = [];
  const atrValue = basePrice * (atrPercent / 100);
  
  for (let i = 0; i < count; i++) {
    const volatility = atrValue * (0.5 + Math.random());
    const high = basePrice + volatility / 2;
    const low = basePrice - volatility / 2;
    const close = basePrice + (Math.random() - 0.5) * volatility;
    const open = basePrice + (Math.random() - 0.5) * volatility * 0.5;
    
    candles.push({
      timestamp: Date.now() - (count - i) * 3600000,
      open,
      high,
      low,
      close,
      volume: 1000000 + Math.random() * 500000,
    });
  }
  
  return candles;
}

// Мок свечей с определённым volume
function createMockCandlesWithVolume(
  count: number,
  basePrice: number,
  atrPercent: number,
  avgVolume: number,
  lastVolume?: number
): any[] {
  const candles: any[] = [];
  const atrValue = basePrice * (atrPercent / 100);
  
  for (let i = 0; i < count; i++) {
    const volatility = atrValue * (0.5 + Math.random() * 0.5);
    const high = basePrice + volatility / 2;
    const low = basePrice - volatility / 2;
    const close = basePrice + (Math.random() - 0.5) * volatility * 0.5;
    
    const isLast = i === count - 1;
    const volume = isLast && lastVolume !== undefined ? lastVolume : avgVolume;
    
    candles.push({
      timestamp: Date.now() - (count - i) * 3600000,
      open: basePrice,
      high,
      low,
      close,
      volume,
    });
  }
  
  return candles;
}

describe('TIER Detection System v2.0 (Score-Based)', () => {
  beforeEach(() => {
    clearTierCache();
  });

  describe('calculateATRPercent', () => {
    it('должен возвращать 5% при недостаточном количестве свечей', () => {
      const candles = createMockCandles(5);
      const atr = calculateATRPercent(candles, 14);
      expect(atr).toBe(5); // дефолт
    });

    it('должен корректно рассчитывать ATR при достаточном количестве свечей', () => {
      const candles = createMockCandles(100, 100, 8);
      const atr = calculateATRPercent(candles, 14);
      // ATR должен быть около 8% (±3% допуск)
      expect(atr).toBeGreaterThan(4);
      expect(atr).toBeLessThan(15);
    });

    it('должен возвращать положительное значение ATR', () => {
      const candles = createMockCandles(100);
      const atr = calculateATRPercent(candles, 14);
      expect(atr).toBeGreaterThan(0);
    });
  });

  describe('calculateVolatilityMetrics', () => {
    it('должен возвращать все метрики волатильности', () => {
      const candles = createMockCandles(100);
      const metrics = calculateVolatilityMetrics(candles, 15);
      
      expect(metrics).toHaveProperty('atr24h');
      expect(metrics).toHaveProperty('atr7d');
      expect(metrics).toHaveProperty('atr14d');
      expect(metrics).toHaveProperty('priceChange24h');
      expect(metrics).toHaveProperty('avgVolume');
      expect(metrics).toHaveProperty('currentVolume');
      expect(metrics).toHaveProperty('volumeRatio');
      expect(metrics).toHaveProperty('isVolatile');
      expect(metrics).toHaveProperty('currentPrice');
      expect(metrics).toHaveProperty('candleCount');
    });

    it('должен корректно обрабатывать новые монеты (< 50 свечей)', () => {
      const candles = createMockCandles(30);
      const metrics = calculateVolatilityMetrics(candles, 20, 500000);
      
      expect(metrics.atr24h).toBeGreaterThan(0);
      expect(metrics.atr24h).toBe(metrics.atr14d); // для новых монет все ATR равны
    });

    it('должен корректно рассчитывать volumeRatio', () => {
      const avgVolume = 1000000;
      const currentVolume = 5000000; // 5x от среднего
      const candles = createMockCandlesWithVolume(100, 100, 5, avgVolume, currentVolume);
      
      const metrics = calculateVolatilityMetrics(candles, 0, currentVolume);
      
      expect(metrics.volumeRatio).toBeCloseTo(5, 0);
      expect(metrics.currentVolume).toBe(currentVolume);
    });

    it('должен определять isVolatile при высоком ATR', () => {
      const candles = createMockCandles(100, 100, 15); // 15% ATR
      const metrics = calculateVolatilityMetrics(candles, 0);
      
      expect(metrics.isVolatile).toBe(true);
    });

    it('должен определять isVolatile при экстремальном price change', () => {
      // Для новых монет (< 50 свечей) isVolatile проверяет |priceChange| > 25
      const candles = createMockCandles(30, 100, 3);
      const metrics = calculateVolatilityMetrics(candles, 30, 0); // 30% price change
      
      expect(metrics.isVolatile).toBe(true);
    });
  });

  describe('detectTierByVolatility - Score-Based Detection', () => {
    it('должен определять TIER 1 для крупных капов (высокая цена, низкий ATR)', () => {
      // Цена $100, ATR 3%, price change 5% → TIER 1
      const candles = createMockCandles(200, 100, 3); // $100 цена, 3% ATR
      const result = detectTierByVolatility('TESTUSDT', candles, 5);
      
      expect(result.tier).toBe(1);
      expect(result.source).toBe('score');
    });

    it('должен определять TIER 3 для мемкоинов (низкая цена, высокий ATR)', () => {
      // Цена < $0.001, ATR > 15%, price change > 30% → TIER 3
      const candles = createMockCandles(200, 0.0005, 18); // $0.0005 цена, 18% ATR
      const result = detectTierByVolatility('TESTUSDT', candles, 35);
      
      expect(result.tier).toBe(3);
    });

    it('должен определять TIER 2 для средних капов', () => {
      // Цена $0.3, ATR ~7%, price change ~18% → TIER 2
      // Score: price(1) + ATR(1) + change(0.5) + age(0.5) = 3.0 → TIER 2
      const candles = createMockCandles(200, 0.3, 7);
      const result = detectTierByVolatility('TESTUSDT', candles, 18);
      
      expect(result.tier).toBe(2);
    });

    it('должен возвращать scoreFactors для отладки', () => {
      const candles = createMockCandles(200, 100, 5);
      const result = detectTierByVolatility('TESTUSDT', candles, 10);
      
      expect(result.scoreFactors).toBeDefined();
      expect(result.scoreFactors?.totalScore).toBeGreaterThanOrEqual(0);
      expect(result.scoreFactors?.breakdown).toBeInstanceOf(Array);
    });

    it('должен устанавливать флаг isNewCoin при < 100 свечах', () => {
      const candles = createMockCandles(50);
      const result = detectTierByVolatility('TESTUSDT', candles, 10);
      
      expect(result.isNewCoin).toBe(true);
    });

    it('должен NOT устанавливать isNewCoin при >= 100 свечах', () => {
      const candles = createMockCandles(150);
      const result = detectTierByVolatility('TESTUSDT', candles, 10);
      
      expect(result.isNewCoin).toBe(false);
    });

    it('должен возвращать confidence в пределах 10-100', () => {
      const candles = createMockCandles(200);
      const result = detectTierByVolatility('TESTUSDT', candles, 10);
      
      expect(result.confidence).toBeGreaterThanOrEqual(10);
      expect(result.confidence).toBeLessThanOrEqual(100);
    });

    it('должен возвращать все необходимые поля', () => {
      const candles = createMockCandles(100);
      const result = detectTierByVolatility('TESTUSDT', candles, 10);
      
      expect(result).toHaveProperty('tier');
      expect(result).toHaveProperty('baseTier');
      expect(result).toHaveProperty('currentTier');
      expect(result).toHaveProperty('volatility');
      expect(result).toHaveProperty('source');
      expect(result).toHaveProperty('confidence');
      expect(result).toHaveProperty('isNewCoin');
      expect(result).toHaveProperty('volumeAdjusted');
    });
  });

  describe('Score Factors', () => {
    it('цена < $0.0001 должна давать +3 к score', () => {
      const candles = createMockCandles(200, 0.00005, 5); // $0.00005
      const result = detectTierByVolatility('TESTUSDT', candles, 10);
      
      const priceBreakdown = result.scoreFactors?.breakdown.find(b => b.includes('Price'));
      expect(priceBreakdown).toContain('+3');
    });

    it('цена >= $1 должна давать +0 к score', () => {
      const candles = createMockCandles(200, 50, 5); // $50
      const result = detectTierByVolatility('TESTUSDT', candles, 10);
      
      const priceBreakdown = result.scoreFactors?.breakdown.find(b => b.includes('Price'));
      expect(priceBreakdown).toContain('+0');
    });

    it('ATR > 20% должен давать +3 к score', () => {
      const candles = createMockCandles(200, 100, 25); // 25% ATR
      const result = detectTierByVolatility('TESTUSDT', candles, 10);
      
      const atrBreakdown = result.scoreFactors?.breakdown.find(b => b.includes('ATR'));
      expect(atrBreakdown).toContain('+3');
    });

    it('новая монета (< 24 свечей) должна давать +2 к score', () => {
      const candles = createMockCandles(20); // 20 свечей
      const result = detectTierByVolatility('TESTUSDT', candles, 10);
      
      const ageBreakdown = result.scoreFactors?.breakdown.find(b => b.includes('Age'));
      expect(ageBreakdown).toContain('+2');
    });

    it('volume spike > 10x должен давать +1 к score', () => {
      const candles = createMockCandlesWithVolume(200, 100, 5, 1000000, 15000000); // 15x volume
      const result = detectTierByVolatility('TESTUSDT', candles, 10, undefined, 15000000);
      
      const volumeBreakdown = result.scoreFactors?.breakdown.find(b => b.includes('Volume'));
      expect(volumeBreakdown).toContain('+1');
    });
  });

  describe('Cache', () => {
    it('должен кэшировать результаты', () => {
      const candles = createMockCandles(200, 100, 5);
      
      const result1 = getCachedTier('TESTUSDT', candles, 10);
      const result2 = getCachedTier('TESTUSDT', candles, 10);
      
      expect(result1.tier).toBe(result2.tier);
    });

    it('должен пересчитывать volume при каждом вызове', () => {
      const candles = createMockCandles(200, 100, 5);
      
      const result1 = getCachedTier('TESTUSDT', candles, 10, undefined, 1000000);
      const result2 = getCachedTier('TESTUSDT', candles, 10, undefined, 5000000); // 5x volume
      
      // Разные volume должны давать разные volumeRatio
      expect(result1.volatility.volumeRatio).toBeDefined();
      expect(result2.volatility.volumeRatio).toBeDefined();
      expect(result2.volatility.volumeRatio).toBeGreaterThan(result1.volatility.volumeRatio);
    });

    it('должен очищать кэш', () => {
      const candles = createMockCandles(200, 100, 5);
      
      getCachedTier('TESTUSDT', candles, 10);
      clearTierCache();
      
      // После очистки кэша должен быть новый расчёт
      const result = getCachedTier('TESTUSDT', candles, 10);
      expect(result.tier).toBeGreaterThanOrEqual(1);
      expect(result.tier).toBeLessThanOrEqual(3);
    });
  });

  describe('getTierDebugInfo', () => {
    it('должен возвращать строку с отладочной информацией', () => {
      const candles = createMockCandles(200, 100, 5);
      const result = detectTierByVolatility('TESTUSDT', candles, 10);
      const debug = getTierDebugInfo(result);
      
      expect(debug).toContain('TIER:');
      expect(debug).toContain('confidence:');
      expect(debug).toContain('Source:');
      expect(debug).toContain('ATR');
      expect(debug).toContain('Volume:');
      expect(debug).toContain('SCORE BREAKDOWN');
    });

    it('должен показывать [NEW COIN] для новых монет', () => {
      const candles = createMockCandles(30);
      const result = detectTierByVolatility('TESTUSDT', candles, 10);
      const debug = getTierDebugInfo(result);
      
      expect(debug).toContain('[NEW COIN]');
    });

    it('должен показывать breakdown score факторов', () => {
      const candles = createMockCandles(200, 100, 5);
      const result = detectTierByVolatility('TESTUSDT', candles, 10);
      const debug = getTierDebugInfo(result);
      
      expect(debug).toContain('Price:');
      expect(debug).toContain('ATR avg:');
      expect(debug).toContain('24h Change:');
      expect(debug).toContain('Total Score:');
    });
  });

  describe('Edge Cases', () => {
    it('должен обрабатывать пустой массив свечей', () => {
      const result = detectTierByVolatility('TESTUSDT', [], 10);
      
      expect(result.tier).toBeGreaterThanOrEqual(1);
      expect(result.tier).toBeLessThanOrEqual(3);
      expect(result.isNewCoin).toBe(true);
    });

    it('должен обрабатывать отрицательный price change', () => {
      const candles = createMockCandles(200, 100, 5);
      const result = detectTierByVolatility('TESTUSDT', candles, -15);
      
      expect(result.tier).toBeGreaterThanOrEqual(1);
      expect(result.tier).toBeLessThanOrEqual(3);
    });

    it('должен обрабатывать экстремальный price change', () => {
      const candles = createMockCandles(200, 100, 5);
      const result = detectTierByVolatility('TESTUSDT', candles, 100);
      
      expect(result.tier).toBeGreaterThanOrEqual(1);
      expect(result.tier).toBeLessThanOrEqual(3);
    });

    it('должен обрабатывать нулевой volume', () => {
      const candles = createMockCandlesWithVolume(200, 100, 5, 0, 0);
      const result = detectTierByVolatility('TESTUSDT', candles, 10, undefined, 0);
      
      expect(result.tier).toBeGreaterThanOrEqual(1);
      expect(result.tier).toBeLessThanOrEqual(3);
    });

    it('должен обрабатывать очень высокую волатильность', () => {
      const candles = createMockCandles(200, 0.0001, 50); // 50% ATR, низкая цена
      const result = detectTierByVolatility('TESTUSDT', candles, 80);
      
      expect(result.tier).toBe(3);
      expect(result.volatility.isVolatile).toBe(true);
    });

    it('должен корректно определять TIER для разных цен при одинаковом ATR', () => {
      // Одинаковый ATR, разная цена
      const candlesHighPrice = createMockCandles(200, 100, 10); // $100
      const candlesLowPrice = createMockCandles(200, 0.0001, 10); // $0.0001
      
      const resultHigh = detectTierByVolatility('HIGHUSDT', candlesHighPrice, 15);
      const resultLow = detectTierByVolatility('LOWUSDT', candlesLowPrice, 15);
      
      // Низкая цена должна давать более высокий TIER
      expect(resultLow.tier).toBeGreaterThanOrEqual(resultHigh.tier);
    });
  });

  describe('Confidence Calculation', () => {
    it('больше данных = выше confidence', () => {
      const candlesFew = createMockCandles(50);
      const candlesMany = createMockCandles(400);
      
      const resultFew = detectTierByVolatility('FEWUSDT', candlesFew, 10);
      const resultMany = detectTierByVolatility('MANYUSDT', candlesMany, 10);
      
      expect(resultMany.confidence).toBeGreaterThan(resultFew.confidence);
    });

    it('стабильная волатильность = выше confidence', () => {
      // Создаём свечи со стабильной волатильностью
      const candlesStable = createMockCandles(200, 100, 5);
      const result = detectTierByVolatility('STABLEUSDT', candlesStable, 10);
      
      expect(result.confidence).toBeGreaterThan(50);
    });
  });
});
