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

export function IndicatorsGrid({ indicators, t }: IndicatorsGridProps) {
  // Count bearish/bullish timeframes for Multi-TF (EXCLUDING 5m from scoring)
  const tf = indicators.multiTFAlignment.timeframes;
  const scoringTFs = [tf['15m'], tf['1h'], tf['2h'], tf['4h']];
  const bearishCount = scoringTFs.filter(t => t === 'bearish').length;
  const bullishCount = scoringTFs.filter(t => t === 'bullish').length;
  const neutralCount = scoringTFs.filter(t => t === 'neutral').length;

  const indicatorItems = [
    // ========== OSCILLATORS: Number + Status ==========
    {
      name: t.rsi,
      value: indicators.rsi.trend === 'overbought' 
        ? `${indicators.rsi.value.toFixed(0)} ${GOOD}`
        : indicators.rsi.trend === 'oversold' 
          ? `${indicators.rsi.value.toFixed(0)} ${BAD}`
          : indicators.rsi.value.toFixed(0),
      tooltip: `RSI: ${indicators.rsi.value.toFixed(1)} - ${indicators.rsi.trend === 'overbought' ? 'Перекуплен (>70) = хорошо для SHORT' : indicators.rsi.trend === 'oversold' ? 'Перепродан (<30) = плохо для SHORT' : 'Нейтрально'}`,
      color: getShortColor(
        indicators.rsi.trend === 'overbought' ? true : 
        indicators.rsi.trend === 'oversold' ? false : null
      ),
    },
    {
      name: t.stochRsi,
      value: indicators.stochRsi.overbought 
        ? `${indicators.stochRsi.k.toFixed(0)} ${GOOD}`
        : indicators.stochRsi.oversold 
          ? `${indicators.stochRsi.k.toFixed(0)} ${BAD}`
          : `${indicators.stochRsi.k.toFixed(0)}/${indicators.stochRsi.d.toFixed(0)}`,
      tooltip: `StochRSI K: ${indicators.stochRsi.k.toFixed(1)}, D: ${indicators.stochRsi.d.toFixed(1)}. ${indicators.stochRsi.overbought ? 'Перекуплен = хорошо для SHORT' : indicators.stochRsi.oversold ? 'Перепродан = плохо для SHORT' : 'Нейтрально'}`,
      color: getShortColor(
        indicators.stochRsi.overbought ? true :
        indicators.stochRsi.oversold ? false : null
      ),
    },

    // ========== TREND INDICATORS: SHORT / NO / — ==========
    {
      name: t.macd,
      value: indicators.macd.trend === 'bearish' 
        ? 'SHORT'
        : indicators.macd.trend === 'bullish' 
          ? 'NO' 
          : NEUTRAL,
      tooltip: `MACD: ${indicators.macd.macd.toFixed(4)}, Signal: ${indicators.macd.signal.toFixed(4)}, Histogram: ${indicators.macd.histogram.toFixed(4)}\n${indicators.macd.trend === 'bearish' ? 'Медвежий тренд = хорошо для SHORT' : indicators.macd.trend === 'bullish' ? 'Бычий тренд = плохо для SHORT' : 'Нейтрально'}`,
      color: getShortColor(
        indicators.macd.trend === 'bearish' ? true :
        indicators.macd.trend === 'bullish' ? false : null
      ),
    },
    {
      name: t.ema,
      value: indicators.ema.trend === 'bearish' 
        ? 'SHORT'
        : indicators.ema.trend === 'bullish' 
          ? 'NO' 
          : NEUTRAL,
      tooltip: `EMA Trend: ${indicators.ema.trend}. EMA200 Distance: ${indicators.ema.ema200Distance > 0 ? '+' : ''}${indicators.ema.ema200Distance.toFixed(1)}%\n${indicators.ema.trend === 'bearish' ? 'Медвежье выравнивание EMA = хорошо для SHORT' : indicators.ema.trend === 'bullish' ? 'Бычье выравнивание = плохо для SHORT' : 'Нейтрально'}`,
      color: getShortColor(
        indicators.ema.trend === 'bearish' ? true :
        indicators.ema.trend === 'bullish' ? false : null
      ),
    },
    {
      name: t.fourHTrend,
      value: indicators.fourHTrend.trend === 'bearish' 
        ? 'SHORT'
        : indicators.fourHTrend.trend === 'bullish' 
          ? 'NO' 
          : NEUTRAL,
      tooltip: `4H Trend: ${indicators.fourHTrend.trend} (${indicators.fourHTrend.strength})\n${indicators.fourHTrend.trend === 'bearish' ? 'Медвежий тренд на 4H = хорошо для SHORT' : indicators.fourHTrend.trend === 'bullish' ? 'Бычий тренд на 4H = плохо для SHORT' : 'Нейтрально'}`,
      color: getShortColor(
        indicators.fourHTrend.trend === 'bearish' ? true :
        indicators.fourHTrend.trend === 'bullish' ? false : null
      ),
    },
    {
      name: t.obv,
      value: indicators.obv.trend === 'bearish' 
        ? 'SHORT'
        : indicators.obv.trend === 'bullish' 
          ? 'NO' 
          : NEUTRAL,
      tooltip: `OBV Trend: ${indicators.obv.trend}. Divergence: ${indicators.obv.divergence || 'None'}\n${indicators.obv.trend === 'bearish' ? 'Падающий объём = хорошо для SHORT' : indicators.obv.trend === 'bullish' ? 'Растущий объём = плохо для SHORT' : 'Нейтрально'}`,
      color: getShortColor(
        indicators.obv.trend === 'bearish' ? true :
        indicators.obv.trend === 'bullish' ? false : null
      ),
    },

    // ========== DIVERGENCES: SHORT / NO / — ==========
    {
      name: t.rsiDivergence,
      value: indicators.rsiDivergence.type === 'bearish' 
        ? 'SHORT'
        : indicators.rsiDivergence.type === 'bullish' 
          ? 'NO' 
          : NEUTRAL,
      tooltip: `RSI Divergence: ${indicators.rsiDivergence.type} (${indicators.rsiDivergence.strength}). Confirmation: ${indicators.rsiDivergence.confirmation ? 'Yes' : 'No'}\n${indicators.rsiDivergence.type === 'bearish' ? 'Медвежья дивергенция = хорошо для SHORT' : indicators.rsiDivergence.type === 'bullish' ? 'Бычья дивергенция = плохо для SHORT' : 'Нет дивергенции'}`,
      color: getShortColor(
        indicators.rsiDivergence.type === 'bearish' ? true :
        indicators.rsiDivergence.type === 'bullish' ? false : null
      ),
    },
    {
      name: t.macdDivergence,
      value: indicators.macdDivergence.type === 'bearish' 
        ? 'SHORT'
        : indicators.macdDivergence.type === 'bullish' 
          ? 'NO' 
          : NEUTRAL,
      tooltip: `MACD Divergence: ${indicators.macdDivergence.type} (${indicators.macdDivergence.strength})\n${indicators.macdDivergence.type === 'bearish' ? 'Медвежья дивергенция = хорошо для SHORT' : indicators.macdDivergence.type === 'bullish' ? 'Бычья дивергенция = плохо для SHORT' : 'Нет дивергенции'}`,
      color: getShortColor(
        indicators.macdDivergence.type === 'bearish' ? true :
        indicators.macdDivergence.type === 'bullish' ? false : null
      ),
    },

    // ========== MULTI-TF: Weighted Score with 5 TF ==========
    {
      name: t.multiTFAlignment,
      value: indicators.multiTFAlignment.direction === 'bearish'
        ? `${indicators.multiTFAlignment.score} SHORT`
        : indicators.multiTFAlignment.direction === 'bullish'
          ? `${indicators.multiTFAlignment.score} NO`
          : `${indicators.multiTFAlignment.score} MIX`,
      tooltip: `Multi-TF Alignment (Weighted):\n5m: ${tf['5m']} (display only)\n15m: ${tf['15m']} (10% weight)\n1h: ${tf['1h']} (20% weight)\n2h: ${tf['2h']} (30% weight)\n4h: ${tf['4h']} (40% weight)\n\nScore: ${indicators.multiTFAlignment.score}/100\n${bearishCount >= 3 ? 'Сильный медвежий тренд = отлично для SHORT' : bearishCount >= 2 ? 'Медвежий тренд = хорошо для SHORT' : bullishCount >= 3 ? 'Сильный бычий тренд = плохо для SHORT' : bullishCount >= 2 ? 'Бычий тренд = плохо для SHORT' : 'Смешанные сигналы'}`,
      color: getShortColor(
        indicators.multiTFAlignment.direction === 'bearish' ? true :
        indicators.multiTFAlignment.direction === 'bullish' ? false : null
      ),
    },
    // ========== ENTRY TIMING: 5m-based ==========
    {
      name: 'Entry',
      value: indicators.entryTiming.signal === 'enter_now'
        ? `NOW ${GOOD}`
        : indicators.entryTiming.signal === 'ready'
          ? `${indicators.entryTiming.score}`
          : `WAIT`,
      tooltip: `Entry Timing (5m-based, NO impact on signal):\n5m RSI: ${indicators.entryTiming.rsi5m.toFixed(1)}\nQuality: ${indicators.entryTiming.quality}\nScore: ${indicators.entryTiming.score}/100\nMicro-div: ${indicators.entryTiming.divergence5m}\n\n${indicators.entryTiming.reason}\n\n${indicators.entryTiming.signal === 'enter_now' ? 'Оптимальный момент для входа!' : indicators.entryTiming.signal === 'ready' ? 'Хороший момент для входа' : 'Лучше подождать'}`,
      color: indicators.entryTiming.signal === 'enter_now' 
        ? 'text-green-400 font-bold' 
        : indicators.entryTiming.signal === 'ready' 
          ? 'text-yellow-400' 
          : 'text-muted-foreground',
    },

    // ========== POSITION INDICATORS: Value + Status ==========
    {
      name: t.bollingerBands,
      value: indicators.bollingerBands.position > 80 
        ? `>${indicators.bollingerBands.position.toFixed(0)}% ${GOOD}`
        : indicators.bollingerBands.position < 20 
          ? `<${indicators.bollingerBands.position.toFixed(0)}% ${BAD}`
          : `${indicators.bollingerBands.position.toFixed(0)}%`,
      tooltip: `BB Position: ${indicators.bollingerBands.position.toFixed(1)}% within bands. ${indicators.bollingerBands.squeeze ? 'Squeeze detected!' : ''}\n${indicators.bollingerBands.position > 80 ? 'Цена у верхней полосы = хорошо для SHORT' : indicators.bollingerBands.position < 20 ? 'Цена у нижней полосы = плохо для SHORT' : 'Цена в середине полос'}`,
      color: getShortColor(
        indicators.bollingerBands.position > 80 ? true :
        indicators.bollingerBands.position < 20 ? false : null
      ),
    },
    {
      name: t.vwap,
      value: indicators.vwap.deviation > 3 
        ? `+${indicators.vwap.deviation.toFixed(1)}% ${GOOD}`
        : indicators.vwap.deviation < -3 
          ? `${indicators.vwap.deviation.toFixed(1)}% ${BAD}`
          : `${indicators.vwap.deviation > 0 ? '+' : ''}${indicators.vwap.deviation.toFixed(1)}%`,
      tooltip: `VWAP Deviation: ${indicators.vwap.deviation.toFixed(2)}%\n${indicators.vwap.deviation > 3 ? 'Цена значительно выше VWAP = хорошо для SHORT' : indicators.vwap.deviation < -3 ? 'Цена значительно ниже VWAP = плохо для SHORT' : 'Цена близко к VWAP'}`,
      color: getShortColor(
        indicators.vwap.deviation > 3 ? true :
        indicators.vwap.deviation < -3 ? false : null
      ),
    },

    // ========== SPECIAL INDICATORS ==========
    {
      name: t.adx,
      value: indicators.adx.value > 25 
        ? `${indicators.adx.value.toFixed(0)} STRONG`
        : `${indicators.adx.value.toFixed(0)} WEAK`,
      tooltip: `ADX: ${indicators.adx.value.toFixed(1)} (${indicators.adx.trend} trend). +DI: ${indicators.adx.plusDI.toFixed(1)}, -DI: ${indicators.adx.minusDI.toFixed(1)}\n${indicators.adx.value > 25 ? 'Сильный тренд = хорошая направленность' : 'Слабый тренд = отсутствие направления'}`,
      color: indicators.adx.value > 25 ? 'text-orange-400' : 'text-muted-foreground',
    },
    {
      name: t.fakePump,
      value: indicators.fakePump.isFake 
        ? `${indicators.fakePump.confidence}% ${GOOD}`
        : NEUTRAL,
      tooltip: indicators.fakePump.isFake 
        ? `Fake Pump Detected! Confidence: ${indicators.fakePump.confidence}%. ${indicators.fakePump.reason}\nФейковый памп = потенциальный разворот вниз = хорошо для SHORT`
        : 'No fake pump signals detected',
      color: getShortColor(indicators.fakePump.isFake ? true : null),
    },
    {
      name: t.atr,
      value: indicators.atr.volatility === 'high' 
        ? `${indicators.atr.percentage.toFixed(1)}% HIGH`
        : indicators.atr.volatility === 'low'
          ? `${indicators.atr.percentage.toFixed(1)}% LOW`
          : `${indicators.atr.percentage.toFixed(1)}%`,
      tooltip: `ATR: ${indicators.atr.value.toFixed(6)} (${indicators.atr.percentage.toFixed(2)}% of price). Volatility: ${indicators.atr.volatility}\n${indicators.atr.volatility === 'high' ? 'Высокая волатильность = больший риск, но и потенциал' : indicators.atr.volatility === 'low' ? 'Низкая волатильность = меньшее движение' : 'Средняя волатильность'}`,
      color: indicators.atr.volatility === 'high' ? 'text-yellow-400' : 'text-muted-foreground',
    },

    // ========== PERPETUAL INDICATORS ==========
    {
      name: t.fundingRate,
      value: indicators.fundingRate.signal === 'short'
        ? `${(indicators.fundingRate.rate * 100).toFixed(3)}% ${GOOD}`
        : indicators.fundingRate.signal === 'long'
          ? `${(indicators.fundingRate.rate * 100).toFixed(3)}% ${BAD}`
          : `${(indicators.fundingRate.rate * 100).toFixed(3)}%`,
      tooltip: `Funding Rate: ${(indicators.fundingRate.rate * 100).toFixed(4)}%\nAnnualized: ${indicators.fundingRate.annualized.toFixed(1)}%\n${indicators.fundingRate.signal === 'short' ? 'Положительный фандинг = шортисты платят = толпа в шортах = хорошо для SHORT' : indicators.fundingRate.signal === 'long' ? 'Отрицательный фандинг = лонгисты платят = толпа в лонгах = плохо для SHORT' : 'Фандинг нейтральный'}`,
      color: getShortColor(
        indicators.fundingRate.signal === 'short' ? true :
        indicators.fundingRate.signal === 'long' ? false : null
      ),
    },
    {
      name: t.openInterest,
      value: indicators.openInterest.interpretation === 'bearish'
        ? `${indicators.openInterest.change24h > 0 ? '+' : ''}${indicators.openInterest.change24h.toFixed(0)}% ${GOOD}`
        : indicators.openInterest.interpretation === 'bullish'
          ? `${indicators.openInterest.change24h > 0 ? '+' : ''}${indicators.openInterest.change24h.toFixed(0)}% ${BAD}`
          : `${indicators.openInterest.change24h > 0 ? '+' : ''}${indicators.openInterest.change24h.toFixed(0)}%`,
      tooltip: `Open Interest: $${(indicators.openInterest.value / 1000000).toFixed(1)}M\nChange 24h: ${indicators.openInterest.change24h.toFixed(1)}%\n${indicators.openInterest.interpretation === 'bearish' ? 'OI растёт при падении цены = новые шорты = хорошо для SHORT' : indicators.openInterest.interpretation === 'bullish' ? 'OI падает при падении цены = шорты закрываются = плохо для SHORT' : 'OI нейтрален'}`,
      color: getShortColor(
        indicators.openInterest.interpretation === 'bearish' ? true :
        indicators.openInterest.interpretation === 'bullish' ? false : null
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
              <p className="text-xs">{item.tooltip}</p>
            </TooltipContent>
          </Tooltip>
        ))}
      </TooltipProvider>
    </div>
  );
}
