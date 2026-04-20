import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from 'dotenv';
import authRoutes from '../src/routes/auth.js';
import web3authRoutes from '../src/routes/web3auth.js';
import onrampRoutes from '../src/routes/onramp.js';
import offrampRoutes from '../src/routes/offramp.js';
import merchantRoutes from '../src/routes/merchant.js';
import webhookRoutes from '../src/routes/webhook.js';
import transactionRoutes from '../src/routes/transactions.js';
import faucetRoutes from '../src/routes/faucet.js';
import stakingRoutes from '../src/routes/staking.js';
import transferRoutes from '../src/routes/transfer.js';
import walletRoutes from '../src/routes/wallet.js';
import { errorHandler } from '../src/middleware/errorHandler.js';
import { rateLimiter } from '../src/middleware/rateLimiter.js';

config();

export function createApp(): Express {
  const app = express();
  
  app.use(helmet());
  app.use(cors({ origin: process.env.APP_URL || 'http://localhost:3000' }));
  app.use(express.json());
  app.use(rateLimiter);
  
  app.use('/api/auth', authRoutes);
  app.use('/api/auth/web3auth', web3authRoutes);
  app.use('/api/onramp', onrampRoutes);
  app.use('/api/offramp', offrampRoutes);
  app.use('/api/merchant', merchantRoutes);
  app.use('/api/webhook', webhookRoutes);
  app.use('/api/transactions', transactionRoutes);
  app.use('/api/faucet', faucetRoutes);
  app.use('/api/staking', stakingRoutes);
  app.use('/api/transfer', transferRoutes);
  app.use('/api/wallet', walletRoutes);
  
  app.get('/api/health', (_, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));
  
  app.use(errorHandler);
  
  return app;
}

export default createApp();