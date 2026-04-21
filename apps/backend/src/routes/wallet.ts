import { Router, Request, Response, NextFunction } from 'express';
import { confluxService } from '../services/confluxService.js';

const router = Router();

// ============================================
// PUBLIC ENDPOINTS - No Authentication Required
// ============================================

// Get wallet balances by address (public - blockchain data)
router.get('/balances', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { address } = req.query;

    if (!address || typeof address !== 'string') {
      return res.status(400).json({
        success: false,
        error: { message: 'Wallet address is required' }
      });
    }

    const [cfxBalance, axcnhBalance] = await Promise.all([
      confluxService.getCFXBalance(address),
      confluxService.getBalance(address, 'AxCNH'),
    ]);

    // Calculate USD value (approximate)
    const usdRate = 0.14;
    const usdValue = parseFloat(axcnhBalance) * usdRate;

    res.json({
      success: true,
      data: {
        AxCNH: axcnhBalance,
        CFX: cfxBalance,
        USD: usdValue.toFixed(2),
        address,
      },
    });
  } catch (err: any) {
    console.error('Wallet balances error:', err.message);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch balances' }
    });
  }
});

// ============================================
// PROTECTED ENDPOINTS - Authentication Required
// ============================================

// Note: Protected routes would go here with auth middleware
// For now, we'll keep them but they're not being used by the frontend

export default router;