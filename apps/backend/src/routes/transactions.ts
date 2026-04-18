import { Router } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma.js';
import { createError } from '../middleware/errorHandler.js';

const router = Router();

interface AuthenticatedRequest extends ReturnType<typeof Router.prototype.handle> {
  user?: { merchantId?: string; userId?: string; type: string };
}

const authMiddleware = async (req: AuthenticatedRequest, res: any, next: any) => {
  try {
    const auth = req.headers.authorization;
    if (!auth?.startsWith('Bearer ')) throw createError('Unauthorized', 401);
    const decoded = jwt.verify(auth.split(' ')[1], process.env.JWT_SECRET || 'secret') as { merchantId?: string; userId?: string; type: string };
    req.user = decoded;
    next();
  } catch (err) {
    next(err);
  }
};

router.use(authMiddleware);

router.get('/', async (req: AuthenticatedRequest, res, next) => {
  try {
    const { page = '1', limit = '20', status, type } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {};
    if (req.user?.merchantId) where.merchantId = req.user.merchantId;
    if (req.user?.userId) where.userId = req.user.userId;
    if (status) where.status = status;
    if (type) where.type = type;

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: Number(limit),
      }),
      prisma.transaction.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        transactions,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
      },
    });
  } catch (err) {
    next(err);
  }
});

router.get('/:transactionId', async (req: AuthenticatedRequest, res, next) => {
  try {
    const transaction = await prisma.transaction.findFirst({
      where: {
        transactionId: req.params.transactionId,
        OR: [
          { merchantId: req.user?.merchantId },
          { userId: req.user?.userId },
        ],
      },
    });

    if (!transaction) throw createError('Transaction not found', 404);

    res.json({ success: true, data: transaction });
  } catch (err) {
    next(err);
  }
});

export default router;
