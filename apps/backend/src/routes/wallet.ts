import { Router, Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma.js';
import { createError } from '../middleware/errorHandler.js';
import { confluxService } from '../services/confluxService.js';

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

router.get('/balances', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const address = req.user?.walletAddress;

    if (!address) {
      throw createError('Wallet address not found', 400, 'NO_WALLET');
    }

    const [cfxBalance, axcnhBalance] = await Promise.all([
      confluxService.getCFXBalance(address),
      confluxService.getBalance(address, 'AxCNH'),
    ]);

    res.json({
      success: true,
      data: {
        address,
        cfx: {
          balance: cfxBalance,
          symbol: 'CFX',
          decimals: 18,
          explorerUrl: `https://evmtestnet.confluxscan.io/address/${address}`,
        },
        tokens: [
          {
            symbol: 'AxCNH',
            name: 'AxPesa CNH',
            balance: axcnhBalance,
            decimals: 18,
          },
        ],
      },
    });
  } catch (err) {
    next(err);
  }
});

router.get('/balance/:tokenSymbol?', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const address = req.user?.walletAddress;
    const tokenSymbol = (req.params.tokenSymbol || 'AxCNH') as string;

    if (!address) {
      throw createError('Wallet address not found', 400, 'NO_WALLET');
    }

    const balance = await confluxService.getBalance(address, tokenSymbol);

    res.json({
      success: true,
      data: {
        address,
        tokenSymbol,
        balance,
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
