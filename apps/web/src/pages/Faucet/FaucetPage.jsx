import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Droplet, Wallet } from 'lucide-react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import useWalletStore from '../../lib/walletStore';
import './FaucetPage.css';

export default function FaucetPage() {
  const { address, isConnected } = useWalletStore();
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [status, setStatus] = useState({ canClaim: false, timeUntilNextClaim: 0, faucetBalance: 0 });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (address && isConnected) { checkStatus(); } else { setChecking(false); }
  }, [address, isConnected]);

  const checkStatus = async () => {
    if (!address) return;
    setChecking(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8080'}/api/faucet/status/${address}`);
      const data = await res.json();
      if (data.success) { setStatus(data.data); }
      else if (data.error?.code === 'NO_RECENT_CLAIM') { setStatus({ canClaim: true, timeUntilNextClaim: 0, faucetBalance: 100 }); }
      else { setStatus({ canClaim: true, timeUntilNextClaim: 0, faucetBalance: 100 }); }
    } catch { setStatus({ canClaim: true, timeUntilNextClaim: 0, faucetBalance: 100 }); }
    setChecking(false);
  };

  const handleClaim = async () => {
    if (!address || !status.canClaim) return;
    setLoading(true); setError(''); setSuccess('');
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8080'}/api/faucet/claim`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress: address }),
      });
      const data = await res.json();
      if (data.success) { setSuccess('Claimed 100 AxCNH!'); if (data.data.txHash) window.open(`https://evmtestnet.confluxscan.org/tx/${data.data.txHash}`, '_blank'); checkStatus(); }
      else { setError(data.error?.message || 'Failed to claim'); }
    } catch { setError('Network error.'); }
    setLoading(false);
  };

  if (!isConnected) {
    return (
      <div className="page-layout">
        <Navbar />
        <main className="auth-page"><div className="auth-card"><div className="auth-icon"><Wallet size={40} /></div><h1>Connect Wallet First</h1><p>Connect your wallet to claim test tokens</p><Link to="/login" className="btn-primary">Connect Wallet</Link></div></main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="page-layout">
      <Navbar />
      <main className="page-container">
        <h1 className="page-title">Faucet</h1>
        <div className="form-card">
          <p className="info-text">Get free test AxCNH tokens. One-time claim only per wallet.</p>
          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}
          <div className="balance-display"><span className="balance-label">Faucet Balance</span><span className="balance-value">{status.faucetBalance.toFixed(2)} AxCNH</span></div>
          {checking ? <p className="loading-text">Checking status...</p> : status.canClaim ? <button className="btn-primary" onClick={handleClaim} disabled={loading}>{loading ? <><span className="spinner"></span> Claiming...</> : 'Claim 100 AxCNH'}</button> : <button className="btn-disabled" disabled>Already Claimed</button>}
        </div>
      </main>
      <Footer />
    </div>
  );
}