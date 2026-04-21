import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { LineChart, Wallet, TrendingUp, Shield, Clock, Loader2 } from 'lucide-react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import useWalletStore from '../../lib/walletStore';
import { api } from '../../lib/api';
import './StakingPage.css';

const PLANS = [
  { id: 'flexible', name: 'Flexible', apy: 5, lockPeriod: 'No lock', minStake: 5, penalty: 0, description: 'Earn 5% APY with no lock period. Withdraw anytime.' },
  { id: '30days', name: '30-Day', apy: 8, lockPeriod: '30 days', minStake: 5, penalty: 10, description: 'Earn 8% APY with a 30-day lock. 10% early unstake penalty.' },
  { id: '90days', name: '90-Day', apy: 12, lockPeriod: '90 days', minStake: 5, penalty: 10, description: 'Earn 12% APY with a 90-day lock. 10% early unstake penalty.' },
];

export default function StakingPage() {
  const { address, isConnected, balances } = useWalletStore();
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [stakeAmount, setStakeAmount] = useState('');
  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ totalStaked: 0, totalRewards: 0, rewardPool: 0 });

  useEffect(() => {
    if (isConnected && address) {
      fetchPositions();
      fetchStats();
    }
  }, [isConnected, address]);

  const fetchPositions = async () => {
    try {
      const data = await api.staking.getPositions(address);
      if (data.success) setPositions(data.data || []);
    } catch (err) { console.error('Failed to fetch positions:', err); }
  };

  const fetchStats = async () => {
    try {
      const data = await api.staking.getStats();
      if (data.success) setStats(data.data || { totalStaked: 0, totalRewards: 0, rewardPool: 0 });
    } catch (err) { console.error('Failed to fetch stats:', err); }
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
      const data = await api.staking.stake({ address, amount, plan: selectedPlan.id });
      if (data.success) {
        alert('Stake successful!');
        setStakeAmount('');
        fetchPositions();
        fetchStats();
      } else {
        alert(data.error?.message || 'Stake failed');
      }
    } catch (err) { alert('Stake failed. Please try again.'); }
    finally { setLoading(false); }
  };

  const handleUnstake = async (positionId) => {
    if (!confirm('Are you sure you want to unstake?')) return;
    setLoading(true);
    try {
      const data = await api.staking.unstake(positionId);
      if (data.success) {
        alert(`Unstake successful! Amount: ${data.data?.amount || 0} AxCNH`);
        fetchPositions();
        fetchStats();
      } else {
        alert(data.error?.message || 'Unstake failed');
      }
    } catch (err) { alert('Unstake failed. Please try again.'); }
    finally { setLoading(false); }
  };

  if (!isConnected) {
    return (
      <div className="page-layout">
        <Navbar />
        <main className="page-container">
          <div className="card" style={{ textAlign: 'center', maxWidth: '400px' }}>
            <div className="auth-icon" style={{ margin: '0 auto 1rem' }}>
              <Wallet size={48} />
            </div>
            <h2 style={{ marginBottom: '1rem' }}>Connect Wallet First</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Please connect your wallet to access staking.</p>
            <Link to="/login" className="btn btn-primary">Connect Wallet</Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="page-layout">
      <Navbar />
      <main className="page-container">
        <h1 className="page-title">AxCNH Staking</h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Earn compound interest on your AxCNH</p>

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon"><TrendingUp size={20} /></div>
            <p className="stat-label">Total Staked</p>
            <p className="stat-value">{stats.totalStaked?.toFixed(2) || '0.00'} AxCNH</p>
          </div>
          <div className="stat-card">
            <div className="stat-icon"><Shield size={20} /></div>
            <p className="stat-label">Rewards Earned</p>
            <p className="stat-value">{stats.totalRewards?.toFixed(2) || '0.00'} AxCNH</p>
          </div>
          <div className="stat-card">
            <div className="stat-icon"><Clock size={20} /></div>
            <p className="stat-label">Reward Pool</p>
            <p className="stat-value">{stats.rewardPool?.toFixed(2) || '0.00'} AxCNH</p>
          </div>
        </div>

        <h2 className="section-title">Staking Plans</h2>
        <div className="plans-grid">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              onClick={() => setSelectedPlan(plan)}
              className={`plan-card ${selectedPlan?.id === plan.id ? 'selected' : ''}`}
            >
              <div className="plan-header">
                <h3>{plan.name}</h3>
                <span className="plan-apy">{plan.apy}% APY</span>
              </div>
              <p className="plan-desc">{plan.description}</p>
              <div className="plan-details">
                <div><span>Lock Period</span><span>{plan.lockPeriod}</span></div>
                <div><span>Min Stake</span><span>{plan.minStake} AxCNH</span></div>
                {plan.penalty > 0 && <div><span>Early Penalty</span><span className="penalty">{plan.penalty}%</span></div>}
              </div>
            </div>
          ))}
        </div>

        {selectedPlan && (
          <div className="stake-form">
            <h2>Stake {selectedPlan.name}</h2>
            <div className="form-row">
              <input
                type="number"
                value={stakeAmount}
                onChange={(e) => setStakeAmount(e.target.value)}
                placeholder={`Amount (min ${selectedPlan.minStake})`}
                className="input"
              />
              <button onClick={handleStake} disabled={loading || !stakeAmount} className="btn btn-primary">
                {loading ? <><Loader2 size={20} className="spinner" /> Processing...</> : 'Stake'}
              </button>
            </div>
            <p className="balance-text">Your balance: {parseFloat(balances.AxCNH || '0').toFixed(2)} AxCNH</p>
          </div>
        )}

        {positions.length > 0 && (
          <div className="positions-section">
            <h2 className="section-title">Your Staking Positions</h2>
            <div className="positions-list">
              {positions.map((position) => (
                <div key={position.id} className="position-card">
                  <div>
                    <p className="position-plan">{position.plan}</p>
                    <p className="position-amount">Staked: {position.amount?.toFixed(2) || '0.00'} AxCNH</p>
                    <p className="position-date">Started: {new Date(position.startTime).toLocaleDateString()}</p>
                  </div>
                  <button onClick={() => handleUnstake(position.id)} disabled={loading} className="btn btn-danger">
                    Unstake
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}