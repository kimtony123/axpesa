'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { TrendingUp, Users, Wallet, Lock, Loader2 } from 'lucide-react';

interface StakingStats {
  totalStakedAmount: number;
  totalRewardsDistributed: number;
  rewardPoolBalance: number;
}

export default function StakingStats() {
  const [stats, setStats] = useState<StakingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/api/staking/stats`);
        const data = await res.json();
        if (data.success) {
          setStats(data.data);
        } else {
          setError('Failed to load stats');
        }
      } catch (err) {
        setError('Unable to connect');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error || !stats) {
    return null;
  }

  return (
    <section className="py-12 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold mb-2">AxCNH Staking Rewards</h2>
          <p className="text-white/80">Earn up to 12% APY on your AxCNH tokens</p>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
            <Lock className="w-6 h-6 mx-auto mb-2 text-yellow-300" />
            <p className="text-2xl md:text-3xl font-bold">{stats.totalStakedAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
            <p className="text-sm text-white/70">AxCNH Staked</p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
            <TrendingUp className="w-6 h-6 mx-auto mb-2 text-green-300" />
            <p className="text-2xl md:text-3xl font-bold">{stats.totalRewardsDistributed.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
            <p className="text-sm text-white/70">Rewards Earned</p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
            <Wallet className="w-6 h-6 mx-auto mb-2 text-blue-300" />
            <p className="text-2xl md:text-3xl font-bold">{stats.rewardPoolBalance.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
            <p className="text-sm text-white/70">Reward Pool</p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
            <Users className="w-6 h-6 mx-auto mb-2 text-purple-300" />
            <div className="flex justify-center items-baseline gap-1">
              <span className="text-2xl md:text-3xl font-bold">5-12%</span>
            </div>
            <p className="text-sm text-white/70">APY Available</p>
          </div>
        </div>
        
        <div className="text-center">
          <Link 
            href="/staking" 
            className="inline-flex items-center gap-2 bg-yellow-400 text-gray-900 px-8 py-4 rounded-xl font-bold text-lg hover:bg-yellow-300 transition-all shadow-lg"
          >
            <TrendingUp className="w-5 h-5" />
            Start Staking Now
          </Link>
        </div>
      </div>
    </section>
  );
}
