import { Router } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma.js';
import { verifyWeb3AuthToken } from '../services/web3authService.js';
import { createError } from '../middleware/errorHandler.js';
import { hashIdentifier } from '../lib/hash.js';
import { confluxService } from '../services/confluxService.js';

const router = Router();

const NEW_USER_CFX_AMOUNT = 0.1;

router.post('/verify', async (req, res, next) => {
  try {
    const { idToken } = req.body;
    
    if (!idToken) {
      throw createError('Token required', 400, 'TOKEN_REQUIRED');
    }

    // Verify Web3Auth token and get user info
    const userInfo = await verifyWeb3AuthToken(idToken);
    
    if (!userInfo.walletAddress) {
      throw createError('No wallet address in token', 400, 'NO_WALLET');
    }

    // Hash identifiers for privacy
    const hashedEmail = userInfo.email ? hashIdentifier(userInfo.email) : null;

    // Find or create user
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { web3auth_id: userInfo.web3authId },
          { walletAddress: userInfo.walletAddress.toLowerCase() },
          ...(userInfo.email ? [{ email: userInfo.email.toLowerCase() }, { hashedEmail }] : []),
        ],
      },
    });

    let isNewUser = false;
    let cfxSent = false;
    let cfxTxHash = null;

    if (!user) {
      isNewUser = true;
      user = await prisma.user.create({
        data: {
          web3auth_id: userInfo.web3authId,
          email: userInfo.email?.toLowerCase(),
          hashedEmail,
          walletAddress: userInfo.walletAddress.toLowerCase(),
          phoneNumber: userInfo.web3authId ? `w3a_${userInfo.web3authId.slice(0, 8)}` : null,
        },
      });

      // Auto-send CFX to new users for gas fees
      try {
        const cfxBalance = await confluxService.getCFXBalance(userInfo.walletAddress);
        if (parseFloat(cfxBalance) < NEW_USER_CFX_AMOUNT) {
          console.log(`💰 Sending ${NEW_USER_CFX_AMOUNT} CFX to new user ${userInfo.walletAddress}`);
          cfxTxHash = await confluxService.sendCFX(userInfo.walletAddress, NEW_USER_CFX_AMOUNT);
          cfxSent = true;
        } else {
          console.log(`ℹ️ User ${userInfo.walletAddress} already has CFX: ${cfxBalance}`);
        }
      } catch (cfxError) {
        console.error('⚠️ Failed to send CFX to new user:', cfxError);
      }
    } else {
      // Update user info if changed
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          web3auth_id: userInfo.web3authId || user.web3auth_id,
          email: userInfo.email?.toLowerCase() || user.email,
          hashedEmail: hashedEmail || user.hashedEmail,
        },
      });
    }

    // Get current CFX balance
    let cfxBalance = '0';
    try {
      cfxBalance = await confluxService.getCFXBalance(user.walletAddress);
    } catch {
      // Ignore balance errors
    }

    // Generate AxPesa JWT
    const token = jwt.sign(
      { 
        userId: user.id, 
        walletAddress: user.walletAddress, 
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
          walletAddress: user.walletAddress,
          kycTier: user.kycTier,
        },
        type: 'web3auth',
        isNewUser,
        cfx: {
          balance: cfxBalance,
          sent: cfxSent,
          txHash: cfxTxHash,
          amount: cfxSent ? NEW_USER_CFX_AMOUNT : null,
        },
      },
    });
  } catch (err: any) {
    if (err.message.includes('verification failed')) {
      return res.status(401).json({
        success: false,
        error: { message: 'Invalid Web3Auth token', code: 'INVALID_TOKEN' }
      });
    }
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

    // Generate new token
    const token = jwt.sign(
      { 
        userId: user.id, 
        walletAddress: user.walletAddress, 
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
          walletAddress: user.walletAddress,
          kycTier: user.kycTier,
        },
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
