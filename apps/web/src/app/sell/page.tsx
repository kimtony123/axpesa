'use client';

import { useState, useEffect } from 'react';
import { ArrowRight, Loader2, Smartphone, Building2, Wallet, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useWeb3Auth } from '@/hooks/useWeb3Auth';
import { useWalletStore } from '@/lib/walletStore';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

const PAYOUT_METHODS = [
  { id: 'mpesa', name: 'M-PESA', icon: Smartphone, countries: 'Kenya' },
  { id: 'bank', name: 'Bank Transfer', icon: Building2, countries: 'KE, NG, UG' },
];

export default function SellPage() {
  const { address, isConnected, login } = useWeb3Auth();
  const { balances, vaultBalances, setBalances, setVaultBalances } = useWalletStore();
  const shortAddress = address ? `${address.slice(0, 6)}...${address.slice(-4)}` : null;
  const [axcnhAmount, setAxcnhAmount] = useState(10);
  const [payoutMethod, setPayoutMethod] = useState('mpesa');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [bankCode, setBankCode] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [depositing, setDepositing] = useState(false);
  const [rate, setRate] = useState(18.87);
  const [rateLoading, setRateLoading] = useState(true);

  const fee = (axcnhAmount * rate * 0.025).toFixed(2);
  const payoutAmount = ((axcnhAmount * rate) - parseFloat(fee)).toFixed(2);
  
  const walletBalance = parseFloat(balances.AxCNH || '0');
  const vaultBalance = vaultBalances.AxCNH;

  const fetchBalances = async () => {
    if (!address) return;
    try {
      const res = await fetch(`${API_URL}/api/wallet/balances?address=${address}`);
      const data = await res.json();
      if (data.success) {
        setBalances(data.data.balances || {});
        setVaultBalances(data.data.vaultBalances || {});
      }
    } catch (err) {
      console.error('Failed to fetch balances:', err);
    }
  };

  useEffect(() => {
    if (isConnected && address) {
      fetchBalances();
    }
  }, [isConnected, address]);

  useEffect(() => {
    setRateLoading(true);
    fetch(`${API_URL}/api/offramp/rate/KES`)
      .then(r => r.json())
      .then(d => {
        if (d.success && d.data.rates) {
          setRate(d.data.rates.KES);
        }
        setRateLoading(false);
      })
      .catch(() => {
        setRate(18.87);
        setRateLoading(false);
      });
  }, []);

  const handleDeposit = async () => {
    if (!isConnected || !address) {
      toast.error('Please login first');
      return;
    }

    const amount = axcnhAmount;
    if (amount > walletBalance) {
      toast.error('Insufficient AxCNH balance');
      return;
    }

    setDepositing(true);
    try {
      const token = localStorage.getItem('axpesa_token');
      if (!token) {
        toast.error('Please sign in to continue');
        return;
      }

      const res = await fetch(`${API_URL}/api/offramp/initiate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          axcnhAmount,
          payoutMethod,
          payoutDetails: {
            phoneNumber: payoutMethod === 'mpesa' ? phoneNumber : undefined,
            bankCode: payoutMethod === 'bank' ? bankCode : undefined,
            accountNumber: payoutMethod === 'bank' ? accountNumber : undefined,
          },
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Sell order initiated!');
        await fetchBalances();
      } else {
        toast.error(data.error?.message || 'Failed to initiate');
      }
    } catch (err: any) {
      console.error('Sell error:', err);
      toast.error(err.message || 'Failed to sell');
    } finally {
      setDepositing(false);
    }
  };

  const initiateOfframp = async (depositTxHash: string) => {
    const token = localStorage.getItem('axpesa_token');
    if (!token) {
      toast.error('Please sign in to continue');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/offramp/initiate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          axcnhAmount,
          payoutMethod,
          payoutDetails: {
            phoneNumber: payoutMethod === 'mpesa' ? phoneNumber : undefined,
            bankCode: payoutMethod === 'bank' ? bankCode : undefined,
            accountNumber: payoutMethod === 'bank' ? accountNumber : undefined,
          },
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Sell order initiated! Payout processing...');
      } else {
        toast.error(data.error?.message || 'Failed to initiate');
      }
    } catch (err) {
      toast.error('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <nav className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">A</span>
            </div>
            <span className="text-2xl font-bold">AxPesa</span>
          </div>
          <div className="flex items-center gap-4">
            {isConnected ? (
              <span className="px-4 py-2 bg-green-100 text-green-700 rounded-lg font-mono text-sm">
                {shortAddress}
              </span>
            ) : (
              <button
                onClick={login}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                <Wallet className="w-4 h-4" />
                Login
              </button>
            )}
          </div>
        </nav>
      </header>

      <main className="max-w-2xl mx-auto py-12 px-4">
        <h1 className="text-3xl font-bold mb-2">Sell AxCNH</h1>
        <p className="text-gray-600 mb-8">Convert AxCNH to KES and receive via M-PESA or Bank</p>

        {!isConnected ? (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <Wallet className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h2 className="text-xl font-semibold mb-2">Connect Your Wallet</h2>
            <p className="text-gray-600 mb-6">Login to sell AxCNH</p>
            <button
              onClick={login}
              className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 inline-flex items-center gap-2"
            >
              <Wallet className="w-5 h-5" />
              Login
            </button>
          </div>
        ) : (
          <form className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <label className="block text-sm font-medium mb-2">AxCNH Amount to Sell</label>
              <div className="relative">
                <input
                  type="number"
                  value={axcnhAmount}
                  onChange={e => setAxcnhAmount(Number(e.target.value))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-2xl font-bold pr-20 focus:ring-2 focus:ring-blue-500"
                  min={1}
                  max={walletBalance}
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-semibold">AxCNH</span>
              </div>
              <div className="flex justify-between mt-2 text-sm text-gray-500">
                <span>Available: {walletBalance.toFixed(4)} AxCNH</span>
                <button
                  type="button"
                  onClick={() => setAxcnhAmount(walletBalance)}
                  className="text-blue-600 hover:underline"
                >
                  Max
                </button>
              </div>
              <p className="text-sm text-gray-500 mt-2">Rate: 1 AxCNH = {rate} KES</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
              <label className="block text-sm font-medium mb-2">You Receive</label>
              <div className="flex items-center gap-3 p-4 bg-amber-50 rounded-lg border border-amber-200">
                <div className="w-12 h-12 bg-amber-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-lg">K</span>
                </div>
                <div>
                  <p className="text-2xl font-bold text-amber-700">{payoutAmount} KES</p>
                  <p className="text-sm text-gray-500">After {fee} KES fee (2.5%)</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="font-semibold mb-4">Payout Method</h3>
              <div className="grid gap-3">
                {PAYOUT_METHODS.map(method => (
                  <button
                    key={method.id}
                    type="button"
                    onClick={() => setPayoutMethod(method.id)}
                    className={`flex items-center gap-4 p-4 rounded-lg border-2 transition-all ${
                      payoutMethod === method.id ? 'border-blue-600 bg-blue-50' : 'border-gray-200'
                    }`}
                  >
                    <method.icon className={`w-6 h-6 ${payoutMethod === method.id ? 'text-blue-600' : 'text-gray-400'}`} />
                    <div className="text-left flex-1">
                      <p className="font-medium">{method.name}</p>
                      <p className="text-sm text-gray-500">{method.countries}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {payoutMethod === 'mpesa' && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <label className="block text-sm font-medium mb-2">Phone Number</label>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={e => setPhoneNumber(e.target.value)}
                  placeholder="254700123456"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                  required
                />
              </div>
            )}

            {payoutMethod === 'bank' && (
              <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Bank Code</label>
                  <input
                    type="text"
                    value={bankCode}
                    onChange={e => setBankCode(e.target.value)}
                    placeholder="e.g., MPSSKE"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Account Number</label>
                  <input
                    type="text"
                    value={accountNumber}
                    onChange={e => setAccountNumber(e.target.value)}
                    placeholder="Account number"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>
            )}

            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <div className="flex gap-2">
                <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-700">
                  <p className="font-medium">How selling works:</p>
                  <ol className="list-decimal list-inside mt-2 space-y-1">
                    <li>Your AxCNH will be deposited to the vault</li>
                    <li>90% is locked, 10% adds to liquidity pool</li>
                    <li>Payout is processed via Flutterwave after deposit</li>
                  </ol>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleDeposit}
              disabled={loading || depositing || axcnhAmount > walletBalance || axcnhAmount <= 0}
              className="w-full py-4 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-lg font-semibold"
            >
              {depositing || loading ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> Processing...</>
              ) : (
                <>Sell {axcnhAmount} AxCNH <ArrowRight className="w-5 h-5" /></>
              )}
            </button>
          </form>
        )}
      </main>
    </div>
  );
}
