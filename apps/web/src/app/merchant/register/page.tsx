'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export default function MerchantRegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    email: '',
    password: '',
    businessName: '',
    businessType: 'retail',
    phoneNumber: '',
    walletAddress: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem('axpesa_token', data.data.token);
        localStorage.setItem('axpesa_merchant', JSON.stringify(data.data.merchant));
        toast.success('Registration successful!');
        router.push('/merchant/dashboard');
      } else {
        toast.error(data.error?.message || 'Registration failed');
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
        <nav className="max-w-7xl mx-auto px-4 py-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">A</span>
            </div>
            <span className="text-2xl font-bold">AxPesa</span>
          </Link>
        </nav>
      </header>

      <main className="max-w-lg mx-auto py-12 px-4">
        <h1 className="text-3xl font-bold mb-2">Merchant Registration</h1>
        <p className="text-gray-600 mb-8">Create your merchant account to start accepting AxCNH</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">Business Email</label>
            <input
              type="email"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              className="input-field"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Password</label>
            <input
              type="password"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              className="input-field"
              minLength={8}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Business Name</label>
            <input
              type="text"
              value={form.businessName}
              onChange={e => setForm({ ...form, businessName: e.target.value })}
              className="input-field"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Business Type</label>
            <select
              value={form.businessType}
              onChange={e => setForm({ ...form, businessType: e.target.value })}
              className="input-field"
            >
              <option value="retail">Retail Shop</option>
              <option value="restaurant">Restaurant/Cafe</option>
              <option value="hotel">Hotel/Hostel</option>
              <option value="services">Services</option>
              <option value="online">Online Store</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Phone Number</label>
            <input
              type="tel"
              value={form.phoneNumber}
              onChange={e => setForm({ ...form, phoneNumber: e.target.value })}
              className="input-field"
              placeholder="254700123456"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Conflux Wallet Address</label>
            <input
              type="text"
              value={form.walletAddress}
              onChange={e => setForm({ ...form, walletAddress: e.target.value })}
              className="input-field font-mono text-sm"
              placeholder="cfx: or 0x..."
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Create Account'}
          </button>
        </form>

        <p className="text-center mt-6 text-gray-600">
          Already have an account? <Link href="/merchant/login" className="text-primary hover:underline">Login</Link>
        </p>
      </main>
    </div>
  );
}
