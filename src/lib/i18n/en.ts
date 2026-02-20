import { TranslationKeys } from '@/types/scanner';

export const en: TranslationKeys = {
  // Header
  title: 'SHORT Scanner',
  subtitle: '',
  
  // Controls
  scan: 'Scan',
  scanning: 'Scanning...',
  stopScan: 'Stop',
  selectExchange: 'Exchange',
  selectTimeframe: 'Timeframe',
  sortBy: 'Sort By',
  
  // Sorting options
  byPriceChange: 'By Price Change',
  byRSI: 'By RSI',
  byShortScore: 'By SHORT Score',
  byVolume: 'By Volume',
  
  // Filters
  filters: 'Filters',
  minConfidence: 'Min Confidence',
  minPriceChange: 'Min Price Change',
  onlyRsiDivergence: 'Only with RSI Divergence',
  hideFakePump: 'Hide Fake Pump',
  hideSkipSetups: 'Hide "Skip"',
  hideWaitSetups: 'Hide "Wait"',
  
  // Progress
  analyzing: 'Analyzing',
  fetchingData: 'Fetching data from exchange...',
  calculatingIndicators: 'Calculating indicators...',
  findingSetups: 'Finding setups...',
  complete: 'Complete',
  
  // Card
  entryZone: 'Entry Zone',
  stopLoss: 'Stop Loss',
  takeProfit1: 'Take Profit',
  takeProfit2: 'Take Profit 2',
  riskReward: 'Risk/Reward',
  riskReward2: 'R:R TP2',
  breakeven: 'Breakeven',
  breakevenTrigger: 'Trigger',
  keyLevels: 'Key Levels',
  warnings: 'Warnings',
  
  // Recommendation
  enter: 'Enter',
  wait: 'Wait',
  skip: 'Skip',
  
  // Score
  shortScore: 'SHORT Score',
  trend: 'Sentiment',
  momentum: 'Momentum',
  volatility: 'Price',
  volumeScore: 'Perpetual',
  divergenceScore: 'Diverg.',
  
  // Indicators
  rsi: 'RSI',
  macd: 'MACD',
  bollingerBands: 'BB',
  ema: 'EMA',
  fourHTrend: '4H Trend',
  obv: 'OBV',
  adx: 'ADX',
  rsiDivergence: 'RSI Div',
  macdDivergence: 'MACD Div',
  fakePump: 'Fake Pump',
  vwap: 'VWAP',
  stochRsi: 'StochRSI',
  multiTFAlignment: 'Multi-TF',
  atr: 'ATR',
  // Perpetual indicators
  fundingRate: 'Funding',
  openInterest: 'OI',
  // Market sentiment
  longShortRatio: 'L/S Ratio',
  topTraders: 'Top Traders',
  // Order flow
  orderBook: 'Order Book',
  liquidationHeatmap: 'Liquidations',
  
  // Status
  bullish: 'Bullish',
  bearish: 'Bearish',
  neutral: 'Neutral',
  overbought: 'Overbought',
  oversold: 'Oversold',
  strong: 'Strong',
  moderate: 'Moderate',
  weak: 'Weak',
  
  // Tooltip phrases
  goodForShort: 'good for SHORT',
  badForShort: 'bad for SHORT',
  neutralSignal: 'Neutral',
  overboughtShort: 'Overbought (>70) = good for SHORT',
  oversoldShort: 'Oversold (<30) = bad for SHORT',
  bearishTrend: 'Bearish trend = good for SHORT',
  bullishTrend: 'Bullish trend = bad for SHORT',
  bearishDiv: 'Bearish divergence = good for SHORT',
  bullishDiv: 'Bullish divergence = bad for SHORT',
  noDiv: 'No divergence',
  fallingVol: 'Falling volume = good for SHORT',
  risingVol: 'Rising volume = bad for SHORT',
  priceUpperBB: 'Price at upper band = good for SHORT',
  priceLowerBB: 'Price at lower band = bad for SHORT',
  priceMidBB: 'Price in middle of bands',
  priceAboveVWAP: 'Price significantly above VWAP = good for SHORT',
  priceBelowVWAP: 'Price significantly below VWAP = bad for SHORT',
  priceNearVWAP: 'Price near VWAP',
  strongTrend: 'Strong trend = good direction',
  weakTrend: 'Weak trend = no direction',
  fakePumpDetected: 'Fake pump = potential reversal down = good for SHORT',
  highVolatility: 'High volatility = more risk but more potential',
  lowVolatility: 'Low volatility = less movement',
  mediumVolatility: 'Medium volatility',
  positiveFunding: 'Positive funding = crowd shorting = BAD for SHORT (squeeze risk)',
  negativeFunding: 'Negative funding = crowd longing = GOOD for SHORT (contrarian)',
  neutralFunding: 'Neutral funding',
  oiGrowing: 'OI growing with price drop = new shorts = good for SHORT',
  oiFalling: 'OI falling with price drop = shorts closing = bad for SHORT',
  oiNeutral: 'OI neutral',
  strongBearishTrend: 'Strong bearish trend = excellent for SHORT',
  bearishTrendGood: 'Bearish trend = good for SHORT',
  strongBullishTrend: 'Strong bullish trend = bad for SHORT',
  bullishTrendBad: 'Bullish trend = bad for SHORT',
  mixedSignals: 'Mixed signals',
  optimalEntry: 'Optimal entry moment!',
  goodEntry: 'Good entry moment',
  waitEntry: 'Better to wait',
  bearishEMA: 'Bearish EMA alignment = good for SHORT',
  bullishEMA: 'Bullish alignment = bad for SHORT',
  bearish4H: 'Bearish 4H trend = good for SHORT',
  bullish4H: 'Bullish 4H trend = bad for SHORT',
  noFakePump: 'No fake pump signals detected',
  squeezeDetected: 'Squeeze detected!',
  
  // Errors
  noResults: 'No results found',
  scanError: 'Scan error',
  
  // Trading Style
  scalping: 'Scalping',
  dayTrading: 'Day Trading',
  swing: 'Swing',
  scalpingDesc: 'Quick in/out, high risks, short-term targets',
  dayTradingDesc: 'Intraday trading, medium targets, moderate risks',
  swingDesc: 'Long-term position, trend following, low risks',
  scalpingTime: '15min - 2h',
  dayTradingTime: '2h - 1 day',
  swingTime: '1-7 days',
  
  // Links
  viewOnTradingView: 'View on TradingView',
  viewOnBinance: 'View on Binance',
  viewOnBybit: 'View on Bybit',
  viewOnOKX: 'View on OKX',

  // Time
  lastScanTime: 'Last scan time',

  // SHORT Score tooltips
  trendTooltip: 'L/S Ratio + Top Traders (crowd vs smart money)',
  momentumTooltip: 'RSI overbought + StochRSI + MACD',
  volatilityTooltip: 'Price change + BB position + VWAP',
  volumeTooltip: 'Funding + Funding trend + Open Interest',
  divergenceTooltip: 'RSI/MACD divergences + OBV + Fake Pump',

  // Market sentiment tooltips
  longShortRatioTooltip: 'Long/Short ratio of crowd positions',
  topTradersTooltip: 'Top traders positions (smart money)',
  crowdLonging: 'Crowd longing = good for SHORT',
  crowdShorting: 'Crowd shorting = bad for SHORT',
  topTradersLong: 'Top traders long = bad for SHORT',
  topTradersShort: 'Top traders short = good for SHORT',
  fundingTrendUp: 'Funding rising = longs active',
  fundingTrendDown: 'Funding falling = longs closing',
  fundingTrendStable: 'Funding stable',

  // Order flow tooltips
  orderBookTooltip: 'Order book imbalance analysis',
  liquidationHeatmapTooltip: 'Liquidation levels heatmap',
  askDominance: 'Ask dominance = good for SHORT',
  bidDominance: 'Bid dominance = bad for SHORT',
  longLiquidsBelow: 'Long liquidations below = targets for SHORT',
  shortLiquidsAbove: 'Short liquidations above = squeeze risk',

  // Data status
  noData: 'No data',
  affectsScore: 'Affects score',
  noScoreImpact: 'No score impact (no data)',
  bonus: 'Bonus',
  penalty: 'Penalty',
};
