'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Loader2, Droplet, CheckCircle, Clock, AlertCircle, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';
import { useWeb3Auth } from '@/hooks/useWeb3Auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
const FAUCET_AMOUNT = 100;

export default function FaucetPage() {
  const { address, isConnected, login } = useWeb3Auth();
  const [loading, setLoading] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [status, setStatus] = useState<{
    canClaim: boolean;
    timeUntilNextClaim: number;
    faucetBalance: number;
  }>({
    canClaim: false,
    timeUntilNextClaim: 0,
    faucetBalance: 0,
  });

  useEffect(() => {
    if (address) {
      checkFaucetStatus();
    } else {
      setCheckingStatus(false);
    }
  }, [address]);

  const checkFaucetStatus = async () => {
    if (!address) return;
    
    try {
      const res = await fetch(`${API_URL}/api/faucet/status/${address}`);
      const data = await res.json();
      if (data.success) {
        setStatus(data.data);
      }
    } catch (error) {
      console.error('Failed to check faucet status:', error);
    } finally {
      setCheckingStatus(false);
    }
  };

  const handleClaim = async () => {
    if (!isConnected || !address) {
      toast.error('Please connect your wallet first');
      return;
    }

    if (!status.canClaim) {
      toast.error('Please wait before claiming again');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/faucet/claim`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress: address }),
      });
      
      const data = await res.json();
      
      if (data.success) {
        toast.success(`🎉 Claimed ${FAUCET_AMOUNT} AxCNH!`);
        // Open transaction in explorer
        if (data.data.txHash) {
          window.open(`https://evmtestnet.confluxscan.org/tx/${data.data.txHash}`, '_blank');
        }
        checkFaucetStatus();
      } else {
        toast.error(data.error?.message || 'Failed to claim');
      }
    } catch (error) {
      toast.error('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} minutes`;
    }
    const hours = Math.floor(minutes / 60);
    return `${hours} hour${hours > 1 ? 's' : ''}`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <nav className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">A</span>
            </div>
            <span className="text-2xl font-bold">AxPesa</span>
          </Link>
          <Link href="/" className="text-gray-600 hover:text-blue-600">
            ← Back to Home
          </Link>
        </nav>
      </header>

      <main className="max-w-2xl mx-auto py-12 px-4">
        <div className="text-center mb-12">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Droplet className="w-10 h-10 text-blue-600" />
          </div>
          <h1 className="text-4xl font-bold mb-4">AxCNH Faucet</h1>
          <p className="text-gray-600 text-lg">
            Get free AxCNH tokens to test the AxPesa platform on Conflux eSpace Testnet.
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          {!isConnected ? (
            <div className="text-center">
              <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Connect Your Wallet</h2>
              <p className="text-gray-600 mb-6">
                Login to claim free AxCNH tokens.
              </p>
              <button
                onClick={login}
                className="px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors"
              >
                Login
              </button>
            </div>
          ) : checkingStatus ? (
            <div className="text-center">
              <Loader2 className="w-12 h-12 text-blue-600 mx-auto mb-4 animate-spin" />
              <p className="text-gray-600">Checking faucet status...</p>
            </div>
          ) : (
            <>
              <div className="bg-gradient-to-r from-blue-50 to-teal-50 rounded-xl p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-gray-600">Your Wallet</span>
                  <span className="font-mono text-sm bg-white px-3 py-1 rounded-lg">
                    {address?.slice(0, 6)}...{address?.slice(-4)}
                  </span>
                </div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-gray-600">Faucet Balance</span>
                  <span className="font-semibold text-lg">
                    {status.faucetBalance.toFixed(2)} AxCNH
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Claim Amount</span>
                  <span className="font-semibold text-lg text-blue-600">
                    {FAUCET_AMOUNT} AxCNH
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                {status.canClaim ? (
                  <button
                    onClick={handleClaim}
                    disabled={loading}
                    className="w-full py-4 bg-gradient-to-r from-blue-600 to-teal-600 text-white rounded-xl font-bold text-lg hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Droplet className="w-5 h-5" />
                        Claim {FAUCET_AMOUNT} AxCNH
                      </>
                    )}
                  </button>
                ) : (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center">
                    <Clock className="w-10 h-10 text-amber-500 mx-auto mb-2" />
                    <p className="text-amber-700 font-semibold mb-2">
                      Cooldown Active
                    </p>
                    <p className="text-amber-600">
                      Please wait {formatTime(status.timeUntilNextClaim)} before claiming again.
                    </p>
                  </div>
                )}

                <button
                  onClick={checkFaucetStatus}
                  className="w-full py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors text-sm"
                >
                  Refresh Status
                </button>
              </div>
            </>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-500" />
            How the Faucet Works
          </h3>
          <ul className="space-y-3 text-gray-600">
            <li className="flex gap-3">
              <span className="w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0">1</span>
              <span>Login with your social account (must be on Conflux eSpace Testnet)</span>
            </li>
            <li className="flex gap-3">
              <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0">2</span>
              <span>Click the claim button to receive {FAUCET_AMOUNT} AxCNH</span>
            </li>
            <li className="flex gap-3">
              <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0">3</span>
              <span>Tokens are sent from our faucet vault to your wallet</span>
            </li>
            <li className="flex gap-3">
              <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0">4</span>
              <span>Wait 1 hour before claiming again (anti-abuse protection)</span>
            </li>
          </ul>
        </div>

        <div className="mt-8 text-center text-sm text-gray-500">
          <p>This faucet is for testing purposes only on Conflux eSpace Testnet.</p>
          <p className="mt-2">
            <a 
              href="https://evmtestnet.confluxscan.org" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline inline-flex items-center gap-1"
            >
              View on ConfluxScan <ExternalLink className="w-3 h-3" />
            </a>
          </p>
        </div>
      </main>
    </div>
  );
}
