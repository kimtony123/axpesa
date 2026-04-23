import { Router } from 'express';
import type { Router as ExpressRouter } from 'express';
import prisma from '../lib/prisma.js';
import confluxService from '../services/confluxService.js';
import { createError } from '../middleware/errorHandler.js';
import { strictRateLimiter } from '../middleware/rateLimiter.js';

const router: ExpressRouter = Router();

const FAUCET_AMOUNT = 100;
const CFX_FAUCET_AMOUNT = 0.1;
const CLAIM_COOLDOWN = 3600000;

router.post('/claim', strictRateLimiter, async (req, res, next) => {
  try {
    const { walletaddress } = req.body;

    if (!walletaddress || !walletaddress.startsWith('0x')) {
      throw createError('Invalid wallet address', 400);
    }

    const walletAddress = walletaddress.toLowerCase();

    let user = await prisma.user.findUnique({
      where: { walletaddress: walletAddress },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          walletaddress: walletAddress,
          phonenumber: 'FAUCET_CLAIM',
        },
      });
    }

    const recentFaucetClaim = await prisma.transaction.findFirst({
      where: {
        walletaddress: walletAddress,
        type: 'faucet',
        createdat: {
          gte: new Date(Date.now() - CLAIM_COOLDOWN),
        },
      },
    });

    if (recentFaucetClaim) {
      const timeRemaining = Math.ceil((CLAIM_COOLDOWN - (Date.now() - recentFaucetClaim.createdat.getTime())) / 1000 / 60);
      throw createError(
        `Please wait ${timeRemaining} minutes before claiming again`,
        429,
        'COOLDOWN_ACTIVE'
      );
    }

    const faucetBalance = await confluxService.getBalance(process.env.ADMIN_SIGNER_1 || '', 'AxCNH');

    if (parseFloat(faucetBalance) < FAUCET_AMOUNT) {
      throw createError('Faucet is empty. Please try again later.', 503, 'FAUCET_EMPTY');
    }

    const txhash = await confluxService.mintTokens(walletAddress, FAUCET_AMOUNT, 'AxCNH');

    await prisma.transaction.create({
      data: {
        transactionid: `faucet_${Date.now()}`,
        type: 'faucet',
        userid: user.id,
        walletaddress: walletAddress,
        axcnhamount: FAUCET_AMOUNT,
        status: 'completed',
        txhash,
        fiatamount: 0,
        fiatcurrency: 'CNY',
        usdamount: 0,
        paymentmethod: 'faucet',
        feepercent: 0,
        feeamount: 0,
        totalamount: 0,
        rateused: 0,
      },
    });

    res.json({
      success: true,
      data: {
        message: `Successfully claimed ${FAUCET_AMOUNT} AxCNH`,
        amount: FAUCET_AMOUNT,
        txHash: txhash,
        nextClaim: new Date(Date.now() + CLAIM_COOLDOWN).toISOString(),
      },
    });
  } catch (err) {
    next(err);
  }
});

router.post('/claim-cfx', strictRateLimiter, async (req, res, next) => {
  try {
    const { walletaddress } = req.body;

    if (!walletaddress || (!walletaddress.startsWith('0x') && !walletaddress.startsWith('cfx:'))) {
      throw createError('Invalid wallet address', 400);
    }

    const normalizedAddress = walletaddress.startsWith('cfx:') 
      ? walletaddress.toLowerCase()
      : walletaddress.toLowerCase();

    const cfxBalance = await confluxService.getCFXBalance(normalizedAddress);
    
    if (parseFloat(cfxBalance) >= CFX_FAUCET_AMOUNT) {
      throw createError(
        `You already have ${parseFloat(cfxBalance).toFixed(4)} CFX. No need for more!`,
        400,
        'ALREADY_FUNDED'
      );
    }

    console.log(`Sending ${CFX_FAUCET_AMOUNT} CFX to ${normalizedAddress} for gas fees`);
    
    const txhash = await confluxService.sendCFX(normalizedAddress, CFX_FAUCET_AMOUNT);

    res.json({
      success: true,
      data: {
        message: `Successfully sent ${CFX_FAUCET_AMOUNT} CFX for gas fees`,
        amount: CFX_FAUCET_AMOUNT,
        txHash: txhash,
        explorerUrl: `https://evmtestnet.confluxscan.io/tx/${txhash}`,
      },
    });
  } catch (err) {
    next(err);
  }
});

router.get('/status/:walletaddress', async (req, res) => {
  try {
    const { walletaddress } = req.params;
    const walletAddress = walletaddress.toLowerCase();

    const lastClaim = await prisma.transaction.findFirst({
      where: {
        walletaddress: walletAddress,
        type: 'faucet',
      },
      orderBy: {
        createdat: 'desc',
      },
    });

    let canClaim = true;
    let timeUntilNextClaim = 0;

    if (lastClaim) {
      const timeSinceClaim = Date.now() - lastClaim.createdat.getTime();
      if (timeSinceClaim < CLAIM_COOLDOWN) {
        canClaim = false;
        timeUntilNextClaim = CLAIM_COOLDOWN - timeSinceClaim;
      }
    }

    const faucetBalance = await confluxService.getBalance(process.env.ADMIN_SIGNER_1 || '', 'AxCNH');

    res.json({
      success: true,
      data: {
        walletaddress: walletAddress,
        canClaim: canClaim && parseFloat(faucetBalance) >= FAUCET_AMOUNT,
        timeUntilNextClaim: Math.ceil(timeUntilNextClaim / 1000 / 60),
        lastClaimedAmount: lastClaim?.axcnhamount || null,
        lastClaimedAt: lastClaim?.createdat || null,
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