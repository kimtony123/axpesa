import { PrismaClient } from '@prisma/client';

export let prisma: PrismaClient;

// Database connection for tests
beforeAll(async () => {
  console.log('🧪 AxPesa API Tests Starting...\n');
  
  // Use existing database
  prisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL || 'file:./dev.db',
      },
    },
  });
  
  try {
    await prisma.$connect();
    console.log('✅ Database connected\n');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
  }
});

afterAll(async () => {
  console.log('\n🧹 Cleaning up test data...');
  
  try {
    // Don't delete data - we want to see the results in the app
    await prisma.$disconnect();
    console.log('✅ Database disconnected\n');
  } catch (error) {
    console.error('❌ Cleanup error:', error);
  }
});

// Test utilities
export const testUtils = {
  // Generate random wallet for testing
  generateTestWallet: () => {
    const { ethers } = require('ethers');
    const wallet = ethers.Wallet.createRandom();
    return {
      address: wallet.address,
      privateKey: wallet.privateKey,
    };
  },
  
  // Generate unique test email
  generateTestEmail: () => {
    return `test_${Date.now()}@axpesa.test`;
  },
  
  // Wait for transaction confirmation
  waitForTx: async (txHash: string, maxWait = 30000) => {
    const { ethers } = require('ethers');
    const provider = new ethers.JsonRpcProvider(
      process.env.CONFLUX_RPC_URL || 'https://evmtestnet.confluxrpc.com'
    );
    
    const startTime = Date.now();
    while (Date.now() - startTime < maxWait) {
      const receipt = await provider.getTransactionReceipt(txHash);
      if (receipt) {
        return receipt.status === 1;
      }
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    return false;
  },
};