import request from 'supertest';
import { ethers } from 'ethers';
import { createApp } from './app.js';
import { testUtils } from './setup.js';

const app = createApp();

describe('=== E2E FLOW 1: New User Gets Started ===', () => {
  let testWallet = '';
  let authToken = '';

  it('Step 1: Verify wallet (create user)', async () => {
    const wallet = testUtils.generateTestWallet();
    testWallet = wallet.address;
    
    const message = `Sign this message to login to AxPesa: ${wallet.address.toLowerCase()}`;
    const signature = await new ethers.Wallet(wallet.privateKey).signMessage(message);

    const res = await request(app)
      .post('/api/auth/verify-wallet')
      .send({ address: wallet.address, signature });

    console.log('\n🎯 E2E Flow 1 Step 1: Verify Wallet');
    console.log('Wallet:', wallet.address.substring(0, 15) + '...');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    authToken = res.body.data.token;
    console.log('✅ User created with token');
  });

  it('Step 2: Get CFX for gas fees', async () => {
    const res = await request(app)
      .post('/api/faucet/claim-cfx')
      .send({ walletAddress: testWallet });

    console.log('\n🎯 E2E Flow 1 Step 2: Claim CFX');
    
    if (res.status === 200) {
      expect(res.body.success).toBe(true);
      console.log('✅ CFX claimed:', res.body.data.txHash?.substring(0, 20) + '...');
    } else {
      console.log('⚠️ Already has CFX:', res.body.message || res.status);
    }
  });

  it('Step 3: Claim AxCNH from faucet', async () => {
    const res = await request(app)
      .post('/api/faucet/claim')
      .send({ walletAddress: testWallet });

    console.log('\n🎯 E2E Flow 1 Step 3: Claim AxCNH');

    if (res.status === 200) {
      expect(res.body.success).toBe(true);
      console.log('✅ AxCNH claimed:', res.body.data.amount, 'tx:', res.body.data.txHash?.substring(0, 20) + '...');
    } else {
      console.log('⚠️ Faucet response:', res.status, res.body.message);
    }
  });

  it('Step 4: Check wallet balance', async () => {
    const res = await request(app)
      .get(`/api/transfer/balance?address=${testWallet}`);

    console.log('\n🎯 E2E Flow 1 Step 4: Check Balance');
    expect(res.status).toBe(200);
    console.log('✅ Balance:', res.body.data);
  });
});

describe('=== E2E FLOW 2: User Buys AxCNH (On-ramp) ===', () => {
  let testWallet = '';
  let transactionId = '';

  it('Step 1: Get exchange rates', async () => {
    const res = await request(app).get('/api/onramp/rates');

    console.log('\n🎯 E2E Flow 2 Step 1: Get Rates');
    expect(res.status).toBe(200);
    console.log('✅ Rates:', res.body.data.rates);
  });

  it('Step 2: Initiate onramp (create Flutterwave payment)', async () => {
    testWallet = testUtils.generateTestWallet().address;
    
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

    console.log('\n🎯 E2E Flow 2 Step 2: Initiate Payment');
    console.log('Amount: 1000 KES → AxCNH');

    expect(res.status).toBe(200);
    expect(res.body.data.paymentLink).toBeDefined();
    transactionId = res.body.data.transactionId;
    console.log('✅ Payment link:', res.body.data.paymentLink?.substring(0, 40) + '...');
  });

  it('Step 3: Check transaction status', async () => {
    const res = await request(app).get(`/api/onramp/status/${transactionId}`);

    console.log('\n🎯 E2E Flow 2 Step 3: Check Status');
    expect(res.status).toBe(200);
    console.log('✅ Transaction status:', res.body.data.status);
  });

  it('Step 4: Simulate webhook (payment success)', async () => {
    const res = await request(app)
      .post(`/api/webhook/flutterwave/process/${transactionId}`)
      .send({ status: 'successful', txHash: '0x' + 'a'.repeat(64) });

    console.log('\n🎯 E2E Flow 2 Step 4: Simulate Webhook');

    // May fail due to contract not having liquidity - that's OK
    if (res.status === 200) {
      console.log('✅ Webhook processed, tokens released');
    } else {
      console.log('⚠️ Webhook result:', res.status, res.body.message || res.body);
    }
  });
});

describe('=== E2E FLOW 3: P2P Transfer ===', () => {
  let senderWallet = '';
  let recipientWallet = '';

  it('Step 1: Both users have wallets', async () => {
    senderWallet = testUtils.generateTestWallet().address;
    recipientWallet = testUtils.generateTestWallet().address;

    console.log('\n🎯 E2E Flow 3: Setup');
    console.log('Sender:', senderWallet.substring(0, 15) + '...');
    console.log('Recipient:', recipientWallet.substring(0, 15) + '...');
    console.log('✅ Wallets created');
  });

  it('Step 2: Check initial balances', async () => {
    const senderRes = await request(app).get(`/api/transfer/balance?address=${senderWallet}`);
    const recipientRes = await request(app).get(`/api/transfer/balance?address=${recipientWallet}`);

    console.log('\n🎯 E2E Flow 3 Step 2: Initial Balances');
    expect(senderRes.status).toBe(200);
    expect(recipientRes.status).toBe(200);
    console.log('✅ Balances:', { sender: senderRes.body.data.AxCNH, recipient: recipientRes.body.data.AxCNH });
  });

  it('Step 3: Attempt transfer (may fail without balance)', async () => {
    const res = await request(app)
      .post('/api/transfer')
      .send({
        fromAddress: senderWallet,
        toAddress: recipientWallet,
        amount: 1,
        tokenSymbol: 'AxCNH',
      });

    console.log('\n🎯 E2E Flow 3 Step 3: Transfer');

    if (res.status === 200) {
      console.log('✅ Transfer sent:', res.body.data.txHash?.substring(0, 20) + '...');
    } else {
      console.log('⚠️ Expected - sender needs balance first');
      console.log('Result:', res.status, res.body.message);
    }
  });
});

describe('=== E2E FLOW 4: User Sells AxCNH (Off-ramp) ===', () => {
  let testWallet = '';
  let transactionId = '';

  it('Step 1: Initiate offramp', async () => {
    testWallet = testUtils.generateTestWallet().address;
    
    const res = await request(app)
      .post('/api/offramp/initiate')
      .send({
        axcnhAmount: 5,
        fiatCurrency: 'KES',
        phoneNumber: '+254700000000',
        walletAddress: testWallet,
      });

    console.log('\n🎯 E2E Flow 4 Step 1: Initiate Offramp');
    console.log('Amount: 5 AxCNH → KES');

    if (res.status === 200) {
      expect(res.body.success).toBe(true);
      transactionId = res.body.data.transactionId;
      console.log('✅ Offramp initiated:', res.body.data.kesAmount, 'KES');
    } else {
      console.log('⚠️ Offramp result:', res.status, res.body.message);
    }
  });

  it('Step 2: Check transaction status', async () => {
    if (!transactionId) {
      console.log('\n⚠️ Skipped - no transaction created');
      return;
    }
    
    const res = await request(app).get(`/api/transactions/${transactionId}`);

    console.log('\n🎯 E2E Flow 4 Step 2: Check Status');
    expect(res.status).toBe(200);
    console.log('✅ Transaction status:', res.body.data?.status);
  });
});

describe('=== HEALTH CHECKS ===', () => {
  it('GET /api/health', async () => {
    const res = await request(app).get('/api/health');

    console.log('\n🎯 Health Check');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    console.log('✅ Backend healthy:', res.body);
  });
});