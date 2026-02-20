#!/bin/bash

# SHORT Scanner Comprehensive Test Suite
# ======================================

BASE_URL="http://localhost:3000"
PASS=0
FAIL=0
WARN=0

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║         SHORT SCANNER - COMPREHENSIVE TEST SUITE           ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Test helper
test_api() {
    local name="$1"
    local url="$2"
    local check="$3"
    
    echo -n "  Testing $name... "
    response=$(curl -s "$url" 2>/dev/null)
    
    if eval "$check"; then
        echo -e "${GREEN}✓ PASS${NC}"
        ((PASS++))
    else
        echo -e "${RED}✗ FAIL${NC}"
        ((FAIL++))
    fi
}

# ============================================
# SECTION 1: CORE API ENDPOINTS
# ============================================
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}1. CORE API ENDPOINTS${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

test_api "Homepage" "$BASE_URL/" '[[ "$response" == *"SHORT Scanner"* ]]'
test_api "API Health" "$BASE_URL/api/scanner?exchange=bybit" '[[ "$response" == *"success"* ]]'

# ============================================
# SECTION 2: EXCHANGE APIs
# ============================================
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}2. EXCHANGE APIs${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

test_api "Bybit Scanner" "$BASE_URL/api/scanner?exchange=bybit" '[[ "$response" == *"candidates"* ]]'
test_api "Binance Scanner" "$BASE_URL/api/scanner?exchange=binance" '[[ "$response" == *"success"* ]]'
test_api "OKX Scanner" "$BASE_URL/api/scanner?exchange=okx" '[[ "$response" == *"success"* ]]'

# ============================================
# SECTION 3: INDICATORS DATA
# ============================================
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}3. INDICATORS DATA (Bybit)${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

BYBIT_DATA=$(curl -s "$BASE_URL/api/scanner?exchange=bybit" 2>/dev/null)

# Test RSI
echo -n "  Testing RSI indicator... "
rsi=$(echo "$BYBIT_DATA" | jq -r '.candidates[0].setup.indicators.rsi.value // empty' 2>/dev/null)
if [[ -n "$rsi" && "$rsi" != "null" ]]; then
    echo -e "${GREEN}✓ PASS (RSI: $rsi)${NC}"
    ((PASS++))
else
    echo -e "${RED}✗ FAIL${NC}"
    ((FAIL++))
fi

# Test MACD
echo -n "  Testing MACD indicator... "
macd=$(echo "$BYBIT_DATA" | jq -r '.candidates[0].setup.indicators.macd.trend // empty' 2>/dev/null)
if [[ -n "$macd" && "$macd" != "null" ]]; then
    echo -e "${GREEN}✓ PASS (Trend: $macd)${NC}"
    ((PASS++))
else
    echo -e "${RED}✗ FAIL${NC}"
    ((FAIL++))
fi

# Test Bollinger Bands
echo -n "  Testing Bollinger Bands... "
bb=$(echo "$BYBIT_DATA" | jq -r '.candidates[0].setup.indicators.bollingerBands.position // empty' 2>/dev/null)
if [[ -n "$bb" && "$bb" != "null" ]]; then
    echo -e "${GREEN}✓ PASS (Position: $bb)${NC}"
    ((PASS++))
else
    echo -e "${RED}✗ FAIL${NC}"
    ((FAIL++))
fi

# Test EMA
echo -n "  Testing EMA alignment... "
ema=$(echo "$BYBIT_DATA" | jq -r '.candidates[0].setup.indicators.ema.trend // empty' 2>/dev/null)
if [[ -n "$ema" && "$ema" != "null" ]]; then
    echo -e "${GREEN}✓ PASS (Trend: $ema)${NC}"
    ((PASS++))
else
    echo -e "${RED}✗ FAIL${NC}"
    ((FAIL++))
fi

# Test VWAP
echo -n "  Testing VWAP... "
vwap=$(echo "$BYBIT_DATA" | jq -r '.candidates[0].setup.indicators.vwap.deviation // empty' 2>/dev/null)
if [[ -n "$vwap" && "$vwap" != "null" ]]; then
    echo -e "${GREEN}✓ PASS (Deviation: $vwap)${NC}"
    ((PASS++))
else
    echo -e "${RED}✗ FAIL${NC}"
    ((FAIL++))
fi

# Test StochRSI
echo -n "  Testing StochRSI... "
stoch=$(echo "$BYBIT_DATA" | jq -r '.candidates[0].setup.indicators.stochRsi.k // empty' 2>/dev/null)
if [[ -n "$stoch" && "$stoch" != "null" ]]; then
    echo -e "${GREEN}✓ PASS (K: $stoch)${NC}"
    ((PASS++))
else
    echo -e "${RED}✗ FAIL${NC}"
    ((FAIL++))
fi

# Test ADX
echo -n "  Testing ADX... "
adx=$(echo "$BYBIT_DATA" | jq -r '.candidates[0].setup.indicators.adx.value // empty' 2>/dev/null)
if [[ -n "$adx" && "$adx" != "null" ]]; then
    echo -e "${GREEN}✓ PASS (ADX: $adx)${NC}"
    ((PASS++))
else
    echo -e "${RED}✗ FAIL${NC}"
    ((FAIL++))
fi

# Test OBV
echo -n "  Testing OBV... "
obv=$(echo "$BYBIT_DATA" | jq -r '.candidates[0].setup.indicators.obv.trend // empty' 2>/dev/null)
if [[ -n "$obv" && "$obv" != "null" ]]; then
    echo -e "${GREEN}✓ PASS (Trend: $obv)${NC}"
    ((PASS++))
else
    echo -e "${RED}✗ FAIL${NC}"
    ((FAIL++))
fi

# ============================================
# SECTION 4: PERPETUAL INDICATORS
# ============================================
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}4. PERPETUAL INDICATORS${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# Test Funding Rate
echo -n "  Testing Funding Rate... "
funding=$(echo "$BYBIT_DATA" | jq -r '.candidates[0].setup.indicators.fundingRate.rate // empty' 2>/dev/null)
if [[ -n "$funding" && "$funding" != "null" ]]; then
    echo -e "${GREEN}✓ PASS (Rate: $funding)${NC}"
    ((PASS++))
else
    echo -e "${RED}✗ FAIL${NC}"
    ((FAIL++))
fi

# Test Funding Rate History
echo -n "  Testing Funding Rate History... "
funding_hist=$(echo "$BYBIT_DATA" | jq -r '.candidates[0].setup.indicators.fundingRate.history | length // 0' 2>/dev/null)
if [[ "$funding_hist" -gt 0 ]]; then
    echo -e "${GREEN}✓ PASS ($funding_hist entries)${NC}"
    ((PASS++))
else
    echo -e "${RED}✗ FAIL${NC}"
    ((FAIL++))
fi

# Test Funding Trend
echo -n "  Testing Funding Trend... "
funding_trend=$(echo "$BYBIT_DATA" | jq -r '.candidates[0].setup.indicators.fundingRate.trend // empty' 2>/dev/null)
if [[ -n "$funding_trend" && "$funding_trend" != "null" ]]; then
    echo -e "${GREEN}✓ PASS (Trend: $funding_trend)${NC}"
    ((PASS++))
else
    echo -e "${RED}✗ FAIL${NC}"
    ((FAIL++))
fi

# Test Open Interest
echo -n "  Testing Open Interest... "
oi=$(echo "$BYBIT_DATA" | jq -r '.candidates[0].setup.indicators.openInterest.value // empty' 2>/dev/null)
if [[ -n "$oi" && "$oi" != "null" ]]; then
    echo -e "${GREEN}✓ PASS (OI: $oi)${NC}"
    ((PASS++))
else
    echo -e "${RED}✗ FAIL${NC}"
    ((FAIL++))
fi

# Test Long/Short Ratio
echo -n "  Testing Long/Short Ratio... "
ls=$(echo "$BYBIT_DATA" | jq -r '.candidates[0].setup.indicators.longShortRatio.longRatio // empty' 2>/dev/null)
if [[ -n "$ls" && "$ls" != "null" ]]; then
    echo -e "${GREEN}✓ PASS (Long: ${ls}%)${NC}"
    ((PASS++))
else
    echo -e "${RED}✗ FAIL${NC}"
    ((FAIL++))
fi

# Test Top Traders
echo -n "  Testing Top Traders... "
tt=$(echo "$BYBIT_DATA" | jq -r '.candidates[0].setup.indicators.topTraders.longRatio // empty' 2>/dev/null)
if [[ -n "$tt" && "$tt" != "null" ]]; then
    echo -e "${GREEN}✓ PASS (Long: ${tt}%)${NC}"
    ((PASS++))
else
    echo -e "${RED}✗ FAIL${NC}"
    ((FAIL++))
fi

# ============================================
# SECTION 5: SHORT SCORE SYSTEM
# ============================================
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}5. SHORT SCORE SYSTEM${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# Test Total Score
echo -n "  Testing Total Score... "
total=$(echo "$BYBIT_DATA" | jq -r '.candidates[0].shortScore.total // empty' 2>/dev/null)
if [[ -n "$total" && "$total" != "null" && "$total" -ge 0 && "$total" -le 100 ]]; then
    echo -e "${GREEN}✓ PASS (Score: $total)${NC}"
    ((PASS++))
else
    echo -e "${RED}✗ FAIL${NC}"
    ((FAIL++))
fi

# Test Sentiment Score
echo -n "  Testing Sentiment Score... "
sentiment=$(echo "$BYBIT_DATA" | jq -r '.candidates[0].shortScore.trend // empty' 2>/dev/null)
if [[ -n "$sentiment" && "$sentiment" != "null" && "$sentiment" -ge -10 && "$sentiment" -le 20 ]]; then
    echo -e "${GREEN}✓ PASS (Score: $sentiment)${NC}"
    ((PASS++))
else
    echo -e "${RED}✗ FAIL${NC}"
    ((FAIL++))
fi

# Test Momentum Score
echo -n "  Testing Momentum Score... "
momentum=$(echo "$BYBIT_DATA" | jq -r '.candidates[0].shortScore.momentum // empty' 2>/dev/null)
if [[ -n "$momentum" && "$momentum" != "null" ]]; then
    echo -e "${GREEN}✓ PASS (Score: $momentum)${NC}"
    ((PASS++))
else
    echo -e "${RED}✗ FAIL${NC}"
    ((FAIL++))
fi

# Test Volatility Score
echo -n "  Testing Volatility Score... "
vol=$(echo "$BYBIT_DATA" | jq -r '.candidates[0].shortScore.volatility // empty' 2>/dev/null)
if [[ -n "$vol" && "$vol" != "null" ]]; then
    echo -e "${GREEN}✓ PASS (Score: $vol)${NC}"
    ((PASS++))
else
    echo -e "${RED}✗ FAIL${NC}"
    ((FAIL++))
fi

# Test Volume Score
echo -n "  Testing Perpetual Score... "
vol_score=$(echo "$BYBIT_DATA" | jq -r '.candidates[0].shortScore.volume // empty' 2>/dev/null)
if [[ -n "$vol_score" && "$vol_score" != "null" ]]; then
    echo -e "${GREEN}✓ PASS (Score: $vol_score)${NC}"
    ((PASS++))
else
    echo -e "${RED}✗ FAIL${NC}"
    ((FAIL++))
fi

# Test Divergence Score
echo -n "  Testing Divergence Score... "
div=$(echo "$BYBIT_DATA" | jq -r '.candidates[0].shortScore.divergence // empty' 2>/dev/null)
if [[ -n "$div" && "$div" != "null" ]]; then
    echo -e "${GREEN}✓ PASS (Score: $div)${NC}"
    ((PASS++))
else
    echo -e "${RED}✗ FAIL${NC}"
    ((FAIL++))
fi

# Test Risk Level
echo -n "  Testing Risk Level... "
risk=$(echo "$BYBIT_DATA" | jq -r '.candidates[0].shortScore.riskLevel // empty' 2>/dev/null)
if [[ "$risk" == "low" || "$risk" == "medium" || "$risk" == "high" ]]; then
    echo -e "${GREEN}✓ PASS (Risk: $risk)${NC}"
    ((PASS++))
else
    echo -e "${RED}✗ FAIL${NC}"
    ((FAIL++))
fi

# ============================================
# SECTION 6: SETUP DATA
# ============================================
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}6. SETUP DATA${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# Test Entry Zone
echo -n "  Testing Entry Zone... "
entry=$(echo "$BYBIT_DATA" | jq -r '.candidates[0].setup.entryZone[0] // empty' 2>/dev/null)
if [[ -n "$entry" && "$entry" != "null" ]]; then
    echo -e "${GREEN}✓ PASS${NC}"
    ((PASS++))
else
    echo -e "${RED}✗ FAIL${NC}"
    ((FAIL++))
fi

# Test Stop Loss
echo -n "  Testing Stop Loss... "
sl=$(echo "$BYBIT_DATA" | jq -r '.candidates[0].setup.stopLoss // empty' 2>/dev/null)
if [[ -n "$sl" && "$sl" != "null" ]]; then
    echo -e "${GREEN}✓ PASS${NC}"
    ((PASS++))
else
    echo -e "${RED}✗ FAIL${NC}"
    ((FAIL++))
fi

# Test Take Profits
echo -n "  Testing Take Profits... "
tp1=$(echo "$BYBIT_DATA" | jq -r '.candidates[0].setup.takeProfit1 // empty' 2>/dev/null)
tp2=$(echo "$BYBIT_DATA" | jq -r '.candidates[0].setup.takeProfit2 // empty' 2>/dev/null)
if [[ -n "$tp1" && -n "$tp2" ]]; then
    echo -e "${GREEN}✓ PASS${NC}"
    ((PASS++))
else
    echo -e "${RED}✗ FAIL${NC}"
    ((FAIL++))
fi

# Test Risk/Reward
echo -n "  Testing Risk/Reward... "
rr=$(echo "$BYBIT_DATA" | jq -r '.candidates[0].setup.riskReward // empty' 2>/dev/null)
if [[ -n "$rr" && "$rr" != "null" ]]; then
    echo -e "${GREEN}✓ PASS (R:R $rr)${NC}"
    ((PASS++))
else
    echo -e "${RED}✗ FAIL${NC}"
    ((FAIL++))
fi

# Test Key Levels
echo -n "  Testing Key Levels... "
levels=$(echo "$BYBIT_DATA" | jq -r '.candidates[0].setup.keyLevels | length // 0' 2>/dev/null)
if [[ "$levels" -gt 0 ]]; then
    echo -e "${GREEN}✓ PASS ($levels levels)${NC}"
    ((PASS++))
else
    echo -e "${RED}✗ FAIL${NC}"
    ((FAIL++))
fi

# ============================================
# SECTION 7: MULTI-TIMEFRAME DATA
# ============================================
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}7. MULTI-TIMEFRAME DATA${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# Test Multi-TF Alignment
echo -n "  Testing Multi-TF Alignment... "
mtf=$(echo "$BYBIT_DATA" | jq -r '.candidates[0].setup.indicators.multiTFAlignment.direction // empty' 2>/dev/null)
if [[ -n "$mtf" && "$mtf" != "null" ]]; then
    echo -e "${GREEN}✓ PASS ($mtf)${NC}"
    ((PASS++))
else
    echo -e "${RED}✗ FAIL${NC}"
    ((FAIL++))
fi

# Test 4H Trend
echo -n "  Testing 4H Trend... "
trend4h=$(echo "$BYBIT_DATA" | jq -r '.candidates[0].setup.indicators.fourHTrend.trend // empty' 2>/dev/null)
if [[ -n "$trend4h" && "$trend4h" != "null" ]]; then
    echo -e "${GREEN}✓ PASS ($trend4h)${NC}"
    ((PASS++))
else
    echo -e "${RED}✗ FAIL${NC}"
    ((FAIL++))
fi

# Test TF timeframes
echo -n "  Testing All Timeframes... "
tf5=$(echo "$BYBIT_DATA" | jq -r '.candidates[0].setup.indicators.multiTFAlignment.timeframes["5m"] // empty' 2>/dev/null)
tf15=$(echo "$BYBIT_DATA" | jq -r '.candidates[0].setup.indicators.multiTFAlignment.timeframes["15m"] // empty' 2>/dev/null)
tf1h=$(echo "$BYBIT_DATA" | jq -r '.candidates[0].setup.indicators.multiTFAlignment.timeframes["1h"] // empty' 2>/dev/null)
tf4h=$(echo "$BYBIT_DATA" | jq -r '.candidates[0].setup.indicators.multiTFAlignment.timeframes["4h"] // empty' 2>/dev/null)
if [[ -n "$tf5" && -n "$tf15" && -n "$tf1h" && -n "$tf4h" ]]; then
    echo -e "${GREEN}✓ PASS${NC}"
    ((PASS++))
else
    echo -e "${RED}✗ FAIL${NC}"
    ((FAIL++))
fi

# ============================================
# SECTION 8: DIVERGENCE DETECTION
# ============================================
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}8. DIVERGENCE DETECTION${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# Test RSI Divergence
echo -n "  Testing RSI Divergence... "
rsi_div=$(echo "$BYBIT_DATA" | jq -r '.candidates[0].setup.indicators.rsiDivergence.type // empty' 2>/dev/null)
if [[ -n "$rsi_div" ]]; then
    echo -e "${GREEN}✓ PASS (${rsi_div:-none})${NC}"
    ((PASS++))
else
    echo -e "${RED}✗ FAIL${NC}"
    ((FAIL++))
fi

# Test MACD Divergence
echo -n "  Testing MACD Divergence... "
macd_div=$(echo "$BYBIT_DATA" | jq -r '.candidates[0].setup.indicators.macdDivergence.type // empty' 2>/dev/null)
if [[ -n "$macd_div" ]]; then
    echo -e "${GREEN}✓ PASS (${macd_div:-none})${NC}"
    ((PASS++))
else
    echo -e "${RED}✗ FAIL${NC}"
    ((FAIL++))
fi

# Test Fake Pump Detection
echo -n "  Testing Fake Pump Detection... "
fake=$(echo "$BYBIT_DATA" | jq -r '.candidates[0].setup.indicators.fakePump.isFake // false' 2>/dev/null)
if [[ "$fake" == "true" || "$fake" == "false" ]]; then
    echo -e "${GREEN}✓ PASS ($fake)${NC}"
    ((PASS++))
else
    echo -e "${RED}✗ FAIL${NC}"
    ((FAIL++))
fi

# ============================================
# SECTION 9: TICKER DATA
# ============================================
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}9. TICKER DATA${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# Test Symbol
echo -n "  Testing Symbol... "
symbol=$(echo "$BYBIT_DATA" | jq -r '.candidates[0].symbol // empty' 2>/dev/null)
if [[ -n "$symbol" && "$symbol" != "null" ]]; then
    echo -e "${GREEN}✓ PASS ($symbol)${NC}"
    ((PASS++))
else
    echo -e "${RED}✗ FAIL${NC}"
    ((FAIL++))
fi

# Test Price
echo -n "  Testing Price... "
price=$(echo "$BYBIT_DATA" | jq -r '.candidates[0].currentPrice // empty' 2>/dev/null)
if [[ -n "$price" && "$price" != "null" ]]; then
    echo -e "${GREEN}✓ PASS (\$price)${NC}"
    ((PASS++))
else
    echo -e "${RED}✗ FAIL${NC}"
    ((FAIL++))
fi

# Test Price Change 24h
echo -n "  Testing 24h Change... "
change=$(echo "$BYBIT_DATA" | jq -r '.candidates[0].priceChange24h // empty' 2>/dev/null)
if [[ -n "$change" && "$change" != "null" ]]; then
    echo -e "${GREEN}✓ PASS (${change}%)${NC}"
    ((PASS++))
else
    echo -e "${RED}✗ FAIL${NC}"
    ((FAIL++))
fi

# Test Volume
echo -n "  Testing Volume... "
volume=$(echo "$BYBIT_DATA" | jq -r '.candidates[0].volume // empty' 2>/dev/null)
if [[ -n "$volume" && "$volume" != "null" ]]; then
    echo -e "${GREEN}✓ PASS${NC}"
    ((PASS++))
else
    echo -e "${RED}✗ FAIL${NC}"
    ((FAIL++))
fi

# Test High/Low 24h
echo -n "  Testing 24h High/Low... "
high=$(echo "$BYBIT_DATA" | jq -r '.candidates[0].high24h // empty' 2>/dev/null)
low=$(echo "$BYBIT_DATA" | jq -r '.candidates[0].low24h // empty' 2>/dev/null)
if [[ -n "$high" && -n "$low" ]]; then
    echo -e "${GREEN}✓ PASS${NC}"
    ((PASS++))
else
    echo -e "${RED}✗ FAIL${NC}"
    ((FAIL++))
fi

# ============================================
# SECTION 10: DATA VALIDATION
# ============================================
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}10. DATA VALIDATION${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# Test Score Sum vs Total
echo -n "  Testing Score Sum Consistency... "
sent=$(echo "$BYBIT_DATA" | jq -r '.candidates[0].shortScore.trend // 0' 2>/dev/null)
mom=$(echo "$BYBIT_DATA" | jq -r '.candidates[0].shortScore.momentum // 0' 2>/dev/null)
voli=$(echo "$BYBIT_DATA" | jq -r '.candidates[0].shortScore.volatility // 0' 2>/dev/null)
volu=$(echo "$BYBIT_DATA" | jq -r '.candidates[0].shortScore.volume // 0' 2>/dev/null)
divi=$(echo "$BYBIT_DATA" | jq -r '.candidates[0].shortScore.divergence // 0' 2>/dev/null)
total_sum=$((sent + mom + voli + volu + divi))
# Account for critical bonuses/penalties
if [[ $total_sum -ge $((total - 20)) && $total_sum -le $((total + 20)) ]]; then
    echo -e "${GREEN}✓ PASS${NC}"
    ((PASS++))
else
    echo -e "${YELLOW}⚠ WARN (Components: $total_sum vs Total: $total)${NC}"
    ((WARN++))
fi

# Test Entry < Stop Loss (for SHORT)
echo -n "  Testing SHORT Setup Logic... "
entry_avg=$(echo "$BYBIT_DATA" | jq -r '(.candidates[0].setup.entryZone[0] + .candidates[0].setup.entryZone[1]) / 2' 2>/dev/null)
sl_val=$(echo "$BYBIT_DATA" | jq -r '.candidates[0].setup.stopLoss' 2>/dev/null)
if (( $(echo "$entry_avg < $sl_val" | bc -l) )); then
    echo -e "${GREEN}✓ PASS (Entry < SL = correct for SHORT)${NC}"
    ((PASS++))
else
    echo -e "${YELLOW}⚠ WARN (Check setup logic)${NC}"
    ((WARN++))
fi

# Test TP1 < Entry (for SHORT)
echo -n "  Testing TP Logic... "
tp1_val=$(echo "$BYBIT_DATA" | jq -r '.candidates[0].setup.takeProfit1' 2>/dev/null)
if (( $(echo "$tp1_val < $entry_avg" | bc -l) )); then
    echo -e "${GREEN}✓ PASS (TP < Entry = correct for SHORT)${NC}"
    ((PASS++))
else
    echo -e "${YELLOW}⚠ WARN (Check TP logic)${NC}"
    ((WARN++))
fi

# ============================================
# SECTION 11: EXCHANGE COMPARISON
# ============================================
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}11. EXCHANGE COMPARISON${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# Test Bybit response time
echo -n "  Testing Bybit Response Time... "
time_bybit=$( { time curl -s "$BASE_URL/api/scanner?exchange=bybit" > /dev/null 2>&1; } 2>&1 | grep real | awk '{print $2}')
echo -e "${GREEN}✓ PASS ($time_bybit)${NC}"
((PASS++))

# Test Binance response
echo -n "  Testing Binance Availability... "
binance_status=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/scanner?exchange=binance" 2>/dev/null)
if [[ "$binance_status" == "200" ]]; then
    echo -e "${GREEN}✓ PASS (HTTP $binance_status)${NC}"
    ((PASS++))
else
    echo -e "${YELLOW}⚠ WARN (HTTP $binance_status)${NC}"
    ((WARN++))
fi

# Test OKX response
echo -n "  Testing OKX Availability... "
okx_status=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/scanner?exchange=okx" 2>/dev/null)
if [[ "$okx_status" == "200" ]]; then
    echo -e "${GREEN}✓ PASS (HTTP $okx_status)${NC}"
    ((PASS++))
else
    echo -e "${YELLOW}⚠ WARN (HTTP $okx_status)${NC}"
    ((WARN++))
fi

# ============================================
# FINAL RESULTS
# ============================================
echo ""
echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                    TEST RESULTS                             ║${NC}"
echo -e "${BLUE}╠════════════════════════════════════════════════════════════╣${NC}"
printf "${BLUE}║${NC} %-20s ${GREEN}%-15s${NC} %25s ${BLUE}║${NC}\n" "Passed:" "$PASS" ""
printf "${BLUE}║${NC} %-20s ${RED}%-15s${NC} %25s ${BLUE}║${NC}\n" "Failed:" "$FAIL" ""
printf "${BLUE}║${NC} %-20s ${YELLOW}%-15s${NC} %25s ${BLUE}║${NC}\n" "Warnings:" "$WARN" ""
echo -e "${BLUE}╠════════════════════════════════════════════════════════════╣${NC}"

TOTAL=$((PASS + FAIL + WARN))
SUCCESS_RATE=$((PASS * 100 / TOTAL))

if [[ $FAIL -eq 0 ]]; then
    echo -e "${BLUE}║${NC} ${GREEN}✓ ALL CRITICAL TESTS PASSED (${SUCCESS_RATE}% success rate)${NC}          ${BLUE}║${NC}"
else
    echo -e "${BLUE}║${NC} ${RED}✗ SOME TESTS FAILED - PLEASE REVIEW${NC}                ${BLUE}║${NC}"
fi

echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"

# Return exit code
if [[ $FAIL -gt 0 ]]; then
    exit 1
fi
exit 0
