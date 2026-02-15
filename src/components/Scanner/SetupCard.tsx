'use client';

import { Candidate, SetupType, Indicators } from '@/types/scanner';
import { getTranslation, TranslationKeys } from '@/lib/i18n';
import { Language } from '@/types/scanner';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { IndicatorsGrid } from './IndicatorsGrid';

interface SetupCardProps {
  candidate: Candidate;
  language: Language;
}

/**
 * Determine trading style based on setup characteristics
 * Scalping: Quick trades, high volatility, fake pumps, short timeframes
 * Day Trading: Medium holds, moderate volatility, standard setups
 * Swing: Long holds, structural breaks, low volatility, trend following
 */
type TradingStyle = 'scalping' | 'dayTrading' | 'swing';

interface TradingStyleInfo {
  style: TradingStyle;
  label: string;
  description: string;
  holdTime: string;
  color: string;
  icon: string;
}

function determineTradingStyle(
  setupType: SetupType,
  indicators: Indicators,
  riskReward: number,
  priceChange24h: number
): TradingStyleInfo {
  let scalpingScore = 0;
  let dayTradingScore = 0;
  let swingScore = 0;

  // 1. Setup type influence
  if (setupType === 'fakePump') {
    scalpingScore += 4; // Fake pumps reverse fast
  } else if (setupType === 'rejection' || setupType === 'resistanceRejection') {
    scalpingScore += 2;
    dayTradingScore += 2;
  } else if (setupType === 'structureBreak') {
    swingScore += 3; // Structure breaks take time
  } else if (setupType === 'divergence') {
    dayTradingScore += 2;
    swingScore += 1;
  } else if (setupType === 'doubleTop') {
    dayTradingScore += 2;
    swingScore += 2;
  } else if (setupType === 'oiDivergence') {
    swingScore += 2;
  }

  // 2. Multi-TF alignment influence
  const tf = indicators.multiTFAlignment;
  if (tf.direction === 'mixed') {
    dayTradingScore += 1; // Mixed = shorter holds
  } else if (tf.direction === 'bearish' && tf.score >= 70) {
    swingScore += 2; // Strong bearish alignment = swing
  }

  // 3. Entry timing influence
  const entry = indicators.entryTiming;
  if (entry.signal === 'enter_now' && entry.score >= 80) {
    scalpingScore += 2; // Precise entry = quick trade
  } else if (entry.signal === 'wait') {
    swingScore += 1; // Wait for setup = patient trade
  }

  // 4. Volatility influence (ATR)
  if (indicators.atr.volatility === 'high') {
    scalpingScore += 2; // High volatility = quick moves
  } else if (indicators.atr.volatility === 'low') {
    swingScore += 2; // Low volatility = slow moves
  }

  // 5. Risk/Reward influence
  if (riskReward >= 3) {
    swingScore += 1; // High R:R = longer target
  } else if (riskReward < 1.5) {
    scalpingScore += 1; // Low R:R = quick scalp
  }

  // 6. Price change influence
  if (priceChange24h > 40) {
    scalpingScore += 2; // Extreme pump = quick reversal
  } else if (priceChange24h > 25) {
    dayTradingScore += 1;
  }

  // 7. 5m RSI influence
  if (entry.rsi5m > 80) {
    scalpingScore += 1; // Extreme overbought = quick reversal
  }

  // Determine winner
  const total = scalpingScore + dayTradingScore + swingScore;
  let style: TradingStyle;
  
  if (scalpingScore >= dayTradingScore && scalpingScore >= swingScore) {
    style = 'scalping';
  } else if (swingScore >= dayTradingScore) {
    style = 'swing';
  } else {
    style = 'dayTrading';
  }

  // Return localized info
  const styles: Record<TradingStyle, TradingStyleInfo> = {
    scalping: {
      style: 'scalping',
      label: 'Скальпинг',
      description: 'Быстрый вход/выход, высокие риски, краткосрочные цели',
      holdTime: '15мин - 2ч',
      color: 'bg-pink-500/20 text-pink-400 border-pink-500/50',
      icon: '⚡',
    },
    dayTrading: {
      style: 'dayTrading',
      label: 'Дей-трейдинг',
      description: 'Внутридневная торговля, средние цели, умеренные риски',
      holdTime: '2ч - 1 день',
      color: 'bg-blue-500/20 text-blue-400 border-blue-500/50',
      icon: '📈',
    },
    swing: {
      style: 'swing',
      label: 'Свинг',
      description: 'Долгосрочная позиция, следование тренду, низкие риски',
      holdTime: '1-7 дней',
      color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50',
      icon: '🎯',
    },
  };

  return styles[style];
}

const typeColors: Record<string, string> = {
  divergence: 'bg-purple-500/20 text-purple-400 border-purple-500/50',
  rejection: 'bg-red-500/20 text-red-400 border-red-500/50',
  fakePump: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/50',
  breakout: 'bg-orange-500/20 text-orange-400 border-orange-500/50',
  meanReversion: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50',
  structureBreak: 'bg-rose-500/20 text-rose-400 border-rose-500/50',
  levelBreakout: 'bg-amber-500/20 text-amber-400 border-amber-500/50',
  resistanceRejection: 'bg-pink-500/20 text-pink-400 border-pink-500/50',
  doubleTop: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/50',
  oiDivergence: 'bg-teal-500/20 text-teal-400 border-teal-500/50',
};

const recommendationColors: Record<string, string> = {
  enter: 'bg-green-500/20 text-green-400 border-green-500/50',
  wait: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50',
  skip: 'bg-red-500/20 text-red-400 border-red-500/50',
};

export function SetupCard({ candidate, language }: SetupCardProps) {
  const t = getTranslation(language);

  // Determine trading style
  const tradingStyle = determineTradingStyle(
    candidate.setup.type,
    candidate.setup.indicators,
    candidate.setup.riskReward,
    candidate.priceChange24h
  );

  const getScoreColor = (score: number) => {
    if (score >= 60) return 'text-green-400';
    if (score >= 40) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getScoreBg = (score: number) => {
    if (score >= 60) return 'bg-green-500/20';
    if (score >= 40) return 'bg-yellow-500/20';
    return 'bg-red-500/20';
  };

  const formatPrice = (price: number) => {
    if (price < 0.001) return price.toExponential(2);
    if (price < 1) return price.toFixed(6);
    if (price < 100) return price.toFixed(4);
    return price.toFixed(2);
  };

  const tradingViewUrl = `https://www.tradingview.com/chart/?symbol=${candidate.name}USDT`;
  const binanceUrl = `https://www.binance.com/en/trade/${candidate.symbol}`;
  const bybitUrl = `https://www.bybit.com/en-US/trade/spot/${candidate.symbol}`;
  const okxUrl = `https://www.okx.com/trade-spot/${candidate.name}-USDT`;
  const bitgetUrl = `https://www.bitget.com/spot/${candidate.symbol}`;
  const gateUrl = `https://www.gate.io/trade/${candidate.name}_USDT`;
  const kucoinUrl = `https://www.kucoin.com/trade/spot/${candidate.symbol}`;
  const mexcUrl = `https://www.mexc.com/exchange/${candidate.symbol}`;

  return (
    <Card className="bg-card border-border hover:border-primary/50 transition-all duration-300">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold">{candidate.name}</h3>
                <Badge variant="outline" className="text-xs">
                  {candidate.symbol}
                </Badge>
                {/* Links Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0 ml-1">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    <DropdownMenuItem asChild>
                      <a href={tradingViewUrl} target="_blank" rel="noopener noreferrer">
                        {t.viewOnTradingView}
                      </a>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <a href={binanceUrl} target="_blank" rel="noopener noreferrer">
                        {t.viewOnBinance}
                      </a>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <a href={bybitUrl} target="_blank" rel="noopener noreferrer">
                        {t.viewOnBybit}
                      </a>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <a href={okxUrl} target="_blank" rel="noopener noreferrer">
                        {t.viewOnOKX}
                      </a>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <a href={bitgetUrl} target="_blank" rel="noopener noreferrer">
                        {t.viewOnBitget}
                      </a>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <a href={gateUrl} target="_blank" rel="noopener noreferrer">
                        {t.viewOnGate}
                      </a>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <a href={kucoinUrl} target="_blank" rel="noopener noreferrer">
                        {t.viewOnKuCoin}
                      </a>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <a href={mexcUrl} target="_blank" rel="noopener noreferrer">
                        {t.viewOnMEXC}
                      </a>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm text-muted-foreground">
                  ${formatPrice(candidate.currentPrice)}
                </span>
                <span className="text-sm text-green-400 font-medium">
                  +{candidate.priceChange24h.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
          
          {/* Score Circle */}
          <div className={`w-14 h-14 rounded-full ${getScoreBg(candidate.shortScore.total)} flex items-center justify-center`}>
            <span className={`text-lg font-bold ${getScoreColor(candidate.shortScore.total)}`}>
              {candidate.shortScore.total}
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Setup Type & Recommendation */}
        <div className="flex flex-wrap gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge className={typeColors[candidate.setup.type] || 'bg-gray-500/20 text-gray-400 border-gray-500/50'}>
                  {candidate.setup.pattern}
                </Badge>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="text-sm">{candidate.setup.description}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <Badge className={recommendationColors[candidate.recommendation]}>
            {t[candidate.recommendation]}
          </Badge>
          <Badge variant="outline">
            {candidate.setup.timeframe}
          </Badge>
        </div>

        {/* Trade Levels */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
          <div className="space-y-1">
            <span className="text-muted-foreground text-xs">{t.entryZone}</span>
            <div className="font-mono">
              ${formatPrice(candidate.setup.entryZone[0])} - ${formatPrice(candidate.setup.entryZone[1])}
            </div>
          </div>
          <div className="space-y-1">
            <span className="text-muted-foreground text-xs">{t.stopLoss}</span>
            <div className="font-mono text-red-400">${formatPrice(candidate.setup.stopLoss)}</div>
          </div>
          <div className="space-y-1">
            <span className="text-muted-foreground text-xs">{t.takeProfit1}</span>
            <div className="font-mono text-green-400">${formatPrice(candidate.setup.takeProfit1)}</div>
          </div>
          <div className="space-y-1">
            <span className="text-muted-foreground text-xs">{t.riskReward}</span>
            <div className="font-mono">1:{candidate.setup.riskReward.toFixed(2)}</div>
          </div>
          <div className="space-y-1">
            <span className="text-muted-foreground text-xs">{t.breakeven}</span>
            <div className="font-mono text-blue-400 text-xs">
              <div>{t.stopLoss}: ${formatPrice(candidate.setup.breakevenSL)}</div>
              <div>{t.breakevenTrigger}: ${formatPrice(candidate.setup.breakevenTrigger)}</div>
            </div>
          </div>
        </div>

        {/* SHORT Score Breakdown */}
        <div className="space-y-2">
          <div className="text-xs text-muted-foreground">{t.shortScore}</div>
          <div className="grid grid-cols-5 gap-2 text-xs">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="text-center p-1.5 rounded bg-secondary">
                    <div className={getScoreColor(candidate.shortScore.trend)}>{candidate.shortScore.trend}</div>
                    <div className="text-muted-foreground">{t.trend}</div>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Trend analysis: EMA alignment, 4H trend, ADX strength</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="text-center p-1.5 rounded bg-secondary">
                    <div className={getScoreColor(candidate.shortScore.momentum)}>{candidate.shortScore.momentum}</div>
                    <div className="text-muted-foreground">{t.momentum}</div>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Momentum: RSI, MACD, StochRSI analysis</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="text-center p-1.5 rounded bg-secondary">
                    <div className={getScoreColor(candidate.shortScore.volatility)}>{candidate.shortScore.volatility}</div>
                    <div className="text-muted-foreground">{t.volatility}</div>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Volatility: Bollinger Bands, ATR, VWAP deviation</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="text-center p-1.5 rounded bg-secondary">
                    <div className={getScoreColor(candidate.shortScore.volume)}>{candidate.shortScore.volume}</div>
                    <div className="text-muted-foreground">{t.volumeScore}</div>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Volume: OBV trend and divergence analysis</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="text-center p-1.5 rounded bg-secondary">
                    <div className={getScoreColor(candidate.shortScore.divergence)}>{candidate.shortScore.divergence}</div>
                    <div className="text-muted-foreground">{t.divergenceScore}</div>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Divergence: RSI and MACD divergence detection</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        {/* Trading Style */}
        <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30 border border-border/50">
          <div className="text-2xl">{tradingStyle.icon}</div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <Badge className={tradingStyle.color}>
                {tradingStyle.label}
              </Badge>
              <span className="text-xs text-muted-foreground">
                ⏱ {tradingStyle.holdTime}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {tradingStyle.description}
            </p>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="text-xs text-muted-foreground cursor-help">
                  ℹ️
                </div>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="text-xs">
                  Стиль торговли определяется на основе типа сетапа, волатильности, 
                  Multi-TF выравнивания и соотношения риск/прибыль.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Indicators Grid */}
        <IndicatorsGrid indicators={candidate.setup.indicators} t={t} />

        {/* Warnings */}
        {candidate.setup.warningSignals.length > 0 && (
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground">{t.warnings}</span>
            <div className="space-y-1">
              {candidate.setup.warningSignals.map((warning, i) => (
                <div key={i} className="text-xs text-yellow-400 flex items-center gap-1.5">
                  <svg className="w-3 h-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <span>{warning}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Analysis */}
        <div className="text-sm text-muted-foreground pt-2 border-t border-border">
          {candidate.analysis}
        </div>
      </CardContent>
    </Card>
  );
}
