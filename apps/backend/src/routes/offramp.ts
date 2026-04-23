import { Router } from 'express';
import type { Router as ExpressRouter } from 'express';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma.js';
import confluxService from '../services/confluxService.js';
import flutterwaveService from '../services/flutterwaveService.js';
import { createError } from '../middleware/errorHandler.js';
import { strictRateLimiter } from '../middleware/rateLimiter.js';

const router: ExpressRouter = Router();

const offrampSchema = z.object({
  axcnhamount: z.number().min(1),
  payoutmethod: z.string(),
  payoutdetails: z.object({
    phonenumber: z.string().optional(),
    bankcode: z.string().optional(),
    accountnumber: z.string().optional(),
  }),
});

const FEE_PERCENT = 2.5;

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
    }
  } catch (error) {
    console.error('Failed to fetch live rates:', error);
  }
  
  return cachedRates;
}

router.get('/rates', async (req, res) => {
  const rates = await fetchLiveRates();
  res.json({
    success: true,
    data: {
      rates,
      baseCurrency: 'CNY',
      baseCurrencyName: 'AxCNH',
    },
  });
});

router.post('/initiate', strictRateLimiter, async (req, res, next) => {
  try {
    const data = offrampSchema.parse(req.body);
    const auth = req.headers.authorization;
    
    if (!auth?.startsWith('Bearer ')) throw createError('Unauthorized', 401);
    const decoded = jwt.verify(auth.split(' ')[1], process.env.JWT_SECRET || 'secret') as { merchantId?: string; userId?: string };

    let walletaddress: string;
    let userid: string | undefined;
    let merchantid: string | undefined;

    if (decoded.merchantId) {
      const merchant = await prisma.merchant.findUnique({ where: { id: decoded.merchantId } });
      if (!merchant) throw createError('Merchant not found', 404);
      walletaddress = merchant.walletaddress;
      merchantid = merchant.id;
    } else if (decoded.userId) {
      const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
      if (!user) throw createError('User not found', 404);
      walletaddress = user.walletaddress;
      userid = user.id;
    } else {
      throw createError('Invalid token', 401);
    }

    const balance = parseFloat(await confluxService.getBalance(walletaddress, 'AxCNH'));
    if (balance < data.axcnhamount) {
      throw createError('Insufficient AxCNH balance', 400, 'INSUFFICIENT_BALANCE');
    }

    const rates = await fetchLiveRates();
    
    const currency = data.payoutmethod === 'mpesa' ? 'KES' : data.payoutmethod === 'airtel' ? 'UGX' : 'NGN';
    const rate = rates[currency as keyof ExchangeRates];
    
    const fiatamount = data.axcnhamount * rate;
    const feeamount = fiatamount * (FEE_PERCENT / 100);
    const payoutamount = fiatamount - feeamount;

    const transactionid = `off_${uuidv4()}`;

    const transaction = await prisma.transaction.create({
      data: {
        transactionid,
        type: 'offramp',
        userid,
        merchantid,
        walletaddress,
        fiatamount: payoutamount,
        fiatcurrency: currency,
        usdamount: data.axcnhamount,
        axcnhamount: data.axcnhamount,
        paymentmethod: data.payoutmethod,
        status: 'pending',
        rateused: rate,
        feepercent: FEE_PERCENT,
        feeamount,
        totalamount: payoutamount,
      },
    });

    res.json({
      success: true,
      data: {
        transactionid,
        axcnhamount: data.axcnhamount,
        payoutamount,
        rate: `1 AxCNH = ${rate.toFixed(2)} ${currency}`,
        currency,
        fee: feeamount,
        status: 'pending',
      },
    });
  } catch (err) {
    next(err);
  }
});

router.post('/confirm/:transactionId', strictRateLimiter, async (req, res, next) => {
  try {
    const { transactionId } = req.params;
    const auth = req.headers.authorization;
    
    if (!auth?.startsWith('Bearer ')) throw createError('Unauthorized', 401);
    const decoded = jwt.verify(auth.split(' ')[1], process.env.JWT_SECRET || 'secret') as { merchantId?: string; userId?: string };

    const transaction = await prisma.transaction.findFirst({
      where: { 
        transactionid: transactionId,
        type: 'offramp',
        OR: [
          { merchantid: decoded.merchantId },
          { userid: decoded.userId },
        ],
      },
    });

    if (!transaction) throw createError('Transaction not found', 404);
    if (transaction.status !== 'pending') throw createError('Transaction already processed', 400);

    const txhash = req.body.txhash;
    if (!txhash) {
      throw createError('Transaction hash required', 400);
    }

    console.log(`Verifying blockchain transaction: ${txhash}`);
    const txVerified = await confluxService.verifyTransaction(txhash);
    if (!txVerified) {
      throw createError('Token transfer not confirmed on blockchain', 400, 'TX_NOT_CONFIRMED');
    }

    console.log(`Blockchain transaction verified: ${txhash}`);

    let payoutResult;
    if (transaction.paymentmethod === 'mpesa') {
      payoutResult = await flutterwaveService.mobileMoneyRecharge({
        network: 'MPESA',
        amount: transaction.fiatamount,
        mobile_number: req.body.phonenumber || '',
        reference: transactionId,
      });
    } else {
      payoutResult = await flutterwaveService.disburse({
        account_bank: req.body.bankcode || '',
        account_number: req.body.accountnumber || '',
        amount: transaction.fiatamount,
        narration: 'AxPesa AxCNH Sale',
        currency: transaction.fiatcurrency,
        reference: transactionId,
      });
    }

    await prisma.transaction.update({
      where: { id: transaction.id },
      data: {
        status: 'completed',
        txhash: txhash,
        completedat: new Date(),
      },
    });

    res.json({
      success: true,
      data: {
        transactionId,
        status: 'completed',
        payoutReference: payoutResult?.data?.id,
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;