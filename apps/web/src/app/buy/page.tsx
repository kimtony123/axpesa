'use client';

import { useState, useEffect } from 'react';
import { ArrowRight, Loader2, Smartphone, CreditCard, Building2, Wallet, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';
import { useWeb3Auth } from '@/hooks/useWeb3Auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

const TOKENS = [
  { symbol: 'AxCNH', name: 'Chinese Yuan', icon: '¥', decimals: 18 },
  { symbol: 'USDTO', name: 'USDT', icon: '$', decimals: 18 },
  { symbol: 'BTC', name: 'Bitcoin', icon: '₿', decimals: 8 },
  { symbol: 'ETH', name: 'Ethereum', icon: 'Ξ', decimals: 18 },
];

const PAYMENT_METHODS = [
  { id: 'mpesa', name: 'M-PESA', icon: Smartphone, countries: 'Kenya, Tanzania, Uganda' },
  { id: 'card', name: 'Card', icon: CreditCard, countries: 'Visa, Mastercard' },
  { id: 'bank_transfer', name: 'Bank Transfer', icon: Building2, countries: 'NG, KE, UG, ZA, GH' },
];

const CURRENCIES = [
  { code: 'KES', name: 'Kenyan Shilling', flag: '🇰🇪' },
  { code: 'UGX', name: 'Ugandan Shilling', flag: '🇺🇬' },
  { code: 'NGN', name: 'Nigerian Naira', flag: '🇳🇬' },
  { code: 'USD', name: 'US Dollar', flag: '🇺🇸' },
];

const TOKEN_ICONS: Record<string, string> = {
  AxCNH: '¥',
  USDTO: '$',
  BTC: '₿',
  ETH: 'Ξ',
};

export default function BuyPage() {
  const { address, isConnected, login, isLoading } = useWeb3Auth();
  const shortAddress = address ? `${address.slice(0, 6)}...${address.slice(-4)}` : null;
  const [amount, setAmount] = useState(1000);
  const [currency, setCurrency] = useState('KES');
  const [selectedToken, setSelectedToken] = useState(TOKENS[0]);
  const [showTokenDropdown, setShowTokenDropdown] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('mpesa');
  const [walletAddress, setWalletAddress] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [rate, setRate] = useState(18.87);
  const [rateLoading, setRateLoading] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchRates();
  }, [currency, selectedToken]);

  useEffect(() => {
    if (isConnected && address) {
      setWalletAddress(address);
    }
  }, [isConnected, address]);

  const fetchRates = () => {
    setRateLoading(true);
    fetch(`${API_URL}/api/onramp/rates`)
      .then(r => r.json())
      .then(d => {
        if (d.success && d.data.rates) {
          const rates = d.data.rates;
          const fiatRate = rates[currency as keyof typeof rates] || rates.KES;
          
          // Adjust rate based on selected token
          // AxCNH is pegged to CNY (rate is directly KES/CNY)
          // For other tokens, we would need live prices, but for simplicity:
          // USDTO ≈ USD, BTC, ETH need separate rate calculations
          
          let tokenRate = fiatRate;
          if (selectedToken.symbol === 'USDTO') {
            // USDTO is pegged to USD
            tokenRate = fiatRate * (rates.USD / rates.CNH);
          } else if (selectedToken.symbol === 'BTC') {
            // Approximate BTC/KES rate (would need live data)
            tokenRate = fiatRate * 0.000027; // ~1 BTC = 700,000 CNY
          } else if (selectedToken.symbol === 'ETH') {
            // Approximate ETH/KES rate
            tokenRate = fiatRate * 0.00042; // ~1 ETH = 45,000 CNY
          }
          
          setRate(tokenRate);
        }
        setRateLoading(false);
      })
      .catch(() => {
        setRate(18.87);
        setRateLoading(false);
      });
  };

  const tokenAmount = rate > 0 ? (amount / rate).toFixed(selectedToken.decimals > 6 ? 6 : 4) : '0';
  const fee = (amount * 0.02).toFixed(2);
  const total = (amount + parseFloat(fee)).toFixed(2);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isConnected) {
      toast.error('Please connect your wallet first');
      return;
    }
    
    if (paymentMethod === 'mpesa' && !phoneNumber) {
      toast.error('Please enter your phone number');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/onramp/initiate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fiatAmount: amount,
          fiatCurrency: currency,
          paymentMethod,
          walletAddress,
          phoneNumber,
          email,
          tokenSymbol: selectedToken.symbol,
        }),
      });
      const data = await res.json();
      if (data.success && data.data.paymentLink) {
        window.location.href = data.data.paymentLink;
      } else {
        toast.error(data.error?.message || 'Failed to initiate payment');
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
        <h1 className="text-3xl font-bold mb-2">Buy Crypto</h1>
        <p className="text-gray-600 mb-8">Convert {currency} to crypto on Conflux Network</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Token Selector */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <label className="block text-sm font-medium mb-4">Select Token</label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowTokenDropdown(!showTokenDropdown)}
                className="w-full flex items-center justify-between p-4 border-2 border-gray-200 rounded-xl hover:border-blue-500 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-teal-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                    {selectedToken.icon}
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-lg">{selectedToken.symbol}</p>
                    <p className="text-sm text-gray-500">{selectedToken.name}</p>
                  </div>
                </div>
                <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${showTokenDropdown ? 'rotate-180' : ''}`} />
              </button>
              
              {showTokenDropdown && (
                <div className="absolute z-10 w-full mt-2 bg-white border rounded-xl shadow-lg overflow-hidden">
                  {TOKENS.map((token) => (
                    <button
                      key={token.symbol}
                      type="button"
                      onClick={() => {
                        setSelectedToken(token);
                        setShowTokenDropdown(false);
                      }}
                      className={`w-full flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors ${
                        selectedToken.symbol === token.symbol ? 'bg-blue-50' : ''
                      }`}
                    >
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-teal-500 rounded-full flex items-center justify-center text-white font-bold">
                        {token.icon}
                      </div>
                      <div className="text-left flex-1">
                        <p className="font-semibold">{token.symbol}</p>
                        <p className="text-sm text-gray-500">{token.name}</p>
                      </div>
                      {selectedToken.symbol === token.symbol && (
                        <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs">✓</span>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Amount Input */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">You Pay</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={amount}
                  onChange={e => setAmount(Number(e.target.value))}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-2xl font-bold focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  min={100}
                  max={1000000}
                />
                <select
                  value={currency}
                  onChange={e => setCurrency(e.target.value)}
                  className="px-4 py-3 border border-gray-300 rounded-lg"
                >
                  {CURRENCIES.map(c => (
                    <option key={c.code} value={c.code}>{c.flag} {c.code}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Rate</span>
                {rateLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                ) : (
                  <span className="font-semibold">1 {selectedToken.symbol} = {rate.toFixed(4)} {currency}</span>
                )}
              </div>
              <div className="flex justify-between items-center mt-2">
                <span className="text-gray-600">Fee (2%)</span>
                <span className="font-semibold">{fee} {currency}</span>
              </div>
              <div className="border-t border-blue-200 mt-2 pt-2 flex justify-between items-center">
                <span className="font-semibold">Total</span>
                <span className="font-bold text-lg">{total} {currency}</span>
              </div>
            </div>
          </div>

          {/* You Receive */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <label className="block text-sm font-medium mb-2">You Receive</label>
            <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-teal-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
                {selectedToken.icon}
              </div>
              <div>
                <p className="text-2xl font-bold text-green-700">{tokenAmount} {selectedToken.symbol}</p>
                <p className="text-sm text-gray-500">{selectedToken.name} on Conflux</p>
              </div>
            </div>
          </div>

          {/* Payment Method */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="font-semibold mb-4">Payment Method</h3>
            <div className="grid gap-3">
              {PAYMENT_METHODS.map(method => (
                <button
                  key={method.id}
                  type="button"
                  onClick={() => setPaymentMethod(method.id)}
                  className={`flex items-center gap-4 p-4 rounded-lg border-2 transition-all ${
                    paymentMethod === method.id ? 'border-blue-600 bg-blue-50' : 'border-gray-200'
                  }`}
                >
                  <method.icon className={`w-6 h-6 ${paymentMethod === method.id ? 'text-blue-600' : 'text-gray-400'}`} />
                  <div className="text-left flex-1">
                    <p className="font-medium">{method.name}</p>
                    <p className="text-sm text-gray-500">{method.countries}</p>
                  </div>
                  {paymentMethod === method.id && (
                    <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Phone Number for M-PESA */}
          {paymentMethod === 'mpesa' && (
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

          {/* Wallet */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="font-semibold mb-4">Your Wallet</h3>
            {isConnected ? (
              <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                <p className="text-sm text-gray-600">Connected wallet:</p>
                <p className="font-mono text-sm break-all">{walletAddress}</p>
              </div>
            ) : (
              <button
                type="button"
                onClick={login}
                className="w-full py-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center justify-center gap-2"
              >
                <Wallet className="w-5 h-5" />
                Login to continue
              </button>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || !isConnected || rateLoading}
            className="w-full py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-lg font-semibold"
          >
            {loading ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> Processing...</>
            ) : !isConnected ? (
              <>Connect Wallet First</>
            ) : (
              <>Buy {tokenAmount} {selectedToken.symbol} <ArrowRight className="w-5 h-5" /></>
            )}
          </button>
        </form>
      </main>
    </div>
  );
}
