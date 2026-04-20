# AxPesa API Testing Guide

## Overview

This directory contains tests for the AxPesa Backend API.

## Test Files

| File | Description |
|------|-------------|
| `auth.test.ts` | Authentication API tests |
| `onramp.test.ts` | Buy AxCNH (on-ramp) tests |
| `offramp.test.ts` | Sell AxCNH (off-ramp) tests |
| `faucet.test.ts` | Faucet (CFX/AxCNH) tests |
| `transfer.test.ts` | P2P transfer tests |
| `e2e.test.ts` | End-to-end flow tests |
| `run-tests.sh` | Sequential API test script |

## Quick Start

### Option 1: Shell Script (Recommended)

```bash
# 1. Start the backend
cd apps/backend
npm run dev

# 2. In another terminal, run the tests
bash apps/backend/tests/run-tests.sh
```

### Option 2: Jest Tests

```bash
cd apps/backend
npm run test:api
```

## Manual Testing

### Start Backend

```bash
cd apps/backend
npm run dev
```

Backend runs at: `http://localhost:8080`

### Test Endpoints

| Endpoint | Method | Test Command |
|----------|--------|-------------|
| Health | GET | `curl http://localhost:8080/api/health` |
| Register | POST | `curl -X POST http://localhost:8080/api/auth/register -H "Content-Type: application/json" -d '{...}'` |
| Login | POST | `curl -X POST http://localhost:8080/api/auth/login -H "Content-Type: application/json" -d '{...}'` |
| Get Rates | GET | `curl http://localhost:8080/api/onramp/rates` |
| Initiate Buy | POST | `curl -X POST http://localhost:8080/api/onramp/initiate -H "Content-Type: application/json" -d '{...}'` |
| Initiate Sell | POST | `curl -X POST http://localhost:8080/api/offramp/initiate -H "Content-Type: application/json" -d '{...}'` |
| Get Balance | GET | `curl "http://localhost:8080/api/transfer/balance?address=0x..."` |
| Faucet Status | GET | `curl http://localhost:8080/api/faucet/status/0x...` |

## Test Data

### Test Wallet
- Address: `0x742d35Cc6634C0532925a3b84BC405c5C3b8dC7F1`
- Private Key: (from .env HOT_WALLET_PRIVATE_KEY)

### Test Environment Variables
- Conflux RPC: `https://evmtestnet.confluxrpc.com`
- Chain ID: `71`
- Database: `file:./prisma/dev.db`

## Screenshots for Documentation

Take screenshots at these stages:

1. **Health Check**
   - `GET /api/health`

2. **Auth Flow**
   - Register a test merchant
   - Login with credentials

3. **Buy AxCNH Flow**
   - `GET /api/onramp/rates` - Shows exchange rates
   - `POST /api/onramp/initiate` - Creates M-PESA payment

4. **Sell AxCNH Flow**
   - `GET /api/offramp/rate/KES` - Shows sell rate
   - `POST /api/offramp/initiate` - Initiates sell

5. **Wallet**
   - `GET /api/transfer/balance` - Shows AxCNH balance

6. **Faucet**
   - `GET /api/faucet/status/:address` - Shows claim status

## Troubleshooting

### Backend won't start
```bash
# Check environment variables
cat apps/backend/.env

# Verify database exists
ls -la apps/backend/prisma/dev.db
```

### Tests fail
- Ensure backend is running on port 8080
- Check database is accessible
- Verify Conflux testnet RPC is working

### CFX Faucet fails
- Ensure testnet wallet has CFX for gas
- Check Conflux testnet connection

## Notes

- Tests run against Conflux **testnet** (not mainnet)
- Flutterwave uses sandbox/test mode
- No real money is involved
