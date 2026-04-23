const getApiUrl = (): string => {
  let url = import.meta.env.VITE_API_URL || '';
  url = url.replace(/\/+$/, '');
  if (!url) {
    return 'http://127.0.0.1:8080';
  }
  return url;
};

function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem('axpesa_token');
  if (token) {
    return { Authorization: `Bearer ${token}` };
  }
  return {};
}

function toLowerCaseKeys(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) return obj.map(toLowerCaseKeys);
  if (typeof obj !== 'object') return obj;
  
  const result: any = {};
  for (const key of Object.keys(obj)) {
    const lowerKey = key.replace(/([A-Z])/g, (match) => match.toLowerCase());
    result[lowerKey] = toLowerCaseKeys(obj[key]);
  }
  return result;
}

function toCamelCaseKeys(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) return obj.map(toCamelCaseKeys);
  if (typeof obj !== 'object') return obj;
  
  const result: any = {};
  for (const key of Object.keys(obj)) {
    // Handle snake_case: created_at → createdAt, fiat_amount → fiatAmount
    let camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    // Handle all-lowercase consecutive: walletaddress → walletAddress, axcnhamount → axcnhAmount
    camelKey = camelKey.replace(/([a-z])([A-Z])/g, '$1$2');
    result[camelKey] = toCamelCaseKeys(obj[key]);
  }
  return result;
}

async function fetchApi(endpoint: string, options: RequestInit = {}): Promise<any> {
  const url = `${getApiUrl()}${endpoint}`;
  
  const requestBody = options.body ? JSON.parse(options.body as string) : null;
  const transformedBody = requestBody ? toLowerCaseKeys(requestBody) : null;
  
  const config: RequestInit = {
    ...options,
    body: transformedBody ? JSON.stringify(transformedBody) : undefined,
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
    
    return toCamelCaseKeys(data);
  } catch (err) {
    console.error(`API Error [${endpoint}]:`, err);
    throw err;
  }
}

export const api = {
  onramp: {
    initiate: (params: any) => fetchApi('/api/onramp/initiate', {
      method: 'POST',
      body: JSON.stringify(params),
    }),
    getRates: () => fetchApi('/api/onramp/rates'),
  },
  
  offramp: {
    initiate: (params: any) => fetchApi('/api/offramp/initiate', {
      method: 'POST',
      body: JSON.stringify(params),
    }),
    confirm: (transactionId: string, params: any) => fetchApi(`/api/offramp/confirm/${transactionId}`, {
      method: 'POST',
      body: JSON.stringify(params),
    }),
    getRate: (currency: string) => fetchApi(`/api/offramp/rate/${currency}`),
    getHistory: (address: string) => fetchApi(`/api/offramp/history?address=${address}`),
  },
  
  transfer: {
    send: (params: any) => fetchApi('/api/transfer', {
      method: 'POST',
      body: JSON.stringify(params),
    }),
    getHistory: (address: string) => fetchApi(`/api/transfer/history?address=${address}`),
  },
  
  staking: {
    getPositions: (address: string) => fetchApi(`/api/staking/positions?address=${address}`),
    getStats: () => fetchApi('/api/staking/stats'),
    stake: (params: any) => fetchApi('/api/staking/stake', {
      method: 'POST',
      body: JSON.stringify(params),
    }),
    unstake: (positionId: string) => fetchApi(`/api/staking/unstake/${positionId}`, { method: 'POST' }),
  },
  
  wallet: {
    getBalances: (address: string) => fetchApi(`/api/wallet/balances?address=${address}`),
  },
  
  auth: {
    register: (params: any) => fetchApi('/api/auth/user-register', {
      method: 'POST',
      body: JSON.stringify(params),
    }),
    registerMerchant: (params: any) => fetchApi('/api/auth/merchant-register', {
      method: 'POST',
      body: JSON.stringify(params),
    }),
    login: (params: any) => fetchApi('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(params),
    }),
    me: () => fetchApi('/api/auth/me'),
  },
  
  merchant: {
    getDashboard: () => fetchApi('/api/merchant/dashboard'),
    getPaymentLinks: () => fetchApi('/api/merchant/payment-links'),
    createPaymentLink: (params: any) => fetchApi('/api/merchant/payment-link', {
      method: 'POST',
      body: JSON.stringify(params),
    }),
    deletePaymentLink: (id: string) => fetchApi(`/api/merchant/payment-link/${id}`, { method: 'DELETE' }),
  },
};

export { getApiUrl, fetchApi };
export default api;