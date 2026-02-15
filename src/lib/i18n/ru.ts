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
  hideSkipSetups: 'Скрыть "Пропустить"',
  
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
  
  // Tooltip phrases
  goodForShort: 'хорошо для SHORT',
  badForShort: 'плохо для SHORT',
  neutralSignal: 'Нейтрально',
  overboughtShort: 'Перекуплен (>70) = хорошо для SHORT',
  oversoldShort: 'Перепродан (<30) = плохо для SHORT',
  bearishTrend: 'Медвежий тренд = хорошо для SHORT',
  bullishTrend: 'Бычий тренд = плохо для SHORT',
  bearishDiv: 'Медвежья дивергенция = хорошо для SHORT',
  bullishDiv: 'Бычья дивергенция = плохо для SHORT',
  noDiv: 'Нет дивергенции',
  fallingVol: 'Падающий объём = хорошо для SHORT',
  risingVol: 'Растущий объём = плохо для SHORT',
  priceUpperBB: 'Цена у верхней полосы = хорошо для SHORT',
  priceLowerBB: 'Цена у нижней полосы = плохо для SHORT',
  priceMidBB: 'Цена в середине полос',
  priceAboveVWAP: 'Цена значительно выше VWAP = хорошо для SHORT',
  priceBelowVWAP: 'Цена значительно ниже VWAP = плохо для SHORT',
  priceNearVWAP: 'Цена близко к VWAP',
  strongTrend: 'Сильный тренд = хорошая направленность',
  weakTrend: 'Слабый тренд = отсутствие направления',
  fakePumpDetected: 'Фейковый памп = потенциальный разворот вниз = хорошо для SHORT',
  highVolatility: 'Высокая волатильность = больший риск, но и потенциал',
  lowVolatility: 'Низкая волатильность = меньшее движение',
  mediumVolatility: 'Средняя волатильность',
  positiveFunding: 'Положительный фандинг = шортисты платят = толпа в шортах = хорошо для SHORT',
  negativeFunding: 'Отрицательный фандинг = лонгисты платят = толпа в лонгах = плохо для SHORT',
  neutralFunding: 'Фандинг нейтральный',
  oiGrowing: 'OI растёт при падении цены = новые шорты = хорошо для SHORT',
  oiFalling: 'OI падает при падении цены = шорты закрываются = плохо для SHORT',
  oiNeutral: 'OI нейтрален',
  strongBearishTrend: 'Сильный медвежий тренд = отлично для SHORT',
  bearishTrendGood: 'Медвежий тренд = хорошо для SHORT',
  strongBullishTrend: 'Сильный бычий тренд = плохо для SHORT',
  bullishTrendBad: 'Бычий тренд = плохо для SHORT',
  mixedSignals: 'Смешанные сигналы',
  optimalEntry: 'Оптимальный момент для входа!',
  goodEntry: 'Хороший момент для входа',
  waitEntry: 'Лучше подождать',
  bearishEMA: 'Медвежье выравнивание EMA = хорошо для SHORT',
  bullishEMA: 'Бычье выравнивание = плохо для SHORT',
  bearish4H: 'Медвежий тренд на 4H = хорошо для SHORT',
  bullish4H: 'Бычий тренд на 4H = плохо для SHORT',
  noFakePump: 'No fake pump signals detected',
  squeezeDetected: 'Squeeze detected!',
  
  // Errors
  noResults: 'Нет результатов',
  scanError: 'Ошибка сканирования',
  
  // Trading Style
  scalping: 'Скальпинг',
  dayTrading: 'Дей-трейдинг',
  swing: 'Свинг',
  scalpingDesc: 'Быстрый вход/выход, высокие риски, краткосрочные цели',
  dayTradingDesc: 'Внутридневная торговля, средние цели, умеренные риски',
  swingDesc: 'Долгосрочная позиция, следование тренду, низкие риски',
  scalpingTime: '15мин - 2ч',
  dayTradingTime: '2ч - 1 день',
  swingTime: '1-7 дней',
  
  // Links
  viewOnTradingView: 'Открыть в TradingView',
  viewOnBinance: 'Открыть в Binance',
  viewOnBybit: 'Открыть в Bybit',
  viewOnOKX: 'Открыть в OKX',
};
