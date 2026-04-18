'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useWalletStore } from '@/lib/walletStore';
import WalletButton from './WalletButton';

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const { isConnected } = useWalletStore();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={`bg-white shadow-sm sticky top-0 z-50 transition-shadow ${scrolled ? 'shadow-md' : ''}`}>
      <nav className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xl">A</span>
          </div>
          <span className="text-2xl font-bold text-gray-900">AxPesa</span>
        </Link>
        
        <div className="flex items-center gap-4">
          <Link href="/buy" className="text-gray-600 hover:text-blue-600 transition-colors hidden sm:block">Buy AxCNH</Link>
          <Link href="/sell" className="text-gray-600 hover:text-blue-600 transition-colors hidden sm:block">Sell AxCNH</Link>
          <Link href="/staking" className="text-gray-600 hover:text-blue-600 transition-colors hidden sm:block">Stake AxCNH</Link>
          <Link href="/merchant" className="text-gray-600 hover:text-blue-600 transition-colors hidden sm:block">For Merchants</Link>
          
          {isConnected ? (
            <Link href="/dashboard" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
              Dashboard
            </Link>
          ) : (
            <>
              <Link href="/login" className="px-4 py-2 text-blue-600 hover:text-blue-700 transition hidden sm:block">
                Login
              </Link>
              <WalletButton />
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
