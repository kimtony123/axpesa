import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const getStoredAddress = () => {
  try {
    const stored = localStorage.getItem('axpesa-wallet')
    return stored || null
  } catch {
    return null
  }
}

const useWalletStore = create((set, get) => ({
  address: getStoredAddress(),
  isConnected: !!getStoredAddress(),
  isConnecting: false,
  chainId: null,
  error: null,
  balances: {},
  vaultBalances: {},

  setWallet: (address) => {
    try {
      localStorage.setItem('axpesa-wallet', address)
    } catch {}
    set({ address, isConnected: true, isConnecting: false, error: null })
  },

  setConnecting: (connecting) => set({ isConnecting: connecting }),

  setError: (error) => set({ error, isConnecting: false }),

  disconnect: () => {
    try {
      localStorage.removeItem('axpesa-wallet')
      localStorage.removeItem('axpesa_token')
      localStorage.removeItem('axpesa_auth_type')
      localStorage.removeItem('axpesa_user')
    } catch {}
    set({
      address: null,
      isConnected: false,
      isConnecting: false,
      balances: {},
      vaultBalances: {},
      error: null,
    })
  },

  setChainId: (chainId) => set({ chainId }),
  setBalances: (balances) => set({ balances }),
  setVaultBalances: (vaultBalances) => set({ vaultBalances }),
}))

export default useWalletStore;