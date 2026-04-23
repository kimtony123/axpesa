#!/bin/bash
# Test script for AxPesa API endpoints

BASE_URL="http://127.0.0.1:8080"

echo "=============================================="
echo "AxPesa API Route Tests"
echo "=============================================="
echo ""

# Test 1: Health check
echo "1. Testing GET /api/health..."
curl -s "$BASE_URL/api/health"
echo ""
echo ""

# Test 2: User Register - should work with wallet data
echo "2. Testing POST /api/auth/user-register (should work)..."
curl -s -X POST "$BASE_URL/api/auth/user-register" \
  -H "Content-Type: application/json" \
  -d '{"walletAddress":"0xtest123","name":"Test User","phoneNumber":"+254700000000","signature":"0xabc"}'
echo ""
echo ""

# Test 3: Merchant Register - should work with merchant data
echo "3. Testing POST /api/auth/merchant-register (should work)..."
curl -s -X POST "$BASE_URL/api/auth/merchant-register" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","businessName":"Test Business","businessType":"retail","phoneNumber":"+254700000000","walletAddress":"0xtest123"}'
echo ""
echo ""

# Test 4: Old /register - should return merchant schema error (NOT user schema)
echo "4. Testing POST /api/auth/register (should fail - expects merchant data)..."
curl -s -X POST "$BASE_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"walletAddress":"0xtest","name":"Test","phoneNumber":"+254700000000","signature":"0xabc"}'
echo ""
echo ""

echo "=============================================="
echo "Tests Complete!"
echo "=============================================="