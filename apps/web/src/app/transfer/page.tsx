'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight, Loader2, Wallet, Send, History, User, Mail, Phone } from 'lucide-react';
import toast from 'react-hot-toast';
import { useWeb3Auth } from '@/hooks/useWeb3Auth';
import { useWalletStore } from '@/lib/walletStore';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

const TOKENS = [
  { symbol: 'AxCNH', name: 'Chinese Yuan', icon: '¥', color: 'red' },
  { symbol: 'USDTO', name: 'US Dollar', icon: '$', color: 'emerald' },
  { symbol: 'BTC', name: 'Bitcoin', icon: '₿', color: 'orange' },
  { symbol: 'ETH', name: 'Ethereum', icon: 'Ξ', color: 'purple' },
];

export default function TransferPage() {
  const { address, isConnected, login, isLoading: authLoading } = useWeb3Auth();
  const { balances } = useWalletStore();
  
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [selectedToken, setSelectedToken] = useState(TOKENS[0]);
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [recipientType, setRecipientType] = useState<'address' | 'email' | 'phone'>('address');
  const [recentTransfers, setRecentTransfers] = useState<any[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  const tokenBalance = parseFloat(balances[selectedToken.symbol] || '0');
  const isValidAmount = parseFloat(amount) > 0 && parseFloat(amount) <= tokenBalance;

  useEffect(() => {
    if (isConnected && address) {
      fetchHistory();
    }
  }, [isConnected, address]);

  useEffect(() => {
    if (recipient.includes('@')) {
      setRecipientType('email');
    } else if (recipient.startsWith('+') || /^\d{10,}$/.test(recipient)) {
      setRecipientType('phone');
    } else {
      setRecipientType('address');
    }
  }, [recipient]);

  const fetchHistory = async () => {
    try {
      const token = localStorage.getItem('axpesa_token');
      const res = await fetch(`${API_URL}/api/transfer/history`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setRecentTransfers(data.data.transactions.slice(0, 5));
      }
    } catch (err) {
      console.error('Failed to fetch history:', err);
    }
  };

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isConnected) {
      toast.error('Please login first');
      return;
    }

    if (!isValidAmount) {
      toast.error('Invalid amount');
      return;
    }

    if (!recipient) {
      toast.error('Please enter recipient');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('axpesa_token');
      const res = await fetch(`${API_URL}/api/transfer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          recipient,
          amount: parseFloat(amount),
          tokenSymbol: selectedToken.symbol,
          note,
        }),
      });
      
      const data = await res.json();
      
      if (data.success) {
        toast.success(`Sent ${amount} ${selectedToken.symbol} successfully!`);
        setAmount('');
        setRecipient('');
        setNote('');
        fetchHistory();
        
        if (data.data.txHash) {
          window.open(`https://evmtestnet.confluxscan.io/tx/${data.data.txHash}`, '_blank');
        }
      } else {
        toast.error(data.error?.message || 'Transfer failed');
      }
    } catch (err) {
      toast.error('Transfer failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatAddress = (addr: string) => {
    if (!addr) return '';
    if (addr.length > 20) {
      return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
    }
    return addr;
  };

  const formatTime = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!isConnected) {
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
          </nav>
        </header>

        <main className="max-w-md mx-auto py-20 px-4 text-center">
          <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Send className="w-10 h-10 text-purple-600" />
          </div>
          <h1 className="text-3xl font-bold mb-4">Send AxCNH</h1>
          <p className="text-gray-600 mb-8">
            Login to send Chinese Yuan stablecoin to friends and family instantly
          </p>
          <button
            onClick={login}
            className="w-full bg-purple-600 text-white py-4 rounded-lg font-semibold hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
          >
            <Wallet className="w-5 h-5" />
            Login to Continue
          </button>
        </main>
      </div>
    );
  }

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
            <Link href="/dashboard" className="text-gray-600 hover:text-purple-600">
              Dashboard
            </Link>
            <button
              onClick={() => setShowHistory(!showHistory)}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                showHistory ? 'bg-purple-100 text-purple-700' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <History className="w-4 h-4" />
              History
            </button>
          </div>
        </nav>
      </header>

      <main className="max-w-lg mx-auto py-12 px-4">
        {showHistory ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold">Transfer History</h1>
              <button
                onClick={() => setShowHistory(false)}
                className="text-purple-600 hover:underline"
              >
                ← Back to Transfer
              </button>
            </div>

            {recentTransfers.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm p-8 text-center">
                <Send className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No transfers yet</p>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                {recentTransfers.map((tx) => (
                  <div key={tx.id} className="p-4 border-b last:border-b-0 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        tx.axcnhAmount > 0 ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'
                      }`}>
                        <ArrowRight className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-semibold">{tx.axcnhAmount.toFixed(4)} {tx.fiatCurrency}</p>
                        <p className="text-sm text-gray-500">{formatAddress(tx.walletAddress)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">{formatTime(tx.createdAt)}</p>
                      <p className={`text-xs font-medium ${tx.status === 'completed' ? 'text-green-600' : 'text-amber-600'}`}>
                        {tx.status}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            <div className="text-center">
              <h1 className="text-2xl font-bold">Send {selectedToken.symbol}</h1>
              <p className="text-gray-500 mt-1">Transfer to anyone, anywhere</p>
            </div>

            <form onSubmit={handleTransfer} className="bg-white rounded-xl shadow-sm p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">Recipient</label>
                <div className="flex gap-2 mb-3">
                  <button
                    type="button"
                    onClick={() => setRecipientType('address')}
                    className={`px-3 py-1 rounded-lg text-sm ${
                      recipientType === 'address' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100'
                    }`}
                  >
                    Address
                  </button>
                  <button
                    type="button"
                    onClick={() => setRecipientType('email')}
                    className={`px-3 py-1 rounded-lg text-sm flex items-center gap-1 ${
                      recipientType === 'email' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100'
                    }`}
                  >
                    <Mail className="w-3 h-3" /> Email
                  </button>
                  <button
                    type="button"
                    onClick={() => setRecipientType('phone')}
                    className={`px-3 py-1 rounded-lg text-sm flex items-center gap-1 ${
                      recipientType === 'phone' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100'
                    }`}
                  >
                    <Phone className="w-3 h-3" /> Phone
                  </button>
                </div>
                <input
                  type={recipientType === 'email' ? 'email' : recipientType === 'phone' ? 'tel' : 'text'}
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  placeholder={
                    recipientType === 'address' 
                      ? '0x... or cfx:...' 
                      : recipientType === 'email'
                      ? 'user@email.com'
                      : '+254700123456'
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg font-mono text-sm"
                  required
                />
                {recipientType !== 'address' && (
                  <p className="text-xs text-gray-500 mt-1">
                    Enter {recipientType === 'email' ? 'email address' : 'phone number'} of an AxPesa user
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Amount</label>
                <div className="flex gap-3">
                  <div className="flex-1 relative">
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg text-2xl font-bold"
                      min="0"
                      max={tokenBalance}
                      step="0.0001"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setAmount(tokenBalance.toString())}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-purple-600 font-medium"
                    >
                      MAX
                    </button>
                  </div>
                  <select
                    value={selectedToken.symbol}
                    onChange={(e) => {
                      const token = TOKENS.find(t => t.symbol === e.target.value);
                      if (token) setSelectedToken(token);
                    }}
                    className="px-4 py-3 border border-gray-300 rounded-lg font-semibold"
                  >
                    {TOKENS.map((token) => (
                      <option key={token.symbol} value={token.symbol}>
                        {token.symbol}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex justify-between text-sm mt-2">
                  <span className="text-gray-500">Available</span>
                  <span className="font-medium">{tokenBalance.toFixed(4)} {selectedToken.symbol}</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Note (optional)</label>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="What's this for?"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                  maxLength={100}
                />
              </div>

              <div className="bg-purple-50 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Transfer Amount</span>
                  <span className="text-xl font-bold text-purple-700">
                    {amount || '0'} {selectedToken.symbol}
                  </span>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !isValidAmount || !recipient}
                className="w-full py-4 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> Sending...</>
                ) : (
                  <><Send className="w-5 h-5" /> Send {selectedToken.symbol}</>
                )}
              </button>
            </form>

            <p className="text-center text-sm text-gray-500">
              Transfers are instant and feeless on Conflux eSpace
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
