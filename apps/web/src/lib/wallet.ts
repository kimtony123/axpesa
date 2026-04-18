import { ethers } from 'ethers';

declare global {
  interface Window {
    ethereum?: any;
  }
}

const MESSAGE_TO_SIGN = 'Sign this message to login to AxPesa: ';

export async function connectMetaMask(): Promise<{ address: string; signature: string } | null> {
  if (typeof window === 'undefined' || !window.ethereum) {
    alert('MetaMask not detected! Please install MetaMask browser extension.');
    return null;
  }

  try {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const accounts = await provider.send('eth_requestAccounts', []);
    
    if (!accounts || accounts.length === 0) {
      throw new Error('No accounts found');
    }

    const address = accounts[0];
    const signer = await provider.getSigner();
    const signature = await signer.signMessage(MESSAGE_TO_SIGN + address);

    return { address, signature };
  } catch (err: any) {
    if (err.code === 4001) {
      console.log('User rejected the request');
    } else {
      console.error('MetaMask connection error:', err);
    }
    return null;
  }
}

export function isMetaMaskInstalled(): boolean {
  if (typeof window === 'undefined') return false;
  return !!window.ethereum?.isMetaMask;
}

export async function getCurrentAccount(): Promise<string | null> {
  if (typeof window === 'undefined' || !window.ethereum) return null;
  
  try {
    const accounts = await window.ethereum.request({ method: 'eth_accounts' });
    return accounts && accounts.length > 0 ? accounts[0] : null;
  } catch {
    return null;
  }
}

export function onAccountChange(callback: (accounts: string[]) => void) {
  if (typeof window === 'undefined' || !window.ethereum) return;
  
  window.ethereum.on('accountsChanged', callback);
}

export function disconnectMetaMask() {
  localStorage.removeItem('axpesa_wallet_address');
}
