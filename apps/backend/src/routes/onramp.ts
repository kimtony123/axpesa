import { Router } from 'express';
import type { Router as ExpressRouter } from 'express';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import prisma from '../lib/prisma.js';
import flutterwaveService from '../services/flutterwaveService.js';
import confluxService from '../services/confluxService.js';
import { createError } from '../middleware/errorHandler.js';
import { strictRateLimiter } from '../middleware/rateLimiter.js';

const router: ExpressRouter = Router();

const onrampSchema = z.object({
  fiatamount: z.number().min(100).max(1000000),
  fiatcurrency: z.string().default('KES'),
  paymentmethod: z.string(),
  walletaddress: z.string(),
  phonenumber: z.string().optional(),
  email: z.string().email().optional(),
});

const FEE_PERCENT = 2.0;

interface ExchangeRates {
  KES: number;
  UGX: number;
  NGN: number;
  USD: number;
  CNH: number;
}

let cachedRates: ExchangeRates = {
  KES: 18.87,
  UGX: 455.5,
  NGN: 186.2,
  USD: 0.12,
  CNH: 1,
};

let lastRateUpdate = 0;
const RATE_CACHE_DURATION = 60000;

async function fetchLiveRates(): Promise<ExchangeRates> {
  const now = Date.now();
  if (now - lastRateUpdate < RATE_CACHE_DURATION && lastRateUpdate > 0) {
    return cachedRates;
  }

  try {
    const res = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=tether,usd-coin&vs_currencies=usd,kes,ngn,ugx', {
      headers: { 'Accept': 'application/json' }
    });
    
    if (res.ok) {
      const data = await res.json() as Record<string, Record<string, number>>;
      const usdcData = data['usd-coin'] || data.tether || {};
      
      const CNY_PER_USD = 7.25;
      const usdToKes = usdcData.kes || 157;
      const usdToNgn = usdcData.ngn || 1550;
      const usdToUgx = usdcData.ugx || 3780;
      
      cachedRates = {
        CNH: 1,
        USD: 1 / CNY_PER_USD,
        KES: usdToKes / CNY_PER_USD,
        NGN: usdToNgn / CNY_PER_USD,
        UGX: usdToUgx / CNY_PER_USD,
      };
      
      lastRateUpdate = now;
      console.log('Exchange rates updated:', cachedRates);
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
    const transactionid = `tx_${uuidv4()}`;
    
    const rates = await fetchLiveRates();
    const rate = rates[data.fiatcurrency as keyof ExchangeRates] || rates.KES;
    
    const axcnhamount = data.fiatamount / rate;
    const feeamount = data.fiatamount * (FEE_PERCENT / 100);
    const totalamount = data.fiatamount + feeamount;

    let userid: string | undefined;
    if (data.walletaddress.startsWith('0x')) {
      const user = await prisma.user.upsert({
        where: { walletaddress: data.walletaddress },
        create: { walletaddress: data.walletaddress, phonenumber: data.phonenumber, email: data.email },
        update: {},
      });
      userid = user.id;
    }

    const transaction = await prisma.transaction.create({
      data: {
        transactionid,
        type: 'onramp',
        userid,
        walletaddress: data.walletaddress,
        fiatamount: data.fiatamount,
        fiatcurrency: data.fiatcurrency,
        usdamount: axcnhamount,
        axcnhamount,
        paymentmethod: data.paymentmethod,
        status: 'pending',
        rateused: rate,
        feepercent: FEE_PERCENT,
        feeamount,
        totalamount,
      },
    });

    const paymentOptions = {
      mpesa: 'mpesa',
      card: 'card',
      bank_transfer: 'ussd',
    }[data.paymentmethod] || 'mpesa';

    const flutterwavePayment = await flutterwaveService.initiatePayment({
      txRef: transactionid,
      amount: totalamount,
      currency: data.fiatcurrency,
      paymentOptions,
      phoneNumber: data.phonenumber,
      email: data.email,
      redirectUrl: `${process.env.APP_URL || 'http://localhost:3000'}/status/${transactionid}`,
      description: `Buy ${axcnhamount.toFixed(4)} AxCNH`,
    });

    res.json({
      success: true,
      data: {
        transactionid,
        paymentLink: flutterwavePayment.data?.link,
        rate,
        rateUnit: `1 AxCNH = ${rate.toFixed(2)} ${data.fiatcurrency}`,
        estimatedAxcnh: axcnhamount,
        fee: feeamount,
        total: totalamount,
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
      where: { transactionid: transactionId },
      include: { merchant: { select: { businessname: true } } },
    });

    if (!transaction) throw createError('Transaction not found', 404);

    res.json({
      success: true,
      data: {
        transactionId: transaction.transactionid,
        status: transaction.status,
        fiatAmount: transaction.fiatamount,
        fiatCurrency: transaction.fiatcurrency,
        axcnhAmount: transaction.axcnhamount,
        paymentMethod: transaction.paymentmethod,
        txHash: transaction.txhash,
        createdAt: transaction.createdat,
        completedAt: transaction.completedat,
      },
    });
  } catch (err) {
    next(err);
  }
});

router.post('/webhook/process/:transactionId', async (req, res, next) => {
  try {
    const { transactionId } = req.params;
    const { status, txhash, tokensymbol } = req.body;

    const transaction = await prisma.transaction.findUnique({ where: { transactionid: transactionId } });
    if (!transaction) throw createError('Transaction not found', 404);

    if (status === 'successful' && transaction.status === 'pending') {
      const token = tokensymbol || 'AxCNH';
      const hash = await confluxService.withdrawFromVault(
        transaction.walletaddress, 
        transaction.axcnhamount,
        token
      );
      
      await prisma.transaction.update({
        where: { id: transaction.id },
        data: {
          status: 'completed',
          txhash: hash,
          completedat: new Date(),
        },
      });

      if (transaction.userid) {
        await prisma.user.update({
          where: { id: transaction.userid },
          data: {
            dailyvolume: { increment: transaction.usdamount || transaction.axcnhamount },
            monthlyvolume: { increment: transaction.usdamount || transaction.axcnhamount },
          },
        });
      }
    }

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

router.get('/verify/:transactionId', async (req, res, next) => {
  try {
    const { transactionId } = req.params;
    const { flutterwave_tx_id, tx_ref } = req.query;
    
    const transaction = await prisma.transaction.findUnique({
      where: { transactionid: transactionId },
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        error: { message: 'Transaction not found', code: 'NOT_FOUND' }
      });
    }

    if (transaction.status === 'completed') {
      return res.json({
        success: true,
        data: {
          transactionId: transaction.transactionid,
          status: 'completed',
          axcnhAmount: transaction.axcnhamount,
          txHash: transaction.txhash,
        }
      });
    }

    if (transaction.status === 'failed' || transaction.status === 'cancelled') {
      return res.json({
        success: true,
        data: {
          transactionId: transaction.transactionid,
          status: transaction.status,
        }
      });
    }

    let isVerified = false;
    if (flutterwave_tx_id) {
      const verified = await flutterwaveService.verifyTransaction(String(flutterwave_tx_id));
      
      if (verified.status === 'success' && verified.data?.status === 'successful') {
        const verifiedAmount = parseFloat(verified.data.amount);
        const expectedAmount = transaction.totalamount;
        
        if (Math.abs(verifiedAmount - expectedAmount) <= 0.01) {
          isVerified = true;
        } else {
          console.log(`Verify: Amount mismatch! Expected=${expectedAmount}, Got=${verifiedAmount}`);
        }
      }
    }

    if (isVerified || (transaction.status === 'pending' && !flutterwave_tx_id)) {
      console.log(`Verify: Processing vault withdrawal for ${transaction.axcnhamount} AxCNH to ${transaction.walletaddress}`);
      
      const txHash = await confluxService.withdrawFromVault(
        transaction.walletaddress,
        transaction.axcnhamount,
        'AxCNH'
      );

      await prisma.transaction.update({
        where: { id: transaction.id },
        data: {
          status: 'completed',
          txhash: txHash,
          flutterwaveref: String(flutterwave_tx_id || tx_ref || ''),
          completedat: new Date(),
        },
      });

      if (transaction.userid) {
        await prisma.user.update({
          where: { id: transaction.userid },
          data: {
            dailyvolume: { increment: transaction.usdamount || transaction.axcnhamount },
            monthlyvolume: { increment: transaction.usdamount || transaction.axcnhamount },
          },
        });
      }

      return res.json({
        success: true,
        data: {
          transactionId: transaction.transactionid,
          status: 'completed',
          axcnhAmount: transaction.axcnhamount,
          txHash,
        }
      });
    }

    return res.json({
      success: true,
      data: {
        transactionId: transaction.transactionid,
        status: transaction.status,
        message: 'Payment still pending verification'
      }
    });

  } catch (err) {
    next(err);
  }
});

router.post('/complete/:transactionId', async (req, res, next) => {
  try {
    const { transactionId } = req.params;

    const transaction = await prisma.transaction.findUnique({
      where: { transactionid: transactionId },
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        error: { message: 'Transaction not found', code: 'NOT_FOUND' }
      });
    }

    if (transaction.status === 'completed') {
      return res.json({
        success: true,
        data: {
          transactionId: transaction.transactionid,
          status: 'completed',
          axcnhAmount: transaction.axcnhamount,
          txHash: transaction.txhash,
          message: 'Transaction already completed'
        }
      });
    }

    console.log(`Complete: Processing vault withdrawal for ${transaction.axcnhamount} AxCNH to ${transaction.walletaddress}`);
    
    const txHash = await confluxService.withdrawFromVault(
      transaction.walletaddress,
      transaction.axcnhamount,
      'AxCNH'
    );

    await prisma.transaction.update({
      where: { id: transaction.id },
      data: {
        status: 'completed',
        txhash: txHash,
        completedat: new Date(),
      },
    });

    if (transaction.userid) {
      await prisma.user.update({
        where: { id: transaction.userid },
        data: {
          dailyvolume: { increment: transaction.usdamount || transaction.axcnhamount },
          monthlyvolume: { increment: transaction.usdamount || transaction.axcnhamount },
        },
      });
    }

    return res.json({
      success: true,
      data: {
        transactionId: transaction.transactionid,
        status: 'completed',
        axcnhAmount: transaction.axcnhamount,
        txHash,
      }
    });

  } catch (err) {
    next(err);
  }
});

export default router;