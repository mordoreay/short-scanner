'use client';

import { Indicators, TranslationKeys, EntryTimingIndicator } from '@/types/scanner';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface IndicatorsGridProps {
  indicators: Indicators;
  t: TranslationKeys;
}

/**
 * SHORT Scanner Color Logic:
 * - GREEN: Good for SHORT (bearish signals, overbought conditions)
 * - RED: Bad for SHORT / Warning (bullish signals, oversold conditions)
 * - YELLOW/ORANGE: Caution / Moderate / Strong trend
 * - GRAY: Neutral
 */

// Status symbols for SHORT signals
const GOOD = '✓';   // Good for SHORT (green)
const BAD = '✗';    // Bad for SHORT (red)
const NEUTRAL = '—'; // Neutral (gray)

// Color helpers
const getShortColor = (isGood: boolean | null) => {
  if (isGood === true) return 'text-green-400';
  if (isGood === false) return 'text-red-400';
  return 'text-muted-foreground';
};

// Safe toFixed helper
const safeToFixed = (value: number | null | undefined, decimals: number = 0): string => {
  if (value === null || value === undefined || isNaN(value)) return '—';
  return value.toFixed(decimals);
};

// Build Entry Timing tooltip v2.0
const buildEntryTimingTooltip = (entry: EntryTimingIndicator | undefined, t: TranslationKeys): string => {
  if (!entry) return 'No data';

  const lines: string[] = [];
  const bd = entry.breakdown;

  // Header
  lines.push(`⏱️ Entry Timing v2.0 (${entry.score}/100)`);
  lines.push(`Quality: ${entry.quality}`);
  lines.push('');

  // Candle Patterns
  if (bd?.candlePatterns) {
    const cp = bd.candlePatterns;
    lines.push(`🕯️ Candle Patterns (${cp.score}/${cp.maxScore})`);
    if (cp.detected.length > 0) {
      cp.detected.forEach(p => {
        const icon = p.reliability === 'high' ? '⭐' : p.reliability === 'medium' ? '◆' : '○';
        lines.push(`  ${icon} ${p.nameRu} (+${p.score})`);
      });
    } else {
      lines.push('  Нет паттернов');
    }
    if (cp.bullishWarning.length > 0) {
      lines.push('  ⚠️ Бычьи паттерны:');
      cp.bullishWarning.forEach(p => lines.push(`    - ${p.nameRu}`));
    }
    lines.push('');
  }

  // Indicators
  if (bd?.indicators) {
    const ind = bd.indicators;
    lines.push(`📊 Indicators (${ind.score}/${ind.maxScore})`);
    lines.push(`  RSI 5m: ${safeToFixed(ind.rsi5m.value, 1)} (${ind.rsi5m.signal}) +${ind.rsi5m.score}`);
    lines.push(`  StochRSI: K=${ind.stochRsi.k} D=${ind.stochRsi.d} ${ind.stochRsi.cross !== 'none' ? ind.stochRsi.cross : ''} +${ind.stochRsi.score}`);
    lines.push(`  MACD: ${ind.macd.trend} ${ind.macd.histogramDeclining ? '↓' : ''} +${ind.macd.score}`);
    if (ind.divergence.type !== 'none') {
      lines.push(`  Divergence: ${ind.divergence.type} +${ind.divergence.score}`);
    }
    lines.push('');
  }

  // Volume
  if (bd?.volume) {
    const vol = bd.volume;
    lines.push(`📦 Volume (${vol.score}/${vol.maxScore})`);
    lines.push(`  vs Avg: ${(vol.currentVsAvg * 100).toFixed(0)}%${vol.spike ? ' (spike!)' : ''}`);
    lines.push(`  Sell pressure: ${vol.sellingPressure}%`);
    lines.push('');
  }

  // Price Position
  if (bd?.pricePosition) {
    const pp = bd.pricePosition;
    lines.push(`📍 Price Position (${pp.score}/${pp.maxScore})`);
    lines.push(`  At resistance: ${pp.atResistance ? `Yes (${pp.resistanceStrength})` : 'No'}`);
    if (pp.rejectionWick > 0) {
      lines.push(`  Rejection wick: ${pp.rejectionWick}%`);
    }
    lines.push('');
  }

  // Recommendation
  lines.push(`💡 ${entry.recommendation}`);
  if (entry.waitTime) {
    lines.push(`⏳ Wait: ${entry.waitTime}`);
  }

  return lines.join('\n');
};

export function IndicatorsGrid({ indicators, t }: IndicatorsGridProps) {
  // Count bearish/bullish timeframes for Multi-TF (EXCLUDING 5m from scoring)
  const tf = indicators.multiTFAlignment?.timeframes || {};
  const scoringTFs = [tf['15m'], tf['1h'], tf['2h'], tf['4h']].filter(Boolean);
  const bearishCount = scoringTFs.filter(item => item === 'bearish').length;
  const bullishCount = scoringTFs.filter(item => item === 'bullish').length;

  // Safe values with defaults
  const bbPosition = indicators.bollingerBands?.position ?? 50;
  const bbSqueeze = indicators.bollingerBands?.squeeze ?? false;
  const vwapDeviation = indicators.vwap?.deviation ?? 0;
  const atrValue = indicators.atr?.value ?? 0;
  const atrPercentage = indicators.atr?.percentage ?? 0;
  const atrVolatility = indicators.atr?.volatility ?? 'normal';

  const indicatorItems = [
    // ========== OSCILLATORS: Number + Status ==========
    {
      name: t.rsi,
      value: indicators.rsi?.trend === 'overbought' 
        ? `${safeToFixed(indicators.rsi?.value)} ${GOOD}`
        : indicators.rsi?.trend === 'oversold' 
          ? `${safeToFixed(indicators.rsi?.value)} ${BAD}`
          : safeToFixed(indicators.rsi?.value),
      tooltip: `RSI: ${safeToFixed(indicators.rsi?.value, 1)} - ${indicators.rsi?.trend === 'overbought' ? t.overboughtShort : indicators.rsi?.trend === 'oversold' ? t.oversoldShort : t.neutralSignal}`,
      color: getShortColor(
        indicators.rsi?.trend === 'overbought' ? true : 
        indicators.rsi?.trend === 'oversold' ? false : null
      ),
    },
    {
      name: t.stochRsi,
      value: indicators.stochRsi?.overbought 
        ? `${safeToFixed(indicators.stochRsi?.k)} ${GOOD}`
        : indicators.stochRsi?.oversold 
          ? `${safeToFixed(indicators.stochRsi?.k)} ${BAD}`
          : `${safeToFixed(indicators.stochRsi?.k)}/${safeToFixed(indicators.stochRsi?.d)}`,
      tooltip: `StochRSI K: ${safeToFixed(indicators.stochRsi?.k, 1)}, D: ${safeToFixed(indicators.stochRsi?.d, 1)}. ${indicators.stochRsi?.overbought ? t.overboughtShort : indicators.stochRsi?.oversold ? t.oversoldShort : t.neutralSignal}`,
      color: getShortColor(
        indicators.stochRsi?.overbought ? true :
        indicators.stochRsi?.oversold ? false : null
      ),
    },

    // ========== TREND INDICATORS: SHORT / NO / — ==========
    {
      name: t.macd,
      value: indicators.macd?.trend === 'bearish' 
        ? 'SHORT'
        : indicators.macd?.trend === 'bullish' 
          ? 'NO' 
          : NEUTRAL,
      tooltip: `MACD: ${safeToFixed(indicators.macd?.macd, 4)}, Signal: ${safeToFixed(indicators.macd?.signal, 4)}, Histogram: ${safeToFixed(indicators.macd?.histogram, 4)}\n${indicators.macd?.trend === 'bearish' ? t.bearishTrend : indicators.macd?.trend === 'bullish' ? t.bullishTrend : t.neutralSignal}`,
      color: getShortColor(
        indicators.macd?.trend === 'bearish' ? true :
        indicators.macd?.trend === 'bullish' ? false : null
      ),
    },
    {
      name: t.ema,
      value: indicators.ema?.trend === 'bearish' 
        ? 'SHORT'
        : indicators.ema?.trend === 'bullish' 
          ? 'NO' 
          : NEUTRAL,
      tooltip: `EMA Trend: ${indicators.ema?.trend || 'N/A'}. EMA200 Distance: ${indicators.ema?.ema200Distance > 0 ? '+' : ''}${safeToFixed(indicators.ema?.ema200Distance, 1)}%\n${indicators.ema?.trend === 'bearish' ? t.bearishEMA : indicators.ema?.trend === 'bullish' ? t.bullishEMA : t.neutralSignal}`,
      color: getShortColor(
        indicators.ema?.trend === 'bearish' ? true :
        indicators.ema?.trend === 'bullish' ? false : null
      ),
    },
    {
      name: t.fourHTrend,
      value: indicators.fourHTrend?.trend === 'bearish' 
        ? 'SHORT'
        : indicators.fourHTrend?.trend === 'bullish' 
          ? 'NO' 
          : NEUTRAL,
      tooltip: `4H Trend: ${indicators.fourHTrend?.trend || 'N/A'} (${indicators.fourHTrend?.strength || 'N/A'})\n${indicators.fourHTrend?.trend === 'bearish' ? t.bearish4H : indicators.fourHTrend?.trend === 'bullish' ? t.bullish4H : t.neutralSignal}`,
      color: getShortColor(
        indicators.fourHTrend?.trend === 'bearish' ? true :
        indicators.fourHTrend?.trend === 'bullish' ? false : null
      ),
    },
    {
      name: t.obv,
      value: indicators.obv?.trend === 'bearish' 
        ? 'SHORT'
        : indicators.obv?.trend === 'bullish' 
          ? 'NO' 
          : NEUTRAL,
      tooltip: `OBV Trend: ${indicators.obv?.trend || 'N/A'}. Divergence: ${indicators.obv?.divergence || 'None'}\n${indicators.obv?.trend === 'bearish' ? t.fallingVol : indicators.obv?.trend === 'bullish' ? t.risingVol : t.neutralSignal}`,
      color: getShortColor(
        indicators.obv?.trend === 'bearish' ? true :
        indicators.obv?.trend === 'bullish' ? false : null
      ),
    },

    // ========== DIVERGENCES: SHORT / NO / — ==========
    {
      name: t.rsiDivergence,
      value: indicators.rsiDivergence?.type === 'bearish' 
        ? 'SHORT'
        : indicators.rsiDivergence?.type === 'bullish' 
          ? 'NO' 
          : NEUTRAL,
      tooltip: `RSI Divergence: ${indicators.rsiDivergence?.type || 'none'} (${indicators.rsiDivergence?.strength || 'N/A'}). Confirmation: ${indicators.rsiDivergence?.confirmation ? 'Yes' : 'No'}\n${indicators.rsiDivergence?.type === 'bearish' ? t.bearishDiv : indicators.rsiDivergence?.type === 'bullish' ? t.bullishDiv : t.noDiv}`,
      color: getShortColor(
        indicators.rsiDivergence?.type === 'bearish' ? true :
        indicators.rsiDivergence?.type === 'bullish' ? false : null
      ),
    },
    {
      name: t.macdDivergence,
      value: indicators.macdDivergence?.type === 'bearish' 
        ? 'SHORT'
        : indicators.macdDivergence?.type === 'bullish' 
          ? 'NO' 
          : NEUTRAL,
      tooltip: `MACD Divergence: ${indicators.macdDivergence?.type || 'none'} (${indicators.macdDivergence?.strength || 'N/A'})\n${indicators.macdDivergence?.type === 'bearish' ? t.bearishDiv : indicators.macdDivergence?.type === 'bullish' ? t.bullishDiv : t.noDiv}`,
      color: getShortColor(
        indicators.macdDivergence?.type === 'bearish' ? true :
        indicators.macdDivergence?.type === 'bullish' ? false : null
      ),
    },

    // ========== MULTI-TF: Weighted Score with 5 TF ==========
    {
      name: t.multiTFAlignment,
      value: indicators.multiTFAlignment?.direction === 'bearish'
        ? `${indicators.multiTFAlignment?.score ?? 0} SHORT`
        : indicators.multiTFAlignment?.direction === 'bullish'
          ? `${indicators.multiTFAlignment?.score ?? 0} NO`
          : `${indicators.multiTFAlignment?.score ?? 0} MIX`,
      tooltip: `Multi-TF Alignment (Weighted):\n5m: ${tf['5m'] || 'N/A'} (display only)\n15m: ${tf['15m'] || 'N/A'} (10% weight)\n1h: ${tf['1h'] || 'N/A'} (20% weight)\n2h: ${tf['2h'] || 'N/A'} (30% weight)\n4h: ${tf['4h'] || 'N/A'} (40% weight)\n\nScore: ${indicators.multiTFAlignment?.score ?? 0}/100\n${bearishCount >= 3 ? t.strongBearishTrend : bearishCount >= 2 ? t.bearishTrendGood : bullishCount >= 3 ? t.strongBullishTrend : bullishCount >= 2 ? t.bullishTrendBad : t.mixedSignals}`,
      color: getShortColor(
        indicators.multiTFAlignment?.direction === 'bearish' ? true :
        indicators.multiTFAlignment?.direction === 'bullish' ? false : null
      ),
    },
    // ========== ENTRY TIMING: 5m-based v2.0 with badge ==========
    {
      name: 'Entry',
      value: (() => {
        const et = indicators.entryTiming;
        if (!et) return NEUTRAL;
        
        const score = et.score ?? 0;
        const signal = et.signal;
        const waitTime = et.waitTime;
        
        // Color indicator based on score
        const colorIcon = score >= 70 ? '🟢' : score >= 55 ? '🟡' : score >= 40 ? '🟠' : '🔴';
        
        // Build display value
        if (signal === 'enter_now') {
          return `${colorIcon} ${score} NOW`;
        } else if (signal === 'ready') {
          return `${colorIcon} ${score} READY`;
        } else {
          return `${colorIcon} ${score} WAIT${waitTime ? ` ${waitTime}` : ''}`;
        }
      })(),
      tooltip: buildEntryTimingTooltip(indicators.entryTiming, t),
      color: (() => {
        const score = indicators.entryTiming?.score ?? 0;
        if (score >= 70) return 'text-green-400 font-semibold';
        if (score >= 55) return 'text-yellow-400 font-semibold';
        if (score >= 40) return 'text-orange-400';
        return 'text-muted-foreground';
      })(),
    },

    // ========== POSITION INDICATORS: Value + Status ==========
    {
      name: t.bollingerBands,
      value: bbPosition > 80 
        ? `>${safeToFixed(bbPosition)} ${GOOD}`
        : bbPosition < 20 
          ? `<${safeToFixed(bbPosition)} ${BAD}`
          : `${safeToFixed(bbPosition)}%`,
      tooltip: `BB Position: ${safeToFixed(bbPosition, 1)}% within bands. ${bbSqueeze ? t.squeezeDetected : ''}\n${bbPosition > 80 ? t.priceUpperBB : bbPosition < 20 ? t.priceLowerBB : t.priceMidBB}`,
      color: getShortColor(
        bbPosition > 80 ? true :
        bbPosition < 20 ? false : null
      ),
    },
    {
      name: t.vwap,
      value: vwapDeviation > 3 
        ? `+${safeToFixed(vwapDeviation, 1)}% ${GOOD}`
        : vwapDeviation < -3 
          ? `${safeToFixed(vwapDeviation, 1)}% ${BAD}`
          : `${vwapDeviation > 0 ? '+' : ''}${safeToFixed(vwapDeviation, 1)}%`,
      tooltip: `VWAP Deviation: ${safeToFixed(vwapDeviation, 2)}%\n${vwapDeviation > 3 ? t.priceAboveVWAP : vwapDeviation < -3 ? t.priceBelowVWAP : t.priceNearVWAP}`,
      color: getShortColor(
        vwapDeviation > 3 ? true :
        vwapDeviation < -3 ? false : null
      ),
    },

    // ========== SPECIAL INDICATORS ==========
    {
      name: t.adx,
      value: (indicators.adx?.value ?? 0) > 25 
        ? `${safeToFixed(indicators.adx?.value)} STRONG`
        : `${safeToFixed(indicators.adx?.value)} WEAK`,
      tooltip: `ADX: ${safeToFixed(indicators.adx?.value, 1)} (${indicators.adx?.trend || 'N/A'} trend). +DI: ${safeToFixed(indicators.adx?.plusDI, 1)}, -DI: ${safeToFixed(indicators.adx?.minusDI, 1)}\n${(indicators.adx?.value ?? 0) > 25 ? t.strongTrend : t.weakTrend}`,
      color: (indicators.adx?.value ?? 0) > 25 ? 'text-orange-400' : 'text-muted-foreground',
    },
    {
      name: t.fakePump,
      value: indicators.fakePump?.isFake 
        ? `${indicators.fakePump?.confidence ?? 0}% ${GOOD}`
        : NEUTRAL,
      tooltip: indicators.fakePump?.isFake 
        ? `Fake Pump Detected! Confidence: ${indicators.fakePump?.confidence ?? 0}%. ${indicators.fakePump?.reason || ''}\n${t.fakePumpDetected}`
        : t.noFakePump,
      color: getShortColor(indicators.fakePump?.isFake ? true : null),
    },
    {
      name: t.atr,
      value: atrVolatility === 'high' 
        ? `${safeToFixed(atrPercentage, 1)}% HIGH`
        : atrVolatility === 'low'
          ? `${safeToFixed(atrPercentage, 1)}% LOW`
          : `${safeToFixed(atrPercentage, 1)}%`,
      tooltip: `ATR: ${safeToFixed(atrValue, 6)} (${safeToFixed(atrPercentage, 2)}% of price). Volatility: ${atrVolatility}\n${atrVolatility === 'high' ? t.highVolatility : atrVolatility === 'low' ? t.lowVolatility : t.mediumVolatility}`,
      color: atrVolatility === 'high' ? 'text-yellow-400' : 'text-muted-foreground',
    },

    // ========== PERPETUAL INDICATORS ==========
    {
      name: t.fundingRate,
      value: (() => {
        const hasData = indicators.fundingRate?.rate !== undefined && indicators.fundingRate?.rate !== null;
        if (!hasData) return t.noData;
        const rate = indicators.fundingRate.rate!;
        const signal = indicators.fundingRate?.signal;
        if (signal === 'short') return `${safeToFixed(rate * 100, 3)}% ${GOOD}`;
        if (signal === 'long') return `${safeToFixed(rate * 100, 3)}% ${BAD}`;
        return `${safeToFixed(rate * 100, 3)}%`;
      })(),
      tooltip: (() => {
        const hasData = indicators.fundingRate?.rate !== undefined && indicators.fundingRate?.rate !== null;
        const rate = indicators.fundingRate?.rate ?? 0;
        let scoreImpact = '';
        if (!hasData) {
          scoreImpact = `\n⚠️ ${t.noScoreImpact}`;
        } else {
          if (rate < -0.001) scoreImpact = `\n✅ ${t.affectsScore}: ${t.bonus} +7`;
          else if (rate < -0.0005) scoreImpact = `\n✅ ${t.affectsScore}: ${t.bonus} +5`;
          else if (rate < -0.0001) scoreImpact = `\n✅ ${t.affectsScore}: ${t.bonus} +3`;
          else if (rate >= -0.0001 && rate <= 0.0001) scoreImpact = `\n✅ ${t.affectsScore}: ${t.bonus} +2`;
          else if (rate <= 0.0005) scoreImpact = `\n✅ ${t.affectsScore}: ${t.bonus} +1`;
          else if (rate <= 0.001) scoreImpact = `\n⚠️ ${t.affectsScore}: ${t.penalty} -2`;
          else scoreImpact = `\n⚠️ ${t.affectsScore}: ${t.penalty} -5`;
        }
        return `Funding Rate: ${safeToFixed(rate * 100, 4)}%\nAnnualized: ${safeToFixed(indicators.fundingRate?.annualized, 1)}%${scoreImpact}\n${hasData ? (indicators.fundingRate?.signal === 'short' ? t.positiveFunding : indicators.fundingRate?.signal === 'long' ? t.negativeFunding : t.neutralFunding) : ''}`;
      })(),
      color: (() => {
        const hasData = indicators.fundingRate?.rate !== undefined && indicators.fundingRate?.rate !== null;
        if (!hasData) return 'text-muted-foreground/50';
        return getShortColor(
          indicators.fundingRate?.signal === 'short' ? true :
          indicators.fundingRate?.signal === 'long' ? false : null
        );
      })(),
    },
    {
      name: t.openInterest,
      value: (() => {
        const hasData = indicators.openInterest?.interpretation !== undefined && indicators.openInterest?.interpretation !== null;
        if (!hasData) return t.noData;
        const interp = indicators.openInterest!.interpretation!;
        const change = indicators.openInterest?.change24h ?? 0;
        if (interp === 'bearish') return `${change > 0 ? '+' : ''}${safeToFixed(change)}% ${GOOD}`;
        if (interp === 'bullish') return `${change > 0 ? '+' : ''}${safeToFixed(change)}% ${BAD}`;
        return `${change > 0 ? '+' : ''}${safeToFixed(change)}%`;
      })(),
      tooltip: (() => {
        const hasData = indicators.openInterest?.interpretation !== undefined && indicators.openInterest?.interpretation !== null;
        const interp = indicators.openInterest?.interpretation;
        let scoreImpact = '';
        if (!hasData) {
          scoreImpact = `\n⚠️ ${t.noScoreImpact}`;
        } else {
          if (interp === 'bearish') scoreImpact = `\n✅ ${t.affectsScore}: ${t.bonus} +5`;
          else if (interp === 'neutral') scoreImpact = `\n✅ ${t.affectsScore}: ${t.bonus} +2`;
          else scoreImpact = `\n✅ ${t.affectsScore}: 0`;
        }
        return `Open Interest: $${safeToFixed((indicators.openInterest?.value ?? 0) / 1000000, 1)}M\nChange 24h: ${safeToFixed(indicators.openInterest?.change24h, 1)}%${scoreImpact}\n${hasData ? (interp === 'bearish' ? t.oiGrowing : interp === 'bullish' ? t.oiFalling : t.oiNeutral) : ''}`;
      })(),
      color: (() => {
        const hasData = indicators.openInterest?.interpretation !== undefined && indicators.openInterest?.interpretation !== null;
        if (!hasData) return 'text-muted-foreground/50';
        const interp = indicators.openInterest!.interpretation!;
        return getShortColor(
          interp === 'bearish' ? true :
          interp === 'bullish' ? false : null
        );
      })(),
    },

    // ========== MARKET SENTIMENT ==========
    {
      name: t.longShortRatio,
      value: (indicators.longShortRatio?.longRatio ?? 50) >= 60
        ? `${safeToFixed(indicators.longShortRatio?.longRatio, 0)}%L ${GOOD}`
        : (indicators.longShortRatio?.longRatio ?? 50) <= 40
          ? `${safeToFixed(indicators.longShortRatio?.shortRatio, 0)}%S ${BAD}`
          : `${safeToFixed(indicators.longShortRatio?.longRatio, 0)}%L`,
      tooltip: `${t.longShortRatioTooltip}\nLong: ${safeToFixed(indicators.longShortRatio?.longRatio, 1)}%\nShort: ${safeToFixed(indicators.longShortRatio?.shortRatio, 1)}%\nRatio: ${safeToFixed(indicators.longShortRatio?.ratio, 2)}\n${(indicators.longShortRatio?.longRatio ?? 50) >= 60 ? t.crowdLonging : (indicators.longShortRatio?.longRatio ?? 50) <= 40 ? t.crowdShorting : t.neutralSignal}`,
      color: getShortColor(
        (indicators.longShortRatio?.longRatio ?? 50) >= 60 ? true :
        (indicators.longShortRatio?.longRatio ?? 50) <= 40 ? false : null
      ),
    },
    {
      name: t.topTraders,
      value: (indicators.topTraders?.shortRatio ?? 50) >= 55
        ? `${safeToFixed(indicators.topTraders?.shortRatio, 0)}%S ${GOOD}`
        : (indicators.topTraders?.longRatio ?? 50) >= 55
          ? `${safeToFixed(indicators.topTraders?.longRatio, 0)}%L ${BAD}`
          : `${safeToFixed(indicators.topTraders?.longRatio, 0)}%L`,
      tooltip: `${t.topTradersTooltip}\nLong: ${safeToFixed(indicators.topTraders?.longRatio, 1)}%\nShort: ${safeToFixed(indicators.topTraders?.shortRatio, 1)}%\n${(indicators.topTraders?.shortRatio ?? 50) >= 55 ? t.topTradersShort : (indicators.topTraders?.longRatio ?? 50) >= 55 ? t.topTradersLong : t.neutralSignal}`,
      color: getShortColor(
        (indicators.topTraders?.shortRatio ?? 50) >= 55 ? true :
        (indicators.topTraders?.longRatio ?? 50) >= 55 ? false : null
      ),
    },

    // ========== ORDER FLOW ==========
    {
      name: t.orderBook,
      value: (() => {
        const hasData = (indicators.orderBook?.bidVolume ?? 0) > 0 || (indicators.orderBook?.askVolume ?? 0) > 0;
        if (!hasData) return t.noData;
        const imb = indicators.orderBook?.imbalancePercent ?? 0;
        if (imb <= -20) return `Ask ${Math.abs(imb).toFixed(0)}% ${GOOD}`;
        if (imb >= 20) return `Bid ${imb.toFixed(0)}% ${BAD}`;
        return `${safeToFixed(imb, 0)}%`;
      })(),
      tooltip: (() => {
        const hasData = (indicators.orderBook?.bidVolume ?? 0) > 0 || (indicators.orderBook?.askVolume ?? 0) > 0;
        const imb = indicators.orderBook?.imbalancePercent ?? 0;
        let scoreImpact = '';
        if (!hasData) {
          scoreImpact = `\n⚠️ ${t.noScoreImpact}`;
        } else {
          if (imb <= -30) scoreImpact = `\n✅ ${t.affectsScore}: ${t.bonus} +4`;
          else if (imb <= -20) scoreImpact = `\n✅ ${t.affectsScore}: ${t.bonus} +2`;
          else if (imb >= 30) scoreImpact = `\n⚠️ ${t.affectsScore}: ${t.penalty} -3`;
          else if (imb >= 20) scoreImpact = `\n⚠️ ${t.affectsScore}: ${t.penalty} -1`;
          else scoreImpact = `\n✅ ${t.affectsScore}: 0`;
        }
        return `${t.orderBookTooltip}\nBid Vol: ${safeToFixed(indicators.orderBook?.bidVolume, 0)}\nAsk Vol: ${safeToFixed(indicators.orderBook?.askVolume, 0)}\nImbalance: ${safeToFixed(imb, 1)}%\nSpread: ${safeToFixed(indicators.orderBook?.spread, 4)}%${scoreImpact}\n${hasData ? (imb <= -20 ? t.askDominance : imb >= 20 ? t.bidDominance : t.neutralSignal) : ''}`;
      })(),
      color: (() => {
        const hasData = (indicators.orderBook?.bidVolume ?? 0) > 0 || (indicators.orderBook?.askVolume ?? 0) > 0;
        if (!hasData) return 'text-muted-foreground/50';
        const imb = indicators.orderBook?.imbalancePercent ?? 0;
        return getShortColor(imb <= -20 ? true : imb >= 20 ? false : null);
      })(),
    },
    {
      name: t.liquidationHeatmap,
      value: (() => {
        const longLiq = indicators.liquidationHeatmap?.totalLongLiquidations ?? 0;
        const shortLiq = indicators.liquidationHeatmap?.totalShortLiquidations ?? 0;
        const hasData = longLiq > 0 || shortLiq > 0;
        if (!hasData) return t.noData;
        if (longLiq > shortLiq * 1.5) return `Liq L ${GOOD}`;
        if (shortLiq > longLiq * 1.5) return `Liq S ${BAD}`;
        return `${safeToFixed(longLiq / 1000, 0)}K`;
      })(),
      tooltip: (() => {
        const longLiq = indicators.liquidationHeatmap?.totalLongLiquidations ?? 0;
        const shortLiq = indicators.liquidationHeatmap?.totalShortLiquidations ?? 0;
        const hasData = longLiq > 0 || shortLiq > 0;
        let scoreImpact = '';
        if (!hasData) {
          scoreImpact = `\n⚠️ ${t.noScoreImpact}`;
        } else {
          if (longLiq > shortLiq * 2 && longLiq > 100000) scoreImpact = `\n✅ ${t.affectsScore}: ${t.bonus} +3`;
          else if (shortLiq > longLiq * 2 && shortLiq > 100000) scoreImpact = `\n⚠️ ${t.affectsScore}: ${t.penalty} -3`;
          else scoreImpact = `\n✅ ${t.affectsScore}: 0`;
        }
        return `${t.liquidationHeatmapTooltip}\nLong Liq Below: $${safeToFixed(longLiq / 1000, 1)}K\nShort Liq Above: $${safeToFixed(shortLiq / 1000, 1)}K${scoreImpact}\n${hasData ? (longLiq > shortLiq * 1.5 ? t.longLiquidsBelow : shortLiq > longLiq * 1.5 ? t.shortLiquidsAbove : t.neutralSignal) : ''}`;
      })(),
      color: (() => {
        const longLiq = indicators.liquidationHeatmap?.totalLongLiquidations ?? 0;
        const shortLiq = indicators.liquidationHeatmap?.totalShortLiquidations ?? 0;
        const hasData = longLiq > 0 || shortLiq > 0;
        if (!hasData) return 'text-muted-foreground/50';
        return getShortColor(longLiq > shortLiq * 1.5 ? true : shortLiq > longLiq * 1.5 ? false : null);
      })(),
    },
  ];

  return (
    <div className="grid grid-cols-4 md:grid-cols-7 gap-1.5 text-xs">
      <TooltipProvider>
        {indicatorItems.map((item, i) => (
          <Tooltip key={i}>
            <TooltipTrigger asChild>
              <div className="flex flex-col items-center p-1.5 rounded bg-secondary/50 hover:bg-secondary transition-colors cursor-help">
                <span className="text-muted-foreground text-[10px]">{item.name}</span>
                <span className={`font-medium ${item.color}`}>{item.value}</span>
              </div>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-xs">
              <p className="text-xs whitespace-pre-line">{item.tooltip}</p>
            </TooltipContent>
          </Tooltip>
        ))}
      </TooltipProvider>
    </div>
  );
}
