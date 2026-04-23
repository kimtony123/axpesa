import { Router } from 'express';
import type { Router as ExpressRouter } from 'express';
import { createError } from '../middleware/errorHandler.js';

const router: ExpressRouter = Router();

router.post('/stake', async (req, res, next) => {
  try {
    throw createError('Staking is not available yet', 503, 'STAKING_UNAVAILABLE');
  } catch (err) {
    next(err);
  }
});

router.get('/positions', async (req, res, next) => {
  try {
    throw createError('Staking is not available yet', 503, 'STAKING_UNAVAILABLE');
  } catch (err) {
    next(err);
  }
});

router.get('/positions/:id', async (req, res, next) => {
  try {
    throw createError('Staking is not available yet', 503, 'STAKING_UNAVAILABLE');
  } catch (err) {
    next(err);
  }
});

router.post('/unstake/:id', async (req, res, next) => {
  try {
    throw createError('Staking is not available yet', 503, 'STAKING_UNAVAILABLE');
  } catch (err) {
    next(err);
  }
});

router.get('/stats', async (req, res, next) => {
  try {
    throw createError('Staking is not available yet', 503, 'STAKING_UNAVAILABLE');
  } catch (err) {
    next(err);
  }
});

router.get('/plans', (req, res) => {
  res.json({
    success: true,
    data: [
      {
        id: 'flexible',
        name: 'Flexible',
        apy: 5,
        lockPeriod: 'No lock',
        minStake: 5,
        penalty: 0,
        description: 'Earn 5% APY with no lock period. Withdraw anytime.',
      },
      {
        id: '30days',
        name: '30-Day',
        apy: 8,
        lockPeriod: '30 days',
        minStake: 5,
        penalty: 10,
        description: 'Earn 8% APY with a 30-day lock. 10% early unstake penalty.',
      },
      {
        id: '90days',
        name: '90-Day',
        apy: 12,
        lockPeriod: '90 days',
        minStake: 5,
        penalty: 10,
        description: 'Earn 12% APY with a 90-day lock. 10% early unstake penalty.',
      },
    ],
  });
});

export default router;