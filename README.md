# AxPesa - African Finance, Evolved

> Your Money, Multiple Options. Expand beyond USD.

License: MIT

---

## Overview

AxPesa is a fintech platform enabling Africans to access global currencies through an intuitive platform built on Conflux eSpace blockchain.

**The Problem:** Africans deserve more currency options than just USD. Current solutions limit users to single currencies, making international trade and savings difficult. Most people can't easily access Chinese Yuan (CNY) or diversify their holdings.

**Our Solution:** AxPesa expands your currency options by providing:

- **Buy/Sell** CNY stablecoins (AxCNH) with M-PESA, cards, or bank transfer
- **Send** to friends instantly via email, phone, or wallet address
- **Treasury** - AxPesa's settlement wallet for secure buy/sell operations (90% locked, 10% liquidity)
- **Earn** staking rewards on your holdings via Conflux DeFi protocols
- **For Merchants** - Accept payments with QR codes and payment links
- **Social Login** - No crypto knowledge required (Google, Twitter, Discord, GitHub, LinkedIn)
- **CFX Faucet** - New users get 0.1 CFX for gas fees automatically
- **Privacy** - Email/phone stored as hashed values with salt

--- |

## 👥 Team

| Name           | Role | GitHub         | Discord         |
| -------------- | ---- | -------------- | --------------- |
| Anthony Kimani | CTO  | @anthonykimani | tonykim8450     |
| Moses Epale    | COO  | @mosesepale    | mosesepale#1234 |

---

## 🚀 Problem Statement

### The Challenge

Africans deserve more currency options than just USD:

1. **Limited Options**: Most solutions only offer USD. Why should you be restricted to one currency?
2. **Currency Barriers**: International trade requires multiple currencies, but access is difficult
3. **Complexity**: Existing crypto solutions require technical knowledge and are hard to use
4. **Expensive**: Traditional forex and remittance services charge high fees

### Who's Affected

- **Everyone** - Anyone who wants to diversify their savings
- **Freelancers** - Receiving payments from international clients
- **Business owners** - Paying suppliers in different countries
- **Families** - Receiving remittances from abroad

### How Blockchain Helps

- **Stablecoins** provide easy access to multiple currencies without custody risks
- **Smart contracts** automate settlements and ensure transparency
- **Conflux eSpace** offers fast, low-cost transactions suitable for micropayments

---

## 💡 Solution

### Our Approach

AxPesa expands your currency options through a simple, accessible platform. No more being restricted to just USD.

### Core Features (All Live)

| Feature | Status | Description |
|---------|--------|-------------|
| **Social Login** | ✅ Live | Google, Twitter, Discord, GitHub, LinkedIn - no wallet needed |
| **Buy AxCNH** | ✅ Live | M-PESA, cards, bank transfer with instant settlement |
| **Sell AxCNH** | ✅ Live | Convert to KES, UGX, NGN via M-PESA |
| **Send AxCNH** | ✅ Live | P2P transfers via email/phone/address |
| **Dashboard** | ✅ Live | View balances, transactions, treasury holdings |
| **Staking** | ✅ Live | Earn rewards via Conflux DeFi (1% platform fee) |
| **Merchant Portal** | ✅ Live | QR codes and payment links for businesses |
| **CFX Faucet** | ✅ Live | New users receive 0.1 CFX for gas fees |
| **Treasury** | ✅ Live | Settlement wallet (90% locked, 10% liquidity pool) |
| **Multi-sig Security** | ✅ Live | 2-of-3 admin signatures for treasury operations |
| **Privacy** | ✅ Live | Email/phone hashed with salt |
| **Idempotency** | ✅ Live | Payment protection against duplicates |
| **Reconciliation** | ✅ Live | Cron job catches dropped webhooks every 30 mins |

### Go-to-Market Plan

1. **Phase 1**: Target Kenyan traders and M-PESA users
2. **Phase 2**: Expand to Uganda, Nigeria, Tanzania
3. **Phase 3**: Add more fiat on/off ramps and currencies

### Benefits

- **No crypto knowledge required** - Social login with Google/Twitter
- **Instant settlements** - Transactions confirmed in seconds
- **Low fees** - Built on Conflux eSpace for minimal costs
- **Secure** - Multi-sig vault with 2-of-3 admin signatures
- **Multiple options** - Beyond just USD

---

## ⚡ Conflux Integration

### How We Use Conflux

| Feature            | Implementation                                     |
| ------------------ | -------------------------------------------------- |
| **eSpace**         | Smart contracts deployed on Conflux eSpace Testnet |
| **Token Standard** | ERC-20 stablecoins (AxCNH for CNY)                 |
| **RPC Endpoint**   | `https://evmtestnet.confluxrpc.com`                |
| **Block Explorer** | `https://evmtestnet.confluxscan.io`                |
| **Chain ID**       | `0x47` (71 decimal)                                |

### Why Conflux?

- **Speed**: Sub-second transaction finality
- **Low Cost**: Minimal gas fees for micropayments
- **Compatibility**: EVM-compatible for easy Solidity development
- **Scalability**: Built for high throughput

---

## ✨ Features

### Core Features (All Live)

| Feature | Status | Description |
|---------|--------|-------------|
| **Social Login** | ✅ Live | Google, Twitter, Discord, GitHub, LinkedIn - no wallet needed |
| **Buy AxCNH** | ✅ Live | M-PESA, cards, bank transfer |
| **Sell AxCNH** | ✅ Live | Convert to KES, UGX, NGN |
| **Send AxCNH** | ✅ Live | P2P transfers via email/phone/address |
| **Dashboard** | ✅ Live | View balances and transactions |
| **Staking** | ✅ Live | Earn rewards via Conflux DeFi (1% platform fee) |
| **Merchant Portal** | ✅ Live | QR codes and payment links for businesses |
| **Mobile App** | ✅ Live | React Native iOS/Android apps |

> ⚠️ **Important Notes:**
> - **Staking**: Yield is generated by third-party Conflux DeFi protocols. AxPesa charges a 1% platform fee. Users should understand the risks of DeFi protocols.
> - **CFX for Gas**: Users need a small amount of CFX for transaction fees. New users receive CFX from our faucet.

### Platform Compatibility

| Platform             | Status  | Description             |
| -------------------- | ------- | ----------------------- |
| **Web**              | ✅ Live | Next.js web application |
| **Mobile (Android)** | ✅ Live | React Native with Expo  |
| **Mobile (iOS)**     | ✅ Live | React Native            |

### Smart Contracts (Infrastructure)

| Feature | Status | Description |
|---------|--------|-------------|
| **AxCNH Token** | ✅ Deployed | External ERC-20 stablecoin pegged to CNY (like USDT) |
| **AxPesaTreasury** | ✅ Deployed | AxPesa's settlement wallet for buy/sell operations |
| **Multi-sig** | ✅ Implemented | 2-of-3 admin signatures for treasury security |

### Future Enhancements (Roadmap)

- **Gasless Transactions** - SponsorPaymaster for zero-fee user experience
- **Cross-Space Bridge** - Connect with Conflux Core Space for staking integration
- **More Currencies** - Add more stablecoin options
- **Expanded Fiat** - Add more African currencies

---

## 🛠️ Technology Stack

### Frontend

| Layer     | Technology              |
| --------- | ----------------------- |
| Framework | Next.js 14              |
| Language  | TypeScript              |
| Styling   | Tailwind CSS            |
| State     | Zustand                 |
| Auth      | Web3Auth (Social Login) |
| Web3      | viem, @web3auth/modal   |
| Animation | Framer Motion           |
| Icons     | Lucide React            |

### Backend

| Layer     | Technology                  |
| --------- | --------------------------- |
| Runtime   | Node.js                     |
| Framework | Express.js                  |
| Language  | TypeScript                  |
| Database  | PostgreSQL (Prisma ORM)     |
| Auth      | JWT + Web3Auth verification |
| Payments  | Flutterwave (M-PESA API)    |

### Blockchain

| Layer     | Technology             |
| --------- | ---------------------- |
| Network   | Conflux eSpace         |
| Contracts | Solidity 0.8.28        |
| Framework | Hardhat                |
| Testing   | Mocha + Chai           |
| Libraries | OpenZeppelin Contracts |

### Infrastructure

| Layer   | Technology                                  |
| ------- | ------------------------------------------- |
| Hosting | Vercel (Frontend), Railway/Render (Backend) |
| Mobile  | React Native + Expo                         |

---

## 🏗️ Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│                           USER INTERFACE                                │
│                    (Next.js Web + React Native Mobile)                  │
│         Social Login │ Buy/Sell │ Send │ Dashboard │ Staking          │
└─────────────────────────────┬──────────────────────────────────────────┘
                              │
                              ▼
┌────────────────────────────────────────────────────────────────────────┐
│                          BACKEND API                                    │
│                  (Express + Prisma + TypeScript)                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────────────────────┐ │
│  │   Auth   │  │  Onramp  │  │ Offramp  │  │     Transfer Service    │ │
│  │ Web3Auth │  │ Flutter- │  │ Flutter- │  │  P2P wallet transfers    │ │
│  │   JWT    │  │  wave    │  │  wave    │  │  Email/Phone lookup      │ │
│  └──────────┘  └──────────┘  └──────────┘  └─────────────────────────┘ │
│  ┌──────────┐  ┌──────────┐  ┌─────────────────────────────────────────┐ │
│  │  Staking │  │ Merchant │  │           Merchant Portal                 │ │
│  │ Rewards  │  │  QR/URL  │  │        QR Codes & Payment Links          │ │
│  └──────────┘  └──────────┘  └─────────────────────────────────────────┘ │
└─────────────────────────────┬──────────────────────────────────────────┘
                              │
              ┌───────────────┴───────────────┐
              ▼                               ▼
┌─────────────────────────┐       ┌─────────────────────────┐
│    FLUTTERWAVE API      │       │   CONFLUX eSPACE        │
│   (M-PESA Integration)   │       │  (Smart Contracts)      │
│  Payment Processing      │       │  ┌───────────────────┐  │
│  KES/UGX/NGN Settlements│       │  │     AxCNH Token    │  │
└─────────────────────────┘       │  │  (External Stable) │  │
                                  │  ├───────────────────┤  │
                                  │  │   AxPesaVault     │  │
                                  │  │  (90/10 Liquidity)│  │
                                  │  └───────────────────┘  │
                                  └─────────────────────────┘
```

### Data Flow

**Buy Flow (On-ramp):**

1. User selects token and payment method
2. Backend creates Flutterwave payment with idempotency key
3. User completes M-PESA/Card payment
4. Backend receives webhook and **verifies payment with Flutterwave API**
5. AxPesaTreasury sends AxCNH to user's wallet
6. Reconciliation job runs every 30 mins to catch dropped webhooks

**Sell Flow (Off-ramp):**

1. User transfers AxCNH to AxPesaTreasury (on-chain)
2. Backend monitors for transfer confirmation
3. Backend initiates Flutterwave payout (M-PESA)
4. User receives KES directly to mobile money

**Transfer Flow (P2P):**

1. User enters recipient (email/phone/address)
2. Backend looks up recipient's hashed wallet
3. Backend executes on-chain transfer
4. Both parties see transaction confirmed

---

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

| Requirement | Version | Notes                 |
| ----------- | ------- | --------------------- |
| Node.js     | 18.0.0+ | LTS recommended       |
| npm         | 9.0.0+  | Comes with Node       |
| Git         | 2.0+    | For cloning           |
| PostgreSQL  | 14+     | Or use SQLite for dev |

---

## 🚀 Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/axpesa.git
cd axpesa
```

### 2. Install Dependencies

```bash
# Install all workspace dependencies
npm install
```

### 3. Environment Configuration

```bash
# Copy example files
cp apps/web/.env.example apps/web/.env.local
cp apps/backend/.env.example apps/backend/.env
```

#### Frontend (.env.local)

```env
# Web3Auth
NEXT_PUBLIC_WEB3AUTH_CLIENT_ID=your_client_id

# Conflux eSpace Testnet
NEXT_PUBLIC_CHAIN_ID=0x47
NEXT_PUBLIC_RPC_URL=https://evmtestnet.confluxrpc.com

# Contract Addresses
NEXT_PUBLIC_AXCNH_CONTRACT_ADDRESS=0xD41Ca697EEF60fE35f9e92441A180915D6465516
NEXT_PUBLIC_AXCNH_VAULT_ADDRESS=0xCFC0aA7Afab6d6a617D6CB5213bf9f206604bcF6

# API
NEXT_PUBLIC_API_URL=http://localhost:8080
```

#### Backend (.env)

```env
# Flutterwave
FLUTTERWAVE_PUBLIC_KEY=FLWPUBK-xxx
FLUTTERWAVE_SECRET_KEY=FLWSECK-xxx
FLUTTERWAVE_WEBHOOK_SECRET=xxx

# Conflux
CONFLUX_RPC_URL=https://evmtestnet.confluxrpc.com
CONFLUX_CHAIN_ID=71
HOT_WALLET_PRIVATE_KEY=0x...

# Web3Auth
WEB3AUTH_CLIENT_ID=your_client_id
WEB3AUTH_CLIENT_SECRET=your_secret

# Database
DATABASE_URL="file:./dev.db"

# JWT
JWT_SECRET=your-super-secret-jwt-key
```

### 4. Database Setup

```bash
cd apps/backend
npm run db:generate
npm run db:push
```

### 5. Start Development Servers

```bash
# Start all services (frontend + backend)
npm run dev

# Or start individually
npm run dev:web    # Frontend at http://localhost:3000
npm run dev:backend # Backend at http://localhost:8080
```

---

## 🧪 Testing

### Run Smart Contract Tests

```bash
npm run test:contracts
```

### Test Coverage

The test suite includes:

**AxCNH Token Tests:**

- Deployment and initialization
- Minting by owner and authorized minters
- Access control

**AxPesaVault Tests:**

- Deposit (90% locked, 10% liquidity split)
- Withdraw (owner only)
- Multi-sig emergency withdrawals
- Vault statistics tracking

---

## 📱 Usage

### Getting Started

#### 1. Login

- Click **Login** button
- Choose social login (Google, Twitter, etc.)
- No wallet extension needed - wallet is created automatically

#### 2. Buy AxCNH (On-ramp)

1. Go to **Buy** page
2. Select AxCNH as the token
3. Enter amount in KES
4. Choose payment method (M-PESA recommended)
5. Complete payment
6. Receive AxCNH in wallet

#### 3. Sell AxCNH (Off-ramp)

1. Go to **Sell** page
2. Enter AxCNH amount to sell
3. Choose payout method (M-PESA)
4. Enter phone number
5. Receive KES in minutes

#### 4. Send AxCNH (P2P Transfer)

1. Go to **Send** page
2. Enter recipient:
   - Email address (if AxPesa user)
   - Phone number (if AxPesa user)
   - Wallet address (0x... or cfx:...)
3. Enter amount
4. Add optional note
5. Click **Send**
6. Recipient receives instantly

#### 5. Stake & Earn

1. Go to **Staking** page
2. Choose a staking plan (flexible, 30 days, 90 days)
3. Stake your AxCNH
4. Earn rewards over time

---

## 🎬 Demo

### Live Demo

**URL**: (Coming soon after deployment)

### Screenshots

#### Landing Page

- Hero: "African Finance, Evolved"
- "Your Money, Multiple Options"
- Purple/pink gradient theme

#### Dashboard

- View all balances
- Quick actions (Buy, Sell, Send)
- Transaction history

#### Transfer Page

- Send by email, phone, or address
- Transaction history

---

## 📄 Smart Contracts

### Important Note on Tokens

AxCNH is an **external ERC-20 stablecoin** (like USDT or USDC), not a token we created or control. We use it as the CNY stablecoin for our platform. For **testnet demonstration purposes**, we deployed a test version. In production, AxPesa would integrate with the actual AxCNH token.

### Deployed Contracts

#### Testnet (Conflux eSpace)

| Contract    | Address                                      | Explorer                                                                                     |
| ----------- | -------------------------------------------- | -------------------------------------------------------------------------------------------- |
| AxCNH Token | `0xD41Ca697EEF60fE35f9e92441A180915D6465516` | [View](https://evmtestnet.confluxscan.io/address/0xD41Ca697EEF60fE35f9e92441A180915D6465516) |
| AxPesaVault | `0xCFC0aA7Afab6d6a617D6CB5213bf9f206604bcF6` | [View](https://evmtestnet.confluxscan.io/address/0xCFC0aA7Afab6d6a617D6CB5213bf9f206604bcF6) |

### AxPesaVault Interface

```solidity
interface IAxPesaVault {
    function deposit(uint256 amount) external;
    function withdraw(address user, uint256 amount) external;
    function getUserInfo(address user) external view returns (
        uint256 totalDeposit,
        uint256 lockedAmount,
        uint256 withdrawable
    );
    function getVaultStats() external view returns (
        uint256 totalDeposited,
        uint256 totalLocked,
        uint256 liquidityPool,
        uint256 vaultBalance
    );
    event Deposited(address indexed user, uint256 amount, uint256 locked, uint256 toLiquidity);
    event Withdrawn(address indexed user, uint256 amount);
}
```

---

## 🔧 API Documentation

### Base URL

```
http://localhost:8080/api
```

### Authentication

#### Social Login (Web3Auth)

```
POST /auth/web3auth/verify
```

#### Email Login

```
POST /auth/login
POST /auth/register
```

### On-ramp (Buy)

```
GET  /onramp/rates
POST /onramp/initiate
```

### Off-ramp (Sell)

```
GET  /offramp/rate/:currency
POST /offramp/initiate
```

### Transfer (P2P)

```
POST /transfer          # Send tokens
GET  /transfer/history # Transfer history
GET  /transfer/balance # Check balance
```

### Staking

```
POST /staking/stake     # Stake tokens
GET  /staking/positions # Get staking positions
POST /staking/claim    # Claim rewards
```

### Merchant

```
POST /merchant/payment-link      # Create payment link
GET  /merchant/payment-links    # List payment links
GET  /merchant/qr/:linkCode     # Get QR code
GET  /merchant/dashboard        # Dashboard stats
```

### Faucet (Testnet Only)

```
POST /faucet/claim     # Claim test tokens
GET  /faucet/status/:address # Check status
```

---

## 🔒 Security

### Smart Contract Security

| Measure                | Implementation                   |
| ---------------------- | -------------------------------- |
| **Access Control**     | OpenZeppelin Ownable, Roles      |
| **Reentrancy**         | OpenZeppelin SafeERC20           |
| **Integer Overflow**   | Solidity 0.8.28 built-in checks  |
| **Multi-sig**          | 2-of-3 for emergency withdrawals |
| **Vault Architecture** | 90% locked, 10% liquidity        |

### Application Security

| Measure              | Implementation              |
| -------------------- | --------------------------- |
| **Authentication**   | JWT + Web3Auth verification |
| **Input Validation** | Zod schema validation       |
| **Rate Limiting**    | express-rate-limit          |
| **CORS**             | Whitelisted origins only    |
| **Helmet**           | Security headers            |
| **Privacy**         | Email/phone hashed with salt |
| **Idempotency**      | Payment keys prevent duplicates |
| **Reconciliation**  | Cron job catches dropped webhooks |

---

## 🚧 Known Issues & Roadmap

### Current Status

1. **Testnet Only**: All contracts and integrations are on Conflux eSpace Testnet
2. **Limited Fiat**: Only KES (Kenyan Shilling) fully integrated
3. **AxCNH Test Token**: Using test token for demonstration

### What's Working

- ✅ Smart contract tests (17 passing)
- ✅ Backend API with all endpoints
- ✅ Frontend with social login
- ✅ Flutterwave integration for M-PESA
- ✅ CFX faucet for new users
- ✅ Idempotency + reconciliation for payments

### Roadmap

- [ ] Mainnet deployment (with grant funding)
- [ ] Add UGX, NGN support
- [ ] Cross-space Conflux features
- [ ] More stablecoin options

---

## 🤝 Contributing

We welcome contributions! Please see our Contributing Guidelines for details.

### Development Process

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

### Built With

- [Conflux Network](https://confluxnetwork.org) - Blockchain infrastructure
- [Web3Auth](https://web3auth.io) - Social login authentication
- [Flutterwave](https://flutterwave.com) - M-PESA and African payments
- [OpenZeppelin](https://openzeppelin.com) - Smart contract libraries
- [Hardhat](https://hardhat.org) - Ethereum development environment

---

## 📞 Contact & Support

### Team

| Name           | Role | GitHub         | Discord         |
| -------------- | ---- | -------------- | --------------- |
| Anthony Kimani | CTO  | @anthonykimani | tonykim8450     |
| Moses Epale    | COO  | @mosesepale    | mosesepale#1234 |

### Project Links

- **GitHub**: https://github.com/your-username/axpesa
- **Demo**: (Coming soon)

---

Built with ❤️ for Global Hackfest 2026

**African Finance, Evolved.**
