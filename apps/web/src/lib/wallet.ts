import { ethers, type TransactionResponse } from 'ethers';

const MESSAGE_TO_SIGN = 'Sign this message to login to AxPesa: ';
const REGISTER_MESSAGE = 'Register to AxPesa: ';

declare global {
  interface Window {
    ethereum?: {
      isMetaMask?: boolean;
      request: (args: { method: string; params?: any[] }) => Promise<any>;
      on: (event: string, callback: (...args: any[]) => void) => void;
      removeListener: (event: string, callback: (...args: any[]) => void) => void;
    };
  }
}

export interface WalletResult {
  address: string;
  signature: string;
}

export async function connectMetaMask(messageType: 'login' | 'register' = 'register'): Promise<WalletResult | null> {
  if (typeof window === 'undefined' || !window.ethereum) {
    throw new Error('MetaMask not detected! Please install MetaMask browser extension.');
  }

  const message = messageType === 'login' ? MESSAGE_TO_SIGN : REGISTER_MESSAGE;

  try {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const accounts = await provider.send('eth_requestAccounts', []) as string[];
    
    if (!accounts || accounts.length === 0) {
      throw new Error('No accounts found');
    }

    const address = accounts[0];
    const signer = await provider.getSigner();
    const signature = await signer.signMessage(message + address);

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

export async function signRegisterMessage(): Promise<WalletResult | null> {
  if (typeof window === 'undefined' || !window.ethereum) {
    throw new Error('MetaMask not detected! Please install MetaMask browser extension.');
  }

  try {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const accounts = await provider.send('eth_requestAccounts', []) as string[];
    
    if (!accounts || accounts.length === 0) {
      throw new Error('No accounts found');
    }

    const address = accounts[0];
    const signer = await provider.getSigner();
    const signature = await signer.signMessage(REGISTER_MESSAGE + address);

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
    const accounts = await window.ethereum.request({ method: 'eth_accounts' }) as string[];
    return accounts && accounts.length > 0 ? accounts[0] : null;
  } catch {
    return null;
  }
}

export function onAccountChange(callback: (accounts: string[]) => void): void {
  if (typeof window === 'undefined' || !window.ethereum) return;
  
  window.ethereum.on('accountsChanged', (accounts: string[]) => {
    callback(accounts);
  });
}

export function onChainChange(callback: (chainId: number) => void): void {
  if (typeof window === 'undefined' || !window.ethereum) return;
  
  window.ethereum.on('chainChanged', (chainId: string) => {
    callback(parseInt(chainId, 16));
  });
}

export function disconnectMetaMask(): void {
  localStorage.removeItem('axpesa-wallet');
}

export async function getProvider(): Promise<ethers.BrowserProvider | null> {
  if (typeof window === 'undefined' || !window.ethereum) return null;
  return new ethers.BrowserProvider(window.ethereum);
}

export async function reconnectIfStored(storedAddress: string, onConnect?: (address: string) => void): Promise<boolean> {
  if (!storedAddress || typeof window === 'undefined' || !window.ethereum) return false;
  
  try {
    const accounts = await window.ethereum.request({ method: 'eth_accounts' }) as string[];
    if (accounts && accounts.length > 0 && accounts[0].toLowerCase() === storedAddress.toLowerCase()) {
      if (onConnect) onConnect(accounts[0]);
      return true;
    }
  } catch (err) {
    console.error('Reconnection check failed:', err);
  }
  return false;
}

export async function transferTokens(
  tokenAddress: string, 
  toAddress: string, 
  amount: string, 
  decimals: number = 18
): Promise<TransactionResponse> {
  if (typeof window === 'undefined' || !window.ethereum) {
    throw new Error('MetaMask not detected');
  }
  
  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  
  const abi = [
    'function transfer(address to, uint256 amount) returns (bool)',
  ];
  
  const tokenContract = new ethers.Contract(tokenAddress, abi, signer);
  const amountWei = ethers.parseUnits(amount, decimals);
  
  console.log(`Transferring ${amount} tokens to ${toAddress}`);
  const tx = await tokenContract.transfer(toAddress, amountWei) as TransactionResponse;
  console.log(`Transaction sent: ${tx.hash}`);
  
  return tx;
}

export async function waitForTransaction(txHash: string, confirmations: number = 1): Promise<boolean> {
  if (typeof window === 'undefined' || !window.ethereum) {
    throw new Error('MetaMask not detected');
  }
  
  const provider = new ethers.BrowserProvider(window.ethereum);
  
  console.log(`Waiting for transaction: ${txHash}`);
  const receipt = await provider.waitForTransaction(txHash, confirmations);
  
  if (receipt.status === 1) {
    console.log(`Transaction confirmed: ${receipt.hash}`);
    return true;
  } else {
    console.error(`Transaction failed: ${receipt.hash}`);
    return false;
  }
}