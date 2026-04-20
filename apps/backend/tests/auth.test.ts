import request from 'supertest';
import { ethers } from 'ethers';
import { createApp } from './app.js';
import { testUtils } from './setup.js';

const { describe, it, expect, beforeAll } = global;

const app = createApp();

describe('POST /api/auth/register', () => {
  let testMerchant = {
    email: '',
    password: 'testpassword123',
    businessName: 'Test Business',
    businessType: 'retail',
    phoneNumber: '+254700000000',
    walletAddress: '',
  };

  beforeAll(async () => {
    testMerchant.email = testUtils.generateTestEmail();
    testMerchant.walletAddress = testUtils.generateTestWallet().address;
  });

  it('should create merchant with valid data', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(testMerchant);

    console.log('\n📝 POST /api/auth/register');
    console.log('Input:', testMerchant);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    console.log('✅ Response:', res.body.success, '| Token:', res.body.data.token?.substring(0, 20) + '...');
  });

  it('should reject duplicate email', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(testMerchant);

    expect(res.status).toBe(400);
    console.log('✅ Duplicate email rejected:', res.status);
  });

  it('should reject invalid email format', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ ...testMerchant, email: 'invalid-email' });

    expect(res.status).toBe(400);
    console.log('✅ Invalid email rejected:', res.status);
  });

  it('should reject short password', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ ...testMerchant, password: '123' });

    expect(res.status).toBe(400);
    console.log('✅ Short password rejected:', res.status);
  });
});

describe('POST /api/auth/login', () => {
  let testMerchant = {
    email: '',
    password: 'testpassword123',
    businessName: 'Login Test Business',
    businessType: 'retail',
    phoneNumber: '+254700000001',
    walletAddress: '',
  };

  beforeAll(async () => {
    testMerchant.email = testUtils.generateTestEmail();
    testMerchant.walletAddress = testUtils.generateTestWallet().address;
    
    await request(app)
      .post('/api/auth/register')
      .send(testMerchant);
  });

  it('should login with valid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: testMerchant.email, password: testMerchant.password });

    console.log('\n📝 POST /api/auth/login');
    console.log('Input:', { email: testMerchant.email, password: '***' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    console.log('✅ Login successful');
  });

  it('should reject invalid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: testMerchant.email, password: 'wrongpassword' });

    expect(res.status).toBe(401);
    console.log('✅ Invalid credentials rejected:', res.status);
  });

  it('should reject non-existent user', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nonexistent@test.com', password: 'password123' });

    expect(res.status).toBe(401);
    console.log('✅ Non-existent user rejected:', res.status);
  });
});

describe('POST /api/auth/verify-wallet', () => {
  it('should verify wallet signature and create user', async () => {
    const wallet = testUtils.generateTestWallet();
    const message = `Sign this message to login to AxPesa: ${wallet.address.toLowerCase()}`;
    const signature = await new ethers.Wallet(wallet.privateKey).signMessage(message);

    const res = await request(app)
      .post('/api/auth/verify-wallet')
      .send({ address: wallet.address, signature });

    console.log('\n📝 POST /api/auth/verify-wallet');
    console.log('Wallet:', wallet.address.substring(0, 10) + '...');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    console.log('✅ Wallet verified, user created');
  });

  it('should login existing wallet', async () => {
    const wallet = testUtils.generateTestWallet();
    const message = `Sign this message to login to AxPesa: ${wallet.address.toLowerCase()}`;
    const signature = await new ethers.Wallet(wallet.privateKey).signMessage(message);

    await request(app)
      .post('/api/auth/verify-wallet')
      .send({ address: wallet.address, signature });

    const res = await request(app)
      .post('/api/auth/verify-wallet')
      .send({ address: wallet.address, signature });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    console.log('✅ Existing wallet logged in');
  });

  it('should reject invalid signature', async () => {
    const wallet = testUtils.generateTestWallet();

    const res = await request(app)
      .post('/api/auth/verify-wallet')
      .send({ address: wallet.address, signature: '0x0000' });

    expect(res.status).toBe(401);
    console.log('✅ Invalid signature rejected:', res.status);
  });
});

describe('GET /api/auth/me', () => {
  let authToken = '';

  beforeAll(async () => {
    const wallet = testUtils.generateTestWallet();
    const message = `Sign this message to login to AxPesa: ${wallet.address.toLowerCase()}`;
    const signature = await new ethers.Wallet(wallet.privateKey).signMessage(message);

    const res = await request(app)
      .post('/api/auth/verify-wallet')
      .send({ address: wallet.address, signature });

    authToken = res.body.data.token;
  });

  it('should get current user with valid token', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${authToken}`);

    console.log('\n📝 GET /api/auth/me');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.walletAddress).toBeDefined();
    console.log('✅ User data retrieved:', res.body.data.walletAddress?.substring(0, 10) + '...');
  });

  it('should reject request without token', async () => {
    const res = await request(app)
      .get('/api/auth/me');

    expect(res.status).toBe(401);
    console.log('✅ No token rejected:', res.status);
  });

  it('should reject invalid token', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer invalid-token');

    expect(res.status).toBe(401);
    console.log('✅ Invalid token rejected:', res.status);
  });
});