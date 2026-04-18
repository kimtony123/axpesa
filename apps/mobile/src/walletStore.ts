import { create } from 'zustand';

interface WalletState {
  address: string | null;
  isConnected: boolean;
  balance: string;
  setWallet: (address: string, balance?: string) => void;
  disconnect: () => void;
  updateBalance: (balance: string) => void;
}

export const useWalletStore = create<WalletState>((set) => ({
  address: null,
  isConnected: false,
  balance: '0',
  
  setWallet: (address: string, balance = '0') => set({
    address,
    isConnected: true,
    balance,
  }),
  
  disconnect: () => set({
    address: null,
    isConnected: false,
    balance: '0',
  }),
  
  updateBalance: (balance: string) => set({ balance }),
}));

export function formatAddress(address: string): string {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function formatBalance(balance: string, decimals = 4): string {
  const num = parseFloat(balance);
  if (isNaN(num)) return '0';
  if (num === 0) return '0';
  if (num < 0.0001) return '<0.0001';
  return num.toFixed(decimals);
}
