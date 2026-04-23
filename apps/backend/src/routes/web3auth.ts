import { Router } from 'express';
import type { Router as ExpressRouter } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma.js';
import { createError } from '../middleware/errorHandler.js';
import { confluxService } from '../services/confluxService.js';

const router: ExpressRouter = Router();

const NEW_USER_CFX_AMOUNT = 0.1;

router.post('/verify', async (req, res, next) => {
  try {
    throw createError('Web3Auth not supported - use MetaMask', 501, 'NOT_SUPPORTED');
  } catch (err) {
    next(err);
  }
});

router.post('/refresh', async (req, res, next) => {
  try {
    const auth = req.headers.authorization;
    if (!auth?.startsWith('Bearer ')) {
      throw createError('Unauthorized', 401);
    }

    const decoded = jwt.verify(auth.split(' ')[1], process.env.JWT_SECRET || 'secret') as any;
    
    if (decoded.type !== 'web3auth') {
      throw createError('Invalid token type', 401);
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user) {
      throw createError('User not found', 404);
    }

    const token = jwt.sign(
      { 
        userId: user.id, 
        walletaddress: user.walletaddress, 
        type: 'web3auth' 
      },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '30d' }
    );

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          walletaddress: user.walletaddress,
          kyctier: user.kyctier,
        },
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;