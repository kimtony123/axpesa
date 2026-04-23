import { Client } from 'pg';

const client = new Client({
  host: 'aws-1-ap-southeast-2.pooler.supabase.com',
  port: 6543,
  database: 'postgres',
  user: 'postgres.ekhsfnqethzavutooenz',
  password: 'Akimani187@20',
  connectionTimeoutMillis: 10000
});

async function runQuery(sql: string) {
  const c = new Client({
    host: 'aws-1-ap-southeast-2.pooler.supabase.com',
    port: 6543,
    database: 'postgres',
    user: 'postgres.ekhsfnqethzavutooenz',
    password: 'Akimani187@20',
    connectionTimeoutMillis: 10000
  });
  try {
    await c.connect();
    await c.query(sql);
    await c.end();
  } catch (e) {
    await c.end();
    throw e;
  }
}

async function migrate() {
  console.log('🔌 Connecting to Supabase...');
  
  try {
    await client.connect();
    console.log('✅ Connected!');
    
    console.log('📦 Creating User table...');
    await runQuery(`
      CREATE TABLE IF NOT EXISTS "User" (
        id TEXT PRIMARY KEY,
        name TEXT,
        web3auth_id TEXT,
        email TEXT,
        "hashedEmail" TEXT,
        "phoneNumber" TEXT,
        "hashedPhone" TEXT,
        "walletAddress" TEXT NOT NULL,
        "kycTier" INT DEFAULT 0,
        "phoneVerified" BOOLEAN DEFAULT false,
        "idVerified" BOOLEAN DEFAULT false,
        "dailyVolume" FLOAT DEFAULT 0,
        "monthlyVolume" FLOAT DEFAULT 0,
        "lastResetDate" TIMESTAMP DEFAULT NOW(),
        createdAt TIMESTAMP DEFAULT NOW(),
        updatedAt TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ User table created');
    
    console.log('📦 Creating Merchant table...');
    await runQuery(`
      CREATE TABLE IF NOT EXISTS "Merchant" (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        "passwordHash" TEXT NOT NULL,
        "businessName" TEXT NOT NULL,
        "businessType" TEXT NOT NULL,
        "phoneNumber" TEXT NOT NULL,
        "walletAddress" TEXT NOT NULL,
        "kycStatus" TEXT DEFAULT 'pending',
        "isActive" BOOLEAN DEFAULT true,
        "payoutMethod" TEXT,
        "payoutDetails" TEXT,
        "dailyVolume" FLOAT DEFAULT 0,
        "monthlyVolume" FLOAT DEFAULT 0,
        createdAt TIMESTAMP DEFAULT NOW(),
        updatedAt TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ Merchant table created');
    
    console.log('📦 Creating Transaction table...');
    await runQuery(`
      CREATE TABLE IF NOT EXISTS "Transaction" (
        id TEXT PRIMARY KEY,
        "transactionId" TEXT UNIQUE NOT NULL,
        type TEXT DEFAULT 'onramp',
        "userId" TEXT,
        "merchantId" TEXT,
        "paymentLinkId" TEXT,
        "walletAddress" TEXT NOT NULL,
        "fiatAmount" FLOAT NOT NULL,
        "fiatCurrency" TEXT NOT NULL,
        "usdAmount" FLOAT NOT NULL,
        "axcnhAmount" FLOAT NOT NULL,
        "paymentMethod" TEXT NOT NULL,
        status TEXT DEFAULT 'pending',
        "flutterwaveRef" TEXT,
        "txHash" TEXT,
        "rateUsed" FLOAT NOT NULL,
        "feePercent" FLOAT NOT NULL,
        "feeAmount" FLOAT NOT NULL,
        "totalAmount" FLOAT NOT NULL,
        createdAt TIMESTAMP DEFAULT NOW(),
        "completedAt" TIMESTAMP
      )
    `);
    console.log('✅ Transaction table created');
    
    console.log('📦 Creating PaymentLink table...');
    await runQuery(`
      CREATE TABLE IF NOT EXISTS "PaymentLink" (
        id TEXT PRIMARY KEY,
        "linkCode" TEXT UNIQUE NOT NULL,
        "merchantId" TEXT NOT NULL,
        amount FLOAT,
        currency TEXT DEFAULT 'AXCNH',
        description TEXT,
        "isActive" BOOLEAN DEFAULT true,
        "maxUses" INT,
        "useCount" INT DEFAULT 0,
        "expiresAt" TIMESTAMP,
        createdAt TIMESTAMP DEFAULT NOW(),
        updatedAt TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ PaymentLink table created');
    
    console.log('📦 Creating StakingPosition table...');
    await runQuery(`
      CREATE TABLE IF NOT EXISTS "StakingPosition" (
        id TEXT PRIMARY KEY,
        "userId" TEXT NOT NULL,
        "positionId" INT NOT NULL,
        plan TEXT NOT NULL,
        amount FLOAT NOT NULL,
        principal FLOAT NOT NULL,
        "startTime" TIMESTAMP NOT NULL,
        "lastCompoundTime" TIMESTAMP NOT NULL,
        "isActive" BOOLEAN DEFAULT true,
        createdAt TIMESTAMP DEFAULT NOW(),
        updatedAt TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ StakingPosition table created');
    
    console.log('📦 Creating StakingReward table...');
    await runQuery(`
      CREATE TABLE IF NOT EXISTS "StakingReward" (
        id TEXT PRIMARY KEY,
        "userId" TEXT NOT NULL,
        "positionId" INT NOT NULL,
        amount FLOAT NOT NULL,
        type TEXT NOT NULL,
        "txHash" TEXT,
        createdAt TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ StakingReward table created');
    
    console.log('📦 Creating StakingStats table...');
    await runQuery(`
      CREATE TABLE IF NOT EXISTS "StakingStats" (
        id TEXT PRIMARY KEY,
        "totalStakedAmount" FLOAT DEFAULT 0,
        "totalRewardsDistributed" FLOAT DEFAULT 0,
        "rewardPoolBalance" FLOAT DEFAULT 0,
        updatedAt TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ StakingStats table created');
    
    console.log('📦 Creating ExchangeRate table...');
    await runQuery(`
      CREATE TABLE IF NOT EXISTS "ExchangeRate" (
        id TEXT PRIMARY KEY,
        currency TEXT UNIQUE NOT NULL,
        "rateToUSD" FLOAT NOT NULL,
        updatedAt TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ ExchangeRate table created');
    
    console.log('📦 Creating indexes...');
    await runQuery(`CREATE INDEX IF NOT EXISTS "Transaction_status_idx" ON "Transaction"(status)`);
    await runQuery(`CREATE INDEX IF NOT EXISTS "Transaction_walletAddress_idx" ON "Transaction"("walletAddress")`);
    await runQuery(`CREATE INDEX IF NOT EXISTS "StakingPosition_userId_idx" ON "StakingPosition"("userId")`);
    console.log('✅ Indexes created');
    
    console.log('🎉 Migration complete! All tables created in Supabase.');
    await client.end();
    process.exit(0);
  } catch (e) {
    console.error('❌ Error:', e.message);
    await client.end();
    process.exit(1);
  }
}

migrate();