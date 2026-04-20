import request from 'supertest';
import { describe, it, expect, beforeAll } from 'jest';
import { createApp } from './app.js';
import { testUtils } from './setup.js';

const app = createApp();

describe('GET /api/onramp/rates', () => {
  it('should get exchange rates', async () => {
    const res = await request(app).get('/api/onramp/rates');

    console.log('\n📝 GET /api/onramp/rates');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.rates).toBeDefined();
    console.log('✅ Rates:', res.body.data.rates);
  });

  it('should return KES rate', async () => {
    const res = await request(app).get('/api/onramp/rate/KES');

    expect(res.status).toBe(200);
    expect(res.body.data.rateToAxCNH).toBeGreaterThan(0);
    console.log('✅ KES rate:', res.body.data.rateToAxCNH);
  });
});

describe('POST /api/onramp/initiate', () => {
  let testWallet = '';

  beforeAll(async () => {
    testWallet = testUtils.generateTestWallet().address;
  });

  it('should initiate onramp with valid data', async () => {
    const res = await request(app)
      .post('/api/onramp/initiate')
      .send({
        fiatAmount: 1000,
        fiatCurrency: 'KES',
        paymentMethod: 'mpesa',
        walletAddress: testWallet,
        phoneNumber: '+254700000000',
        email: testUtils.generateTestEmail(),
      });

    console.log('\n📝 POST /api/onramp/initiate');
    console.log('Input: 1000 KES via M-PESA');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.paymentLink).toBeDefined();
    expect(res.body.data.transactionId).toBeDefined();
    console.log('✅ Payment link created:', res.body.data.paymentLink?.substring(0, 50) + '...');
  });

  it('should reject invalid amount (below minimum)', async () => {
    const res = await request(app)
      .post('/api/onramp/initiate')
      .send({
        fiatAmount: 50, // Below minimum of 100
        fiatCurrency: 'KES',
        paymentMethod: 'mpesa',
        walletAddress: testWallet,
        phoneNumber: '+254700000000',
      });

    expect(res.status).toBe(400);
    console.log('✅ Below minimum rejected:', res.status);
  });

  it('should reject invalid amount (above maximum)', async () => {
    const res = await request(app)
      .post('/api/onramp/initiate')
      .send({
        fiatAmount: 2000000, // Above maximum of 1000000
        fiatCurrency: 'KES',
        paymentMethod: 'mpesa',
        walletAddress: testWallet,
        phoneNumber: '+254700000000',
      });

    expect(res.status).toBe(400);
    console.log('✅ Above maximum rejected:', res.status);
  });

  it('should reject invalid fiat currency', async () => {
    const res = await request(app)
      .post('/api/onramp/initiate')
      .send({
        fiatAmount: 1000,
        fiatCurrency: 'INVALID',
        paymentMethod: 'mpesa',
        walletAddress: testWallet,
        phoneNumber: '+254700000000',
      });

    expect(res.status).toBe(400);
    console.log('✅ Invalid currency rejected:', res.status);
  });
});

describe('GET /api/onramp/status/:transactionId', () => {
  let transactionId = '';

  beforeAll(async () => {
    // Create a transaction first
    const res = await request(app)
      .post('/api/onramp/initiate')
      .send({
        fiatAmount: 500,
        fiatCurrency: 'KES',
        paymentMethod: 'mpesa',
        walletAddress: testUtils.generateTestWallet().address,
        phoneNumber: '+254700000000',
      });
    transactionId = res.body.data.transactionId;
  });

  it('should get transaction status', async () => {
    const res = await request(app).get(`/api/onramp/status/${transactionId}`);

    console.log('\n📝 GET /api/onramp/status/:transactionId');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.transactionId).toBe(transactionId);
    console.log('✅ Status:', res.body.data.status);
  });

  it('should return 404 for non-existent transaction', async () => {
    const res = await request(app).get('/api/onramp/status/invalid_id');

    expect(res.status).toBe(404);
    console.log('✅ Non-existent transaction:', res.status);
  });
});