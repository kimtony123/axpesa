import { Router, Request, Response, NextFunction } from 'express';
import type { Router as ExpressRouter } from 'express';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import prisma from '../lib/prisma.js';
import { createError } from '../middleware/errorHandler.js';
import { confluxService } from '../services/confluxService.js';
import { hashIdentifier, maskIdentifier } from '../lib/hash.js';

const router: ExpressRouter = Router();

interface AuthRequest extends Request {
  user?: { merchantId?: string; userId?: string; type: string; walletaddress?: string };
}

const authMiddleware = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const auth = req.headers.authorization;
    if (!auth?.startsWith('Bearer ')) throw createError('Unauthorized', 401);
    const decoded = jwt.verify(auth.split(' ')[1], process.env.JWT_SECRET || 'secret') as any;
    req.user = decoded;
    next();
  } catch (err) {
    next(err);
  }
};

router.use(authMiddleware);

const transferSchema = z.object({
  recipient: z.string().min(1, 'Recipient is required'),
  amount: z.number().positive('Amount must be positive'),
  tokensymbol: z.string().default('AxCNH'),
  note: z.string().optional(),
});

router.post('/lookup', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { recipient } = req.body;
    
    if (!recipient) {
      throw createError('Recipient is required', 400);
    }

    let recipientUser: any = null;
    let recipientaddress = recipient;

    if (recipient.includes('@')) {
      const hashedemail = hashIdentifier(recipient);
      recipientUser = await prisma.user.findFirst({
        where: {
          OR: [
            { email: recipient.toLowerCase() },
            { hashedemail: hashedemail },
          ],
        },
      });
      if (recipientUser) {
        recipientaddress = recipientUser.walletaddress;
      }
    }
    else if (recipient.startsWith('+') || /^\d{10,}$/.test(recipient)) {
      const hashedphone = hashIdentifier(recipient);
      recipientUser = await prisma.user.findFirst({
        where: {
          OR: [
            { phonenumber: recipient },
            { hashedphone: hashedphone },
          ],
        },
      });
      if (recipientUser) {
        recipientaddress = recipientUser.walletaddress;
      }
    }
    else if (recipient.startsWith('0x')) {
      recipientaddress = recipient.toLowerCase();
    }

    if (!recipientUser && !recipient.startsWith('0x')) {
      throw createError('Recipient not found. They must be registered on AxPesa.', 404, 'RECIPIENT_NOT_FOUND');
    }

    res.json({
      success: true,
      data: {
        walletaddress: recipientaddress,
        name: (recipientUser as any)?.name || null,
      },
    });
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { recipient, amount, tokensymbol, note } = transferSchema.parse(req.body);
    const senderaddress = req.user?.walletaddress;

    if (!senderaddress) {
      throw createError('Wallet address not found', 400, 'NO_WALLET');
    }

    let recipientaddress = recipient;
    let recipientUser: any = null;

    if (recipient.includes('@')) {
      const hashedemail = hashIdentifier(recipient);
      recipientUser = await prisma.user.findFirst({
        where: {
          OR: [
            { email: recipient.toLowerCase() },
            { hashedemail: hashedemail },
          ],
        },
      });
      if (!recipientUser) {
        throw createError('No AxPesa user found with this email', 404, 'RECIPIENT_NOT_FOUND');
      }
      recipientaddress = recipientUser.walletaddress;
    } else if (recipient.startsWith('+') || /^\d{10,}$/.test(recipient)) {
      const hashedphone = hashIdentifier(recipient);
      recipientUser = await prisma.user.findFirst({
        where: {
          OR: [
            { phonenumber: recipient },
            { hashedphone: hashedphone },
          ],
        },
      });
      if (!recipientUser) {
        throw createError('No AxPesa user found with this phone number', 404, 'RECIPIENT_NOT_FOUND');
      }
      recipientaddress = recipientUser.walletaddress;
    } else if (!recipient.startsWith('0x') && !recipient.startsWith('cfx:')) {
      throw createError('Invalid recipient format', 400, 'INVALID_RECIPIENT');
    }

    if (recipientaddress.toLowerCase() === senderaddress.toLowerCase()) {
      throw createError('Cannot transfer to yourself', 400, 'SELF_TRANSFER');
    }

    const senderBalance = await confluxService.getBalance(senderaddress, tokensymbol);
    if (parseFloat(senderBalance) < amount) {
      throw createError('Insufficient balance', 400, 'INSUFFICIENT_BALANCE');
    }

    let txhash: string;
    try {
      txhash = await confluxService.transferTokens(recipientaddress, amount, tokensymbol);
    } catch (err: any) {
      throw createError(err.message || 'Transfer failed', 500, 'TRANSFER_FAILED');
    }

    const transaction = await prisma.transaction.create({
      data: {
        transactionid: `TRF-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: 'transfer',
        userid: req.user?.userId,
        walletaddress: senderaddress,
        fiatamount: 0,
        fiatcurrency: tokensymbol,
        usdamount: 0,
        axcnhamount: amount,
        paymentmethod: 'wallet',
        status: 'completed',
        txhash,
        rateused: 0,
        feepercent: 0,
        feeamount: 0,
        totalamount: amount,
        completedat: new Date(),
      },
    });

    res.json({
      success: true,
      data: {
        transactionId: transaction.transactionid,
        txhash,
        amount,
        tokensymbol,
        recipient: recipientaddress,
        recipientMasked: recipientUser 
          ? (recipientUser.email ? maskIdentifier(recipientUser.email) : maskIdentifier(recipientUser.phonenumber || ''))
          : null,
        note,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (err) {
    next(err);
  }
});

router.post('/confirm', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { recipient, amount, txhash } = req.body;
    const senderaddress = req.user?.walletaddress;

    if (!senderaddress) {
      throw createError('Wallet address not found', 400, 'NO_WALLET');
    }

    if (!txhash) {
      throw createError('Transaction hash required', 400);
    }

    const txVerified = await confluxService.verifyTransaction(txhash);
    if (!txVerified) {
      throw createError('Transaction not confirmed on blockchain', 400, 'TX_NOT_CONFIRMED');
    }

    let recipientaddress = recipient;
    if (recipient.includes('@')) {
      const hashedemail = hashIdentifier(recipient);
      const user = await prisma.user.findFirst({
        where: { OR: [{ email: recipient.toLowerCase() }, { hashedemail }] },
      });
      recipientaddress = user?.walletaddress || recipient;
    } else if (recipient.startsWith('+') || /^\d{10,}$/.test(recipient)) {
      const hashedphone = hashIdentifier(recipient);
      const user = await prisma.user.findFirst({
        where: { OR: [{ phonenumber: recipient }, { hashedphone }] },
      });
      recipientaddress = user?.walletaddress || recipient;
    }

    const transaction = await prisma.transaction.create({
      data: {
        transactionid: `TRF-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: 'transfer',
        userid: req.user?.userId,
        walletaddress: senderaddress,
        fiatamount: 0,
        fiatcurrency: 'AxCNH',
        usdamount: 0,
        axcnhamount: amount,
        paymentmethod: 'wallet',
        status: 'completed',
        txhash,
        rateused: 0,
        feepercent: 0,
        feeamount: 0,
        totalamount: amount,
        completedat: new Date(),
      },
    });

    res.json({
      success: true,
      data: {
        transactionId: transaction.transactionid,
        txhash,
        amount,
      },
    });
  } catch (err) {
    next(err);
  }
});

router.get('/history', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { page = '1', limit = '20' } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {
      type: 'transfer',
      OR: [
        { userid: req.user?.userId },
        { walletaddress: req.user?.walletaddress },
      ],
    };

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        orderBy: { createdat: 'desc' },
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

router.get('/balance/:tokenSymbol?', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const tokensymbol = (req.params.tokensymbol || 'AxCNH') as string;
    const senderaddress = req.user?.walletaddress;

    if (!senderaddress) {
      throw createError('Wallet address not found', 400, 'NO_WALLET');
    }

    const balance = await confluxService.getBalance(senderaddress, tokensymbol);
    const cfxBalance = await confluxService.getCFXBalance(senderaddress);

    res.json({
      success: true,
      data: {
        balance,
        cfxBalance,
        tokensymbol,
        address: senderaddress,
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;