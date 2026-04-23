import { Router } from 'express';
import type { Router as ExpressRouter } from 'express';
import prisma from '../lib/prisma.js';
import confluxService from '../services/confluxService.js';
import { createError } from '../middleware/errorHandler.js';
import { strictRateLimiter } from '../middleware/rateLimiter.js';

const router: ExpressRouter = Router();

const FAUCET_AMOUNT = 100; // 100 AxCNH per claim
const CFX_FAUCET_AMOUNT = 0.1; // 0.1 CFX per claim (for gas fees)
const CLAIM_COOLDOWN = 3600000; // 1 hour in milliseconds

router.post('/claim', strictRateLimiter, async (req, res, next) => {
  try {
    const { walletAddress } = req.body;

    if (!walletAddress || !walletAddress.startsWith('0x')) {
      throw createError('Invalid wallet address', 400);
    }

    // Check if wallet exists in our system or create new user
    let user = await prisma.user.findUnique({
      where: { walletAddress },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          walletAddress,
          phoneNumber: 'FAUCET_CLAIM',
        },
      });
    }

    // Check for recent claim
    const recentFaucetClaim = await prisma.transaction.findFirst({
      where: {
        walletAddress,
        type: 'faucet',
        createdAt: {
          gte: new Date(Date.now() - CLAIM_COOLDOWN),
        },
      },
    });

    if (recentFaucetClaim) {
      const timeRemaining = Math.ceil((CLAIM_COOLDOWN - (Date.now() - recentFaucetClaim.createdAt.getTime())) / 1000 / 60);
      throw createError(
        `Please wait ${timeRemaining} minutes before claiming again`,
        429,
        'COOLDOWN_ACTIVE'
      );
    }

    // Check hot wallet (deployer) balance for faucet
    const faucetBalance = await confluxService.getBalance(process.env.ADMIN_SIGNER_1 || '', 'AxCNH');

    if (parseFloat(faucetBalance) < FAUCET_AMOUNT) {
      throw createError('Faucet is empty. Please try again later.', 503, 'FAUCET_EMPTY');
    }

    // Mint AxCNH from hot wallet to user
    const txHash = await confluxService.mintTokens(walletAddress, FAUCET_AMOUNT, 'AxCNH');

    // Record the claim
    await prisma.transaction.create({
      data: {
        transactionId: `faucet_${Date.now()}`,
        type: 'faucet',
        userId: user.id,
        walletAddress,
        axcnhAmount: FAUCET_AMOUNT,
        status: 'completed',
        txHash,
        fiatAmount: 0,
        fiatCurrency: 'CNY',
        usdAmount: 0,
        paymentMethod: 'faucet',
        feePercent: 0,
        feeAmount: 0,
        totalAmount: 0,
        rateUsed: 0,
      },
    });

    res.json({
      success: true,
      data: {
        message: `Successfully claimed ${FAUCET_AMOUNT} AxCNH`,
        amount: FAUCET_AMOUNT,
        txHash,
        nextClaim: new Date(Date.now() + CLAIM_COOLDOWN).toISOString(),
      },
    });
  } catch (err) {
    next(err);
  }
});

router.post('/claim-cfx', strictRateLimiter, async (req, res, next) => {
  try {
    const { walletAddress } = req.body;

    if (!walletAddress || (!walletAddress.startsWith('0x') && !walletAddress.startsWith('cfx:'))) {
      throw createError('Invalid wallet address', 400);
    }

    const normalizedAddress = walletAddress.startsWith('cfx:') 
      ? walletAddress 
      : walletAddress;

    const cfxBalance = await confluxService.getCFXBalance(normalizedAddress);
    
    if (parseFloat(cfxBalance) >= CFX_FAUCET_AMOUNT) {
      throw createError(
        `You already have ${parseFloat(cfxBalance).toFixed(4)} CFX. No need for more!`,
        400,
        'ALREADY_FUNDED'
      );
    }

    console.log(`💰 Sending ${CFX_FAUCET_AMOUNT} CFX to ${normalizedAddress} for gas fees`);
    
    const txHash = await confluxService.sendCFX(normalizedAddress, CFX_FAUCET_AMOUNT);

    res.json({
      success: true,
      data: {
        message: `Successfully sent ${CFX_FAUCET_AMOUNT} CFX for gas fees`,
        amount: CFX_FAUCET_AMOUNT,
        txHash,
        explorerUrl: `https://evmtestnet.confluxscan.io/tx/${txHash}`,
      },
    });
  } catch (err) {
    next(err);
  }
});

router.get('/status/:walletAddress', async (req, res) => {
  try {
    const { walletAddress } = req.params;

    const lastClaim = await prisma.transaction.findFirst({
      where: {
        walletAddress,
        type: 'faucet',
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    let canClaim = true;
    let timeUntilNextClaim = 0;

    if (lastClaim) {
      const timeSinceClaim = Date.now() - lastClaim.createdAt.getTime();
      if (timeSinceClaim < CLAIM_COOLDOWN) {
        canClaim = false;
        timeUntilNextClaim = CLAIM_COOLDOWN - timeSinceClaim;
      }
    }

    const faucetBalance = await confluxService.getBalance(process.env.ADMIN_SIGNER_1 || '', 'AxCNH');

    res.json({
      success: true,
      data: {
        walletAddress,
        canClaim: canClaim && parseFloat(faucetBalance) >= FAUCET_AMOUNT,
        timeUntilNextClaim: Math.ceil(timeUntilNextClaim / 1000 / 60), // minutes
        lastClaimedAmount: lastClaim?.axcnhAmount || null,
        lastClaimedAt: lastClaim?.createdAt || null,
        faucetAmount: FAUCET_AMOUNT,
        faucetBalance: parseFloat(faucetBalance),
      },
    });
  } catch (error) {
    res.json({
      success: true,
      data: {
        canClaim: false,
        timeUntilNextClaim: 0,
        faucetAmount: FAUCET_AMOUNT,
        faucetBalance: 0,
        error: 'Unable to fetch faucet status',
      },
    });
  }
});

export default router;
