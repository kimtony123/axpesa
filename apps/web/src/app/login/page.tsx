'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useWeb3Auth } from '@/hooks/useWeb3Auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ email: '', password: '' });
  const { 
    isConnected, 
    isLoading, 
    isReady, 
    isInitialized, 
    address, 
    login, 
    logout, 
    user 
  } = useWeb3Auth();

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem('axpesa_token', data.data.token);
        localStorage.setItem('axpesa_auth_type', 'email');
        localStorage.setItem('axpesa_merchant', JSON.stringify(data.data.merchant));
        toast.success('Login successful!');
        window.location.href = '/merchant/dashboard';
      } else {
        toast.error(data.error?.message || 'Login failed');
      }
    } catch (err) {
      toast.error('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleWeb3AuthLogin = async () => {
    try {
      await login();
      toast.success('Login successful!');
      window.location.href = '/dashboard';
    } catch (err) {
      toast.error('Login failed');
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logged out');
    } catch (err) {
      toast.error('Logout failed');
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

      <main className="max-w-md mx-auto py-12 px-4">
        <h1 className="text-3xl font-bold mb-2">Welcome Back</h1>
        <p className="text-gray-600 mb-8">Login to your AxPesa account</p>

        <div className="card mb-6 border-2 border-primary/20">
          <h3 className="text-lg font-semibold mb-4 text-center">Social Login</h3>
          
          {isConnected && address ? (
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">✅</span>
              </div>
              {user?.email && (
                <p className="text-gray-600 mb-2">{user.email}</p>
              )}
              <p className="font-mono text-sm bg-gray-100 p-2 rounded mb-4">
                {address.slice(0, 8)}...{address.slice(-6)}
              </p>
              <button
                onClick={handleLogout}
                className="w-full bg-gray-600 text-white py-3 rounded-lg font-semibold hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
              >
                <Loader2 className="w-5 h-5" />
                Logout
              </button>
              <button
                onClick={() => window.location.href = '/dashboard'}
                className="w-full mt-2 bg-primary text-white py-3 rounded-lg font-semibold hover:bg-primary-dark transition-colors"
              >
                Go to Dashboard
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <button
                onClick={handleWeb3AuthLogin}
                disabled={loading || !isInitialized}
                className="w-full bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : '🔐 Sign in with Social Login'}
              </button>
              <p className="text-xs text-gray-500 text-center">Google, Twitter, Discord, GitHub, LinkedIn</p>
            </div>
          )}
        </div>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-gray-50 text-gray-500">Or continue with email</span>
          </div>
        </div>

        <form onSubmit={handleEmailLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">Email</label>
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
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Login'}
          </button>
        </form>

        <p className="text-center mt-6 text-gray-600">
          New user?{' '}
          <Link href="/register" className="text-primary hover:underline">Create account</Link>
        </p>
      </main>
    </div>
  );
}
