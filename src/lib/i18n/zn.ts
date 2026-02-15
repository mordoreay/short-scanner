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
  
  // Errors
  noResults: '未找到结果',
  scanError: '扫描错误',
  
  // Links
  viewOnTradingView: '在TradingView查看',
  viewOnBinance: '在Binance查看',
  viewOnBybit: '在Bybit查看',
  viewOnOKX: '在OKX查看',
  viewOnBitget: '在Bitget查看',
  viewOnGate: '在Gate查看',
  viewOnKuCoin: '在KuCoin查看',
  viewOnMEXC: '在MEXC查看',
};
