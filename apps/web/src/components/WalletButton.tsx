'use client';

import { useState } from 'react';
import { useWeb3Auth } from '@/hooks/useWeb3Auth';
import { Wallet, LogOut, Copy, Check, User } from 'lucide-react';

export default function WalletButton() {
  const { address, isConnected, isLoading, login, logout, user } = useWeb3Auth();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (address) {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  if (isLoading) {
    return (
      <button
        disabled
        className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg"
      >
        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
        Connecting...
      </button>
    );
  }

  if (isConnected && address) {
    return (
      <div className="flex items-center gap-2">
        {user?.email && (
          <span className="hidden md:inline-flex items-center gap-1 px-3 py-1 text-sm text-gray-600 bg-gray-100 rounded-full">
            <User className="w-3 h-3" />
            {user.email}
          </span>
        )}
        <button
          onClick={handleCopy}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
          title="Click to copy address"
        >
          {copied ? <Check className="w-4 h-4" /> : <Wallet className="w-4 h-4" />}
          {formatAddress(address)}
        </button>
        <button
          onClick={logout}
          className="p-2 text-gray-600 hover:text-red-600 transition"
          title="Logout"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={login}
      className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
    >
      <Wallet className="w-4 h-4" />
      Login
    </button>
  );
}
