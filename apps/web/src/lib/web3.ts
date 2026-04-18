import { createPublicClient, createWalletClient, http, custom, formatEther } from 'viem';
import { mainnet, polygon, confluxESpaceTestnet, confluxESpace } from 'viem/chains';

export const CONFLUX_CHAIN = confluxESpaceTestnet;

export const VAULT_ADDRESSES = {
  AxCNH: process.env.NEXT_PUBLIC_AXCNH_VAULT_ADDRESS || '',
  USDTO: process.env.NEXT_PUBLIC_USDTO_VAULT_ADDRESS || '',
  BTC: process.env.NEXT_PUBLIC_BTC_VAULT_ADDRESS || '',
  ETH: process.env.NEXT_PUBLIC_ETH_VAULT_ADDRESS || '',
} as const;

export const TOKEN_ADDRESSES = {
  AxCNH: process.env.NEXT_PUBLIC_AXCNH_CONTRACT_ADDRESS || '',
  USDTO: process.env.NEXT_PUBLIC_USDTO_CONTRACT_ADDRESS || '',
  BTC: process.env.NEXT_PUBLIC_BTC_CONTRACT_ADDRESS || '',
  ETH: process.env.NEXT_PUBLIC_ETH_CONTRACT_ADDRESS || '',
} as const;

export const VAULT_ABI = [
  {
    name: 'withdraw',
    type: 'function',
    inputs: [
      { name: 'user', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    name: 'deposit',
    type: 'function',
    inputs: [{ name: 'amount', type: 'uint256' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    name: 'getUserInfo',
    type: 'function',
    inputs: [{ name: 'user', type: 'address' }],
    outputs: [
      { name: 'totalDeposit', type: 'uint256' },
      { name: 'lockedAmount', type: 'uint256' },
      { name: 'withdrawable', type: 'uint256' },
    ],
    stateMutability: 'view',
  },
  {
    name: 'getVaultStats',
    type: 'function',
    inputs: [],
    outputs: [
      { name: '_totalDeposited', type: 'uint256' },
      { name: '_totalLocked', type: 'uint256' },
      { name: '_liquidityPool', type: 'uint256' },
      { name: '_vaultBalance', type: 'uint256' },
    ],
    stateMutability: 'view',
  },
  {
    name: 'liquidityPool',
    type: 'function',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    name: 'token',
    type: 'function',
    inputs: [],
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
  },
  {
    name: 'tokenName',
    type: 'function',
    inputs: [],
    outputs: [{ name: '', type: 'string' }],
    stateMutability: 'view',
  },
] as const;

export const ERC20_ABI = [
  {
    name: 'balanceOf',
    type: 'function',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    name: 'transfer',
    type: 'function',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
  },
  {
    name: 'approve',
    type: 'function',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
  },
  {
    name: 'allowance',
    type: 'function',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    name: 'decimals',
    type: 'function',
    inputs: [],
    outputs: [{ name: '', type: 'uint8' }],
    stateMutability: 'view',
  },
  {
    name: 'symbol',
    type: 'function',
    inputs: [],
    outputs: [{ name: '', type: 'string' }],
    stateMutability: 'view',
  },
] as const;

export function getPublicClient() {
  return createPublicClient({
    chain: CONFLUX_CHAIN,
    transport: http(),
  });
}

export function getWalletClient(account: `0x${string}`) {
  return createWalletClient({
    account,
    chain: CONFLUX_CHAIN,
    transport: custom(window.ethereum),
  });
}

export async function connectWallet(): Promise<`0x${string}` | null> {
  if (typeof window === 'undefined' || !window.ethereum) {
    throw new Error('MetaMask is not installed');
  }
  
  try {
    const accounts = await window.ethereum.request({
      method: 'eth_requestAccounts',
    });
    
    if (accounts.length > 0) {
      return accounts[0] as `0x${string}`;
    }
    return null;
  } catch (error) {
    console.error('Error connecting wallet:', error);
    throw error;
  }
}

export async function getConnectedAccount(): Promise<`0x${string}` | null> {
  if (typeof window === 'undefined' || !window.ethereum) {
    return null;
  }
  
  try {
    const accounts = await window.ethereum.request({
      method: 'eth_accounts',
    });
    
    if (accounts.length > 0) {
      return accounts[0] as `0x${string}`;
    }
    return null;
  } catch {
    return null;
  }
}

export async function switchToConfluxChain() {
  if (typeof window === 'undefined' || !window.ethereum) {
    throw new Error('MetaMask is not installed');
  }
  
  const chainId = `0x${CONFLUX_CHAIN.id.toString(16)}`;
  
  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId }],
    });
  } catch (switchError: any) {
    if (switchError.code === 4902) {
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [
          {
            chainId,
            chainName: 'Conflux eSpace Testnet',
            nativeCurrency: {
              name: 'CFX',
              symbol: 'CFX',
              decimals: 18,
            },
            rpcUrls: [CONFLUX_CHAIN.rpcUrls.default.http[0]],
            blockExplorerUrls: ['https://evmtestnet.confluxscan.org/'],
          },
        ],
      });
    } else {
      throw switchError;
    }
  }
}

export async function getBalance(address: string, tokenAddress: string): Promise<string> {
  const client = getPublicClient();
  
  try {
    const balance = await client.readContract({
      address: tokenAddress as `0x${string}`,
      abi: ERC20_ABI,
      functionName: 'balanceOf',
      args: [address as `0x${string}`],
    });
    
    return formatEther(balance as bigint);
  } catch (error) {
    console.error('Error getting balance:', error);
    return '0';
  }
}

export async function getVaultBalance(address: string, vaultAddress: string) {
  const client = getPublicClient();
  
  try {
    const [totalDeposit, lockedAmount, withdrawable] = await client.readContract({
      address: vaultAddress as `0x${string}`,
      abi: VAULT_ABI,
      functionName: 'getUserInfo',
      args: [address as `0x${string}`],
    });
    
    return {
      totalDeposit: formatEther(totalDeposit as bigint),
      locked: formatEther(lockedAmount as bigint),
      withdrawable: formatEther(withdrawable as bigint),
    };
  } catch (error) {
    console.error('Error getting vault balance:', error);
    return { totalDeposit: '0', locked: '0', withdrawable: '0' };
  }
}

export async function getVaultStats(vaultAddress: string) {
  const client = getPublicClient();
  
  try {
    const stats = await client.readContract({
      address: vaultAddress as `0x${string}`,
      abi: VAULT_ABI,
      functionName: 'getVaultStats',
    });
    
    return {
      totalDeposited: formatEther(stats[0] as bigint),
      totalLocked: formatEther(stats[1] as bigint),
      liquidityPool: formatEther(stats[2] as bigint),
      vaultBalance: formatEther(stats[3] as bigint),
    };
  } catch (error) {
    console.error('Error getting vault stats:', error);
    return { totalDeposited: '0', totalLocked: '0', liquidityPool: '0', vaultBalance: '0' };
  }
}

export async function depositToVault(amount: string, vaultAddress: string, account: `0x${string}`) {
  const walletClient = getWalletClient(account);
  
  const hash = await walletClient.writeContract({
    address: vaultAddress as `0x${string}`,
    abi: VAULT_ABI,
    functionName: 'deposit',
    args: [BigInt(amount)],
  });
  
  return hash;
}

export async function approveToken(amount: string, tokenAddress: string, spender: string, account: `0x${string}`) {
  const walletClient = getWalletClient(account);
  
  const hash = await walletClient.writeContract({
    address: tokenAddress as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'approve',
    args: [spender as `0x${string}`, BigInt(amount)],
  });
  
  return hash;
}
