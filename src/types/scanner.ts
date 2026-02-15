// Exchange types
export type Exchange = 'bybit' | 'binance' | 'okx';
export type Timeframe = '5m' | '15m' | '30m' | '1h' | '2h' | '4h' | '1d';
export type SortOption = 'confidence' | 'priceChange' | 'rsi' | 'shortScore' | 'volume';
export type Language = 'ru' | 'en';

// Candle data from exchanges
export interface Candle {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

// Ticker data (Perpetual)
export interface Ticker {
  symbol: string;
  name: string;
  priceChange24h: number;
  currentPrice: number;
  volume: number;
  high24h: number;
  low24h: number;
  quoteVolume: number;
  // Perpetual specific
  fundingRate?: number;           // Current funding rate (e.g., 0.0001 = 0.01%)
  nextFundingTime?: number;       // Next funding timestamp
  openInterest?: number;          // Open interest in contracts
  openInterestValue?: number;     // Open interest in USDT
  markPrice?: number;             // Mark price
  indexPrice?: number;            // Index price
}

// Indicator interfaces
export interface RSIIndicator {
  value: number;
  trend: 'overbought' | 'oversold' | 'neutral';
  signal: 'bullish' | 'bearish' | 'neutral';
}

export interface MACDIndicator {
  macd: number;
  signal: number;
  histogram: number;
  trend: 'bullish' | 'bearish' | 'neutral';
  strength: 'strong' | 'moderate' | 'weak';
  crossover: 'bullish' | 'bearish' | 'none';
}

export interface BollingerBands {
  upper: number;
  middle: number;
  lower: number;
  position: number; // 0-100% position within bands
  squeeze: boolean;
  signal: 'overbought' | 'oversold' | 'neutral';
}

export interface EMAIndicator {
  ema9: number;
  ema21: number;
  ema50: number;
  ema100: number;
  ema200: number;
  trend: 'bullish' | 'bearish' | 'neutral';
  crossover: 'bullish' | 'bearish' | 'none';
  ema200Distance: number; // Percentage from EMA200
}

export interface FourHTrend {
  trend: 'bullish' | 'bearish' | 'neutral';
  strength: 'strong' | 'moderate' | 'weak';
}

export interface OBVIndicator {
  value: number;
  trend: 'bullish' | 'bearish' | 'neutral';
  divergence: 'bullish' | 'bearish' | 'none';
  divergenceStrength: 'strong' | 'moderate' | 'weak';
}

export interface ADXIndicator {
  value: number;
  trend: 'strong' | 'moderate' | 'weak' | 'none';
  plusDI: number;
  minusDI: number;
  signal: 'bullish' | 'bearish' | 'neutral';
}

export interface DivergenceIndicator {
  type: 'bullish' | 'bearish' | 'none';
  strength: 'strong' | 'moderate' | 'weak';
  confirmation: boolean;
}

export interface FakePumpIndicator {
  isFake: boolean;
  confidence: number;
  reason: string;
  signals: string[];
}

export interface VWAPIndicator {
  value: number;
  deviation: number; // Percentage deviation from VWAP
  signal: 'overbought' | 'oversold' | 'neutral';
}

export interface StochRSIIndicator {
  k: number;
  d: number;
  signal: 'bullish' | 'bearish' | 'neutral';
  overbought: boolean;
  oversold: boolean;
}

export interface MultiTFAlignment {
  direction: 'bullish' | 'bearish' | 'mixed';
  timeframes: {
    '5m': 'bullish' | 'bearish' | 'neutral';
    '15m': 'bullish' | 'bearish' | 'neutral';
    '1h': 'bullish' | 'bearish' | 'neutral';
    '2h': 'bullish' | 'bearish' | 'neutral';
    '4h': 'bullish' | 'bearish' | 'neutral';
    '1d': 'bullish' | 'bearish' | 'neutral';
  };
  score: number;
  weights: {
    '4h': number;
    '2h': number;
    '1h': number;
    '15m': number;
  };
}

// Entry Timing Indicator (based on 5m + 15m - does NOT affect signal)
export interface EntryTimingIndicator {
  quality: 'optimal' | 'good' | 'early' | 'late';
  score: number;           // 0-100
  rsi5m: number;           // RSI on 5m
  divergence5m: 'bullish' | 'bearish' | 'none';  // Micro divergence on 5m
  pullbackDepth: number;   // How deep into entry zone (0-100%)
  signal: 'wait' | 'ready' | 'enter_now';
  reason: string;          // Explanation
}

export interface ATRIndicator {
  value: number;
  percentage: number; // ATR as percentage of price
  volatility: 'high' | 'normal' | 'low';
}

// Funding Rate Indicator (Perpetual specific)
export interface FundingRateIndicator {
  rate: number;              // Current funding rate (e.g., 0.0001)
  annualized: number;        // Annualized rate (e.g., 0.01 * 3 * 365)
  signal: 'long' | 'short' | 'neutral';  // Positive = good for SHORT (shorts pay longs)
  trend: 'increasing' | 'decreasing' | 'stable';
}

// Open Interest Indicator (Perpetual specific)
export interface OpenInterestIndicator {
  value: number;             // Current OI in USDT
  change24h: number;         // OI change in 24h (percentage)
  signal: 'increasing' | 'decreasing' | 'stable';
  interpretation: 'bullish' | 'bearish' | 'neutral';
}

// All indicators combined
export interface Indicators {
  rsi: RSIIndicator;
  macd: MACDIndicator;
  bollingerBands: BollingerBands;
  ema: EMAIndicator;
  fourHTrend: FourHTrend;
  obv: OBVIndicator;
  adx: ADXIndicator;
  rsiDivergence: DivergenceIndicator;
  macdDivergence: DivergenceIndicator;
  fakePump: FakePumpIndicator;
  vwap: VWAPIndicator;
  stochRsi: StochRSIIndicator;
  multiTFAlignment: MultiTFAlignment;
  entryTiming: EntryTimingIndicator;  // 5m-based entry timing (no noise in signal)
  atr: ATRIndicator;
  // Perpetual specific
  fundingRate: FundingRateIndicator;
  openInterest: OpenInterestIndicator;
}

// SHORT Score breakdown
export interface ShortScoreBreakdown {
  total: number;
  trend: number;
  momentum: number;
  volatility: number;
  volume: number;
  divergence: number;
  riskLevel: 'low' | 'medium' | 'high';
}

// Setup types for SHORT
export type SetupType = 
  | 'divergence'        // Медвежья дивергенция RSI/MACD
  | 'rejection'         // Отскок от BB/сопротивления
  | 'fakePump'          // Детекция fake pump
  | 'breakout'          // Медвежий пробой/кроссовер
  | 'meanReversion'     // Возврат к среднему
  | 'structureBreak'    // Структурный слом (LL break)
  | 'levelBreakout'     // Пробой уровня поддержки
  | 'resistanceRejection' // Отказ от сопротивления
  | 'doubleTop'         // Двойная вершина
  | 'oiDivergence';     // Расхождение цены и OI

// Setup configuration
export interface Setup {
  type: SetupType;
  pattern: string;
  description: string;  // Объяснение что означает сетап
  direction: 'long' | 'short';
  confidence: number;
  timeframe: string;
  entryZone: [number, number];
  stopLoss: number;
  takeProfit1: number;
  takeProfit2: number;
  riskReward: number;
  breakevenTrigger: number;
  breakevenSL: number;
  breakevenInfo: string;
  reasoning: string;
  keyLevels: number[];
  warningSignals: string[];
  indicators: Indicators;
}

// Candidate for SHORT setup
export interface Candidate {
  symbol: string;
  name: string;
  priceChange24h: number;
  currentPrice: number;
  volume: number;
  high24h: number;
  low24h: number;
  availableExchanges: string[];
  shortScore: ShortScoreBreakdown;
  setup: Setup;
  analysis: string;
  recommendation: 'enter' | 'wait' | 'skip';
}

// API Response
export interface ScannerResponse {
  success: boolean;
  message: string;
  timestamp: string;
  analyzedCount: number;
  candidates: Candidate[];
}

// Scanner filters
export interface ScannerFilters {
  minConfidence: number;
  minPriceChange: number;
  onlyRsiDivergence: boolean;
  hideFakePump: boolean;
}

// Scanner state
export interface ScannerState {
  isScanning: boolean;
  progress: number;
  progressMessage: string;
  exchange: Exchange;
  timeframe: Timeframe;
  sortBy: SortOption;
  filters: ScannerFilters;
  candidates: Candidate[];
  error: string | null;
  lastScanTime: string | null;
}

// Exchange API interface
export interface ExchangeAPI {
  name: string;
  getTickers(): Promise<Ticker[]>;
  getKlines(symbol: string, interval: string, limit: number): Promise<Candle[]>;
  getTopGainers(minChange: number, limit: number): Promise<Ticker[]>;
  // Perpetual specific
  getFundingRate?(symbol: string): Promise<{ rate: number; nextFundingTime: number }>;
  getOpenInterest?(symbol: string): Promise<{ value: number; change24h: number }>;
}

// Translation keys
export interface TranslationKeys {
  // Header
  title: string;
  subtitle: string;
  
  // Controls
  scan: string;
  scanning: string;
  stopScan: string;
  selectExchange: string;
  selectTimeframe: string;
  sortBy: string;
  
  // Sorting options
  byConfidence: string;
  byPriceChange: string;
  byRSI: string;
  byShortScore: string;
  byVolume: string;
  
  // Filters
  filters: string;
  minConfidence: string;
  minPriceChange: string;
  onlyRsiDivergence: string;
  hideFakePump: string;
  
  // Progress
  analyzing: string;
  fetchingData: string;
  calculatingIndicators: string;
  findingSetups: string;
  complete: string;
  
  // Card
  entryZone: string;
  stopLoss: string;
  takeProfit1: string;
  takeProfit2: string;
  riskReward: string;
  breakeven: string;
  breakevenTrigger: string;
  keyLevels: string;
  warnings: string;
  
  // Recommendation
  enter: string;
  wait: string;
  skip: string;
  
  // Score
  shortScore: string;
  trend: string;
  momentum: string;
  volatility: string;
  volumeScore: string;
  divergenceScore: string;
  
  // Indicators
  rsi: string;
  macd: string;
  bollingerBands: string;
  ema: string;
  fourHTrend: string;
  obv: string;
  adx: string;
  rsiDivergence: string;
  macdDivergence: string;
  fakePump: string;
  vwap: string;
  stochRsi: string;
  multiTFAlignment: string;
  atr: string;
  // Perpetual indicators
  fundingRate: string;
  openInterest: string;
  
  // Status
  bullish: string;
  bearish: string;
  neutral: string;
  overbought: string;
  oversold: string;
  strong: string;
  moderate: string;
  weak: string;
  
  // Tooltip phrases
  goodForShort: string;
  badForShort: string;
  neutralSignal: string;
  overboughtShort: string;
  oversoldShort: string;
  bearishTrend: string;
  bullishTrend: string;
  bearishDiv: string;
  bullishDiv: string;
  noDiv: string;
  fallingVol: string;
  risingVol: string;
  priceUpperBB: string;
  priceLowerBB: string;
  priceMidBB: string;
  priceAboveVWAP: string;
  priceBelowVWAP: string;
  priceNearVWAP: string;
  strongTrend: string;
  weakTrend: string;
  fakePumpDetected: string;
  highVolatility: string;
  lowVolatility: string;
  mediumVolatility: string;
  positiveFunding: string;
  negativeFunding: string;
  neutralFunding: string;
  oiGrowing: string;
  oiFalling: string;
  oiNeutral: string;
  strongBearishTrend: string;
  bearishTrendGood: string;
  strongBullishTrend: string;
  bullishTrendBad: string;
  mixedSignals: string;
  optimalEntry: string;
  goodEntry: string;
  waitEntry: string;
  bearishEMA: string;
  bullishEMA: string;
  bearish4H: string;
  bullish4H: string;
  noFakePump: string;
  squeezeDetected: string;
  
  // Errors
  noResults: string;
  scanError: string;
  
  // Trading Style
  scalping: string;
  dayTrading: string;
  swing: string;
  scalpingDesc: string;
  dayTradingDesc: string;
  swingDesc: string;
  scalpingTime: string;
  dayTradingTime: string;
  swingTime: string;
  
  // Links
  viewOnTradingView: string;
  viewOnBinance: string;
  viewOnBybit: string;
  viewOnOKX: string;
}
