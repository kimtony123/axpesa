import { Router } from 'express';
import { z } from 'zod';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma.js';
import { createError } from '../middleware/errorHandler.js';
import { verifyToken } from '../middleware/auth.js';

const router = Router();

const stakeSchema = z.object({
  amount: z.number().positive(),
  plan: z.enum(['flexible', '30days', '90days']),
});

router.post('/stake', verifyToken, async (req, res, next) => {
  try {
    const { amount, plan } = stakeSchema.parse(req.body);
    const userId = (req as any).user.userId;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw createError('User not found', 404, 'USER_NOT_FOUND');
    }

    const position = await prisma.stakingPosition.create({
      data: {
        userId,
        positionId: Date.now(),
        plan,
        amount,
        principal: amount,
        startTime: new Date(),
        lastCompoundTime: new Date(),
        isActive: true,
      },
    });

    res.json({
      success: true,
      data: {
        positionId: position.id,
        plan: position.plan,
        amount: position.amount,
        principal: position.principal,
        startTime: position.startTime,
      },
    });
  } catch (err) {
    next(err);
  }
});

router.get('/positions', verifyToken, async (req, res, next) => {
  try {
    const userId = (req as any).user.userId;

    const positions = await prisma.stakingPosition.findMany({
      where: { userId, isActive: true },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      success: true,
      data: positions,
    });
  } catch (err) {
    next(err);
  }
});

router.get('/positions/:id', verifyToken, async (req, res, next) => {
  try {
    const userId = (req as any).user.userId;
    const positionId = req.params.id;

    const position = await prisma.stakingPosition.findFirst({
      where: { id: positionId, userId },
    });

    if (!position) {
      throw createError('Position not found', 404, 'POSITION_NOT_FOUND');
    }

    res.json({
      success: true,
      data: position,
    });
  } catch (err) {
    next(err);
  }
});

router.post('/unstake/:id', verifyToken, async (req, res, next) => {
  try {
    const userId = (req as any).user.userId;
    const positionId = req.params.id;

    const position = await prisma.stakingPosition.findFirst({
      where: { id: positionId, userId, isActive: true },
    });

    if (!position) {
      throw createError('Position not found', 404, 'POSITION_NOT_FOUND');
    }

    const now = new Date();
    const startTime = new Date(position.startTime);
    let canUnstake = true;
    let penalty = 0;

    if (position.plan === '30days') {
      const daysDiff = (now.getTime() - startTime.getTime()) / (1000 * 60 * 60 * 24);
      if (daysDiff < 30) {
        canUnstake = false;
        penalty = position.amount * 0.1;
      }
    } else if (position.plan === '90days') {
      const daysDiff = (now.getTime() - startTime.getTime()) / (1000 * 60 * 60 * 24);
      if (daysDiff < 90) {
        canUnstake = false;
        penalty = position.amount * 0.1;
      }
    }

    if (!canUnstake) {
      throw createError('Lock period not ended. 10% penalty applies.', 400, 'LOCK_ACTIVE');
    }

    await prisma.stakingPosition.update({
      where: { id: positionId },
      data: { isActive: false },
    });

    await prisma.stakingReward.create({
      data: {
        userId,
        positionId: position.positionId,
        amount: position.amount,
        type: penalty > 0 ? 'unstake_with_penalty' : 'unstake',
      },
    });

    res.json({
      success: true,
      data: {
        amount: position.amount - penalty,
        penalty,
      },
    });
  } catch (err) {
    next(err);
  }
});

router.get('/stats', async (req, res, next) => {
  try {
    const stats = await prisma.stakingStats.findFirst({
      orderBy: { updatedAt: 'desc' },
    });

    const totalStaked = await prisma.stakingPosition.aggregate({
      where: { isActive: true },
      _sum: { amount: true },
    });

    const totalRewards = await prisma.stakingReward.aggregate({
      where: { type: { in: ['compound', 'claim'] } },
      _sum: { amount: true },
    });

    res.json({
      success: true,
      data: {
        totalStakedAmount: totalStaked._sum.amount || 0,
        totalRewardsDistributed: totalRewards._sum.amount || 0,
        rewardPoolBalance: stats?.rewardPoolBalance || 0,
      },
    });
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
