# 🇰🇪 AxPesa

> Seamless fiat-to-stablecoin onboarding for Conflux Network — cards, M-PESA, and mobile money

AxPesa is a frictionless onramp that lets users buy AxCNH (offshore Chinese yuan stablecoin on Conflux) using their preferred payment method — credit/debit cards, M-PESA, Airtel Money, or bank transfers. Available as a Next.js website and React Native mobile app.

---

## 📋 Table of Contents

- [Problem Statement](#problem-statement)
- [Features](#features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Quick Start](#quick-start)
- [Configuration](#configuration)
- [Payment Flow](#payment-flow)
- [API Reference](#api-reference)
- [Next.js Frontend](#nextjs-frontend)
- [React Native Mobile App](#react-native-mobile-app)
- [Conflux Integration](#conflux-integration)
- [Security](#security)
- [Testing](#testing)
- [Deployment](#deployment)
- [Demo](#demo)
- [License](#license)

---

## 🎯 Problem Statement

African and emerging market users face significant barriers to accessing stablecoins:

| Barrier             | Description                                               |
| ------------------- | --------------------------------------------------------- |
| **No bank cards**   | 60%+ of Africans lack credit/debit cards                  |
| **High fees**       | Traditional onramps charge 5-10% + hidden spreads         |
| **Slow settlement** | Bank transfers take 2-5 days                              |
| **Complex UX**      | Wallet creation, seed phrases, gas fees confuse new users |
| **Limited options** | Most onramps don't support mobile money                   |

**AxPesa solves this** by integrating Flutterwave — a single API that supports 15+ payment methods across Africa and emerging markets.

---

## ✨ Features

### Core Features (MVP)

| Feature                  | Status | Description                               |
| ------------------------ | ------ | ----------------------------------------- |
| **Card payments**        | ✅     | Visa, Mastercard, Amex (global)           |
| **M-PESA**               | ✅     | Kenya, Tanzania, Uganda, Rwanda, DRC      |
| **Airtel Money**         | ✅     | Kenya, Uganda, Malawi, Zambia, Chad       |
| **Bank transfers**       | ✅     | Direct bank debit (NG, KE, UG, ZA, GH)    |
| **Mobile money**         | ✅     | MTN MoMo, Orange Money, Vodafone Cash     |
| **Auto-wallet creation** | ✅     | Conflux wallet generated if user has none |
| **AxCNH delivery**       | ✅     | Stablecoin sent within 60 seconds         |
| **Transaction tracking** | ✅     | Real-time status via webhook              |
| **SMS notifications**    | ✅     | Payment confirmation via SMS              |
| **Next.js website**      | ✅     | Fast, SEO-friendly web app                |
| **React Native APK**     | ✅     | Mobile app for Android/iOS                |

### Post-MVP Features

| Feature                     | Status                               |
| --------------------------- | ------------------------------------ |
| **Off-ramp (AxCNH → Fiat)** | 🚧 Planned                           |
| **Recurring purchases**     | 🚧 Planned                           |
| **B2B API**                 | 🚧 Planned                           |
| **Multi-language support**  | 🚧 Planned (Swahili, French, Arabic) |
| **Biometric auth**          | 🚧 Planned                           |
| **Price alerts**            | 🚧 Planned                           |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         USER FLOW                                   │
│                                                                      │
│  1. User visits axpesa.com (Next.js) or opens mobile app (RN)       │
│  2. Enters Conflux wallet address (or auto-create)                  │
│  3. Selects amount (e.g., 1000 KES)                                 │
│  4. Chooses payment method (M-PESA / Card / Bank)                   │
│  5. Completes payment on Flutterwave hosted page                    │
│  6. Receives AxCNH in wallet within 60 seconds                      │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                        TECHNICAL ARCHITECTURE                        │
│                                                                      │
│  ┌─────────────────┐     ┌─────────────────┐                       │
│  │  Next.js Web    │     │  React Native   │                       │
│  │  (Vercel/Railway)│     │  Mobile App     │                       │
│  └────────┬────────┘     └────────┬────────┘                       │
│           │                        │                                 │
│           └────────────┬───────────┘                                 │
│                        ▼                                             │
│           ┌─────────────────────────┐                               │
│           │   Node.js Backend       │                               │
│           │   (Express/NestJS)      │                               │
│           │   • API Routes          │                               │
│           │   • Webhook handler     │                               │
│           │   • Rate limiting       │                               │
│           │   • Transaction queue   │                               │
│           └────────────┬────────────┘                               │
│                        │                                             │
│         ┌──────────────┼──────────────┐                             │
│         ▼              ▼              ▼                             │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐           │
│  │ PostgreSQL  │ │    Redis    │ │   Flutterwave API   │           │
│  │ (Tx store)  │ │ (Queue/     │ │  • Card Processing  │           │
│  │ (User data) │ │  Rate limit)│ │  • M-PESA Collection│           │
│  └─────────────┘ └─────────────┘ │  • Bank Transfers   │           │
│                                   │  • Mobile Money     │           │
│                                   └──────────┬──────────┘           │
│                                              │                       │
│                                              ▼                       │
│                                   ┌─────────────────────┐           │
│                                   │  Payment Webhook    │           │
│                                   │  → Backend /webhook │           │
│                                   └──────────┬──────────┘           │
│                                              │                       │
│                                              ▼                       │
│                                   ┌─────────────────────┐           │
│                                   │   Conflux Network   │           │
│                                   │  • Swappi DEX       │           │
│                                   │  • AxCNH transfer   │           │
│                                   └─────────────────────┘           │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 💻 Tech Stack

| Layer                | Technology                                      |
| -------------------- | ----------------------------------------------- |
| **Frontend (Web)**   | Next.js 14 + TypeScript + TailwindCSS           |
| **Mobile App**       | React Native 0.72+ + Expo                       |
| **Backend**          | Node.js + Express.js (or NestJS)                |
| **Payments**         | Flutterwave Node.js SDK                         |
| **Blockchain**       | ethers.js v6 + Conflux eSpace                   |
| **Database**         | PostgreSQL + Prisma ORM                         |
| **Cache/Queue**      | Redis + BullMQ                                  |
| **SMS**              | Twilio / Africa's Talking                       |
| **Validation**       | Zod + React Hook Form                           |
| **State Management** | Zustand (web) + Redux Toolkit (mobile)          |
| **Deployment**       | Vercel (web) + Railway (backend) + EAS (mobile) |

---

## 📁 Project Structure

```
axpesa/
├── apps/
│   ├── web/                          # Next.js website
│   │   ├── src/
│   │   │   ├── app/                  # App router
│   │   │   │   ├── page.tsx          # Landing page
│   │   │   │   ├── buy/
│   │   │   │   │   └── page.tsx      # Buy flow
│   │   │   │   ├── status/
│   │   │   │   │   └── [txId]/
│   │   │   │   │       └── page.tsx  # Transaction status
│   │   │   │   └── api/
│   │   │   │       └── webhook/      # Webhook endpoint
│   │   │   ├── components/
│   │   │   │   ├── onramp/
│   │   │   │   │   ├── AmountInput.tsx
│   │   │   │   │   ├── WalletInput.tsx
│   │   │   │   │   ├── PaymentMethods.tsx
│   │   │   │   │   └── RateDisplay.tsx
│   │   │   │   ├── layout/
│   │   │   │   │   ├── Header.tsx
│   │   │   │   │   └── Footer.tsx
│   │   │   │   └── ui/               # shadcn/ui components
│   │   │   ├── hooks/
│   │   │   │   ├── usePayment.ts
│   │   │   │   └── useRate.ts
│   │   │   ├── lib/
│   │   │   │   ├── conflux.ts
│   │   │   │   └── flutterwave.ts
│   │   │   └── types/
│   │   ├── public/
│   │   ├── package.json
│   │   └── next.config.js
│   │
│   ├── mobile/                       # React Native app
│   │   ├── src/
│   │   │   ├── screens/
│   │   │   │   ├── HomeScreen.tsx
│   │   │   │   ├── BuyScreen.tsx
│   │   │   │   ├── StatusScreen.tsx
│   │   │   │   └── WalletScreen.tsx
│   │   │   ├── components/
│   │   │   │   ├── AmountInput.tsx
│   │   │   │   ├── PaymentMethodCard.tsx
│   │   │   │   └── TransactionCard.tsx
│   │   │   ├── hooks/
│   │   │   │   ├── usePayment.ts
│   │   │   │   └── useConflux.ts
│   │   │   ├── services/
│   │   │   │   ├── api.ts
│   │   │   │   └── storage.ts
│   │   │   └── utils/
│   │   │       └── validation.ts
│   │   ├── App.tsx
│   │   ├── package.json
│   │   └── app.json                 # Expo config
│   │
│   └── backend/                      # Node.js API server
│       ├── src/
│       │   ├── controllers/
│       │   │   ├── paymentController.ts
│       │   │   ├── webhookController.ts
│       │   │   └── statusController.ts
│       │   ├── services/
│       │   │   ├── flutterwaveService.ts
│       │   │   ├── confluxService.ts
│       │   │   ├── transactionService.ts
│       │   │   └── smsService.ts
│       │   ├── middleware/
│       │   │   ├── auth.ts
│       │   │   ├── rateLimit.ts
│       │   │   └── validate.ts
│       │   ├── queues/
│       │   │   └── transactionQueue.ts
│       │   ├── models/
│       │   │   └── prisma.schema
│       │   ├── utils/
│       │   │   ├── logger.ts
│       │   │   └── crypto.ts
│       │   └── index.ts
│       ├── package.json
│       ├── tsconfig.json
│       └── prisma/
│           └── schema.prisma
│
├── docker/
│   ├── Dockerfile.backend
│   └── docker-compose.yml
├── docs/
│   ├── go_to_market_plan.md
│   └── technical_docs.md
├── demo/
│   ├── demo_video.mp4
│   ├── intro_video.mp4
│   └── screenshots/
├── .env.example
├── Makefile
└── README.md
```

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- Redis 7+
- Flutterwave merchant account ([sign up](https://flutterwave.com))
- Conflux eSpace RPC endpoint
- (Optional) Twilio account for SMS

### Installation

```bash
# Clone repository
git clone https://github.com/yourusername/axpesa.git
cd axpesa

# Install all dependencies
npm run setup:all
# or individually:
cd apps/backend && npm install
cd ../web && npm install
cd ../mobile && npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your API keys

# Set up database
cd apps/backend
npx prisma migrate dev --name init
npx prisma generate

# Start development servers
# Terminal 1: Backend
cd apps/backend && npm run dev

# Terminal 2: Web (Next.js)
cd apps/web && npm run dev

# Terminal 3: Mobile (Expo)
cd apps/mobile && npm run ios  # or android
```

---

## ⚙️ Configuration

### .env (Root)

```env
# ========== FLUTTERWAVE ==========
FLUTTERWAVE_PUBLIC_KEY=FLWPUBK-xxx
FLUTTERWAVE_SECRET_KEY=FLWSECK-xxx
FLUTTERWAY_ENCRYPTION_KEY=xxx
FLUTTERWAVE_WEBHOOK_SECRET=xxx

# ========== CONFLUX ==========
CONFLUX_RPC_URL=https://evm.confluxrpc.com
CONFLUX_CHAIN_ID=71
HOT_WALLET_PRIVATE_KEY=0x...
AXCNH_CONTRACT_ADDRESS=0x...
SWAPPI_ROUTER_ADDRESS=0x...

# ========== DATABASE ==========
DATABASE_URL=postgresql://user:pass@localhost:5432/axpesa

# ========== REDIS ==========
REDIS_URL=redis://localhost:6379

# ========== SMS (Twilio) ==========
TWILIO_ACCOUNT_SID=ACxxx
TWILIO_AUTH_TOKEN=xxx
TWILIO_PHONE_NUMBER=+1234567890

# ========== APP ==========
NEXTAUTH_SECRET=xxx
NEXTAUTH_URL=http://localhost:3000
API_URL=http://localhost:8080
NODE_ENV=development
```

### Prisma Schema

```prisma
// apps/backend/prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Transaction {
  id              String   @id @default(cuid())
  transactionId   String   @unique
  walletAddress   String
  phoneNumber     String?
  email           String?

  fiatAmount      Float
  fiatCurrency    String   // KES, UGX, NGN, etc.
  usdAmount       Float
  axcnhAmount     Float

  paymentMethod   String   // mpesa, card, bank_transfer
  status          String   // pending, processing, completed, failed
  flutterwaveRef  String?
  txHash          String?   // Conflux transaction hash

  rateUsed        Float
  feePercent      Float
  feeAmount       Float
  totalAmount     Float

  createdAt       DateTime @default(now())
  completedAt     DateTime?

  @@index([status])
  @@index([walletAddress])
  @@index([createdAt])
}

model User {
  id              String   @id @default(cuid())
  phoneNumber     String?  @unique
  email           String?  @unique
  walletAddress   String   @unique

  kycTier         Int      @default(0)  // 0,1,2
  phoneVerified   Boolean  @default(false)
  idVerified      Boolean  @default(false)

  dailyVolumeUSD  Float    @default(0)
  monthlyVolumeUSD Float   @default(0)
  lastResetDate   DateTime @default(now())

  transactions    Transaction[]
  createdAt       DateTime @default(now())
}
```

---

## 💰 Payment Flow

### Step-by-Step Implementation

```typescript
// apps/backend/src/services/paymentService.ts
import { Flutterwave } from "flutterwave-node-v3";

export class PaymentService {
  private flutterwave: Flutterwave;

  constructor() {
    this.flutterwave = new Flutterwave(
      process.env.FLUTTERWAVE_PUBLIC_KEY,
      process.env.FLUTTERWAVE_SECRET_KEY,
    );
  }

  async initiatePayment(params: {
    walletAddress: string;
    fiatAmount: number;
    fiatCurrency: string;
    paymentMethod: string;
    phoneNumber?: string;
    email?: string;
  }) {
    // 1. Get exchange rate
    const rate = await this.getExchangeRate(params.fiatCurrency);
    const usdAmount = params.fiatAmount / rate;
    const axcnhAmount = usdAmount; // 1:1 peg

    // 2. Calculate fees
    const feePercent = 2.0;
    const feeAmount = params.fiatAmount * (feePercent / 100);
    const totalAmount = params.fiatAmount + feeAmount;

    // 3. Create transaction record
    const transaction = await prisma.transaction.create({
      data: {
        transactionId: `tx_${Date.now()}_${Math.random().toString(36)}`,
        walletAddress: params.walletAddress,
        phoneNumber: params.phoneNumber,
        email: params.email,
        fiatAmount: params.fiatAmount,
        fiatCurrency: params.fiatCurrency,
        usdAmount,
        axcnhAmount,
        paymentMethod: params.paymentMethod,
        status: "pending",
        rateUsed: rate,
        feePercent,
        feeAmount,
        totalAmount,
      },
    });

    // 4. Initialize Flutterwave payment
    const payment = await this.flutterwave.Charge({
      tx_ref: transaction.transactionId,
      amount: totalAmount,
      currency: params.fiatCurrency,
      payment_options: params.paymentMethod,
      redirect_url: `${process.env.APP_URL}/status/${transaction.transactionId}`,
      customer: {
        email: params.email || `user_${transaction.transactionId}@axpesa.com`,
        phonenumber: params.phoneNumber,
        name: `User ${transaction.transactionId.slice(-6)}`,
      },
      customizations: {
        title: "AxPesa",
        description: `Buy ${axcnhAmount.toFixed(2)} AxCNH`,
        logo: "https://axpesa.com/logo.png",
      },
    });

    // 5. Add to queue for processing
    await this.queueTransaction(transaction.transactionId);

    return {
      transactionId: transaction.transactionId,
      paymentLink: payment.data.link,
      rate,
      estimatedAxcnh: axcnhAmount,
      fee: feeAmount,
      total: totalAmount,
    };
  }

  async handleWebhook(payload: any, signature: string) {
    // 1. Verify signature
    if (!this.verifyWebhookSignature(payload, signature)) {
      throw new Error("Invalid webhook signature");
    }

    // 2. Get transaction
    const transaction = await prisma.transaction.findUnique({
      where: { transactionId: payload.tx_ref },
    });

    if (!transaction) {
      throw new Error("Transaction not found");
    }

    // 3. If payment successful, execute swap
    if (payload.status === "successful") {
      const txHash = await this.executeSwapAndTransfer(
        transaction.usdAmount,
        transaction.walletAddress,
      );

      // 4. Update transaction
      await prisma.transaction.update({
        where: { id: transaction.id },
        data: {
          status: "completed",
          flutterwaveRef: payload.id,
          txHash,
          completedAt: new Date(),
        },
      });

      // 5. Send SMS confirmation
      await this.sendSMS(
        transaction.phoneNumber,
        `✅ Received ${transaction.axcnhAmount.toFixed(2)} AxCNH at ${transaction.walletAddress.slice(0, 10)}... View: https://evm.confluxscan.net/tx/${txHash}`,
      );
    }

    return { received: true };
  }

  private async executeSwapAndTransfer(usdAmount: number, userAddress: string) {
    // Using ethers.js for Conflux eSpace
    const provider = new ethers.JsonRpcProvider(process.env.CONFLUX_RPC_URL);
    const wallet = new ethers.Wallet(
      process.env.HOT_WALLET_PRIVATE_KEY,
      provider,
    );

    // Load Swappi router contract
    const router = new ethers.Contract(
      process.env.SWAPPI_ROUTER_ADDRESS,
      SWAPPI_ROUTER_ABI,
      wallet,
    );

    // Execute swap: USDC → AxCNH
    const usdcAmount = ethers.parseUnits(usdAmount.toString(), 6); // USDC has 6 decimals
    const amountOutMin = this.calculateMinOutput(usdAmount);

    const tx = await router.swapExactTokensForTokens(
      usdcAmount,
      amountOutMin,
      [process.env.USDC_ADDRESS, process.env.AXCNH_ADDRESS],
      userAddress,
      Math.floor(Date.now() / 1000) + 1200,
      { gasLimit: 300000 },
    );

    const receipt = await tx.wait();
    return receipt.hash;
  }
}
```

---

## 🌐 Next.js Frontend

### Buy Page Component

```tsx
// apps/web/src/app/buy/page.tsx
"use client";

import { useState } from "react";
import { AmountInput } from "@/components/onramp/AmountInput";
import { WalletInput } from "@/components/onramp/WalletInput";
import { PaymentMethods } from "@/components/onramp/PaymentMethods";
import { RateDisplay } from "@/components/onramp/RateDisplay";
import { usePayment } from "@/hooks/usePayment";

export default function BuyPage() {
  const [amount, setAmount] = useState(1000);
  const [currency, setCurrency] = useState("KES");
  const [wallet, setWallet] = useState("");
  const [autoCreate, setAutoCreate] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState("mpesa");
  const [phoneNumber, setPhoneNumber] = useState("");

  const { initiatePayment, loading, rate, error } = usePayment();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const result = await initiatePayment({
      walletAddress: autoCreate ? undefined : wallet,
      fiatAmount: amount,
      fiatCurrency: currency,
      paymentMethod,
      phoneNumber,
    });

    if (result.paymentLink) {
      window.location.href = result.paymentLink;
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-12 px-4">
      <h1 className="text-3xl font-bold mb-8">Buy AxCNH Stablecoin</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <RateDisplay currency={currency} rate={rate} />

        <AmountInput
          amount={amount}
          currency={currency}
          onAmountChange={setAmount}
          onCurrencyChange={setCurrency}
        />

        <WalletInput
          wallet={wallet}
          autoCreate={autoCreate}
          onWalletChange={setWallet}
          onAutoCreateChange={setAutoCreate}
        />

        <PaymentMethods
          selected={paymentMethod}
          onChange={setPaymentMethod}
          currency={currency}
        />

        {paymentMethod === "mpesa" && (
          <input
            type="tel"
            placeholder="Phone number (e.g., 254700123456)"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            className="w-full p-3 border rounded-lg"
            required
          />
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold disabled:opacity-50"
        >
          {loading
            ? "Processing..."
            : `Buy ${(amount / rate).toFixed(2)} AxCNH`}
        </button>

        {error && <p className="text-red-500 text-sm">{error}</p>}
      </form>
    </div>
  );
}
```

---

## 📱 React Native Mobile App

### Main Buy Screen

```tsx
// apps/mobile/src/screens/BuyScreen.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { usePayment } from "../hooks/usePayment";
import { PaymentMethodCard } from "../components/PaymentMethodCard";
import { AmountInput } from "../components/AmountInput";

export function BuyScreen() {
  const [amount, setAmount] = useState("1000");
  const [currency, setCurrency] = useState("KES");
  const [wallet, setWallet] = useState("");
  const [autoCreate, setAutoCreate] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState("mpesa");
  const [phoneNumber, setPhoneNumber] = useState("");

  const { initiatePayment, loading, rate } = usePayment();

  const handleBuy = async () => {
    const result = await initiatePayment({
      walletAddress: autoCreate ? undefined : wallet,
      fiatAmount: parseFloat(amount),
      fiatCurrency: currency,
      paymentMethod,
      phoneNumber,
    });

    if (result.paymentLink) {
      // Open WebView for Flutterwave payment page
      // or use deep linking
      Linking.openURL(result.paymentLink);
    }
  };

  return (
    <ScrollView className="flex-1 bg-gray-50">
      <View className="p-6">
        <Text className="text-2xl font-bold mb-2">Buy AxCNH</Text>
        <Text className="text-gray-600 mb-6">
          Get Conflux stablecoin in seconds
        </Text>

        <View className="bg-white rounded-xl p-4 mb-4 shadow-sm">
          <AmountInput
            amount={amount}
            currency={currency}
            onAmountChange={setAmount}
            onCurrencyChange={setCurrency}
            rate={rate}
          />
        </View>

        <View className="bg-white rounded-xl p-4 mb-4">
          <Text className="font-semibold mb-2">Conflux Wallet</Text>
          <View className="flex-row items-center mb-3">
            <TouchableOpacity
              onPress={() => setAutoCreate(true)}
              className={`flex-1 py-2 rounded-l-lg ${
                autoCreate ? "bg-green-600" : "bg-gray-200"
              }`}
            >
              <Text
                className={`text-center ${autoCreate ? "text-white" : "text-gray-700"}`}
              >
                Auto-create
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setAutoCreate(false)}
              className={`flex-1 py-2 rounded-r-lg ${
                !autoCreate ? "bg-green-600" : "bg-gray-200"
              }`}
            >
              <Text
                className={`text-center ${!autoCreate ? "text-white" : "text-gray-700"}`}
              >
                I have a wallet
              </Text>
            </TouchableOpacity>
          </View>

          {!autoCreate && (
            <TextInput
              placeholder="cfx:aak2..."
              value={wallet}
              onChangeText={setWallet}
              className="border border-gray-300 rounded-lg p-3"
            />
          )}
        </View>

        <Text className="font-semibold mb-2">Payment Method</Text>
        <PaymentMethodCard
          method="mpesa"
          selected={paymentMethod === "mpesa"}
          onSelect={() => setPaymentMethod("mpesa")}
        />
        <PaymentMethodCard
          method="card"
          selected={paymentMethod === "card"}
          onSelect={() => setPaymentMethod("card")}
        />
        <PaymentMethodCard
          method="bank_transfer"
          selected={paymentMethod === "bank_transfer"}
          onSelect={() => setPaymentMethod("bank_transfer")}
        />

        {paymentMethod === "mpesa" && (
          <TextInput
            placeholder="Phone number (254700123456)"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            keyboardType="phone-pad"
            className="bg-white border border-gray-300 rounded-lg p-3 mt-4"
          />
        )}

        <TouchableOpacity
          onPress={handleBuy}
          disabled={loading}
          className="bg-green-600 py-4 rounded-lg mt-6"
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white text-center font-semibold text-lg">
              Buy {(parseFloat(amount) / (rate || 128) || 0).toFixed(2)} AxCNH
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
```

### Build APK

```bash
# Using Expo EAS
cd apps/mobile
eas build -p android --profile production

# Or using React Native CLI
cd apps/mobile
cd android && ./gradlew assembleRelease
# APK located at: android/app/build/outputs/apk/release/
```

---

## ⛓️ Conflux Integration

### ethers.js Setup

```typescript
// apps/backend/src/services/confluxService.ts
import { ethers } from "ethers";

export class ConfluxService {
  private provider: ethers.JsonRpcProvider;
  private wallet: ethers.Wallet;
  private axcnhContract: ethers.Contract;

  constructor() {
    this.provider = new ethers.JsonRpcProvider(process.env.CONFLUX_RPC_URL);
    this.wallet = new ethers.Wallet(
      process.env.HOT_WALLET_PRIVATE_KEY,
      this.provider,
    );

    const axcnhABI = [
      "function balanceOf(address) view returns (uint256)",
      "function transfer(address to, uint256 amount) returns (bool)",
      "function decimals() view returns (uint8)",
    ];

    this.axcnhContract = new ethers.Contract(
      process.env.AXCNH_CONTRACT_ADDRESS,
      axcnhABI,
      this.wallet,
    );
  }

  async transferAxCNH(toAddress: string, amount: number): Promise<string> {
    const decimals = await this.axcnhContract.decimals();
    const amountWei = ethers.parseUnits(amount.toString(), decimals);

    const tx = await this.axcnhContract.transfer(toAddress, amountWei, {
      gasLimit: 100000,
    });

    const receipt = await tx.wait();
    return receipt.hash;
  }

  async getBalance(address: string): Promise<number> {
    const balance = await this.axcnhContract.balanceOf(address);
    const decimals = await this.axcnhContract.decimals();
    return parseFloat(ethers.formatUnits(balance, decimals));
  }
}
```

---

## 🧪 Testing

```bash
# Backend tests
cd apps/backend
npm test
npm run test:integration

# Web tests
cd apps/web
npm test
npm run e2e

# Mobile tests
cd apps/mobile
npm test
```

---

## 🚢 Deployment

### Backend (Railway)

```bash
cd apps/backend
railway login
railway init
railway up
```

### Web (Vercel)

```bash
cd apps/web
vercel login
vercel --prod
```

### Mobile APK (EAS)

```bash
cd apps/mobile
eas build -p android --profile production
# Download APK from EAS dashboard
```

---

## 🎥 Demo

### Demo Video (3-5 minutes)

1. **0:00-0:30** — Introduction to AxPesa
2. **0:30-1:00** — Next.js website walkthrough
3. **1:00-2:00** — Complete M-PESA purchase flow
4. **2:00-2:30** — Show AxCNH arriving on ConfluxScan
5. **2:30-3:00** — Card payment alternative
6. **3:00-3:30** — React Native app demo
7. **3:30-4:00** — Transaction status page
8. **4:00-4:30** — SMS confirmation
9. **4:30-5:00** — Future roadmap

### Participant Intro Video

> _"I'm [Name] from [Country], building AxPesa for Global Hackfest 2026. AxPesa is a seamless fiat-to-stablecoin onramp for Conflux Network. We built a Next.js website and React Native mobile app that lets anyone buy AxCNH using M-PESA, cards, or bank transfers through Flutterwave. No crypto experience needed. I'm excited to bring Conflux to emerging markets!"_

---

## 📄 License

MIT

---

**Built for Global Hackfest 2026** 🏆

---
