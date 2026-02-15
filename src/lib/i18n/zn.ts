import { TranslationKeys } from '@/types/scanner';

export const zn: TranslationKeys = {
  // Header
  title: 'SHORT 扫描器',
  subtitle: 'PERPETUAL | 多周期 | 资金费 + 持仓量',
  
  // Controls
  scan: '扫描',
  scanning: '扫描中...',
  stopScan: '停止',
  selectExchange: '交易所',
  selectTimeframe: '时间周期',
  sortBy: '排序方式',
  
  // Sorting options
  byConfidence: '按置信度',
  byPriceChange: '按价格变化',
  byRSI: '按RSI',
  byShortScore: '按做空分数',
  byVolume: '按成交量',
  
  // Filters
  filters: '筛选',
  minConfidence: '最小置信度',
  minPriceChange: '最小价格变化',
  onlyRsiDivergence: '仅显示RSI背离',
  hideFakePump: '隐藏假拉升',
  
  // Progress
  analyzing: '分析中',
  fetchingData: '从交易所获取数据...',
  calculatingIndicators: '计算指标...',
  findingSetups: '寻找交易机会...',
  complete: '完成',
  
  // Card
  entryZone: '入场区间',
  stopLoss: '止损',
  takeProfit1: '止盈1',
  takeProfit2: '止盈2',
  riskReward: '风险/收益',
  breakeven: '保本',
  breakevenTrigger: '触发',
  keyLevels: '关键位',
  warnings: '警告信号',
  
  // Recommendation
  enter: '进场',
  wait: '等待',
  skip: '跳过',
  
  // Score
  shortScore: '做空分数',
  trend: '趋势',
  momentum: '动量',
  volatility: '波动率',
  volumeScore: '成交量',
  divergenceScore: '背离',
  
  // Indicators
  rsi: 'RSI',
  macd: 'MACD',
  bollingerBands: 'BB',
  ema: 'EMA',
  fourHTrend: '4H趋势',
  obv: 'OBV',
  adx: 'ADX',
  rsiDivergence: 'RSI背离',
  macdDivergence: 'MACD背离',
  fakePump: '假拉升',
  vwap: 'VWAP',
  stochRsi: 'StochRSI',
  multiTFAlignment: '多周期',
  atr: 'ATR',
  // Perpetual indicators
  fundingRate: '资金费',
  openInterest: '持仓量',
  
  // Status
  bullish: '看涨',
  bearish: '看跌',
  neutral: '中性',
  overbought: '超买',
  oversold: '超卖',
  strong: '强',
  moderate: '中',
  weak: '弱',
  
  // Tooltip phrases
  goodForShort: '适合做空',
  badForShort: '不适合做空',
  neutralSignal: '中性',
  overboughtShort: '超买 (>70) = 适合做空',
  oversoldShort: '超卖 (<30) = 不适合做空',
  bearishTrend: '看跌趋势 = 适合做空',
  bullishTrend: '看涨趋势 = 不适合做空',
  bearishDiv: '看跌背离 = 适合做空',
  bullishDiv: '看涨背离 = 不适合做空',
  noDiv: '无背离',
  fallingVol: '成交量下降 = 适合做空',
  risingVol: '成交量上升 = 不适合做空',
  priceUpperBB: '价格在上轨 = 适合做空',
  priceLowerBB: '价格在下轨 = 不适合做空',
  priceMidBB: '价格在布林带中段',
  priceAboveVWAP: '价格远高于VWAP = 适合做空',
  priceBelowVWAP: '价格远低于VWAP = 不适合做空',
  priceNearVWAP: '价格接近VWAP',
  strongTrend: '强趋势 = 方向明确',
  weakTrend: '弱趋势 = 无方向',
  fakePumpDetected: '假拉升 = 潜在反转 = 适合做空',
  highVolatility: '高波动 = 风险大但潜力大',
  lowVolatility: '低波动 = 运动小',
  mediumVolatility: '中等波动',
  positiveFunding: '正资金费 = 空头付钱 = 人群做空 = 适合做空',
  negativeFunding: '负资金费 = 多头付钱 = 人群做多 = 不适合做空',
  neutralFunding: '资金费中性',
  oiGrowing: 'OI下降时增长 = 新空头 = 适合做空',
  oiFalling: 'OI下降时减少 = 空头平仓 = 不适合做空',
  oiNeutral: 'OI中性',
  strongBearishTrend: '强看跌趋势 = 极佳做空',
  bearishTrendGood: '看跌趋势 = 适合做空',
  strongBullishTrend: '强看涨趋势 = 不适合做空',
  bullishTrendBad: '看涨趋势 = 不适合做空',
  mixedSignals: '信号混合',
  optimalEntry: '最佳入场时机！',
  goodEntry: '良好的入场时机',
  waitEntry: '最好等待',
  bearishEMA: '看跌EMA排列 = 适合做空',
  bullishEMA: '看涨排列 = 不适合做空',
  bearish4H: '4H看跌趋势 = 适合做空',
  bullish4H: '4H看涨趋势 = 不适合做空',
  noFakePump: '未检测到假拉升信号',
  squeezeDetected: '检测到挤压！',
  
  // Errors
  noResults: '未找到结果',
  scanError: '扫描错误',
  
  // Trading Style
  scalping: '剥头皮',
  dayTrading: '日内交易',
  swing: '波段',
  scalpingDesc: '快进快出，高风险，短期目标',
  dayTradingDesc: '日内交易，中等目标，适度风险',
  swingDesc: '长期持仓，趋势跟踪，低风险',
  scalpingTime: '15分钟 - 2小时',
  dayTradingTime: '2小时 - 1天',
  swingTime: '1-7天',
  tradingStyleInfo: '交易风格根据设置类型、波动率、多周期对齐和风险/收益比确定。',
  
  // Links
  viewOnTradingView: '在TradingView查看',
  viewOnBinance: '在Binance查看',
  viewOnBybit: '在Bybit查看',
  viewOnOKX: '在OKX查看',
};
