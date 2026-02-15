# 📉 SHORT Scanner v2.1

**Cryptocurrency SHORT setup scanner with Multi-TF analysis and Perpetual futures support.**

![Version](https://img.shields.io/badge/version-2.1-blue)
![Next.js](https://img.shields.io/badge/Next.js-15-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)

---

## 🎯 Overview

SHORT Scanner automatically detects potential SHORT trading opportunities on cryptocurrency perpetual futures markets. It analyzes price action, momentum indicators, and market sentiment to identify overbought conditions suitable for short positions.

### Key Features

| Feature | Description |
|---------|-------------|
| **Multi-TF Analysis** | 5 timeframes pool: 5m, 15m, 1h, 2h, 4h with weighted scoring |
| **10 Setup Types** | Divergence, Fake Pump, Structure Break, Double Top, etc. |
| **SHORT Score v2.1** | 0-100 scoring system based on momentum, price action, divergence |
| **Perpetual Data** | Funding Rate & Open Interest analysis |
| **Trade Levels** | Auto-calculated Entry Zone, Stop Loss, Take Profit, R:R ratio |
| **Trading Style** | Scalping / Day Trading / Swing detection |
| **Multi-Language** | Russian 🇷🇺 and English 🇺🇸 support |

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

## 🔧 SHORT Score v2.1 Breakdown

```
Score 0-100 = Momentum + Price Action + Divergence + Volume + Perpetual + Trend
```

| Category | Weight | Key Factors |
|----------|--------|-------------|
| **Momentum** | 30% | RSI overbought (>70), StochRSI extreme, MACD bearish |
| **Price Action** | 20% | Price change magnitude, BB position, VWAP deviation |
| **Divergence** | 15% | RSI/MACD bearish divergence with confirmation |
| **Volume** | 10% | OBV trend, Fake Pump detection |
| **Perpetual** | 15% | Funding Rate, Open Interest interpretation |
| **Trend** | 10% | Multi-TF alignment score |

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
3. **Review Results**: Check score, setup type, trade levels
4. **Filter**: Hide "Skip" recommendations with checkbox

### Understanding Results

| Badge | Meaning |
|-------|---------|
| 🟢 **Enter** | Score ≥ 50, RSI ≥ 65 - Good SHORT opportunity |
| 🟡 **Wait** | Score ≥ 30 - Needs confirmation |
| 🔴 **Skip** | Score < 30 - Not recommended |

### Trade Levels

| Level | Calculation |
|-------|-------------|
| **Entry Zone** | Current price ± 1% (setup-dependent) |
| **Stop Loss** | Minimum 2 ATR above entry, behind resistance |
| **Take Profit 1** | Minimum 1.5R (structure-based) |
| **Take Profit 2** | Minimum 3R (structure-based) |
| **R:R Ratio** | Minimum 1.5 |

---

## 🔌 Supported Exchanges

| Exchange | Status | Notes |
|----------|--------|-------|
| **Bybit** | ✅ Active | Primary, best data |
| **Binance** | ✅ Active | High liquidity |
| **OKX** | ✅ Active | Fixed API endpoints |

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

### Data Sources
- Exchange REST APIs for perpetual futures
- Real-time funding rates
- Open Interest data

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
│   │   ├── IndicatorsGrid.tsx # Indicators display
│   │   └── ScannerControls.tsx
│   └── ui/                   # shadcn/ui components
├── lib/
│   ├── exchanges/            # Exchange APIs
│   │   ├── bybit.ts
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
│   │   └── shortScore.ts
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
      "shortScore": { "total": 65 },
      "recommendation": "enter",
      "setup": {
        "type": "divergence",
        "entryZone": [95000, 96000],
        "stopLoss": 97000,
        "takeProfit1": 92000,
        "riskReward": 1.5
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

### v2.1 (Current)
- Recalibrated SHORT Score for gainers
- Added price change magnitude scoring
- Improved R:R calculation (min 1.5)
- Added Trading Style detection
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

## 📄 License

MIT License - feel free to use for personal or commercial projects.

---

**Built for traders who prefer data over emotions.** 📉
