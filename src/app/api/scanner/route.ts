import { NextRequest, NextResponse } from 'next/server';
import { getExchangeAPI } from '@/lib/exchanges';
import { getAllIndicators, getAllIndicatorsMultiTF } from '@/lib/indicators';
import { calculateShortScore, calculateConfidence } from '@/lib/scoring/shortScore';
import { Candle, Candidate, Setup, Exchange, Timeframe, SortOption, ScannerFilters, Language, SetupType } from '@/types/scanner';

// Translations for generated texts
const translations = {
  ru: {
    patterns: {
      divergence: 'Медвежья дивергенция RSI/MACD',
      rejection: 'Отскок от Bollinger Band + RSI',
      fakePump: 'Детекция Fake Pump',
      breakout: 'Медвежий кроссовер EMA',
      meanReversion: 'Сетап возврата к среднему',
      structureBreak: 'Структурный слом тренда',
      levelBreakout: 'Пробой уровня поддержки',
      resistanceRejection: 'Отказ от сопротивления',
      doubleTop: 'Паттерн двойная вершина',
      oiDivergence: 'Расхождение цены и OI',
    },
    descriptions: {
      divergence: 'RSI или MACD формируют более низкие максимумы при росте цены - признак ослабления импульса и возможного разворота вниз.',
      rejection: 'Цена отталкивается от верхней полосы Боллинджера при перекупленном RSI - классический сигнал на продажу.',
      fakePump: 'Искусственный памп без реального объёма, часто предшествует резкому падению.',
      breakout: 'EMA пересекаются медвежьим образом (9 пересекает 21 сверху вниз) - сигнал начала нисходящего тренда.',
      meanReversion: 'Цена значительно отклонилась от средних значений и ожидается возврат к среднему.',
      structureBreak: 'Пробой локального минимума восходящего тренда - сигнал смены структуры рынка на нисходящую.',
      levelBreakout: 'Цена пробила ключевой уровень поддержки снизу вверх и вернулась к нему - возможность шортить от сопротивления.',
      resistanceRejection: 'Цена встретила сильное сопротивление на ключевой уровне и начала движение вниз.',
      doubleTop: 'Двойная вершина на восходящем движении - классический разворотный паттерн.',
      oiDivergence: 'Цена растёт, но Open Interest падает - лонгисты закрывают позиции, возможен разворот.',
    },
    warnings: {
      extremeMove: 'Экстремальное движение цены (>50%) - высокий риск волатильности',
      weakTrend: 'Слабый тренд - возможный боковик',
      highVolatility: 'Высокая волатильность - используйте меньший размер позиции',
      rsiNotOverbought: 'RSI не перекуплен - сетап может быть ранним',
      belowEMA200: 'Цена ниже EMA200 - возможно уже в нисходящем тренде',
      largePump: 'Большой памп без сигналов fake pump - проверьте вручную',
    },
    reasoning: {
      detected: 'Обнаружен паттерн',
      rsiOverbought: 'RSI перекуплен на уровне',
      emaBearish: 'EMA выстроились медвежьи (9<21<50)',
      fakePumpDetected: 'Обнаружен fake pump (уверенность',
      rsiDivergence: 'Присутствует медвежья дивергенция RSI',
      bbOverbought: 'Цена на верхней полосе Боллинджера',
      priceChange: 'Изменение цены за 24ч',
    },
    analysis: {
      shows: 'показывает',
      withScore: 'с SHORT Score',
      recommendation: 'Рекомендация',
      enter: 'Рассмотреть вход',
      wait: 'Ждать подтверждения',
      skip: 'Пропустить сетап',
    },
  },
  en: {
    patterns: {
      divergence: 'Bearish RSI/MACD Divergence',
      rejection: 'Bollinger Band + RSI Rejection',
      fakePump: 'Fake Pump Detection',
      breakout: 'EMA Bearish Crossover',
      meanReversion: 'Mean Reversion Setup',
      structureBreak: 'Trend Structure Break',
      levelBreakout: 'Support Level Breakout',
      resistanceRejection: 'Resistance Rejection',
      doubleTop: 'Double Top Pattern',
      oiDivergence: 'Price/OI Divergence',
    },
    descriptions: {
      divergence: 'RSI or MACD forms lower highs while price rises - sign of weakening momentum and potential reversal.',
      rejection: 'Price rejects from upper Bollinger Band with overbought RSI - classic sell signal.',
      fakePump: 'Artificial pump without real volume, often precedes a sharp decline.',
      breakout: 'EMA crosses bearishly (9 crosses 21 from above) - signal of downtrend start.',
      meanReversion: 'Price significantly deviated from averages, expected to revert to mean.',
      structureBreak: 'Break of local low in uptrend - signal of market structure shift to downtrend.',
      levelBreakout: 'Price broke key support level and returned to it - opportunity to short from resistance.',
      resistanceRejection: 'Price met strong resistance at key level and started moving down.',
      doubleTop: 'Double top on upward move - classic reversal pattern.',
      oiDivergence: 'Price rises but Open Interest falls - longs closing positions, potential reversal.',
    },
    warnings: {
      extremeMove: 'Extreme price movement (>50%) - high volatility risk',
      weakTrend: 'Weak trend - potential choppy market',
      highVolatility: 'High volatility - use smaller position size',
      rsiNotOverbought: 'RSI not overbought - short setup may be early',
      belowEMA200: 'Price below EMA200 - may be in downtrend already',
      largePump: 'Large pump without fake pump signals - verify manually',
    },
    reasoning: {
      detected: 'Detected',
      rsiOverbought: 'RSI overbought at',
      emaBearish: 'EMA alignment is bearish (9<21<50)',
      fakePumpDetected: 'Fake pump detected (confidence',
      rsiDivergence: 'Bearish RSI divergence present',
      bbOverbought: 'Price at upper Bollinger Band',
      priceChange: '24h price change',
    },
    analysis: {
      shows: 'shows',
      withScore: 'with SHORT Score',
      recommendation: 'Recommendation',
      enter: 'Consider entering',
      wait: 'Wait for confirmation',
      skip: 'Skip this setup',
    },
  },
  zn: {
    patterns: {
      divergence: '看跌RSI/MACD背离',
      rejection: '布林带+RSI拒绝',
      fakePump: '假拉升检测',
      breakout: 'EMA看跌交叉',
      meanReversion: '均值回归设置',
      structureBreak: '趋势结构突破',
      levelBreakout: '支撑位突破',
      resistanceRejection: '阻力拒绝',
      doubleTop: '双顶形态',
      oiDivergence: '价格/OI背离',
    },
    descriptions: {
      divergence: 'RSI或MACD在价格上涨时形成较低的高点 - 动量减弱和潜在反转的迹象。',
      rejection: '价格从布林带上轨拒绝，RSI超买 - 经典卖出信号。',
      fakePump: '无真实成交量的人为拉升，通常先于急剧下跌。',
      breakout: 'EMA看跌交叉（9从上向下穿过21） - 下跌趋势开始的信号。',
      meanReversion: '价格显著偏离均值，预期回归平均。',
      structureBreak: '上升趋势中的局部低点被突破 - 市场结构转向下跌趋势的信号。',
      levelBreakout: '价格突破关键支撑位并返回 - 从阻力位做空的机会。',
      resistanceRejection: '价格在关键水平遇到强阻力并开始下跌。',
      doubleTop: '上升运动中的双顶 - 经典反转形态。',
      oiDivergence: '价格上涨但持仓量下降 - 多头平仓，潜在反转。',
    },
    warnings: {
      extremeMove: '极端价格波动(>50%) - 高波动风险',
      weakTrend: '趋势疲弱 - 可能横盘',
      highVolatility: '高波动性 - 使用较小仓位',
      rsiNotOverbought: 'RSI未超买 - 做空设置可能过早',
      belowEMA200: '价格低于EMA200 - 可能已处于下降趋势',
      largePump: '大幅上涨但无假拉升信号 - 请手动验证',
    },
    reasoning: {
      detected: '检测到',
      rsiOverbought: 'RSI超买于',
      emaBearish: 'EMA排列看跌(9<21<50)',
      fakePumpDetected: '检测到假拉升(置信度',
      rsiDivergence: '存在看跌RSI背离',
      bbOverbought: '价格位于布林带上轨',
      priceChange: '24小时价格变化',
    },
    analysis: {
      shows: '显示',
      withScore: '做空分数',
      recommendation: '建议',
      enter: '考虑进场',
      wait: '等待确认',
      skip: '跳过此设置',
    },
  },
};

type Translations = typeof translations.ru;

function getTranslations(lang: Language): Translations {
  return translations[lang] || translations.en;
}

/**
 * Detect structure break (lower low break in uptrend)
 */
function detectStructureBreak(
  indicators: ReturnType<typeof getAllIndicators>,
  priceChange24h: number
): { detected: boolean; strength: 'strong' | 'moderate' | 'weak' } {
  // Structure break requires:
  // 1. Price was going up (positive 24h change)
  // 2. EMA trend turning bearish
  // 3. Multi-TF showing bearish shift
  // 4. RSI starting to decline from overbought
  
  if (priceChange24h < 10) return { detected: false, strength: 'weak' };
  
  const emaTurningBearish = indicators.ema.crossover === 'bearish' || indicators.ema.trend === 'bearish';
  const rsiDeclining = indicators.rsi.value < 70 && indicators.rsi.value > 50;
  const multiTFShift = indicators.multiTFAlignment.direction === 'bearish' || indicators.multiTFAlignment.direction === 'mixed';
  
  if (emaTurningBearish && rsiDeclining && multiTFShift && priceChange24h > 20) {
    return { detected: true, strength: priceChange24h > 30 ? 'strong' : 'moderate' };
  }
  
  return { detected: false, strength: 'weak' };
}

/**
 * Detect OI divergence (price up, OI down)
 */
function detectOIDivergence(
  indicators: ReturnType<typeof getAllIndicators>,
  priceChange24h: number
): { detected: boolean; strength: 'strong' | 'moderate' | 'weak' } {
  // OI divergence: price going up but OI decreasing
  const oiDown = indicators.openInterest.interpretation === 'bearish';
  const priceUp = priceChange24h > 10;
  
  if (oiDown && priceUp) {
    // Stronger signal if RSI also overbought
    const rsiConfirmation = indicators.rsi.value > 65;
    return { 
      detected: true, 
      strength: rsiConfirmation ? 'strong' : 'moderate' 
    };
  }
  
  return { detected: false, strength: 'weak' };
}

/**
 * Detect resistance rejection
 */
function detectResistanceRejection(
  indicators: ReturnType<typeof getAllIndicators>
): { detected: boolean; strength: 'strong' | 'moderate' | 'weak' } {
  // Price at upper BB and starting to reject
  const atResistance = indicators.bollingerBands.position > 85;
  const vwapResistance = indicators.vwap.deviation > 3;
  const rsiHigh = indicators.rsi.value > 65;
  
  if (atResistance && rsiHigh) {
    return { 
      detected: true, 
      strength: indicators.bollingerBands.position > 95 ? 'strong' : 'moderate' 
    };
  }
  
  if (vwapResistance && rsiHigh) {
    return { detected: true, strength: 'moderate' };
  }
  
  return { detected: false, strength: 'weak' };
}

/**
 * Detect double top pattern
 */
function detectDoubleTop(
  indicators: ReturnType<typeof getAllIndicators>,
  priceChange24h: number
): { detected: boolean; strength: 'strong' | 'moderate' | 'weak' } {
  // Simplified double top detection:
  // 1. Price went up significantly
  // 2. RSI overbought with divergence
  // 3. MACD histogram declining
  
  const significantPump = priceChange24h > 15;
  const rsiOverbought = indicators.rsi.value > 70;
  const macdDeclining = indicators.macd.histogram < 0 || indicators.macd.crossover === 'bearish';
  const hasDivergence = indicators.rsiDivergence.type === 'bearish';
  
  if (significantPump && rsiOverbought && macdDeclining) {
    return { 
      detected: true, 
      strength: hasDivergence ? 'strong' : 'moderate' 
    };
  }
  
  return { detected: false, strength: 'weak' };
}

/**
 * Determine setup type based on indicators
 */
function determineSetupType(
  indicators: ReturnType<typeof getAllIndicators>, 
  shortScore: ReturnType<typeof calculateShortScore>,
  priceChange24h: number,
  t: Translations
): {
  type: SetupType;
  pattern: string;
  description: string;
  direction: Setup['direction'];
  confidence: number;
} {
  const types: { type: SetupType; pattern: string; description: string; priority: number; setupKey: string }[] = [];

  // Check for OI divergence (unique perpetual signal - high priority)
  const oiDiv = detectOIDivergence(indicators, priceChange24h);
  if (oiDiv.detected) {
    types.push({
      type: 'oiDivergence',
      pattern: t.patterns.oiDivergence,
      description: t.descriptions.oiDivergence,
      priority: oiDiv.strength === 'strong' ? 10 : 8,
      setupKey: 'oiDivergence',
    });
  }

  // Check for divergence setup (highest priority for reliability)
  if (indicators.rsiDivergence.type === 'bearish' || indicators.macdDivergence.type === 'bearish') {
    const hasConfirmation = indicators.rsiDivergence.confirmation || indicators.macdDivergence.confirmation;
    const isStrong = indicators.rsiDivergence.strength === 'strong' || indicators.macdDivergence.strength === 'strong';
    types.push({
      type: 'divergence',
      pattern: t.patterns.divergence,
      description: t.descriptions.divergence,
      priority: isStrong && hasConfirmation ? 10 : isStrong ? 8 : hasConfirmation ? 7 : 5,
      setupKey: 'divergence',
    });
  }

  // Check for fake pump (high priority)
  if (indicators.fakePump.isFake && indicators.fakePump.confidence >= 60) {
    types.push({
      type: 'fakePump',
      pattern: t.patterns.fakePump,
      description: t.descriptions.fakePump,
      priority: indicators.fakePump.confidence > 80 ? 9 : indicators.fakePump.confidence > 70 ? 7 : 5,
      setupKey: 'fakePump',
    });
  }

  // Check for structure break
  const structBreak = detectStructureBreak(indicators, priceChange24h);
  if (structBreak.detected) {
    types.push({
      type: 'structureBreak',
      pattern: t.patterns.structureBreak,
      description: t.descriptions.structureBreak,
      priority: structBreak.strength === 'strong' ? 8 : 6,
      setupKey: 'structureBreak',
    });
  }

  // Check for double top
  const doubleTop = detectDoubleTop(indicators, priceChange24h);
  if (doubleTop.detected) {
    types.push({
      type: 'doubleTop',
      pattern: t.patterns.doubleTop,
      description: t.descriptions.doubleTop,
      priority: doubleTop.strength === 'strong' ? 8 : 6,
      setupKey: 'doubleTop',
    });
  }

  // Check for resistance rejection
  const resRejection = detectResistanceRejection(indicators);
  if (resRejection.detected) {
    types.push({
      type: 'resistanceRejection',
      pattern: t.patterns.resistanceRejection,
      description: t.descriptions.resistanceRejection,
      priority: resRejection.strength === 'strong' ? 7 : 5,
      setupKey: 'resistanceRejection',
    });
  }

  // Check for rejection setup (RSI + BB)
  if (indicators.bollingerBands.signal === 'overbought' && indicators.rsi.value > 70) {
    types.push({
      type: 'rejection',
      pattern: t.patterns.rejection,
      description: t.descriptions.rejection,
      priority: indicators.rsi.value > 80 ? 8 : indicators.rsi.value > 75 ? 7 : 6,
      setupKey: 'rejection',
    });
  }

  // Check for breakout setup (EMA crossover)
  if (indicators.ema.crossover === 'bearish' && indicators.ema.trend === 'bearish') {
    types.push({
      type: 'breakout',
      pattern: t.patterns.breakout,
      description: t.descriptions.breakout,
      priority: 6,
      setupKey: 'breakout',
    });
  }

  // Check for Multi-TF aligned setup
  if (indicators.multiTFAlignment.direction === 'bearish' && indicators.multiTFAlignment.score >= 75) {
    types.push({
      type: 'breakout',
      pattern: t.patterns.breakout,
      description: t.descriptions.breakout,
      priority: 8,
      setupKey: 'breakout',
    });
  }

  // Default to mean reversion if no strong setup found
  if (types.length === 0) {
    const confidence = calculateConfidence(shortScore.total, 'meanReversion', indicators);
    return {
      type: 'meanReversion',
      pattern: t.patterns.meanReversion,
      description: t.descriptions.meanReversion,
      direction: 'short',
      confidence,
    };
  }

  // Sort by priority and get the best setup
  const best = types.sort((a, b) => b.priority - a.priority)[0];
  const confidence = calculateConfidence(shortScore.total, best.setupKey, indicators);
  
  return {
    type: best.type,
    pattern: best.pattern,
    description: best.description,
    direction: 'short',
    confidence,
  };
}

/**
 * Generate warning signals
 */
function generateWarningSignals(
  indicators: ReturnType<typeof getAllIndicators>,
  priceChange24h: number,
  t: Translations
): string[] {
  const warnings: string[] = [];

  // Critical warnings
  if (priceChange24h > 50) {
    warnings.push(t.warnings.extremeMove);
  }

  if (indicators.rsi.value < 30) {
    warnings.push('RSI перепродан - плохой момент для SHORT');
  }

  // Funding rate warnings
  if (indicators.fundingRate.annualized > 30) {
    warnings.push(`Высокий фандинг (${indicators.fundingRate.annualized.toFixed(0)}% годовых) - риск short squeeze`);
  }

  // Trend warnings
  if (indicators.adx.trend === 'none' || indicators.adx.value < 15) {
    warnings.push(t.warnings.weakTrend);
  }

  if (indicators.multiTFAlignment.direction === 'bullish') {
    warnings.push('Multi-TF бычий - против тренда');
  }

  // Volatility warnings
  if (indicators.atr.volatility === 'high') {
    warnings.push(t.warnings.highVolatility);
  }

  // Position warnings
  if (indicators.rsi.value < 40 && indicators.rsi.value >= 30) {
    warnings.push(t.warnings.rsiNotOverbought);
  }

  if (indicators.ema.ema200Distance < -10) {
    warnings.push(t.warnings.belowEMA200);
  }

  // Divergence warning
  if (indicators.rsiDivergence.type === 'bullish') {
    warnings.push('Бычья дивергенция RSI - сигнал против SHORT');
  }

  // Pump warning
  if (!indicators.fakePump.isFake && priceChange24h > 30) {
    warnings.push(t.warnings.largePump);
  }

  // OI warning
  if (indicators.openInterest.interpretation === 'bullish') {
    warnings.push('OI растёт с ценой - новые лонги');
  }

  return warnings;
}

/**
 * Generate reasoning for the setup
 */
function generateReasoning(
  setupType: ReturnType<typeof determineSetupType>,
  indicators: ReturnType<typeof getAllIndicators>,
  priceChange24h: number,
  t: Translations
): string {
  const reasons: string[] = [];

  reasons.push(`${t.reasoning.detected} ${setupType.pattern}.`);

  if (indicators.rsi.value > 70) {
    reasons.push(`${t.reasoning.rsiOverbought} ${indicators.rsi.value.toFixed(1)}.`);
  }

  if (indicators.ema.trend === 'bearish') {
    reasons.push(t.reasoning.emaBearish);
  }

  if (indicators.fakePump.isFake) {
    reasons.push(`${t.reasoning.fakePumpDetected} ${indicators.fakePump.confidence}%).`);
  }

  if (indicators.rsiDivergence.type === 'bearish') {
    reasons.push(t.reasoning.rsiDivergence);
  }

  if (indicators.bollingerBands.signal === 'overbought') {
    reasons.push(t.reasoning.bbOverbought);
  }

  reasons.push(`${t.reasoning.priceChange}: +${priceChange24h.toFixed(1)}%.`);

  return reasons.join(' ');
}

/**
 * Generate analysis text
 */
function generateAnalysis(
  name: string,
  setupType: ReturnType<typeof determineSetupType>,
  shortScore: ReturnType<typeof calculateShortScore>,
  indicators: ReturnType<typeof getAllIndicators>,
  recommendation: 'enter' | 'wait' | 'skip',
  t: Translations
): string {
  const recText = recommendation === 'enter' ? t.analysis.enter : 
                  recommendation === 'wait' ? t.analysis.wait : t.analysis.skip;
  
  return `${name} ${t.analysis.shows} ${setupType.pattern} ${t.analysis.withScore} ${shortScore.total}%. ` +
    `RSI: ${indicators.rsi.value.toFixed(1)}, EMA200: ${indicators.ema.ema200Distance > 0 ? '+' : ''}${indicators.ema.ema200Distance.toFixed(1)}%. ` +
    `${t.analysis.recommendation}: ${recText}.`;
}

/**
 * Calculate entry zone, stop loss, and take profits
 * v2.0 - Adaptive calculation based on setup type and market structure
 */
function calculateTradeLevels(
  currentPrice: number,
  high24h: number,
  low24h: number,
  atr: number,
  indicators: ReturnType<typeof getAllIndicators>,
  setupType: SetupType,
  priceChange24h: number,
  language: Language
): {
  entryZone: [number, number];
  stopLoss: number;
  takeProfit1: number;
  takeProfit2: number;
  riskReward: number;
  breakevenTrigger: number;
  breakevenSL: number;
  breakevenInfo: string;
} {
  // ==================== ADAPTIVE ENTRY ZONE ====================
  // Based on volatility (ATR) and BB position
  
  const bbPosition = indicators.bollingerBands.position;
  const bbUpper = indicators.bollingerBands.upper;
  const bbMiddle = indicators.bollingerBands.middle;
  const bbLower = indicators.bollingerBands.lower;
  const ema21 = indicators.ema.ema21;
  const ema50 = indicators.ema.ema50;
  const vwap = indicators.vwap.value;
  
  // Entry zone width: ATR × 0.5 for normal, ATR × 1 for volatile
  const volatilityMultiplier = indicators.atr.volatility === 'high' ? 1 : 0.5;
  const entryWidth = atr * volatilityMultiplier;
  
  let entryLow: number;
  let entryHigh: number;
  
  // Entry zone depends on setup type
  switch (setupType) {
    case 'divergence':
      // Wait for pullback to EMA21 for better entry
      entryHigh = Math.min(currentPrice * 1.01, ema21 * 1.005);
      entryLow = Math.max(currentPrice * 0.985, ema21 * 0.995);
      break;
      
    case 'fakePump':
      // Enter quickly, fake pumps reverse fast
      entryHigh = currentPrice * 1.005;
      entryLow = currentPrice * 0.995;
      break;
      
    case 'structureBreak':
      // Enter on retest of broken level (current price area)
      entryHigh = currentPrice * 1.01;
      entryLow = currentPrice - entryWidth;
      break;
      
    case 'doubleTop':
      // Enter after confirmation at neckline area
      entryHigh = currentPrice * 1.005;
      entryLow = currentPrice - entryWidth;
      break;
      
    case 'resistanceRejection':
    case 'rejection':
      // If at BB upper, expect slight pullback first
      if (bbPosition > 90) {
        entryHigh = currentPrice;
        entryLow = currentPrice - entryWidth * 1.5;
      } else {
        entryHigh = currentPrice + entryWidth * 0.5;
        entryLow = currentPrice - entryWidth * 0.5;
      }
      break;
      
    case 'oiDivergence':
      // Similar to divergence, wait for pullback
      entryHigh = Math.min(currentPrice * 1.01, ema21 * 1.005);
      entryLow = Math.max(currentPrice * 0.985, ema21 * 0.995);
      break;
      
    default:
      // Standard entry zone
      entryHigh = currentPrice + entryWidth * 0.5;
      entryLow = currentPrice - entryWidth * 0.5;
  }
  
  const entryZone: [number, number] = [
    Math.round(entryLow * 1000000) / 1000000,
    Math.round(entryHigh * 1000000) / 1000000
  ];
  const avgEntry = (entryLow + entryHigh) / 2;

  // ==================== SMART STOP LOSS ====================
  // Place behind key resistance levels
  
  // Calculate potential SL levels
  const slCandidates: number[] = [];
  
  // 1. ATR-based SL (always include as minimum)
  const atrSL = avgEntry + atr * 1.5;
  slCandidates.push(atrSL);
  
  // 2. 24h High + buffer
  const highBasedSL = high24h * 1.01;
  slCandidates.push(highBasedSL);
  
  // 3. Upper Bollinger Band + buffer
  const bbSL = bbUpper * 1.005;
  slCandidates.push(bbSL);
  
  // 4. VWAP above price + buffer
  if (vwap > avgEntry) {
    slCandidates.push(vwap * 1.01);
  }
  
  // 5. EMA21/50 if above price (resistance)
  if (ema21 > avgEntry) {
    slCandidates.push(ema21 * 1.005);
  }
  
  // Choose SL based on setup type
  let stopLoss: number;
  
  switch (setupType) {
    case 'fakePump':
      // For fake pump, SL behind the high (tight stop)
      stopLoss = Math.min(highBasedSL, atrSL);
      break;
      
    case 'doubleTop':
      // SL behind the second top
      stopLoss = highBasedSL;
      break;
      
    case 'structureBreak':
      // SL behind the broken structure level
      stopLoss = Math.min(...slCandidates.filter(sl => sl > avgEntry + atr));
      break;
      
    case 'divergence':
    case 'oiDivergence':
      // Wider SL for divergence setups
      stopLoss = Math.min(...slCandidates.slice(0, 3));
      break;
      
    default:
      // Choose the most logical (lowest above entry)
      stopLoss = Math.min(...slCandidates.filter(sl => sl > avgEntry));
  }
  
  // Ensure SL is at least 1 ATR from entry (avoid noise)
  const minSL = avgEntry + atr;
  stopLoss = Math.max(stopLoss, minSL);
  stopLoss = Math.round(stopLoss * 1000000) / 1000000;

  // ==================== SMART TAKE PROFITS ====================
  // Based on market structure and key levels
  
  // Find levels below current price for targets
  const tpCandidates: number[] = [];
  
  // Bollinger Band levels
  tpCandidates.push(bbMiddle);  // TP1 candidate
  tpCandidates.push(bbLower);   // TP2 candidate
  
  // EMA levels
  tpCandidates.push(ema50);
  tpCandidates.push(indicators.ema.ema100);
  tpCandidates.push(indicators.ema.ema200);
  
  // 24h Low
  tpCandidates.push(low24h);
  
  // VWAP if below price
  if (vwap > 0 && vwap < avgEntry) {
    tpCandidates.push(vwap);
  }
  
  // Filter and sort targets below entry
  const validTargets = tpCandidates
    .filter(level => level > 0 && level < avgEntry)
    .sort((a, b) => b - a); // Sort descending (closest first)
  
  let takeProfit1: number;
  let takeProfit2: number;
  
  switch (setupType) {
    case 'fakePump':
      // For fake pump: targets based on pump reversion
      const pumpSize = (high24h - low24h) / low24h;
      const pumpHigh = high24h;
      // TP1: 50% reversion of pump
      takeProfit1 = pumpHigh - (pumpHigh - low24h) * 0.5;
      // TP2: Full reversion
      takeProfit2 = low24h;
      break;
      
    case 'doubleTop':
      // Classic measured move from neckline
      const neckline = validTargets[0] || bbMiddle;
      const patternHeight = high24h - neckline;
      takeProfit1 = neckline - patternHeight * 0.5;
      takeProfit2 = neckline - patternHeight;
      break;
      
    case 'structureBreak':
      // Target previous lows
      takeProfit1 = validTargets[0] || bbMiddle;
      takeProfit2 = validTargets[1] || bbLower;
      break;
      
    default:
      // Standard: BB middle for TP1, BB lower for TP2
      if (validTargets.length >= 2) {
        takeProfit1 = validTargets[0];
        takeProfit2 = validTargets[1];
      } else if (validTargets.length === 1) {
        takeProfit1 = validTargets[0];
        takeProfit2 = validTargets[0] - atr * 2;
      } else {
        // Fallback to ATR-based targets
        takeProfit1 = avgEntry - atr * 2;
        takeProfit2 = avgEntry - atr * 4;
      }
  }
  
  // Ensure TP1 > TP2 (TP1 is closer/first target)
  if (takeProfit1 < takeProfit2) {
    [takeProfit1, takeProfit2] = [takeProfit2, takeProfit1];
  }
  
  // Ensure TP1 is closer than TP2
  if (takeProfit1 < takeProfit2) {
    takeProfit1 = takeProfit2 + atr;
  }
  
  // Round TPs
  takeProfit1 = Math.round(takeProfit1 * 1000000) / 1000000;
  takeProfit2 = Math.round(takeProfit2 * 1000000) / 1000000;

  // ==================== RISK/REWARD RATIO ====================
  const risk = stopLoss - avgEntry;
  const reward1 = avgEntry - takeProfit1;
  const reward2 = avgEntry - takeProfit2;
  const riskReward = risk > 0 ? Math.round((reward1 / risk) * 100) / 100 : 0;

  // ==================== BREAKEVEN ====================
  // Trigger when price moves 1R in our favor
  
  const breakevenTrigger = avgEntry - risk; // Moved 1R in profit
  const breakevenSL = avgEntry; // Move SL to entry
  
  // Language-aware breakeven info
  const beInfo = language === 'ru' 
    ? `Перевести SL на ${breakevenSL.toFixed(6)} при достижении ${breakevenTrigger.toFixed(6)}`
    : language === 'zn'
    ? `在 ${breakevenTrigger.toFixed(6)} 时将止损移至 ${breakevenSL.toFixed(6)}`
    : `Move SL to ${breakevenSL.toFixed(6)} at ${breakevenTrigger.toFixed(6)}`;

  return {
    entryZone,
    stopLoss,
    takeProfit1,
    takeProfit2,
    riskReward,
    breakevenTrigger: Math.round(breakevenTrigger * 1000000) / 1000000,
    breakevenSL: Math.round(breakevenSL * 1000000) / 1000000,
    breakevenInfo: beInfo,
  };
}

/**
 * Generate key levels from analysis
 */
function generateKeyLevels(
  high24h: number,
  low24h: number,
  indicators: ReturnType<typeof getAllIndicators>
): number[] {
  const levels: number[] = [];

  levels.push(indicators.ema.ema200);
  levels.push(indicators.ema.ema50);
  levels.push(indicators.ema.ema21);
  levels.push(indicators.bollingerBands.upper);
  levels.push(indicators.bollingerBands.lower);
  levels.push(high24h);
  levels.push(low24h);

  if (indicators.vwap.value > 0) {
    levels.push(indicators.vwap.value);
  }

  return [...new Set(levels.map(l => Math.round(l * 1000000) / 1000000))]
    .sort((a, b) => b - a)
    .slice(0, 8);
}

/**
 * Determine recommendation
 */
function determineRecommendation(
  shortScore: ReturnType<typeof calculateShortScore>,
  indicators: ReturnType<typeof getAllIndicators>
): 'enter' | 'wait' | 'skip' {
  if (shortScore.total >= 60 && indicators.rsi.value > 60) {
    return 'enter';
  } else if (shortScore.total >= 40) {
    return 'wait';
  }
  return 'skip';
}

/**
 * Sort candidates based on selected option
 */
function sortCandidates(candidates: Candidate[], sortBy: SortOption): Candidate[] {
  return [...candidates].sort((a, b) => {
    switch (sortBy) {
      case 'confidence':
        return b.setup.confidence - a.setup.confidence;
      case 'priceChange':
        return b.priceChange24h - a.priceChange24h;
      case 'rsi':
        return b.setup.indicators.rsi.value - a.setup.indicators.rsi.value;
      case 'shortScore':
        return b.shortScore.total - a.shortScore.total;
      case 'volume':
        return b.volume - a.volume;
      default:
        return b.shortScore.total - a.shortScore.total;
    }
  });
}

/**
 * Filter candidates based on filters
 */
function filterCandidates(candidates: Candidate[], filters: ScannerFilters): Candidate[] {
  return candidates.filter(c => {
    if (c.setup.confidence < filters.minConfidence) return false;
    if (c.priceChange24h < filters.minPriceChange) return false;
    if (filters.onlyRsiDivergence && c.setup.indicators.rsiDivergence.type !== 'bearish') return false;
    if (filters.hideFakePump && c.setup.indicators.fakePump.isFake) return false;
    return true;
  });
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const exchange = (searchParams.get('exchange') || 'bybit') as Exchange;
    const timeframe = (searchParams.get('timeframe') || '4h') as Timeframe;
    const minChange = parseInt(searchParams.get('minChange') || '15');
    const sortBy = (searchParams.get('sortBy') || 'confidence') as SortOption;
    const language = (searchParams.get('language') || 'en') as Language;
    
    const t = getTranslations(language);
    
    // Filters
    const filters: ScannerFilters = {
      minConfidence: parseInt(searchParams.get('minConfidence') || '0'),
      minPriceChange: parseInt(searchParams.get('minPriceChange') || '15'),
      onlyRsiDivergence: searchParams.get('onlyRsiDivergence') === 'true',
      hideFakePump: searchParams.get('hideFakePump') === 'true',
    };

    // Get exchange API
    const exchangeAPI = getExchangeAPI(exchange);
    
    // Fetch top gainers
    const tickers = await exchangeAPI.getTopGainers(minChange, 50);
    
    if (tickers.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'No gainers found',
        timestamp: new Date().toISOString(),
        analyzedCount: 0,
        candidates: [],
      });
    }

    // Analyze each ticker with multi-timeframe analysis
    const candidates: Candidate[] = [];
    let skippedNoCandles = 0;
    let skippedLowScore = 0;
    
    for (const ticker of tickers.slice(0, 30)) {
      try {
        // Fetch candles for ALL timeframes in parallel (v2.1: 5 TF pool)
        const [candles5m, candles15m, candles1h, candles2h, candles4h] = await Promise.all([
          exchangeAPI.getKlines(ticker.symbol, '5m', 100),   // Entry timing only
          exchangeAPI.getKlines(ticker.symbol, '15m', 200),  // Short-term trend (10%)
          exchangeAPI.getKlines(ticker.symbol, '1h', 300),   // Main analysis (20%)
          exchangeAPI.getKlines(ticker.symbol, '2h', 200),   // Trend bridge (30%)
          exchangeAPI.getKlines(ticker.symbol, '4h', 300),   // Structure trend (40%)
        ]);
        
        // Need at least 1h or 4h data for main analysis
        if (candles1h.length < 100 && candles4h.length < 100) {
          skippedNoCandles++;
          console.log(`[SKIP] ${ticker.symbol}: insufficient candles (5m:${candles5m.length}, 15m:${candles15m.length}, 1h:${candles1h.length}, 2h:${candles2h.length}, 4h:${candles4h.length})`);
          continue;
        }

        // Fetch perpetual data if available
        let fundingRateData = { rate: 0, nextFundingTime: 0 };
        let openInterestData = { value: 0, change24h: 0 };
        
        if (exchangeAPI.getFundingRate) {
          try {
            fundingRateData = await exchangeAPI.getFundingRate(ticker.symbol);
          } catch (e) {
            // Ignore funding rate errors
          }
        }
        
        if (exchangeAPI.getOpenInterest) {
          try {
            openInterestData = await exchangeAPI.getOpenInterest(ticker.symbol);
          } catch (e) {
            // Ignore OI errors
          }
        }

        // Use multi-TF analysis with perpetual data (v2.1: 5 TF pool)
        const indicators = getAllIndicatorsMultiTF(candles5m, candles15m, candles1h, candles2h, candles4h, {
          fundingRate: fundingRateData.rate || ticker.fundingRate,
          openInterest: openInterestData.value || ticker.openInterest,
          oiChange24h: openInterestData.change24h,
          priceChange24h: ticker.priceChange24h,
        });
        const shortScore = calculateShortScore(indicators);
        const setupType = determineSetupType(indicators, shortScore, ticker.priceChange24h, t);
        
        const atr = indicators.atr.value || (ticker.currentPrice * 0.02);
        const tradeLevels = calculateTradeLevels(
          ticker.currentPrice,
          ticker.high24h,
          ticker.low24h,
          atr,
          indicators,
          setupType.type,
          ticker.priceChange24h,
          language
        );

        const keyLevels = generateKeyLevels(ticker.high24h, ticker.low24h, indicators);
        const warningSignals = generateWarningSignals(indicators, ticker.priceChange24h, t);
        const reasoning = generateReasoning(setupType, indicators, ticker.priceChange24h, t);
        const recommendation = determineRecommendation(shortScore, indicators);
        const analysis = generateAnalysis(ticker.name, setupType, shortScore, indicators, recommendation, t);

        const setup: Setup = {
          ...setupType,
          ...tradeLevels,
          timeframe: 'Multi-TF (5m/15m/1h/2h/4h)',
          reasoning,
          keyLevels,
          warningSignals,
          indicators,
        };

        candidates.push({
          symbol: ticker.symbol,
          name: ticker.name,
          priceChange24h: ticker.priceChange24h,
          currentPrice: ticker.currentPrice,
          volume: ticker.volume,
          high24h: ticker.high24h,
          low24h: ticker.low24h,
          availableExchanges: [exchange],
          shortScore,
          setup,
          analysis,
          recommendation,
        });
        
        console.log(`[OK] ${ticker.symbol}: score=${shortScore.total}, confidence=${setup.confidence}, recommendation=${recommendation}, pattern=${setupType.pattern}`);
      } catch (error) {
        console.error(`Error analyzing ${ticker.symbol}:`, error);
        continue;
      }
    }

    console.log(`[SUMMARY] Total candidates: ${candidates.length}, Skipped (no candles): ${skippedNoCandles}`);
    console.log(`[FILTERS] minConfidence=${filters.minConfidence}, minPriceChange=${filters.minPriceChange}`);

    const filteredCandidates = filterCandidates(candidates, filters);
    console.log(`[AFTER FILTER] ${filteredCandidates.length} candidates passed filters`);
    const sortedCandidates = sortCandidates(filteredCandidates, sortBy);

    return NextResponse.json({
      success: true,
      message: `Found ${sortedCandidates.length} SHORT setups`,
      timestamp: new Date().toISOString(),
      analyzedCount: tickers.length,
      candidates: sortedCandidates,
    });
  } catch (error) {
    console.error('Scanner error:', error);
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
      analyzedCount: 0,
      candidates: [],
    }, { status: 500 });
  }
}
