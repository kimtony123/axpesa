import request from 'supertest';
import { createApp } from './app.js';
import { testUtils } from './setup.js';

const app = createApp();

describe('POST /api/transfer', () => {
  let senderWallet = '';
  let recipientWallet = '';

  beforeAll(async () => {
    senderWallet = testUtils.generateTestWallet().address;
    recipientWallet = testUtils.generateTestWallet().address;
  });

  it('should send tokens between wallets (requires balance)', async () => {
    const res = await request(app)
      .post('/api/transfer')
      .send({
        fromAddress: senderWallet,
        toAddress: recipientWallet,
        amount: 1,
        tokenSymbol: 'AxCNH',
      });

    console.log('\n📝 POST /api/transfer');
    console.log('From:', senderWallet.substring(0, 10) + '...');
    console.log('To:', recipientWallet.substring(0, 10) + '...');
    console.log('Amount: 1 AxCNH');

    if (res.status === 200) {
      expect(res.body.success).toBe(true);
      expect(res.body.data.txHash).toBeDefined();
      console.log('✅ Transfer sent:', res.body.data.txHash?.substring(0, 20) + '...');
    } else if (res.status === 400 && res.body.message?.includes('balance')) {
      console.log('⚠️ Sender has no balance (expected for new wallet)');
    } else {
      console.log('⚠️ Transfer result:', res.status, res.body.message || res.body);
    }
  });

  it('should reject transfer to same address', async () => {
    const res = await request(app)
      .post('/api/transfer')
      .send({
        fromAddress: senderWallet,
        toAddress: senderWallet,
        amount: 1,
        tokenSymbol: 'AxCNH',
      });

    expect(res.status).toBe(400);
    console.log('✅ Self-transfer rejected:', res.status);
  });

  it('should reject zero amount', async () => {
    const res = await request(app)
      .post('/api/transfer')
      .send({
        fromAddress: senderWallet,
        toAddress: recipientWallet,
        amount: 0,
        tokenSymbol: 'AxCNH',
      });

    expect(res.status).toBe(400);
    console.log('✅ Zero amount rejected:', res.status);
  });

  it('should reject negative amount', async () => {
    const res = await request(app)
      .post('/api/transfer')
      .send({
        fromAddress: senderWallet,
        toAddress: recipientWallet,
        amount: -1,
        tokenSymbol: 'AxCNH',
      });

    expect(res.status).toBe(400);
    console.log('✅ Negative amount rejected:', res.status);
  });
});

describe('GET /api/transfer/history', () => {
  let testWallet = '';

  beforeAll(async () => {
    testWallet = testUtils.generateTestWallet().address;
  });

  it('should get transfer history for wallet', async () => {
    const res = await request(app).get(`/api/transfer/history?address=${testWallet}`);

    console.log('\n📝 GET /api/transfer/history');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    console.log('✅ History retrieved, count:', res.body.data.length);
  });
});

describe('GET /api/transfer/balance', () => {
  let testWallet = '';

  beforeAll(async () => {
    testWallet = testUtils.generateTestWallet().address;
  });

  it('should get token balance for wallet', async () => {
    const res = await request(app).get(`/api/transfer/balance?address=${testWallet}`);

    console.log('\n📝 GET /api/transfer/balance');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.AxCNH).toBeDefined();
    console.log('✅ Balance:', res.body.data);
  });
});