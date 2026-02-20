# 📉 SHORT Scanner v3.3

**Professional cryptocurrency SHORT setup scanner with Multi-TF analysis, Perpetual futures support, and Smart Money tracking.**

![Version](https://img.shields.io/badge/version-3.3-blue)
![Next.js](https://img.shields.io/badge/Next.js-15-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)

---

## 🎯 Overview

SHORT Scanner automatically detects potential SHORT trading opportunities on cryptocurrency perpetual futures markets. It analyzes price action, momentum indicators, market sentiment, and smart money positioning to identify overbought conditions suitable for short positions.

### Key Features

| Feature | Description |
|---------|-------------|
| **Multi-TF Analysis** | 5 timeframes pool: 5m, 15m, 1h, 2h, 4h with weighted scoring |
| **10 Setup Types** | Divergence, Fake Pump, Structure Break, Double Top, etc. |
| **SHORT Score v3.2** | 0-100 scoring with Sentiment category |
| **Smart Money Tracking** | Long/Short Ratio + Top Traders positioning |
| **Order Flow Analysis** | Order Book Imbalance + Liquidation Heatmap |
| **Perpetual Data** | Funding Rate + History + Trend, Open Interest |
| **Sound Alerts** | Audio notification when score ≥ 70 |
| **Auto-Rescan** | 1m, 2m, 5m, 10m intervals |
| **Trade Levels** | Auto-calculated Entry Zone, Stop Loss, Take Profit, R:R ratio |
| **Multi-Language** | Russian 🇷🇺 and English 🇺🇸 support |
| **Auto TIER Detection** | Score-based volatility classification (no hardcoded lists!) |

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

### Factor Weights

| Factor | TIER 1 | TIER 2 | TIER 3 |
|--------|--------|--------|--------|
| **Price** | ≥$10 (+0) | $0.5-$10 (+0.5) | <$0.01 (+1.5-3) |
| **ATR Volatility** | ≤5% (+0) | 5-8% (+1) | >12% (+2.5) |
| **24h Price Change** | ≤10% (+0) | 10-25% (+0.5) | >50% (+1.5) |
| **Coin Age** | >2 weeks (+0) | <2 weeks (+0.5) | <1 day (+2) |
| **Volume Spike** | Normal (+0) | 5-10x (+0.5) | >10x (+1) |

### Real-World Examples

| Coin | Price | ATR | 24h Change | Score | TIER |
|------|-------|-----|------------|-------|------|
| SOL | $150 | 4% | 8% | 0.5 | 1 |
| SNX | $0.35 | 4% | 16% | 2.0 | 2 |
| PEPE | $0.00001 | 15% | 50% | 7.0 | 3 |
| TAKE | $0.0002 | 18% | 60% | 7.0 | 3 |

**No more override lists!** New coins are automatically classified correctly.

### TIER-Specific Settings

| Setting | TIER 1 | TIER 2 | TIER 3 |
|---------|--------|--------|--------|
| RSI Overbought | 68 | 70 | 75 |
| Price Change Extreme | 20% | 35% | 50% |
| TP ATR Multiplier | 1.8x | 2.2x | 2.5x |
| Breakeven Trigger | 1.5R | 1.2R | 1.0R |

---

## 🔧 SHORT Score v3.2 Breakdown

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

### ⭐ Data Availability Checks

**Important:** Score is only affected when data is available!

| Indicator | No Data Behavior |
|-----------|------------------|
| Funding Rate | No impact on score |
| Open Interest | No impact on score |
| Order Book | No impact on score |
| Liquidation Heatmap | No impact on score |

UI shows "No data" with muted color when data is missing.

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

### Trade Levels v3.0

| Level | Calculation |
|-------|-------------|
| **Entry Zone** | Setup-dependent (divergence, fake pump, rejection, etc.) |
| **Stop Loss** | Liquidation clusters → Order book walls → Structure levels → Min 2 ATR |
| **Take Profit 1** | ATR-based (1.8x-2.5x depending on TIER) |
| **Take Profit 2** | ATR-based (3x-4x depending on TIER) |
| **Breakeven** | TIER-adaptive trigger (1.0R-1.5R) |
| **R:R Ratio** | Minimum 1.5 |

### Indicators Displayed

| Category | Indicators |
|----------|------------|
| **Oscillators** | RSI, StochRSI |
| **Trend** | MACD, EMA (9/21/50/100/200), 4H Trend |
| **Volatility** | Bollinger Bands, ATR |
| **Volume** | OBV, Fake Pump Detection |
| **Position** | VWAP Deviation |
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

**Note:** 5m is excluded from scoring to avoid noise, but used for Entry Timing indicator.

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
- **Next.js 15** - App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **shadcn/ui** - UI components
- **Radix UI** - Accessible primitives

### Backend
- **Next.js API Routes** - Server endpoints
- **Custom Indicators** - RSI, MACD, BB, EMA, OBV, ADX, StochRSI
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
│   │   └── ...
│   ├── scoring/              # Score calculation
│   │   ├── shortScore.ts     # v3.2 with data checks
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
        "riskReward": 1.5,
        "indicators": {
          "longShortRatio": { "longRatio": 68, "signal": "bearish" },
          "topTraders": { "shortRatio": 62, "signal": "bearish" },
          "fundingRate": { "rate": 0.0001, "trend": "decreasing" },
          "orderBook": { "imbalancePercent": -25, "signal": "bearish" },
          "liquidationHeatmap": { "totalLongLiquidations": 150000 }
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

### v3.3 (Current) 🚀

**Score-Based TIER Detection v2.0**

| Feature | Description |
|---------|-------------|
| **Automatic TIER Classification** | No more hardcoded override lists! |
| **Multi-Factor Scoring** | Price + ATR + Price Change + Age + Volume |
| **Real-Time Adaptation** | New coins automatically classified correctly |
| **Confidence Scoring** | Shows detection reliability (data quality based) |

**UI Improvements:**
- "Тейк 1" renamed to "Тейк-профит" in Russian UI
- Trade levels now use ATR-based targets (TIER-adaptive)
- Stop Loss uses liquidation clusters + order book walls

### v3.2

**Bug Fixes & Improvements**

| Fix | Description |
|-----|-------------|
| **Funding Rate Check** | Only affects score when data is present |
| **Open Interest Check** | Only affects score when data is present |
| **Order Book UI** | Shows score impact in tooltip |
| **Liquidation UI** | Shows score impact in tooltip |
| **No Data Indicator** | Visual "No data" when API returns empty |

### v3.1

**Order Flow Integration**

| Feature | Description |
|---------|-------------|
| **Order Book Imbalance** | Ask/Bid dominance analysis, wall detection |
| **Liquidation Heatmap** | Long/Short liquidation levels tracking |
| **Score Impact** | Order Book: ±1-4 points, Liquidations: ±3 points |

### v3.0

**Major Update - Smart Money Tracking & Automation**

| Feature | Description |
|---------|-------------|
| **Sentiment Analysis** | Crowd vs Smart Money positioning via L/S Ratio & Top Traders |
| **Funding Rate History** | 8-period history with trend detection |
| **Sound Alerts** | Web Audio API notification when SHORT Score ≥ 70 |
| **Auto-Rescan** | Automatic scanning at 1m, 2m, 5m, or 10m intervals |

### v2.1
- Recalibrated SHORT Score for gainers
- Added price change magnitude scoring
- Improved R:R calculation (min 1.5)
- Multi-language support (RU/EN)

### v2.0
- Multi-TF analysis (5 timeframes)
- Perpetual futures support
- 10 setup types
- 3 exchanges

---

## 🤝 Contributing

Contributions are welcome! Feel free to:
- Report bugs
- Suggest features
- Submit pull requests

---

Made with ❤️ for crypto traders
