import { ethers } from 'ethers';
import 'dotenv/config';

const RPC_URL = process.env.CONFLUX_RPC_URL || 'https://evmtestnet.confluxrpc.com';
const PRIVATE_KEY = process.env.HOT_WALLET_PRIVATE_KEY || '';
const CHAIN_ID = parseInt(process.env.CONFLUX_CHAIN_ID || '71');

const VAULT_ADDRESSES = {
  AxCNH: process.env.AXCNH_VAULT_ADDRESS || '',
  USDTO: process.env.USDTO_VAULT_ADDRESS || '',
  BTC: process.env.BTC_VAULT_ADDRESS || '',
  ETH: process.env.ETH_VAULT_ADDRESS || '',
};

const TOKEN_ADDRESSES = {
  AxCNH: process.env.AXCNH_CONTRACT_ADDRESS || '',
  USDTO: process.env.USDTO_CONTRACT_ADDRESS || '',
  BTC: process.env.BTC_CONTRACT_ADDRESS || '',
  ETH: process.env.ETH_CONTRACT_ADDRESS || '',
};

const VAULT_ABI = [
  'function withdraw(address user, uint256 amount) external',
  'function deposit(uint256 amount) external',
  'function getUserInfo(address user) external view returns (uint256 totalDeposit, uint256 lockedAmount, uint256 withdrawable)',
  'function getVaultStats() external view returns (uint256 _totalDeposited, uint256 _totalLocked, uint256 _liquidityPool, uint256 _vaultBalance)',
  'function liquidityPool() external view returns (uint256)',
  'function token() external view returns (address)',
  'function tokenName() external view returns (string)',
  'function isOwner(address _address) external view returns (bool)',
  'function owner() external view returns (address)',
];

const ERC20_ABI = [
  'function balanceOf(address) view returns (uint256)',
  'function transfer(address to, uint256 amount) returns (bool)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function approve(address spender, uint256 amount) returns (bool)',
];

const MINTER_ABI = [
  'function mint(address to, uint256 amount) returns (bool)',
];

let provider: ethers.JsonRpcProvider;
let wallet: ethers.Wallet | null = null;

function getProvider(): ethers.JsonRpcProvider {
  if (!provider) {
    provider = new ethers.JsonRpcProvider(RPC_URL);
  }
  return provider;
}

function getWallet(): ethers.Wallet | null {
  if (!PRIVATE_KEY || PRIVATE_KEY === '' || PRIVATE_KEY.startsWith('0xyour-')) {
    console.warn('⚠️ HOT_WALLET_PRIVATE_KEY not configured. Blockchain transactions disabled.');
    return null;
  }
  
  const key = PRIVATE_KEY.startsWith('0x') ? PRIVATE_KEY : `0x${PRIVATE_KEY}`;
  
  if (!wallet) {
    try {
      wallet = new ethers.Wallet(key, getProvider());
      console.log(`✅ Wallet connected: ${wallet.address}`);
    } catch (err) {
      console.error('❌ Invalid wallet private key:', err);
      return null;
    }
  }
  return wallet;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyContract = any;

function getVault(tokenSymbol: string): { address: string; contract: AnyContract } | null {
  const vaultAddress = VAULT_ADDRESSES[tokenSymbol as keyof typeof VAULT_ADDRESSES];
  if (!vaultAddress) {
    console.warn(`⚠️ Vault for ${tokenSymbol} not configured`);
    return null;
  }
  
  const contract = new ethers.Contract(vaultAddress, VAULT_ABI, getProvider());
  return { address: vaultAddress, contract };
}

function getVaultWithWallet(tokenSymbol: string): { address: string; contract: AnyContract } | null {
  const vault = getVault(tokenSymbol);
  if (!vault) return null;
  
  const w = getWallet();
  if (!w) return null;
  
  return { address: vault.address, contract: vault.contract.connect(w) };
}

export const confluxService = {
  async getBlockNumber(): Promise<number> {
    return await getProvider().getBlockNumber();
  },

  async getBalance(address: string, tokenSymbol: string = 'AxCNH'): Promise<string> {
    const tokenAddress = TOKEN_ADDRESSES[tokenSymbol as keyof typeof TOKEN_ADDRESSES];
    if (!tokenAddress) {
      console.warn(`⚠️ Token ${tokenSymbol} address not configured`);
      return '0';
    }
    
    try {
      const contract = new ethers.Contract(tokenAddress, ERC20_ABI, getProvider());
      const balance = await contract.balanceOf(address);
      const decimals = await contract.decimals();
      return ethers.formatUnits(balance, decimals);
    } catch (err) {
      console.error(`Error getting ${tokenSymbol} balance:`, err);
      return '0';
    }
  },

  async getVaultBalance(address: string, tokenSymbol: string = 'AxCNH'): Promise<{ totalDeposit: string; locked: string; withdrawable: string }> {
    const vault = getVault(tokenSymbol);
    if (!vault) {
      return { totalDeposit: '0', locked: '0', withdrawable: '0' };
    }
    
    try {
      const [totalDeposit, locked, withdrawable] = await vault.contract.getUserInfo(address);
      return {
        totalDeposit: ethers.formatUnits(totalDeposit, 18),
        locked: ethers.formatUnits(locked, 18),
        withdrawable: ethers.formatUnits(withdrawable, 18),
      };
    } catch (err) {
      console.error(`Error getting vault info for ${tokenSymbol}:`, err);
      return { totalDeposit: '0', locked: '0', withdrawable: '0' };
    }
  },

  async getVaultStats(tokenSymbol: string = 'AxCNH'): Promise<{
    totalDeposited: string;
    totalLocked: string;
    liquidityPool: string;
    vaultBalance: string;
  }> {
    const vault = getVault(tokenSymbol);
    if (!vault) {
      return { totalDeposited: '0', totalLocked: '0', liquidityPool: '0', vaultBalance: '0' };
    }
    
    try {
      const [totalDeposited, totalLocked, liquidityPool, vaultBalance] = await vault.contract.getVaultStats();
      return {
        totalDeposited: ethers.formatUnits(totalDeposited, 18),
        totalLocked: ethers.formatUnits(totalLocked, 18),
        liquidityPool: ethers.formatUnits(liquidityPool, 18),
        vaultBalance: ethers.formatUnits(vaultBalance, 18),
      };
    } catch (err) {
      console.error(`Error getting vault stats for ${tokenSymbol}:`, err);
      return { totalDeposited: '0', totalLocked: '0', liquidityPool: '0', vaultBalance: '0' };
    }
  },

  async withdrawFromVault(toAddress: string, amount: number, tokenSymbol: string = 'AxCNH'): Promise<string> {
    const vault = getVaultWithWallet(tokenSymbol);
    if (!vault) {
      throw new Error(`Vault for ${tokenSymbol} not configured or wallet not available`);
    }
    
    const decimals = 18;
    const amountWei = ethers.parseUnits(amount.toString(), decimals);
    
    console.log(`📤 Withdrawing ${amount} ${tokenSymbol} from vault to ${toAddress}`);
    
    try {
      const tx = await vault.contract.withdraw(toAddress, amountWei, { gasLimit: 200000 });
      console.log(`📝 Transaction sent: ${tx.hash}`);
      
      const receipt = await tx.wait();
      console.log(`✅ Transaction confirmed: ${receipt.hash}`);
      
      return receipt.hash;
    } catch (err: any) {
      console.error(`Error withdrawing from vault:`, err);
      throw new Error(`Failed to withdraw: ${err.message || 'Unknown error'}`);
    }
  },

  async depositToVault(amount: number, tokenSymbol: string = 'AxCNH', userAddress?: string): Promise<string> {
    const vault = getVaultWithWallet(tokenSymbol);
    if (!vault) {
      throw new Error(`Vault for ${tokenSymbol} not configured or wallet not available`);
    }
    
    const decimals = 18;
    const amountWei = ethers.parseUnits(amount.toString(), decimals);
    
    console.log(`📥 Depositing ${amount} ${tokenSymbol} to vault from ${userAddress || 'wallet'}`);
    
    try {
      const tx = await vault.contract.deposit(amountWei, { gasLimit: 200000 });
      console.log(`📝 Transaction sent: ${tx.hash}`);
      
      const receipt = await tx.wait();
      console.log(`✅ Transaction confirmed: ${receipt.hash}`);
      
      return receipt.hash;
    } catch (err: any) {
      console.error(`Error depositing to vault:`, err);
      throw new Error(`Failed to deposit: ${err.message || 'Unknown error'}`);
    }
  },

  async approveToken(spender: string, amount: number, tokenSymbol: string = 'AxCNH'): Promise<string> {
    const tokenAddress = TOKEN_ADDRESSES[tokenSymbol as keyof typeof TOKEN_ADDRESSES];
    if (!tokenAddress) {
      throw new Error(`Token ${tokenSymbol} not configured`);
    }
    
    const w = getWallet();
    if (!w) {
      throw new Error('Wallet not configured');
    }
    
    const decimals = 18;
    const amountWei = ethers.parseUnits(amount.toString(), decimals);
    
    const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, w);
    
    console.log(`🔓 Approving ${amount} ${tokenSymbol} for ${spender}`);
    
    try {
      const tx = await tokenContract.approve(spender, amountWei, { gasLimit: 100000 });
      console.log(`📝 Approval transaction sent: ${tx.hash}`);
      
      const receipt = await tx.wait();
      console.log(`✅ Approval confirmed: ${receipt.hash}`);
      
      return receipt.hash;
    } catch (err: any) {
      console.error(`Error approving token:`, err);
      throw new Error(`Failed to approve: ${err.message || 'Unknown error'}`);
    }
  },

  async transferTokens(toAddress: string, amount: number, tokenSymbol: string = 'AxCNH'): Promise<string> {
    const tokenAddress = TOKEN_ADDRESSES[tokenSymbol as keyof typeof TOKEN_ADDRESSES];
    if (!tokenAddress) {
      throw new Error(`Token ${tokenSymbol} not configured`);
    }
    
    const w = getWallet();
    if (!w) {
      throw new Error('Wallet not configured');
    }
    
    const decimals = 18;
    const amountWei = ethers.parseUnits(amount.toString(), decimals);
    
    const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, w);
    
    console.log(`💸 Transferring ${amount} ${tokenSymbol} to ${toAddress}`);
    
    try {
      const tx = await tokenContract.transfer(toAddress, amountWei, { gasLimit: 100000 });
      console.log(`📝 Transfer transaction sent: ${tx.hash}`);
      
      const receipt = await tx.wait();
      console.log(`✅ Transfer confirmed: ${receipt.hash}`);
      
      return receipt.hash;
    } catch (err: any) {
      console.error(`Error transferring tokens:`, err);
      throw new Error(`Failed to transfer: ${err.message || 'Unknown error'}`);
    }
  },

  async mintTokens(toAddress: string, amount: number, tokenSymbol: string = 'AxCNH'): Promise<string> {
    const tokenAddress = TOKEN_ADDRESSES[tokenSymbol as keyof typeof TOKEN_ADDRESSES];
    if (!tokenAddress) {
      throw new Error(`Token ${tokenSymbol} not configured`);
    }
    
    const w = getWallet();
    if (!w) {
      throw new Error('Wallet not configured');
    }
    
    const decimals = 18;
    const amountWei = ethers.parseUnits(amount.toString(), decimals);
    
    const minterContract = new ethers.Contract(tokenAddress, MINTER_ABI, w);
    
    console.log(`🧪 Minting ${amount} ${tokenSymbol} to ${toAddress}`);
    
    try {
      const tx = await minterContract.mint(toAddress, amountWei, { gasLimit: 100000 });
      console.log(`📝 Mint transaction sent: ${tx.hash}`);
      
      const receipt = await tx.wait();
      console.log(`✅ Mint confirmed: ${receipt.hash}`);
      
      return receipt.hash;
    } catch (err: any) {
      console.error(`Error minting tokens:`, err);
      throw new Error(`Failed to mint: ${err.message || 'Unknown error'}`);
    }
  },

  async verifyTransaction(txHash: string): Promise<boolean> {
    try {
      const receipt = await getProvider().getTransactionReceipt(txHash);
      return receipt?.status === 1;
    } catch {
      return false;
    }
  },

  async generateWallet(): Promise<{ address: string; privateKey: string }> {
    const wallet = ethers.Wallet.createRandom();
    return {
      address: wallet.address,
      privateKey: wallet.privateKey,
    };
  },

  async getNetworkInfo() {
    const network = await getProvider().getNetwork();
    return {
      chainId: Number(network.chainId),
      name: network.name,
    };
  },

  async sendCFX(toAddress: string, amountCFX: number): Promise<string> {
    const w = getWallet();
    if (!w) {
      throw new Error('Wallet not configured for CFX transfers');
    }
    
    const amountWei = ethers.parseEther(amountCFX.toString());
    
    console.log(`💸 Sending ${amountCFX} CFX to ${toAddress}`);
    
    try {
      const tx = await w.sendTransaction({
        to: toAddress,
        value: amountWei,
        gasLimit: 21000,
      });
      
      console.log(`📝 CFX Transaction sent: ${tx.hash}`);
      
      const receipt = await tx.wait();
      if (!receipt) {
        throw new Error('Transaction failed - no receipt');
      }
      console.log(`✅ CFX Transaction confirmed: ${receipt.hash}`);
      
      return receipt.hash;
    } catch (err: any) {
      console.error(`Error sending CFX:`, err);
      throw new Error(`Failed to send CFX: ${err.message || 'Unknown error'}`);
    }
  },

  async getCFXBalance(address: string): Promise<string> {
    try {
      const balance = await getProvider().getBalance(address);
      return ethers.formatEther(balance);
    } catch (err) {
      console.error(`Error getting CFX balance:`, err);
      return '0';
    }
  },

  isConfigured(): boolean {
    return !!PRIVATE_KEY && !PRIVATE_KEY.startsWith('0xyour-') && !!VAULT_ADDRESSES.AxCNH;
  },

  getVaultAddress(tokenSymbol: string = 'AxCNH'): string {
    return VAULT_ADDRESSES[tokenSymbol as keyof typeof VAULT_ADDRESSES] || '';
  },

  getTokenAddress(tokenSymbol: string = 'AxCNH'): string {
    return TOKEN_ADDRESSES[tokenSymbol as keyof typeof TOKEN_ADDRESSES] || '';
  },

  getSupportedTokens(): string[] {
    return Object.keys(VAULT_ADDRESSES).filter(k => VAULT_ADDRESSES[k as keyof typeof VAULT_ADDRESSES]);
  },
};

export default confluxService;
