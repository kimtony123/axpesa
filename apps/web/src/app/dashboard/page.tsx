'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LogOut, Wallet, Loader2, RefreshCw, Eye, EyeOff, Lock, TrendingUp } from 'lucide-react';
import toast from 'react-hot-toast';
import { useWeb3Auth } from '@/hooks/useWeb3Auth';
import { useWalletStore } from '@/lib/walletStore';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [showBalances, setShowBalances] = useState(true);
  const { address, isConnected, isLoading, login, logout } = useWeb3Auth();
  const { balances, vaultBalances, setBalances, setVaultBalances } = useWalletStore();

  useEffect(() => {
    const token = localStorage.getItem('axpesa_token');
    
    if (!token && !isConnected) {
      setLoading(false);
      return;
    }

    if (token) {
      fetch(`${API_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(r => r.json())
        .then(d => {
          if (d.success) {
            setUser(d.data);
            if (d.data.walletAddress) {
              fetchBalances(d.data.walletAddress);
            }
          }
          setLoading(false);
        })
        .catch(() => {
          toast.error('Failed to load profile');
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, [isConnected]);

  const fetchBalances = async (walletAddress: string) => {
    try {
      const res = await fetch(`${API_URL}/api/wallet/balances?address=${walletAddress}`);
      const data = await res.json();
      if (data.success) {
        setBalances(data.data.balances || {});
        setVaultBalances(data.data.vaultBalances || {});
      }
    } catch (err) {
      console.error('Failed to fetch balances:', err);
    }
  };

  const handleLogin = async () => {
    await login();
  };

  const handleLogout = () => {
    logout();
    localStorage.removeItem('axpesa_token');
    localStorage.removeItem('axpesa_auth_type');
    localStorage.removeItem('axpesa_merchant');
    toast.success('Logged out');
    router.push('/');
  };

  const formatBalance = (balance: string | undefined) => {
    if (!showBalances) return '****';
    const value = parseFloat(balance || '0');
    return value.toFixed(4);
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 text-center max-w-md w-full">
          <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-4xl">🔐</span>
          </div>
          <h2 className="text-2xl font-bold mb-4">Login to Your Dashboard</h2>
          <p className="text-gray-600 mb-6">
            Sign in with your social account to access your AxPesa dashboard and manage your transactions.
          </p>
          <button
            onClick={handleLogin}
            className="w-full bg-purple-600 text-white py-4 rounded-lg font-semibold hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
          >
            <Wallet className="w-5 h-5" />
            Login with Social Account
          </button>
          <Link href="/login" className="block mt-4 text-gray-500 hover:text-purple-600">
            Use email login instead
          </Link>
        </div>
      </div>
    );
  }

  const shortAddress = address ? `${address.slice(0, 6)}...${address.slice(-4)}` : null;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <nav className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">A</span>
            </div>
            <span className="text-2xl font-bold">AxPesa</span>
          </Link>
          <div className="flex items-center gap-4">
            {user?.email && (
              <span className="text-gray-600">{user.email}</span>
            )}
            {address && (
              <div className="flex items-center gap-2 px-3 py-2 bg-green-100 rounded-lg">
                <Wallet className="w-4 h-4 text-green-700" />
                <span className="font-mono text-sm text-green-700">{shortAddress}</span>
              </div>
            )}
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-gray-600 hover:text-red-500"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </nav>
      </header>

      <main className="max-w-6xl mx-auto py-12 px-4">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">My Dashboard</h1>
          <button
            onClick={() => {
              if (address) fetchBalances(address);
              toast.success('Balances refreshed');
            }}
            className="flex items-center gap-2 px-4 py-2 text-purple-600 hover:bg-purple-50 rounded-lg"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {Object.entries(balances).map(([symbol, balance]) => (
            <div key={symbol} className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-500 text-sm">{symbol} Wallet</span>
                <button
                  onClick={() => setShowBalances(!showBalances)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  {showBalances ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-2xl font-bold">{formatBalance(balance)}</p>
              <p className="text-sm text-gray-500">${formatBalance(balance)} USD</p>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Lock className="w-5 h-5 text-purple-600" />
              Vault Holdings
            </h2>
            <span className="text-sm text-gray-500">90% locked, 10% liquidity</span>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Object.entries(vaultBalances).map(([symbol, vault]) => (
              <div key={symbol} className="border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <span className="text-xs font-bold text-purple-700">{symbol.slice(0, 2)}</span>
                  </div>
                  <span className="font-semibold">{symbol} Vault</span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Total Deposited</span>
                    <span className="font-medium">{formatBalance(vault.totalDeposit)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Locked (90%)</span>
                    <span className="font-medium text-orange-600">{formatBalance(vault.locked)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Withdrawable</span>
                    <span className="font-medium text-green-600">{formatBalance(vault.withdrawable)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="card">
            <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <Link href="/buy" className="flex items-center justify-between p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors">
                <div>
                  <p className="font-semibold text-green-700">Buy AxCNH</p>
                  <p className="text-sm text-green-600">Purchase with M-PESA</p>
                </div>
                <span className="text-green-700">→</span>
              </Link>
              <Link href="/sell" className="flex items-center justify-between p-4 bg-amber-50 rounded-lg hover:bg-amber-100 transition-colors">
                <div>
                  <p className="font-semibold text-amber-700">Sell AxCNH</p>
                  <p className="text-sm text-amber-600">Get KES instantly</p>
                </div>
                <span className="text-amber-700">→</span>
              </Link>
              <Link href="/transfer" className="flex items-center justify-between p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors">
                <div>
                  <p className="font-semibold text-purple-700">Send AxCNH</p>
                  <p className="text-sm text-purple-600">Transfer to friends</p>
                </div>
                <span className="text-purple-700">→</span>
              </Link>
              <Link href="/transactions" className="flex items-center justify-between p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
                <div>
                  <p className="font-semibold text-blue-700">Transactions</p>
                  <p className="text-sm text-blue-600">View history</p>
                </div>
                <span className="text-blue-700">→</span>
              </Link>
            </div>
          </div>

          <div className="card">
            <h2 className="text-xl font-bold mb-4">Market Stats</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  <span className="text-gray-600">AxCNH Rate</span>
                </div>
                <span className="font-bold text-green-700">157 KES</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Lock className="w-5 h-5 text-blue-600" />
                  <span className="text-gray-600">Network</span>
                </div>
                <span className="font-bold">Conflux eSpace Testnet</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Wallet className="w-5 h-5 text-purple-600" />
                  <span className="text-gray-600">Wallet</span>
                </div>
                <span className="font-bold text-purple-700">Web3Auth</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
