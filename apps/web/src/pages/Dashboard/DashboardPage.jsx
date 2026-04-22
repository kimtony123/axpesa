import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Wallet, CreditCard, Coins, ArrowUpRight, ArrowDownLeft, LineChart, Copy, Check, Droplets, History, Store, Settings, RefreshCw } from 'lucide-react';
import useWalletStore from '../../lib/walletStore';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { getApiUrl } from '../../lib/api';
import './DashboardPage.css';

function getAuthHeaders() {
  const token = localStorage.getItem('axpesa_token');
  if (token) {
    return { Authorization: `Bearer ${token}` };
  }
  return {};
}

export default function DashboardPage() {
  const { address, isConnected } = useWalletStore();
  const [copied, setCopied] = useState(false);
  const [balances, setBalances] = useState({ AxCNH: '0', CFX: '0', USD: '0' });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [recentTxs, setRecentTxs] = useState([]);

  const refreshData = () => {
    if (!address) return;
    setRefreshing(true);
    const authHeaders = getAuthHeaders();
    Promise.all([
      fetch(`${getApiUrl()}/api/wallet/balances?address=${address}`, { headers: authHeaders }).then(r => r.json()),
      fetch(`${getApiUrl()}/api/transactions/by-address?address=${address}`).then(r => r.json())
    ]).then(([balData, txData]) => {
      if (balData.success && balData.data) {
        setBalances({
          AxCNH: balData.data.AxCNH || '0',
          CFX: balData.data.CFX || '0',
          USD: balData.data.USD || '0'
        });
      }
      if (txData.success && txData.data) {
        setRecentTxs(txData.data.slice(0, 5));
      }
    }).catch((err) => {
      console.error('Dashboard refresh error:', err);
    })
    .finally(() => setRefreshing(false));
  };

  useEffect(() => {
    if (address) {
      setLoading(true);
      const authHeaders = getAuthHeaders();
      Promise.all([
        fetch(`${getApiUrl()}/api/wallet/balances?address=${address}`, { headers: authHeaders }).then(r => r.json()),
        fetch(`${getApiUrl()}/api/transactions/by-address?address=${address}`).then(r => r.json())
      ]).then(([balData, txData]) => {
        console.log('Balance data:', balData);
        console.log('Transaction data:', txData);
        if (balData.success && balData.data) {
          setBalances({
            AxCNH: balData.data.AxCNH || '0',
            CFX: balData.data.CFX || '0',
            USD: balData.data.USD || '0'
          });
        }
        if (txData.success && txData.data) {
          setRecentTxs(txData.data.slice(0, 5));
        }
      }).catch((err) => {
        console.error('Dashboard fetch error:', err);
      })
      .finally(() => setLoading(false));
    }
  }, [address]);

  const copyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const quickActions = [
    { icon: CreditCard, label: 'Buy', path: '/buy', color: 'buy' },
    { icon: Coins, label: 'Sell', path: '/sell', color: 'sell' },
    { icon: ArrowUpRight, label: 'Transfer', path: '/transfer', color: 'transfer' },
    { icon: LineChart, label: 'Staking', path: '/staking', color: 'staking' },
    { icon: Droplets, label: 'Faucet', path: '/faucet', color: 'faucet' },
    { icon: History, label: 'Transactions', path: '/transactions', color: 'transactions' },
    { icon: Store, label: 'Merchant', path: '/merchant', color: 'merchant' },
    { icon: Settings, label: 'Settings', path: '/settings', color: 'settings' },
  ];

const formatDate = (dateStr) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const formatTxType = (type) => {
  const labels = {
    onramp: 'Buy',
    offramp: 'Sell',
    transfer: 'Transfer',
    faucet: 'Faucet',
    staking: 'Staking',
  };
  return labels[type] || type;
};

  if (!isConnected || !address) {
    return (
      <>
        <Navbar />
        <div className="dashboard-page">
          <div className="dashboard-content">
            <div className="dashboard-connect">
              <div className="dashboard-connect-icon">
                <Wallet size={40} />
              </div>
              <h2>Connect Your Wallet</h2>
              <p>Please connect your wallet to view your dashboard</p>
              <Link to="/login" className="btn btn-primary">Connect Wallet</Link>
            </div>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="dashboard-page">
        <div className="dashboard-content">
          <div className="dashboard-header">
            <h1>Dashboard</h1>
          </div>

          {/* Quick Actions */}
          <section className="quick-actions-section">
            <div className="section-header">
              <h2 className="section-title">Quick Actions</h2>
            </div>
            <div className="quick-actions-grid">
              {quickActions.map((action, i) => (
                <Link key={i} to={action.path} className="action-card">
                  <div className={`action-icon ${action.color}`}>
                    <action.icon size={24} />
                  </div>
                  <span className="action-label">{action.label}</span>
                </Link>
              ))}
            </div>
          </section>

          {/* Balances */}
          <section className="balances-section">
            <div className="section-header">
              <h2 className="section-title">Balances</h2>
              <button onClick={refreshData} className="refresh-btn" disabled={refreshing} title="Refresh">
                <RefreshCw size={18} className={refreshing ? 'spinner' : ''} />
              </button>
            </div>
            <div className="balances-grid">
              <div className="balance-card main">
                <p className="balance-label">AxCNH Balance</p>
                <p className="balance-value">{loading ? '...' : parseFloat(balances.AxCNH).toFixed(2)} AxCNH</p>
                <p className="balance-sub">≈ ${loading ? '...' : parseFloat(balances.USD).toFixed(2)} USD</p>
              </div>
              <div className="balance-card">
                <p className="balance-label">CFX Balance</p>
                <p className="balance-value">{loading ? '...' : parseFloat(balances.CFX).toFixed(2)} CFX</p>
                <p className="balance-sub">Token for network fees</p>
              </div>
              <div className="balance-card">
                <p className="balance-label">Wallet Address</p>
                <div className="address-row">
                  <code>{address.slice(0, 6)}...{address.slice(-4)}</code>
                  <button onClick={copyAddress} className="copy-btn">
                    {copied ? <Check size={16} /> : <Copy size={16} />}
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* Transactions */}
          <section className="transactions-section">
            <div className="section-header">
              <h2 className="section-title">Recent Transactions</h2>
              <Link to="/transactions" className="view-all-btn">View All →</Link>
            </div>
            {loading ? (
              <div className="dashboard-loading">Loading...</div>
            ) : recentTxs.length === 0 ? (
              <div className="tx-table-container">
                <div className="empty-tx">No transactions yet</div>
              </div>
            ) : (
              <div className="tx-table-container">
                <table className="tx-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Type</th>
                      <th>Status</th>
                      <th>Amount (Fiat)</th>
                      <th>Token Amount</th>
                      <th>Transaction ID</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentTxs.map((tx, i) => (
                      <tr key={i}>
                        <td className="tx-date">{formatDate(tx.createdAt)}</td>
                        <td>
                          <span className={`tx-type-badge ${tx.type}`}>{formatTxType(tx.type)}</span>
                        </td>
                        <td>
                          <span className={`tx-status-badge ${tx.status}`}>{tx.status}</span>
                        </td>
                        <td>{parseFloat(tx.fiatAmount || 0).toFixed(2)} {tx.fiatCurrency}</td>
                        <td>{tx.axcnhAmount ? `${parseFloat(tx.axcnhAmount).toFixed(2)} AxCNH` : '-'}</td>
                        <td>
                          <span className="tx-hash" title={tx.txHash || tx.id}>
                            {tx.txHash ? `${tx.txHash.slice(0, 10)}...${tx.txHash.slice(-6)}` : 
                             tx.id ? `${tx.id.slice(0, 10)}...${tx.id.slice(-6)}` : '-'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      </div>
      <Footer />
    </>
  );
}