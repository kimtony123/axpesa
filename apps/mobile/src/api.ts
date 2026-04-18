const API_URL = 'http://localhost:8080';

export const TOKENS = {
  AxCNH: {
    symbol: 'AxCNH',
    name: 'AxPesa CNH (Yuan)',
    decimals: 18,
    color: '#FFD700',
    peg: 'CNY',
  },
  USDTO: {
    symbol: 'USDTO',
    name: 'USDT (Omnichain)',
    decimals: 18,
    color: '#26A17B',
    peg: 'USD',
  },
  BTC: {
    symbol: 'BTC',
    name: 'Bitcoin',
    decimals: 8,
    color: '#F7931A',
    peg: 'BTC',
  },
  ETH: {
    symbol: 'ETH',
    name: 'Ethereum',
    decimals: 18,
    color: '#627EEA',
    peg: 'ETH',
  },
};

export const VAULT_ADDRESSES = {
  AxCNH: '0xCFC0aA7Afab6d6a617D6CB5213bf9f206604bcF6',
  USDTO: '0x2FC267bd9Da5406E15ebc3eCa286A2426d714753',
  BTC: '0x8b97bc4113Dac6c830Ec2f60197ee6a4C5bc2a67',
  ETH: '0x8e3405f8225F8bf7fbDff93f49d8Efb31bF14de6',
};

export const api = {
  async getRates() {
    try {
      const res = await fetch(`${API_URL}/api/onramp/rates`);
      const data = await res.json();
      return data.data || getDefaultRates();
    } catch {
      return getDefaultRates();
    }
  },

  async getVaultStats(token: string) {
    try {
      const res = await fetch(`${API_URL}/api/vault/stats/${token}`);
      const data = await res.json();
      return data.data || null;
    } catch {
      return null;
    }
  },

  async claimFaucet(walletAddress: string) {
    const res = await fetch(`${API_URL}/api/faucet/claim`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ walletAddress }),
    });
    return res.json();
  },

  async getFaucetStatus(walletAddress: string) {
    try {
      const res = await fetch(`${API_URL}/api/faucet/status/${walletAddress}`);
      return res.json();
    } catch {
      return { success: true, data: { canClaim: false, faucetBalance: 0 } };
    }
  },

  async initiateBuy(data: {
    fiatAmount: number;
    fiatCurrency: string;
    paymentMethod: string;
    walletAddress: string;
    phoneNumber?: string;
    tokenSymbol?: string;
  }) {
    const res = await fetch(`${API_URL}/api/onramp/initiate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async initiateSell(data: {
    axcnhAmount: number;
    tokenSymbol?: string;
    walletAddress: string;
    phoneNumber: string;
  }) {
    const res = await fetch(`${API_URL}/api/offramp/initiate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },
};

function getDefaultRates() {
  return {
    buy: {
      AxCNH: { rate: 18.87, currency: 'KES', fee: 0.02 },
      USDTO: { rate: 155.5, currency: 'KES', fee: 0.02 },
      BTC: { rate: 14500000, currency: 'KES', fee: 0.03 },
      ETH: { rate: 580000, currency: 'KES', fee: 0.03 },
    },
    sell: {
      AxCNH: { rate: 18.5, currency: 'KES', fee: 0.025 },
      USDTO: { rate: 154, currency: 'KES', fee: 0.025 },
      BTC: { rate: 14200000, currency: 'KES', fee: 0.035 },
      ETH: { rate: 570000, currency: 'KES', fee: 0.035 },
    },
  };
}

export const CURRENCIES = [
  { code: 'KES', name: 'Kenyan Shilling', flag: '🇰🇪' },
  { code: 'UGX', name: 'Ugandan Shilling', flag: '🇺🇬' },
  { code: 'NGN', name: 'Nigerian Naira', flag: '🇳🇬' },
  { code: 'TZS', name: 'Tanzanian Shilling', flag: '🇹🇿' },
];

export const PAYMENT_METHODS = [
  { id: 'mpesa', name: 'M-PESA', icon: '📱', countries: ['Kenya', 'Tanzania', 'Uganda'] },
  { id: 'card', name: 'Card', icon: '💳', countries: ['All'] },
  { id: 'bank_transfer', name: 'Bank Transfer', icon: '🏦', countries: ['NG', 'KE', 'UG', 'ZA', 'GH'] },
];

export default api;
