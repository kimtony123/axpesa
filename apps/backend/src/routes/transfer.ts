import { Router, Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import prisma from '../lib/prisma.js';
import { createError } from '../middleware/errorHandler.js';
import { confluxService } from '../services/confluxService.js';
import { hashIdentifier, maskIdentifier } from '../lib/hash.js';

const router = Router();

interface AuthRequest extends Request {
  user?: { merchantId?: string; userId?: string; type: string; walletAddress?: string };
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
  tokenSymbol: z.string().default('AxCNH'),
  note: z.string().optional(),
});

// Lookup recipient by phone or wallet address (public - no auth needed)
router.post('/lookup', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { recipient } = req.body;
    
    if (!recipient) {
      throw createError('Recipient is required', 400);
    }

    let recipientUser = null;
    let recipientAddress = recipient;

    // Check if it's an email
    if (recipient.includes('@')) {
      const hashedEmail = hashIdentifier(recipient);
      recipientUser = await prisma.user.findFirst({
        where: {
          OR: [
            { email: recipient.toLowerCase() },
            { hashedEmail: hashedEmail },
          ],
        },
      });
      if (recipientUser) {
        recipientAddress = recipientUser.walletAddress;
      }
    }
    // Check if it's a phone number
    else if (recipient.startsWith('+') || /^\d{10,}$/.test(recipient)) {
      const hashedPhone = hashIdentifier(recipient);
      recipientUser = await prisma.user.findFirst({
        where: {
          OR: [
            { phoneNumber: recipient },
            { hashedPhone: hashedPhone },
          ],
        },
      });
      if (recipientUser) {
        recipientAddress = recipientUser.walletAddress;
      }
    }
    // Check if it's already a wallet address
    else if (recipient.startsWith('0x')) {
      recipientAddress = recipient.toLowerCase();
    }

    if (!recipientUser && !recipient.startsWith('0x')) {
      throw createError('Recipient not found. They must be registered on AxPesa.', 404, 'RECIPIENT_NOT_FOUND');
    }

    res.json({
      success: true,
      data: {
        walletAddress: recipientAddress,
        name: recipientUser?.name || null,
      },
    });
  } catch (err) {
    next(err);
  }
});

// Apply auth middleware for protected routes
router.use(authMiddleware);

router.post('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { recipient, amount, tokenSymbol, note } = transferSchema.parse(req.body);
    const senderAddress = req.user?.walletAddress;

    if (!senderAddress) {
      throw createError('Wallet address not found', 400, 'NO_WALLET');
    }

    let recipientAddress = recipient;
    let recipientUser = null;

    if (recipient.includes('@')) {
      const hashedEmail = hashIdentifier(recipient);
      recipientUser = await prisma.user.findFirst({
        where: {
          OR: [
            { email: recipient.toLowerCase() },
            { hashedEmail: hashedEmail },
          ],
        },
      });
      if (!recipientUser) {
        throw createError('No AxPesa user found with this email', 404, 'RECIPIENT_NOT_FOUND');
      }
      recipientAddress = recipientUser.walletAddress;
    } else if (recipient.startsWith('+') || /^\d{10,}$/.test(recipient)) {
      const hashedPhone = hashIdentifier(recipient);
      recipientUser = await prisma.user.findFirst({
        where: {
          OR: [
            { phoneNumber: recipient },
            { hashedPhone: hashedPhone },
          ],
        },
      });
      if (!recipientUser) {
        throw createError('No AxPesa user found with this phone number', 404, 'RECIPIENT_NOT_FOUND');
      }
      recipientAddress = recipientUser.walletAddress;
    } else if (!recipient.startsWith('0x') && !recipient.startsWith('cfx:')) {
      throw createError('Invalid recipient format', 400, 'INVALID_RECIPIENT');
    }

    if (recipientAddress.toLowerCase() === senderAddress.toLowerCase()) {
      throw createError('Cannot transfer to yourself', 400, 'SELF_TRANSFER');
    }

    const senderBalance = await confluxService.getBalance(senderAddress, tokenSymbol);
    if (parseFloat(senderBalance) < amount) {
      throw createError('Insufficient balance', 400, 'INSUFFICIENT_BALANCE');
    }

    let txHash: string;
    try {
      txHash = await confluxService.transferTokens(recipientAddress, amount, tokenSymbol);
    } catch (err: any) {
      throw createError(err.message || 'Transfer failed', 500, 'TRANSFER_FAILED');
    }

    const transaction = await prisma.transaction.create({
      data: {
        transactionId: `TRF-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: 'transfer',
        userId: req.user?.userId,
        walletAddress: senderAddress,
        fiatAmount: 0,
        fiatCurrency: tokenSymbol,
        usdAmount: 0,
        axcnhAmount: amount,
        paymentMethod: 'wallet',
        status: 'completed',
        txHash,
        rateUsed: 0,
        feePercent: 0,
        feeAmount: 0,
        totalAmount: amount,
        completedAt: new Date(),
      },
    });

    res.json({
      success: true,
      data: {
        transactionId: transaction.transactionId,
        txHash,
        amount,
        tokenSymbol,
        recipient: recipientAddress,
        recipientMasked: recipientUser 
          ? (recipientUser.email ? maskIdentifier(recipientUser.email) : maskIdentifier(recipientUser.phoneNumber || ''))
          : null,
        note,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (err) {
    next(err);
  }
});

// Confirm transfer after blockchain transaction
router.post('/confirm', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { recipient, amount, txHash } = req.body;
    const senderAddress = req.user?.walletAddress;

    if (!senderAddress) {
      throw createError('Wallet address not found', 400, 'NO_WALLET');
    }

    if (!txHash) {
      throw createError('Transaction hash required', 400);
    }

    // Verify the blockchain transaction
    const txVerified = await confluxService.verifyTransaction(txHash);
    if (!txVerified) {
      throw createError('Transaction not confirmed on blockchain', 400, 'TX_NOT_CONFIRMED');
    }

    // Resolve recipient address
    let recipientAddress = recipient;
    if (recipient.includes('@')) {
      const hashedEmail = hashIdentifier(recipient);
      const user = await prisma.user.findFirst({
        where: { OR: [{ email: recipient.toLowerCase() }, { hashedEmail }] },
      });
      recipientAddress = user?.walletAddress || recipient;
    } else if (recipient.startsWith('+') || /^\d{10,}$/.test(recipient)) {
      const hashedPhone = hashIdentifier(recipient);
      const user = await prisma.user.findFirst({
        where: { OR: [{ phoneNumber: recipient }, { hashedPhone }] },
      });
      recipientAddress = user?.walletAddress || recipient;
    }

    // Record the transaction
    const transaction = await prisma.transaction.create({
      data: {
        transactionId: `TRF-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: 'transfer',
        userId: req.user?.userId,
        walletAddress: senderAddress,
        fiatAmount: 0,
        fiatCurrency: 'AxCNH',
        usdAmount: 0,
        axcnhAmount: amount,
        paymentMethod: 'wallet',
        status: 'completed',
        txHash,
        rateUsed: 0,
        feePercent: 0,
        feeAmount: 0,
        totalAmount: amount,
        completedAt: new Date(),
      },
    });

    res.json({
      success: true,
      data: {
        transactionId: transaction.transactionId,
        txHash,
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
        { userId: req.user?.userId },
        { walletAddress: req.user?.walletAddress },
      ],
    };

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

router.get('/balance/:tokenSymbol?', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const tokenSymbol = (req.params.tokenSymbol || 'AxCNH') as string;
    const senderAddress = req.user?.walletAddress;

    if (!senderAddress) {
      throw createError('Wallet address not found', 400, 'NO_WALLET');
    }

    const balance = await confluxService.getBalance(senderAddress, tokenSymbol);
    const cfxBalance = await confluxService.getCFXBalance(senderAddress);

    res.json({
      success: true,
      data: {
        balance,
        cfxBalance,
        tokenSymbol,
        address: senderAddress,
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
