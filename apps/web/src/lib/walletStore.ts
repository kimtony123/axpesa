import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface WalletState {
  address: string | null;
  isConnected: boolean;
  isConnecting: boolean;
  chainId: number | null;
  error: string | null;
  balances: Record<string, string>;
  vaultBalances: Record<string, string>;
  
  setWallet: (address: string) => void;
  setConnecting: (connecting: boolean) => void;
  setError: (error: string | null) => void;
  disconnect: () => void;
  setChainId: (chainId: number) => void;
  setBalances: (balances: Record<string, string>) => void;
  setVaultBalances: (vaultBalances: Record<string, string>) => void;
}

const useWalletStore = create<WalletState>()(
  persist(
    (set) => ({
      address: null,
      isConnected: false,
      isConnecting: false,
      chainId: null,
      error: null,
      balances: {},
      vaultBalances: {},

      setWallet: (address) => {
        localStorage.setItem('axpesa-wallet', address);
        set({ address, isConnected: true, isConnecting: false, error: null });
      },

      setConnecting: (connecting) => set({ isConnecting: connecting }),

      setError: (error) => set({ error, isConnecting: false }),

      disconnect: () => {
        localStorage.removeItem('axpesa-wallet');
        localStorage.removeItem('axpesa_token');
        localStorage.removeItem('axpesa_auth_type');
        localStorage.removeItem('axpesa_user');
        set({
          address: null,
          isConnected: false,
          isConnecting: false,
          balances: {},
          vaultBalances: {},
          error: null,
        });
      },

      setChainId: (chainId) => set({ chainId }),
      setBalances: (balances) => set({ balances }),
      setVaultBalances: (vaultBalances) => set({ vaultBalances }),
    }),
    {
      name: 'axpesa-wallet-state',
    }
  )
);

export default useWalletStore;