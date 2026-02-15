'use client';

import { Indicators, TranslationKeys } from '@/types/scanner';
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
    // ========== ENTRY TIMING: 5m-based ==========
    {
      name: 'Entry',
      value: indicators.entryTiming?.signal === 'enter_now'
        ? `NOW ${GOOD}`
        : indicators.entryTiming?.signal === 'ready'
          ? `${indicators.entryTiming?.score ?? 0}`
          : `WAIT`,
      tooltip: `Entry Timing (5m-based, NO impact on signal):\n5m RSI: ${safeToFixed(indicators.entryTiming?.rsi5m, 1)}\nQuality: ${indicators.entryTiming?.quality || 'N/A'}\nScore: ${indicators.entryTiming?.score ?? 0}/100\nMicro-div: ${indicators.entryTiming?.divergence5m || 'none'}\n\n${indicators.entryTiming?.reason || ''}\n\n${indicators.entryTiming?.signal === 'enter_now' ? t.optimalEntry : indicators.entryTiming?.signal === 'ready' ? t.goodEntry : t.waitEntry}`,
      color: indicators.entryTiming?.signal === 'enter_now' 
        ? 'text-green-400 font-bold' 
        : indicators.entryTiming?.signal === 'ready' 
          ? 'text-yellow-400' 
          : 'text-muted-foreground',
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
      value: indicators.fundingRate?.signal === 'short'
        ? `${safeToFixed((indicators.fundingRate?.rate ?? 0) * 100, 3)}% ${GOOD}`
        : indicators.fundingRate?.signal === 'long'
          ? `${safeToFixed((indicators.fundingRate?.rate ?? 0) * 100, 3)}% ${BAD}`
          : `${safeToFixed((indicators.fundingRate?.rate ?? 0) * 100, 3)}%`,
      tooltip: `Funding Rate: ${safeToFixed((indicators.fundingRate?.rate ?? 0) * 100, 4)}%\nAnnualized: ${safeToFixed(indicators.fundingRate?.annualized, 1)}%\n${indicators.fundingRate?.signal === 'short' ? t.positiveFunding : indicators.fundingRate?.signal === 'long' ? t.negativeFunding : t.neutralFunding}`,
      color: getShortColor(
        indicators.fundingRate?.signal === 'short' ? true :
        indicators.fundingRate?.signal === 'long' ? false : null
      ),
    },
    {
      name: t.openInterest,
      value: indicators.openInterest?.interpretation === 'bearish'
        ? `${(indicators.openInterest?.change24h ?? 0) > 0 ? '+' : ''}${safeToFixed(indicators.openInterest?.change24h)}% ${GOOD}`
        : indicators.openInterest?.interpretation === 'bullish'
          ? `${(indicators.openInterest?.change24h ?? 0) > 0 ? '+' : ''}${safeToFixed(indicators.openInterest?.change24h)}% ${BAD}`
          : `${(indicators.openInterest?.change24h ?? 0) > 0 ? '+' : ''}${safeToFixed(indicators.openInterest?.change24h)}%`,
      tooltip: `Open Interest: $${safeToFixed((indicators.openInterest?.value ?? 0) / 1000000, 1)}M\nChange 24h: ${safeToFixed(indicators.openInterest?.change24h, 1)}%\n${indicators.openInterest?.interpretation === 'bearish' ? t.oiGrowing : indicators.openInterest?.interpretation === 'bullish' ? t.oiFalling : t.oiNeutral}`,
      color: getShortColor(
        indicators.openInterest?.interpretation === 'bearish' ? true :
        indicators.openInterest?.interpretation === 'bullish' ? false : null
      ),
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
