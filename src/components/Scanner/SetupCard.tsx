'use client';

import { useState } from 'react';
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { IndicatorsGrid } from './IndicatorsGrid';

// Copyable value component
interface CopyableValueProps {
  value: string;
  color?: string;
  className?: string;
  label?: string;
}

function CopyableValue({ value, color, className = '', label }: CopyableValueProps) {
  const [copied, setCopied] = useState(false);

  // Strip $ from display value for copying
  const textToCopy = value.replace(/\$/g, '');

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={handleCopy}
            className={`group relative flex items-center gap-1 font-mono cursor-pointer hover:bg-secondary/50 px-1.5 py-0.5 rounded transition-all ${className} ${color || ''}`}
          >
            <span>{value}</span>
            {copied ? (
              <svg className="w-3 h-3 text-green-400 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            )}
          </button>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-xs">{copied ? '✓ Скопировано!' : `Нажмите чтобы скопировать${label ? `: ${label}` : ''}`}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// TIER colors
const tierColors: Record<number, string> = {
  1: 'bg-blue-500/20 text-blue-400 border-blue-500/50',
  2: 'bg-amber-500/20 text-amber-400 border-amber-500/50',
  3: 'bg-rose-500/20 text-rose-400 border-rose-500/50',
};

// TIER descriptions
const TIER_DESCRIPTIONS: Record<number, { name: string; description: string }> = {
  1: { name: 'Large Caps', description: 'Крупные альты (SOL, TON, AVAX)' },
  2: { name: 'Mid Caps', description: 'Средние альты (DOGE, WLD, ARKM)' },
  3: { name: 'Memecoins', description: 'Мемкоины (PEPE, WIF, BONK)' },
};

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
  priceChange24h: number,
  t: TranslationKeys
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
  if (entry.breakdown?.indicators?.rsi5m?.value > 80) {
    scalpingScore += 1; // Extreme overbought = quick reversal
  }

  // Determine winner
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
      label: t.scalping,
      description: t.scalpingDesc,
      holdTime: t.scalpingTime,
      color: 'bg-pink-500/20 text-pink-400 border-pink-500/50',
      icon: '⚡',
    },
    dayTrading: {
      style: 'dayTrading',
      label: t.dayTrading,
      description: t.dayTradingDesc,
      holdTime: t.dayTradingTime,
      color: 'bg-blue-500/20 text-blue-400 border-blue-500/50',
      icon: '📈',
    },
    swing: {
      style: 'swing',
      label: t.swing,
      description: t.swingDesc,
      holdTime: t.swingTime,
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
  const [showPineScript, setShowPineScript] = useState(false);
  const [copied, setCopied] = useState(false);

  // Generate Pine Script for TradingView
  const generatePineScript = (): string => {
    const symbol = candidate.name;
    const entryLow = candidate.setup.entryZone[0];
    const entryHigh = candidate.setup.entryZone[1];
    const sl = candidate.setup.stopLoss;
    const tp1 = candidate.setup.takeProfit1;
    const tp2 = candidate.setup.takeProfit2;

    return `//@version=5
indicator("SHORT Setup ${symbol}", overlay=true)

// ═══════════════════════════════════════════════════════════════
// SHORT Scanner - ${symbol}USDT | Score: ${candidate.shortScore.total}/100
// ═══════════════════════════════════════════════════════════════

// Уровни (можно редактировать)
entryLow  = input.price(${entryLow}, "Entry Zone Low")
entryHigh = input.price(${entryHigh}, "Entry Zone High")
stopLoss  = input.price(${sl}, "Stop Loss")
takeProfit1 = input.price(${tp1}, "Take Profit 1")
takeProfit2 = input.price(${tp2}, "Take Profit 2")

// ENTRY ZONE - Прямоугольник
entryBox = box.new(bar_index - 30, entryHigh, bar_index + 5, entryLow, 
     border_color=color.yellow, 
     bgcolor=color.new(color.yellow, 85),
     border_width=1)
box.set_extend(entryBox, extend.right)

// STOP LOSS
slLine = line.new(bar_index - 30, stopLoss, bar_index + 5, stopLoss,
     color=color.red, width=2)
line.set_extend(slLine, extend.right)

// TAKE PROFIT 1
tp1Line = line.new(bar_index - 30, takeProfit1, bar_index + 5, takeProfit1,
     color=color.green, width=2)
line.set_extend(tp1Line, extend.right)

// TAKE PROFIT 2
tp2Line = line.new(bar_index - 30, takeProfit2, bar_index + 5, takeProfit2,
     color=color.lime, width=2, style=line.style_dashed)
line.set_extend(tp2Line, extend.right)
`;
  };

  // Copy to clipboard
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(generatePineScript());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Determine trading style
  const tradingStyle = determineTradingStyle(
    candidate.setup.type,
    candidate.setup.indicators,
    candidate.setup.riskReward,
    candidate.priceChange24h,
    t
  );

  // Score colors based on percentage of category maximum
  // Trend: max 10, Momentum: max 30, Volatility: max 20, Volume: max 10, Divergence: max 15
  const getScoreColor = (score: number, max: number = 100) => {
    const percent = (score / max) * 100;
    if (percent >= 60) return 'text-green-400';
    if (percent >= 30) return 'text-yellow-400';
    return 'text-red-400';
  };

  // Score quality text for tooltips
  const getScoreQuality = (score: number, max: number, t: TranslationKeys): { text: string; isGood: boolean | null } => {
    const percent = (score / max) * 100;
    if (percent >= 60) return { text: t.goodForShort, isGood: true };
    if (percent >= 30) return { text: t.neutralSignal, isGood: null };
    return { text: t.badForShort, isGood: false };
  };

  // Category maximums (from shortScore.ts v3.0)
  const categoryMax = {
    trend: 20,       // Sentiment: L/S Ratio (10) + Top Traders (10)
    momentum: 25,    // RSI (12) + StochRSI (5) + MACD (5) + ADX (3)
    volatility: 20,  // Price change (8) + BB (6) + VWAP (6)
    volume: 15,      // Funding (5) + Funding Trend (3) + OI (5)
    divergence: 20,  // Divergence (10) + OBV (10)
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

  const tradingViewUrl = `https://www.tradingview.com/chart/?symbol=${candidate.name}USDT.P`;
  // Perpetual futures URLs
  const binanceUrl = `https://www.binance.com/en/futures/${candidate.symbol}`;
  const bybitUrl = `https://www.bybit.com/trade/usdt/${candidate.symbol}`;
  const okxUrl = `https://www.okx.com/trade-swap/${candidate.name.toLowerCase()}-usdt-swap`;

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
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setShowPineScript(true)} className="text-yellow-500">
                      📊 Pine Script (TV Levels)
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
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
          
          {/* Score Circle with TIER Badge */}
          <div className="flex items-center gap-2">
            {/* TIER Badge */}
            {candidate.tier && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge className={`${tierColors[candidate.tier]} text-xs font-bold px-2 py-1 cursor-help`}>
                      T{candidate.tier}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">
                      {TIER_DESCRIPTIONS[candidate.tier].name} - {TIER_DESCRIPTIONS[candidate.tier].description}
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            
            {/* Score Circle */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className={`w-14 h-14 rounded-full ${getScoreBg(candidate.shortScore.total)} flex items-center justify-center cursor-help`}>
                    <span className={`text-lg font-bold ${getScoreColor(candidate.shortScore.total)}`}>
                      {candidate.shortScore.total}
                    </span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">
                    Score: {candidate.shortScore.total}/100 - {language === 'ru' 
                      ? 'Комплексная оценка вероятности успешного SHORT' 
                      : 'Comprehensive SHORT success probability score'}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Setup Type, Trading Style & Recommendation */}
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
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge className={tradingStyle.color}>
                  {tradingStyle.icon} {tradingStyle.label}
                </Badge>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="text-sm">{tradingStyle.description}</p>
                <p className="text-sm mt-1">⏱ {tradingStyle.holdTime}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <Badge className={recommendationColors[candidate.recommendation]}>
            {t[candidate.recommendation]}
          </Badge>
        </div>

        {/* Trade Levels */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
          <div className="space-y-1">
            <span className="text-muted-foreground text-xs">{t.entryZone}</span>
            <div className="flex flex-col gap-0.5">
              <CopyableValue 
                value={`$${formatPrice(candidate.setup.entryZone[1])}`} 
                color="text-yellow-400"
                label="Entry High"
              />
              <CopyableValue 
                value={`$${formatPrice(candidate.setup.entryZone[0])}`} 
                color="text-yellow-400"
                label="Entry Low"
              />
            </div>
          </div>
          <div className="space-y-1">
            <span className="text-muted-foreground text-xs">{t.stopLoss}</span>
            <CopyableValue 
              value={`$${formatPrice(candidate.setup.stopLoss)}`} 
              color="text-red-400"
              label="Stop Loss"
            />
          </div>
          <div className="space-y-1">
            <span className="text-muted-foreground text-xs">{t.takeProfit1}</span>
            <div className="flex flex-col text-xs">
              <div className="h-5 flex items-center">
                <CopyableValue 
                  value={`$${formatPrice(candidate.setup.takeProfit1)}`} 
                  color="text-green-400"
                  label="Take Profit 1"
                />
              </div>
              <div className="h-5 flex items-center">
                <CopyableValue 
                  value={`$${formatPrice(candidate.setup.takeProfit2)}`} 
                  color="text-lime-400"
                  label="Take Profit 2"
                />
              </div>
            </div>
          </div>
          <div className="space-y-1">
            <span className="text-muted-foreground text-xs">{t.riskReward}</span>
            <div className="flex flex-col font-mono text-xs">
              <div className="h-5 flex items-center text-green-400">ТП1: 1:{candidate.setup.riskReward.toFixed(2)}</div>
              <div className="h-5 flex items-center text-lime-400">ТП2: 1:{(candidate.setup.riskReward2 || 0).toFixed(2)}</div>
            </div>
          </div>
          <div className="space-y-1">
            <span className="text-muted-foreground text-xs">{t.breakeven}</span>
            <div className="flex flex-col text-xs">
              <div className="h-5 flex items-center gap-1">
                <span className="text-blue-400">{t.stopLoss}:</span>
                <CopyableValue 
                  value={`$${formatPrice(candidate.setup.breakevenSL)}`} 
                  color="text-blue-400"
                  label="Breakeven SL"
                />
              </div>
              <div className="h-5 flex items-center gap-1">
                <span className="text-cyan-400">{t.breakevenTrigger}:</span>
                <CopyableValue 
                  value={`$${formatPrice(candidate.setup.breakevenTrigger)}`} 
                  color="text-cyan-400"
                  label="Breakeven Trigger"
                />
              </div>
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
                    <div className={getScoreColor(candidate.shortScore.trend, categoryMax.trend)}>{candidate.shortScore.trend}</div>
                    <div className="text-muted-foreground">{t.trend}</div>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">{t.trendTooltip}</p>
                  <p className="text-xs">{getScoreQuality(candidate.shortScore.trend, categoryMax.trend, t).text}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="text-center p-1.5 rounded bg-secondary">
                    <div className={getScoreColor(candidate.shortScore.momentum, categoryMax.momentum)}>{candidate.shortScore.momentum}</div>
                    <div className="text-muted-foreground">{t.momentum}</div>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">{t.momentumTooltip}</p>
                  <p className="text-xs">{getScoreQuality(candidate.shortScore.momentum, categoryMax.momentum, t).text}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="text-center p-1.5 rounded bg-secondary">
                    <div className={getScoreColor(candidate.shortScore.volatility, categoryMax.volatility)}>{candidate.shortScore.volatility}</div>
                    <div className="text-muted-foreground">{t.volatility}</div>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">{t.volatilityTooltip}</p>
                  <p className="text-xs">{getScoreQuality(candidate.shortScore.volatility, categoryMax.volatility, t).text}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="text-center p-1.5 rounded bg-secondary">
                    <div className={getScoreColor(candidate.shortScore.volume, categoryMax.volume)}>{candidate.shortScore.volume}</div>
                    <div className="text-muted-foreground">{t.volumeScore}</div>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">{t.volumeTooltip}</p>
                  <p className="text-xs">{getScoreQuality(candidate.shortScore.volume, categoryMax.volume, t).text}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="text-center p-1.5 rounded bg-secondary">
                    <div className={getScoreColor(candidate.shortScore.divergence, categoryMax.divergence)}>{candidate.shortScore.divergence}</div>
                    <div className="text-muted-foreground">{t.divergenceScore}</div>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">{t.divergenceTooltip}</p>
                  <p className="text-xs">{getScoreQuality(candidate.shortScore.divergence, categoryMax.divergence, t).text}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
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

      {/* Pine Script Dialog */}
      <Dialog open={showPineScript} onOpenChange={setShowPineScript}>
        <DialogContent className="!max-w-none w-[50vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              📊 Pine Script для {candidate.name}
              <Badge variant="outline" className="ml-2">
                Score: {candidate.shortScore.total}
              </Badge>
            </DialogTitle>
            <DialogDescription>
              Скопируйте код и вставьте в TradingView Pine Editor
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Instructions */}
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 text-sm">
              <p className="font-medium text-yellow-400 mb-2">📖 Инструкция:</p>
              <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                <li>Откройте TradingView и авторизуйтесь</li>
                <li>Откройте график <strong>{candidate.name}USDT</strong></li>
                <li>Нажмите <strong>Pine Editor</strong> внизу экрана</li>
                <li>Удалите весь код и вставьте скопированный</li>
                <li>Нажмите <strong>Add to chart</strong></li>
              </ol>
            </div>

            {/* Levels summary */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm">
              <div className="bg-yellow-500/10 p-3 rounded flex justify-between items-center">
                <span className="text-yellow-400">Entry Zone</span>
                <span className="font-mono">${formatPrice(candidate.setup.entryZone[0])} - ${formatPrice(candidate.setup.entryZone[1])}</span>
              </div>
              <div className="bg-red-500/10 p-3 rounded flex justify-between items-center">
                <span className="text-red-400">Stop Loss</span>
                <span className="font-mono">${formatPrice(candidate.setup.stopLoss)}</span>
              </div>
              <div className="bg-green-500/10 p-3 rounded flex justify-between items-center">
                <span className="text-green-400">TP1 (R:R 1:{candidate.setup.riskReward.toFixed(1)})</span>
                <span className="font-mono">${formatPrice(candidate.setup.takeProfit1)}</span>
              </div>
              <div className="bg-lime-500/10 p-3 rounded flex justify-between items-center">
                <span className="text-lime-400">TP2</span>
                <span className="font-mono">${formatPrice(candidate.setup.takeProfit2)}</span>
              </div>
              <div className="bg-blue-500/10 p-3 rounded flex justify-between items-center">
                <span className="text-blue-400">BE Trigger</span>
                <span className="font-mono">${formatPrice(candidate.setup.breakevenTrigger)}</span>
              </div>
            </div>

            {/* Copy button */}
            <div className="flex gap-2">
              <Button 
                onClick={copyToClipboard} 
                className="flex-1"
                variant={copied ? "default" : "outline"}
              >
                {copied ? (
                  <>
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Скопировано!
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                    </svg>
                    Копировать код
                  </>
                )}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => window.open(tradingViewUrl, '_blank')}
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                Открыть TV
              </Button>
            </div>

            {/* Code preview */}
            <div className="relative">
              <pre className="bg-black/50 rounded-lg p-4 text-xs font-mono overflow-x-auto max-h-[50vh] text-green-400 border border-border">
                {generatePineScript()}
              </pre>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
