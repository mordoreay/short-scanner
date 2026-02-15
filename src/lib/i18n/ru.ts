import { TranslationKeys } from '@/types/scanner';

export const ru: TranslationKeys = {
  // Header
  title: 'SHORT Scanner',
  subtitle: 'PERPETUAL | Multi-TF | Funding + OI',
  
  // Controls
  scan: 'Сканировать',
  scanning: 'Сканирование...',
  stopScan: 'Остановить',
  selectExchange: 'Биржа',
  selectTimeframe: 'Таймфрейм',
  sortBy: 'Сортировка',
  
  // Sorting options
  byConfidence: 'По уверенности',
  byPriceChange: 'По изменению цены',
  byRSI: 'По RSI',
  byShortScore: 'По SHORT Score',
  byVolume: 'По объёму',
  
  // Filters
  filters: 'Фильтры',
  minConfidence: 'Мин. уверенность',
  minPriceChange: 'Мин. изменение цены',
  onlyRsiDivergence: 'Только с RSI дивергенцией',
  hideFakePump: 'Скрыть Fake Pump',
  
  // Progress
  analyzing: 'Анализ',
  fetchingData: 'Получение данных с биржи...',
  calculatingIndicators: 'Расчёт индикаторов...',
  findingSetups: 'Поиск сетапов...',
  complete: 'Готово',
  
  // Card
  entryZone: 'Зона входа',
  stopLoss: 'Стоп-лосс',
  takeProfit1: 'Тейк 1',
  takeProfit2: 'Тейк 2',
  riskReward: 'Риск/Прибыль',
  breakeven: 'Безубыток',
  breakevenTrigger: 'Триггер',
  keyLevels: 'Ключевые уровни',
  warnings: 'Предупреждения',
  
  // Recommendation
  enter: 'Входить',
  wait: 'Ждать',
  skip: 'Пропустить',
  
  // Score
  shortScore: 'SHORT Score',
  trend: 'Тренд',
  momentum: 'Моментум',
  volatility: 'Волатильность',
  volumeScore: 'Объём',
  divergenceScore: 'Дивергенция',
  
  // Indicators
  rsi: 'RSI',
  macd: 'MACD',
  bollingerBands: 'BB',
  ema: 'EMA',
  fourHTrend: '4H Тренд',
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
  fundingRate: 'Фандинг',
  openInterest: 'OI',
  
  // Status
  bullish: 'Бычий',
  bearish: 'Медвежий',
  neutral: 'Нейтральный',
  overbought: 'Перекуплен',
  oversold: 'Перепродан',
  strong: 'Сильный',
  moderate: 'Умеренный',
  weak: 'Слабый',
  
  // Errors
  noResults: 'Нет результатов',
  scanError: 'Ошибка сканирования',
  
  // Links
  viewOnTradingView: 'Открыть в TradingView',
  viewOnBinance: 'Открыть в Binance',
  viewOnBybit: 'Открыть в Bybit',
  viewOnOKX: 'Открыть в OKX',
};
