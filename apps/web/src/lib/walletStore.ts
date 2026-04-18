import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface WalletState {
  address: string | null;
  isConnected: boolean;
  isConnecting: boolean;
  chainId: number | null;
  error: string | null;
  authType: 'web3auth' | null;
  user: { id?: string; email?: string; walletAddress?: string; kycTier?: number } | null;
  
  balances: Record<string, string>;
  vaultBalances: Record<string, { totalDeposit: string; locked: string; withdrawable: string }>;
  
  setWallet: (address: string, userInfo?: any) => void;
  setUser: (user: { id?: string; email?: string; walletAddress?: string; kycTier?: number }) => void;
  setConnecting: (connecting: boolean) => void;
  setError: (error: string | null) => void;
  disconnect: () => void;
  setChainId: (chainId: number) => void;
  setBalances: (balances: Record<string, string>) => void;
  setVaultBalances: (vaultBalances: Record<string, { totalDeposit: string; locked: string; withdrawable: string }>) => void;
}

export const useWalletStore = create<WalletState>()(
  persist(
    (set) => ({
      address: null,
      isConnected: false,
      isConnecting: false,
      chainId: null,
      error: null,
      authType: null,
      user: null,
      balances: {},
      vaultBalances: {},

      setWallet: (address: string, userInfo?: any) => {
        set({ 
          address, 
          isConnected: true,
          isConnecting: false,
          authType: 'web3auth',
          error: null 
        });
      },

      setUser: (user: { id?: string; email?: string; walletAddress?: string; kycTier?: number }) => {
        set({ user });
      },

      setConnecting: (connecting: boolean) => {
        set({ isConnecting: connecting });
      },

      setError: (error: string | null) => {
        set({ error, isConnecting: false });
      },

      disconnect: () => {
        set({ 
          address: null, 
          isConnected: false, 
          isConnecting: false,
          balances: {},
          vaultBalances: {},
          user: null,
          error: null,
        });
      },

      setChainId: (chainId: number) => {
        set({ chainId });
      },

      setBalances: (balances: Record<string, string>) => {
        set({ balances });
      },

      setVaultBalances: (vaultBalances: Record<string, { totalDeposit: string; locked: string; withdrawable: string }>) => {
        set({ vaultBalances });
      },
    }),
    {
      name: 'axpesa-wallet',
      partialize: (state) => ({ address: state.address }),
    }
  )
);
