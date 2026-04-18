import { Router } from 'express';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken';
import QRCode from 'qrcode';
import prisma from '../lib/prisma.js';
import { createError } from '../middleware/errorHandler.js';

const router = Router();

interface AuthenticatedRequest extends ReturnType<typeof Router.prototype.handle> {
  merchantId?: string;
}

const createLinkSchema = z.object({
  amount: z.number().optional(),
  currency: z.string().default('AXCNH'),
  description: z.string().optional(),
  maxUses: z.number().optional(),
  expiresAt: z.string().optional(),
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
    const linkCode = `pay_${uuidv4().slice(0, 12)}`;

    const paymentLink = await prisma.paymentLink.create({
      data: {
        linkCode,
        merchantId: req.merchantId!,
        amount: data.amount,
        currency: data.currency,
        description: data.description,
        maxUses: data.maxUses,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
      },
    });

    const paymentUrl = `${process.env.APP_URL}/pay/${linkCode}`;

    res.json({
      success: true,
      data: {
        id: paymentLink.id,
        linkCode,
        url: paymentUrl,
        amount: paymentLink.amount,
        currency: paymentLink.currency,
        description: paymentLink.description,
      },
    });
  } catch (err) {
    next(err);
  }
});

router.get('/payment-links', async (req: AuthenticatedRequest, res, next) => {
  try {
    const links = await prisma.paymentLink.findMany({
      where: { merchantId: req.merchantId },
      include: { transactions: { select: { id: true, axcnhAmount: true, status: true } } },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      success: true,
      data: links.map(link => ({
        id: link.id,
        linkCode: link.linkCode,
        url: `${process.env.APP_URL}/pay/${link.linkCode}`,
        amount: link.amount,
        currency: link.currency,
        description: link.description,
        isActive: link.isActive,
        useCount: link.useCount,
        maxUses: link.maxUses,
        totalReceived: link.transactions.filter(t => t.status === 'completed').reduce((sum, t) => sum + t.axcnhAmount, 0),
        createdAt: link.createdAt,
      })),
    });
  } catch (err) {
    next(err);
  }
});

router.get('/payment-link/:code', async (req, res, next) => {
  try {
    const link = await prisma.paymentLink.findUnique({
      where: { linkCode: req.params.code },
      include: { merchant: { select: { businessName: true, businessType: true } } },
    });

    if (!link) throw createError('Payment link not found', 404);
    if (!link.isActive) throw createError('Payment link is no longer active', 400);
    if (link.expiresAt && new Date(link.expiresAt) < new Date()) throw createError('Payment link has expired', 400);
    if (link.maxUses && link.useCount >= link.maxUses) throw createError('Payment link usage limit reached', 400);

    res.json({
      success: true,
      data: {
        merchantName: link.merchant.businessName,
        businessType: link.merchant.businessType,
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
    const link = await prisma.paymentLink.findFirst({
      where: { id: req.params.id, merchantId: req.merchantId },
    });

    if (!link) throw createError('Payment link not found', 404);

    await prisma.paymentLink.update({
      where: { id: link.id },
      data: { isActive: false },
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
      select: { businessName: true, walletAddress: true, dailyVolume: true, monthlyVolume: true, createdAt: true },
    });

    const transactions = await prisma.transaction.findMany({
      where: { merchantId: req.merchantId },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    const stats = await prisma.transaction.aggregate({
      where: { merchantId: req.merchantId, status: 'completed' },
      _count: true,
      _sum: { axcnhAmount: true, fiatAmount: true },
    });

    const paymentLinks = await prisma.paymentLink.count({
      where: { merchantId: req.merchantId, isActive: true },
    });

    res.json({
      success: true,
      data: {
        merchant,
        stats: {
          totalTransactions: stats._count,
          totalAxCNH: stats._sum.axcnhAmount || 0,
          totalFiat: stats._sum.fiatAmount || 0,
          activeLinks: paymentLinks,
        },
        recentTransactions: transactions,
      },
    });
  } catch (err) {
    next(err);
  }
});

router.get('/qr/:linkCode', async (req, res, next) => {
  try {
    const link = await prisma.paymentLink.findUnique({
      where: { linkCode: req.params.linkCode },
    });

    if (!link) throw createError('Payment link not found', 404);

    const qrData = JSON.stringify({
      code: link.linkCode,
      amount: link.amount,
      currency: link.currency,
      merchant: link.merchantId,
    });

    const qrCode = await QRCode.toDataURL(qrData, { width: 300, margin: 2 });

    res.json({ success: true, data: { qrCode, paymentUrl: `${process.env.APP_URL}/pay/${link.linkCode}` } });
  } catch (err) {
    next(err);
  }
});

router.patch('/payout-settings', async (req: AuthenticatedRequest, res, next) => {
  try {
    const { payoutMethod, payoutDetails } = req.body;
    
    await prisma.merchant.update({
      where: { id: req.merchantId },
      data: { payoutMethod, payoutDetails },
    });

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

export default router;
