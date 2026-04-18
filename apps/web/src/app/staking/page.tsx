'use client';

import { useState, useEffect } from 'react';
import { Loader2, TrendingUp, Clock, Shield, AlertCircle } from 'lucide-react';
import { useWalletStore } from '@/lib/walletStore';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

interface Plan {
  id: string;
  name: string;
  apy: number;
  lockPeriod: string;
  minStake: number;
  penalty: number;
  description: string;
}

interface Position {
  id: string;
  plan: string;
  amount: number;
  principal: number;
  startTime: string;
  lastCompoundTime: string;
  isActive: boolean;
}

const PLANS: Plan[] = [
  {
    id: 'flexible',
    name: 'Flexible',
    apy: 5,
    lockPeriod: 'No lock',
    minStake: 5,
    penalty: 0,
    description: 'Earn 5% APY with no lock period. Withdraw anytime.',
  },
  {
    id: '30days',
    name: '30-Day',
    apy: 8,
    lockPeriod: '30 days',
    minStake: 5,
    penalty: 10,
    description: 'Earn 8% APY with a 30-day lock. 10% early unstake penalty.',
  },
  {
    id: '90days',
    name: '90-Day',
    apy: 12,
    lockPeriod: '90 days',
    minStake: 5,
    penalty: 10,
    description: 'Earn 12% APY with a 90-day lock. 10% early unstake penalty.',
  },
];

export default function StakingPage() {
  const { address, isConnected, balances } = useWalletStore();
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [stakeAmount, setStakeAmount] = useState('');
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ totalStaked: 0, totalRewards: 0, rewardPool: 0 });

  useEffect(() => {
    if (isConnected) {
      fetchPositions();
      fetchStats();
    }
  }, [isConnected]);

  const fetchPositions = async () => {
    try {
      const token = localStorage.getItem('axpesa_token');
      const res = await fetch(`${API_URL}/api/staking/positions`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setPositions(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch positions:', err);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch(`${API_URL}/api/staking/stats`);
      const data = await res.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  };

  const handleStake = async () => {
    if (!selectedPlan || !stakeAmount || !address) return;

    const amount = parseFloat(stakeAmount);
    if (amount < selectedPlan.minStake) {
      alert(`Minimum stake is ${selectedPlan.minStake} AxCNH`);
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('axpesa_token');
      const res = await fetch(`${API_URL}/api/staking/stake`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          amount,
          plan: selectedPlan.id,
        }),
      });

      const data = await res.json();
      if (data.success) {
        alert('Stake successful!');
        setStakeAmount('');
        fetchPositions();
        fetchStats();
      } else {
        alert(data.error?.message || 'Stake failed');
      }
    } catch (err) {
      alert('Stake failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleUnstake = async (positionId: string) => {
    if (!confirm('Are you sure you want to unstake?')) return;

    setLoading(true);
    try {
      const token = localStorage.getItem('axpesa_token');
      const res = await fetch(`${API_URL}/api/staking/unstake/${positionId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (data.success) {
        alert(`Unstake successful! Amount: ${data.data.amount} AxCNH${data.data.penalty > 0 ? ` (${data.data.penalty} penalty)` : ''}`);
        fetchPositions();
        fetchStats();
      } else {
        alert(data.error?.message || 'Unstake failed');
      }
    } catch (err) {
      alert('Unstake failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Wallet Not Connected</h2>
          <p className="text-gray-600">Please connect your wallet to access staking.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold mb-2">AxCNH Staking</h1>
        <p className="text-gray-600 mb-8">Earn compound interest on your AxCNH</p>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-blue-600" />
              </div>
              <span className="text-gray-600">Total Staked</span>
            </div>
            <p className="text-2xl font-bold">{stats.totalStaked.toFixed(2)} AxCNH</p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <Shield className="w-5 h-5 text-green-600" />
              </div>
              <span className="text-gray-600">Rewards Earned</span>
            </div>
            <p className="text-2xl font-bold">{stats.totalRewards.toFixed(2)} AxCNH</p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                <Clock className="w-5 h-5 text-purple-600" />
              </div>
              <span className="text-gray-600">Reward Pool</span>
            </div>
            <p className="text-2xl font-bold">{stats.rewardPool.toFixed(2)} AxCNH</p>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              onClick={() => setSelectedPlan(plan)}
              className={`bg-white rounded-xl p-6 shadow-sm cursor-pointer transition-all ${
                selectedPlan?.id === plan.id
                  ? 'ring-2 ring-primary'
                  : 'hover:shadow-md'
              }`}
            >
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold">{plan.name}</h3>
                <span className="text-2xl font-bold text-green-600">{plan.apy}% APY</span>
              </div>
              <p className="text-gray-600 mb-4">{plan.description}</p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Lock Period</span>
                  <span className="font-medium">{plan.lockPeriod}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Min Stake</span>
                  <span className="font-medium">{plan.minStake} AxCNH</span>
                </div>
                {plan.penalty > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Early Penalty</span>
                    <span className="font-medium text-red-500">{plan.penalty}%</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {selectedPlan && (
          <div className="bg-white rounded-xl p-6 shadow-sm mb-8">
            <h2 className="text-xl font-bold mb-4">Stake {selectedPlan.name}</h2>
            <div className="flex gap-4 mb-4">
              <input
                type="number"
                value={stakeAmount}
                onChange={(e) => setStakeAmount(e.target.value)}
                placeholder={`Amount (min ${selectedPlan.minStake})`}
                className="flex-1 px-4 py-3 border rounded-lg"
              />
              <button
                onClick={handleStake}
                disabled={loading || !stakeAmount}
                className="px-6 py-3 bg-primary text-white rounded-lg font-semibold disabled:opacity-50 flex items-center gap-2"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Stake'}
              </button>
            </div>
            <p className="text-sm text-gray-500">
              Your balance: {parseFloat(balances.AXCNH || '0').toFixed(2)} AxCNH
            </p>
          </div>
        )}

        {positions.length > 0 && (
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h2 className="text-xl font-bold mb-4">Your Staking Positions</h2>
            <div className="space-y-4">
              {positions.map((position) => (
                <div
                  key={position.id}
                  className="flex justify-between items-center p-4 bg-gray-50 rounded-lg"
                >
                  <div>
                    <p className="font-semibold">{position.plan}</p>
                    <p className="text-sm text-gray-500">
                      Staked: {position.amount.toFixed(2)} AxCNH
                    </p>
                    <p className="text-xs text-gray-400">
                      Started: {new Date(position.startTime).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={() => handleUnstake(position.id)}
                    disabled={loading}
                    className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 disabled:opacity-50"
                  >
                    Unstake
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
