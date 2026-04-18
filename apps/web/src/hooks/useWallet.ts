import { useWeb3Auth } from './useWeb3Auth';

export function useWallet() {
  const {
    address,
    isConnected,
    isLoading,
    isReady,
    user,
    login,
    logout,
    disconnect,
  } = useWeb3Auth();

  return {
    address,
    isConnected,
    isConnecting: isLoading,
    isReady,
    isMetaMaskReady: false,
    error: null,
    user,
    connect: login,
    disconnect,
    shortAddress: address ? `${address.slice(0, 6)}...${address.slice(-4)}` : null,
    refreshBalances: () => {},
    refreshVaultBalances: () => {},
  };
}
