import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from 'dotenv';
import authRoutes from './routes/auth.js';
import web3authRoutes from './routes/web3auth.js';
import onrampRoutes from './routes/onramp.js';
import offrampRoutes from './routes/offramp.js';
import merchantRoutes from './routes/merchant.js';
import webhookRoutes from './routes/webhook.js';
import transactionRoutes from './routes/transactions.js';
import faucetRoutes from './routes/faucet.js';
import stakingRoutes from './routes/staking.js';
import transferRoutes from './routes/transfer.js';
import walletRoutes from './routes/wallet.js';
import { errorHandler } from './middleware/errorHandler.js';
import { rateLimiter } from './middleware/rateLimiter.js';

config();

const app = express();
const PORT = process.env.PORT || 8080;

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

app.listen(PORT, () => {
  console.log(`🚀 AxPesa Backend running on port ${PORT}`);
});
