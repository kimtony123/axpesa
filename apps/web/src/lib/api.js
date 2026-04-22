const getApiUrl = () => {
  let url = import.meta.env.VITE_API_URL || '';
  // Remove ALL trailing slashes
  url = url.replace(/\/+$/, '');
  // Fallback to Railway URL if empty or localhost
  if (!url || url === 'http://localhost:8080' || url.includes('localhost')) {
    return 'https://axpesa-production.up.railway.app';
  }
  return url;
};

function getAuthHeaders() {
  const token = localStorage.getItem('axpesa_token');
  if (token) {
    return { Authorization: `Bearer ${token}` };
  }
  return {};
}

async function fetchApi(endpoint, options = {}) {
  const url = `${getApiUrl()}${endpoint}`;
  
  const config = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, config);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error?.message || data.message || 'Request failed');
    }
    
    return data;
  } catch (err) {
    console.error(`API Error [${endpoint}]:`, err);
    throw err;
  }
}

export const api = {
  onramp: {
    initiate: (params) => fetchApi('/api/onramp/initiate', {
      method: 'POST',
      body: JSON.stringify(params),
    }),
    getRates: () => fetchApi('/api/onramp/rates'),
  },
  
  offramp: {
    initiate: (params) => fetchApi('/api/offramp/initiate', {
      method: 'POST',
      body: JSON.stringify(params),
    }),
    confirm: (transactionId, params) => fetchApi(`/api/offramp/confirm/${transactionId}`, {
      method: 'POST',
      body: JSON.stringify(params),
    }),
    getRate: (currency) => fetchApi(`/api/offramp/rate/${currency}`),
    getHistory: (address) => fetchApi(`/api/offramp/history?address=${address}`),
  },
  
  transfer: {
    send: (params) => fetchApi('/api/transfer', {
      method: 'POST',
      body: JSON.stringify(params),
    }),
    getHistory: (address) => fetchApi(`/api/transfer/history?address=${address}`),
  },
  
  staking: {
    getPositions: (address) => fetchApi(`/api/staking/positions?address=${address}`),
    getStats: () => fetchApi('/api/staking/stats'),
    stake: (params) => fetchApi('/api/staking/stake', {
      method: 'POST',
      body: JSON.stringify(params),
    }),
    unstake: (positionId) => fetchApi(`/api/staking/unstake/${positionId}`, { method: 'POST' }),
  },
  
  wallet: {
    getBalances: (address) => fetchApi(`/api/wallet/balances?address=${address}`),
  },
  
  auth: {
    register: (params) => fetchApi('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(params),
    }),
    login: (params) => fetchApi('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(params),
    }),
    me: () => fetchApi('/api/auth/me'),
  },
  
  merchant: {
    getDashboard: () => fetchApi('/api/merchant/dashboard'),
    getPaymentLinks: () => fetchApi('/api/merchant/payment-links'),
    createPaymentLink: (params) => fetchApi('/api/merchant/payment-link', {
      method: 'POST',
      body: JSON.stringify(params),
    }),
    deletePaymentLink: (id) => fetchApi(`/api/merchant/payment-link/${id}`, { method: 'DELETE' }),
  },
};

export { getApiUrl, api };
export default api;