#!/bin/bash

# AxPesa API Test Script
# Usage: bash tests/test-manual.sh

BASE_URL="http://localhost:8080/api"

echo "=========================================="
echo "  AxPesa API Manual Test Script"
echo "=========================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Function to test endpoint
test_endpoint() {
    echo -e "${YELLOW}Testing: $1${NC}"
    echo "URL: $2"
    echo "Method: $3"
    if [ "$3" = "GET" ]; then
        RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" "$2")
    else
        RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X "$3" -H "Content-Type: application/json" -d "$4" "$2")
    fi
    HTTP_CODE=$(echo "$RESPONSE" | grep HTTP_CODE | cut -d: -f2)
    BODY=$(echo "$RESPONSE" | sed '/HTTP_CODE/d')
    
    if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "201" ]; then
        echo -e "${GREEN}✅ PASS: $HTTP_CODE${NC}"
    else
        echo -e "${RED}❌ FAIL: $HTTP_CODE${NC}"
    fi
    echo "Response: $BODY"
    echo ""
}

echo "=========================================="
echo "  HEALTH CHECKS"
echo "=========================================="
echo ""
test_endpoint "Health Check" "$BASE_URL/../health" "GET" ""

echo "=========================================="
echo "  AUTH TESTS"
echo "=========================================="
echo ""

# Test 1: Register
test_endpoint "Register Merchant" "$BASE_URL/auth/register" "POST" '{
    "email": "test'"$(date +%s)"'@axpesa.test",
    "password": "testpassword123",
    "businessName": "Test Business",
    "businessType": "retail",
    "phoneNumber": "+254700000000",
    "walletAddress": "0x742d35Cc6634C0532925a3b84BC405c5C3b8dC7F1"
}'

# Test 2: Login (will fail if email not registered)
test_endpoint "Login" "$BASE_URL/auth/login" "POST" '{
    "email": "nonexistent@test.com",
    "password": "testpassword123"
}'

echo "=========================================="
echo "  ONRAMP TESTS"
echo "=========================================="
echo ""

# Test 3: Get Rates
test_endpoint "Get Rates" "$BASE_URL/onramp/rates" "GET" ""

# Test 4: Get KES Rate
test_endpoint "Get KES Rate" "$BASE_URL/onramp/rate/KES" "GET" ""

# Test 5: Initiate Onramp
test_endpoint "Initiate Onramp" "$BASE_URL/onramp/initiate" "POST" '{
    "fiatAmount": 1000,
    "fiatCurrency": "KES",
    "paymentMethod": "mpesa",
    "walletAddress": "0x742d35Cc6634C0532925a3b84BC405c5C3b8dC7F1",
    "phoneNumber": "+254700000000",
    "email": "test@axpesa.test"
}'

echo "=========================================="
echo "  OFFRAMP TESTS"
echo "=========================================="
echo ""

# Test 6: Get Offramp Rate
test_endpoint "Get Offramp Rate" "$BASE_URL/offramp/rate/KES" "GET" ""

# Test 7: Initiate Offramp
test_endpoint "Initiate Offramp" "$BASE_URL/offramp/initiate" "POST" '{
    "axcnhAmount": 10,
    "fiatCurrency": "KES",
    "phoneNumber": "+254700000000",
    "walletAddress": "0x742d35Cc6634C0532925a3b84BC405c5C3b8dC7F1"
}'

echo "=========================================="
echo "  WALLET TESTS"
echo "=========================================="
echo ""

# Test 8: Get Balance
test_endpoint "Get Balance" "$BASE_URL/transfer/balance?address=0x742d35Cc6634C0532925a3b84BC405c5C3b8dC7F1" "GET" ""

echo "=========================================="
echo "  FAUCET TESTS"
echo "=========================================="
echo ""

# Test 9: Get Faucet Status
test_endpoint "Faucet Status" "$BASE_URL/faucet/status/0x742d35Cc6634C0532925a3b84BC405c5C3b8dC7F1" "GET" ""

echo "=========================================="
echo "  Tests Complete!"
echo "=========================================="