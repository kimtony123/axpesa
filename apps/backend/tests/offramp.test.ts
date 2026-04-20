import request from 'supertest';
import { describe, it, expect, beforeAll } from 'jest';
import { createApp } from './app.js';
import { testUtils } from './setup.js';

const app = createApp();

describe('GET /api/offramp/rate/:currency', () => {
  it('should get KES rate', async () => {
    const res = await request(app).get('/api/offramp/rate/KES');

    console.log('\n📝 GET /api/offramp/rate/KES');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.rateToAxCNH).toBeGreaterThan(0);
    console.log('✅ KES rate:', res.body.data.rateToAxCNH);
  });

  it('should get UGX rate', async () => {
    const res = await request(app).get('/api/offramp/rate/UGX');

    expect(res.status).toBe(200);
    expect(res.body.data.rateToAxCNH).toBeGreaterThan(0);
    console.log('✅ UGX rate:', res.body.data.rateToAxCNH);
  });

  it('should get NGN rate', async () => {
    const res = await request(app).get('/api/offramp/rate/NGN');

    expect(res.status).toBe(200);
    expect(res.body.data.rateToAxCNH).toBeGreaterThan(0);
    console.log('✅ NGN rate:', res.body.data.rateToAxCNH);
  });

  it('should default to KES for invalid currency', async () => {
    const res = await request(app).get('/api/offramp/rate/INVALID');

    expect(res.status).toBe(200);
    expect(res.body.data.rateToAxCNH).toBeGreaterThan(0);
    console.log('✅ Default rate used:', res.body.data.rateToAxCNH);
  });
});

describe('POST /api/offramp/initiate', () => {
  it('should initiate offramp with valid data', async () => {
    const res = await request(app)
      .post('/api/offramp/initiate')
      .send({
        axcnhAmount: 10,
        fiatCurrency: 'KES',
        phoneNumber: '+254700000000',
        walletAddress: testUtils.generateTestWallet().address,
      });

    console.log('\n📝 POST /api/offramp/initiate');
    console.log('Input: 10 AxCNH → KES');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.transactionId).toBeDefined();
    expect(res.body.data.kesAmount).toBeGreaterThan(0);
    console.log('✅ KES amount:', res.body.data.kesAmount);
  });

  it('should reject zero amount', async () => {
    const res = await request(app)
      .post('/api/offramp/initiate')
      .send({
        axcnhAmount: 0,
        fiatCurrency: 'KES',
        phoneNumber: '+254700000000',
        walletAddress: testUtils.generateTestWallet().address,
      });

    expect(res.status).toBe(400);
    console.log('✅ Zero amount rejected:', res.status);
  });

  it('should reject negative amount', async () => {
    const res = await request(app)
      .post('/api/offramp/initiate')
      .send({
        axcnhAmount: -10,
        fiatCurrency: 'KES',
        phoneNumber: '+254700000000',
        walletAddress: testUtils.generateTestWallet().address,
      });

    expect(res.status).toBe(400);
    console.log('✅ Negative amount rejected:', res.status);
  });

  it('should reject invalid phone number', async () => {
    const res = await request(app)
      .post('/api/offramp/initiate')
      .send({
        axcnhAmount: 10,
        fiatCurrency: 'KES',
        phoneNumber: 'invalid',
        walletAddress: testUtils.generateTestWallet().address,
      });

    expect(res.status).toBe(400);
    console.log('✅ Invalid phone rejected:', res.status);
  });
});