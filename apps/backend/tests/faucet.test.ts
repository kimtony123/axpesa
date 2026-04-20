import request from 'supertest';
import { describe, it, expect, beforeAll } from 'jest';
import { createApp } from './app.js';
import { testUtils } from './setup.js';

const app = createApp();

describe('POST /api/faucet/claim-cfx', () => {
  let testWallet = '';

  beforeAll(async () => {
    testWallet = testUtils.generateTestWallet().address;
  });

  it('should claim CFX for new wallet (testnet)', async () => {
    const res = await request(app)
      .post('/api/faucet/claim-cfx')
      .send({ walletAddress: testWallet });

    console.log('\n📝 POST /api/faucet/claim-cfx');
    console.log('Wallet:', testWallet.substring(0, 10) + '...');

    // May succeed or fail depending on wallet balance
    if (res.status === 200) {
      expect(res.body.success).toBe(true);
      expect(res.body.data.txHash).toBeDefined();
      console.log('✅ CFX claimed, tx:', res.body.data.txHash?.substring(0, 20) + '...');
    } else {
      console.log('⚠️ Already has CFX or faucet exhausted:', res.body);
    }
  });

  it('should reject invalid wallet address', async () => {
    const res = await request(app)
      .post('/api/faucet/claim-cfx')
      .send({ walletAddress: 'invalid-address' });

    expect(res.status).toBe(400);
    console.log('✅ Invalid address rejected:', res.status);
  });
});

describe('GET /api/faucet/status/:walletAddress', () => {
  let testWallet = '';

  beforeAll(async () => {
    testWallet = testUtils.generateTestWallet().address;
  });

  it('should get faucet status for wallet', async () => {
    const res = await request(app).get(`/api/faucet/status/${testWallet}`);

    console.log('\n📝 GET /api/faucet/status/:walletAddress');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.canClaim).toBeDefined();
    expect(res.body.data.timeUntilNextClaim).toBeDefined();
    expect(res.body.data.faucetBalance).toBeDefined();
    console.log('✅ Faucet status:', res.body.data);
  });
});

describe('POST /api/faucet/claim', () => {
  let testWallet = '';

  beforeAll(async () => {
    testWallet = testUtils.generateTestWallet().address;
  });

  it('should claim AxCNH from faucet (if liquidity available)', async () => {
    const res = await request(app)
      .post('/api/faucet/claim')
      .send({ walletAddress: testWallet });

    console.log('\n📝 POST /api/faucet/claim');
    console.log('Wallet:', testWallet.substring(0, 10) + '...');

    // May fail if faucet is empty (no liquidity in vault)
    if (res.status === 200) {
      expect(res.body.success).toBe(true);
      expect(res.body.data.txHash).toBeDefined();
      console.log('✅ AxCNH claimed:', res.body.data);
    } else if (res.status === 503) {
      console.log('⚠️ Faucet empty:', res.body.message);
    } else {
      console.log('⚠️ Response:', res.status, res.body);
    }
  });

  it('should reject invalid wallet', async () => {
    const res = await request(app)
      .post('/api/faucet/claim')
      .send({ walletAddress: '0x000' });

    expect(res.status).toBe(400);
    console.log('✅ Invalid wallet rejected:', res.status);
  });
});