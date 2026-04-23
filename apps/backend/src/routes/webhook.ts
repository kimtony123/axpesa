import { Router } from 'express';
import type { Router as ExpressRouter } from 'express';
import crypto from 'crypto';
import prisma from '../lib/prisma.js';
import confluxService from '../services/confluxService.js';
import flutterwaveService from '../services/flutterwaveService.js';

const router: ExpressRouter = Router();

const RECONCILIATION_THRESHOLD_MS = 30 * 60 * 1000;

router.post('/flutterwave', async (req, res) => {
  const signature = req.headers['verif-hash'] as string;
  const payload = JSON.stringify(req.body);
  
  const expectedSignature = crypto
    .createHmac('sha256', process.env.FLUTTERWAVE_WEBHOOK_SECRET || '')
    .update(payload)
    .digest('hex');

  if (signature !== expectedSignature) {
    console.error('Webhook: Invalid signature received');
    return res.status(401).json({ message: 'Invalid signature' });
  }

  const { txRef, status, id } = req.body;
  const flwTxId = String(id);

  console.log(`Webhook received: txRef=${txRef}, status=${status}, flwTxId=${flwTxId}`);

  try {
    const transaction = await prisma.transaction.findUnique({ 
      where: { transactionId: txRef } 
    });
    
    if (!transaction) {
      console.error(`Webhook: Transaction not found: ${txRef}`);
      return res.status(404).json({ message: 'Transaction not found' });
    }

    if (transaction.status === 'completed') {
      console.log(`Webhook: Transaction already completed: ${txRef}`);
      return res.json({ status: 'ok', message: 'Already processed' });
    }

    if (transaction.status !== 'pending') {
      console.log(`Webhook: Transaction not pending: ${txRef}, status=${transaction.status}`);
      return res.json({ status: 'ok', message: 'Not pending' });
    }

    if (status !== 'successful') {
      console.log(`Webhook: Payment not successful: ${txRef}, status=${status}`);
      await prisma.transaction.update({
        where: { id: transaction.id },
        data: { status: status === 'failed' ? 'failed' : 'cancelled' }
      });
      return res.json({ status: 'ok' });
    }

    console.log(`Webhook: Verifying payment with Flutterwave API: ${flwTxId}`);
    
    const verifiedPayment = await flutterwaveService.verifyTransaction(flwTxId);
    
    if (verifiedPayment.status !== 'success') {
      console.error(`Webhook: Flutterwave verification failed: ${flwTxId}`);
      return res.status(400).json({ message: 'Payment verification failed' });
    }

    const verifiedData = verifiedPayment.data;
    
    if (verifiedData.status !== 'successful') {
      console.error(`Webhook: Verified payment not successful: ${flwTxId}, status=${verifiedData.status}`);
      await prisma.transaction.update({
        where: { id: transaction.id },
        data: { status: 'failed', flutterwaveRef: flwTxId }
      });
      return res.json({ status: 'ok' });
    }

    const verifiedAmount = parseFloat(verifiedData.amount);
    const expectedAmount = transaction.totalAmount;

    if (Math.abs(verifiedAmount - expectedAmount) > 0.01) {
      console.error(`Webhook: Amount mismatch! Expected=${expectedAmount}, Got=${verifiedAmount}`);
      return res.status(400).json({ message: 'Amount mismatch' });
    }

    console.log(`Webhook: Payment verified! Sending ${transaction.axcnhAmount} AxCNH to ${transaction.walletAddress}`);
    
    const txHash = await confluxService.withdrawFromVault(
      transaction.walletAddress, 
      transaction.axcnhAmount, 
      'AxCNH'
    );
    
    await prisma.transaction.update({
      where: { id: transaction.id },
      data: {
        status: 'completed',
        flutterwaveRef: flwTxId,
        txHash,
        completedAt: new Date(),
      },
    });

    if (transaction.userId) {
      await prisma.user.update({
        where: { id: transaction.userId },
        data: {
          dailyVolume: { increment: transaction.usdAmount || transaction.axcnhAmount },
          monthlyVolume: { increment: transaction.usdAmount || transaction.axcnhAmount },
        },
      });
    }

    if (transaction.merchantId) {
      await prisma.merchant.update({
        where: { id: transaction.merchantId },
        data: {
          dailyVolume: { increment: transaction.axcnhAmount },
          monthlyVolume: { increment: transaction.axcnhAmount },
        },
      });
    }

    console.log(`Webhook: SUCCESS! txHash=${txHash} for txRef=${txRef}`);
    res.json({ status: 'ok' });
    
  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).json({ message: 'Webhook processing failed' });
  }
});

router.get('/reconcile', async (req, res) => {
  console.log('Running reconciliation job...');
  
  const threshold = new Date(Date.now() - RECONCILIATION_THRESHOLD_MS);
  
  try {
    const stuckTransactions = await prisma.transaction.findMany({
      where: {
        status: 'pending',
        createdAt: { lt: threshold },
      },
    });

    console.log(`Found ${stuckTransactions.length} stuck transactions`);

    const results = await Promise.allSettled(
      stuckTransactions.map(async (tx) => {
        try {
          if (tx.flutterwaveRef) {
            console.log(`Reconcile: Checking ${tx.transactionId} (FLW ref: ${tx.flutterwaveRef})`);
            
            const verified = await flutterwaveService.verifyTransaction(tx.flutterwaveRef);
            
            if (verified.status === 'success' && verified.data?.status === 'successful') {
              const verifiedAmount = parseFloat(verified.data.amount);
              const expectedAmount = tx.totalAmount;
              
              if (Math.abs(verifiedAmount - expectedAmount) <= 0.01) {
                console.log(`Reconcile: Completing stuck transaction: ${tx.transactionId}`);
                
                const txHash = await confluxService.withdrawFromVault(
                  tx.walletAddress,
                  tx.axcnhAmount,
                  'AxCNH'
                );
                
                await prisma.transaction.update({
                  where: { id: tx.id },
                  data: {
                    status: 'completed',
                    txHash,
                    completedAt: new Date(),
                  },
                });
                
                return { transactionId: tx.transactionId, status: 'completed' };
              }
            }
            
            if (verified.data?.status === 'failed' || verified.data?.status === 'cancelled') {
              await prisma.transaction.update({
                where: { id: tx.id },
                data: { status: 'failed' },
              });
              return { transactionId: tx.transactionId, status: 'failed' };
            }
          }
          
          return { transactionId: tx.transactionId, status: 'pending' };
        } catch (error) {
          console.error(`Reconcile error for ${tx.transactionId}:`, error);
          return { transactionId: tx.transactionId, status: 'error', error: String(error) };
        }
      })
    );

    const completed = results.filter(r => r.status === 'fulfilled' && (r as any).value.status === 'completed').length;
    const failed = results.filter(r => r.status === 'fulfilled' && (r as any).value.status === 'failed').length;
    const pending = results.filter(r => r.status === 'fulfilled' && (r as any).value.status === 'pending').length;
    const errors = results.filter(r => r.status === 'rejected' || ((r as any).value?.status === 'error')).length;

    console.log(`Reconciliation complete: ${completed} completed, ${failed} failed, ${pending} pending, ${errors} errors`);

    res.json({
      success: true,
      data: {
        total: stuckTransactions.length,
        completed,
        failed,
        pending,
        errors,
      },
    });
  } catch (error) {
    console.error('Reconciliation job failed:', error);
    res.status(500).json({ message: 'Reconciliation failed', error: String(error) });
  }
});

export default router;
