import axios, { AxiosInstance } from 'axios';

class FlutterwaveService {
  private client: AxiosInstance;
  private publicKey: string;
  private secretKey: string;

  constructor() {
    this.publicKey = process.env.FLUTTERWAVE_PUBLIC_KEY || '';
    this.secretKey = process.env.FLUTTERWAVE_SECRET_KEY || '';
    
    this.client = axios.create({
      baseURL: 'https://api.flutterwave.com/v3',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.secretKey}`,
      },
      timeout: 30000,
    });
  }

  async initiatePayment(params: {
    txRef: string;
    amount: number;
    currency: string;
    paymentOptions: string;
    phoneNumber?: string;
    email?: string;
    name?: string;
    redirectUrl: string;
    description?: string;
  }) {
    const payload = {
      tx_ref: params.txRef,
      amount: params.amount,
      currency: params.currency,
      payment_options: params.paymentOptions,
      redirect_url: params.redirectUrl,
      customer: {
        email: params.email || `user_${params.txRef}@axpesa.com`,
        phonenumber: params.phoneNumber || '',
        name: params.name || `User ${params.txRef.slice(-6)}`,
      },
      customizations: {
        title: 'AxPesa',
        description: params.description || 'AxCNH Purchase',
        logo: 'https://axpesa.com/logo.png',
      },
      meta: {
        cft: 'axpesa',
      },
    };

    const response = await this.client.post('/payments', payload);
    return response.data;
  }

  async getPaymentStatus(txRef: string) {
    const response = await this.client.get(`/transactions/${txRef}/verify`);
    return response.data;
  }

  async verifyTransaction(txId: string) {
    const response = await this.client.get(`/transactions/${txId}/verify`);
    return response.data;
  }

  async disburse(params: {
    account_bank: string;
    account_number: string;
    amount: number;
    narration: string;
    currency: string;
    reference: string;
  }) {
    const payload = {
      account_bank: params.account_bank,
      account_number: params.account_number,
      amount: params.amount,
      narration: params.narration,
      currency: params.currency,
      reference: params.reference,
    };

    const response = await this.client.post('/transfers', payload);
    return response.data;
  }

  async mobileMoneyRecharge(params: {
    network: string;
    amount: number;
    mobile_number: string;
    reference: string;
  }) {
    // Mock mode for testing - skip actual Flutterwave call if in test mode
    if (process.env.NODE_ENV === 'development' && !process.env.FLUTTERWAVE_REAL_API) {
      console.log(`[MOCK] M-PESA recharge: ${params.amount} KES to ${params.mobile_number}`);
      return {
        status: 'success',
        data: {
          id: `mock_${Date.now()}`,
          tx_ref: params.reference,
        }
      };
    }

    const payload = {
      network: params.network,
      amount: params.amount,
      mobile_number: params.mobile_number,
      reference: params.reference,
      currency: 'KES',
    };

    const response = await this.client.post('/mobilemoney/kenya', payload);
    return response.data;
  }

  async createTransferRecipient(params: {
    account_bank: string;
    account_number: string;
    currency: string;
    name: string;
  }) {
    const payload = {
      account_bank: params.account_bank,
      account_number: params.account_number,
      currency: params.currency,
      name: params.name,
    };

    const response = await this.client.post('/accounts/charges', payload);
    return response.data;
  }

  verifyWebhookSignature(payload: string, signature: string): boolean {
    const secret = process.env.FLUTTERWAVE_WEBHOOK_SECRET;
    if (!secret) return false;
    
    const crypto = require('crypto');
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');
    return signature === expectedSignature;
  }
}

export const flutterwaveService = new FlutterwaveService();
export default flutterwaveService;
