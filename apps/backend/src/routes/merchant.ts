import { Router } from 'express';
import type { Router as ExpressRouter } from 'express';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken';
import QRCode from 'qrcode';
import prisma from '../lib/prisma.js';
import { createError } from '../middleware/errorHandler.js';

const router: ExpressRouter = Router();

interface AuthenticatedRequest extends ReturnType<typeof Router.prototype.handle> {
  merchantId?: string;
}

const createLinkSchema = z.object({
  amount: z.number().optional(),
  currency: z.string().default('AXCNH'),
  description: z.string().optional(),
  maxuses: z.number().optional(),
  expiresat: z.string().optional(),
});

const authMiddleware = async (req: AuthenticatedRequest, res: any, next: any) => {
  try {
    const auth = req.headers.authorization;
    if (!auth?.startsWith('Bearer ')) throw createError('Unauthorized', 401);
    const decoded = jwt.verify(auth.split(' ')[1], process.env.JWT_SECRET || 'secret') as { merchantId: string };
    req.merchantId = decoded.merchantId;
    next();
  } catch (err) {
    next(err);
  }
};

router.use(authMiddleware);

router.post('/payment-link', async (req: AuthenticatedRequest, res, next) => {
  try {
    const data = createLinkSchema.parse(req.body);
    const linkcode = `pay_${uuidv4().slice(0, 12)}`;

    const paymentlink = await prisma.paymentlink.create({
      data: {
        linkcode,
        merchantid: req.merchantId!,
        amount: data.amount,
        currency: data.currency,
        description: data.description,
        maxuses: data.maxuses,
        expiresat: data.expiresat ? new Date(data.expiresat) : null,
      },
    });

    const paymentUrl = `${process.env.APP_URL}/pay/${linkcode}`;

    res.json({
      success: true,
      data: {
        id: paymentlink.id,
        linkcode,
        url: paymentUrl,
        amount: paymentlink.amount,
        currency: paymentlink.currency,
        description: paymentlink.description,
      },
    });
  } catch (err) {
    next(err);
  }
});

router.get('/payment-links', async (req: AuthenticatedRequest, res, next) => {
  try {
    const links = await prisma.paymentlink.findMany({
      where: { merchantid: req.merchantId },
      include: { transactions: { select: { id: true, axcnhamount: true, status: true } } },
      orderBy: { createdat: 'desc' },
    });

    res.json({
      success: true,
      data: links.map(link => ({
        id: link.id,
        linkcode: link.linkcode,
        url: `${process.env.APP_URL}/pay/${link.linkcode}`,
        amount: link.amount,
        currency: link.currency,
        description: link.description,
        isactive: link.isactive,
        usecount: link.usecount,
        maxuses: link.maxuses,
        totalReceived: link.transactions.filter(t => t.status === 'completed').reduce((sum, t) => sum + t.axcnhamount, 0),
        createdat: link.createdat,
      })),
    });
  } catch (err) {
    next(err);
  }
});

router.get('/payment-link/:code', async (req, res, next) => {
  try {
    const link = await prisma.paymentlink.findUnique({
      where: { linkcode: req.params.code },
      include: { merchant: { select: { businessname: true, businesstype: true } } },
    });

    if (!link) throw createError('Payment link not found', 404);
    if (!link.isactive) throw createError('Payment link is no longer active', 400);
    if (link.expiresat && new Date(link.expiresat) < new Date()) throw createError('Payment link has expired', 400);
    if (link.maxuses && link.usecount >= link.maxuses) throw createError('Payment link usage limit reached', 400);

    res.json({
      success: true,
      data: {
        merchantName: link.merchant.businessname,
        businessType: link.merchant.businesstype,
        amount: link.amount,
        currency: link.currency,
        description: link.description,
      },
    });
  } catch (err) {
    next(err);
  }
});

router.delete('/payment-link/:id', async (req: AuthenticatedRequest, res, next) => {
  try {
    const link = await prisma.paymentlink.findFirst({
      where: { id: req.params.id, merchantid: req.merchantId },
    });

    if (!link) throw createError('Payment link not found', 404);

    await prisma.paymentlink.update({
      where: { id: link.id },
      data: { isactive: false },
    });

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

router.get('/dashboard', async (req: AuthenticatedRequest, res, next) => {
  try {
    const merchant = await prisma.merchant.findUnique({
      where: { id: req.merchantId },
      select: { businessname: true, walletaddress: true, dailyvolume: true, monthlyvolume: true, createdat: true },
    });

    const transactions = await prisma.transaction.findMany({
      where: { merchantid: req.merchantId },
      orderBy: { createdat: 'desc' },
      take: 10,
    });

    const stats = await prisma.transaction.aggregate({
      where: { merchantid: req.merchantId, status: 'completed' },
      _count: true,
      _sum: { axcnhamount: true, fiatamount: true },
    });

    const paymentLinks = await prisma.paymentlink.count({
      where: { merchantid: req.merchantId, isactive: true },
    });

    res.json({
      success: true,
      data: {
        merchant,
        stats: {
          totalTransactions: stats._count,
          totalAxCNH: stats._sum.axcnhamount || 0,
          totalFiat: stats._sum.fiatamount || 0,
          activeLinks: paymentLinks,
        },
        recentTransactions: transactions,
      },
    });
  } catch (err) {
    next(err);
  }
});

router.get('/qr/:linkcode', async (req, res, next) => {
  try {
    const link = await prisma.paymentlink.findUnique({
      where: { linkcode: req.params.linkcode },
    });

    if (!link) throw createError('Payment link not found', 404);

    const qrData = JSON.stringify({
      code: link.linkcode,
      amount: link.amount,
      currency: link.currency,
      merchant: link.merchantid,
    });

    const qrcode = await QRCode.toDataURL(qrData, { width: 300, margin: 2 });

    res.json({ success: true, data: { qrcode, paymentUrl: `${process.env.APP_URL}/pay/${link.linkcode}` } });
  } catch (err) {
    next(err);
  }
});

router.patch('/payout-settings', async (req: AuthenticatedRequest, res, next) => {
  try {
    const { payoutmethod, payoutdetails } = req.body;
    
    await prisma.merchant.update({
      where: { id: req.merchantId },
      data: { payoutmethod, payoutdetails },
    });

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

export default router;