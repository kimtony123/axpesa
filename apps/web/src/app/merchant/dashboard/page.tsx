'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { QrCode, Link as LinkIcon, Plus, Copy, Trash2, TrendingUp, Wallet, Receipt } from 'lucide-react';
import toast from 'react-hot-toast';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export default function MerchantDashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [merchant, setMerchant] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [paymentLinks, setPaymentLinks] = useState<any[]>([]);
  const [showNewLink, setShowNewLink] = useState(false);
  const [newLink, setNewLink] = useState({ amount: '', description: '' });

  useEffect(() => {
    const token = localStorage.getItem('axpesa_token');
    if (!token) {
      router.push('/merchant/login');
      return;
    }

    fetch(`${API_URL}/api/merchant/dashboard`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(d => {
        if (d.success) {
          setMerchant(d.data.merchant);
          setStats(d.data.stats);
          setTransactions(d.data.recentTransactions);
        } else {
          router.push('/merchant/login');
        }
        setLoading(false);
      })
      .catch(() => {
        toast.error('Failed to load dashboard');
        setLoading(false);
      });

    fetch(`${API_URL}/api/merchant/payment-links`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(d => d.success && setPaymentLinks(d.data))
      .catch(() => {});
  }, [router]);

  const createPaymentLink = async () => {
    const token = localStorage.getItem('axpesa_token');
    try {
      const res = await fetch(`${API_URL}/api/merchant/payment-link`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          amount: newLink.amount ? Number(newLink.amount) : undefined,
          description: newLink.description || undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Payment link created!');
        setPaymentLinks([data.data, ...paymentLinks]);
        setShowNewLink(false);
        setNewLink({ amount: '', description: '' });
      }
    } catch (err) {
      toast.error('Failed to create link');
    }
  };

  const copyLink = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success('Copied!');
  };

  const logout = () => {
    localStorage.removeItem('axpesa_token');
    localStorage.removeItem('axpesa_merchant');
    router.push('/merchant/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <nav className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">A</span>
            </div>
            <span className="text-2xl font-bold">AxPesa</span>
            <span className="ml-2 px-3 py-1 bg-primary/10 text-primary text-sm rounded-full font-medium">Merchant</span>
          </div>
          <button onClick={logout} className="text-gray-600 hover:text-red-500">Logout</button>
        </nav>
      </header>

      <main className="max-w-7xl mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-2xl font-bold">Welcome, {merchant?.businessName}</h1>
          <p className="text-gray-600">{merchant?.walletAddress?.slice(0, 10)}...{merchant?.walletAddress?.slice(-8)}</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="card">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Volume</p>
                <p className="text-2xl font-bold">{stats?.totalAxCNH?.toFixed(2) || 0} AxCNH</p>
              </div>
            </div>
          </div>
          <div className="card">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Receipt className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Transactions</p>
                <p className="text-2xl font-bold">{stats?.totalTransactions || 0}</p>
              </div>
            </div>
          </div>
          <div className="card">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <LinkIcon className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Active Links</p>
                <p className="text-2xl font-bold">{stats?.activeLinks || 0}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <QrCode className="w-5 h-5" /> Payment Links
              </h2>
              <button
                onClick={() => setShowNewLink(true)}
                className="btn-primary text-sm flex items-center gap-1"
              >
                <Plus className="w-4 h-4" /> New Link
              </button>
            </div>

            {showNewLink && (
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <input
                  type="number"
                  placeholder="Amount (optional)"
                  value={newLink.amount}
                  onChange={e => setNewLink({ ...newLink, amount: e.target.value })}
                  className="input-field mb-2"
                />
                <input
                  type="text"
                  placeholder="Description"
                  value={newLink.description}
                  onChange={e => setNewLink({ ...newLink, description: e.target.value })}
                  className="input-field mb-3"
                />
                <div className="flex gap-2">
                  <button onClick={createPaymentLink} className="btn-primary text-sm">Create</button>
                  <button onClick={() => setShowNewLink(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg">Cancel</button>
                </div>
              </div>
            )}

            <div className="space-y-3">
              {paymentLinks.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No payment links yet. Create one to get started!</p>
              ) : (
                paymentLinks.map(link => (
                  <div key={link.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">{link.description || 'Payment Link'}</p>
                      <p className="text-sm text-gray-500">
                        {link.amount ? `${link.amount} ${link.currency}` : 'Any amount'} • {link.useCount} uses
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => copyLink(link.url)} className="p-2 hover:bg-gray-200 rounded-lg">
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="card">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Receipt className="w-5 h-5" /> Recent Transactions
            </h2>
            <div className="space-y-3">
              {transactions.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No transactions yet</p>
              ) : (
                transactions.map(tx => (
                  <div key={tx.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">{tx.axcnhAmount.toFixed(4)} AxCNH</p>
                      <p className="text-sm text-gray-500">{tx.fiatCurrency} {tx.fiatAmount.toFixed(2)}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      tx.status === 'completed' ? 'bg-green-100 text-green-700' :
                      tx.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {tx.status}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="card mt-8">
          <h2 className="text-xl font-bold mb-4">POS Mode</h2>
          <p className="text-gray-600 mb-4">Open the mobile app in POS mode to accept payments with QR codes.</p>
          <Link href="/pos" className="btn-secondary inline-flex items-center gap-2">
            <QrCode className="w-4 h-4" /> Open POS Terminal
          </Link>
        </div>
      </main>
    </div>
  );
}
