import { Router } from 'express';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import prisma from '../lib/prisma.js';
import flutterwaveService from '../services/flutterwaveService.js';
import confluxService from '../services/confluxService.js';
import { createError } from '../middleware/errorHandler.js';
import { strictRateLimiter } from '../middleware/rateLimiter.js';

const router = Router();

const onrampSchema = z.object({
  fiatAmount: z.number().min(100).max(1000000),
  fiatCurrency: z.string().default('KES'),
  paymentMethod: z.string(),
  walletAddress: z.string(),
  phoneNumber: z.string().optional(),
  email: z.string().email().optional(),
});

const FEE_PERCENT = 2.0;

// Live rates relative to CNY (AxCNH = CNY)
// Base: 1 CNY = 1 AxCNH
// Fetched dynamically from CoinGecko
interface ExchangeRates {
  KES: number; // KES per CNY (≈ 18.87)
  UGX: number; // UGX per CNY
  NGN: number; // NGN per CNY
  USD: number; // USD per CNY
  CNH: number; // CNH per CNY (always 1)
}

let cachedRates: ExchangeRates = {
  KES: 18.87,
  UGX: 455.5,
  NGN: 186.2,
  USD: 0.12,
  CNH: 1,
};

let lastRateUpdate = 0;
const RATE_CACHE_DURATION = 60000; // 1 minute

async function fetchLiveRates(): Promise<ExchangeRates> {
  const now = Date.now();
  if (now - lastRateUpdate < RATE_CACHE_DURATION && lastRateUpdate > 0) {
    return cachedRates;
  }

  try {
    // Fetch KES/CNY from CoinGecko
    // CNY is not directly available, so we calculate from USD
    // 1 USD ≈ 7.25 CNY
    // 1 USD ≈ 157 KES
    // Therefore 1 CNY ≈ 157/7.25 KES ≈ 21.66... but user said 18.87
    
    // Using a simpler approach - approximate rates based on user input
    // 1 CNY ≈ 18.87 KES (user provided)
    const res = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=tether,usd-coin&vs_currencies=usd,kes,ngn,ugx', {
      headers: { 'Accept': 'application/json' }
    });
    
    if (res.ok) {
      const data = await res.json() as Record<string, Record<string, number>>;
      
      // USDC is our reference (pegged to USD)
      const usdcData = data['usd-coin'] || data.tether || {};
      
      // Calculate rates
      // 1 CNY = 1 AxCNH
      // We approximate: 1 USD = 7.25 CNY (fixed)
      const CNY_PER_USD = 7.25;
      const usdToKes = usdcData.kes || 157;
      const usdToNgn = usdcData.ngn || 1550;
      const usdToUgx = usdcData.ugx || 3780;
      
      cachedRates = {
        CNH: 1,
        USD: 1 / CNY_PER_USD, // 0.138 CNY per USD
        KES: usdToKes / CNY_PER_USD, // KES per CNY
        NGN: usdToNgn / CNY_PER_USD, // NGN per CNY
        UGX: usdToUgx / CNY_PER_USD, // UGX per CNY
      };
      
      lastRateUpdate = now;
      console.log('✅ Exchange rates updated:', cachedRates);
    }
  } catch (error) {
    console.error('Failed to fetch live rates, using cached:', error);
  }
  
  return cachedRates;
}

router.get('/rates', async (req, res) => {
  try {
    const rates = await fetchLiveRates();
    res.json({
      success: true,
      data: {
        rates,
        baseCurrency: 'CNY',
        baseCurrencyName: 'AxCNH',
        lastUpdated: new Date().toISOString(),
      },
    });
  } catch (error) {
    res.json({
      success: true,
      data: {
        rates: cachedRates,
        baseCurrency: 'CNY',
        baseCurrencyName: 'AxCNH',
        lastUpdated: new Date().toISOString(),
      },
    });
  }
});

router.get('/rate/:currency', async (req, res) => {
  const { currency } = req.params;
  const rates = await fetchLiveRates();
  const rate = rates[currency?.toUpperCase() as keyof ExchangeRates] || rates.KES;
  
  res.json({
    success: true,
    data: {
      currency: currency?.toUpperCase(),
      rateToAxCNH: rate,
      baseCurrency: 'CNY (AxCNH)',
    },
  });
});

router.post('/initiate', strictRateLimiter, async (req, res, next) => {
  try {
    const data = onrampSchema.parse(req.body);
    const transactionId = `tx_${uuidv4()}`;
    
    // Get live rates
    const rates = await fetchLiveRates();
    const rate = rates[data.fiatCurrency as keyof ExchangeRates] || rates.KES;
    
    // fiatAmount is in fiat currency (e.g., KES)
    // We calculate how much AxCNH they get
    const axcnhAmount = data.fiatAmount / rate;
    const feeAmount = data.fiatAmount * (FEE_PERCENT / 100);
    const totalAmount = data.fiatAmount + feeAmount;

    let userId: string | undefined;
    if (data.walletAddress.startsWith('0x')) {
      const user = await prisma.user.upsert({
        where: { walletAddress: data.walletAddress },
        create: { walletAddress: data.walletAddress, phoneNumber: data.phoneNumber, email: data.email },
        update: {},
      });
      userId = user.id;
    }

    const transaction = await prisma.transaction.create({
      data: {
        transactionId,
        type: 'onramp',
        userId,
        walletAddress: data.walletAddress,
        fiatAmount: data.fiatAmount,
        fiatCurrency: data.fiatCurrency,
        usdAmount: axcnhAmount, // Using axcnhAmount for consistency
        axcnhAmount,
        paymentMethod: data.paymentMethod,
        status: 'pending',
        rateUsed: rate,
        feePercent: FEE_PERCENT,
        feeAmount,
        totalAmount,
      },
    });

    const paymentOptions = {
      mpesa: 'mpesa',
      card: 'card',
      bank_transfer: 'ussd',
    }[data.paymentMethod] || 'mpesa';

    const flutterwavePayment = await flutterwaveService.initiatePayment({
      txRef: transactionId,
      amount: totalAmount,
      currency: data.fiatCurrency,
      paymentOptions,
      phoneNumber: data.phoneNumber,
      email: data.email,
      redirectUrl: `${process.env.APP_URL || 'http://localhost:3000'}/status/${transactionId}`,
      description: `Buy ${axcnhAmount.toFixed(4)} AxCNH`,
    });

    res.json({
      success: true,
      data: {
        transactionId,
        paymentLink: flutterwavePayment.data?.link,
        rate,
        rateUnit: `1 AxCNH = ${rate.toFixed(2)} ${data.fiatCurrency}`,
        estimatedAxcnh: axcnhAmount,
        fee: feeAmount,
        total: totalAmount,
        paymentOptions: flutterwavePayment.data?.payment_options,
      },
    });
  } catch (err) {
    next(err);
  }
});

router.get('/status/:transactionId', async (req, res, next) => {
  try {
    const { transactionId } = req.params;
    
    const transaction = await prisma.transaction.findUnique({
      where: { transactionId },
      include: { merchant: { select: { businessName: true } } },
    });

    if (!transaction) throw createError('Transaction not found', 404);

    res.json({
      success: true,
      data: {
        transactionId: transaction.transactionId,
        status: transaction.status,
        fiatAmount: transaction.fiatAmount,
        fiatCurrency: transaction.fiatCurrency,
        axcnhAmount: transaction.axcnhAmount,
        paymentMethod: transaction.paymentMethod,
        txHash: transaction.txHash,
        createdAt: transaction.createdAt,
        completedAt: transaction.completedAt,
      },
    });
  } catch (err) {
    next(err);
  }
});

router.post('/webhook/process/:transactionId', async (req, res, next) => {
  try {
    const { transactionId } = req.params;
    const { status, txHash, tokenSymbol } = req.body;

    const transaction = await prisma.transaction.findUnique({ where: { transactionId } });
    if (!transaction) throw createError('Transaction not found', 404);

    if (status === 'successful' && transaction.status === 'pending') {
      // Use vault withdrawal for BUY flow
      const token = tokenSymbol || 'AxCNH';
      const hash = await confluxService.withdrawFromVault(
        transaction.walletAddress, 
        transaction.axcnhAmount,
        token
      );
      
      await prisma.transaction.update({
        where: { id: transaction.id },
        data: {
          status: 'completed',
          txHash: hash,
          completedAt: new Date(),
        },
      });

      if (transaction.userId) {
        await prisma.user.update({
          where: { id: transaction.userId },
          data: {
            dailyVolume: { increment: transaction.usdAmount || transaction.axcnhAmount },
            monthlyVolume: { increment: transaction.usdAmount || transaction.axcnhAmount },
          },
        });
      }
    }

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

export default router;
