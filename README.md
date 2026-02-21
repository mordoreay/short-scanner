# SHORT Scanner v3.4

**Professional cryptocurrency SHORT setup scanner with Multi-TF analysis, Perpetual futures support, Smart Money tracking, and Candlestick Pattern detection.**

![Version](https://img.shields.io/badge/version-3.4-blue)
![Next.js](https://img.shields.io/badge/Next.js-16-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)

---

## 🎯 Overview

SHORT Scanner automatically detects potential SHORT trading opportunities on cryptocurrency perpetual futures markets. It analyzes price action, momentum indicators, market sentiment, smart money positioning, and candlestick patterns to identify overbought conditions suitable for short positions.

### Key Features

| Feature | Description |
|---------|-------------|
| **Multi-TF Analysis** | 5 timeframes pool: 5m, 15m, 1h, 2h, 4h with weighted scoring |
| **Entry Timing v2.0** | Candlestick patterns + 5m indicators + volume analysis |
| **10 Setup Types** | Divergence, Fake Pump, Structure Break, Double Top, etc. |
| **SHORT Score v3.3** | 0-100 scoring with Sentiment category |
| **Smart Money Tracking** | Long/Short Ratio + Top Traders positioning |
| **Order Flow Analysis** | Order Book Imbalance + Liquidation Heatmap |
| **Perpetual Data** | Funding Rate + History + Trend, Open Interest |
| **Sound Alerts** | Audio notification when score ≥ 70 |
| **Auto-Rescan** | 1m, 2m, 5m, 10m intervals |
| **Trade Levels** | Auto-calculated Entry Zone, Stop Loss, Take Profit, R:R ratio |
| **Multi-Language** | Russian 🇷🇺 and English 🇺🇸 support |
| **Auto TIER Detection** | Score-based volatility classification (no hardcoded lists!) |

---

## ⏱️ Entry Timing v2.0 (NEW!)

**Информационный индикатор тайминга входа — не влияет на основной Score!**

### Scoring Breakdown (0-100)

```
Entry Timing Score = Candle Patterns + Indicators 5m + Volume + Price Position
```

| Category | Max Score | Factors |
|----------|-----------|---------|
| **Candle Patterns** | 20 | Bearish Engulfing, Shooting Star, Evening Star, etc. |
| **Indicators 5m** | 35 | RSI, StochRSI, MACD, Micro-divergence |
| **Volume** | 25 | Volume spike, Selling pressure |
| **Price Position** | 20 | At resistance, Rejection wick |

### Candlestick Patterns Detected

| Pattern | Reliability | Score |
|---------|-------------|-------|
| **Bearish Engulfing** | ⭐⭐⭐ High | +15 |
| **Shooting Star** | ⭐⭐⭐ High | +12 |
| **Evening Star** | ⭐⭐⭐ High | +14 |
| **Three Black Crows** | ⭐⭐⭐ High | +12 |
| **Dark Cloud Cover** | ⭐⭐ Medium | +10 |
| **Upper Wick Rejection** | ⭐⭐ Medium | +5-8 |
| **Gravestone Doji** | ⭐⭐ Medium | +8 |
| **Bearish Harami** | ⭐ Low | +6 |
| **Tweezer Top** | ⭐ Low | +6 |

### UI Display

```
Entry: 🟢 78 NOW        → Score ≥ 70, optimal entry
Entry: 🟡 62 READY      → Score ≥ 55, good entry
Entry: 🟠 45 WAIT 5-15m → Score ≥ 40, wait for confirmation
Entry: 🔴 30 WAIT 15-30m → Score < 40, unfavorable
```

### Signal Interpretation

| Signal | Meaning |
|--------|---------|
| **NOW** | Optimal entry - high reliability pattern confirmed |
| **READY** | Good moment - can enter |
| **WAIT** | Early or late - wait for confirmation |

---

## 📊 Setup Types Detected

| Setup | Description |
|-------|-------------|
| **Divergence** | Bearish RSI/MACD divergence - price makes higher highs, indicator makes lower highs |
| **OI Divergence** | Price pumping while Open Interest drops - longs closing |
| **Fake Pump** | Artificial pump without real volume - potential sharp reversal |
| **Structure Break** | Local low breakout - trend structure change |
| **Double Top** | Classic reversal pattern with two peaks |
| **Rejection** | Bollinger Band upper rejection + RSI overbought |
| **Resistance Rejection** | Price rejected at key resistance level |
| **Breakout** | Bearish EMA crossover |
| **Level Breakout** | Support level breakout and retest |
| **Mean Reversion** | Price far from mean - expected return |

---

## 🏆 TIER System v2.0 (Score-Based)

**Automatic volatility classification without hardcoded lists!**

The system automatically determines TIER based on multiple factors:

### Score Formula

```
Score = Price Factor + ATR Factor + Price Change Factor + Age Factor + Volume Factor
```

### Score → TIER Mapping

| Score | TIER | Category | Examples |
|-------|------|----------|----------|
| 0-1.5 | **TIER 1** | Large Caps (stable) | SOL, TON, AVAX, LINK |
| 1.5-3.5 | **TIER 2** | Mid Caps (moderate) | DOGE, WLD, ARKM, PENDLE |
| 3.5+ | **TIER 3** | Memecoins (volatile) | PEPE, WIF, BONK, TAKE |

### TIER-Specific Settings

| Setting | TIER 1 | TIER 2 | TIER 3 |
|---------|--------|--------|--------|
| RSI Overbought | 68 | 70 | 75 |
| Price Change Extreme | 20% | 35% | 50% |
| TP ATR Multiplier | 1.8x | 2.2x | 2.5x |
| Breakeven Trigger | 1.5R | 1.2R | 1.0R |

---

## 🔧 SHORT Score v3.3 Breakdown

```
Score 0-100 = Momentum + Price Action + Sentiment + Perpetual + Trend Alignment + Divergence
```

| Category | Max | Key Factors |
|----------|-----|-------------|
| **Momentum** | 25 | RSI overbought (>70), StochRSI extreme, MACD bearish, ADX strength |
| **Price Action** | 20 | Price change magnitude, BB position, VWAP deviation |
| **Sentiment** | 20 | L/S Ratio (crowd), Top Traders (smart money) |
| **Perpetual** | 15 | Funding Rate, Funding Trend, Open Interest |
| **Trend Alignment** | 10 | Multi-TF weighted alignment (15m/1h/2h/4h) |
| **Divergence** | 10 | RSI/MACD divergence, OBV trend, Fake Pump detection |

### Critical Adjustments (Bonus/Penalty)

| Factor | Bonus | Penalty |
|--------|-------|---------|
| Perfect Sentiment (Crowd Long + Smart Short) | +8 | — |
| RSI > 75 + BB > 85 + Price Pump > 25% | +6 | — |
| Order Book Ask Dominance (>30%) | +4 | — |
| Order Book Bid Dominance (>30%) | — | -3 |
| Long Liquidations Below | +3 | — |
| Short Liquidations Above (Squeeze Risk) | — | -3 |
| Smart Money Long (>60%) | — | -10 |
| RSI Oversold (<25) | — | -10 |
| Extreme Funding (Squeeze Risk) | — | -8 |

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- Bun package manager

### Installation

```bash
# Clone repository
git clone https://github.com/mordoreay/short-scanner.git
cd short-scanner

# Install dependencies
bun install

# Start development server
bun run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 📱 Usage

### Scanner Controls

1. **Select Exchange**: Bybit, Binance, OKX
2. **Click "Scan"**: Analyze top gainers for SHORT setups
3. **Auto-Rescan**: Select interval (1m, 2m, 5m, 10m)
4. **Sound Alerts**: Automatic notification when score ≥ 70
5. **Filter**: Hide "Skip" recommendations with checkbox

### Understanding Results

| Badge | Meaning |
|-------|---------|
| 🟢 **Enter** | Score ≥ 50, RSI ≥ 65 - Good SHORT opportunity |
| 🟡 **Wait** | Score ≥ 30 - Needs confirmation |
| 🔴 **Skip** | Score < 30 - Not recommended |

### Trade Levels v4.0

| Level | Calculation |
|-------|-------------|
| **Entry Zone** | Setup-dependent (divergence, fake pump, rejection, etc.) |
| **Stop Loss** | Liquidation clusters → Order book walls → Structure levels → Min 2 ATR |
| **Take Profit 1** | ATR-based (1.8x-2.5x depending on TIER), min 2R |
| **Take Profit 2** | ATR-based (3x-4x depending on TIER), min 3R |
| **Breakeven** | Adaptive trigger based on ATR% volatility (0.75R-1.5R) |
| **R:R Ratio** | TP1 ≥ 2R, TP2 ≥ 3R |

### Indicators Displayed

| Category | Indicators |
|----------|------------|
| **Oscillators** | RSI, StochRSI |
| **Trend** | MACD, EMA (9/21/50/100/200), 4H Trend |
| **Volatility** | Bollinger Bands, ATR |
| **Volume** | OBV, Fake Pump Detection |
| **Position** | VWAP Deviation |
| **Entry Timing** | Candlestick Patterns, 5m RSI/StochRSI/MACD |
| **Perpetual** | Funding Rate + Trend + History, Open Interest |
| **Sentiment** | L/S Ratio, Top Traders |
| **Order Flow** | Order Book Imbalance, Liquidation Heatmap |

### Multi-TF Analysis

| Timeframe | Weight | Purpose |
|-----------|--------|---------|
| **5m** | — | Entry Timing only (not for signal) |
| **15m** | 10% | Short-term trend |
| **1h** | 20% | Main analysis timeframe |
| **2h** | 30% | Trend bridge |
| **4h** | 40% | Structure trend (highest weight) |

---

## 🔌 Supported Exchanges

| Exchange | Status | Features |
|----------|--------|----------|
| **Bybit** | ✅ Primary | Full data: L/S Ratio, Top Traders, Funding History, Order Book, Liquidations |
| **Binance** | ✅ Active | High liquidity, full perpetual data, Order Book, Liquidations |
| **OKX** | ✅ Active | Full perpetual data, Order Book, Liquidations |

---

## 🛠️ Tech Stack

### Frontend
- **Next.js 16** - App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **shadcn/ui** - UI components
- **Radix UI** - Accessible primitives

### Backend
- **Next.js API Routes** - Server endpoints
- **Custom Indicators** - RSI, MACD, BB, EMA, OBV, ADX, StochRSI
- **Candlestick Patterns** - 10 bearish patterns detection
- **Multi-TF Engine** - Weighted timeframe analysis
- **Score-Based TIER** - Automatic volatility classification

### Data Sources
- Exchange REST APIs for perpetual futures
- Real-time funding rates with history
- Open Interest data
- Long/Short Ratio (crowd sentiment)
- Top Traders positioning (smart money)
- Order Book depth analysis
- Liquidation orders data

---

## 📁 Project Structure

```
src/
├── app/
│   ├── page.tsx              # Main scanner UI
│   └── api/scanner/route.ts  # Scanner API endpoint
├── components/
│   ├── Scanner/              # Scanner components
│   │   ├── SetupCard.tsx     # Setup result card
│   │   ├── IndicatorsGrid.tsx # Indicators display with tooltips
│   │   └── ScannerControls.tsx
│   └── ui/                   # shadcn/ui components
├── lib/
│   ├── exchanges/            # Exchange APIs
│   │   ├── bybit.ts          # Order Book, Liquidations
│   │   ├── binance.ts
│   │   └── okx.ts
│   ├── indicators/           # Technical indicators
│   │   ├── rsi.ts
│   │   ├── macd.ts
│   │   ├── bollinger.ts
│   │   ├── ema.ts
│   │   ├── obv.ts
│   │   ├── candlePatterns.ts # NEW: Candlestick patterns
│   │   └── ...
│   ├── scoring/              # Score calculation
│   │   ├── shortScore.ts     # v3.3 with data checks
│   │   ├── tierConfig.ts     # TIER configurations
│   │   └── volatilityTier.ts # Score-based TIER detection
│   └── i18n/                 # Translations
│       ├── ru.ts
│       └── en.ts
└── types/
    └── scanner.ts            # TypeScript types
```

---

## 🌐 API Endpoint

### Scanner API

```
GET /api/scanner
```

**Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| exchange | string | bybit | Exchange name |
| minChange | number | 15 | Minimum 24h price change % |
| language | string | ru | Response language (ru/en) |

**Response:**
```json
{
  "success": true,
  "message": "Found 5 SHORT setups",
  "candidates": [
    {
      "symbol": "BTCUSDT",
      "tier": 1,
      "shortScore": { 
        "total": 65,
        "trend": 15,
        "momentum": 18,
        "volatility": 14,
        "volume": 10,
        "divergence": 8,
        "riskLevel": "low"
      },
      "recommendation": "enter",
      "setup": {
        "type": "divergence",
        "entryZone": [95000, 96000],
        "stopLoss": 97000,
        "takeProfit1": 92000,
        "takeProfit2": 90000,
        "riskReward": 2,
        "riskReward2": 3,
        "breakevenTrigger": 93500,
        "indicators": {
          "entryTiming": {
            "score": 72,
            "signal": "ready",
            "breakdown": {
              "candlePatterns": {
                "detected": [{"name": "Bearish Engulfing", "score": 15}]
              }
            }
          },
          "longShortRatio": { "longRatio": 68, "signal": "bearish" },
          "topTraders": { "shortRatio": 62, "signal": "bearish" },
          "fundingRate": { "rate": 0.0001, "trend": "decreasing" },
          "orderBook": { "imbalancePercent": -25, "signal": "bearish" }
        }
      }
    }
  ]
}
```

---

## ⚠️ Disclaimer

**This tool is for educational and informational purposes only.**

- NOT financial advice
- Trading cryptocurrencies involves significant risk
- Always do your own research (DYOR)
- Past performance does not guarantee future results
- Use proper risk management

---

## 📈 Version History

### v3.4 (Current) 

**Entry Timing v2.0**

| Feature | Description |
|---------|-------------|
| **Candlestick Patterns** | 10 bearish patterns: Engulfing, Shooting Star, Evening Star, etc. |
| **Enhanced Scoring** | 4 categories: Patterns, Indicators, Volume, Price Position |
| **Color Badge UI** | 🟢/🟡/🟠/🔴 visual indicator with wait time |
| **Russian Localization** | Pattern names in Russian |

**Trade Levels Improvements:**
- R:R for TP2 (riskReward2) added
- Adaptive breakeven based on ATR% volatility
- Structure-based Stop Loss calculation

### v3.3

**Score-Based TIER Detection v2.0**

| Feature | Description |
|---------|-------------|
| **Automatic TIER Classification** | No more hardcoded override lists! |
| **Multi-Factor Scoring** | Price + ATR + Price Change + Age + Volume |
| **Real-Time Adaptation** | New coins automatically classified correctly |

### v3.2

**Bug Fixes & Improvements**

| Fix | Description |
|-----|-------------|
| **Funding Rate Check** | Only affects score when data is present |
| **Open Interest Check** | Only affects score when data is present |
| **Order Book UI** | Shows score impact in tooltip |

### v3.1

**Order Flow Integration**

| Feature | Description |
|---------|-------------|
| **Order Book Imbalance** | Ask/Bid dominance analysis, wall detection |
| **Liquidation Heatmap** | Long/Short liquidation levels tracking |

### v3.0

**Major Update - Smart Money Tracking & Automation**

| Feature | Description |
|---------|-------------|
| **Sentiment Analysis** | Crowd vs Smart Money positioning |
| **Funding Rate History** | 8-period history with trend detection |
| **Sound Alerts** | Web Audio API notification |
| **Auto-Rescan** | Automatic scanning at intervals |

---

## 🤝 Contributing

Contributions are welcome! Feel free to:
- Report bugs
- Suggest features
- Submit pull requests

---

Made with ❤️ for crypto traders
