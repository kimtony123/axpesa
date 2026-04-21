import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { QrCode, Link as LinkIcon, Plus, Copy, Trash2, TrendingUp, Wallet, Receipt, Loader2 } from 'lucide-react';
import { api } from '../../../lib/api';
import './MerchantDashboardPage.css';

export default function MerchantDashboardPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [merchant, setMerchant] = useState(null);
  const [stats, setStats] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [paymentLinks, setPaymentLinks] = useState([]);
  const [showNewLink, setShowNewLink] = useState(false);
  const [newLink, setNewLink] = useState({ amount: '', description: '', currency: 'KES' });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('axpesa_token');
    if (!token) {
      navigate('/merchant-login');
      return;
    }

    api.merchant.getDashboard()
      .then(d => {
        if (d.success) {
          setMerchant(d.data.merchant);
          setStats(d.data.stats);
          setTransactions(d.data.recentTransactions || []);
        } else {
          navigate('/merchant-login');
        }
        setLoading(false);
      })
      .catch(() => {
        navigate('/merchant-login');
        setLoading(false);
      });

    api.merchant.getPaymentLinks()
      .then(d => d.success && setPaymentLinks(d.data || []))
      .catch(() => {});
  }, [navigate]);

  const createPaymentLink = async () => {
    setCreating(true);
    try {
      const data = await api.merchant.createPaymentLink({
        amount: newLink.amount ? Number(newLink.amount) : undefined,
        description: newLink.description || undefined,
        currency: newLink.currency,
      });
      if (data.success) {
        setPaymentLinks([data.data, ...paymentLinks]);
        setShowNewLink(false);
        setNewLink({ amount: '', description: '', currency: 'KES' });
      }
    } catch (err) {}
    setCreating(false);
  };

  const copyLink = (url) => {
    navigator.clipboard.writeText(url);
    alert('Copied!');
  };

  const logout = () => {
    localStorage.removeItem('axpesa_token');
    localStorage.removeItem('axpesa_auth_type');
    localStorage.removeItem('axpesa_merchant');
    navigate('/merchant-login');
  };

  if (loading) {
    return (
      <div className="merchant-page">
        <div className="loading-spinner">
          <Loader2 size={32} className="spinner-lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="merchant-page">
      <header className="merchant-header">
        <div className="merchant-header-content">
          <div className="merchant-brand">
            <div className="merchant-logo">A</div>
            <span className="merchant-title">AxPesa</span>
            <span className="merchant-badge">Merchant</span>
          </div>
          <button onClick={logout} className="logout-btn">Logout</button>
        </div>
      </header>

      <main className="merchant-main">
        <div className="merchant-welcome">
          <h1>Welcome, {merchant?.businessName}</h1>
          <p>{merchant?.walletAddress?.slice(0, 10)}...{merchant?.walletAddress?.slice(-8)}</p>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon green"><TrendingUp size={24} /></div>
            <div><p className="stat-label">Total Volume</p><p className="stat-value">{stats?.totalAxCNH?.toFixed(2) || 0} AxCNH</p></div>
          </div>
          <div className="stat-card">
            <div className="stat-icon blue"><Receipt size={24} /></div>
            <div><p className="stat-label">Transactions</p><p className="stat-value">{stats?.totalTransactions || 0}</p></div>
          </div>
          <div className="stat-card">
            <div className="stat-icon purple"><LinkIcon size={24} /></div>
            <div><p className="stat-label">Active Links</p><p className="stat-value">{stats?.activeLinks || 0}</p></div>
          </div>
        </div>

        <div className="dashboard-grid">
          <div className="dashboard-card">
            <div className="card-header">
              <h2><QrCode size={20} /> Payment Links</h2>
              <button onClick={() => setShowNewLink(true)} className="btn-sm"><Plus size={16} /> New</button>
            </div>

            {showNewLink && (
              <div className="new-link-form">
                <input type="number" placeholder="Amount (optional)" value={newLink.amount} onChange={e => setNewLink({ ...newLink, amount: e.target.value })} className="input" />
                <input type="text" placeholder="Description" value={newLink.description} onChange={e => setNewLink({ ...newLink, description: e.target.value })} className="input" />
                <select value={newLink.currency} onChange={e => setNewLink({ ...newLink, currency: e.target.value })} className="select">
                  <option value="KES">KES</option>
                  <option value="UGX">UGX</option>
                  <option value="NGN">NGN</option>
                  <option value="USD">USD</option>
                </select>
                <div className="form-actions">
                  <button onClick={createPaymentLink} disabled={creating} className="btn btn-primary">{creating ? 'Creating...' : 'Create'}</button>
                  <button onClick={() => setShowNewLink(false)} className="btn btn-secondary">Cancel</button>
                </div>
              </div>
            )}

            <div className="links-list">
              {paymentLinks.length === 0 ? (
                <p className="empty-text">No payment links yet. Create one to get started!</p>
              ) : (
                paymentLinks.map(link => (
                  <div key={link.id} className="link-item">
                    <div>
                      <p className="link-desc">{link.description || 'Payment Link'}</p>
                      <p className="link-info">{link.amount ? `${link.amount} ${link.currency}` : 'Any amount'} • {link.useCount || 0} uses</p>
                    </div>
                    <button onClick={() => copyLink(link.url)} className="icon-btn"><Copy size={16} /></button>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="dashboard-card">
            <div className="card-header">
              <h2><Receipt size={20} /> Recent Transactions</h2>
            </div>
            <div className="tx-list">
              {transactions.length === 0 ? (
                <p className="empty-text">No transactions yet</p>
              ) : (
                transactions.map(tx => (
                  <div key={tx.id} className="tx-item">
                    <div>
                      <p className="tx-amount">{tx.axcnhAmount?.toFixed(2)} AxCNH</p>
                      <p className="tx-info">{tx.fiatCurrency} {tx.fiatAmount?.toFixed(2)}</p>
                    </div>
                    <span className={`tx-status ${tx.status}`}>{tx.status}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="pos-section">
          <h2><QrCode size={20} /> POS Mode</h2>
          <p>Open the mobile app in POS mode to accept payments with QR codes.</p>
          <Link to="/pos" className="btn btn-secondary"><QrCode size={18} /> Open POS Terminal</Link>
        </div>
      </main>
    </div>
  );
}