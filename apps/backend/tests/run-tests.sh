#!/bin/bash

# AxPesa API Sequential Test Runner
# This script runs tests in order: Health → Auth → Onramp → Offramp → Wallet → Faucet

set -e

BASE_URL="${API_URL:-http://localhost:8080/api}"

echo "========================================"
echo "  AxPesa API Sequential Test"
echo "========================================"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m'

# Test counter
PASSED=0
FAILED=0

# Test function
run_test() {
    local name="$1"
    local url="$2"
    local method="$3"
    local data="$4"
    local expected="$5"
    
    echo -e "${CYAN}📝 $name${NC}"
    echo "   $method $url"
    
    if [ "$method" = "GET" ]; then
        HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$url" 2>/dev/null || echo "000")
    else
        HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X "$method" -H "Content-Type: application/json" -d "$data" "$url" 2>/dev/null || echo "000")
    fi
    
    if [ "$HTTP_CODE" = "$expected" ]; then
        echo -e "   ${GREEN}✅ PASS ($HTTP_CODE)${NC}"
        ((PASSED++))
    else
        echo -e "   ${RED}❌ FAIL (expected $expected, got $HTTP_CODE)${NC}"
        ((FAILED++))
    fi
    echo ""
}

echo "========================================"
echo "  PHASE 1: HEALTH CHECKS"
echo "========================================"
echo ""

run_test "Backend Health" "http://localhost:8080/api/health" "GET" "" "200"

echo "========================================"
echo "  PHASE 2: AUTH TESTS"
echo "========================================"
echo ""

# Register (will fail with duplicate but that's OK)
echo "   Testing registration..."
TEST_EMAIL="test_$(date +%s)@axpesa.test"
run_test "Register" "$BASE_URL/auth/register" "POST" "{\"email\":\"$TEST_EMAIL\",\"password\":\"testpass123\",\"businessName\":\"Test\",\"businessType\":\"retail\",\"phoneNumber\":\"+254700000000\",\"walletAddress\":\"0x742d35Cc6634C0532925a3b84BC405c5C3b8dC7F1\"}" "201"

# Login with invalid credentials
run_test "Login (invalid)" "$BASE_URL/auth/login" "POST" "{\"email\":\"nonexistent@test.com\",\"password\":\"wrong\"}" "401"

echo "========================================"
echo "  PHASE 3: ONRAMP TESTS"
echo "========================================"
echo ""

run_test "Get Rates" "$BASE_URL/onramp/rates" "GET" "" "200"
run_test "Get KES Rate" "$BASE_URL/onramp/rate/KES" "GET" "" "200"
run_test "Initiate Onramp" "$BASE_URL/onramp/initiate" "POST" "{\"fiatAmount\":1000,\"fiatCurrency\":\"KES\",\"paymentMethod\":\"mpesa\",\"walletAddress\":\"0x742d35Cc6634C0532925a3b84BC405c5C3b8dC7F1\",\"phoneNumber\":\"+254700000000\"}" "200"

echo "========================================"
echo "  PHASE 4: OFFRAMP TESTS"
echo "========================================"
echo ""

run_test "Get Offramp KES Rate" "$BASE_URL/offramp/rate/KES" "GET" "" "200"
run_test "Initiate Offramp" "$BASE_URL/offramp/initiate" "POST" "{\"axcnhAmount\":10,\"fiatCurrency\":\"KES\",\"phoneNumber\":\"+254700000000\",\"walletAddress\":\"0x742d35Cc6634C0532925a3b84BC405c5C3b8dC7F1\"}" "200"

echo "========================================"
echo "  PHASE 5: WALLET TESTS"
echo "========================================"
echo ""

run_test "Get Balance" "$BASE_URL/transfer/balance?address=0x742d35Cc6634C0532925a3b84BC405c5C3b8dC7F1" "GET" "" "200"
run_test "Transfer History" "$BASE_URL/transfer/history?address=0x742d35Cc6634C0532925a3b84BC405c5C3b8dC7F1" "GET" "" "200"

echo "========================================"
echo "  PHASE 6: FAUCET TESTS"
echo "========================================"
echo ""

run_test "Faucet Status" "$BASE_URL/faucet/status/0x742d35Cc6634C0532925a3b84BC405c5C3b8dC7F1" "GET" "" "200"

echo "========================================"
echo "  RESULTS"
echo "========================================"
echo ""
echo -e "Passed: ${GREEN}$PASSED${NC}"
echo -e "Failed: ${RED}$FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 All tests passed!${NC}"
    exit 0
else
    echo -e "${YELLOW}⚠️  Some tests failed${NC}"
    exit 1
fi