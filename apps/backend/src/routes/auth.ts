import { Router } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { recoverAddress } from 'ethers';
import prisma from '../lib/prisma.js';
import { createError } from '../middleware/errorHandler.js';

const router = Router();

const verifyWalletSchema = z.object({
  address: z.string(),
  signature: z.string(),
});

const userRegisterSchema = z.object({
  walletAddress: z.string().startsWith('0x', 'Invalid wallet address'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phoneNumber: z.string().min(10, 'Phone number must be at least 10 digits'),
  signature: z.string(),
});

router.post('/register', async (req, res, next) => {
  try {
    const { walletAddress, name, phoneNumber, signature } = userRegisterSchema.parse(req.body);
    
    // Verify signature to prove wallet ownership
    const message = `Register to AxPesa: ${walletAddress.toLowerCase()}`;
    let recoveredAddress;
    try {
      recoveredAddress = await recoverAddress(message, signature);
    } catch {
      throw createError('Invalid signature', 401, 'INVALID_SIGNATURE');
    }
    
    if (recoveredAddress.toLowerCase() !== walletAddress.toLowerCase()) {
      throw createError('Signature verification failed', 401, 'INVALID_SIGNATURE');
    }
    
    // Check if user already exists
    const existing = await prisma.user.findUnique({ 
      where: { walletAddress: walletAddress.toLowerCase() } 
    });
    if (existing) {
      throw createError('Wallet already registered', 400, 'WALLET_EXISTS');
    }
    
    // Create user
    const user = await prisma.user.create({
      data: {
        walletAddress: walletAddress.toLowerCase(),
        name,
        phoneNumber,
      },
    });
    
    const token = jwt.sign(
      { userId: user.id, walletAddress: user.walletAddress, type: 'wallet' },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '30d' }
    );
    
    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          walletAddress: user.walletAddress,
          name: user.name,
          phoneNumber: user.phoneNumber,
          kycTier: user.kycTier,
        },
      },
    });
  } catch (err) {
    next(err);
  }
});

router.post('/verify-wallet', async (req, res, next) => {
  try {
    const { address, signature } = verifyWalletSchema.parse(req.body);
    
    const message = `Sign this message to login to AxPesa: ${address.toLowerCase()}`;
    
    let recoveredAddress: string;
    try {
      recoveredAddress = await recoverAddress(message, signature);
    } catch {
      throw createError('Invalid signature format', 401, 'INVALID_SIGNATURE');
    }

    if (recoveredAddress.toLowerCase() !== address.toLowerCase()) {
      throw createError('Invalid signature', 401, 'INVALID_SIGNATURE');
    }

    let user = await prisma.user.findUnique({ where: { walletAddress: address.toLowerCase() } });
    
    if (!user) {
      throw createError('User not registered. Please create an account first.', 404, 'USER_NOT_REGISTERED');
    }

    const token = jwt.sign(
      { userId: user.id, walletAddress: user.walletAddress, type: 'wallet' },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '30d' }
    );

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          walletAddress: user.walletAddress,
          name: user.name,
          phoneNumber: user.phoneNumber,
          kycTier: user.kycTier,
        },
        type: 'wallet',
      },
    });
  } catch (err) {
    next(err);
  }
});

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  businessName: z.string().min(2),
  businessType: z.string(),
  phoneNumber: z.string().min(10),
  walletAddress: z.string().startsWith('0x'),
});

router.post('/register', async (req, res, next) => {
  try {
    const data = registerSchema.parse(req.body);
    
    const existing = await prisma.merchant.findUnique({ where: { email: data.email } });
    if (existing) throw createError('Email already registered', 400, 'EMAIL_EXISTS');

    const passwordHash = await bcrypt.hash(data.password, 12);
    
    const merchant = await prisma.merchant.create({
      data: {
        email: data.email,
        passwordHash,
        businessName: data.businessName,
        businessType: data.businessType,
        phoneNumber: data.phoneNumber,
        walletAddress: data.walletAddress,
      },
    });

    const token = jwt.sign(
      { merchantId: merchant.id, email: merchant.email, type: 'email' },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      data: {
        token,
        merchant: {
          id: merchant.id,
          email: merchant.email,
          businessName: merchant.businessName,
          walletAddress: merchant.walletAddress,
        },
        type: 'email',
      },
    });
  } catch (err) {
    next(err);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const data = z.object({
      email: z.string().email(),
      password: z.string(),
    }).parse(req.body);
    
    const merchant = await prisma.merchant.findUnique({ where: { email: data.email } });
    if (!merchant) throw createError('Invalid credentials', 401, 'INVALID_CREDENTIALS');

    const valid = await bcrypt.compare(data.password, merchant.passwordHash);
    if (!valid) throw createError('Invalid credentials', 401, 'INVALID_CREDENTIALS');

    const token = jwt.sign(
      { merchantId: merchant.id, email: merchant.email, type: 'email' },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      data: {
        token,
        merchant: {
          id: merchant.id,
          email: merchant.email,
          businessName: merchant.businessName,
          walletAddress: merchant.walletAddress,
        },
        type: 'email',
      },
    });
  } catch (err) {
    next(err);
  }
});

router.get('/me', async (req, res, next) => {
  try {
    const auth = req.headers.authorization;
    if (!auth?.startsWith('Bearer ')) throw createError('Unauthorized', 401);

    const decoded = jwt.verify(auth.split(' ')[1], process.env.JWT_SECRET || 'secret') as { 
      merchantId?: string; 
      userId?: string;
      walletAddress?: string;
      type: string;
    };
    
    if (decoded.type === 'wallet' && decoded.userId) {
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { id: true, walletAddress: true, kycTier: true, phoneNumber: true, createdAt: true },
      });
      if (!user) throw createError('User not found', 404);
      return res.json({ success: true, data: { ...user, type: 'wallet' } });
    }
    
    if (decoded.merchantId) {
      const merchant = await prisma.merchant.findUnique({
        where: { id: decoded.merchantId },
        select: { id: true, email: true, businessName: true, businessType: true, walletAddress: true, kycStatus: true, isActive: true, createdAt: true },
      });
      if (!merchant) throw createError('Merchant not found', 404);
      return res.json({ success: true, data: { ...merchant, type: 'email' } });
    }

    throw createError('Unauthorized', 401);
  } catch (err) {
    next(err);
  }
});

export default router;
