import { ethers } from 'ethers';

const MESSAGE_TO_SIGN = 'Sign this message to login to AxPesa: ';

export async function connectMetaMask() {
  if (typeof window === 'undefined' || !window.ethereum) {
    throw new Error('MetaMask not detected! Please install MetaMask browser extension.');
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
  } catch (err) {
    if (err.code === 4001) {
      console.log('User rejected the request');
    } else {
      console.error('MetaMask connection error:', err);
    }
    return null;
  }
}

export function isMetaMaskInstalled() {
  if (typeof window === 'undefined') return false;
  return !!window.ethereum?.isMetaMask;
}

export async function getCurrentAccount() {
  if (typeof window === 'undefined' || !window.ethereum) return null;
  
  try {
    const accounts = await window.ethereum.request({ method: 'eth_accounts' });
    return accounts && accounts.length > 0 ? accounts[0] : null;
  } catch {
    return null;
  }
}

export function onAccountChange(callback) {
  if (typeof window === 'undefined' || !window.ethereum) return;
  
  window.ethereum.on('accountsChanged', (accounts) => {
    callback(accounts);
  });
}

export function onChainChange(callback) {
  if (typeof window === 'undefined' || !window.ethereum) return;
  
  window.ethereum.on('chainChanged', (chainId) => {
    callback(parseInt(chainId, 16));
  });
}

export function disconnectMetaMask() {
  localStorage.removeItem('axpesa-wallet');
}

export async function getProvider() {
  if (typeof window === 'undefined' || !window.ethereum) return null;
  return new ethers.BrowserProvider(window.ethereum);
}

export async function reconnectIfStored(storedAddress, onConnect) {
  if (!storedAddress || typeof window === 'undefined' || !window.ethereum) return false;
  
  try {
    const accounts = await window.ethereum.request({ method: 'eth_accounts' });
    if (accounts && accounts.length > 0 && accounts[0].toLowerCase() === storedAddress.toLowerCase()) {
      if (onConnect) onConnect(accounts[0]);
      return true;
    }
  } catch (err) {
    console.error('Reconnection check failed:', err);
  }
  return false;
}

export async function transferTokens(tokenAddress, toAddress, amount, decimals = 18) {
  if (typeof window === 'undefined' || !window.ethereum) {
    throw new Error('MetaMask not detected');
  }
  
  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  
  const abi = [
    'function transfer(address to, uint256 amount) returns (bool)',
  ];
  
  const tokenContract = new ethers.Contract(tokenAddress, abi, signer);
  const amountWei = ethers.parseUnits(amount.toString(), decimals);
  
  console.log(`Transferring ${amount} tokens to ${toAddress}`);
  const tx = await tokenContract.transfer(toAddress, amountWei);
  console.log(`Transaction sent: ${tx.hash}`);
  
  return tx;
}

export async function waitForTransaction(txHash, confirmations = 1) {
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